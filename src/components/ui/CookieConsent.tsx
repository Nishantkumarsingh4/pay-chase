'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, ShieldCheck } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a cookie choice
    try {
      const consent = localStorage.getItem('paychase_cookie_consent');
      if (!consent) {
        // Show after brief subtle delay
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('paychase_cookie_consent', 'accepted');
    } catch {}
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    try {
      localStorage.setItem('paychase_cookie_consent', 'essential_only');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie Consent Banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90 backdrop-blur-xl p-5 shadow-2xl shadow-black/80">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Cookie className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                We value your privacy
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </h3>
              <button
                type="button"
                onClick={handleAcceptNecessary}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              We use essential cookies to keep you signed in securely and improve your payment reminder experience. Read our{' '}
              <Link
                href="/privacy"
                className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 font-medium"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                href="/terms"
                className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 font-medium"
              >
                Terms
              </Link>
              .
            </p>

            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={handleAcceptNecessary}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-lg transition-all cursor-pointer"
              >
                Essential Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
