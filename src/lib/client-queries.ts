import { getDbPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

export interface ClientItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
  invoiceCount: number;
}

export interface ClientsListResult {
  clients: ClientItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Escapes SQL LIKE wildcards (% and _) to prevent wildcard injection
 */
function escapeLikeString(str: string): string {
  return str.replace(/([%_\\])/g, '\\$1');
}

/**
 * Fetch paginated clients with safe searching, strictly scoped by user ID
 */
export async function getClientsList(
  userId: string,
  options: {
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<ClientsListResult> {
  const pool = getDbPool();
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 10));
  const offset = (page - 1) * limit;

  const whereClauses: string[] = ['c.user_id = ?'];
  const params: any[] = [userId];

  // Search filter capped to 100 chars with wildcard escaping
  if (options.search && options.search.trim()) {
    const rawSearch = options.search.trim().slice(0, 100);
    const escaped = escapeLikeString(rawSearch);
    const pattern = `%${escaped}%`;
    whereClauses.push('(c.name LIKE ? OR c.email LIKE ?)');
    params.push(pattern, pattern);
  }

  const whereSql = whereClauses.join(' AND ');

  // Count total matching
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM clients c WHERE ${whereSql}`,
    params
  );
  const totalCount = Number(countRows[0]?.total || 0);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Query paginated items along with invoice count for each client
  const queryParams = [...params, limit, offset];
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       c.id, c.name, c.email, c.phone, c.created_at, c.updated_at,
       (SELECT COUNT(*) FROM invoices i WHERE i.client_id = c.id AND i.user_id = c.user_id) as invoice_count
     FROM clients c
     WHERE ${whereSql}
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    queryParams
  );

  const clients: ClientItem[] = rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    phone: r.phone ? String(r.phone) : null,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    invoiceCount: Number(r.invoice_count || 0),
  }));

  return {
    clients,
    totalCount,
    totalPages,
    currentPage: page,
  };
}
