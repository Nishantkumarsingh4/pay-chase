import { v4 as uuidv4 } from 'uuid';
import { getDbPool } from '@/lib/db';

export type AuthEventType =
  | 'SIGNUP'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'ACCOUNT_LOCKED'
  | 'RATE_LIMITED';

export async function logAuthEvent({
  userId,
  type,
  ip,
  userAgent,
}: {
  userId?: string | null;
  type: AuthEventType;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const pool = getDbPool();
    const id = uuidv4();
    await pool.query(
      `INSERT INTO auth_events (id, user_id, type, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, userId || null, type, ip || null, userAgent ? userAgent.slice(0, 255) : null]
    );
  } catch (error) {
    // Audit logging failure should not crash the main flow, but log server-side
    console.error('[AUTH_AUDIT_LOG_ERROR]', error);
  }
}
