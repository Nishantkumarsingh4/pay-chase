'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

import { createInvoice, updateInvoice } from '@/app/actions/invoice';
import { calculateLineTotal, calculateTotal, formatInvoiceAmount } from '@/lib/invoice';
import { invoiceFormSchema } from '@/lib/validations/invoice';

export interface ClientOption {
  id: string;
  name: string;
  email: string;
}

export interface InvoiceFormInitialData {
  id?: string;
  clientId: string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  issueDate: string;
  dueDate: string;
  notes?: string | null;
  items: Array<{
    description: string;
    qty: number;
    price: number;
  }>;
}

interface InvoiceFormProps {
  clients: ClientOption[];
  initialData?: InvoiceFormInitialData;
  isEdit?: boolean;
}

export function InvoiceForm({ clients, initialData, isEdit = false }: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const [clientId, setClientId] = useState(initialData?.clientId || (clients[0]?.id || ''));
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>(
    initialData?.currency || 'INR'
  );
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || todayStr);
  const [dueDate, setDueDate] = useState(initialData?.dueDate || nextWeekStr);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [items, setItems] = useState(
    initialData?.items || [
      { description: 'Website design & development', qty: 1, price: 25000 },
    ]
  );

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Live Grand Total Calculation using Decimal logic
  const grandTotal = calculateTotal(items);

  const addItem = () => {
    if (items.length >= 50) return;
    setItems([...items, { description: '', qty: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (successMsg) return; // Prevent double submit
    setError('');
    setSuccessMsg('');

    const payload = {
      clientId,
      currency,
      issueDate,
      dueDate,
      notes: notes.trim() === '' ? null : notes,
      items: items.map((it) => ({
        description: it.description,
        qty: Number(it.qty) || 0,
        price: Number(it.price) || 0,
      })),
    };

    // Client-side quick check
    const validation = invoiceFormSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please correct the highlighted fields');
      return;
    }

    startTransition(async () => {
      if (isEdit && initialData?.id) {
        const res = await updateInvoice(initialData.id, payload as any);
        if (!res.success) {
          setError(res.error || 'Failed to update invoice');
        } else {
          setSuccessMsg('Invoice updated successfully! Redirecting...');
          setTimeout(() => {
            router.push(`/invoices/${initialData.id}`);
            router.refresh();
          }, 1500);
        }
      } else {
        const res = await createInvoice(payload as any);
        if (!res.success) {
          setError(res.error || 'Failed to create invoice');
        } else {
          setSuccessMsg(
            `Invoice ${res.invoiceNumber || ''} created successfully! Redirecting...`
          );
          setTimeout(() => {
            router.push(`/invoices/${res.invoiceId}`);
            router.refresh();
          }, 1200);
        }
      }
    });
  };


  if (clients.length === 0) {
    return (
      <GlassCard className="p-8 text-center max-w-lg mx-auto border-white/15 bg-slate-900/60">
        <h2 className="text-xl font-bold text-white mb-2">No Clients Found</h2>
        <p className="text-sm text-white/60 mb-6">
          You need at least one client in your account before creating an invoice.
        </p>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition"
        >
          <span>Add your first client</span>
        </Link>
      </GlassCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header action bar */}
      <div className="flex items-center justify-between">
        <Link
          href={isEdit && initialData?.id ? `/invoices/${initialData.id}` : '/invoices'}
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-white/70 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white/70 hover:text-white border border-white/10 bg-white/5 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending || !!successMsg}
            className={`px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white transition flex items-center gap-2 cursor-pointer shadow-lg ${
              successMsg
                ? 'bg-emerald-600 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-indigo-500/25 disabled:opacity-50'
            }`}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {successMsg && <CheckCircle2 className="w-4 h-4 text-emerald-200" />}
            <span>
              {isPending
                ? 'Issuing & Sending Email...'
                : successMsg
                ? 'Sent! Redirecting...'
                : isEdit
                ? 'Update Invoice'
                : 'Save & Issue Invoice'}
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner with 3s Progress Indicator */}
      {successMsg && (
        <div className="relative overflow-hidden p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-emerald-100 block">{successMsg}</span>
            <span className="text-[11px] text-emerald-300/80">Taking you to invoice details in 3 seconds...</span>
          </div>
          {/* Animated 3-second countdown progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-emerald-400/80 w-full animate-[shrink_3s_linear_forwards]" />
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs sm:text-sm text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}


      {/* Primary Details Card */}
      <GlassCard className="p-6 sm:p-8 border-white/15 bg-slate-900/60 shadow-xl space-y-5">
        <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
          Invoice Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Client Selection */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Client
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/15 text-white text-sm focus:outline-none focus:border-indigo-400"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/15 text-white text-sm focus:outline-none focus:border-indigo-400"
            >
              <option value="INR" className="bg-slate-900 text-white">INR (₹)</option>
              <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
              <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
              <option value="GBP" className="bg-slate-900 text-white">GBP (£)</option>
            </select>
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Issue Date
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/15 text-white text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              min={issueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/15 text-white text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>
      </GlassCard>

      {/* Dynamic Item Rows Card */}
      <GlassCard className="p-6 sm:p-8 border-white/15 bg-slate-900/60 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white">Line Items</h3>
          <span className="text-xs text-white/50">{items.length} / 50 rows</span>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const lineTotal = calculateLineTotal(item.qty, item.price);
            return (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition"
              >
                {/* Description */}
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1 sm:hidden">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    placeholder="Deliverable or milestone description"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>

                {/* Qty */}
                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1 sm:hidden">
                    Qty
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100000"
                    required
                    placeholder="1"
                    value={item.qty}
                    onChange={(e) => updateItem(index, 'qty', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>

                {/* Price */}
                <div className="col-span-5 sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1 sm:hidden">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100000000"
                    required
                    placeholder="0.00"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>

                {/* Line Total & Remove button */}
                <div className="col-span-3 sm:col-span-2 flex items-center justify-between gap-2">
                  <div className="text-right flex-1 truncate">
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      {formatInvoiceAmount(lineTotal, currency)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-20 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={addItem}
            disabled={items.length >= 50}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item Row</span>
          </button>

          {/* Live Grand Total Display */}
          <div className="text-right">
            <span className="text-xs text-white/50 uppercase tracking-wider block">
              Grand Total
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {formatInvoiceAmount(grandTotal, currency)}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Notes Card */}
      <GlassCard className="p-6 sm:p-8 border-white/15 bg-slate-900/60 shadow-xl space-y-3">
        <div>
          <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2.5">
            Payment Notes & Bank Instructions (Optional)
          </label>
          <textarea
          rows={3}
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="E.g. Bank Account details, UPI ID, or thank you note."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div className="text-right text-[11px] text-white/40">{notes.length} / 1000</div>
      </GlassCard>
    </form>
  );
}

export default InvoiceForm;
