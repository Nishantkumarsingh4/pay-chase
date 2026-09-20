import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/get-current-user';
import { getDashboardStats, formatCurrencyAmounts } from '@/lib/dashboard';
import LogoutButton from '@/components/auth/LogoutButton';
import StatCard from '@/components/dashboard/StatCard';
import GettingStarted from '@/components/dashboard/GettingStarted';
import QuickActions from '@/components/dashboard/QuickActions';
import ActionNeeded from '@/components/dashboard/ActionNeeded';
import RecentActivity from '@/components/dashboard/RecentActivity';
import Logo from '@/components/ui/Logo';

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
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 mb-2 border-b border-white/10">
        <Logo href="/dashboard" />

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/clients"
            className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition hidden sm:block"
          >
            Clients
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl mx-auto my-auto py-6 space-y-8">
        {/* 1. Greeting Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm sm:text-base text-white/70 mt-1">
              Here is where your money stands today.
            </p>
          </div>

          <QuickActions />
        </div>

        {/* 2. Four Stat Cards Grid */}
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
            label="Overdue invoices"
            value={stats.overdueInvoiceCount.toString()}
            iconType="count"
            variant="rose"
          />
        </div>

        {/* 3. Getting Started Checklist Card */}
        <GettingStarted
          hasClients={stats.clientCount > 0}
          hasInvoices={stats.invoiceCount > 0}
          hasSentInvoice={stats.hasSentInvoice}
        />

        {/* 4. Action Needed & Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <ActionNeeded invoices={stats.actionNeededInvoices} />
          <RecentActivity events={stats.recentActivities} />
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-white/10 text-center text-xs text-white/40">
        © {new Date().getFullYear()} PayChase • Automated Payment Recovery for Creators
      </footer>
    </div>
  );
}
