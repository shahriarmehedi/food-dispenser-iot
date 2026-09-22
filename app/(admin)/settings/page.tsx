'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Sliders,
  DollarSign,
  ShieldAlert,
  Gauge,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface SettingsResponse {
  configs: {
    PRICE_PER_GRAM: string;
    MIN_BALANCE_THRESHOLD: string;
    WEIGHT_NOISE_THRESHOLD: string;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const { data, mutate, isLoading } = useSWR<SettingsResponse>('/api/settings', fetcher);

  const [pricePerGram, setPricePerGram] = useState('0.50');
  const [minBalanceThreshold, setMinBalanceThreshold] = useState('10.00');
  const [weightNoiseThreshold, setWeightNoiseThreshold] = useState('5.00');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (data?.configs) {
      if (data.configs.PRICE_PER_GRAM) setPricePerGram(data.configs.PRICE_PER_GRAM);
      if (data.configs.MIN_BALANCE_THRESHOLD) setMinBalanceThreshold(data.configs.MIN_BALANCE_THRESHOLD);
      if (data.configs.WEIGHT_NOISE_THRESHOLD) setWeightNoiseThreshold(data.configs.WEIGHT_NOISE_THRESHOLD);
    }
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          PRICE_PER_GRAM: parseFloat(pricePerGram),
          MIN_BALANCE_THRESHOLD: parseFloat(minBalanceThreshold),
          WEIGHT_NOISE_THRESHOLD: parseFloat(weightNoiseThreshold),
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save configuration');
      }

      setStatusMessage({ type: 'success', text: 'System configuration parameters saved and active immediately!' });
      mutate();
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error updating settings',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-medium text-slate-100 tracking-tight flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-sky-400" />
          <span>System Configurations & IoT Thresholds</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-light">
          Adjust live pricing rates, gate unlock criteria, and scale noise filtering without restarting the hardware server.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-3xl border flex items-center space-x-3 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 space-y-6 shadow-card-subtle backdrop-blur-sm">
          {/* Config 1: Price per Gram */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1b2235]">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-sky-400" />
                <span>Price Rate Per Gram (BDT)</span>
              </label>
              <p className="text-xs text-slate-400 font-light">
                Amount deducted per gram when a student unlocks and takes food.
              </p>
              <span className="text-[11px] font-mono text-slate-500">Key: PRICE_PER_GRAM</span>
            </div>
            <div className="w-full sm:w-48">
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-mono text-slate-400">৳/g</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={pricePerGram}
                  onChange={(e) => setPricePerGram(e.target.value)}
                  className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Config 2: Minimum Balance Threshold */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1b2235]">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Minimum Balance Threshold (BDT)</span>
              </label>
              <p className="text-xs text-slate-400 font-light">
                Required student card balance for the dispenser gate to unlock on RFID tap.
              </p>
              <span className="text-[11px] font-mono text-slate-500">Key: MIN_BALANCE_THRESHOLD</span>
            </div>
            <div className="w-full sm:w-48">
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-mono text-slate-400">৳</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={minBalanceThreshold}
                  onChange={(e) => setMinBalanceThreshold(e.target.value)}
                  className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-8 pr-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Config 3: Noise Threshold */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                <span>Weight Noise Threshold (Grams)</span>
              </label>
              <p className="text-xs text-slate-400 font-light">
                Differential weight at or below this value is treated as sensor noise (৳0.00 charge).
              </p>
              <span className="text-[11px] font-mono text-slate-500">Key: WEIGHT_NOISE_THRESHOLD</span>
            </div>
            <div className="w-full sm:w-48">
              <div className="relative">
                <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-400">grams</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={weightNoiseThreshold}
                  onChange={(e) => setWeightNoiseThreshold(e.target.value)}
                  className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-3 pr-14 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={saving || isLoading}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#0084ff] hover:bg-[#0074e0] text-white text-xs font-medium shadow-sky-pill transition-smooth disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
