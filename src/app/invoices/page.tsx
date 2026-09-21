import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Search, FileText, UserPlus, ArrowRight, ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/get-current-user';
import { getInvoicesList } from '@/lib/invoice-queries';
import { formatInvoiceAmount } from '@/lib/invoice';
import GlassCard from '@/components/ui/GlassCard';
import LogoutButton from '@/components/auth/LogoutButton';
import ServerPagination from '@/components/ui/ServerPagination';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

interface InvoicesPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
}

const statusBadgeStyles = {
  PAID: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  PENDING: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  OVERDUE: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  CANCELLED: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

import AppNavbar from '@/components/ui/AppNavbar';

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/invoices');
  }

  const resolvedParams = await searchParams;
  const currentStatus = (resolvedParams.status || 'ALL').toUpperCase();
  const query = resolvedParams.q || '';
  const page = Math.max(1, Number(resolvedParams.page) || 1);

  // Check if user has at least one client
  const pool = getDbPool();
  const [clientCountRows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM clients WHERE user_id = ?',
    [user.id]
  );
  const clientCount = clientCountRows[0]?.count || 0;

  // Fetch paginated invoices strictly for this user
  const { invoices, totalCount, totalPages } = await getInvoicesList({
    userId: user.id,
    status: currentStatus,
    query,
    page,
    pageSize: 10,
  });

  const filterTabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Overdue', value: 'OVERDUE' },
    { label: 'Paid', value: 'PAID' },
  ];

  return (
    <div className="min-h-dvh flex flex-col justify-between relative bg-[#030712]">
      {/* Universal SaaS Navbar */}
      <AppNavbar />

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* Title & Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Invoices
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Track invoice statuses, payment due dates, and automated chases.
            </p>
          </div>

          {clientCount > 0 ? (
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition min-h-[42px] self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Create invoice</span>
            </Link>
          ) : (
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition min-h-[42px] self-start sm:self-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add client first</span>
            </Link>
          )}
        </div>

        {/* User has no clients notice */}
        {clientCount === 0 && (
          <GlassCard className="p-6 border-indigo-500/30 bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Add your first client to start</h2>
              <p className="text-xs text-white/70 mt-0.5">
                Invoices must be linked to a client record so reminders can be addressed properly.
              </p>
            </div>
            <Link
              href="/clients"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shrink-0"
            >
              Add Client
            </Link>
          </GlassCard>
        )}

        {/* Search & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/10 self-start">
            {filterTabs.map((tab) => {
              const isActive = currentStatus === tab.value;
              const href = tab.value === 'ALL'
                ? query ? `/invoices?q=${encodeURIComponent(query)}` : '/invoices'
                : query
                ? `/invoices?status=${tab.value}&q=${encodeURIComponent(query)}`
                : `/invoices?status=${tab.value}`;

              return (
                <Link
                  key={tab.value}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Search Input */}
          <form method="GET" action="/invoices" className="relative w-full md:w-72">
            {currentStatus !== 'ALL' && (
              <input type="hidden" name="status" value={currentStatus} />
            )}
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search number or client..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-indigo-400"
            />
          </form>
        </div>

        {/* Invoices List / Table */}
        {invoices.length === 0 ? (
          <GlassCard className="p-12 text-center border-white/10 bg-slate-900/60">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">No invoices found</h2>
            <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto mb-6">
              {query || currentStatus !== 'ALL'
                ? 'No invoices match your active filters or search query.'
                : 'Create your first invoice to start getting paid on time.'}
            </p>
            {clientCount > 0 ? (
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create your first invoice</span>
              </Link>
            ) : (
              <Link
                href="/clients"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add a client first</span>
              </Link>
            )}
          </GlassCard>
        ) : (
          <>
            <GlassCard className="p-0 border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] font-semibold text-white/50 uppercase tracking-wider bg-white/[0.02]">
                      <th className="py-2.5 px-4">Invoice #</th>
                      <th className="py-2.5 px-4">Client</th>
                      <th className="py-2.5 px-4">Total</th>
                      <th className="py-2.5 px-4">Due Date</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        <td className="py-2.5 px-4 font-mono font-semibold text-indigo-300">
                          <Link href={`/invoices/${inv.id}`} className="hover:underline">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-white truncate max-w-xs">
                          {inv.clientName}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-white">
                          {formatInvoiceAmount(inv.total, inv.currency)}
                        </td>
                        <td className="py-2.5 px-4 text-white/60">
                          {inv.dueDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                              statusBadgeStyles[inv.status]
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-white/5">
                {invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition block"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs font-bold text-indigo-300">
                          {inv.number}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                            statusBadgeStyles[inv.status]
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{inv.clientName}</p>
                      <p className="text-[11px] text-white/50">
                        Due{' '}
                        {inv.dueDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-white block">
                        {formatInvoiceAmount(inv.total, inv.currency)}
                      </span>
                      <span className="text-[11px] text-indigo-400 font-medium">Details →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </GlassCard>

            {/* Pagination Placed Below Card */}
            <div className="pt-1">
              <ServerPagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={10}
                itemName="invoices"
                baseUrl="/invoices"
                extraParams={{
                  status: currentStatus !== 'ALL' ? currentStatus : undefined,
                  q: query || undefined,
                }}
              />
            </div>
          </>
        )}
      </main>


      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 border-t border-white/5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PayChase • Automated Invoice Platform
      </footer>
    </div>
  );
}
