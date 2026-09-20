import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'animated_db',
  });

  console.log('Connected to MySQL. Creating reminders table...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS reminders (
      id VARCHAR(36) PRIMARY KEY,
      invoice_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      tone ENUM('POLITE', 'FIRM', 'FINAL') NOT NULL DEFAULT 'POLITE',
      channel VARCHAR(32) NOT NULL DEFAULT 'EMAIL',
      recipient_email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message_body TEXT NOT NULL,
      sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status ENUM('SENT', 'FAILED') NOT NULL DEFAULT 'SENT',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_reminders_invoice (invoice_id, sent_at),
      INDEX idx_reminders_user (user_id),
      CONSTRAINT fk_reminders_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      CONSTRAINT fk_reminders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ reminders table created successfully!');
  await connection.end();
}

run().catch(err => {
  console.error('Error creating table:', err);
  process.exit(1);
});
