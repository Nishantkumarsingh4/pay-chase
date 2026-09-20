import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldAlert, Download, CheckCircle2, Clock, AlertTriangle, XCircle, CreditCard } from 'lucide-react';
import { getPublicInvoiceDetail } from '@/lib/invoice-queries';
import { formatInvoiceAmount, calculateLineTotal } from '@/lib/invoice';
import GlassCard from '@/components/ui/GlassCard';

interface PayInvoicePageProps {
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

export default async function PublicPayInvoicePage({ params }: PayInvoicePageProps) {
  const { id } = await params;
  const invoice = await getPublicInvoiceDetail(id);

  if (!invoice) {
    notFound();
  }

  const isPaid = invoice.status === 'PAID';

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6 mb-2 border-b border-white/10">
        <Logo href="/" />

        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </a>
      </header>

      {/* Main Invoice Card */}
      <main className="w-full max-w-4xl mx-auto flex-1 py-4 sm:py-6 space-y-6">
        {/* Banner if Paid */}
        {isPaid && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">Invoice Paid in Full</p>
              <p className="text-xs text-emerald-300/80">
                Payment has been successfully verified and recorded. Thank you for your business!
              </p>
            </div>
          </div>
        )}

        {/* Invoice Summary */}
        <GlassCard className="p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Invoice from {invoice.userName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {invoice.number}
              </h1>
              <p className="text-xs text-white/60 mt-0.5">
                Issued to <strong className="text-white">{invoice.clientName}</strong> ({invoice.clientEmail})
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md self-start sm:self-auto ${
                  statusBadgeStyles[invoice.status]
                }`}
              >
                {invoice.status}
              </span>
              <div className="text-xs text-white/60 mt-1">
                Due: {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(invoice.dueDate)}
              </div>
            </div>
          </div>

          {/* Amount Callout & Payment Section */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                Total Amount Due
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                {formatInvoiceAmount(invoice.total, invoice.currency)}
              </div>
            </div>

            {!isPaid && invoice.status !== 'CANCELLED' && (
              <div className="flex flex-col sm:items-end gap-1">
                <button
                  type="button"
                  onClick={undefined}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 hover:brightness-110 active:scale-[0.98] transition flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Now</span>
                </button>
                <span className="text-[11px] text-white/40">
                  Instant receipt upon confirmation
                </span>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
              Items & Deliverables
            </h3>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.01]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/50 bg-white/[0.02]">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 text-white/40 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-white">{item.description}</td>
                      <td className="py-3 px-4 text-right">{item.qty}</td>
                      <td className="py-3 px-4 text-right">
                        {formatInvoiceAmount(item.price, invoice.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-white">
                        {formatInvoiceAmount(calculateLineTotal(item.qty, item.price), invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total summary */}
            <div className="flex justify-end mt-4">
              <div className="w-full sm:w-64 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Subtotal</span>
                  <span>{formatInvoiceAmount(invoice.total, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-white/60">
                  <span>Taxes & Fees</span>
                  <span>{formatInvoiceAmount(0, invoice.currency)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-white text-sm">Grand Total</span>
                  <span className="text-lg font-black text-white">
                    {formatInvoiceAmount(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40 block mb-1">
                Notes / Payment Instructions
              </span>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto pt-6 text-center text-xs text-white/40 border-t border-white/5 mt-8">
        Powered by <strong>PayChase</strong> • Automated Payment Recovery for Creators
      </footer>
    </div>
  );
}
