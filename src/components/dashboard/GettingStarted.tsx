'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Lock, ArrowRight, UserPlus, FileText, Send } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

interface GettingStartedProps {
  hasClients: boolean;
  hasInvoices: boolean;
  hasSentInvoice: boolean;
}

export const GettingStarted: React.FC<GettingStartedProps> = ({
  hasClients,
  hasInvoices,
  hasSentInvoice,
}) => {
  let completedCount = 0;
  if (hasClients) completedCount += 1;
  if (hasInvoices) completedCount += 1;
  if (hasSentInvoice) completedCount += 1;

  const progressPercent = Math.round((completedCount / 3) * 100);

  const steps = [
    {
      id: 1,
      title: 'Add your first client',
      description: 'Store client contact details and currency preferences.',
      completed: hasClients,
      locked: false,
      href: '/clients',
      icon: UserPlus,
    },
    {
      id: 2,
      title: 'Create your first invoice',
      description: 'Generate an itemized invoice with automatic sequential numbering.',
      completed: hasInvoices,
      locked: !hasClients,
      href: '/invoices/new',
      icon: FileText,
    },
    {
      id: 3,
      title: 'Send it to your client',
      description: 'Activate automated polite-to-firm reminder escalation.',
      completed: hasSentInvoice,
      locked: !hasSentInvoice,
      badge: hasSentInvoice ? undefined : 'Automatic',
      href: undefined,
      icon: Send,
    },
  ];

  return (
    <GlassCard className="p-6 sm:p-7 border-white/10 bg-slate-900/40 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Onboarding Checklist
            </h2>
            <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {completedCount}/3 Completed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete these setup tasks to enable auto-chasing and instant payment links.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950/60 h-1.5 rounded-full overflow-hidden mb-5 border border-white/5">
        <div
          className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-400 h-full transition-all duration-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items in a 3-column responsive row or clean list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <div
              key={step.id}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all duration-200 ${
                step.completed
                  ? 'bg-emerald-950/15 border-emerald-500/20 text-white'
                  : step.locked
                  ? 'bg-slate-950/20 border-white/5 text-slate-500 opacity-60'
                  : 'bg-slate-950/40 border-white/10 text-white hover:border-indigo-400/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    step.completed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : step.locked
                      ? 'bg-white/5 text-slate-500'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {step.completed ? (
                    <Check className="w-4 h-4" />
                  ) : step.locked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        step.completed ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.badge && (
                      <span className="text-[9px] uppercase font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {step.description}
                  </p>
                </div>
              </div>

              {!step.completed && !step.locked && step.href && (
                <Link
                  href={step.href}
                  className="mt-2 w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-600/80 hover:bg-indigo-600 flex items-center justify-center gap-1.5 transition border border-indigo-400/30"
                >
                  <span>Start Step</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default GettingStarted;
