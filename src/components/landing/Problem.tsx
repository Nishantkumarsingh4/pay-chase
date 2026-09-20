'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareOff, CalendarClock, UserX } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const PROBLEM_CONTENT = {
  eyebrow: 'The Freelancer Challenge',
  title: 'Chasing payments damages client relationships and your cash flow',
  subtitle:
    'You completed the work on schedule. Now comes the stressful part: waiting on unpaid invoices and wondering when money will arrive.',
  cards: [
    {
      icon: MessageSquareOff,
      title: 'The Endless "Next Week" Cycle',
      description:
        'Clients promise payment by the end of the week, but deadlines pass without a word. You are left guessing when you will actually get paid.',
    },
    {
      icon: UserX,
      title: 'Follow-ups Feel Awkward & Desperate',
      description:
        'You do not want to sound aggressive or risk future collaborations, so you hesitate to reach out. Soon, days turn into unpaid weeks.',
    },
    {
      icon: CalendarClock,
      title: 'Tracking Multiple Invoices is Chaotic',
      description:
        'Managing multiple active clients and remembering who owes what, who was reminded, and when to follow up quickly turns into disorganized chaos.',
    },
  ],
};

export const Problem: React.FC = () => {
  return (
    <section id="problem" className="py-16 sm:py-20 lg:py-28 relative">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12 sm:mb-16"
        >
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-rose-400">
            {PROBLEM_CONTENT.eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            {PROBLEM_CONTENT.title}
          </h2>
          <p className="text-base sm:text-lg text-white/70 mt-4 leading-relaxed">
            {PROBLEM_CONTENT.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {PROBLEM_CONTENT.cards.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
              >
                <GlassCard className="h-full flex flex-col items-start text-left">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 shrink-0">
                    <Icon className="w-6 h-6 text-rose-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2.5">{item.title}</h3>
                  <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                    {item.description}
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

export default Problem;
