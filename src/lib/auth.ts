import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDbPool } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { logAuthEvent } from '@/lib/audit';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Pre-computed dummy bcrypt hash (cost 12) for constant-time comparison when email is not found
const DUMMY_HASH = '$2a$12$e8Y5t1hK1.1o9w8W0r/n7eXm6zH4yD3f2G1j0l9k8m7n6b5v4c3x2';

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  failed_login_count: number;
  locked_until: Date | null;
  token_version: number;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        ip: { label: 'IP', type: 'text' },
        userAgent: { label: 'User Agent', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid email or password');
        }

        const email = credentials.email.trim().toLowerCase();
        const clientIp = credentials.ip || '127.0.0.1';
        const userAgent = credentials.userAgent || 'Unknown';
        const pool = getDbPool();

        // 1. IP rate limit: 20 attempts per 15 min
        const ipLimit = await rateLimit({
          key: `login:ip:${clientIp}`,
          limit: 20,
          windowSeconds: 15 * 60,
        });
        if (!ipLimit.allowed) {
          await logAuthEvent({
            type: 'RATE_LIMITED',
            ip: clientIp,
            userAgent,
          });
          throw new Error(`Too many attempts from this IP. Please wait ${ipLimit.retryAfterSeconds} seconds.`);
        }

        // 2. IP+Email rate limit: 5 attempts per 15 min
        const pairLimit = await rateLimit({
          key: `login:ip_email:${clientIp}:${email}`,
          limit: 5,
          windowSeconds: 15 * 60,
        });
        if (!pairLimit.allowed) {
          await logAuthEvent({
            type: 'RATE_LIMITED',
            ip: clientIp,
            userAgent,
          });
          throw new Error(`Too many login attempts for this account. Please wait ${pairLimit.retryAfterSeconds} seconds.`);
        }

        // 3. Fetch user
        const [users] = await pool.query<UserRow[]>(
          'SELECT id, name, email, password_hash, failed_login_count, locked_until, token_version FROM users WHERE email = ?',
          [email]
        );
        const user = users[0];

        // If user not found, perform dummy bcrypt compare to prevent timing enumeration
        if (!user) {
          await bcrypt.compare(credentials.password, DUMMY_HASH);
          await logAuthEvent({
            type: 'LOGIN_FAILED',
            ip: clientIp,
            userAgent,
          });
          throw new Error('Invalid email or password');
        }

        // 4. Account lockout check
        const now = new Date();
        if (user.locked_until && new Date(user.locked_until) > now) {
          const diffMinutes = Math.ceil(
            (new Date(user.locked_until).getTime() - now.getTime()) / (60 * 1000)
          );
          await logAuthEvent({
            userId: user.id,
            type: 'ACCOUNT_LOCKED',
            ip: clientIp,
            userAgent,
          });
          throw new Error(`Account locked due to consecutive failures. Try again in ${diffMinutes} minutes.`);
        }

        // 5. Verify password
        const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash);
        if (!passwordMatch) {
          const newFailedCount = user.failed_login_count + 1;
          const willLock = newFailedCount >= 5;
          const lockTime = willLock ? new Date(now.getTime() + 15 * 60 * 1000) : null;

          await pool.query<ResultSetHeader>(
            `UPDATE users 
             SET failed_login_count = ?, locked_until = ?
             WHERE id = ?`,
            [newFailedCount, lockTime, user.id]
          );

          await logAuthEvent({
            userId: user.id,
            type: willLock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
            ip: clientIp,
            userAgent,
          });

          if (willLock) {
            throw new Error('Too many failed attempts. Account locked for 15 minutes.');
          }
          throw new Error('Invalid email or password');
        }

        // 6. Reset failed count and record login time
        await pool.query<ResultSetHeader>(
          `UPDATE users 
           SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW()
           WHERE id = ?`,
          [user.id]
        );

        await logAuthEvent({
          userId: user.id,
          type: 'LOGIN_SUCCESS',
          ip: clientIp,
          userAgent,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          tokenVersion: user.token_version,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.tokenVersion = (user as any).tokenVersion;
      }

      // Check if tokenVersion matches DB on subsequent checks
      if (token.id) {
        const pool = getDbPool();
        const [rows] = await pool.query<UserRow[]>(
          'SELECT token_version FROM users WHERE id = ?',
          [token.id]
        );
        const currentUser = rows[0];
        if (!currentUser || currentUser.token_version !== token.tokenVersion) {
          // Token invalidated by password change/reset
          return {};
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.id) {
        // Return empty session to signal unauthenticated
        return null as any;
      }
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).name = token.name;
        (session.user as any).email = token.email;
        (session.user as any).tokenVersion = token.tokenVersion;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
