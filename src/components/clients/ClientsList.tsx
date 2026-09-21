'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Users,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { ClientItem } from '@/lib/client-queries';
import ClientModal from './ClientModal';
import DeleteClientModal from './DeleteClientModal';
import ServerPagination from '@/components/ui/ServerPagination';

interface ClientsListProps {
  clients: ClientItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  searchQuery?: string;
}

export default function ClientsList({
  clients,
  totalCount,
  totalPages,
  currentPage,
  searchQuery = '',
}: ClientsListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientItem | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    router.refresh();
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenAdd = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: ClientItem) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (client: ClientItem) => {
    setClientToDelete(client);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm shadow-2xl backdrop-blur-xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Clients
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Manage your client contacts, billing emails, and associated invoices.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-[0.98] transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <form method="GET" action="/clients" className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm placeholder-white/40 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
          />
        </form>

        <div className="text-xs text-white/50 hidden sm:block">
          Total: <strong className="text-white">{totalCount}</strong> clients
        </div>
      </div>

      {/* Empty State */}
      {clients.length === 0 ? (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-white/10 bg-slate-900/40">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">No clients found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
            {searchQuery
              ? `No client matched "${searchQuery}". Try searching with a different name or email.`
              : 'Add your first client to start creating itemized invoices and automated reminder sequences.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:brightness-110 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add your first client</span>
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <GlassCard className="overflow-hidden p-0 border-white/10 bg-slate-900/50 shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.02]">
                      <th className="py-3 px-6">Client</th>
                      <th className="py-3 px-6">Email</th>
                      <th className="py-3 px-6">Phone</th>
                      <th className="py-3 px-6">Invoices</th>
                      <th className="py-3 px-6">Created</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {clients.map((c) => {
                      const initials = c.name
                        .trim()
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-white/[0.03] transition-colors group"
                        >
                          <td className="py-3.5 px-6 font-semibold text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-[11px] font-bold text-slate-300 tracking-wider shrink-0 shadow-sm group-hover:border-indigo-400/40 transition-colors">
                                {initials}
                              </div>
                              <span className="truncate">{c.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-slate-300 font-mono text-[11px]">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span className="truncate">{c.email}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-slate-300 font-mono text-[11px]">
                            {c.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                <span>{c.phone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium">
                              <FileText className="w-3 h-3 text-indigo-400" />
                              <span>{c.invoiceCount} {c.invoiceCount === 1 ? 'inv' : 'invs'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-slate-400 text-[11px] font-mono">
                            {new Intl.DateTimeFormat('en-US', {
                              dateStyle: 'medium',
                            }).format(c.createdAt)}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(c)}
                                title="Edit client"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(c)}
                                title="Delete client"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="md:hidden space-y-3">
            {clients.map((c) => (
              <GlassCard key={c.id} className="p-4 space-y-3 border-white/10 bg-slate-900/60">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-base">{c.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{c.email}</span>
                    </p>
                    {c.phone && (
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{c.phone}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(c)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[11px]">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    {c.invoiceCount} {c.invoiceCount === 1 ? 'invoice' : 'invoices'}
                  </span>
                  <span className="text-[11px] font-mono">
                    Added {new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(c.createdAt)}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Server-Side Pagination */}
          <div className="pt-2">
            <ServerPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={10}
              itemName="clients"
              baseUrl="/clients"
              extraParams={{
                q: searchQuery || undefined,
              }}
            />
          </div>
        </div>
      )}



      {/* Modals */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={showToast}
        clientToEdit={clientToEdit}
      />

      <DeleteClientModal
        isOpen={isDeleteOpen}
        client={clientToDelete}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={showToast}
      />
    </div>
  );
}
