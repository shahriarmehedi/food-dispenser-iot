'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Users,
  Receipt,
  BookOpen,
  Sliders,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Compass,
  },
  {
    name: 'Students',
    href: '/students',
    icon: Users,
  },
  {
    name: 'Ledger',
    href: '/transactions',
    icon: Receipt,
  },
  {
    name: 'Manual',
    href: '/manual',
    icon: BookOpen,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Sliders,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090c13]/95 backdrop-blur-xl border-t border-[#1b2235] px-2 py-1.5 flex items-center justify-around safe-area-bottom shadow-2xl">
      {mobileNavItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname?.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative',
              isActive
                ? 'text-sky-400 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <div
              className={cn(
                'p-1 rounded-xl transition-all',
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25'
                  : 'text-slate-400'
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-sky-400 absolute bottom-0 shadow-sky-glow" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
