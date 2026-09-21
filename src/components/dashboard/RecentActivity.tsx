'use client';

import React from 'react';
import Link from 'next/link';
import { History, FileText, CheckCircle2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { RecentActivityItem } from '@/lib/dashboard';

interface RecentActivityProps {
  events?: RecentActivityItem[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ events = [] }) => {
  const hasEvents = events.length > 0;

  return (
    <GlassCard className="p-6 sm:p-7 border-white/10 bg-slate-900/50 shadow-2xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Audit Stream
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live chronological activity of invoices and settlements.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
            Latest 10
          </span>
        </div>

        {!hasEvents ? (
          // Empty state
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">No activity yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Invoices generated, reminders dispatched, and payments confirmed will stream here.
            </p>
          </div>
        ) : (
          // Populated state with sleek timeline
          <div className="relative pl-6 space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {/* Timeline vertical spine */}
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/40 via-white/10 to-transparent" />

            {events.map((ev) => {
              const isPayment = ev.type === 'PAYMENT_RECEIVED';
              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                      isPayment
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    }`}
                  >
                    {isPayment ? (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    ) : (
                      <FileText className="w-2.5 h-2.5" />
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/15 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors">
                        {ev.title}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {ev.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time webhook listener</span>
        </span>
      </div>
    </GlassCard>
  );
};

export default RecentActivity;
