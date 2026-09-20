'use client';

import React from 'react';
import Link from 'next/link';
import { UserPlus, PlusCircle } from 'lucide-react';

export const QuickActions: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Active Action */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition min-h-[42px]"
      >
        <UserPlus className="w-4 h-4" />
        <span>Add client</span>
      </Link>

      {/* Create Invoice Action */}
      <Link
        href="/invoices/new"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white/90 border border-white/10 bg-white/5 hover:bg-white/10 transition min-h-[42px]"
      >
        <PlusCircle className="w-4 h-4 text-indigo-400" />
        <span>Create invoice</span>
      </Link>
    </div>
  );
};

export default QuickActions;
