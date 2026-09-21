'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Home } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import LogoutButton from '@/components/auth/LogoutButton';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Clients', href: '/clients', icon: Users },
];

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Navigation tabs */}
        <div className="flex items-center gap-8">
          <Logo href="/dashboard" />

          {/* Desktop Nav Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] p-1 rounded-xl">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Quick shortcuts & User Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile nav links */}
          <div className="flex md:hidden items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-2 rounded-lg text-xs ${
                    isActive ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>

          <div className="h-5 w-px bg-white/10 hidden sm:block" />

          {/* Home Button linking to landing page */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white transition-all text-xs font-medium"
            title="Go to Homepage"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

export default AppNavbar;
