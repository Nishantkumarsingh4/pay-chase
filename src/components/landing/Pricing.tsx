'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const PRICING_CONTENT = {
  eyebrow: 'Simple & Transparent',
  title: 'Priced for Independent Freelancers & Studios',
  subtitle: 'Start free, then upgrade when you need automated follow-ups and unlimited active invoices.',
  disclaimer: 'Pricing is subject to change as additional currencies and international payment gateways are introduced.',
  plans: [
    {
      name: 'Starter',
      badge: 'Free Forever',
      price: '$0',
      period: 'month',
      description: 'Perfect for solo creators sending occasional client invoices.',
      features: [
        'Up to 5 active invoices per month',
        'Manual one-click reminder emails',
        'Standard PDF invoice generator',
        'Direct bank and card payment links',
        'Basic payment tracking dashboard',
      ],
      cta: 'Start Free',
      ctaHref: '/signup',
      isPopular: false,
    },
    {
      name: 'Pro Autopilot',
      badge: 'Most Popular',
      price: '$12',
      period: 'month',
      description: 'For active freelancers and boutique agencies wanting hands-free collections.',
      features: [
        'Unlimited active invoices',
        'Automated AI-written follow-up sequences',
        'Intelligent polite-to-firm escalation schedule',
        'Instant Pay Now checkout links',
        'Client payment reliability insights',
        'Custom business branding & logo support',
        'Priority support & early feature access',
      ],
      cta: 'Get Started with Pro',
      ctaHref: '/signup',
      isPopular: true,
    },
  ],
};

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-28 relative">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-indigo-400">
            {PRICING_CONTENT.eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            {PRICING_CONTENT.title}
          </h2>
          <p className="text-base sm:text-lg text-white/70 mt-4 leading-relaxed">
            {PRICING_CONTENT.subtitle}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {PRICING_CONTENT.plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl flex flex-col ${
                plan.isPopular
                  ? 'p-[1px] bg-gradient-to-b from-indigo-400 via-violet-500 to-indigo-700 shadow-2xl shadow-indigo-500/20'
                  : ''
              }`}
            >
              <GlassCard
                className={`h-full flex flex-col justify-between ${
                  plan.isPopular ? 'bg-slate-900/80 border-transparent' : 'border-white/15'
                }`}
              >
                <div>
                  {/* Top Badge & Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                        plan.isPopular
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
                          : 'bg-white/10 text-white/70 border-white/15'
                      }`}
                    >
                      {plan.badge}
                    </span>
                    {plan.isPopular && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-medium">
                        <Sparkles className="w-3.5 h-3.5" /> Recommended
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-white/70 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-8 pb-6 border-b border-white/10">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm text-white/60">/{plan.period}</span>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3.5 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            plan.isPopular
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-white/10 text-white/60'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm text-white/80 leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all min-h-[48px] flex items-center justify-center text-center ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 text-white shadow-lg shadow-indigo-500/25'
                      : 'border border-white/20 bg-white/5 hover:bg-white/15 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </GlassCard>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-white/40 text-center mt-8">{PRICING_CONTENT.disclaimer}</p>
      </div>
    </section>
  );
};

export default Pricing;
