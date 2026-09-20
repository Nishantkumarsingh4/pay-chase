import React from 'react';
import GlassCard from '@/components/ui/GlassCard';

export default function DashboardLoading() {
  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative animate-pulse">
      {/* Top Bar Skeleton */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10" />
          <div className="w-24 h-5 rounded bg-white/10" />
        </div>
        <div className="w-24 h-9 rounded-xl bg-white/10" />
      </header>

      {/* Main Skeleton */}
      <main className="w-full max-w-6xl mx-auto my-auto py-6 space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="w-64 h-8 rounded-lg bg-white/10" />
            <div className="w-48 h-4 rounded bg-white/10" />
          </div>
          <div className="w-40 h-10 rounded-xl bg-white/10" />
        </div>

        {/* 4 Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <GlassCard key={i} className="p-5 sm:p-6 border-white/10 bg-slate-900/40">
              <div className="flex justify-between items-center mb-3">
                <div className="w-24 h-3.5 rounded bg-white/10" />
                <div className="w-8 h-8 rounded-lg bg-white/10" />
              </div>
              <div className="w-20 h-7 rounded bg-white/10" />
            </GlassCard>
          ))}
        </div>

        {/* Checklist Skeleton */}
        <GlassCard className="p-6 border-white/10 bg-slate-900/40 space-y-4">
          <div className="w-48 h-5 rounded bg-white/10" />
          <div className="w-full h-2 rounded-full bg-white/10" />
          <div className="space-y-3 pt-2">
            <div className="w-full h-14 rounded-xl bg-white/5" />
            <div className="w-full h-14 rounded-xl bg-white/5" />
            <div className="w-full h-14 rounded-xl bg-white/5" />
          </div>
        </GlassCard>

        {/* Two Columns Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6 border-white/10 bg-slate-900/40 h-56 flex flex-col justify-center items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10" />
            <div className="w-32 h-4 rounded bg-white/10" />
          </GlassCard>
          <GlassCard className="p-6 border-white/10 bg-slate-900/40 h-56 flex flex-col justify-center items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10" />
            <div className="w-32 h-4 rounded bg-white/10" />
          </GlassCard>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-white/10 text-center">
        <div className="w-48 h-3 mx-auto rounded bg-white/5" />
      </footer>
    </div>
  );
}
