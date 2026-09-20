'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BellRing,
  CreditCard,
  Bot,
  LayoutDashboard,
  FileCheck2,
  Users,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const FEATURES_CONTENT = {
  eyebrow: 'Everything You Need',
  title: 'Built Specifically for Freelancers & Boutique Agencies',
  subtitle:
    'No bloated enterprise accounting tools. Just the exact features you need to get paid faster and look 100% professional.',
  features: [
    {
      icon: BellRing,
      title: 'Automated Reminders',
      description:
        'Schedule intelligent follow-up intervals: before due dates, on the due date, and structured grace period notices.',
    },
    {
      icon: CreditCard,
      title: 'Instant "Pay Now" Links',
      description:
        'Clients can settle invoices in seconds with one-click direct checkout supporting cards and instant bank transfers.',
    },
    {
      icon: Bot,
      title: 'AI-Crafted Messages',
      description:
        'Our AI drafts personalized, respectful reminder emails that match your voice and maintain cordial client relationships.',
    },
    {
      icon: LayoutDashboard,
      title: 'Cash Flow Dashboard',
      description:
        'A single clear screen displaying total outstanding amounts, pending invoices, and cleared funds this month.',
    },
    {
      icon: FileCheck2,
      title: 'Professional PDF Invoices',
      description:
        'Generate sleek, tax-compliant PDF invoices featuring your logo, custom line items, and payment instructions.',
    },
    {
      icon: Users,
      title: 'Client Payment Insights',
      description:
        'Track each client’s average payment delay and payment history so you know whom to request upfront retainers from.',
    },
  ],
};

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-28 relative">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12 sm:mb-16"
        >
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-indigo-400">
            {FEATURES_CONTENT.eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            {FEATURES_CONTENT.title}
          </h2>
          <p className="text-base sm:text-lg text-white/70 mt-4 leading-relaxed">
            {FEATURES_CONTENT.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES_CONTENT.features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <GlassCard className="h-full flex flex-col items-start text-left">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center mb-5 shrink-0">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">
                    {feat.title}
                  </h3>
                  <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                    {feat.description}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
