import React from 'react';
import { notFound } from 'next/navigation';
import { Download } from 'lucide-react';
import { getPublicInvoiceDetail } from '@/lib/invoice-queries';
import Logo from '@/components/ui/Logo';
import PayInvoiceClient from '@/components/pay/PayInvoiceClient';

interface PayInvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PublicPayInvoicePage({ params }: PayInvoicePageProps) {
  const { id } = await params;
  const invoice = await getPublicInvoiceDetail(id);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative bg-slate-950 text-slate-100">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-[140px]" />
      </div>

      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6 mb-2 border-b border-white/10">
        <Logo href="/" />

        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Invoice (PDF)</span>
        </a>
      </header>

      {/* Main Payment & Invoice Content */}
      <main className="w-full max-w-4xl mx-auto flex-1 py-4 sm:py-6">
        <PayInvoiceClient invoice={invoice} />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto pt-6 text-center text-xs text-white/40 border-t border-white/5 mt-8">
        Powered by <strong>PayChase</strong> • Automated Payment Recovery & Invoicing
      </footer>
    </div>
  );
}
