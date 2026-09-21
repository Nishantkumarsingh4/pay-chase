'use server';

import { v4 as uuidv4 } from 'uuid';
import { getDbPool } from '@/lib/db';
import { z } from 'zod';
import { sendSupportNotificationToAdmin } from '@/lib/mailer';

const supportSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(254),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(255),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

export async function submitSupportMessageAction(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    const parsed = supportSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Please fill in all required fields properly.',
      };
    }

    const { name, email, subject, message } = parsed.data;
    const pool = getDbPool();

    // Ensure support_messages table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const messageId = uuidv4();
    await pool.query(
      `INSERT INTO support_messages (id, name, email, subject, message, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [messageId, name, email, subject, message]
    );

    // Send email alert to admin asynchronously
    sendSupportNotificationToAdmin({
      userName: name,
      userEmail: email,
      subject,
      message,
    }).catch((mailErr) => {
      console.error('[ADMIN_SUPPORT_MAIL_ERROR]', mailErr);
    });

    return {
      success: true,
      message: 'Your message has been submitted and stored successfully!',
    };
  } catch (err: any) {
    console.error('[SUPPORT_SUBMIT_ERROR]', err);
    return {
      success: false,
      error: 'An unexpected database error occurred while submitting your ticket.',
    };
  }
}
