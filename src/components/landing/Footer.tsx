'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

const FOOTER_CONTENT = {
  brand: 'PayChase',
  tagline: 'Get paid on time without awkward follow-ups.',
  copyright: `© ${new Date().getFullYear()} PayChase. All rights reserved.`,
  madeFor: 'Crafted for freelancers, designers, developers & creators.',
  links: [
    { label: 'Features', targetId: 'features' },
    { label: 'How it works', targetId: 'how-it-works' },
    { label: 'AI Reminders', targetId: 'ai-showcase' },
    { label: 'FAQ', targetId: 'faq' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Contact Support', href: '/contact' },
  ],
};

export const Footer: React.FC = () => {
  const scrollToSection = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="border-t border-white/10 pt-12 pb-safe bg-slate-950/60 relative">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          {/* Brand Col */}
          <div className="md:col-span-6 flex flex-col items-start">
            <div className="mb-3">
              <Logo href="/" />
            </div>
            <p className="text-sm text-white/60 max-w-sm mb-3">{FOOTER_CONTENT.tagline}</p>
            <p className="text-xs text-white/40">{FOOTER_CONTENT.madeFor}</p>
          </div>

          {/* Quick Links without hash in URL */}
          <div className="md:col-span-3 flex flex-col gap-2.5 items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">
              Navigation
            </span>
            {FOOTER_CONTENT.links.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.targetId)}
                className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer text-left"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Legal / Contact */}
          <div className="md:col-span-3 flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">
              Legal & Support
            </span>
            {FOOTER_CONTENT.legal.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex items-center justify-center text-xs text-white/50 text-center">
          <p>{FOOTER_CONTENT.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
