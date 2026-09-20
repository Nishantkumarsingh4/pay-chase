import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/get-current-user';
import { getClientsList } from '@/lib/client-queries';
import LogoutButton from '@/components/auth/LogoutButton';
import ClientsList from '@/components/clients/ClientsList';

interface ClientsPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

import Logo from '@/components/ui/Logo';

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/clients');
  }

  const { q, page } = await searchParams;
  const currentPage = parseInt(page || '1', 10) || 1;

  const { clients, totalCount, totalPages } = await getClientsList(user.id, {
    search: q,
    page: currentPage,
    limit: 10,
  });

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 mb-2 border-b border-white/10">
        <Logo href="/dashboard" />


        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition"
          >
            Dashboard
          </Link>
          <Link
            href="/invoices"
            className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition"
          >
            Invoices
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-6xl mx-auto flex-1 py-4 sm:py-6">
        <ClientsList
          clients={clients}
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={currentPage}
          searchQuery={q || ''}
        />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-white/10 text-center text-xs text-white/40">
        &copy; {new Date().getFullYear()} PayChase Inc. All rights reserved.
      </footer>
    </div>
  );
}
