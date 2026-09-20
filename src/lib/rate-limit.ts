import { v4 as uuidv4 } from 'uuid';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface RateLimitRow extends RowDataPacket {
  id: string;
  key: string;
  count: number;
  window_start: Date;
  expires_at: Date;
}

/**
 * Atomic database-backed rate limiter (works across serverless & multiple pods)
 */
export async function rateLimit({
  key,
  limit,
  windowSeconds,
}: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const pool = getDbPool();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  // Clean expired row for this key if it exists
  await pool.query(
    'DELETE FROM rate_limits WHERE `key` = ? AND expires_at <= ?',
    [key, now]
  );

  // Atomic insert or increment count
  const id = uuidv4();
  await pool.query(
    `INSERT INTO rate_limits (id, \`key\`, count, window_start, expires_at)
     VALUES (?, ?, 1, ?, ?)
     ON DUPLICATE KEY UPDATE
       count = count + 1`,
    [id, key, now, expiresAt]
  );

  const [rows] = await pool.query<RateLimitRow[]>(
    'SELECT count, expires_at FROM rate_limits WHERE `key` = ?',
    [key]
  );

  const current = rows[0];
  if (!current) {
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  const remaining = Math.max(0, limit - current.count);
  const diffMs = new Date(current.expires_at).getTime() - Date.now();
  const retryAfterSeconds = Math.max(1, Math.ceil(diffMs / 1000));

  return {
    allowed: current.count <= limit,
    remaining,
    retryAfterSeconds,
  };
}

/**
 * Maintenance cleanup routine for expired tokens & rate limit records
 */
export async function cleanupExpiredRecords(): Promise<{
  deletedRateLimits: number;
  deletedResetTokens: number;
}> {
  const pool = getDbPool();
  const now = new Date();

  const [rlRes] = await pool.query<ResultSetHeader>(
    'DELETE FROM rate_limits WHERE expires_at <= ?',
    [now]
  );

  const [tokRes] = await pool.query<ResultSetHeader>(
    'DELETE FROM password_reset_tokens WHERE expires_at <= ? OR used_at IS NOT NULL',
    [now]
  );

  return {
    deletedRateLimits: rlRes.affectedRows,
    deletedResetTokens: tokRes.affectedRows,
  };
}
