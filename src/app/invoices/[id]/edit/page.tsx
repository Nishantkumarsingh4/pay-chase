import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/get-current-user';
import { getInvoiceDetail } from '@/lib/invoice-queries';
import { getDbPool } from '@/lib/db';
import LogoutButton from '@/components/auth/LogoutButton';
import { InvoiceForm, ClientOption, InvoiceFormInitialData } from '@/components/invoices/InvoiceForm';

interface EditInvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // 1. Fetch invoice with strict user ownership
  const invoice = await getInvoiceDetail(id, user.id);
  if (!invoice) {
    notFound();
  }

  // 2. Server-side rule: PAID and CANCELLED invoices cannot be edited
  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
    redirect(`/invoices/${invoice.id}`);
  }

  // 3. Fetch user's clients
  const pool = getDbPool();
  const [clientRows] = await pool.query<any[]>(
    'SELECT id, name, email FROM clients WHERE user_id = ? ORDER BY name ASC',
    [user.id]
  );

  const clients: ClientOption[] = clientRows.map((c) => ({
    id: String(c.id),
    name: String(c.name),
    email: String(c.email),
  }));

  // 4. Prepare initial data
  const initialData: InvoiceFormInitialData = {
    id: invoice.id,
    clientId: invoice.clientId,
    currency: invoice.currency as 'INR' | 'USD' | 'EUR' | 'GBP',
    issueDate: invoice.issueDate instanceof Date ? invoice.issueDate.toISOString().split('T')[0] : String(invoice.issueDate).split('T')[0],
    dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString().split('T')[0] : String(invoice.dueDate).split('T')[0],
    notes: invoice.notes,
    items: invoice.items.map((item) => ({
      description: item.description,
      qty: Number(item.qty),
      price: Number(item.price),
    })),
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Top Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 mb-2 border-b border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl tracking-tight group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span>
            PayChase<span className="text-indigo-400">.</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href={`/invoices/${invoice.id}`}
            className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition"
          >
            Cancel Edit
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-5xl mx-auto flex-1 py-4 sm:py-6">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Invoice Editor
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Edit Invoice {invoice.number}
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Update invoice details, line items, and schedule for {invoice.clientName}.
          </p>
        </div>

        <InvoiceForm
          clients={clients}
          initialData={initialData}
          isEdit={true}
        />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto pt-6 text-center text-xs text-white/40 border-t border-white/5 mt-8">
        &copy; {new Date().getFullYear()} PayChase Inc. All rights reserved.
      </footer>
    </div>
  );
}
