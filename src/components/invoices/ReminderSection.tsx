'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellRing,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { sendInvoiceReminderAction, toggleRemindersAction } from '@/app/actions/invoice';

export interface ReminderItem {
  id: string;
  tone: 'POLITE' | 'FIRM' | 'FINAL';
  channel?: string;
  recipient_email: string;
  subject: string;
  sent_at: string;
  status: 'SENT' | 'FAILED';
}

interface ReminderSectionProps {
  invoiceId: string;
  remindersEnabled: boolean;
  reminders: ReminderItem[];
  invoiceStatus: string;
  clientEmail: string;
}

export function ReminderSection({
  invoiceId,
  remindersEnabled: initialEnabled,
  reminders,
  invoiceStatus,
  clientEmail,
}: ReminderSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const isEligible =
    invoiceStatus === 'PENDING' || invoiceStatus === 'OVERDUE' || invoiceStatus === 'DRAFT';

  // Filter out any previous whatsapp rows so UI stays 100% email clean
  const emailReminders = reminders.filter((r) => r.channel !== 'WHATSAPP');

  const handleToggle = () => {
    const nextState = !enabled;
    setEnabled(nextState);
    startTransition(async () => {
      const res = await toggleRemindersAction(invoiceId, nextState);
      if (!res.success) {
        setEnabled(!nextState);
        setMessage({ text: res.error || 'Failed to update reminder settings', isError: true });
      } else {
        router.refresh();
      }
    });
  };

  const handleSendReminder = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await sendInvoiceReminderAction(invoiceId);
      if (res.success) {
        setMessage({ text: res.message || 'Reminder email sent successfully!', isError: false });
        router.refresh();
      } else {
        setMessage({ text: res.error || 'Failed to send reminder email', isError: true });
      }
    });
  };

  const getToneBadge = (tone: 'POLITE' | 'FIRM' | 'FINAL') => {
    switch (tone) {
      case 'POLITE':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
            Polite Nudge
          </span>
        );
      case 'FIRM':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
            Firm Notice
          </span>
        );
      case 'FINAL':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 shrink-0">
            Final Notice
          </span>
        );
    }
  };

  return (
    <GlassCard className="p-6 border-white/10 bg-slate-900/60 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header with Title & Auto-Chase Switch */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Automated Reminders</h3>
              <p className="text-[11px] text-white/50">Auto-chase client on schedule</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggle}
              disabled={isPending || !isEligible}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer disabled:opacity-40 ${
                enabled ? 'bg-indigo-600' : 'bg-white/15'
              }`}
              title="Toggle automatic email reminders"
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-xs font-semibold ${
                enabled ? 'text-indigo-400' : 'text-white/40'
              }`}
            >
              {enabled ? 'Active' : 'Off'}
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.isError
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {message.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span className="leading-snug">{message.text}</span>
          </div>
        )}

        {/* Action Bar (Clean Single-Row Layout, No Dropdown) */}
        {isEligible && (
          <div className="mb-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-xs text-white/80 font-medium block">Follow-up Email</span>
              <span className="text-[11px] text-white/40 flex items-center gap-1 font-mono truncate">
                <Mail className="w-3 h-3 shrink-0 text-indigo-400" />
                {clientEmail}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSendReminder}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 active:scale-95 transition shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send Reminder</span>
            </button>
          </div>
        )}

        {/* History Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              Reminder History
            </span>
            <span className="text-[11px] text-white/40 font-mono">
              {emailReminders.length} sent
            </span>
          </div>

          {emailReminders.length === 0 ? (
            <div className="py-7 text-center text-xs text-white/40 bg-white/[0.01] border border-dashed border-white/10 rounded-xl">
              <Clock className="w-5 h-5 text-white/20 mx-auto mb-1.5" />
              No reminders sent yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {emailReminders.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between gap-3 text-xs hover:border-white/10 transition"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      {getToneBadge(r.tone)}
                      <span className="text-white font-medium truncate text-xs">
                        {r.subject}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/40 truncate">
                      To: {r.recipient_email}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        r.status === 'SENT'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="block text-[10px] text-white/40 mt-0.5 font-mono">
                      {r.sent_at
                        ? new Date(r.sent_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
export default ReminderSection;
