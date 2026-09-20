import { getDbPool } from '@/lib/db';
import { computeInvoiceStatus } from '@/lib/invoice';
import type { RowDataPacket } from 'mysql2/promise';

export interface InvoiceListItem {
  id: string;
  number: string;
  clientName: string;
  currency: string;
  total: number;
  issueDate: Date;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paidAt: Date | null;
}

export interface InvoicesListResponse {
  invoices: InvoiceListItem[];
  totalCount: number;
  totalPages: number;
  page: number;
}

/**
 * Fetch paginated, filtered, and searched invoices strictly for the logged-in user.
 */
export async function getInvoicesList({
  userId,
  status = 'ALL',
  query = '',
  page = 1,
  pageSize = 10,
}: {
  userId: string;
  status?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}): Promise<InvoicesListResponse> {
  const pool = getDbPool();
  const offset = (page - 1) * pageSize;

  let whereClauses = ['i.user_id = ?'];
  const params: any[] = [userId];

  // Search by invoice number or client name
  if (query && query.trim() !== '') {
    whereClauses.push('(i.number LIKE ? OR c.name LIKE ?)');
    params.push(`%${query.trim()}%`, `%${query.trim()}%`);
  }

  // Filter tabs handling dynamic OVERDUE status
  if (status === 'PAID') {
    whereClauses.push("i.status = 'PAID'");
  } else if (status === 'CANCELLED') {
    whereClauses.push("i.status = 'CANCELLED'");
  } else if (status === 'PENDING') {
    // A pending invoice is one that is PENDING and due date is NOT passed
    whereClauses.push("i.status = 'PENDING' AND i.due_date >= CURDATE()");
  } else if (status === 'OVERDUE') {
    // Either stored as OVERDUE or PENDING past due date
    whereClauses.push("(i.status = 'OVERDUE' OR (i.status = 'PENDING' AND i.due_date < CURDATE()))");
  }

  const whereSql = whereClauses.join(' AND ');

  // Count total records matching filter
  const countSql = `
    SELECT COUNT(*) as total
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE ${whereSql}
  `;
  const [countRows] = await pool.query<RowDataPacket[]>(countSql, params);
  const totalCount = countRows[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Fetch paginated page
  const listSql = `
    SELECT 
      i.id, i.number, i.currency, i.total, i.issue_date as issueDate,
      i.due_date as dueDate, i.status, i.paid_at as paidAt,
      c.name as clientName
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE ${whereSql}
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query<RowDataPacket[]>(listSql, [...params, pageSize, offset]);

  const invoices: InvoiceListItem[] = rows.map((r) => ({
    id: r.id,
    number: r.number,
    clientName: r.clientName,
    currency: r.currency,
    total: Number(r.total),
    issueDate: new Date(r.issueDate),
    dueDate: new Date(r.dueDate),
    status: computeInvoiceStatus(r.dueDate, r.status),
    paidAt: r.paidAt ? new Date(r.paidAt) : null,
  }));

  return {
    invoices,
    totalCount,
    totalPages,
    page,
  };
}

export interface InvoiceDetailItem {
  id: string;
  description: string;
  qty: number;
  price: number;
  position: number;
}

export interface PaymentItem {
  id: string;
  gateway: string;
  txnId: string;
  amount: number;
  paidAt: Date;
}

export interface InvoiceDetail {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  number: string;
  currency: string;
  total: number;
  issueDate: Date;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes: string | null;
  remindersEnabled: boolean;
  paidAt: Date | null;
  sentAt: Date | null;
  items: InvoiceDetailItem[];
  payments: PaymentItem[];
}

/**
 * Fetch full invoice details with items and payments, strictly filtered by user ID.
 */
export async function getInvoiceDetail(
  invoiceId: string,
  userId: string
): Promise<InvoiceDetail | null> {
  const pool = getDbPool();

  const [invRows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       i.id, i.user_id, i.client_id, i.number, i.currency, i.total,
       i.issue_date, i.due_date, i.status, i.notes, i.reminders_enabled, i.paid_at, i.sent_at,
       c.name as client_name, c.email as client_email, c.phone as client_phone,
       u.name as user_name, u.email as user_email
     FROM invoices i
     JOIN clients c ON i.client_id = c.id
     JOIN users u ON i.user_id = u.id
     WHERE i.id = ? AND i.user_id = ?`,
    [invoiceId, userId]
  );

  const raw = invRows[0];
  if (!raw) return null;

  // Items
  const [itemRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, description, qty, price, position
     FROM invoice_items
     WHERE invoice_id = ?
     ORDER BY position ASC`,
    [invoiceId]
  );

  // Payments
  const [payRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, gateway, txn_id, amount, paid_at
     FROM payments
     WHERE invoice_id = ?
     ORDER BY paid_at DESC`,
    [invoiceId]
  );

  return {
    id: raw.id,
    userId: raw.user_id,
    userName: raw.user_name,
    userEmail: raw.user_email,
    clientId: raw.client_id,
    clientName: raw.client_name,
    clientEmail: raw.client_email,
    clientPhone: raw.client_phone || null,
    number: raw.number,
    currency: raw.currency,
    total: Number(raw.total),
    issueDate: new Date(raw.issue_date),
    dueDate: new Date(raw.due_date),
    status: computeInvoiceStatus(raw.due_date, raw.status),
    notes: raw.notes,
    remindersEnabled: Boolean(raw.reminders_enabled),
    paidAt: raw.paid_at ? new Date(raw.paid_at) : null,
    sentAt: raw.sent_at ? new Date(raw.sent_at) : null,

    items: itemRows.map((it) => ({
      id: it.id,
      description: it.description,
      qty: Number(it.qty),
      price: Number(it.price),
      position: it.position,
    })),
    payments: payRows.map((p) => ({
      id: p.id,
      gateway: p.gateway,
      txnId: p.txn_id,
      amount: Number(p.amount),
      paidAt: new Date(p.paid_at),
    })),
  };
}

/**
 * Fetch public invoice details for recipient client "Pay Now" view (no auth required)
 */
export async function getPublicInvoiceDetail(
  invoiceId: string
): Promise<InvoiceDetail | null> {
  const pool = getDbPool();

  const [invRows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       i.id, i.user_id, i.client_id, i.number, i.currency, i.total,
       i.issue_date, i.due_date, i.status, i.notes, i.reminders_enabled, i.paid_at, i.sent_at,
       c.name as client_name, c.email as client_email, c.phone as client_phone,
       u.name as user_name, u.email as user_email
     FROM invoices i
     JOIN clients c ON i.client_id = c.id
     JOIN users u ON i.user_id = u.id
     WHERE i.id = ?`,
    [invoiceId]
  );

  const raw = invRows[0];
  if (!raw) return null;

  // Items
  const [itemRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, description, qty, price, position
     FROM invoice_items
     WHERE invoice_id = ?
     ORDER BY position ASC`,
    [invoiceId]
  );

  // Payments
  const [payRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, gateway, txn_id, amount, paid_at
     FROM payments
     WHERE invoice_id = ?
     ORDER BY paid_at DESC`,
    [invoiceId]
  );

  return {
    id: raw.id,
    userId: raw.user_id,
    userName: raw.user_name,
    userEmail: raw.user_email,
    clientId: raw.client_id,
    clientName: raw.client_name,
    clientEmail: raw.client_email,
    clientPhone: raw.client_phone || null,
    number: raw.number,
    currency: raw.currency,
    total: Number(raw.total),
    issueDate: new Date(raw.issue_date),
    dueDate: new Date(raw.due_date),
    status: computeInvoiceStatus(raw.due_date, raw.status),
    notes: raw.notes,
    remindersEnabled: Boolean(raw.reminders_enabled),
    paidAt: raw.paid_at ? new Date(raw.paid_at) : null,
    sentAt: raw.sent_at ? new Date(raw.sent_at) : null,

    items: itemRows.map((it) => ({
      id: it.id,
      description: it.description,
      qty: Number(it.qty),
      price: Number(it.price),
      position: it.position,
    })),
    payments: payRows.map((p) => ({
      id: p.id,
      gateway: p.gateway,
      txnId: p.txn_id,
      amount: Number(p.amount),
      paidAt: new Date(p.paid_at),
    })),
  };
}
