'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Edit,
  Download,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { markInvoiceAsPaid, cancelInvoice, sendInvoiceEmailAction } from '@/app/actions/invoice';

interface InvoiceDetailActionsProps {
  invoiceId: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  isSent?: boolean;
}

export function InvoiceDetailActions({ invoiceId, status, isSent = false }: InvoiceDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditable = status === 'PENDING' || status === 'OVERDUE';
  const canMarkPaid = status === 'PENDING' || status === 'OVERDUE';
  const canCancel = status === 'PENDING' || status === 'OVERDUE';

  const handleSendEmail = () => {
    setError('');
    setSuccess('');
    startTransition(async () => {
      const res = await sendInvoiceEmailAction(invoiceId);
      if (!res.success) {
        setError(res.error || 'Failed to send invoice email.');
      } else {
        setSuccess(res.message || 'Invoice email sent successfully!');
        router.refresh();
      }
    });
  };

  const handleMarkPaid = () => {
    if (!confirm('Are you sure you want to mark this invoice as paid manually?')) return;
    setError('');
    startTransition(async () => {
      const res = await markInvoiceAsPaid(invoiceId);
      if (!res.success) {
        setError(res.error || 'Failed to mark as paid');
      } else {
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this invoice? Cancelled invoices cannot be reopened.'))
      return;
    setError('');
    startTransition(async () => {
      const res = await cancelInvoice(invoiceId);
      if (!res.success) {
        setError(res.error || 'Failed to cancel invoice');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Edit Invoice */}
        {isEditable && (
          <Link
            href={`/invoices/${invoiceId}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>
        )}

        {/* Mark as paid */}
        {canMarkPaid && (
          <button
            type="button"
            onClick={handleMarkPaid}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition disabled:opacity-50 cursor-pointer"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Mark as paid</span>
          </button>
        )}

        {/* Cancel Invoice */}
        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition disabled:opacity-50 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel invoice</span>
          </button>
        )}

        {/* Download PDF Button */}
        <a
          href={`/api/invoices/${invoiceId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </a>

        {/* Send / Resend Email Action Button */}
        <button
          type="button"
          onClick={handleSendEmail}
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white border transition disabled:opacity-50 cursor-pointer ${
            isSent
              ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white/90'
              : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 border-white/15'
          }`}
          title={isSent ? 'Invoice was already emailed to client. Click to send again.' : 'Send invoice email to client'}
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{isSent ? 'Resend email' : 'Send email'}</span>
        </button>
      </div>
    </div>
  );
}

export default InvoiceDetailActions;

