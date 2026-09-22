'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Users,
  Receipt,
  Sliders,
  LogOut,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Compass,
  },
  {
    name: 'Students Directory',
    href: '/students',
    icon: Users,
  },
  {
    name: 'Audit Ledger',
    href: '/transactions',
    icon: Receipt,
  },
  {
    name: 'System Config',
    href: '/settings',
    icon: Sliders,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
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
    <aside className="w-20 lg:w-64 border-r border-[#1b2235] bg-[#090c13] flex flex-col shrink-0 transition-all duration-300">
      {/* Brand Header */}
      <div className="p-5 flex items-center space-x-3 border-b border-[#1b2235]">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0084ff] to-[#38bdf8] flex items-center justify-center text-white shadow-sky-pill shrink-0">
          <Cpu className="w-5 h-5" />
        </div>
        <div className="hidden lg:block overflow-hidden">
          <div className="text-sm font-medium text-slate-100 tracking-tight truncate">Smart Vending</div>
          <div className="text-[11px] text-sky-400 font-light truncate">IoT Food Terminal</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs transition-smooth relative group',
                isActive
                  ? 'bg-[#151b2a] text-sky-400 border border-[#222a42] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1420]'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0 transition-colors', isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200')} />
              <span className="hidden lg:block font-medium truncate">{item.name}</span>
              {isActive && (
                <div className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-[#0084ff] shadow-sky-glow hidden lg:block" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Session Logout Section */}
      <div className="p-4 border-t border-[#1b2235]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-smooth group"
          title="Log out of admin session"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-rose-400 transition-colors" />
          <span className="hidden lg:block font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
