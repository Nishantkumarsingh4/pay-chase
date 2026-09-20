import mysql, { type Pool } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: Pool | undefined;
}

export function getDbPool(): Pool {
  if (!global._mysqlPool) {
    global._mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'animated_db',
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      timezone: '+00:00',
    });
  }
  return global._mysqlPool;
}

export default getDbPool;
