import { getDbPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

export interface CurrencyAmount {
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  amount: number;
}

export interface OverdueInvoiceItem {
  id: string;
  clientName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  daysOverdue: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'INVOICE_CREATED' | 'PAYMENT_RECEIVED';
  title: string;
  description: string;
  timestamp: string;
  rawDate: Date;
}

export interface DashboardStats {
  totalPending: CurrencyAmount[];
  totalOverdue: CurrencyAmount[];
  paidThisMonth: CurrencyAmount[];
  overdueInvoiceCount: number;
  clientCount: number;
  invoiceCount: number;
  hasSentInvoice: boolean;
  actionNeededInvoices: OverdueInvoiceItem[];
  recentActivities: RecentActivityItem[];
}

/**
 * Format relative time (e.g. "2 hours ago", "Just now", "Yesterday")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

/**
 * Single data-fetching function for the dashboard.
 * Every query is strictly filtered by the authenticated user's ID.
 * Amounts are grouped by currency to avoid mixing currencies.
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const pool = getDbPool();

  try {
    // 1. Client count, Invoice count, and Sent invoice flag in single or targeted queries
    const [clientRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM clients WHERE user_id = ?',
      [userId]
    );
    const clientCount = Number(clientRows[0]?.count || 0);

    const [invoiceMetaRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         COUNT(*) as totalInvoices,
         COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END) as sentInvoices
       FROM invoices
       WHERE user_id = ?`,
      [userId]
    );
    const invoiceCount = Number(invoiceMetaRows[0]?.totalInvoices || 0);
    const hasSentInvoice = Number(invoiceMetaRows[0]?.sentInvoices || 0) > 0;

    // 2. Total Pending: sum of total for PENDING invoices whose dueDate is today or later, grouped by currency.
    // Query uses index idx_invoices_user_status and idx_invoices_user_due_date
    const [pendingRows] = await pool.query<RowDataPacket[]>(
      `SELECT currency, SUM(total) as sumTotal
       FROM invoices
       WHERE user_id = ?
         AND status = 'PENDING'
         AND DATE(due_date) >= CURDATE()
       GROUP BY currency
       ORDER BY currency ASC`,
      [userId]
    );

    const totalPending: CurrencyAmount[] = pendingRows.map((r) => ({
      currency: r.currency as 'INR' | 'USD' | 'EUR' | 'GBP',
      amount: Number(r.sumTotal) || 0,
    }));

    // 3. Total Overdue: sum for unpaid invoices whose dueDate is before today (status PENDING or OVERDUE), grouped by currency.
    // Also fetch overdue invoice count.
    const [overdueGroupRows] = await pool.query<RowDataPacket[]>(
      `SELECT currency, SUM(total) as sumTotal, COUNT(*) as count
       FROM invoices
       WHERE user_id = ?
         AND (
           status = 'OVERDUE' 
           OR (status = 'PENDING' AND DATE(due_date) < CURDATE())
         )
       GROUP BY currency
       ORDER BY currency ASC`,
      [userId]
    );

    const totalOverdue: CurrencyAmount[] = overdueGroupRows.map((r) => ({
      currency: r.currency as 'INR' | 'USD' | 'EUR' | 'GBP',
      amount: Number(r.sumTotal) || 0,
    }));

    const [overdueCountRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM invoices
       WHERE user_id = ?
         AND (
           status = 'OVERDUE' 
           OR (status = 'PENDING' AND DATE(due_date) < CURDATE())
         )`,
      [userId]
    );
    const overdueInvoiceCount = Number(overdueCountRows[0]?.count || 0);

    // 4. Paid this month: sum of Payment.amount where paidAt is in current month, grouped by currency (uses invoice currency)
    // Joined with invoices on invoice_id, filtered by user_id
    const [paidRows] = await pool.query<RowDataPacket[]>(
      `SELECT i.currency, SUM(p.amount) as sumAmount
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE i.user_id = ?
         AND p.paid_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND p.paid_at < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
       GROUP BY i.currency
       ORDER BY i.currency ASC`,
      [userId]
    );

    const paidThisMonth: CurrencyAmount[] = paidRows.map((r) => ({
      currency: r.currency as 'INR' | 'USD' | 'EUR' | 'GBP',
      amount: Number(r.sumAmount) || 0,
    }));

    // 5. Action Needed: Top 5 overdue invoices (client name, invoice number, amount, days overdue, link)
    const [actionRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         i.id, i.number, i.currency, i.total, i.due_date,
         c.name as client_name,
         DATEDIFF(CURDATE(), DATE(i.due_date)) as days_overdue
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       WHERE i.user_id = ?
         AND (
           i.status = 'OVERDUE'
           OR (i.status = 'PENDING' AND DATE(i.due_date) < CURDATE())
         )
       ORDER BY i.due_date ASC
       LIMIT 5`,
      [userId]
    );

    const actionNeededInvoices: OverdueInvoiceItem[] = actionRows.map((r) => {
      const locale = r.currency === 'INR' ? 'en-IN' : 'en-US';
      const formattedAmount = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: r.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(r.total) || 0);

      return {
        id: r.id,
        clientName: r.client_name,
        invoiceNumber: r.number,
        amount: formattedAmount,
        currency: r.currency,
        daysOverdue: Math.max(1, Number(r.days_overdue) || 1),
      };
    });

    // 6. Recent Activity: last 10 events from existing tables
    // (Invoice created from Invoice.createdAt, Payment received from Payment.paidAt)
    // Joined with UNION ALL for efficient combined sorting without N+1 queries
    const [activityRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM (
         SELECT 
           i.id,
           'INVOICE_CREATED' as event_type,
           CONCAT('Invoice ', i.number, ' created') as title,
           CONCAT('Issued to ', c.name, ' for ', i.currency, ' ', FORMAT(i.total, 2)) as description,
           i.created_at as event_time
         FROM invoices i
         JOIN clients c ON i.client_id = c.id
         WHERE i.user_id = ?

         UNION ALL

         SELECT 
           p.id,
           'PAYMENT_RECEIVED' as event_type,
           CONCAT('Payment received for ', i.number) as title,
           CONCAT(p.gateway, ' payment of ', i.currency, ' ', FORMAT(p.amount, 2), ' from ', c.name) as description,
           p.paid_at as event_time
         FROM payments p
         JOIN invoices i ON p.invoice_id = i.id
         JOIN clients c ON i.client_id = c.id
         WHERE i.user_id = ?
       ) as combined_events
       ORDER BY event_time DESC
       LIMIT 10`,
      [userId, userId]
    );

    const recentActivities: RecentActivityItem[] = activityRows.map((r) => ({
      id: r.id,
      type: r.event_type,
      title: r.title,
      description: r.description,
      rawDate: new Date(r.event_time),
      timestamp: getRelativeTime(new Date(r.event_time)),
    }));

    return {
      totalPending,
      totalOverdue,
      paidThisMonth,
      overdueInvoiceCount,
      clientCount,
      invoiceCount,
      hasSentInvoice,
      actionNeededInvoices,
      recentActivities,
    };
  } catch (err) {
    console.error('[GET_DASHBOARD_STATS_ERROR]', err);
    return {
      totalPending: [],
      totalOverdue: [],
      paidThisMonth: [],
      overdueInvoiceCount: 0,
      clientCount: 0,
      invoiceCount: 0,
      hasSentInvoice: false,
      actionNeededInvoices: [],
      recentActivities: [],
    };
  }
}

/**
 * Format currency amounts using Intl.NumberFormat (en-IN for INR, en-US for USD/EUR/GBP).
 * Never adds different currencies together; shows one line per currency or cleanly separated with ' + '.
 * Returns ₹0.00 if empty.
 */
export function formatCurrencyAmounts(
  amounts: CurrencyAmount[],
  fallbackCurrency: 'INR' | 'USD' = 'INR'
): string {
  if (!amounts || amounts.length === 0) {
    return new Intl.NumberFormat(fallbackCurrency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: fallbackCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }

  return amounts
    .map((item) => {
      const locale = item.currency === 'INR' ? 'en-IN' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: item.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(item.amount);
    })
    .join(' + ');
}
