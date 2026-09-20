'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const HERO_CONTENT = {
  badge: 'Automated Invoice Recovery Software',
  headlineStart: 'Get paid on time.',
  headlineEnd: 'Without the awkward follow-ups.',
  subheading:
    'Generate professional invoices with instant payment links. When clients miss due dates, PayChase automatically sends smart, polite-to-firm reminder sequences until payment clears.',
  primaryCta: 'Start Free Today',
  primaryHref: '/signup',
  secondaryCta: 'See How It Works',
  targetId: 'how-it-works',
  note: 'No credit card required • Free tier included',
};

const INITIAL_INVOICES = [
  {
    id: 'INV-104',
    client: 'Acme Digital Agency',
    amount: '$2,400',
    due: '3 days overdue',
    status: 'Overdue',
    statusClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: AlertCircle,
  },
  {
    id: 'INV-103',
    client: 'Apex Creative Studio',
    amount: '$4,850',
    due: 'Due today',
    status: 'Pending',
    statusClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Clock,
  },
  {
    id: 'INV-102',
    client: 'Horizon Media Group',
    amount: '$6,500',
    due: 'Paid',
    status: 'Paid',
    statusClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: CheckCircle2,
  },
];

export const Hero: React.FC = () => {
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [lastAction, setLastAction] = useState('Autopilot active: checking open balances');
  const [isSimulating, setIsSimulating] = useState(false);

  const scrollToHowItWorks = () => {
    const el = document.getElementById(HERO_CONTENT.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const triggerSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setLastAction('AI Sent reminder to Apex Creative Studio...');

    setTimeout(() => {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === 'INV-103'
            ? {
                ...inv,
                status: 'Paid',
                due: 'Paid just now',
                statusClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                icon: CheckCircle2,
              }
            : inv
        )
      );
      setLastAction('Payment received: $4,850 cleared via Stripe!');
      setIsSimulating(false);
    }, 2200);
  };

  return (
    <section className="relative pt-8 sm:pt-14 lg:pt-20 pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-6 flex flex-col items-start text-left"
          >
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs sm:text-sm font-medium mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{HERO_CONTENT.badge}</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
              <span className="text-white block">{HERO_CONTENT.headlineStart}</span>
              <span className="bg-gradient-to-r from-indigo-200 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
                {HERO_CONTENT.headlineEnd}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl mb-8">
              {HERO_CONTENT.subheading}
            </p>

            {/* CTAs */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={HERO_CONTENT.primaryHref}
                  className="w-full sm:w-auto text-center font-semibold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all min-h-[48px] flex items-center justify-center gap-2"
                >
                  <span>{HERO_CONTENT.primaryCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={scrollToHowItWorks}
                className="w-full sm:w-auto text-center font-medium text-white/80 hover:text-white glass-panel hover:bg-white/10 px-6 py-3.5 rounded-xl transition-all min-h-[48px] flex items-center justify-center cursor-pointer"
              >
                {HERO_CONTENT.secondaryCta}
              </motion.button>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {HERO_CONTENT.note}
              </span>
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-6 w-full max-w-full"
          >
            <GlassCard className="p-5 sm:p-7 border-white/15 bg-slate-900/60 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Live Activity Monitor
                  </div>
                  <h2 className="text-lg font-bold text-white mt-0.5">Automated Recovery Hub</h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-300 font-semibold">Autopilot Live</span>
                </div>
              </div>

              {/* Real-time stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-3 sm:p-3.5 rounded-xl bg-slate-950/60 border border-white/10"
                >
                  <span className="text-[11px] sm:text-xs text-white/50 block mb-1">Overdue</span>
                  <span className="text-base sm:text-lg font-bold text-rose-400">$2,400</span>
                </motion.div>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-3 sm:p-3.5 rounded-xl bg-slate-950/60 border border-white/10"
                >
                  <span className="text-[11px] sm:text-xs text-white/50 block mb-1">Pending</span>
                  <span className="text-base sm:text-lg font-bold text-amber-300">
                    {invoices.find((i) => i.id === 'INV-103')?.status === 'Paid' ? '$0' : '$4,850'}
                  </span>
                </motion.div>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-3 sm:p-3.5 rounded-xl bg-slate-950/60 border border-white/10"
                >
                  <span className="text-[11px] sm:text-xs text-white/50 block mb-1">Received</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-400">
                    {invoices.find((i) => i.id === 'INV-103')?.status === 'Paid'
                      ? '$18,050'
                      : '$13,200'}
                  </span>
                </motion.div>
              </div>

              {/* Invoices List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-white/50 uppercase tracking-wider px-1">
                  <span>Tracked Invoices</span>
                  <button
                    onClick={triggerSimulation}
                    disabled={isSimulating}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
                  >
                    <Send className="w-3 h-3" />
                    {isSimulating ? 'Sending reminder...' : 'Simulate Reminder'}
                  </button>
                </div>

                <AnimatePresence>
                  {invoices.map((inv) => {
                    const Icon = inv.icon;
                    return (
                      <motion.div
                        layout
                        key={inv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="p-3 sm:p-3.5 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between gap-2 hover:border-white/20 transition-colors"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white/5 items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-white/70" />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-medium text-white truncate">{inv.client}</p>
                            <p className="text-xs text-white/40">
                              {inv.id} • {inv.due}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold text-white">{inv.amount}</span>
                          <motion.span
                            key={inv.status}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${inv.statusClass}`}
                          >
                            {inv.status}
                          </motion.span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Dynamic ticker */}
              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-white/80">{lastAction}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
