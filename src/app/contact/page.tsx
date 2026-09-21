'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Mail, MessageSquare, Clock, ArrowLeft, Send, CheckCircle2, Sparkles, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Logo from '@/components/ui/Logo';
import { submitSupportMessageAction } from '@/app/actions/support';

export default function ContactSupportPage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    startTransition(async () => {
      const res = await submitSupportMessageAction(formData);
      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.error || 'Failed to send message.');
      }
    });
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-[#030712] relative">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo href="/" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help & Customer Success</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Can We Help You?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Have questions about invoice automation, payment gateway integrations, or account setup? Our engineering and support crew is here for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Support Channels & Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard className="p-6 border-white/10 bg-slate-900/50 shadow-xl space-y-5">
              <h2 className="text-base font-bold text-white tracking-tight">
                Direct Channels
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Email Support</span>
                    <a
                      href="mailto:support@paychase.app"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-mono"
                    >
                      support@paychase.app
                    </a>
                    <p className="text-[11px] text-slate-500 mt-0.5">Average response under 4 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Operational Hours</span>
                    <p className="text-xs text-slate-300">Monday — Saturday</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">9:00 AM – 8:00 PM IST (UTC +5:30)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Frequently Asked</span>
                    <Link
                      href="/#faq"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Browse FAQ Knowledge Base &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Quick Tip Box */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200/90 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Quick Tip:</strong> If your inquiry is regarding a specific invoice, please include your Invoice Number (e.g. <code>INV-001</code>) in your message.
              </span>
            </div>
          </div>

          {/* Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <GlassCard className="p-6 sm:p-8 border-white/10 bg-slate-900/60 shadow-2xl">
              {submitted ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Message Dispatched!</h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                    Thank you, <strong className="text-white">{formData.name}</strong>. Our support desk has received your request and will follow up with you at <strong className="text-white">{formData.email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 transition cursor-pointer"
                  >
                    Send another query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Your Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isPending}
                        value={formData.name}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[0-9]/g, '');
                          setFormData({ ...formData, name: val });
                        }}
                        placeholder="Nishant Kumar"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-400 transition disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        disabled={isPending}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nishant@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-400 transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Subject / Topic <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isPending}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Question about automated reminder schedules"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-400 transition disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      How can we assist you? <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      disabled={isPending}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your question or issue in detail..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-400 transition disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isPending ? 'Sending...' : 'Send Message to Support'}</span>
                  </button>
                </form>
              )}
            </GlassCard>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-white/5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PayChase Inc. All rights reserved.
      </footer>
    </div>
  );
}
