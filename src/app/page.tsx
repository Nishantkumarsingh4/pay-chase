import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import AiShowcase from '@/components/landing/AiShowcase';
import Faq from '@/components/landing/Faq';
import Cta from '@/components/landing/Cta';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* 1. Sticky Glass Navbar */}
      <Navbar />

      <main id="main-content" className="flex-1">
        {/* 2. Hero Section with Interactive Animated Dashboard */}
        <Hero />

        {/* 3. Problem Section */}
        <Problem />

        {/* 4. How It Works Section */}
        <HowItWorks />

        {/* 5. Features Section */}
        <Features />

        {/* 6. AI Tone Showcase (English) */}
        <AiShowcase />

        {/* 7. Accessible FAQ Accordion */}
        <Faq />

        {/* 8. Final CTA Banner */}
        <Cta />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
