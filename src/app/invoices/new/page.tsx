import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/get-current-user';
import { getDbPool } from '@/lib/db';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import LogoutButton from '@/components/auth/LogoutButton';
import type { RowDataPacket } from 'mysql2/promise';

interface ClientRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
}

import Logo from '@/components/ui/Logo';

export default async function NewInvoicePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/invoices/new');
  }

  // Fetch only this user's clients
  const pool = getDbPool();
  const [clients] = await pool.query<ClientRow[]>(
    'SELECT id, name, email FROM clients WHERE user_id = ? ORDER BY name ASC',
    [user.id]
  );

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 mb-2 border-b border-white/10">
        <Logo href="/dashboard" />


        <div className="flex items-center gap-4">
          <Link
            href="/invoices"
            className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition"
          >
            All Invoices
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto my-auto py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Invoice
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Fill in the deliverables and amount. Automated reminders will trigger if unpaid.
          </p>
        </div>

        <InvoiceForm clients={clients} />
      </main>

      <footer className="w-full max-w-5xl mx-auto pt-6 border-t border-white/10 text-center text-xs text-white/40">
        © {new Date().getFullYear()} PayChase • Create Invoice
      </footer>
    </div>
  );
}
