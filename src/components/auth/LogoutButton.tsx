'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-rose-500/15 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-all text-xs font-medium cursor-pointer"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}

export default LogoutButton;
