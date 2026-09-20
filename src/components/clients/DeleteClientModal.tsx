'use client';

import React, { useState, useTransition } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { deleteClient } from '@/app/actions/client';
import { ClientItem } from '@/lib/client-queries';

interface DeleteClientModalProps {
  isOpen: boolean;
  client: ClientItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function DeleteClientModal({
  isOpen,
  client,
  onClose,
  onSuccess,
}: DeleteClientModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  if (!isOpen || !client) return null;

  const hasInvoices = client.invoiceCount > 0;

  const handleDelete = () => {
    if (hasInvoices) {
      setError('This client has invoices and cannot be deleted.');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        const res = await deleteClient(client.id);
        if (!res.success) {
          setError(res.error || 'Failed to delete client.');
          return;
        }

        onSuccess(res.message || 'Client deleted successfully.');
        onClose();
      } catch {
        setError('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        <GlassCard className="p-6 sm:p-7 border-rose-500/30 bg-slate-900/95 shadow-2xl relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Delete Client
              </h3>
              <p className="text-xs text-white/60">
                Are you sure you want to delete <strong className="text-white">{client.name}</strong>?
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {hasInvoices ? (
            <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              This client is linked to <strong>{client.invoiceCount}</strong> invoice(s). You must remove or cancel all linked invoices before deleting this client.
            </div>
          ) : (
            <p className="text-xs text-white/60 mb-5 leading-relaxed">
              This action cannot be undone. All contact details for this client will be permanently removed.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || hasInvoices}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Delete Client</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
