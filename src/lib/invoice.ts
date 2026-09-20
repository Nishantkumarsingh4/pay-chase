import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import { getDbPool } from '@/lib/db';
import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Configure Decimal.js precision and rounding mode (ROUND_HALF_UP / standard banker's rounding)
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface InvoiceItemCalculationInput {
  description?: string;
  qty: number | string;
  price: number | string;
}

/**
 * Calculates total using high-precision Decimal arithmetic.
 * Avoids JavaScript 0.1 + 0.2 floating-point issues. Rounds to 2 decimals.
 */
export function calculateTotal(items: InvoiceItemCalculationInput[]): string {
  if (!items || items.length === 0) return '0.00';

  let grandTotal = new Decimal(0);

  for (const item of items) {
    const qty = new Decimal(item.qty || 0);
    const price = new Decimal(item.price || 0);
    const lineTotal = qty.times(price);
    grandTotal = grandTotal.plus(lineTotal);
  }

  return grandTotal.toFixed(2);
}

/**
 * Calculates single line item total rounded to 2 decimal places.
 */
export function calculateLineTotal(qty: number | string, price: number | string): string {
  const q = new Decimal(qty || 0);
  const p = new Decimal(price || 0);
  return q.times(p).toFixed(2);
}

/**
 * Computes live invoice status.
 * Unpaid invoices past their due date dynamically evaluate to OVERDUE.
 * PAID and CANCELLED statuses are immutable and never change.
 */
export function computeInvoiceStatus(
  dueDate: Date | string,
  currentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
): 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' {
  if (currentStatus === 'PAID' || currentStatus === 'CANCELLED') {
    return currentStatus;
  }

  // Parse YYYY-MM-DD or full ISO strings reliably without UTC timezone shifts
  let dueYear: number, dueMonth: number, dueDay: number;
  if (typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dueDate)) {
    const parts = dueDate.split('T')[0].split('-');
    dueYear = parseInt(parts[0], 10);
    dueMonth = parseInt(parts[1], 10) - 1;
    dueDay = parseInt(parts[2], 10);
  } else {
    const d = new Date(dueDate);
    dueYear = d.getFullYear();
    dueMonth = d.getMonth();
    dueDay = d.getDate();
  }

  const now = new Date();
  const dueMidnight = new Date(dueYear, dueMonth, dueDay).getTime();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (dueMidnight < todayMidnight) {
    return 'OVERDUE';
  }

  return currentStatus;
}

/**
 * Formats integer counter into invoice number (INV-0001, INV-0042)
 */
export function formatInvoiceNumber(count: number): string {
  const padded = Math.max(1, count).toString().padStart(4, '0');
  return `INV-${padded}`;
}

/**
 * Generates an atomic invoice number (INV-0001, INV-0002) inside an ongoing transaction.
 */
export async function generateInvoiceNumber(
  conn: PoolConnection,
  userId: string
): Promise<string> {
  // Upsert user counter atomically and lock row
  await conn.query(
    `INSERT INTO invoice_counters (user_id, last_number)
     VALUES (?, 1)
     ON DUPLICATE KEY UPDATE last_number = last_number + 1`,
    [userId]
  );

  const [rows] = await conn.query<RowDataPacket[]>(
    'SELECT last_number FROM invoice_counters WHERE user_id = ? FOR UPDATE',
    [userId]
  );

  const count = rows[0]?.last_number || 1;
  return formatInvoiceNumber(count);
}

/**
 * Format formatted currency string (e.g. ₹1,200.00 or $4,850.00)
 */
export function formatInvoiceAmount(amount: number | string, currency: string = 'INR'): string {
  const num = Number(amount) || 0;
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
