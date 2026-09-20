import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDbPool } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { rateLimit } from '@/lib/rate-limit';
import { logAuthEvent } from '@/lib/audit';
import { generateResetToken, sendPasswordResetEmail } from '@/lib/mailer';
import { getClientIp, getUserAgent } from '@/lib/request';
import type { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
}

export async function POST(req: Request) {
  const ip = await getClientIp();
  const userAgent = await getUserAgent();

  // Consistent message regardless of whether the email exists
  const GENERIC_RESPONSE = {
    success: true,
    message: 'If an account exists for this email, we have sent a password reset link.',
  };

  try {
    const body = await req.json();

    // 1. Honeypot check: silently succeed for bots
    if (body.honeypot && body.honeypot.trim() !== '') {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid email address',
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // 2. Rate Limits:
    // 10 per hour per IP
    const ipLimit = await rateLimit({
      key: `forgot:ip:${ip}`,
      limit: 10,
      windowSeconds: 3600,
    });
    if (!ipLimit.allowed) {
      await logAuthEvent({ type: 'RATE_LIMITED', ip, userAgent });
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset requests from this network. Please wait ${ipLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // 3 per hour per email
    const emailLimit = await rateLimit({
      key: `forgot:email:${email}`,
      limit: 3,
      windowSeconds: 3600,
    });
    if (!emailLimit.allowed) {
      await logAuthEvent({ type: 'RATE_LIMITED', ip, userAgent });
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset requests for this email. Please wait ${emailLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const pool = getDbPool();

    // 3. Lookup user
    const [users] = await pool.query<UserRow[]>(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email]
    );
    const user = users[0];

    // If user does not exist, return generic message immediately (prevent user enumeration)
    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // 4. Invalidate previous unused reset tokens for this user
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL',
      [user.id]
    );

    // 5. Generate secure token: store only SHA-256 hash in DB, send raw token in email
    const { rawToken, tokenHash } = generateResetToken();
    const tokenId = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry

    await pool.query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [tokenId, user.id, tokenHash, expiresAt]
    );

    // 6. Send email via Resend
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    await logAuthEvent({
      userId: user.id,
      type: 'PASSWORD_RESET_REQUESTED',
      ip,
      userAgent,
    });

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (err) {
    console.error('[FORGOT_PASSWORD_ERROR]', err);
    // Still return the generic response to prevent error-based enumeration
    return NextResponse.json(GENERIC_RESPONSE);
  }
}
