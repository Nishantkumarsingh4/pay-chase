'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const CTA_CONTENT = {
  badge: 'Zero Awkward Conversations',
  title: 'Stop Chasing Invoices. Get Paid Faster Today.',
  subtitle:
    'Join hundreds of independent freelancers, developers, and boutique agencies reclaiming their peace of mind and cash flow.',
  buttonText: 'Create Your Free Account',
  buttonHref: '/signup',
  note: 'Takes 60 seconds to set up • Free forever tier available',
};

export const Cta: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 relative">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="text-center p-8 sm:p-14 lg:p-16 border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-950/80 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs sm:text-sm font-medium text-indigo-300 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{CTA_CONTENT.badge}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                {CTA_CONTENT.title}
              </h2>

              <p className="text-base sm:text-lg text-white/70 mb-8 leading-relaxed">
                {CTA_CONTENT.subtitle}
              </p>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={CTA_CONTENT.buttonHref}
                  className="w-full sm:w-auto font-semibold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 px-8 py-4 rounded-xl shadow-xl shadow-indigo-500/30 transition-all min-h-[48px] flex items-center justify-center gap-2 text-base group"
                >
                  <span>{CTA_CONTENT.buttonText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <p className="text-xs sm:text-sm text-white/50 mt-4">{CTA_CONTENT.note}</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
};

export default Cta;
