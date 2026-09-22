'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, ArrowRight, Activity, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#090c13] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Soft sky-blue ambient background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Floating Card */}
        <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/90 backdrop-blur-xl p-8 shadow-card-subtle">
          {/* Avatar Ring from Reference Image */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-sky-400/40 p-1 flex items-center justify-center animate-spin-slow">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-500/20 to-sky-400/10 flex items-center justify-center border border-sky-500/30">
                  <Shield className="w-8 h-8 text-sky-400" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0084ff] border-2 border-[#0f1420] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-xl font-medium text-slate-100 tracking-tight">Admin Gateway</h1>
            <p className="text-xs text-slate-400 mt-1.5 font-light">
              Enter your credentials to access the IoT food dispenser control center
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-full bg-[#0084ff] hover:bg-[#0074e0] text-white text-xs font-medium tracking-wide flex items-center justify-center space-x-2 shadow-sky-pill transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#1b2235] text-center">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#151b2a] border border-[#222a42] text-[11px] text-slate-400">
              <Shield className="w-3 h-3 text-sky-400" />
              <span>Canteen Management Gateway &middot; Authorized Access Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
