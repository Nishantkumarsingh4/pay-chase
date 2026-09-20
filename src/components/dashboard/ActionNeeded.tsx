'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Send, ExternalLink } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { OverdueInvoiceItem } from '@/lib/dashboard';

interface ActionNeededProps {
  invoices?: OverdueInvoiceItem[];
  onSendReminder?: (invoiceId: string) => void;
}

export const ActionNeeded: React.FC<ActionNeededProps> = ({
  invoices = [],
}) => {
  const hasInvoices = invoices.length > 0;

  return (
    <GlassCard className="p-6 sm:p-7 border-white/15 bg-slate-900/60 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Action needed
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Top overdue invoices requiring immediate client attention.
          </p>
        </div>
        {hasInvoices && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {invoices.length} overdue
          </span>
        )}
      </div>

      {!hasInvoices ? (
        // Honest empty state
        <div className="my-auto py-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">No overdue invoices.</p>
          <p className="text-xs text-white/50 mt-1 max-w-xs">
            You are all caught up. When clients miss due dates, follow-up actions will appear here.
          </p>
        </div>
      ) : (
        // Real Overdue Invoices List (top 5)
        <div className="space-y-3">
          {invoices.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-950/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-500/30 transition"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/invoices/${item.id}`}
                    className="text-sm font-semibold text-white hover:text-indigo-300 truncate flex items-center gap-1.5 group"
                  >
                    <span>{item.clientName}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-indigo-300 transition" />
                  </Link>
                  <span className="text-xs text-rose-400 font-medium whitespace-nowrap">
                    ({item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'} overdue)
                  </span>
                </div>
                <div className="text-xs text-white/50 mt-0.5">
                  Invoice <strong className="text-white/70">{item.invoiceNumber}</strong> • {item.amount}
                </div>
              </div>

              {/* Disabled "Send reminder" button with "Coming soon" */}
              <div className="relative group inline-block self-start sm:self-center">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/40 bg-white/5 border border-white/10 cursor-not-allowed transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send reminder</span>
                </button>

                <div
                  role="tooltip"
                  className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 -top-8 hidden group-hover:block px-2.5 py-1 bg-slate-900 border border-white/20 text-white text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-20"
                >
                  Coming soon
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default ActionNeeded;
