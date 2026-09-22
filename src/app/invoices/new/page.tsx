import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/get-current-user';
import { getDbPool } from '@/lib/db';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import AppNavbar from '@/components/ui/AppNavbar';
import type { RowDataPacket } from 'mysql2/promise';

interface ClientRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
}

export default async function NewInvoicePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/invoices/new');
  }

  // Fetch only this user's clients and serialize to plain JS objects
  const pool = getDbPool();
  const [clientRows] = await pool.query<ClientRow[]>(
    'SELECT id, name, email FROM clients WHERE user_id = ? ORDER BY name ASC',
    [user.id]
  );

  const clients = clientRows.map((c) => ({
    id: String(c.id),
    name: String(c.name),
    email: String(c.email),
  }));

  return (
    <div className="min-h-dvh flex flex-col justify-between relative bg-[#030712]">
      <AppNavbar />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Invoice
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fill in the deliverables and amount. Automated reminders will trigger if unpaid.
          </p>
        </div>

        <InvoiceForm clients={clients} />
      </main>

      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 border-t border-white/5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PayChase • Create Invoice
      </footer>
    </div>
  );
}
