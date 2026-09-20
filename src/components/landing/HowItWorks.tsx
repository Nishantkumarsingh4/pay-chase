'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Send, Zap } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const HOW_IT_WORKS_CONTENT = {
  eyebrow: 'Simple 3-Step Workflow',
  title: 'How PayChase Gets You Paid On Time',
  subtitle:
    'No manual spreadsheets or awkward messaging. Set it up in 2 minutes and let the automated system do the heavy lifting.',
  steps: [
    {
      step: '01',
      icon: FileText,
      title: 'Create an Invoice',
      description:
        'Add client details, project deliverables, and amount. Generate a professional PDF invoice in one click.',
    },
    {
      step: '02',
      icon: Send,
      title: 'Send with a Direct "Pay Now" Link',
      description:
        'Deliver via email with an instant payment link so clients can settle immediately using cards or bank transfers.',
    },
    {
      step: '03',
      icon: Zap,
      title: 'Reminders Run on Autopilot',
      description:
        'If unpaid on the due date, PayChase triggers intelligent, escalating reminder sequences until funds clear.',
    },
  ],
};

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-28 relative">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12 sm:mb-16"
        >
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-indigo-400">
            {HOW_IT_WORKS_CONTENT.eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            {HOW_IT_WORKS_CONTENT.title}
          </h2>
          <p className="text-base sm:text-lg text-white/70 mt-4 leading-relaxed">
            {HOW_IT_WORKS_CONTENT.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 relative">
          {HOW_IT_WORKS_CONTENT.steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative"
              >
                <GlassCard className="h-full flex flex-col relative group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-white/20 font-mono group-hover:text-indigo-400/40 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                    {item.description}
                  </p>
                </GlassCard>

                {idx < 2 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-px bg-white/15 z-10" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
