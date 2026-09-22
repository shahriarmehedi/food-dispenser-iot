'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { TrendingUp, Scale, RefreshCw } from 'lucide-react';
import { formatBDT, formatWeight } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ChartPoint {
  name: string;
  date: string;
  weight: number;
  revenue: number;
  dispenses: number;
}

export default function AnalyticsChart() {
  const [metric, setMetric] = useState<'weight' | 'revenue'>('weight');
  const { data, isValidating } = useSWR<{ data: ChartPoint[] }>(
    '/api/stats/chart',
    fetcher,
    { refreshInterval: 10000 }
  );

  const points = data?.data || [
    { name: 'DEC 2', weight: 420, revenue: 210, dispenses: 3 },
    { name: 'DEC 3', weight: 650, revenue: 325, dispenses: 5 },
    { name: 'DEC 4', weight: 300, revenue: 150, dispenses: 2 },
    { name: 'DEC 5', weight: 890, revenue: 445, dispenses: 7 },
    { name: 'DEC 6', weight: 520, revenue: 260, dispenses: 4 },
    { name: 'DEC 7', weight: 740, revenue: 370, dispenses: 6 },
    { name: 'TODAY', weight: 610, revenue: 305, dispenses: 5 },
  ];

  const totalWeight = points.reduce((acc, p) => acc + p.weight, 0);
  const totalRev = points.reduce((acc, p) => acc + p.revenue, 0);

  return (
    <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 shadow-card-subtle backdrop-blur-sm">
      {/* Chart Top Header (styled like reference "Income & Expenses") */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-medium text-slate-100">Telemetry Trends</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
              Live Scale
            </span>
          </div>
          <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-400 font-light">
            <span className="flex items-center text-sky-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              {metric === 'weight' ? `${formatWeight(totalWeight)} 7-day volume` : `${formatBDT(totalRev)} 7-day revenue`}
            </span>
            <span className="text-slate-600">•</span>
            <span>HX711 load cell telemetry</span>
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#090c13] p-1 rounded-full border border-[#1b2235] text-xs">
            <button
              onClick={() => setMetric('weight')}
              className={`px-3.5 py-1 rounded-full transition-all text-xs font-medium ${
                metric === 'weight'
                  ? 'bg-[#0084ff] text-white shadow-sky-pill'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weight (g)
            </button>
            <button
              onClick={() => setMetric('revenue')}
              className={`px-3.5 py-1 rounded-full transition-all text-xs font-medium ${
                metric === 'revenue'
                  ? 'bg-[#0084ff] text-white shadow-sky-pill'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Revenue (BDT)
            </button>
          </div>

          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-[#151b2a] border border-[#222a42] text-[11px] text-slate-400">
            <span>7 Days</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0084ff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0084ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={-5}
              tickFormatter={(val) => (metric === 'revenue' ? `৳${val}` : `${val}g`)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ChartPoint;
                  return (
                    <div className="rounded-2xl border border-[#222a42] bg-[#090c13]/95 p-3 shadow-2xl backdrop-blur-md text-xs">
                      <div className="text-[11px] text-slate-400 font-mono mb-1">{data.name}</div>
                      <div className="flex items-center space-x-1.5 text-slate-100 font-medium">
                        <Scale className="w-3.5 h-3.5 text-sky-400" />
                        <span>Dispensed:</span>
                        <span className="text-sky-300 font-medium">{formatWeight(data.weight)}</span>
                      </div>
                      <div className="text-slate-300 mt-1 font-medium">
                        Billed:{' '}
                        <span className="text-emerald-400">{formatBDT(data.revenue)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {data.dispenses} total checkouts
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="#0084ff"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#skyGradient)"
              dot={{
                r: 3.5,
                fill: '#0084ff',
                stroke: '#0f1420',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: '#38bdf8',
                stroke: '#ffffff',
                strokeWidth: 2,
                className: 'shadow-sky-glow',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
