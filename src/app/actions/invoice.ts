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

    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    return { success: true, invoiceId, invoiceNumber };
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

/**
 * PROCESS PUBLIC CLIENT PAYMENT
 * Enables client on `/pay/[id]` to pay their invoice directly.
 * Automatically marks invoice as PAID, records payment transaction,
 * disables further chaser reminders, and revalidates paths.
 */
export async function processPublicPayment(
  invoiceId: string,
  paymentMethod: string = 'CHECKOUT'
): Promise<{ success: boolean; error?: string; txnId?: string }> {
  try {
    const pool = getDbPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [invRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, total, status, reminders_enabled 
         FROM invoices 
         WHERE id = ? FOR UPDATE`,
        [invoiceId]
      );
      const invoice = invRows[0];

      if (!invoice) {
        await conn.rollback();
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === 'PAID') {
        await conn.rollback();
        return { success: false, error: 'Invoice is already paid' };
      }

      if (invoice.status === 'CANCELLED') {
        await conn.rollback();
        return { success: false, error: 'Cancelled invoices cannot be paid' };
      }

      // Generate payment transaction ID
      const paymentId = uuidv4();
      const txnId = `pay_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

      // 1. Mark invoice as PAID, record paid timestamp, disable chasing reminders
      await conn.query(
        `UPDATE invoices 
         SET status = 'PAID', 
             paid_at = NOW(), 
             reminders_enabled = 0,
             updated_at = NOW()
         WHERE id = ?`,
        [invoiceId]
      );

      // 2. Insert into payments table
      await conn.query(
        `INSERT INTO payments (id, invoice_id, gateway, txn_id, amount, paid_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [paymentId, invoiceId, paymentMethod.toUpperCase(), txnId, invoice.total]
      );

      await conn.commit();

      // Revalidate public pay page and dashboard/invoices paths
      revalidatePath(`/pay/${invoiceId}`);
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath('/invoices');
      revalidatePath('/dashboard');

      return { success: true, txnId };
    } catch (err: any) {
      await conn.rollback();
      console.error('[PROCESS_PUBLIC_PAYMENT_TRANSACTION_ERROR]', err);
      return { success: false, error: err.message || 'Payment processing failed.' };
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error('[PROCESS_PUBLIC_PAYMENT_ERROR]', error);
    return { success: false, error: error.message || 'Network error processing payment.' };
  }
}

/**
 * CREATE RAZORPAY ORDER
 * Creates an official Razorpay order for the invoice
 */
export async function createRazorpayOrder(invoiceId: string): Promise<{
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  error?: string;
}> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, total, currency, status FROM invoices WHERE id = ?`,
      [invoiceId]
    );
    const invoice = rows[0];

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.status === 'PAID') {
      return { success: false, error: 'Invoice is already paid' };
    }

    const { getRazorpayClient } = await import('@/lib/razorpay');
    const razorpay = getRazorpayClient();

    // If Razorpay keys are not provided yet in env, indicate fallback
    if (!razorpay) {
      return {
        success: false,
        error: 'RAZORPAY_NOT_CONFIGURED',
      };
    }

    // Razorpay requires amount in smallest currency unit (paise for INR, cents for USD)
    const amountInSubunits = Math.round(Number(invoice.total) * 100);

    const order = await razorpay.orders.create({
      amount: amountInSubunits,
      currency: invoice.currency.toUpperCase(),
      receipt: `inv_${invoiceId.slice(0, 20)}`,
      notes: {
        invoiceId: invoice.id,
      },
    });

    return {
      success: true,
      orderId: order.id,
      amount: amountInSubunits,
      currency: invoice.currency.toUpperCase(),
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    };
  } catch (err: any) {
    console.error('[CREATE_RAZORPAY_ORDER_ERROR]', err);
    return { success: false, error: err.message || 'Failed to initialize payment gateway.' };
  }
}

/**
 * VERIFY AND CAPTURE RAZORPAY PAYMENT
 */
export async function verifyAndRecordRazorpayPayment({
  invoiceId,
  orderId,
  paymentId,
  signature,
}: {
  invoiceId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { verifyRazorpaySignature } = await import('@/lib/razorpay');
    const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });

    if (!isValid) {
      return { success: false, error: 'Payment signature verification failed. Please contact support.' };
    }

    const pool = getDbPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [invRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, total, status FROM invoices WHERE id = ? FOR UPDATE`,
        [invoiceId]
      );
      const invoice = invRows[0];

      if (!invoice) {
        await conn.rollback();
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === 'PAID') {
        await conn.rollback();
        return { success: true };
      }

      const pId = uuidv4();

      // 1. Mark invoice as PAID
      await conn.query(
        `UPDATE invoices 
         SET status = 'PAID', 
             paid_at = NOW(), 
             reminders_enabled = 0,
             updated_at = NOW()
         WHERE id = ?`,
        [invoiceId]
      );

      // 2. Insert into payments table with exact Razorpay payment ID
      await conn.query(
        `INSERT INTO payments (id, invoice_id, gateway, txn_id, amount, paid_at)
         VALUES (?, ?, 'RAZORPAY', ?, ?, NOW())`,
        [pId, invoiceId, paymentId, invoice.total]
      );

      await conn.commit();

      revalidatePath(`/pay/${invoiceId}`);
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath('/invoices');
      revalidatePath('/dashboard');

      return { success: true };
    } catch (dbErr: any) {
      await conn.rollback();
      console.error('[RECORD_RAZORPAY_PAYMENT_DB_ERROR]', dbErr);
      return { success: false, error: 'Database update failed.' };
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error('[VERIFY_RAZORPAY_PAYMENT_ERROR]', error);
    return { success: false, error: error.message || 'Payment verification failed.' };
  }
}

/**
 * CREATE STRIPE CHECKOUT SESSION (Zero PAN Card required)
 */
export async function createStripeCheckoutSession(invoiceId: string): Promise<{
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.id, i.total, i.currency, i.status, i.number, c.name as client_name, c.email as client_email
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       WHERE i.id = ?`,
      [invoiceId]
    );
    const invoice = rows[0];

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.status === 'PAID') {
      return { success: false, error: 'Invoice is already paid' };
    }

    const { getStripeClient } = await import('@/lib/stripe');
    const stripe = getStripeClient();

    if (!stripe) {
      return { success: false, error: 'STRIPE_NOT_CONFIGURED' };
    }

    const rawUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const appUrl = rawUrl.replace(/\/$/, '');
    const amountInSubunits = Math.round(Number(invoice.total) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: invoice.client_email,
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: {
              name: `Invoice ${invoice.number}`,
              description: `Payment for invoice ${invoice.number} to PayChase`,
            },
            unit_amount: amountInSubunits,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/pay/${invoiceId}?stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pay/${invoiceId}?cancelled=true`,
      metadata: {
        invoiceId: invoice.id,
      },
    });

    return {
      success: true,
      url: session.url || undefined,
      sessionId: session.id,
    };
  } catch (err: any) {
    console.error('[CREATE_STRIPE_SESSION_ERROR]', err);
    return { success: false, error: err.message || 'Failed to initialize Stripe checkout.' };
  }
}

/**
 * CONFIRM AND RECORD STRIPE PAYMENT FROM SESSION
 */
export async function confirmStripePayment(
  invoiceId: string,
  sessionId: string
): Promise<{ success: boolean; txnId?: string; error?: string }> {
  try {
    const { getStripeClient } = await import('@/lib/stripe');
    const stripe = getStripeClient();
    if (!stripe) {
      return { success: false, error: 'Stripe configuration missing' };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return { success: false, error: 'Payment has not been completed yet.' };
    }

    const txnId = (session.payment_intent as string) || session.id;

    const pool = getDbPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [invRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, total, status FROM invoices WHERE id = ? FOR UPDATE`,
        [invoiceId]
      );
      const invoice = invRows[0];

      if (!invoice) {
        await conn.rollback();
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === 'PAID') {
        await conn.rollback();
        return { success: true, txnId };
      }

      const paymentId = uuidv4();

      // 1. Mark invoice as PAID
      await conn.query(
        `UPDATE invoices 
         SET status = 'PAID', 
             paid_at = NOW(), 
             reminders_enabled = 0,
             updated_at = NOW()
         WHERE id = ?`,
        [invoiceId]
      );

      // 2. Insert into payments table
      await conn.query(
        `INSERT INTO payments (id, invoice_id, gateway, txn_id, amount, paid_at)
         VALUES (?, ?, 'STRIPE', ?, ?, NOW())`,
        [paymentId, invoiceId, txnId, invoice.total]
      );

      await conn.commit();

      revalidatePath(`/pay/${invoiceId}`);
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath('/invoices');
      revalidatePath('/dashboard');

      return { success: true, txnId };
    } catch (dbErr: any) {
      await conn.rollback();
      console.error('[RECORD_STRIPE_PAYMENT_DB_ERROR]', dbErr);
      return { success: false, error: 'Database update failed' };
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error('[CONFIRM_STRIPE_PAYMENT_ERROR]', error);
    return { success: false, error: error.message || 'Verification failed' };
  }
}


