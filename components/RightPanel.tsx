'use client';

import React from 'react';
import {
  Shield,
  CreditCard,
  PlusCircle,
  Wifi,
  Sparkles,
  ChevronRight,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatBDT } from '@/lib/utils';

interface RightPanelProps {
  onOpenRecharge: () => void;
  onOpenEnroll: () => void;
  revenueToday: number;
  activeStudentsCount: number;
}

export default function RightPanel({
  onOpenRecharge,
  onOpenEnroll,
  revenueToday,
  activeStudentsCount,
}: RightPanelProps) {
  return (
    <aside className="w-80 shrink-0 space-y-5 hidden xl:block">
      {/* Admin Profile & Dispenser Vault Card (styled like reference right panel) */}
      <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 shadow-card-subtle backdrop-blur-sm text-center relative overflow-hidden">
        {/* Soft background ambient halo */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Circular Avatar with multi-shade ring */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-sky-400/40 p-1 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-500/20 to-sky-400/10 flex items-center justify-center border border-sky-500/30 text-sky-400">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0084ff] border-2 border-[#0f1420] flex items-center justify-center shadow-sky-pill">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-light">Dispenser Revenue Today</div>
        <div className="mt-1 text-3xl font-medium text-slate-100 tracking-tight">
          {formatBDT(revenueToday)}
        </div>
        <div className="flex items-center justify-center space-x-1 text-[11px] text-sky-400 mt-1 font-medium">
          <span>LAN Vault Active</span>
          <span className="text-slate-600">•</span>
          <span>BDT Currency</span>
        </div>

        {/* Pill "Top Up Balance >" Button from Reference */}
        <div className="mt-5">
          <button
            onClick={onOpenRecharge}
            className="w-full py-2.5 px-4 rounded-full bg-[#151b2a] hover:bg-[#1b2235] border border-[#222a42] text-slate-200 text-xs font-medium flex items-center justify-center space-x-2 transition-smooth group"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PlusCircle className="w-3.5 h-3.5" />
            </div>
            <span>Quick Top-Up Balance</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Hardware Telemetry Card */}
      <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-5 shadow-card-subtle backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-200">ESP32 Client Status</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-medium">
            LIVE 0.0.0.0
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#090c13]/70 border border-[#1b2235]">
            <span className="text-slate-400">Load Cell Sensor:</span>
            <span className="text-slate-200 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              <span>HX711 Ready</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#090c13]/70 border border-[#1b2235]">
            <span className="text-slate-400">RFID Scanner:</span>
            <span className="text-slate-200 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              <span>RC522 Polling</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#090c13]/70 border border-[#1b2235]">
            <span className="text-slate-400">Active Students:</span>
            <span className="text-sky-400 font-medium">{activeStudentsCount} enrolled</span>
          </div>
        </div>

        <div className="pt-1">
          <button
            onClick={onOpenEnroll}
            className="w-full py-2.5 px-4 rounded-full bg-[#0084ff] hover:bg-[#0074e0] text-white text-xs font-medium flex items-center justify-center space-x-2 shadow-sky-pill transition-smooth active:scale-[0.98]"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Enroll New RFID Card</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
