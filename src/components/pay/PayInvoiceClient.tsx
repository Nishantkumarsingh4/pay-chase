'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Download, 
  Loader2, 
  Receipt, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { formatInvoiceAmount, calculateLineTotal } from '@/lib/invoice';
import { 
  processPublicPayment, 
  createRazorpayOrder, 
  verifyAndRecordRazorpayPayment,
  createStripeCheckoutSession,
  confirmStripePayment
} from '@/app/actions/invoice';
import GlassCard from '@/components/ui/GlassCard';
import type { InvoiceDetail } from '@/lib/invoice-queries';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PayInvoiceClientProps {
  invoice: InvoiceDetail;
}

const statusBadgeStyles = {
  PAID: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20 shadow-lg',
  PENDING: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  OVERDUE: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  CANCELLED: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

// Dynamically load Razorpay checkout SDK
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PayInvoiceClient({ invoice }: PayInvoiceClientProps) {
  const [isPaid, setIsPaid] = useState(invoice.status === 'PAID');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justCompletedTxn, setJustCompletedTxn] = useState<string | null>(null);

  const pdfUrl = `/api/invoices/${invoice.id}/pdf`;

  // Auto-verify Stripe session if redirected back from Stripe Checkout
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSessionId = urlParams.get('stripe_session_id');

    if (stripeSessionId && !isPaid) {
      setIsProcessing(true);
      confirmStripePayment(invoice.id, stripeSessionId)
        .then((res) => {
          if (res.success) {
            setIsPaid(true);
            if (res.txnId) setJustCompletedTxn(res.txnId);
            window.history.replaceState({}, '', `/pay/${invoice.id}`);
          } else {
            setErrorMessage(res.error || 'Failed to verify Stripe payment');
          }
        })
        .catch((err) => {
          setErrorMessage(err.message || 'Payment verification failed');
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  }, [invoice.id, isPaid]);

  const handlePayNow = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // 1. Try Stripe Checkout (Zero PAN Card required)
      const stripeRes = await createStripeCheckoutSession(invoice.id);
      if (stripeRes.success && stripeRes.url) {
        window.location.href = stripeRes.url;
        return;
      }

      if (!stripeRes.success && stripeRes.error && stripeRes.error !== 'STRIPE_NOT_CONFIGURED') {
        setErrorMessage(`Payment Gateway Error: ${stripeRes.error}`);
        setIsProcessing(false);
        return;
      }

      // 2. Try Razorpay (if configured)
      const orderRes = await createRazorpayOrder(invoice.id);
      if (orderRes.success && orderRes.orderId && orderRes.keyId) {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error('Razorpay SDK failed to load.');
        }

        const options = {
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency,
          name: 'PayChase',
          description: `Invoice ${invoice.number} Payment`,
          order_id: orderRes.orderId,
          prefill: {
            name: invoice.clientName,
            email: invoice.clientEmail,
            contact: invoice.clientPhone || '',
          },
          theme: {
            color: '#6366f1',
          },
          handler: async function (response: any) {
            try {
              setIsProcessing(true);
              const verifyRes = await verifyAndRecordRazorpayPayment({
                invoiceId: invoice.id,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });

              if (verifyRes.success) {
                setIsPaid(true);
                setJustCompletedTxn(response.razorpay_payment_id);
              } else {
                setErrorMessage(verifyRes.error || 'Payment verification failed');
              }
            } catch (err: any) {
              setErrorMessage(err.message || 'Payment recording failed');
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setErrorMessage(resp.error?.description || 'Payment was unsuccessful or cancelled.');
          setIsProcessing(false);
        });
        rzp.open();
        return;
      }

      // If neither gateway succeeded, show error message instead of auto-completing
      setErrorMessage(
        stripeRes.error || 
        'Payment gateway could not be initialized. Please try again or contact support.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Dynamic Alert Banner when Paid */}
      {isPaid && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-emerald-900/30 to-slate-950/60 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-emerald-950/40 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base text-emerald-200">
                Payment Completed Successfully!
              </p>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                {justCompletedTxn 
                  ? `Transaction Ref: ${justCompletedTxn} • Receipt ready for instant download.`
                  : 'This invoice is marked as PAID in full. Your receipt has been archived.'}
              </p>
            </div>
          </div>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Paid Invoice (PDF)</span>
          </a>
        </div>
      )}

      {/* Main Glass Invoice Card */}
      <GlassCard className="p-6 sm:p-8 space-y-8 border-white/10 bg-slate-900/60 backdrop-blur-xl">
        {/* Header Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Invoice from {invoice.userName}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs text-white/50">{invoice.userEmail}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5 flex items-center gap-3">
              <span>{invoice.number}</span>
              {isPaid && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                  Paid
                </span>
              )}
            </h1>
            <p className="text-xs text-white/60 mt-1">
              Billed to <strong className="text-white">{invoice.clientName}</strong> ({invoice.clientEmail})
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md self-start sm:self-auto ${
                isPaid ? statusBadgeStyles.PAID : statusBadgeStyles[invoice.status]
              }`}
            >
              {isPaid ? 'PAID' : invoice.status}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-white/60 mt-1">
              <Calendar className="w-3.5 h-3.5 text-white/40" />
              <span>Due: {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(invoice.dueDate)}</span>
            </div>
          </div>
        </div>

        {/* Amount & Direct Payment Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              {isPaid ? 'Total Amount Paid' : 'Total Amount Due'}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white mt-1">
              {formatInvoiceAmount(invoice.total, invoice.currency)}
            </div>
            <p className="text-[11px] text-white/50 mt-1">
              {isPaid 
                ? 'Payment cleared and receipt available below' 
                : '100% secure encrypted checkout via PayChase'}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            {isPaid ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Paid Invoice (PDF)</span>
                </a>
              </div>
            ) : invoice.status !== 'CANCELLED' ? (
              <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay {formatInvoiceAmount(invoice.total, invoice.currency)} Now</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-white/40 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Instant automated receipt generated upon payment
                </span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50">
                This invoice has been cancelled.
              </div>
            )}
          </div>
        </div>

        {/* Error message callout if payment fails */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-white/60 hover:text-white underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Line Items Table */}
        <div className="pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3 px-1">
            Items & Deliverables
          </h3>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.01]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/50 bg-white/[0.02]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 text-white/40 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-white">{item.description}</td>
                    <td className="py-3 px-4 text-right">{item.qty}</td>
                    <td className="py-3 px-4 text-right">
                      {formatInvoiceAmount(item.price, invoice.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      {formatInvoiceAmount(calculateLineTotal(item.qty, item.price), invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal & Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
            <div className="flex items-center gap-2">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>View Full Document / Print</span>
                <ExternalLink className="w-3 h-3 text-white/40" />
              </a>
            </div>

            <div className="w-full sm:w-64 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between text-xs text-white/60">
                <span>Subtotal</span>
                <span>{formatInvoiceAmount(invoice.total, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-white/60">
                <span>Taxes & Fees</span>
                <span>{formatInvoiceAmount(0, invoice.currency)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-white text-sm">
                  {isPaid ? 'Total Paid' : 'Grand Total'}
                </span>
                <span className={`text-lg font-black ${isPaid ? 'text-emerald-400' : 'text-white'}`}>
                  {formatInvoiceAmount(invoice.total, invoice.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40 block mb-1.5">
                Notes / Payment Instructions
              </span>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
