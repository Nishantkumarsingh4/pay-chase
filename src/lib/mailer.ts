import nodemailer from 'nodemailer';
import crypto from 'crypto';

/**
 * Creates and returns a Nodemailer transporter configured via environment variables.
 * Falls back to dev test account or local logging if credentials are not configured yet.
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!user || !pass) {
    // Development mode fallback: logs to console
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export function generateResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Send password reset email via Nodemailer
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<boolean> {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'PayChase <no-reply@paychase.app>';
  const subject = 'Reset your PayChase password';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6; margin: 0; padding: 40px 20px; }
    .card { max-width: 540px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 36px; }
    .brand { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 24px; }
    .brand span { color: #818cf8; }
    h1 { font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 10px; margin-bottom: 24px; font-size: 15px; }
    .fallback { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }
    .footer { font-size: 12px; color: #475569; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">PayChase<span>.</span></div>
    <h1>Password Reset Request</h1>
    <p>Hi ${name || 'there'},</p>
    <p>We received a request to reset the password for your PayChase account. Click the button below to choose a new password. This link will expire in 30 minutes.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p>If you did not request this change, you can safely ignore this email — your password will remain unchanged.</p>
    <div class="fallback">
      If the button above does not work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #818cf8;">${resetUrl}</a>
    </div>
    <div class="footer">
      PayChase Security Team • Sent automatically
    </div>
  </div>
</body>
</html>`;

  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      console.log(`[NODEMAILER_DEV_MODE] Password reset link for ${to}: ${resetUrl}`);
      return true;
    }

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[NODEMAILER_RESET_EMAIL_ERROR]', err);
    return false;
  }
}

/**
 * Send password changed notification via Nodemailer
 */
export async function sendPasswordChangedNotification({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<void> {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'PayChase <no-reply@paychase.app>';
  const subject = 'Your PayChase password was changed';
  const html = `
    <div style="font-family: sans-serif; background: #030712; color: #fff; padding: 30px; border-radius: 12px;">
      <h2>Security Alert</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Your PayChase account password was just successfully changed.</p>
      <p>If you made this change, no further action is needed.</p>
      <p style="color: #f87171;">If you did NOT make this change, please contact support immediately.</p>
    </div>
  `;

  try {
    const transporter = getMailTransporter();
    if (transporter) {
      await transporter.sendMail({ from, to, subject, html });
    } else {
      console.log(`[NODEMAILER_DEV_MODE] Password change notification sent to ${to}`);
    }
  } catch (err) {
    console.error('[NODEMAILER_NOTIFICATION_ERROR]', err);
  }
}

/**
 * Send invoice with direct Pay Now and PDF links to the client
 */
export async function sendInvoiceEmail({
  to,
  clientName,
  senderName,
  senderEmail,
  invoiceNumber,
  currency,
  total,
  dueDate,
  viewUrl,
  notes,
}: {
  to: string;
  clientName: string;
  senderName: string;
  senderEmail: string;
  invoiceNumber: string;
  currency: string;
  total: string;
  dueDate: string;
  viewUrl: string;
  notes?: string | null;
}): Promise<boolean> {
  const from =
    process.env.EMAIL_FROM || process.env.SMTP_FROM || `PayChase Invoicing <${process.env.SMTP_USER || 'billing@paychase.app'}>`;
  const subject = `Invoice ${invoiceNumber} from ${senderName} (${total})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6; margin: 0; padding: 40px 16px; }
    .card { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 36px; }
    .brand-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 20px; font-weight: 800; color: #ffffff; }
    .brand span { color: #818cf8; }
    .inv-tag { background: #1e293b; color: #a5b4fc; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; font-family: monospace; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
    .highlight-box { background: #1e1b4b; border: 1px solid #3730a3; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; }
    .amount-label { font-size: 12px; text-transform: uppercase; color: #a5b4fc; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }
    .amount-val { font-size: 32px; font-weight: 900; color: #ffffff; }
    .due-info { font-size: 13px; color: #cbd5e1; margin-top: 6px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3); }
    .btn:hover { brightness: 1.1; }
    .notes-box { background: #030712; border: 1px solid #1e293b; border-radius: 8px; padding: 14px; margin-bottom: 24px; font-size: 13px; color: #cbd5e1; }
    .footer { font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand-header">
      <div class="brand">PayChase<span>.</span></div>
      <div class="inv-tag">${invoiceNumber}</div>
    </div>
    
    <h1>Invoice from ${senderName}</h1>
    <p>Hi ${clientName},</p>
    <p>${senderName} has sent you an itemized invoice for payment. Please review the details below.</p>
    
    <div class="highlight-box">
      <div class="amount-label">Amount Due</div>
      <div class="amount-val">${total}</div>
      <div class="due-info">Due by <strong>${dueDate}</strong></div>
    </div>

    ${
      notes
        ? `<div class="notes-box"><strong>Note from sender:</strong><br>${notes}</div>`
        : ''
    }

    <div class="btn-container">
      <a href="${viewUrl}" class="btn">View & Pay Invoice</a>
    </div>

    <div class="footer">
      This invoice was issued by <strong>${senderName}</strong> (${senderEmail}) via PayChase.<br>
      Automated payment tracking and reminders powered by PayChase.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      console.log(`[NODEMAILER_DEV_MODE] Invoice email for ${to}:
Subject: ${subject}
View URL: ${viewUrl}`);
      return true;
    }

    await transporter.sendMail({
      from,
      to,
      replyTo: senderEmail,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[NODEMAILER_INVOICE_EMAIL_ERROR]', err);
    return false;
  }
}

export type ReminderTone = 'POLITE' | 'FIRM' | 'FINAL';

export interface SendReminderEmailParams {
  to: string;
  clientName: string;
  senderName: string;
  senderEmail: string;
  invoiceNumber: string;
  currency: string;
  total: string;
  dueDate: string;
  viewUrl: string;
  tone: ReminderTone;
  daysOverdue?: number;
}

/**
 * Send automated or manual reminder email with tone escalation
 */
export async function sendReminderEmail({
  to,
  clientName,
  senderName,
  senderEmail,
  invoiceNumber,
  currency,
  total,
  dueDate,
  viewUrl,
  tone,
  daysOverdue = 0,
}: SendReminderEmailParams): Promise<{ success: boolean; subject: string; messageBody: string }> {
  const from =
    process.env.EMAIL_FROM || process.env.SMTP_FROM || `PayChase Reminders <${process.env.SMTP_USER || 'reminders@paychase.app'}>`;

  let subject = '';
  let badgeText = '';
  let badgeColor = '';
  let heading = '';
  let bodyText = '';
  let ctaText = 'Pay Invoice Online';

  if (tone === 'POLITE') {
    subject = `Friendly reminder: Invoice ${invoiceNumber} from ${senderName}`;
    badgeText = daysOverdue > 0 ? `${daysOverdue} Days Past Due` : 'Payment Reminder';
    badgeColor = '#6366f1';
    heading = 'A friendly reminder about your invoice';
    bodyText = `We hope you are doing well. This is a gentle reminder that payment for invoice <strong>${invoiceNumber}</strong> issued on behalf of <strong>${senderName}</strong> is due on <strong>${dueDate}</strong>. If you have already processed this payment, please disregard this note.`;
  } else if (tone === 'FIRM') {
    subject = `Payment Overdue: Invoice ${invoiceNumber} (${total}) from ${senderName}`;
    badgeText = `${daysOverdue > 0 ? daysOverdue : 'Several'} Days Overdue`;
    badgeColor = '#f59e0b';
    heading = 'Payment is now overdue';
    bodyText = `Our records show that invoice <strong>${invoiceNumber}</strong> for <strong>${total}</strong> was due on <strong>${dueDate}</strong> and remains unpaid. Please take a moment to settle this balance today to keep your account in good standing.`;
    ctaText = 'Settle Overdue Invoice';
  } else {
    // FINAL
    subject = `FINAL NOTICE: Immediate settlement required for Invoice ${invoiceNumber}`;
    badgeText = 'URGENT: Final Notice';
    badgeColor = '#ef4444';
    heading = 'Immediate payment required';
    bodyText = `Despite previous notices, invoice <strong>${invoiceNumber}</strong> for <strong>${total}</strong> remains significantly past due. Immediate payment is required to avoid potential escalation, late fee assessment, or disruption to ongoing work.`;
    ctaText = 'Pay Immediately';
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6;">
  <div style="max-width: 600px; margin: 32px auto; background-color: #0d1527; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="padding: 28px 32px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">PayChase</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #9ca3af;">Invoice Follow-up on behalf of ${senderName}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; padding: 4px 12px; background-color: ${badgeColor}22; border: 1px solid ${badgeColor}; color: ${badgeColor}; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          ${badgeText}
        </span>
      </div>

      <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #ffffff;">
        ${heading}
      </h2>

      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #d1d5db;">
        Hello ${clientName},
      </p>

      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #d1d5db;">
        ${bodyText}
      </p>

      <!-- Details Card -->
      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #9ca3af;">Invoice Number:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #9ca3af;">Total Amount Due:</td>
            <td style="padding: 6px 0; text-align: right; font-size: 18px; font-weight: 700; color: ${tone === 'FINAL' ? '#ef4444' : '#ffffff'};">${total}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #9ca3af;">Original Due Date:</td>
            <td style="padding: 6px 0; text-align: right; color: #e5e7eb;">${dueDate}</td>
          </tr>
        </table>
      </div>

      <!-- Call to Action -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${viewUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);">
          ${ctaText} &rarr;
        </a>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #9ca3af;">
          Click to review line items, download invoice PDF, or pay online.
        </p>
      </div>

      <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; margin-top: 28px; font-size: 13px; color: #9ca3af; line-height: 1.5;">
        Need to arrange alternative payment or have a question? Simply reply directly to this email (<a href="mailto:${senderEmail}" style="color: #818cf8; text-decoration: none;">${senderEmail}</a>).
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: rgba(0, 0, 0, 0.3); padding: 18px 32px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid rgba(255, 255, 255, 0.05);">
      Automated payment tracking and reminders powered by PayChase.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      console.log(`[NODEMAILER_DEV_MODE] Reminder (${tone}) sent to ${to}:
Subject: ${subject}
View URL: ${viewUrl}`);
      return { success: true, subject, messageBody: bodyText };
    }

    await transporter.sendMail({
      from,
      to,
      replyTo: senderEmail,
      subject,
      html,
    });
    return { success: true, subject, messageBody: bodyText };
  } catch (err) {
    console.error('[NODEMAILER_REMINDER_ERROR]', err);
    return { success: false, subject, messageBody: bodyText };
  }
}

