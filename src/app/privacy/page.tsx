import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Eye, FileText, Database } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Logo from '@/components/ui/Logo';

export const metadata = {
  title: 'Privacy Policy — PayChase',
  description: 'Learn how PayChase protects your data, invoice information, and payment records.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 21, 2026';

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy & Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Last updated: <span className="text-slate-300">{lastUpdated}</span>
          </p>
        </div>

        <GlassCard className="p-6 sm:p-10 border-white/10 bg-slate-900/50 shadow-2xl space-y-8 text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">01.</span> Introduction
            </h2>
            <p>
              At <strong>PayChase</strong>, we respect your privacy and are committed to safeguarding
              your personal and financial metadata. This Privacy Policy explains how we collect, use,
              disclose, and protect information when you use our automated payment recovery and
              invoicing platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">02.</span> Information We Collect
            </h2>
            <p>We collect only the information necessary to provide efficient invoice chasing services:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                <strong className="text-white">Account Information:</strong> Name, email address, password hash, and optional profile data during registration.
              </li>
              <li>
                <strong className="text-white">Client & Invoice Data:</strong> Client contact names, email addresses, phone numbers, deliverable descriptions, line-item totals, and invoice due dates.
              </li>
              <li>
                <strong className="text-white">Transaction Metadata:</strong> Payment status flags, gateway transaction identifiers, and timestamps. We <em>never</em> store full credit/debit card numbers or CVVs on our servers.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">03.</span> How We Use Your Information
            </h2>
            <p>We use your information strictly for core service delivery:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>To generate, dispatch, and track itemized invoice links.</li>
              <li>To automate polite, firm, and final reminder sequences to your designated clients.</li>
              <li>To maintain audit logging of invoice status transitions and payment receipts.</li>
              <li>To detect and prevent fraudulent requests, bots, and unauthorized access.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">04.</span> Data Security & Storage
            </h2>
            <p>
              All traffic between your browser and our infrastructure is encrypted using industry-standard TLS 1.3 encryption. Passwords are salted and hashed using Argon2/Bcrypt. Databases are hosted within secure, private network enclaves with automated daily snapshots and restricted IP access.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">05.</span> Sharing & Third Parties
            </h2>
            <p>
              PayChase does not sell, rent, or trade your or your clients’ personal information to third parties. Data is only communicated with essential infrastructure providers (such as transactional email dispatchers and cloud hosting providers) bound by strict confidentiality agreements.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">06.</span> Your Data Rights
            </h2>
            <p>
              You maintain complete ownership of your data. You may export, modify, or permanently delete your client records and invoices at any time directly through the dashboard. To request a complete account purge, contact our privacy team at{' '}
              <a href="mailto:privacy@paychase.app" className="text-indigo-400 underline hover:text-indigo-300">
                privacy@paychase.app
              </a>.
            </p>
          </section>
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-white/5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PayChase Inc. All rights reserved.
      </footer>
    </div>
  );
}
