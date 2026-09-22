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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-slate-100 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-sky-400" />
            <span>Audit & Transactions Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-light">
            Cryptographic audit trail of all dispenser checkouts and administrative balance recharges.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-[#151b2a] hover:bg-[#1b2235] border border-[#222a42] text-slate-200 text-xs font-medium transition-smooth self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#0f1420]/80 p-4 rounded-3xl border border-[#1b2235] backdrop-blur-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="ALL">All Types</option>
              <option value="DISPENSER_PURCHASE">Dispenser Purchases</option>
              <option value="ADMIN_RECHARGE">Admin Recharges</option>
              <option value="MANUAL_ADJUSTMENT">Manual Adjustments</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
            />
            <button
              onClick={() => mutate()}
              className="p-2 rounded-2xl border border-[#1b2235] bg-[#090c13] hover:bg-[#151b2a] text-slate-400 hover:text-slate-200 transition-smooth"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 overflow-hidden shadow-card-subtle backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#090c13]/80 text-[11px] text-slate-400 font-medium border-b border-[#1b2235]">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-medium">Tx ID / Date</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Student Name</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Card UID</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Type / Weight</th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">Amount (BDT)</th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">Post Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2235]/60">
              {isLoading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-light">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                      <span>Loading ledger records...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-light">
                    No transactions found for the specified criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isPurchase = tx.type === 'DISPENSER_PURCHASE';

                  return (
                    <tr key={tx.id} className="hover:bg-[#151b2a]/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-[11px] text-slate-400 truncate max-w-[140px]" title={tx.id}>
                          {tx.id}
                        </div>
                        <div className="text-[10px] text-slate-500 font-light">
                          {new Date(tx.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-100 font-medium">{tx.student.name}</div>
                        <div className="text-[11px] text-slate-500 font-light">ID: {tx.student.studentId}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-sky-400">
                        {tx.student.cardUid}
                      </td>
                      <td className="px-5 py-3.5">
                        {isPurchase ? (
                          <div className="flex items-center space-x-1.5 text-xs">
                            <Scale className="w-3.5 h-3.5 text-sky-400" />
                            <span className="font-medium text-slate-200">
                              {formatWeight(tx.weightTakenGrams ?? 0)}
                            </span>
                            {tx.costPerGram && (
                              <span className="text-[10px] text-slate-500 font-light">
                                (@{formatBDT(tx.costPerGram)}/g)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Recharge Credit
                          </span>
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#1b2235] bg-[#090c13]/60 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="font-medium text-slate-200">{page}</span> of{' '}
            <span className="font-medium text-slate-200">{totalPages}</span> ({data?.total || 0} total events)
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-full border border-[#1b2235] bg-[#0f1420] hover:bg-[#151b2a] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-smooth"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-full border border-[#1b2235] bg-[#0f1420] hover:bg-[#151b2a] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-smooth"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
