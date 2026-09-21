import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle2, Scale, AlertOctagon } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Logo from '@/components/ui/Logo';

export const metadata = {
  title: 'Terms of Service — PayChase',
  description: 'Review the legal terms and service guidelines governing your use of PayChase.',
};

export default function TermsOfServicePage() {
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
            <Scale className="w-3.5 h-3.5" />
            <span>Service Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Effective Date: <span className="text-slate-300">{lastUpdated}</span>
          </p>
        </div>

        <GlassCard className="p-6 sm:p-10 border-white/10 bg-slate-900/50 shadow-2xl space-y-8 text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">01.</span> Agreement to Terms
            </h2>
            <p>
              By accessing or using <strong>PayChase</strong> (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not create an account or use the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">02.</span> Description of Service
            </h2>
            <p>
              PayChase provides an automated invoicing, client billing management, and reminder orchestration software platform. PayChase acts solely as a communication and software tool to facilitate invoicing between you (the service provider/freelancer) and your designated clients.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">03.</span> Account Responsibilities & Conduct
            </h2>
            <p>When registering and maintaining an account, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>Provide accurate, truthful identity and contact details.</li>
              <li>Keep login credentials confidential and notify us immediately of any security compromise.</li>
              <li>Only issue legitimate invoices for valid business services and agreed-upon deliverables.</li>
              <li>Never use the reminder dispatch engine to spam, harass, or send abusive communications.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">04.</span> Payments & Gateway Processing
            </h2>
            <p>
              Payments processed via PayChase links utilize third-party merchant gateways (such as Stripe, Razorpay, or direct bank rails). PayChase does not hold client funds in escrow, is not a financial depository, and is not responsible for dispute chargebacks or merchant gateway service outages.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">05.</span> Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, PayChase shall not be liable for any indirect, incidental, or consequential damages resulting from client non-payment, delivery disputes, lost profits, or data downtime.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono">06.</span> Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate anti-spam policies or engage in abusive debt collection behaviors. You may terminate your account at any time by contacting our support team.
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
