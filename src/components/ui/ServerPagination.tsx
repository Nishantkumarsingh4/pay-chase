import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ServerPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize?: number;
  itemName?: string;
  baseUrl: string;
  extraParams?: Record<string, string | undefined>;
  borderTop?: boolean;
}

export function ServerPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 10,
  itemName = 'items',
  baseUrl,
  extraParams = {},
  borderTop = false,
}: ServerPaginationProps) {
  if (totalCount === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.set('page', String(page));
    return `${baseUrl}?${params.toString()}`;
  };

  // Generate visible page numbers (e.g. 1, 2, 3, 4, 5)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-1 sm:px-2 py-2 text-xs text-white/50 ${
        borderTop ? 'border-t border-white/10' : ''
      }`}
    >

      <div>
        Showing <span className="text-white font-medium">{startItem}</span> to{' '}
        <span className="text-white font-medium">{endItem}</span> of{' '}
        <span className="text-white font-medium">{totalCount}</span> {itemName}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        {currentPage > 1 ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-white transition active:scale-95"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/5 text-white/25 cursor-not-allowed">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </span>
        )}

        {/* Page Number Pills */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-white/40">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <Link
                key={`page-${p}`}
                href={createPageUrl(Number(p))}
                className={`min-w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/40 border border-indigo-400/40'
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>

        {/* Next Button */}
        {currentPage < totalPages ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-white transition active:scale-95"
            title="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/5 text-white/25 cursor-not-allowed">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
export default ServerPagination;
