'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  BookOpen,
  Cpu,
  Menu,
  X,
  LogOut,
  Compass,
  Users,
  Receipt,
  Sliders,
} from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  return (
    <>
      <header className="h-16 border-b border-[#1b2235] bg-[#090c13]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile Brand & Terminal status pill */}
        <div className="flex items-center space-x-3">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-2xl bg-[#151b2a] border border-[#222a42] text-slate-400 hover:text-slate-200 transition-smooth"
            title="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Mobile Brand Icon (shown only when sidebar is hidden) */}
          <div className="lg:hidden flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0084ff] to-[#38bdf8] flex items-center justify-center text-white shadow-sky-pill shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-100 hidden sm:inline">Smart Vending</span>
          </div>

          {/* Status pill */}
          <div className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#151b2a] border border-[#222a42] text-[11px] sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0084ff]"></span>
            </span>
            <span className="text-slate-300 font-medium truncate max-w-[120px] sm:max-w-none">
              Gateway
            </span>
            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 font-mono font-medium">
              ONLINE
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/manual"
            className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-sky-400 hover:text-sky-300 bg-[#151b2a] hover:bg-[#1b2235] px-3 sm:px-3.5 py-1.5 rounded-full border border-sky-500/30 transition-smooth"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-medium hidden sm:inline">System Manual</span>
            <span className="font-medium sm:hidden text-[11px]">Manual</span>
          </Link>

          <div className="flex items-center space-x-2 pl-1 sm:pl-2">
            <div className="relative">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-sky-400/50 p-0.5 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-500/20 to-sky-400/10 flex items-center justify-center border border-sky-500/30 text-sky-400">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#0084ff] border-2 border-[#090c13]" />
            </div>
            <span className="text-xs font-medium text-slate-200 hidden md:inline">Admin</span>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-72 max-w-[85vw] bg-[#090c13] border-r border-[#1b2235] p-5 flex flex-col z-10 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1b2235]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0084ff] to-[#38bdf8] flex items-center justify-center text-white shadow-sky-pill">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-100">Smart Vending</div>
                  <div className="text-[10px] text-sky-400">IoT Food Terminal</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-[#151b2a] transition-smooth"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav list */}
            <nav className="flex-1 py-4 space-y-1.5">
              {[
                { name: 'Dashboard', href: '/dashboard', icon: Compass },
                { name: 'Students Directory', href: '/students', icon: Users },
                { name: 'Audit Ledger', href: '/transactions', icon: Receipt },
                { name: 'System Manual', href: '/manual', icon: BookOpen },
                { name: 'System Config', href: '/settings', icon: Sliders },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs text-slate-300 hover:text-sky-400 hover:bg-[#151b2a] transition-smooth"
                  >
                    <Icon className="w-4 h-4 text-sky-400" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout button */}
            <div className="pt-4 border-t border-[#1b2235]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs text-rose-400 hover:bg-rose-500/10 transition-smooth"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
