import { ReminderTone } from './mailer';

export interface WhatsAppReminderParams {
  phone: string;
  clientName: string;
  senderName: string;
  invoiceNumber: string;
  currency: string;
  total: string;
  dueDate: string;
  viewUrl: string;
  tone: ReminderTone;
  daysOverdue?: number;
}

/**
 * Format phone number to international E.164 without symbols
 * Defaults to Indian country code (91) if 10 digits provided
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Generate human-friendly, professional WhatsApp text messages based on escalation tone
 */
export function generateWhatsAppMessage({
  clientName,
  senderName,
  invoiceNumber,
  total,
  dueDate,
  viewUrl,
  tone,
  daysOverdue = 0,
}: Omit<WhatsAppReminderParams, 'phone' | 'currency'>): string {
  if (tone === 'POLITE') {
    return `Hi ${clientName}, 👋

Hope you're having a great day!

This is a gentle reminder regarding *Invoice ${invoiceNumber}* for *${total}* from *${senderName}*.
📅 *Due Date:* ${dueDate}

You can review line items, download the official PDF, and pay securely online using the link below:
🔗 ${viewUrl}

If you have already processed this payment, please disregard this message.

Thank you! 🙏`;
  }

  if (tone === 'FIRM') {
    return `Hello ${clientName},

This is a follow-up regarding *Invoice ${invoiceNumber}* for *${total}* from *${senderName}*.
⚠️ *Status:* Overdue (${daysOverdue > 0 ? `${daysOverdue} days` : 'Past due date'})
📅 *Original Due Date:* ${dueDate}

Please take a moment to settle the pending balance today using the link below:
🔗 ${viewUrl}

If you need any clarification or alternative payment options, please feel free to reply.

Regards,
${senderName}`;
  }

  // FINAL NOTICE
  return `🚨 *FINAL NOTICE: Immediate Payment Required*

Hello ${clientName},

Invoice *${invoiceNumber}* for *${total}* is significantly past due (${daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Past due'}).

Please settle this immediately using the secure payment link:
🔗 ${viewUrl}

To avoid disruption to services or further escalation, please process this payment today.

Urgent regards,
${senderName}`;
}

/**
 * Generate a direct WhatsApp Web / App clickable deep link
 */
export function getWhatsAppDeepLink(params: WhatsAppReminderParams): string {
  const formattedPhone = formatPhoneNumberForWhatsApp(params.phone);
  const text = generateWhatsAppMessage(params);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Send WhatsApp message via Cloud API / Twilio / Webhook (with safe dev fallback)
 */
export async function sendWhatsAppMessage(
  params: WhatsAppReminderParams
): Promise<{ success: boolean; messageId?: string; directLink: string; error?: string }> {
  const directLink = getWhatsAppDeepLink(params);
  const formattedPhone = formatPhoneNumberForWhatsApp(params.phone);
  const text = generateWhatsAppMessage(params);

  // Check for Twilio or WhatsApp Business API in environment
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  const genericWebhook = process.env.WHATSAPP_WEBHOOK_URL;

  // 1. Twilio API if configured
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const toWhatsApp = `whatsapp:+${formattedPhone}`;

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
          To: toWhatsApp,
          Body: text,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        return { success: true, messageId: json.sid, directLink };
      } else {
        console.error('[TWILIO_WHATSAPP_ERROR]', json);
        return { success: false, directLink, error: json.message || 'Twilio WhatsApp dispatch failed' };
      }
    } catch (err: any) {
      console.error('[TWILIO_NETWORK_ERROR]', err);
      return { success: false, directLink, error: err.message };
    }
  }

  // 2. Generic WhatsApp Webhook if configured (e.g. UltraMsg, Gupshup, Aisensy)
  if (genericWebhook) {
    try {
      const res = await fetch(genericWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          message: text,
          invoiceNumber: params.invoiceNumber,
          tone: params.tone,
        }),
      });

      if (res.ok) {
        return { success: true, directLink };
      }
    } catch (err: any) {
      console.error('[GENERIC_WHATSAPP_WEBHOOK_ERROR]', err);
    }
  }

  // 3. Dev Mode / Direct Link Mode Fallback
  console.log(`[WHATSAPP_DEV_MODE] Dispatched to +${formattedPhone}:
Tone: ${params.tone}
Direct wa.me link: ${directLink}`);

  return {
    success: true,
    messageId: 'dev_mock_' + Date.now(),
    directLink,
  };
}
