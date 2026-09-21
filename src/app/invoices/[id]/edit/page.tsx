import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { getCurrentUser } from '@/lib/get-current-user';
import { getInvoiceDetail } from '@/lib/invoice-queries';
import { getDbPool } from '@/lib/db';
import AppNavbar from '@/components/ui/AppNavbar';
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
    <div className="min-h-dvh flex flex-col justify-between relative bg-[#030712]">
      <AppNavbar />

      {/* Main Form Container */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Invoice Editor
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Edit Invoice {invoice.number}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
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
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 border-t border-white/5 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} PayChase Inc. All rights reserved.
      </footer>
    </div>
  );
}
