import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function clean() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'animated_db',
  });

  await connection.query("DELETE FROM reminders WHERE channel = 'WHATSAPP'");
  console.log('Cleaned WHATSAPP records from reminders table');
  await connection.end();
}

clean().catch(console.error);
