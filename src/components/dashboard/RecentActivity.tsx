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
    <GlassCard className="p-6 sm:p-7 border-white/15 bg-slate-900/60 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Recent activity
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Log of recently issued invoices and verified payments.
          </p>
        </div>
      </div>

      {!hasEvents ? (
        // Honest empty state
        <div className="my-auto py-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
            <History className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">Your activity will appear here</p>
          <p className="text-xs text-white/50 mt-1 max-w-xs">
            Once you create clients, issue invoices, and record payments, your audit events will be tracked here.
          </p>
        </div>
      ) : (
        // Populated state with real activities
        <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
          {events.map((ev) => {
            const isPayment = ev.type === 'PAYMENT_RECEIVED';
            return (
              <div
                key={ev.id}
                className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-start gap-3 hover:border-white/15 transition"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isPayment
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                      : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                  }`}
                >
                  {isPayment ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{ev.title}</p>
                  <p className="text-xs text-white/60 mt-0.5">{ev.description}</p>
                  <span className="text-[11px] text-white/40 mt-1 block font-mono">
                    {ev.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};

export default RecentActivity;
