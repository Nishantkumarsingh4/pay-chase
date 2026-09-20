import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDbPool } from '@/lib/db';
import { signupSchema } from '@/lib/validations/auth';
import { rateLimit } from '@/lib/rate-limit';
import { logAuthEvent } from '@/lib/audit';
import { getClientIp, getUserAgent } from '@/lib/request';
import type { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: string;
}

export async function POST(req: Request) {
  const ip = await getClientIp();
  const userAgent = await getUserAgent();

  try {
    // 1. Rate Limiting: 5 signups per hour per IP
    const limit = await rateLimit({
      key: `signup:ip:${ip}`,
      limit: 5,
      windowSeconds: 3600,
    });
    if (!limit.allowed) {
      await logAuthEvent({
        type: 'RATE_LIMITED',
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Too many accounts created from this network. Please try again in ${limit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Honeypot check: silently accept bots without executing
    if (body.honeypot && body.honeypot.trim() !== '') {
      return NextResponse.json({
        success: true,
        message: 'Account created successfully.',
      });
    }

    // 3. Server-side Zod validation
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue?.message || 'Invalid input data',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const pool = getDbPool();

    // 4. Check for existing email
    const [existing] = await pool.query<UserRow[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      // Return clear message for UX tradeoff, while rate-limiting protects against bulk scraping
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email address already exists. Please log in instead.',
        },
        { status: 409 }
      );
    }

    // 5. Hash password with bcrypt (cost 12)
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // 6. Insert user (safely catching unique constraint race condition)
    try {
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [userId, name, email, passwordHash]
      );
    } catch (dbErr: any) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          {
            success: false,
            error: 'An account with this email address already exists. Please log in instead.',
          },
          { status: 409 }
        );
      }
      throw dbErr;
    }

    // 7. Audit log
    await logAuthEvent({
      userId,
      type: 'SIGNUP',
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
    });
  } catch (err: any) {
    console.error('[SIGNUP_ERROR]', err);
    return NextResponse.json(
      {
        success: false,
        error: 'A server error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
