import { getDbPool } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { sendReminderEmail, ReminderTone } from './mailer';


export interface ReminderRecord {
  id: string;
  invoice_id: string;
  user_id: string;
  tone: ReminderTone;
  channel: string;
  recipient_email: string;
  subject: string;
  message_body: string;
  sent_at: string;
  status: 'SENT' | 'FAILED';
  created_at: string;
}

export function calculateEscalationTone(daysOverdue: number): ReminderTone {
  if (daysOverdue <= 3) {
    return 'POLITE';
  } else if (daysOverdue <= 7) {
    return 'FIRM';
  } else {
    return 'FINAL';
  }
}

/**
 * Fetch all reminders sent for a particular invoice (strictly user-isolated)
 */
export async function getInvoiceReminders(
  invoiceId: string,
  userId: string
): Promise<ReminderRecord[]> {
  const pool = getDbPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.*
     FROM reminders r
     INNER JOIN invoices i ON i.id = r.invoice_id
     WHERE r.invoice_id = ? AND i.user_id = ?
     ORDER BY r.sent_at DESC`,
    [invoiceId, userId]
  );

  return rows.map((r) => ({
    id: r.id,
    invoice_id: r.invoice_id,
    user_id: r.user_id,
    tone: r.tone as ReminderTone,
    channel: r.channel,
    recipient_email: r.recipient_email,
    subject: r.subject,
    message_body: r.message_body,
    sent_at: r.sent_at ? new Date(r.sent_at).toISOString() : '',
    status: r.status as 'SENT' | 'FAILED',
    created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
  }));
}

/**
 * Send a single reminder (Manual or automated)
 */
export async function sendInvoiceReminder({
  invoiceId,
  userId,
  forcedTone,
}: {
  invoiceId: string;
  userId: string;
  forcedTone?: ReminderTone;
}): Promise<{ success: boolean; message: string; reminderId?: string; whatsAppDirectLink?: string }> {

  const pool = getDbPool();

  // 1. Fetch invoice + client + user sender info
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      i.id, i.number, i.currency, i.total, i.issue_date, i.due_date, i.status, i.reminders_enabled,
      c.name AS client_name, c.email AS client_email, c.phone AS client_phone,
      u.name AS user_name, u.email AS user_email
    FROM invoices i
    INNER JOIN clients c ON c.id = i.client_id
    INNER JOIN users u ON u.id = i.user_id
    WHERE i.id = ? AND i.user_id = ?`,
    [invoiceId, userId]
  );

  if (rows.length === 0) {
    return { success: false, message: 'Invoice not found or unauthorized' };
  }

  const inv = rows[0];

  if (inv.status === 'PAID') {
    return { success: false, message: 'Invoice is already marked as paid' };
  }
  if (inv.status === 'CANCELLED') {
    return { success: false, message: 'Cannot send reminders for a cancelled invoice' };
  }

  // Calculate days overdue
  const dueDate = new Date(inv.due_date);
  const now = new Date();
  const diffTime = now.getTime() - dueDate.getTime();
  const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const tone: ReminderTone = forcedTone || calculateEscalationTone(daysOverdue);

  // Format currency display
  let formattedTotal = `${inv.currency} ${inv.total}`;
  try {
    const locale = inv.currency === 'INR' ? 'en-IN' : 'en-US';
    formattedTotal = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: inv.currency,
    }).format(Number(inv.total));
  } catch {}

  const formattedDueDate = new Date(inv.due_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const viewUrl = `${appUrl}/pay/${inv.id}`;

  // 2. Dispatch via Nodemailer (Email)
  const mailResult = await sendReminderEmail({
    to: inv.client_email,
    clientName: inv.client_name,
    senderName: inv.user_name || 'Accounts Team',
    senderEmail: inv.user_email,
    invoiceNumber: inv.number,
    currency: inv.currency,
    total: formattedTotal,
    dueDate: formattedDueDate,
    viewUrl,
    tone,
    daysOverdue,
  });

  // 3. Record Email in reminders table
  const reminderId = randomUUID();
  await pool.query<ResultSetHeader>(
    `INSERT INTO reminders (
      id, invoice_id, user_id, tone, channel, recipient_email, subject, message_body, sent_at, status
    ) VALUES (?, ?, ?, ?, 'EMAIL', ?, ?, ?, NOW(), ?)`,
    [
      reminderId,
      inv.id,
      userId,
      tone,
      inv.client_email,
      mailResult.subject,
      mailResult.messageBody,
      mailResult.success ? 'SENT' : 'FAILED',
    ]
  );

  // If status was DRAFT, advance it to PENDING or OVERDUE
  if (inv.status === 'DRAFT') {
    const newStatus = daysOverdue > 0 ? 'OVERDUE' : 'PENDING';
    await pool.query(`UPDATE invoices SET status = ?, sent_at = NOW() WHERE id = ?`, [
      newStatus,
      inv.id,
    ]);
  } else if (daysOverdue > 0 && inv.status === 'PENDING') {
    await pool.query(`UPDATE invoices SET status = 'OVERDUE' WHERE id = ?`, [inv.id]);
  }

  return {
    success: mailResult.success,
    message: mailResult.success
      ? `${tone} reminder email sent to ${inv.client_email}`
      : 'Failed to dispatch email (check SMTP settings)',
    reminderId,
  };
}


/**
 * Generate quick WhatsApp deep link for manual 1-click sharing
 */
export async function getInvoiceWhatsAppUrl({
  invoiceId,
  userId,
  forcedTone,
}: {
  invoiceId: string;
  userId: string;
  forcedTone?: ReminderTone;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const pool = getDbPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      i.id, i.number, i.currency, i.total, i.due_date,
      c.name AS client_name, c.phone AS client_phone,
      u.name AS user_name
    FROM invoices i
    INNER JOIN clients c ON c.id = i.client_id
    INNER JOIN users u ON u.id = i.user_id
    WHERE i.id = ? AND i.user_id = ?`,
    [invoiceId, userId]
  );

  if (rows.length === 0) {
    return { success: false, error: 'Invoice not found' };
  }

  const inv = rows[0];
  if (!inv.client_phone) {
    return { success: false, error: 'Client does not have a phone number registered. Please update client phone first.' };
  }

  const dueDate = new Date(inv.due_date);
  const now = new Date();
  const diffTime = now.getTime() - dueDate.getTime();
  const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const tone = forcedTone || calculateEscalationTone(daysOverdue);

  let formattedTotal = `${inv.currency} ${inv.total}`;
  try {
    const locale = inv.currency === 'INR' ? 'en-IN' : 'en-US';
    formattedTotal = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: inv.currency,
    }).format(Number(inv.total));
  } catch {}

  const formattedDueDate = new Date(inv.due_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const viewUrl = `${appUrl}/pay/${inv.id}`;

  const { getWhatsAppDeepLink } = await import('./whatsapp');
  const url = getWhatsAppDeepLink({
    phone: inv.client_phone,
    clientName: inv.client_name,
    senderName: inv.user_name || 'Accounts Team',
    invoiceNumber: inv.number,
    currency: inv.currency,
    total: formattedTotal,
    dueDate: formattedDueDate,
    viewUrl,
    tone,
    daysOverdue,
  });

  return { success: true, url };
}


/**
 * Batch processor for automated cron reminders
 * Finds invoices due or overdue with reminders_enabled = true and sends reminders
 * Respecting a 48h cooldown between automated reminders.
 */
export async function processAutomatedReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const pool = getDbPool();

  // Find all active unpaid invoices where reminders are enabled
  // and no reminder was sent in the last 48 hours
  const [invoices] = await pool.query<RowDataPacket[]>(
    `SELECT 
      i.id, i.user_id, i.number, i.currency, i.total, i.due_date, i.status,
      MAX(r.sent_at) AS last_reminder_sent
    FROM invoices i
    LEFT JOIN reminders r ON r.invoice_id = i.id
    WHERE i.reminders_enabled = 1
      AND i.status IN ('DRAFT', 'PENDING', 'OVERDUE')
    GROUP BY i.id
    HAVING last_reminder_sent IS NULL OR last_reminder_sent <= DATE_SUB(NOW(), INTERVAL 48 HOUR)`
  );

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const inv of invoices) {
    try {
      const res = await sendInvoiceReminder({
        invoiceId: inv.id,
        userId: inv.user_id,
      });

      if (res.success) {
        sent++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`[CRON_REMINDER_ERROR] Invoice ${inv.id}:`, err);
      failed++;
    }
  }

  return {
    processed: invoices.length,
    sent,
    failed,
    skipped,
  };
}
