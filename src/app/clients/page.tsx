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

import AppNavbar from '@/components/ui/AppNavbar';

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
    <div className="min-h-dvh flex flex-col justify-between relative bg-[#030712]">
      {/* Universal SaaS Navbar */}
      <AppNavbar />

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <ClientsList
          clients={clients}
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={currentPage}
          searchQuery={q || ''}
        />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 border-t border-white/5 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} PayChase Inc. All rights reserved.
      </footer>
    </div>
  );
}
