'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShieldAlert, ArrowRight } from 'lucide-react';

const NAV_CONTENT = {
  brand: 'PayChase',
  navLinks: [
    { label: 'Features', targetId: 'features' },
    { label: 'How it works', targetId: 'how-it-works' },
    { label: 'AI Reminders', targetId: 'ai-showcase' },
    { label: 'FAQ', targetId: 'faq' },
  ],
  loginText: 'Log in',
  loginHref: '/login',
  signupText: 'Get started',
  signupHref: '/signup',
};

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const scrollToSection = (targetId: string) => {
    setIsOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full pt-safe transition-all duration-300">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-3">
        <nav
          aria-label="Main Navigation"
          className={`glass-panel rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between transition-all duration-300 ${
            scrolled
              ? 'shadow-[0_15px_30px_rgba(0,0,0,0.5)] border-white/20 bg-slate-950/70'
              : 'shadow-lg shadow-black/20'
          }`}
        >
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl tracking-tight group focus-visible:rounded-lg"
          >
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
            >
              <ShieldAlert className="w-5 h-5 text-white" aria-hidden="true" />
            </motion.div>
            <span className="flex items-center">
              {NAV_CONTENT.brand}
              <span className="text-indigo-400">.</span>
            </span>
          </Link>

          {/* Desktop Nav without hash in URL */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_CONTENT.navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => scrollToSection(link.targetId)}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 relative group py-1 cursor-pointer"
              >
                <span>{link.label}</span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-indigo-400 to-violet-400 group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={NAV_CONTENT.loginHref}
              className="text-sm font-medium text-white/80 hover:text-white px-3.5 py-2 rounded-xl transition-colors min-h-[44px] flex items-center justify-center hover:bg-white/5"
            >
              {NAV_CONTENT.loginText}
            </Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={NAV_CONTENT.signupHref}
                className="text-sm font-medium text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/25 transition-all min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <span>{NAV_CONTENT.signupText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile Slide-down Glass Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden fixed inset-x-4 top-[4.75rem] z-50 glass-panel rounded-2xl p-6 shadow-2xl border border-white/25 bg-slate-950/90 backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-3">
              {NAV_CONTENT.navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => scrollToSection(link.targetId)}
                  className="text-left text-base font-medium text-white/80 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-colors min-h-[48px] flex items-center cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <div className="flex flex-col gap-2.5">
                <Link
                  href={NAV_CONTENT.loginHref}
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-base font-medium text-white/80 hover:text-white border border-white/15 bg-white/5 py-3 rounded-xl transition-colors min-h-[48px] flex items-center justify-center"
                >
                  {NAV_CONTENT.loginText}
                </Link>
                <Link
                  href={NAV_CONTENT.signupHref}
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-base font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-600 py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all min-h-[48px] flex items-center justify-center gap-2"
                >
                  {NAV_CONTENT.signupText}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
