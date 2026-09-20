'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AuthLayout from '@/components/auth/AuthLayout';
import { forgotPasswordSchema } from '@/lib/validations/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message || 'Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), honeypot }),
      });

      const data = await res.json();
      if (!res.ok && data.error && res.status === 429) {
        setErrorMessage(data.error);
        setLoading(false);
        return;
      }

      // Always show generic success to prevent email enumeration
      setSubmitted(true);
      setLoading(false);
    } catch (err) {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your account email to receive a password reset link."
    >
      <GlassCard className="p-6 sm:p-9 border-white/15 bg-slate-900/70 shadow-2xl">
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white tracking-tight">Forgot password?</h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Remember your credentials?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Back to login
            </Link>
          </p>
        </div>

        {/* Generic Success Message */}
        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-sm text-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Check your email inbox</p>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  If an account exists for this email, we have sent a password reset link. Please check your spam folder if it doesn&apos;t arrive within a few minutes.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-sm flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs sm:text-sm text-rose-300 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Honeypot */}
            <input
              type="text"
              name="honeypot"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5"
              >
                Account Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Sending link...' : 'Send reset link'}</span>
            </button>
          </form>
        )}
      </GlassCard>
    </AuthLayout>
  );
}
