'use client';

import React from 'react';
import {
  Shield,
  CreditCard,
  PlusCircle,
  Wifi,
  WifiOff,
  Sparkles,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Radio,
  Lock,
  Unlock,
  Loader2,
  Zap,
} from 'lucide-react';

interface DeviceStatus {
  isOnline: boolean;
  lastSeenSecondsAgo: number | null;
  ip: string | null;
  rssi: number | null;
  scaleOk: boolean;
  rfidOk: boolean;
  servoLocked?: boolean;
}

interface RightPanelProps {
  onOpenRecharge: () => void;
  onOpenEnroll: () => void;
  activeStudentsCount: number;
  deviceStatus?: DeviceStatus;
}

export default function RightPanel({
  onOpenRecharge,
  onOpenEnroll,
  activeStudentsCount,
  deviceStatus,
}: RightPanelProps) {
  const isOnline = deviceStatus?.isOnline ?? false;
  const lastSeen = deviceStatus?.lastSeenSecondsAgo;
  const isLocked = deviceStatus?.servoLocked ?? true;

  const [commandLoading, setCommandLoading] = React.useState(false);
  const [commandMessage, setCommandMessage] = React.useState<string | null>(null);

  async function handleToggleLatch(action: 'LOCK' | 'UNLOCK') {
    try {
      setCommandLoading(true);
      setCommandMessage(null);
      const res = await fetch('/api/dispenser/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommandMessage(action === 'UNLOCK' ? 'Unlock signal queued' : 'Lock signal queued');
        setTimeout(() => setCommandMessage(null), 4000);
      } else {
        alert(data.error || 'Failed to queue command');
      }
    } catch (err) {
      console.error('Toggle latch error:', err);
    } finally {
      setCommandLoading(false);
    }
  }

  return (
    <aside className="w-80 shrink-0 space-y-4 hidden xl:block">
      {/* Quick Terminal Operations */}
      <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-4 shadow-card-subtle backdrop-blur-sm space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>Terminal Actions</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Operations</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={onOpenEnroll}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-[#0084ff] hover:bg-[#0074e0] text-white text-xs font-medium flex items-center justify-between shadow-sky-pill transition-smooth active:scale-[0.98]"
          >
            <div className="flex items-center space-x-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Enroll New RFID Card</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/70" />
          </button>

          <button
            onClick={onOpenRecharge}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-[#151b2a] hover:bg-[#1a2235] text-slate-200 border border-[#222a42] text-xs font-medium flex items-center justify-between transition-smooth group active:scale-[0.98]"
          >
            <div className="flex items-center space-x-2">
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top-Up Student Balance</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Hardware Telemetry Card */}
      <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-5 shadow-card-subtle backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              {isOnline ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              )}
            </span>
            <span className="text-xs font-medium text-slate-200">ESP32 Client Status</span>
          </div>

          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-medium flex items-center space-x-1 ${
              isOnline
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50'
                : 'bg-amber-950/80 text-amber-400 border-amber-800/50'
            }`}
          >
            {isOnline ? <Radio className="w-3 h-3 animate-pulse mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* IP and Signal */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#090c13]/70 border border-[#1b2235]">
            <span className="text-slate-400">Device IP / Signal:</span>
            <span className="text-slate-200 font-mono text-[11px]">
              {deviceStatus?.ip ? (
                <span className="text-sky-300">
                  {deviceStatus.ip} {deviceStatus.rssi ? `(${deviceStatus.rssi}dBm)` : ''}
                </span>
              ) : (
                <span className="text-slate-500 italic">No signal</span>
              )}
            </span>
          </div>

          {/* Last Seen Heartbeat */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#090c13]/70 border border-[#1b2235]">
            <span className="text-slate-400">Heartbeat Ping:</span>
            <span className="text-slate-300 font-light text-[11px]">
              {isOnline
                ? `Active (seen ${lastSeen ?? 0}s ago)`
                : lastSeen !== null && lastSeen !== undefined
                ? `Last seen ${lastSeen}s ago`
                : 'Waiting for device...'}
            </span>
          </div>

          {/* RFID Scanner Status */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#090c13]/70 border border-[#1b2235]">
            <span className="text-slate-400">RFID Scanner:</span>
            <span className="text-slate-200 font-medium flex items-center gap-1">
              {isOnline && deviceStatus?.rfidOk ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-sky-400 font-medium">RC522 Polling</span>
                </>
              ) : (
                <span className="text-slate-500 font-normal">Standby</span>
              )}
            </span>
          </div>

          {/* Load Cell Status */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#090c13]/70 border border-[#1b2235]">
            <span className="text-slate-400">Load Cell Sensor:</span>
            <span className="text-slate-200 font-medium flex items-center gap-1">
              {deviceStatus?.scaleOk ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">HX711 Ready (1kg)</span>
                </>
              ) : (
                <span className="text-slate-500 font-light">RFID Test Mode</span>
              )}
            </span>
          </div>

          {/* Enrolled Students */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#090c13]/70 border border-[#1b2235]">
            <span className="text-slate-400">Active Students:</span>
            <span className="text-sky-400 font-medium">{activeStudentsCount} enrolled</span>
          </div>

          {/* Latch Status & Remote Web Control */}
          <div className="p-3 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                {!isLocked ? (
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>Dispenser Latch</span>
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                  !isLocked
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700/40'
                }`}
              >
                {!isLocked ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>

            {/* Quick Web Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={commandLoading || !isOnline}
                onClick={() => handleToggleLatch('UNLOCK')}
                className="py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                title="Send remote command to unlock the food dispenser lid"
              >
                {commandLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Unlock className="w-3 h-3" />
                )}
                <span>Web Unlock</span>
              </button>

              <button
                type="button"
                disabled={commandLoading || !isOnline}
                onClick={() => handleToggleLatch('LOCK')}
                className="py-1.5 px-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-medium flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                title="Send remote command to lock the food dispenser lid"
              >
                {commandLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                <span>Web Lock</span>
              </button>
            </div>

            {commandMessage && (
              <p className="text-[10px] text-emerald-400 font-mono text-center">
                ✓ {commandMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
