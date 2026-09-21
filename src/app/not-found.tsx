import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Logo from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-white/10">
        <Logo href="/" />
        <Link
          href="/"
          className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors"
        >
          Return Home
        </Link>
      </header>

      {/* Main 404 Card */}
      <main className="w-full max-w-2xl mx-auto my-auto py-12 flex flex-col items-center text-center">
        <GlassCard className="p-8 sm:p-12 border-white/15 bg-slate-900/60 shadow-2xl relative w-full overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Big 404 Visual with Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <span className="text-8xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/30 via-white/10 to-transparent select-none font-mono">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl backdrop-blur-md">
                <FileQuestion className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Lost in the Payment Pipeline?
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
            The page, invoice, or resource you were looking for doesn&apos;t exist or might have been relocated.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition min-h-[44px]"
            >
              <Home className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-slate-300 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 transition min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Helpful Quick Links Footer */}
          <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-center gap-6 text-xs text-slate-400">
            <Link href="/invoices" className="hover:text-indigo-300 transition-colors">
              Invoices
            </Link>
            <span>•</span>
            <Link href="/clients" className="hover:text-indigo-300 transition-colors">
              Clients
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-indigo-300 transition-colors">
              Sign In
            </Link>
          </div>
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto pt-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PayChase • Automated Payment Recovery
      </footer>
    </div>
  );
}
