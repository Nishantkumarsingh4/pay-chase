import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT DATABASE() as currentDb, NOW() as serverTime, VERSION() as mysqlVersion');
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to WAMP MySQL database!',
      data: rows[0],
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to connect to MySQL database.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
