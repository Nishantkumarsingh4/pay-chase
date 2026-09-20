'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error securely server-side / analytics without exposing details to user
    console.error('[DASHBOARD_ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full p-8 text-center border-white/15 bg-slate-900/80 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-xs sm:text-sm text-white/60 mb-6 leading-relaxed">
          We encountered an issue loading your dashboard. Your account and data remain safe.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try again</span>
          </button>
          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl font-medium text-xs sm:text-sm text-white/70 hover:text-white border border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            <span>Back to home</span>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
