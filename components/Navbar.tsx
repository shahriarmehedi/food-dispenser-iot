'use client';

import React from 'react';
import { Wifi, Activity, Shield, Bell, Search, Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-[#1b2235] bg-[#090c13]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Terminal status pill */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#151b2a] border border-[#222a42] text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0084ff]"></span>
          </span>
          <span className="text-slate-300 font-medium">Food Dispenser Gateway</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 font-mono font-medium">
            ONLINE
          </span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 bg-[#151b2a] px-3 py-1.5 rounded-full border border-[#222a42]">
          <Wifi className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-[11px]">LAN BIND: 0.0.0.0:3000</span>
        </div>

        <div className="flex items-center space-x-2 pl-2">
          {/* Circular avatar with sky blue ring from reference */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full border border-sky-400/50 p-0.5 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-500/20 to-sky-400/10 flex items-center justify-center border border-sky-500/30 text-sky-400">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#0084ff] border-2 border-[#090c13]" />
          </div>
          <span className="text-xs font-medium text-slate-200 hidden sm:inline">Admin</span>
        </div>
      </div>
    </header>
  );
}
