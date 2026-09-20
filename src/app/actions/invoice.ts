'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getDbPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/get-current-user';
import { rateLimit } from '@/lib/rate-limit';
import { logAuthEvent } from '@/lib/audit';
import { getClientIp, getUserAgent } from '@/lib/request';
import {
  invoiceFormSchema,
  type InvoiceFormInput,
} from '@/lib/validations/invoice';
import {
  calculateTotal,
  generateInvoiceNumber,
  computeInvoiceStatus,
  formatInvoiceAmount,
} from '@/lib/invoice';
import { sendInvoiceEmail } from '@/lib/mailer';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface ClientRow extends RowDataPacket {
  id: string;
  name: string;
}

interface InvoiceRow extends RowDataPacket {
  id: string;
  user_id: string;
  client_id: string;
  number: string;
  currency: string;
  total: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  due_date: Date;
}

/**
 * Common security check and rate limiter for invoice mutations
 */
async function authorizeAndRateLimit() {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  // 30 invoice actions per user per 10 minutes
  const limit = await rateLimit({
    key: `invoice_action:user:${user.id}`,
    limit: 30,
    windowSeconds: 10 * 60,
  });

  if (!limit.allowed) {
    throw new Error(
      `Rate limit exceeded. You can perform 30 invoice actions per 10 minutes. Please wait ${limit.retryAfterSeconds} seconds.`
    );
  }

  return user;
}

/**
 * CREATE INVOICE
 */
export async function createInvoice(rawInput: InvoiceFormInput) {
  const user = await authorizeAndRateLimit();
  const parsed = invoiceFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { clientId, currency, issueDate, dueDate, notes, items } = parsed.data;
  const pool = getDbPool();

  // 1. Verify that the client belongs to the authenticated user
  const [clientRows] = await pool.query<ClientRow[]>(
    'SELECT id, name FROM clients WHERE id = ? AND user_id = ?',
    [clientId, user.id]
  );
  if (clientRows.length === 0) {
    return { success: false, error: 'Selected client not found or does not belong to you' };
  }

  // 2. Recalculate total on the server using Decimal.js (never trust client total)
  const serverTotal = calculateTotal(items);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 3. Atomically generate user invoice number (e.g. INV-0001) inside the transaction
    const invoiceNumber = await generateInvoiceNumber(conn, user.id);
    const invoiceId = uuidv4();

    // 4. Insert Invoice record
    await conn.query(
      `INSERT INTO invoices (
        id, user_id, client_id, number, currency, total,
        issue_date, due_date, status, notes, reminders_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, TRUE, NOW(), NOW())`,
      [
        invoiceId,
        user.id,
        clientId,
        invoiceNumber,
        currency,
        serverTotal,
        new Date(issueDate),
        new Date(dueDate),
        notes ? notes.slice(0, 1000) : null,
      ]
    );

    // 5. Insert Line Items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemId = uuidv4();
      await conn.query(
        `INSERT INTO invoice_items (
          id, invoice_id, description, qty, price, position
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, invoiceId, item.description.slice(0, 200), item.qty, item.price, i]
      );
    }

    await conn.commit();

    // 6. Automatically dispatch invoice email to client upon issuing
    let emailSent = false;
    try {
      const [clientRows] = await pool.query<RowDataPacket[]>(
        'SELECT name, email FROM clients WHERE id = ? AND user_id = ?',
        [clientId, user.id]
      );
      if (clientRows.length > 0) {
        const client = clientRows[0];
        const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';
        const viewUrl = `${appUrl}/pay/${invoiceId}`;

        const formattedDueDate = new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
        }).format(new Date(dueDate));

        const formattedTotal = formatInvoiceAmount(serverTotal, currency);

        const res = await sendInvoiceEmail({
          to: client.email,
          clientName: client.name,
          senderName: user.name,
          senderEmail: user.email,
          invoiceNumber,
          currency,
          total: formattedTotal,
          dueDate: formattedDueDate,
          viewUrl,
          notes: notes || undefined,
        });

        if (res) {
          emailSent = true;
          await pool.query('UPDATE invoices SET sent_at = NOW() WHERE id = ?', [invoiceId]);
          const eventId = uuidv4();
          await pool.query(
            `INSERT INTO reminders (id, invoice_id, user_id, tone, channel, recipient_email, subject, message_body, sent_at, status)
             VALUES (?, ?, ?, 'POLITE', 'EMAIL', ?, ?, ?, NOW(), 'SENT')`,
            [
              eventId,
              invoiceId,
              user.id,
              client.email,
              `Invoice ${invoiceNumber} Issued & Sent`,
              `Official invoice with payment link dispatched to ${client.email}`,
            ]
          );
        }
      }
    } catch (mailErr) {
      console.error('[AUTO_DISPATCH_INVOICE_EMAIL_ERROR]', mailErr);
    }


    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    return { success: true, invoiceId, invoiceNumber, emailSent };
  } catch (err: any) {
    await conn.rollback();
    console.error('[CREATE_INVOICE_ERROR]', err);
    return { success: false, error: 'Failed to create invoice. Please try again.' };
  } finally {
    conn.release();
  }
}


/**
 * UPDATE INVOICE
 */
export async function updateInvoice(invoiceId: string, rawInput: InvoiceFormInput) {
  const user = await authorizeAndRateLimit();
  const parsed = invoiceFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { clientId, currency, issueDate, dueDate, notes, items } = parsed.data;
  const pool = getDbPool();

  // 1. Verify client ownership
  const [clientRows] = await pool.query<ClientRow[]>(
    'SELECT id FROM clients WHERE id = ? AND user_id = ?',
    [clientId, user.id]
  );
  if (clientRows.length === 0) {
    return { success: false, error: 'Selected client not found or does not belong to you' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 2. Verify invoice ownership & editable status (only PENDING or OVERDUE)
    const [invRows] = await conn.query<InvoiceRow[]>(
      'SELECT id, status FROM invoices WHERE id = ? AND user_id = ? FOR UPDATE',
      [invoiceId, user.id]
    );
    const invoice = invRows[0];
    if (!invoice) {
      await conn.rollback();
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      await conn.rollback();
      return {
        success: false,
        error: `Cannot edit this invoice because it is already marked as ${invoice.status.toLowerCase()}.`,
      };
    }

    // 3. Server recalculation of total
    const serverTotal = calculateTotal(items);

    // 4. Update Invoice
    await conn.query(
      `UPDATE invoices
       SET client_id = ?, currency = ?, total = ?, issue_date = ?, due_date = ?, notes = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [
        clientId,
        currency,
        serverTotal,
        new Date(issueDate),
        new Date(dueDate),
        notes ? notes.slice(0, 1000) : null,
        invoiceId,
        user.id,
      ]
    );

    // 5. Replace items
    await conn.query('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemId = uuidv4();
      await conn.query(
        `INSERT INTO invoice_items (id, invoice_id, description, qty, price, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, invoiceId, item.description.slice(0, 200), item.qty, item.price, i]
      );
    }

    await conn.commit();

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    await conn.rollback();
    console.error('[UPDATE_INVOICE_ERROR]', err);
    return { success: false, error: 'Failed to update invoice.' };
  } finally {
    conn.release();
  }
}

/**
 * MARK INVOICE AS PAID (MANUAL)
 */
export async function markInvoiceAsPaid(invoiceId: string) {
  const user = await authorizeAndRateLimit();
  const pool = getDbPool();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [invRows] = await conn.query<InvoiceRow[]>(
      'SELECT id, total, status FROM invoices WHERE id = ? AND user_id = ? FOR UPDATE',
      [invoiceId, user.id]
    );
    const invoice = invRows[0];

    if (!invoice) {
      await conn.rollback();
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.status === 'PAID') {
      await conn.rollback();
      return { success: false, error: 'This invoice is already marked as paid' };
    }

    if (invoice.status === 'CANCELLED') {
      await conn.rollback();
      return { success: false, error: 'Cancelled invoices cannot be marked as paid' };
    }

    // 1. Update invoice status to PAID and set paid_at
    await conn.query(
      `UPDATE invoices 
       SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [invoiceId, user.id]
    );

    // 2. Create Payment record with unique transaction ID
    const paymentId = uuidv4();
    const txnId = `manual_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    await conn.query(
      `INSERT INTO payments (id, invoice_id, gateway, txn_id, amount, paid_at)
       VALUES (?, ?, 'MANUAL', ?, ?, NOW())`,
      [paymentId, invoiceId, txnId, invoice.total]
    );

    await conn.commit();

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    await conn.rollback();
    console.error('[MARK_AS_PAID_ERROR]', err);
    return { success: false, error: 'Failed to mark invoice as paid.' };
  } finally {
    conn.release();
  }
}

/**
 * CANCEL INVOICE
 */
export async function cancelInvoice(invoiceId: string) {
  const user = await authorizeAndRateLimit();
  const pool = getDbPool();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [invRows] = await conn.query<InvoiceRow[]>(
      'SELECT id, status FROM invoices WHERE id = ? AND user_id = ? FOR UPDATE',
      [invoiceId, user.id]
    );
    const invoice = invRows[0];

    if (!invoice) {
      await conn.rollback();
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.status === 'PAID') {
      await conn.rollback();
      return { success: false, error: 'Paid invoices cannot be cancelled' };
    }

    if (invoice.status === 'CANCELLED') {
      await conn.rollback();
      return { success: false, error: 'Invoice is already cancelled' };
    }

    await conn.query(
      `UPDATE invoices 
       SET status = 'CANCELLED', updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [invoiceId, user.id]
    );

    await conn.commit();

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    await conn.rollback();
    console.error('[CANCEL_INVOICE_ERROR]', err);
    return { success: false, error: 'Failed to cancel invoice.' };
  } finally {
    conn.release();
  }
}

/**
 * DELETE CLIENT WITH INVOICE PROTECTION
 */
export async function deleteClientSafe(clientId: string) {
  const user = await authorizeAndRateLimit();
  const pool = getDbPool();

  // Check if client has any existing invoices
  const [invRows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM invoices WHERE client_id = ? AND user_id = ?',
    [clientId, user.id]
  );

  const invoiceCount = invRows[0]?.count || 0;
  if (invoiceCount > 0) {
    return {
      success: false,
      error: `This client cannot be deleted because they have ${invoiceCount} linked invoice(s). Cancel or remove invoices first.`,
    };
  }

  try {
    const [res] = await pool.query<ResultSetHeader>(
      'DELETE FROM clients WHERE id = ? AND user_id = ?',
      [clientId, user.id]
    );
    if (res.affectedRows === 0) {
      return { success: false, error: 'Client not found' };
    }

    revalidatePath('/clients');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    // Safety net for database RESTRICT constraint
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return {
        success: false,
        error: 'This client cannot be deleted because they have linked invoices.',
      };
    }
    console.error('[DELETE_CLIENT_ERROR]', err);
    return { success: false, error: 'Failed to delete client.' };
  }
}

/**
 * SEND INVOICE EMAIL TO CLIENT
 */
export async function sendInvoiceEmailAction(invoiceId: string) {
  try {
    const user = await authorizeAndRateLimit();
    const pool = getDbPool();

    // 1. Fetch invoice, client, and owner info
    const [invRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         i.id, i.number, i.currency, i.total, i.due_date, i.notes,
         c.name as client_name, c.email as client_email,
         u.name as user_name, u.email as user_email
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       JOIN users u ON i.user_id = u.id
       WHERE i.id = ? AND i.user_id = ?`,
      [invoiceId, user.id]
    );

    if (invRows.length === 0) {
      return { success: false, error: 'Invoice not found.' };
    }

    const inv = invRows[0];
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const viewUrl = `${appUrl}/pay/${inv.id}`;

    const formattedDueDate = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(new Date(inv.due_date));

    const formattedTotal = formatInvoiceAmount(inv.total, inv.currency);

    // 2. Send email via Nodemailer
    const emailSent = await sendInvoiceEmail({
      to: inv.client_email,
      clientName: inv.client_name,
      senderName: inv.user_name,
      senderEmail: inv.user_email,
      invoiceNumber: inv.number,
      currency: inv.currency,
      total: formattedTotal,
      dueDate: formattedDueDate,
      viewUrl,
      notes: inv.notes,
    });

    if (!emailSent) {
      return {
        success: false,
        error: 'Failed to dispatch email. Please check your SMTP settings in .env.local.',
      };
    }

    // 3. Mark sent_at in database
    await pool.query(
      'UPDATE invoices SET sent_at = NOW() WHERE id = ? AND user_id = ?',
      [invoiceId, user.id]
    );

    const eventId = uuidv4();
    await pool.query(
      `INSERT INTO reminders (id, invoice_id, user_id, tone, channel, recipient_email, subject, message_body, sent_at, status)
       VALUES (?, ?, ?, 'POLITE', 'EMAIL', ?, ?, ?, NOW(), 'SENT')`,
      [
        eventId,
        invoiceId,
        user.id,
        inv.client_email,
        `Invoice ${inv.number} Dispatched`,
        `Invoice email sent to ${inv.client_email}`,
      ]
    );

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/invoices');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: `Invoice successfully sent to ${inv.client_email}!`,
    };

  } catch (err: any) {
    console.error('[SEND_INVOICE_EMAIL_ERROR]', err);
    return { success: false, error: err.message || 'Failed to send invoice email.' };
  }
}

/**
 * SEND MANUAL REMINDER (Polite, Firm, or Final)
 */
export async function sendInvoiceReminderAction(
  invoiceId: string,
  forcedTone?: 'POLITE' | 'FIRM' | 'FINAL'
) {
  try {
    const user = await authorizeAndRateLimit();
    const { sendInvoiceReminder } = await import('@/lib/reminder-service');

    const result = await sendInvoiceReminder({
      invoiceId,
      userId: user.id,
      forcedTone,
    });

    if (result.success) {
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath('/invoices');
      revalidatePath('/dashboard');
      return { success: true, message: result.message };
    } else {
      return { success: false, error: result.message };
    }
  } catch (err: any) {
    console.error('[SEND_INVOICE_REMINDER_ERROR]', err);
    return { success: false, error: err.message || 'Failed to send reminder.' };
  }
}

/**
 * TOGGLE REMINDERS FOR INVOICE
 */
export async function toggleRemindersAction(invoiceId: string, enabled: boolean) {
  try {
    const user = await authorizeAndRateLimit();
    const pool = getDbPool();

    await pool.query(
      'UPDATE invoices SET reminders_enabled = ? WHERE id = ? AND user_id = ?',
      [enabled ? 1 : 0, invoiceId, user.id]
    );

    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, enabled };
  } catch (err: any) {
    console.error('[TOGGLE_REMINDERS_ERROR]', err);
    return { success: false, error: err.message || 'Failed to toggle reminders.' };
  }
}

/**
 * GET WHATSAPP DEEP LINK FOR ONE-CLICK SHARING
 */
export async function getInvoiceWhatsAppUrlAction(
  invoiceId: string,
  forcedTone?: 'POLITE' | 'FIRM' | 'FINAL'
): Promise<{ success: boolean; url?: string; error?: string }> {

  try {
    const user = await authorizeAndRateLimit();
    const { getInvoiceWhatsAppUrl } = await import('@/lib/reminder-service');

    return await getInvoiceWhatsAppUrl({
      invoiceId,
      userId: user.id,
      forcedTone,
    });
  } catch (err: any) {
    console.error('[GET_WHATSAPP_URL_ERROR]', err);
    return { success: false, error: err.message || 'Failed to generate WhatsApp link' };
  }
}


