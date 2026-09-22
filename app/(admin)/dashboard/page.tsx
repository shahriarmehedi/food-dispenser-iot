'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import LiveFeedTable from '@/components/LiveFeedTable';
import AnalyticsChart from '@/components/AnalyticsChart';
import RightPanel from '@/components/RightPanel';
import AddStudentModal from '@/components/AddStudentModal';
import RechargeModal from '@/components/RechargeModal';
import {
  Banknote,
  Scale,
  CheckCircle2,
  Users,
  UserPlus,
  RefreshCw,
  ArrowUpRight,
  PlusCircle,
} from 'lucide-react';
import { formatBDT, formatWeight } from '@/lib/utils';

interface StatsResponse {
  revenueToday: number;
  weightDispensedGramsToday: number;
  successfulDispensesToday: number;
  activeStudentsCount: number;
  totalStudentsCount: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);

  const { data: stats, mutate, isValidating } = useSWR<StatsResponse>(
    '/api/stats',
    fetcher,
    {
      refreshInterval: 3000,
      revalidateOnFocus: true,
    }
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Main Left / Center Column */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Top Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium text-slate-100 tracking-tight">
              Live Operations Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-light">
              M2M IoT gateway monitor, load cell telemetry, and RFID student ledger.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => mutate()}
              className="p-2.5 rounded-2xl border border-[#1b2235] bg-[#0f1420] hover:bg-[#151b2a] text-slate-400 hover:text-slate-200 transition-smooth"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-[#0084ff] hover:bg-[#0074e0] text-white text-xs font-medium shadow-sky-pill transition-smooth active:scale-[0.98]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Enroll Student</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards Grid (styled like reference "All Transactions" stat card) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Revenue Today */}
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-5 shadow-card-subtle backdrop-blur-sm relative overflow-hidden group hover:border-[#222a42] transition-smooth">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-light">Revenue Today</span>
              <div className="w-8 h-8 rounded-full bg-[#151b2a] border border-[#222a42] flex items-center justify-center text-sky-400">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-medium text-slate-100 tracking-tight">
                {formatBDT(stats?.revenueToday ?? 0)}
              </span>
            </div>
            <div className="mt-2 flex items-center text-[11px] text-sky-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>Dispenser billed amount</span>
            </div>
          </div>

          {/* Card 2: Food Dispensed */}
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-5 shadow-card-subtle backdrop-blur-sm relative overflow-hidden group hover:border-[#222a42] transition-smooth">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-light">Food Dispensed</span>
              <div className="w-8 h-8 rounded-full bg-[#151b2a] border border-[#222a42] flex items-center justify-center text-sky-400">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-medium text-slate-100 tracking-tight">
                {formatWeight(stats?.weightDispensedGramsToday ?? 0)}
              </span>
            </div>
            <div className="mt-2 flex items-center text-[11px] text-slate-400 font-light">
              <span>HX711 differential load</span>
            </div>
          </div>

          {/* Card 3: Successful Dispenses */}
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-5 shadow-card-subtle backdrop-blur-sm relative overflow-hidden group hover:border-[#222a42] transition-smooth">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-light">Dispenses Count</span>
              <div className="w-8 h-8 rounded-full bg-[#151b2a] border border-[#222a42] flex items-center justify-center text-sky-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-medium text-slate-100 tracking-tight">
                {stats?.successfulDispensesToday ?? 0}
              </span>
            </div>
            <div className="mt-2 flex items-center text-[11px] text-emerald-400 font-medium">
              <span>Checkouts completed</span>
            </div>
          </div>

          {/* Card 4: Registered Students */}
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-5 shadow-card-subtle backdrop-blur-sm relative overflow-hidden group hover:border-[#222a42] transition-smooth">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-light">Active RFID Cards</span>
              <div className="w-8 h-8 rounded-full bg-[#151b2a] border border-[#222a42] flex items-center justify-center text-sky-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-medium text-slate-100 tracking-tight">
                {stats?.activeStudentsCount ?? 0}
              </span>
              <span className="text-xs text-slate-400 font-light">
                / {stats?.totalStudentsCount ?? 0} total
              </span>
            </div>
            <div className="mt-2 flex items-center text-[11px] text-sky-400 font-medium">
              <span>Authorized for door unlock</span>
            </div>
          </div>
        </div>

        {/* Analytics Interactive Area Chart (like "Income & Expenses" in reference) */}
        <AnalyticsChart />

        {/* Live Feed Real-Time Table */}
        <LiveFeedTable />
      </div>

      {/* Right Companion Panel (like Right Column in reference) */}
      <RightPanel
        revenueToday={stats?.revenueToday ?? 0}
        activeStudentsCount={stats?.activeStudentsCount ?? 0}
        onOpenRecharge={() => setIsRechargeOpen(true)}
        onOpenEnroll={() => setIsAddStudentOpen(true)}
      />

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onSuccess={() => mutate()}
      />

      <RechargeModal
        isOpen={isRechargeOpen}
        student={null}
        onClose={() => setIsRechargeOpen(false)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
