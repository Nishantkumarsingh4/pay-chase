'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AuthLayout from '@/components/auth/AuthLayout';
import { loginSchema } from '@/lib/validations/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const resetSuccess = searchParams.get('reset') === 'success';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setLoading(false);
      } else {
        const target =
          callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
            ? callbackUrl
            : '/dashboard';
        router.push(target);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-6 sm:p-9 border-white/15 bg-slate-900/70 shadow-2xl">
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-white tracking-tight">Log in to PayChase</h2>
        <p className="text-xs sm:text-sm text-white/60 mt-1">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Create an account
          </Link>
        </p>
      </div>

      {resetSuccess && (
        <div className="mb-5 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs sm:text-sm text-emerald-300 flex items-center gap-2">
          <span>Your password was reset successfully. Please log in with your new password.</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs sm:text-sm text-rose-300 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5"
          >
            Email Address
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-white/80 uppercase tracking-wider"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Verifying...' : 'Sign in'}</span>
        </button>
      </form>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage your active invoices and automated follow-ups."
    >
      <Suspense fallback={<div className="p-8 text-center text-white/60 text-sm">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
