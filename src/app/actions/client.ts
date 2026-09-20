'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/get-current-user';
import { getDbPool } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { clientSchema } from '@/lib/validations/client';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface ActionResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Common security check and rate limiter for client actions
 * 30 actions per user per 10 minutes
 */
async function authorizeAndRateLimit() {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  const limit = await rateLimit({
    key: `client_action:user:${user.id}`,
    limit: 30,
    windowSeconds: 10 * 60,
  });

  if (!limit.allowed) {
    throw new Error(
      `Rate limit exceeded. You can perform 30 client actions per 10 minutes. Please wait ${limit.retryAfterSeconds} seconds.`
    );
  }

  return user;
}

/**
 * CREATE CLIENT
 */
export async function createClient(rawInput: unknown): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await authorizeAndRateLimit();

    const parsed = clientSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid client data.',
      };
    }

    const { name, email, phone } = parsed.data;
    const pool = getDbPool();

    // Check for duplicate (user_id, email)
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM clients WHERE user_id = ? AND email = ? LIMIT 1',
      [user.id, email]
    );

    if (existing.length > 0) {
      return {
        success: false,
        error: 'You already added a client with this email.',
      };
    }

    const clientId = uuidv4();
    await pool.query(
      `INSERT INTO clients (id, user_id, name, email, phone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [clientId, user.id, name, email, phone || null]
    );

    revalidatePath('/clients');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'Client added successfully!',
      data: { id: clientId },
    };
  } catch (err: any) {
    if (err?.message === 'Unauthorized') {
      return { success: false, error: 'You must be logged in to perform this action.' };
    }
    if (err?.message?.startsWith('Rate limit exceeded')) {
      return { success: false, error: err.message };
    }
    if (err?.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'You already added a client with this email.' };
    }
    console.error('Create Client Error:', err);
    return { success: false, error: 'An error occurred while creating the client. Please try again.' };
  }
}

/**
 * UPDATE CLIENT
 * Strictly filters by ID AND user_id to prevent IDOR
 */
export async function updateClient(
  clientId: string,
  rawInput: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await authorizeAndRateLimit();

    const parsed = clientSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid client data.',
      };
    }

    const { name, email, phone } = parsed.data;
    const pool = getDbPool();

    // Check ownership
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM clients WHERE id = ? AND user_id = ?',
      [clientId, user.id]
    );

    if (existing.length === 0) {
      return { success: false, error: 'Client not found.' };
    }

    // Check for email collision with other clients belonging to this user
    const [dup] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM clients WHERE user_id = ? AND email = ? AND id != ? LIMIT 1',
      [user.id, email, clientId]
    );

    if (dup.length > 0) {
      return {
        success: false,
        error: 'You already added another client with this email.',
      };
    }

    const [updateResult] = await pool.query<ResultSetHeader>(
      `UPDATE clients
       SET name = ?, email = ?, phone = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [name, email, phone || null, clientId, user.id]
    );

    if (updateResult.affectedRows === 0) {
      return { success: false, error: 'Client not found.' };
    }

    revalidatePath('/clients');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'Client updated successfully!',
      data: { id: clientId },
    };
  } catch (err: any) {
    if (err?.message === 'Unauthorized') {
      return { success: false, error: 'You must be logged in to perform this action.' };
    }
    if (err?.message?.startsWith('Rate limit exceeded')) {
      return { success: false, error: err.message };
    }
    if (err?.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'You already added a client with this email.' };
    }
    console.error('Update Client Error:', err);
    return { success: false, error: 'An error occurred while updating the client.' };
  }
}

/**
 * DELETE CLIENT
 * Verifies invoice association and user ownership before deletion
 */
export async function deleteClient(clientId: string): Promise<ActionResponse> {
  try {
    const user = await authorizeAndRateLimit();
    const pool = getDbPool();

    // 1. Verify existence & ownership
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM clients WHERE id = ? AND user_id = ?',
      [clientId, user.id]
    );

    if (existing.length === 0) {
      return { success: false, error: 'Client not found.' };
    }

    // 2. Check if client has linked invoices
    const [invRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM invoices WHERE client_id = ? AND user_id = ?',
      [clientId, user.id]
    );

    const invoiceCount = Number(invRows[0]?.count || 0);
    if (invoiceCount > 0) {
      return {
        success: false,
        error: 'This client has invoices and cannot be deleted.',
      };
    }

    // 3. Delete client
    const [delResult] = await pool.query<ResultSetHeader>(
      'DELETE FROM clients WHERE id = ? AND user_id = ?',
      [clientId, user.id]
    );

    if (delResult.affectedRows === 0) {
      return { success: false, error: 'Client not found.' };
    }

    revalidatePath('/clients');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'Client deleted successfully.',
    };
  } catch (err: any) {
    if (err?.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized.' };
    }
    if (err?.message?.startsWith('Rate limit exceeded')) {
      return { success: false, error: err.message };
    }
    if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
      return {
        success: false,
        error: 'This client has invoices and cannot be deleted.',
      };
    }
    console.error('Delete Client Error:', err);
    return { success: false, error: 'Failed to delete client.' };
  }
}
