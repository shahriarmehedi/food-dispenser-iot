'use client';

import React from 'react';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  Package,
  Sparkles,
  ArrowRight,
  TrendingDown,
  User,
  Clock,
} from 'lucide-react';
import { formatBDT, formatWeight } from '@/lib/utils';

interface HopperLevelCardProps {
  capacityGrams?: number;
  dispensedTodayGrams: number;
  latestTransaction?: {
    id: string;
    studentName: string;
    studentId: string;
    cardUid: string;
    weightTakenGrams: number | null;
    amount: number;
    postBalance: number;
    createdAt: string;
  } | null;
}

export default function HopperLevelCard({
  capacityGrams = 1000,
  dispensedTodayGrams,
  latestTransaction,
}: HopperLevelCardProps) {
  const remainingGrams = Math.max(0, Math.round((capacityGrams - dispensedTodayGrams) * 10) / 10);
  const percentage = Math.max(0, Math.min(100, Math.round((remainingGrams / capacityGrams) * 100)));

  const isLow = percentage < 20;
  const isCritical = percentage < 10;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 2 Cols: 1kg Food Hopper Real-time Capacity */}
      <div className="lg:col-span-2 rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-5 shadow-card-subtle backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
        {/* Soft background ambient glow */}
        <div
          className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
            isCritical ? 'bg-rose-500/10' : isLow ? 'bg-amber-500/10' : 'bg-sky-500/10'
          }`}
        />

        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-2xl bg-[#151b2a] border border-[#222a42] flex items-center justify-center text-sky-400 shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-slate-100 flex items-center gap-2">
                  <span>Food Tank Capacity</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#151b2a] border border-[#222a42] text-slate-400 font-mono">
                    1kg Load Cell
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-light">
                  Real-time differential weight monitoring calibrated for 1000g tank.
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <span
              className={`text-[10px] px-2.5 py-1 rounded-full border font-mono font-medium flex items-center space-x-1 ${
                isCritical
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800/50'
                  : isLow
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800/50'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
              }`}
            >
              {isCritical ? (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1 text-rose-400" />
                  <span>CRITICAL (REFILL)</span>
                </>
              ) : isLow ? (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" />
                  <span>LOW FOOD</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                  <span>TANK OPTIMAL</span>
                </>
              )}
            </span>
          </div>

          {/* Level Numbers & Progress Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-medium text-slate-100 tracking-tight">
                  {remainingGrams.toFixed(1)}
                  <span className="text-sm font-normal text-slate-400 ml-1">g</span>
                </span>
                <span className="text-xs text-slate-500 font-light ml-2">
                  remaining of {capacityGrams}g max
                </span>
              </div>
              <span className="text-sm font-mono font-medium text-slate-300">
                {percentage}% Full
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full h-3 rounded-full bg-[#090c13] border border-[#1b2235] p-0.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isCritical
                    ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                    : isLow
                    ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                    : 'bg-gradient-to-r from-[#0084ff] to-[#38bdf8]'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Metrics Row */}
        <div className="mt-5 pt-3 border-t border-[#1b2235] grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-[#090c13]/60 border border-[#1b2235]">
            <span className="text-[10px] text-slate-400 block font-light">Max Capacity</span>
            <span className="text-slate-200 font-mono font-medium">1,000 g</span>
          </div>
          <div className="p-2 rounded-xl bg-[#090c13]/60 border border-[#1b2235]">
            <span className="text-[10px] text-slate-400 block font-light">Dispensed Today</span>
            <span className="text-sky-300 font-mono font-medium">{formatWeight(dispensedTodayGrams)}</span>
          </div>
          <div className="p-2 rounded-xl bg-[#090c13]/60 border border-[#1b2235]">
            <span className="text-[10px] text-slate-400 block font-light">Refill Trigger</span>
            <span className="text-amber-300 font-mono font-medium">&lt; 150 g</span>
          </div>
        </div>
      </div>

      {/* 1 Col: Latest Dispense Spotlight Card */}
      <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-5 shadow-card-subtle backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#1b2235]">
            <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Latest Card Tap</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Live Session</span>
          </div>

          {latestTransaction ? (
            <div className="mt-3.5 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] font-light block">Student</span>
                <span className="text-slate-100 font-medium text-sm truncate block">
                  {latestTransaction.studentName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ID: {latestTransaction.studentId} • UID: {latestTransaction.cardUid}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded-xl bg-[#090c13]/70 border border-[#1b2235]">
                  <span className="text-[10px] text-slate-400 block font-light">Food Taken</span>
                  <span className="text-sky-300 font-medium font-mono">
                    {formatWeight(latestTransaction.weightTakenGrams ?? 0)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#090c13]/70 border border-[#1b2235]">
                  <span className="text-[10px] text-slate-400 block font-light">Amount Billed</span>
                  <span className="text-emerald-300 font-medium font-mono">
                    {formatBDT(latestTransaction.amount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>
                    {new Date(latestTransaction.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </span>
                <span className="text-slate-300 font-mono text-[10px]">
                  Rem: {formatBDT(latestTransaction.postBalance)}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-8 text-center py-4 space-y-2 text-slate-500">
              <User className="w-6 h-6 mx-auto text-slate-600" />
              <p className="text-xs font-light">Awaiting next card scan...</p>
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 text-[10px] text-slate-500 font-light text-center border-t border-[#1b2235]/60">
          Autosaved to Neon Ledger
        </div>
      </div>
    </div>
  );
}
