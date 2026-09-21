'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { 
  Menu, 
  X, 
  ArrowRight, 
  LayoutDashboard, 
  LogOut, 
  User, 
  ChevronDown 
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

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
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setDropdownOpen(false);
      }
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

  // User avatar initials
  const userName = session?.user?.name || 'User';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'U';

  return (
    <header className="sticky top-0 z-50 w-full pt-safe pointer-events-none transition-all duration-300">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-3.5">
        <nav
          aria-label="Main Navigation"
          className={`pointer-events-auto rounded-full px-5 sm:px-7 py-2.5 flex items-center justify-between transition-all duration-300 border ${
            scrolled
              ? 'bg-[#090d1f]/90 backdrop-blur-2xl border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.7)]'
              : 'bg-[#090d1f]/75 backdrop-blur-xl border-white/10 shadow-lg shadow-black/30'
          }`}
        >
          {/* Brand Logo */}
          <Logo href="/" />

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

          {/* Actions: Logged In User Avatar vs Log in / Sign up */}
          <div className="hidden md:flex items-center gap-3">
            {status === 'authenticated' && session?.user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 transition-all text-xs font-semibold text-white cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                    {userInitials}
                  </div>
                  <span className="max-w-[120px] truncate">{userName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-white/15 p-1.5 shadow-2xl backdrop-blur-2xl z-50 text-xs"
                    >
                      <div className="px-3 py-2 border-b border-white/10 mb-1">
                        <p className="font-semibold text-white truncate">{userName}</p>
                        <p className="text-[11px] text-white/50 truncate">{session.user.email}</p>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-indigo-600/30 font-medium transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                        <span>Go to Dashboard</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut({ callbackUrl: '/login' });
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 font-medium transition cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sign out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
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
              </>
            )}
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
                {status === 'authenticated' && session?.user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="w-full text-center text-base font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all min-h-[48px] flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Go to Dashboard</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        signOut({ callbackUrl: '/login' });
                      }}
                      className="w-full text-center text-sm font-medium text-rose-300 hover:text-rose-200 border border-rose-500/20 bg-rose-500/10 py-3 rounded-xl transition-colors min-h-[48px] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
