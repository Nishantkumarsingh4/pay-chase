import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDbPool } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { rateLimit } from '@/lib/rate-limit';
import { logAuthEvent } from '@/lib/audit';
import { hashToken, sendPasswordChangedNotification } from '@/lib/mailer';
import { getClientIp, getUserAgent } from '@/lib/request';
import type { RowDataPacket } from 'mysql2';

interface ResetTokenRow extends RowDataPacket {
  id: string;
  user_id: string;
  expires_at: Date;
  used_at: Date | null;
  user_name: string;
  user_email: string;
}

// 1. Validate token route (called on /reset-password page load)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Reset token is missing' },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(token);
  const pool = getDbPool();

  const [rows] = await pool.query<ResetTokenRow[]>(
    `SELECT t.id, t.user_id, t.expires_at, t.used_at, u.name as user_name, u.email as user_email
     FROM password_reset_tokens t
     JOIN users u ON t.user_id = u.id
     WHERE t.token_hash = ?`,
    [tokenHash]
  );

  const resetRecord = rows[0];
  if (!resetRecord) {
    return NextResponse.json(
      { valid: false, error: 'Invalid or expired password reset link' },
      { status: 400 }
    );
  }

  if (resetRecord.used_at !== null) {
    return NextResponse.json(
      { valid: false, error: 'This password reset link has already been used' },
      { status: 400 }
    );
  }

  if (new Date(resetRecord.expires_at) < new Date()) {
    return NextResponse.json(
      { valid: false, error: 'This password reset link has expired' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    email: resetRecord.user_email,
  });
}

// 2. Submit new password
export async function POST(req: Request) {
  const ip = await getClientIp();
  const userAgent = await getUserAgent();

  try {
    // Rate limit: 10 attempts per hour per IP
    const limit = await rateLimit({
      key: `reset_submit:ip:${ip}`,
      limit: 10,
      windowSeconds: 3600,
    });
    if (!limit.allowed) {
      await logAuthEvent({ type: 'RATE_LIMITED', ip, userAgent });
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset attempts. Please wait ${limit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid input',
        },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);
    const pool = getDbPool();

    // Start connection for transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Find token and lock row
      const [tokenRows] = await conn.query<ResetTokenRow[]>(
        `SELECT t.id, t.user_id, t.expires_at, t.used_at, u.name as user_name, u.email as user_email
         FROM password_reset_tokens t
         JOIN users u ON t.user_id = u.id
         WHERE t.token_hash = ?
         FOR UPDATE`,
        [tokenHash]
      );

      const record = tokenRows[0];
      if (!record || record.used_at !== null || new Date(record.expires_at) < new Date()) {
        await conn.rollback();
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid, expired, or already used password reset link. Please request a new one.',
          },
          { status: 400 }
        );
      }

      // Hash new password (cost 12)
      const newHash = await bcrypt.hash(password, 12);

      // 1. Update user password, increment token_version (invalidating active sessions), reset lockout
      await conn.query(
        `UPDATE users 
         SET password_hash = ?, 
             token_version = token_version + 1, 
             failed_login_count = 0, 
             locked_until = NULL, 
             updated_at = NOW()
         WHERE id = ?`,
        [newHash, record.user_id]
      );

      // 2. Mark this token as used
      await conn.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
        [record.id]
      );

      await conn.commit();

      // 3. Send notification email & log audit event
      await sendPasswordChangedNotification({
        to: record.user_email,
        name: record.user_name,
      });

      await logAuthEvent({
        userId: record.user_id,
        type: 'PASSWORD_RESET_COMPLETED',
        ip,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: 'Your password has been changed successfully. You can now log in.',
      });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('[RESET_PASSWORD_ERROR]', err);
    return NextResponse.json(
      {
        success: false,
        error: 'A server error occurred. Please request a new reset link.',
      },
      { status: 500 }
    );
  }
}
