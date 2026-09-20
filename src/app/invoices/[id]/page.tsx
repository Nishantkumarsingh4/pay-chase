import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, BellRing, CreditCard, ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/get-current-user';
import { getInvoiceDetail } from '@/lib/invoice-queries';
import { getInvoiceReminders } from '@/lib/reminder-service';
import { formatInvoiceAmount, calculateLineTotal } from '@/lib/invoice';
import GlassCard from '@/components/ui/GlassCard';
import LogoutButton from '@/components/auth/LogoutButton';
import InvoiceDetailActions from '@/components/invoices/InvoiceDetailActions';
import ReminderSection from '@/components/invoices/ReminderSection';

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const statusBadgeStyles = {
  PAID: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  PENDING: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  OVERDUE: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  CANCELLED: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

import Logo from '@/components/ui/Logo';

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  if (id === 'new') {
    const NewInvoicePage = (await import('../new/page')).default;
    return <NewInvoicePage />;
  }

  // Strict ownership lookup: returns null if not found OR not belonging to current user
  const invoice = await getInvoiceDetail(id, user.id);
  if (!invoice) {
    notFound();
  }


  const reminders = await getInvoiceReminders(invoice.id, user.id);

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Top Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 mb-2 border-b border-white/10">
        <Logo href="/dashboard" />


        <div className="flex items-center gap-4">
          <Link
            href="/invoices"
            className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition"
          >
            All Invoices
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-5xl mx-auto my-auto py-6 space-y-6">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-white/70 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to invoices</span>
          </Link>

          <InvoiceDetailActions
            invoiceId={invoice.id}
            status={invoice.status}
            isSent={!!invoice.sentAt}
          />
        </div>

        {/* Invoice Summary Banner */}
        <GlassCard className="p-6 sm:p-8 border-white/15 bg-slate-900/60 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-mono font-extrabold text-white">
                  {invoice.number}
                </h1>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    statusBadgeStyles[invoice.status]
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1">
                Issued to <span className="text-white font-medium">{invoice.clientName}</span> on{' '}
                {invoice.issueDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {invoice.sentAt && (
                  <>
                    {' • '}
                    <span className="text-emerald-400 font-medium">
                      Emailed on{' '}
                      {invoice.sentAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </>
                )}
              </p>
            </div>


            <div className="text-left sm:text-right">
              <span className="text-xs text-white/50 uppercase tracking-wider block">
                Total Amount
              </span>
              <span className="text-3xl font-black text-white">
                {formatInvoiceAmount(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>

          {/* Client & Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40 block mb-1">
                Client Information
              </span>
              <p className="font-semibold text-white">{invoice.clientName}</p>
              <p className="text-xs text-white/60">{invoice.clientEmail}</p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40 block mb-1">
                Due Date
              </span>
              <p className="font-semibold text-white">
                {invoice.dueDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-xs text-white/50">
                {invoice.status === 'PAID'
                  ? `Paid on ${invoice.paidAt ? invoice.paidAt.toLocaleDateString() : 'N/A'}`
                  : invoice.status === 'OVERDUE'
                  ? 'Past due date'
                  : 'Awaiting payment'}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40 block mb-1">
                Autopilot Reminders
              </span>
              <p className="font-semibold text-white">
                {invoice.remindersEnabled ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-xs text-white/50">
                {invoice.status === 'PAID' ? 'Halted (Paid)' : 'Active sequences'}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-white/10 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold text-white/50 uppercase tracking-wider bg-white/[0.02]">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoice.items.map((item, idx) => {
                  const line = calculateLineTotal(item.qty, item.price);
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-white/40 text-xs font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 text-white font-medium">{item.description}</td>
                      <td className="py-3 px-4 text-right text-white/80">{item.qty}</td>
                      <td className="py-3 px-4 text-right text-white/80">
                        {formatInvoiceAmount(item.price, invoice.currency)}
                      </td>
                      <td className="py-3 px-4 text-right text-white font-semibold">
                        {formatInvoiceAmount(line, invoice.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-white/10 text-xs sm:text-sm text-white/80">
              <span className="font-semibold text-white block mb-1 uppercase tracking-wider text-[11px]">
                Notes & Instructions
              </span>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </GlassCard>

        {/* Payments & Reminders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payments Record Card */}
          <GlassCard className="p-6 border-white/15 bg-slate-900/60 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Payment History</h3>
            </div>

            {invoice.payments.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/50">
                No payments recorded yet for this invoice.
              </div>
            ) : (
              <div className="space-y-3">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">
                        {p.gateway} Payment
                      </span>
                      <span className="font-mono text-white/40 text-[11px] truncate block max-w-xs">
                        {p.txnId}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400 block">
                        +{formatInvoiceAmount(p.amount, invoice.currency)}
                      </span>
                      <span className="text-white/40 text-[11px]">
                        {p.paidAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Reminders Card */}
          <ReminderSection
            invoiceId={invoice.id}
            remindersEnabled={invoice.remindersEnabled}
            reminders={reminders}
            invoiceStatus={invoice.status}
            clientEmail={invoice.clientEmail}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto pt-6 border-t border-white/10 text-center text-xs text-white/40">
        © {new Date().getFullYear()} PayChase • Invoice Details
      </footer>
    </div>
  );
}
