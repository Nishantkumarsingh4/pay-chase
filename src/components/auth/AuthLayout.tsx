'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, CheckCircle2, Bot, BellRing, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-dvh flex flex-col justify-between relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Brand Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl tracking-tight group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span>
            PayChase<span className="text-indigo-400">.</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs sm:text-sm text-white/60 hover:text-white transition-colors"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Grid Content */}
      <main className="w-full max-w-6xl mx-auto my-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Brand Showcase Column (Hidden on mobile, prominent on desktop) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col items-start text-left pr-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs sm:text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Get paid on time, every time</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-4">
              Stop Chasing Invoices. <br />
              <span className="bg-gradient-to-r from-indigo-200 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
                Automate Your Cash Flow.
              </span>
            </h1>

            <p className="text-base text-white/70 leading-relaxed mb-8 max-w-lg">
              Join hundreds of independent freelancers, studios, and agencies who recover unpaid revenue without having awkward conversations.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm text-white/80">Smart polite-to-firm reminder escalation schedules</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm text-white/80">AI personalized reminder messages that preserve relationships</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-sm text-white/80">Instant checkout links supporting cards and direct bank transfers</span>
              </div>
            </div>
          </div>

          {/* Right Centered Form Card */}
          <div className="w-full lg:col-span-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto pt-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} PayChase Inc. Secured with 256-bit encryption.
      </footer>
    </div>
  );
};

export default AuthLayout;
