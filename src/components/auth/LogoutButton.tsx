'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 text-white/80 hover:text-white transition-all text-sm font-medium cursor-pointer"
    >
      <LogOut className="w-4 h-4 text-rose-400" />
      <span>Sign out</span>
    </button>
  );
}

export default LogoutButton;
