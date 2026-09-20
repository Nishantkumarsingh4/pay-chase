'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AuthLayout from '@/components/auth/AuthLayout';
import { signupSchema } from '@/lib/validations/auth';

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    honeypot: '', // bot trap
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Password strength calculations
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculateStrength(formData.password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});

    // Client-side Zod validation
    const parsed = signupSchema.safeParse(formData);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setFieldErrors(flattened);
      const firstIssue = parsed.error.issues[0];
      setErrorMessage(firstIssue?.message || 'Please correct the highlighted fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to create account');
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setLoading(false);
      } else {
        setSuccessMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (err) {
      setErrorMessage('Network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join PayChase to automate invoice tracking and get paid on time."
    >
      <GlassCard className="p-6 sm:p-9 border-white/15 bg-slate-900/70 shadow-2xl">
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Global Error Banner */}
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

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs sm:text-sm text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden Honeypot to catch automated spam bots */}
          <input
            type="text"
            name="honeypot"
            value={formData.honeypot}
            onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              autoComplete="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Sarah Jenkins"
              aria-invalid={!!fieldErrors.name}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
            />
            {fieldErrors.name && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Email Address */}
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="sarah@designagency.com"
              aria-invalid={!!fieldErrors.email}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
            />
            {fieldErrors.email && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.email[0]}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 8 characters (letter + number)"
                aria-invalid={!!fieldErrors.password}
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

            {/* Live Password Strength Meter */}
            {formData.password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`flex-1 transition-colors duration-300 ${
                        strength >= lvl ? strengthColors[strength - 1] : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-white/50">
                  <span>Strength: {strengthLabels[Math.max(0, strength - 1)]}</span>
                  <span>Min 8 chars, 1 letter, 1 number</span>
                </div>
              </div>
            )}
            {fieldErrors.password && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.password[0]}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Repeat your password"
              aria-invalid={!!fieldErrors.confirmPassword}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.confirmPassword[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'Creating account...' : 'Create free account'}</span>
          </button>
        </form>
      </GlassCard>
    </AuthLayout>
  );
}
