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
      description: 'Store client contact details and payment preferences.',
      completed: hasClients,
      locked: false,
      href: '/clients',
      icon: UserPlus,
    },
    {
      id: 2,
      title: 'Create your first invoice',
      description: 'Generate an itemized invoice with automatic numbering.',
      completed: hasInvoices,
      // Step 2 unlocked once user has added a client
      locked: !hasClients,
      href: '/invoices/new',
      icon: FileText,
    },
    {
      id: 3,
      title: 'Send it to your client',
      description: 'Activate automated polite-to-firm reminder escalation.',
      completed: hasSentInvoice,
      // Step 3 stays locked until sentAt exists on any invoice
      locked: !hasSentInvoice,
      badge: hasSentInvoice ? undefined : 'Coming soon',
      href: undefined,
      icon: Send,
    },
  ];

  return (
    <GlassCard className="p-6 sm:p-7 border-white/15 bg-slate-900/60 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Get started with PayChase</h2>
          <p className="text-xs text-white/60 mt-0.5">
            Complete these 3 simple steps to put your invoice collection on autopilot.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            {completedCount} of 3 done
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-6">
        <div
          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <div
              key={step.id}
              className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                step.completed
                  ? 'bg-emerald-950/20 border-emerald-500/25 text-white'
                  : step.locked
                  ? 'bg-slate-950/30 border-white/5 text-white/50'
                  : 'bg-slate-950/50 border-white/10 text-white hover:border-indigo-400/30'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    step.completed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : step.locked
                      ? 'bg-white/5 text-white/40'
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

                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold truncate ${
                        step.completed ? 'line-through text-white/60' : 'text-white'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.badge && (
                      <span className="text-[10px] uppercase font-semibold text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 truncate hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {!step.completed && !step.locked && step.href && (
                <Link
                  href={step.href}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1 shrink-0 transition"
                >
                  <span>Start</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
