import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'PayChase — Get Paid on Time Without the Awkward Follow-ups',
  description:
    'The automated invoice reminder platform for Indian & global freelancers and agencies. Send polite-to-firm AI reminders in English, Hinglish & Hindi with integrated Pay Now links.',
  keywords: [
    'freelance invoice',
    'payment reminders',
    'AI debt collection',
    'freelance payment chase',
    'India freelancer invoice',
    'Hinglish invoice reminder',
  ],
  authors: [{ name: 'PayChase Team' }],
  metadataBase: new URL('https://paychase.app'),
  openGraph: {
    title: 'PayChase — Get Paid on Time Without the Awkward Follow-ups',
    description:
      'Automated, polite-to-firm payment reminders with Pay Now links and AI-written messages in English, Hinglish & Hindi.',
    type: 'website',
    url: 'https://paychase.app',
    siteName: 'PayChase',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PayChase — Get Paid on Time Without the Awkward Follow-ups',
    description:
      'Automated invoice payment reminders with AI for freelancers and boutique agencies.',
  },
};

export const viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

import AuthProvider from '@/components/providers/AuthProvider';
import CookieConsent from '@/components/ui/CookieConsent';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-[#030712] font-sans antialiased text-white selection:bg-indigo-500 selection:text-white relative">
        {/* Dynamic Animated Atmospheric Mesh Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-gradient-to-b from-[#030712] via-[#090d26] to-[#02040a]">
          {/* Subtle Cyber Grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }}
          />

          {/* Floating Neon Mesh Orbs */}
          <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] sm:w-[58rem] sm:h-[58rem] rounded-full bg-gradient-to-tr from-indigo-600/30 to-violet-500/25 blur-[130px] animate-float-1 will-change-transform" />
          <div className="absolute top-[30%] -left-[12%] w-[26rem] h-[26rem] sm:w-[42rem] sm:h-[42rem] rounded-full bg-gradient-to-br from-violet-600/25 to-fuchsia-600/15 blur-[140px] animate-float-2 will-change-transform" />
          <div className="absolute top-[60%] -right-[12%] w-[28rem] h-[28rem] sm:w-[46rem] sm:h-[46rem] rounded-full bg-gradient-to-tl from-cyan-600/20 to-blue-600/15 blur-[150px] animate-float-3 will-change-transform" />
        </div>

        <AuthProvider>
          {children}
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
