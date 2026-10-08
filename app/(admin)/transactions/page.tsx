'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Receipt,
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { formatBDT, formatWeight } from '@/lib/utils';

interface Transaction {
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
    department: string | null;
  };
}

interface TransactionsResponse {
  transactions: Transaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '15');
  if (search) queryParams.set('search', search);
  if (type !== 'ALL') queryParams.set('type', type);
  if (fromDate) queryParams.set('from', fromDate);
  if (toDate) queryParams.set('to', toDate);

  const { data, isLoading, mutate, isValidating } = useSWR<TransactionsResponse>(
    `/api/transactions?${queryParams.toString()}`,
    fetcher
  );

  const transactions = data?.transactions || [];
  const totalPages = data?.totalPages || 1;

  function handleExportCsv() {
    const exportParams = new URLSearchParams(queryParams);
    exportParams.set('export', 'csv');
    window.open(`/api/transactions?${exportParams.toString()}`, '_blank');
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-medium text-slate-100 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-sky-400" />
            <span>Audit & Transactions Ledger</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-light">
            Cryptographic audit trail of all dispenser checkouts and administrative balance recharges.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full bg-[#151b2a] hover:bg-[#1b2235] border border-[#222a42] text-slate-200 text-xs font-medium transition-smooth w-full sm:w-auto"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#0f1420]/80 p-3 sm:p-4 rounded-3xl border border-[#1b2235] backdrop-blur-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search student, UID, ID..."
              className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-500" />
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors appearance-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="DISPENSER_PURCHASE">Food Dispenser Purchase</option>
              <option value="ADMIN_RECHARGE">Admin Top-Up</option>
              <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
            </select>
          </div>

          {/* From Date */}
          <div className="relative">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              placeholder="From Date"
              className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* To Date + Refresh */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              placeholder="To Date"
              className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 transition-colors"
            />

            <button
              onClick={() => mutate()}
              className="p-2.5 rounded-2xl border border-[#1b2235] bg-[#090c13] hover:bg-[#151b2a] text-slate-400 hover:text-slate-200 transition-smooth shrink-0"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && transactions.length === 0 && (
        <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-8 text-center text-slate-500 font-light">
          <div className="flex items-center justify-center space-x-2 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Loading transaction audit records...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && transactions.length === 0 && (
        <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-8 text-center text-slate-500 font-light text-xs">
          No transactions found for the selected query.
        </div>
      )}

      {/* MOBILE CARD VIEW (< md screens) */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => {
          const isPurchase = tx.type === 'DISPENSER_PURCHASE';

          return (
            <div
              key={tx.id}
              className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/90 p-4 space-y-3 shadow-card-subtle"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-medium text-slate-100">{tx.student.name}</h3>
                  <div className="text-[10px] text-slate-400 font-light mt-0.5">
                    ID: {tx.student.studentId} &middot; <span className="font-mono text-sky-400">{tx.student.cardUid}</span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isPurchase
                      ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  }`}
                >
                  {isPurchase ? 'Dispense' : 'Top-Up'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1b2235]/60 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-light">Food Weight</div>
                  <div className="font-medium text-slate-200">
                    {tx.weightTakenGrams !== null ? formatWeight(tx.weightTakenGrams) : '—'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-light">Amount</div>
                  <div className={`font-medium ${isPurchase ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isPurchase ? '-' : '+'}{formatBDT(Math.abs(tx.amount))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1b2235]/60 text-[10px] text-slate-500">
                <span>{new Date(tx.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                <span>Post-Bal: <strong className="text-slate-300 font-normal">{formatBDT(tx.postBalance)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW (md+ screens) */}
      <div className="hidden md:block rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 overflow-hidden shadow-card-subtle backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#090c13]/80 text-[11px] text-slate-400 font-medium border-b border-[#1b2235]">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-medium">Tx ID / Date</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Student Name</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Card UID</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Type / Weight</th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">Amount</th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">Post Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2235]/60">
              {transactions.map((tx) => {
                const isPurchase = tx.type === 'DISPENSER_PURCHASE';

                return (
                  <tr key={tx.id} className="hover:bg-[#151b2a]/60 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono text-slate-400 text-[11px] truncate max-w-[100px]">
                        {tx.id.substring(0, 10)}...
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-100 font-medium">{tx.student.name}</div>
                      <div className="text-[11px] text-slate-500 font-light">ID: {tx.student.studentId}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-sky-400 bg-[#151b2a] px-2 py-0.5 rounded-full border border-[#222a42]">
                        {tx.student.cardUid}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isPurchase
                              ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          {isPurchase ? 'Dispense' : 'Top-Up'}
                        </span>
                        {tx.weightTakenGrams !== null && (
                          <span className="text-[11px] text-slate-400 flex items-center">
                            <Scale className="w-3 h-3 mr-1 text-slate-500" />
                            {formatWeight(tx.weightTakenGrams)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium whitespace-nowrap">
                      <span className={isPurchase ? 'text-rose-400' : 'text-emerald-400'}>
                        {isPurchase ? '-' : '+'}{formatBDT(Math.abs(tx.amount))}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-300 whitespace-nowrap">
                      {formatBDT(tx.postBalance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#0f1420]/80 p-3 sm:p-4 rounded-3xl border border-[#1b2235] text-xs text-slate-400">
          <div>
            Page <span className="text-slate-200 font-medium">{page}</span> of <span className="text-slate-200 font-medium">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-2xl border border-[#1b2235] bg-[#090c13] hover:bg-[#151b2a] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-2xl border border-[#1b2235] bg-[#090c13] hover:bg-[#151b2a] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
