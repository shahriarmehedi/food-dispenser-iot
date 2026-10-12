'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { formatBDT, formatWeight } from '@/lib/utils';
import {
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface RecentTransaction {
  id: string;
  createdAt: string;
  type: 'DISPENSER_PURCHASE' | 'ADMIN_RECHARGE' | 'MANUAL_ADJUSTMENT';
  weightTakenGrams: number | null;
  costPerGram: number | null;
  amount: number;
  postBalance: number;
  student: {
    id: string;
    name: string;
    studentId: string;
    cardUid: string;
  };
}

interface RecentApiResponse {
  transactions: RecentTransaction[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LiveFeedTable() {
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data, isLoading, isValidating } = useSWR<RecentApiResponse>(
    '/api/transactions/recent',
    fetcher,
    {
      refreshInterval: 3000,
      revalidateOnFocus: true,
    }
  );

  const transactions = data?.transactions || [];
  const totalRecords = transactions.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));

  // Ensure current page is valid when total items change
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRecords);
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  return (
    <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 overflow-hidden shadow-card-subtle backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#1b2235] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0084ff]"></span>
          </span>
          <h2 className="text-xs sm:text-sm font-medium text-slate-100">Live Telemetry & Checkout Stream</h2>
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-light hidden sm:inline">(3s polling)</span>
        </div>
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs text-slate-400">
          <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-sky-400' : 'text-slate-500'}`} />
          <span className="font-light">{isValidating ? 'Syncing...' : 'Live'}</span>
        </div>
      </div>

      {/* Loading / Empty States */}
      {isLoading && transactions.length === 0 && (
        <div className="p-8 text-center text-slate-500 font-light text-xs flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
          <span>Loading real-time hardware feed...</span>
        </div>
      )}

      {!isLoading && transactions.length === 0 && (
        <div className="p-8 text-center text-slate-500 font-light text-xs">
          No dispenser checkouts or recharge events recorded yet.
        </div>
      )}

      {/* MOBILE CARD VIEW (< md screens) */}
      <div className="md:hidden divide-y divide-[#1b2235]/60">
        {paginatedTransactions.map((tx) => {
          const isPurchase = tx.type === 'DISPENSER_PURCHASE';
          const isRecharge = tx.type === 'ADMIN_RECHARGE';

          return (
            <div key={tx.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-100">{tx.student.name}</div>
                  <div className="text-[10px] text-slate-500 font-light mt-0.5">
                    ID: {tx.student.studentId} &middot; <span className="font-mono text-sky-400">{tx.student.cardUid}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-medium ${isPurchase ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isPurchase ? '-' : '+'}{formatBDT(Math.abs(tx.amount))}
                  </div>
                  <div className="text-[10px] text-slate-500 font-light">
                    Bal: {formatBDT(tx.postBalance)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <div className="text-slate-400">
                  {isPurchase ? (
                    <span className="flex items-center space-x-1">
                      <Scale className="w-3.5 h-3.5 text-sky-400" />
                      <span>{formatWeight(tx.weightTakenGrams ?? 0)}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400">Recharge</span>
                  )}
                </div>
                <div className="text-slate-500 text-[10px]">
                  {new Date(tx.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW (>= md screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#151b2a]/40 text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1b2235]">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-medium">Timestamp</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Student Name</th>
              <th scope="col" className="px-5 py-3.5 font-medium">RFID Card</th>
              <th scope="col" className="px-5 py-3.5 font-medium">Weight Taken</th>
              <th scope="col" className="px-5 py-3.5 text-right font-medium">Amount</th>
              <th scope="col" className="px-5 py-3.5 text-right font-medium">Post Balance</th>
              <th scope="col" className="px-5 py-3.5 text-center font-medium">Event Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2235]/60 font-sans">
            {paginatedTransactions.map((tx) => {
              const isPurchase = tx.type === 'DISPENSER_PURCHASE';
              const isRecharge = tx.type === 'ADMIN_RECHARGE';
              const isZeroWeight =
                isPurchase &&
                (tx.weightTakenGrams === null || tx.weightTakenGrams <= 5) &&
                tx.amount === 0;

              return (
                <tr key={tx.id} className="hover:bg-[#151b2a]/60 transition-colors">
                  <td className="px-5 py-3.5 text-slate-400 font-light whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-slate-200 font-medium">{tx.student.name}</div>
                    <div className="text-[11px] text-slate-500 font-light">ID: {tx.student.studentId}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#151b2a] border border-[#222a42] text-[11px] text-sky-400 font-mono">
                      <CreditCard className="w-3 h-3" />
                      <span>{tx.student.cardUid}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {isPurchase ? (
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <Scale className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-medium">{formatWeight(tx.weightTakenGrams ?? 0)}</span>
                        {tx.costPerGram && (
                          <span className="text-[11px] text-slate-500 font-light">
                            (@৳{tx.costPerGram}/g)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-medium">Recharge Credit</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium whitespace-nowrap">
                    {tx.amount < 0 ? (
                      <span className="text-rose-400 flex items-center justify-end font-medium">
                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                        -{formatBDT(Math.abs(tx.amount))}
                      </span>
                    ) : tx.amount > 0 ? (
                      <span className="text-emerald-400 flex items-center justify-end font-medium">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                        +{formatBDT(tx.amount)}
                      </span>
                    ) : (
                      <span className="text-slate-400">৳0.00</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-200 whitespace-nowrap">
                    {formatBDT(tx.postBalance)}
                  </td>
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    {isZeroWeight ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Noise &le;5g
                      </span>
                    ) : isRecharge ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Top-Up
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        Dispensed
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Toolbar */}
      {totalRecords > 0 && (
        <div className="p-3 sm:p-4 border-t border-[#1b2235] bg-[#090c13]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          {/* Left: Summary */}
          <div className="text-[11px] sm:text-xs">
            Showing <span className="text-slate-200 font-medium font-mono">{startIndex + 1}</span> to{' '}
            <span className="text-slate-200 font-medium font-mono">{endIndex}</span> of{' '}
            <span className="text-slate-200 font-medium font-mono">{totalRecords}</span> entries
          </div>

          {/* Right: Rows per page + Page Navigation */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-slate-400">Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#151b2a] border border-[#222a42] text-slate-200 rounded-xl px-2 py-1 text-xs font-mono focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                disabled={activePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-[#222a42] bg-[#151b2a] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1a2235] transition-colors active:scale-[0.98]"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-[11px] font-mono text-slate-300">
                {activePage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={activePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-xl border border-[#222a42] bg-[#151b2a] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1a2235] transition-colors active:scale-[0.98]"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
