'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const FAQ_CONTENT = {
  eyebrow: 'Got Questions?',
  title: 'Frequently Asked Questions',
  subtitle: 'Clear, straightforward answers about how PayChase works for your freelance business.',
  faqs: [
    {
      question: 'Is PayChase free to start?',
      answer:
        'Yes. You can sign up with just your email, generate up to 5 invoices per month, and send manual 1-click reminders without entering a credit card.',
    },
    {
      question: 'What does my client see when I send an invoice?',
      answer:
        'Your client receives a clean, professional email with your business branding and a direct link to view and download your invoice. They see an itemized breakdown and a prominent "Pay Now" button.',
    },
    {
      question: 'How do the automatic reminders work?',
      answer:
        'When creating an invoice, you set a due date. PayChase schedules polite notifications before the due date, on the due date, and gently escalating follow-ups if the invoice passes the grace period. You can pause or stop reminders at any time.',
    },
    {
      question: 'Is my financial and client data safe?',
      answer:
        'Yes. We use industry-standard encryption for all data storage and transmission. We never share or sell your client contacts or invoice details.',
    },
    {
      question: 'Which payment methods can my clients use?',
      answer:
        'Clients can settle invoices using popular global and regional payment methods including credit/debit cards, direct bank ACH/SEPA transfers, and instant digital payment gateways.',
    },
  ],
};

export const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-28 relative">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-indigo-400">
            {FAQ_CONTENT.eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            {FAQ_CONTENT.title}
          </h2>
          <p className="text-base sm:text-lg text-white/70 mt-4 leading-relaxed">
            {FAQ_CONTENT.subtitle}
          </p>
        </motion.div>

        {/* Accordion with smooth Framer Motion height expansion */}
        <div className="space-y-4">
          {FAQ_CONTENT.faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <GlassCard
                key={faq.question}
                hoverEffect={false}
                className="p-0 border-white/10"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-2xl min-h-[56px]"
                >
                  <span className="text-base sm:text-lg font-semibold text-white">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ${
                      isOpen ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/60'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-white/70 leading-relaxed border-t border-white/5">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Faq;
