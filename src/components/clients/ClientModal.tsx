'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { clientSchema } from '@/lib/validations/client';
import { createClient, updateClient } from '@/app/actions/client';
import { ClientItem } from '@/lib/client-queries';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  clientToEdit?: ClientItem | null;
}

export default function ClientModal({
  isOpen,
  onClose,
  onSuccess,
  clientToEdit,
}: ClientModalProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const isEdit = Boolean(clientToEdit);

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setEmail(clientToEdit.email);
      setPhone(clientToEdit.phone || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
    }
    setError('');
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() ? phone.trim() : null,
    };

    // Client-side Zod check
    const validation = clientSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please check your inputs.');
      return;
    }

    startTransition(async () => {
      try {
        let res;
        if (isEdit && clientToEdit) {
          res = await updateClient(clientToEdit.id, payload);
        } else {
          res = await createClient(payload);
        }

        if (!res.success) {
          setError(res.error || 'Failed to save client.');
          return;
        }

        onSuccess(res.message || (isEdit ? 'Client updated!' : 'Client created!'));
        onClose();
      } catch {
        setError('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        <GlassCard className="p-6 sm:p-7 border-white/20 bg-slate-900/90 shadow-2xl relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isEdit ? 'Edit Client' : 'Add New Client'}
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                {isEdit
                  ? 'Update client contact information'
                  : 'Enter client details to send invoices and reminders'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Full Name / Company <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="Acme Corp or Jane Doe"
                value={name}
                onChange={(e) => {
                  // Do not allow numbers
                  const filtered = e.target.value.replace(/[0-9]/g, '');
                  setName(filtered);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              />
              <p className="text-[11px] text-white/40 mt-1">
                Letters and spaces only (numbers not allowed).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                maxLength={254}
                placeholder="billing@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Phone Number <span className="text-white/40 font-normal">(Optional)</span>
                </label>
                <span className="text-[11px] text-white/40 font-mono">
                  {phone.length}/10 digits
                </span>
              </div>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => {
                  // Only allow numbers, maximum 10 digits
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(digitsOnly);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition font-mono"
              />
              <p className="text-[11px] text-white/40 mt-1">
                Only numbers, exactly 10 digits (e.g. 9876543210).
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEdit ? 'Save Changes' : 'Create Client'}</span>
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
