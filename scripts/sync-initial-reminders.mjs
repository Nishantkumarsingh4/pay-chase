import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function sync() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'animated_db',
  });

  await connection.query('UPDATE invoices SET sent_at = created_at WHERE sent_at IS NULL');

  await connection.query(`
    INSERT INTO reminders (id, invoice_id, user_id, tone, channel, recipient_email, subject, message_body, sent_at, status)
    SELECT 
      UUID(), i.id, i.user_id, 'POLITE', 'EMAIL', c.email,
      CONCAT('Invoice ', i.number, ' Issued & Sent'),
      CONCAT('Official invoice dispatched to ', c.email),
      i.created_at, 'SENT'
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    LEFT JOIN reminders r ON r.invoice_id = i.id
    WHERE r.id IS NULL
  `);

  console.log('✅ Synchronized existing invoice sent_at and reminders history');
  await connection.end();
}

sync().catch(console.error);
