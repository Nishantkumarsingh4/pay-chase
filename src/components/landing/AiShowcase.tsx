'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, SendHorizontal, Copy, Check } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const AI_CONTENT = {
  eyebrow: 'Intelligent Tone Escalation',
  title: 'AI That Communicates Professionally for You',
  subtitle:
    'From friendly courtesy reminders to assertive, professional final notices. PayChase crafts context-aware messages that preserve your relationships while securing payment.',
  tabs: [
    {
      id: 'polite',
      label: '1. Polite & Friendly',
      stage: 'Due Date / 1 Day Before',
      tone: 'Friendly Reminder',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      subject: 'Quick reminder: Invoice #INV-103 is due today',
      body: `Hi Alex,\n\nHope you are having a productive week! Just sending a quick note that Invoice #INV-103 for the Brand Identity Project is due today.\n\nYou can review and complete the payment easily via our secure link:\npaychase.me/pay/inv-103\n\nThank you for your collaboration!\n\nBest regards,\nSarah Jenkins`,
    },
    {
      id: 'firm',
      label: '2. Firm & Professional',
      stage: '5 Days Overdue',
      tone: 'Follow-Up Notice',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      subject: 'Follow-up: Invoice #INV-103 is 5 days past due',
      body: `Hi Alex,\n\nI am writing to follow up regarding Invoice #INV-103 for $4,850, which was due on October 14th.\n\nAll deliverables have been handed over as agreed. Please take a moment to settle the balance today so that scheduled work on subsequent milestones can proceed smoothly:\npaychase.me/pay/inv-103\n\nPlease let me know if you need another copy of the invoice or have any billing questions.\n\nBest regards,\nSarah Jenkins`,
    },
    {
      id: 'final',
      label: '3. Final Notice',
      stage: '14 Days Overdue',
      tone: 'Urgent Action Required',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      subject: 'URGENT: Final Notice — Outstanding Payment for Invoice #INV-103',
      body: `Dear Alex,\n\nDespite our prior reminders, Invoice #INV-103 in the amount of $4,850 remains unpaid and is now 14 days overdue.\n\nPlease note that project support, file transfers, and maintenance services will be temporarily paused until the outstanding balance is resolved.\n\nPlease complete payment immediately via the link below:\npaychase.me/pay/inv-103\n\nSincerely,\nSarah Jenkins`,
    },
  ],
};

export const AiShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState(AI_CONTENT.tabs[0].id);
  const [copied, setCopied] = useState(false);
  const current = AI_CONTENT.tabs.find((t) => t.id === activeTab) || AI_CONTENT.tabs[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(`${current.subject}\n\n${current.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="ai-showcase" className="py-16 sm:py-20 lg:py-28 relative">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs sm:text-sm font-medium text-indigo-300 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{AI_CONTENT.eyebrow}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {AI_CONTENT.title}
          </h2>
          <p className="text-base sm:text-lg text-white/70 mt-4 leading-relaxed">
            {AI_CONTENT.subtitle}
          </p>
        </motion.div>

        {/* Tab Switchers */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mb-8">
          {AI_CONTENT.tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 min-h-[44px] flex items-center justify-center cursor-pointer ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'glass-panel text-white/70 hover:text-white hover:border-white/25'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/25 -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Showcase Card with AnimatePresence */}
        <div className="max-w-3xl mx-auto">
          <GlassCard className="p-6 sm:p-9 border-white/15 bg-slate-900/60 shadow-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5 mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>PayChase AI Engine</span>
                        <span className="text-[11px] text-indigo-300 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/25">
                          {current.tone}
                        </span>
                      </div>
                      <div className="text-xs text-white/50">{current.stage}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={handleCopy}
                      title="Copy email text"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${current.badgeClass}`}
                    >
                      {current.label.replace(/^\d+\.\s*/, '')}
                    </span>
                  </div>
                </div>

                {/* Subject */}
                <div className="bg-slate-950/60 rounded-xl p-3.5 sm:p-4 border border-white/10 mb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
                    Subject Line
                  </span>
                  <p className="text-sm sm:text-base font-medium text-white">{current.subject}</p>
                </div>

                {/* Body */}
                <div className="bg-slate-950/40 rounded-xl p-5 sm:p-6 border border-white/5 font-sans">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40 block mb-2.5">
                    Message Content
                  </span>
                  <pre className="text-sm sm:text-base text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                    {current.body}
                  </pre>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/50">
              <span>Automatically deactivated as soon as the invoice is marked paid.</span>
              <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
                <SendHorizontal className="w-4 h-4" />
                <span>Sent via your personal business email</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};

export default AiShowcase;
