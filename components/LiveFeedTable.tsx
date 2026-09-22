'use client';

import React from 'react';
import useSWR from 'swr';
import { formatBDT, formatWeight } from '@/lib/utils';
import { RefreshCw, ArrowDownRight, ArrowUpRight, Scale, CreditCard } from 'lucide-react';

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
  const { data, isLoading, isValidating } = useSWR<RecentApiResponse>(
    '/api/transactions/recent',
    fetcher,
    {
      refreshInterval: 3000,
      revalidateOnFocus: true,
    }
  );

  const transactions = data?.transactions || [];

  return (
    <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 overflow-hidden shadow-card-subtle backdrop-blur-sm">
      <div className="p-5 border-b border-[#1b2235] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0084ff]"></span>
          </span>
          <h2 className="text-sm font-medium text-slate-100">Live Telemetry & Checkout Stream</h2>
          <span className="text-[11px] text-slate-500 font-light">(3s polling)</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-sky-400' : 'text-slate-500'}`} />
          <span className="font-light">{isValidating ? 'Syncing...' : 'Live Feed'}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#090c13]/80 text-[11px] text-slate-400 font-medium border-b border-[#1b2235]">
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
            {isLoading && transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-500 font-light">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Loading real-time hardware feed...</span>
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-500 font-light">
                  No dispenser checkouts or recharge events recorded yet.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
