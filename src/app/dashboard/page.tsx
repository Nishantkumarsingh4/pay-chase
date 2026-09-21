import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/get-current-user';
import { getDashboardStats, formatCurrencyAmounts } from '@/lib/dashboard';
import AppNavbar from '@/components/ui/AppNavbar';
import StatCard from '@/components/dashboard/StatCard';
import GettingStarted from '@/components/dashboard/GettingStarted';
import QuickActions from '@/components/dashboard/QuickActions';
import ActionNeeded from '@/components/dashboard/ActionNeeded';
import RecentActivity from '@/components/dashboard/RecentActivity';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  // Extract first name cleanly
  const firstName = user.name.split(' ')[0] || user.name;

  // Single data-fetching function filtered strictly by user id
  const stats = await getDashboardStats(user.id);

  return (
    <div className="min-h-dvh flex flex-col justify-between relative bg-[#030712]">
      {/* Universal SaaS Navbar */}
      <AppNavbar />

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* 1. Greeting Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome back, {firstName}
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Overview
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Your real-time receivable health, overdue follow-ups, and payment activity.
            </p>
          </div>

          <QuickActions />
        </div>

        {/* 2. Four Stat Cards Grid (Desktop 25% each, Tablet 50%, Mobile 100%) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            label="Total Pending"
            value={formatCurrencyAmounts(stats.totalPending)}
            iconType="pending"
            variant="amber"
          />
          <StatCard
            label="Total Overdue"
            value={formatCurrencyAmounts(stats.totalOverdue)}
            iconType="overdue"
            variant="rose"
          />
          <StatCard
            label="Paid this month"
            value={formatCurrencyAmounts(stats.paidThisMonth)}
            iconType="paid"
            variant="emerald"
          />
          <StatCard
            label="Overdue Invoices"
            value={stats.overdueInvoiceCount.toString()}
            iconType="count"
            variant="rose"
          />
        </div>

        {/* 3. Getting Started Checklist Card (Only when setup incomplete or as clean banner) */}
        <GettingStarted
          hasClients={stats.clientCount > 0}
          hasInvoices={stats.invoiceCount > 0}
          hasSentInvoice={stats.hasSentInvoice}
        />

        {/* 4. Main Workflow Split: Action Needed (60% col-span-7) vs Recent Activity (40% col-span-5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7">
            <ActionNeeded invoices={stats.actionNeededInvoices} />
          </div>
          <div className="lg:col-span-5">
            <RecentActivity events={stats.recentActivities} />
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 border-t border-white/5 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>© {new Date().getFullYear()} PayChase • Automated Payment Recovery for Freelancers</div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>Encrypted DB Pool</span>
          <span>•</span>
          <span>Auto Chaser V2</span>
        </div>
      </footer>
    </div>
  );
}
