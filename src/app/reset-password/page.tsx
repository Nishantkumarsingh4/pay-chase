'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AuthLayout from '@/components/auth/AuthLayout';
import { resetPasswordSchema } from '@/lib/validations/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('No password reset token was provided in the link.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(data.error || 'This reset link is invalid or has expired.');
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError('Could not verify reset token. Please try again.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const parsed = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message || 'Please correct the fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Failed to update password');
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?reset=success');
        }, 2000);
      }
    } catch (err) {
      setSubmitError('Network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-6 sm:p-9 border-white/15 bg-slate-900/70 shadow-2xl">
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-white tracking-tight">Set new password</h2>
        <p className="text-xs sm:text-sm text-white/60 mt-1">
          Choose a strong password with letters and numbers.
        </p>
      </div>

      {verifying && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-white/60 text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Validating reset link...</span>
        </div>
      )}

      {!verifying && !tokenValid && (
        <div className="space-y-5">
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl text-sm text-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Invalid or Expired Link</p>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                {tokenError || 'This reset link has either expired (links expire after 30 minutes) or has already been used.'}
              </p>
            </div>
          </div>

          <Link
            href="/forgot-password"
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 flex items-center justify-center gap-2 transition"
          >
            <span>Request a new reset link</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {!verifying && tokenValid && success && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-sm text-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Password Changed Successfully!</p>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Your password has been updated and old sessions have been terminated. Redirecting to login...
            </p>
          </div>
        </div>
      )}

      {!verifying && tokenValid && !success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div
              role="alert"
              className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs sm:text-sm text-rose-300 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'Updating password...' : 'Set new password'}</span>
          </button>
        </form>
      )}
    </GlassCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter a new secure password for your PayChase account."
    >
      <Suspense fallback={<div className="p-8 text-center text-white/60 text-sm">Validating link...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
