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

  // Helper for 2-letter client avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <GlassCard className="p-6 sm:p-7 border-white/10 bg-slate-900/50 shadow-2xl h-full flex flex-col justify-between">
      <div>
        {/* Header with Title + Live Overdue Count */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Action Required</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Overdue receivables requiring follow-up or payment recovery.
              </p>
            </div>
          </div>
          {hasInvoices && (
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
              {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
            </span>
          )}
        </div>

        {!hasInvoices ? (
          // Empty State
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              No overdue invoices detected. Any delinquent payments will surface here automatically.
            </p>
          </div>
        ) : (
          // Real Overdue Invoices List (Industry Table/Card Hybrid)
          <div className="space-y-2.5">
            {invoices.map((item) => (
              <div
                key={item.id}
                className="group p-3.5 sm:p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/20 hover:bg-slate-900/60 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Avatar + Client Name + Invoice Number */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300 tracking-wider shrink-0 shadow-sm group-hover:border-indigo-400/40 transition-colors">
                    {getInitials(item.clientName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/invoices/${item.id}`}
                        className="text-sm font-semibold text-white hover:text-indigo-300 truncate flex items-center gap-1.5 transition-colors"
                      >
                        <span className="truncate">{item.clientName}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-300 shrink-0 transition-colors" />
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                      <span>{item.invoiceNumber}</span>
                      <span>•</span>
                      <span className="text-rose-400 font-sans font-medium text-[11px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        {item.daysOverdue}d overdue
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div className="text-left sm:text-right">
                    <div className="text-sm sm:text-base font-bold text-white tracking-tight font-mono">
                      {item.amount}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-rose-400/90 tracking-wider">
                      Unpaid
                    </div>
                  </div>

                  <div className="relative group/btn inline-block">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-white/5 border border-white/10 cursor-not-allowed transition hover:text-white"
                    >
                      <Send className="w-3.5 h-3.5 text-slate-400" />
                      <span>Remind</span>
                    </button>
                    <div
                      role="tooltip"
                      className="absolute right-0 -top-8 hidden group-hover/btn:block px-2.5 py-1 bg-slate-950 border border-white/15 text-white text-[10px] font-medium rounded shadow-xl whitespace-nowrap pointer-events-none z-30"
                    >
                      Automated cadence active
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasInvoices && (
        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>Priority sorted by delinquency</span>
          <Link
            href="/invoices"
            className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <span>View all invoices</span>
            <span>&rarr;</span>
          </Link>
        </div>
      )}
    </GlassCard>
  );
};

export default ActionNeeded;
