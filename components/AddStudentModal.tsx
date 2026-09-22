'use client';

import React, { useState } from 'react';
import { X, UserPlus, CreditCard, User, Building, DollarSign } from 'lucide-react';
import { normalizeCardUid } from '@/lib/utils';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [cardUid, setCardUid] = useState('');
  const [department, setDepartment] = useState('');
  const [initialBalance, setInitialBalance] = useState('100.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          studentId,
          cardUid: normalizeCardUid(cardUid),
          department,
          initialBalance: parseFloat(initialBalance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to enroll student');
      }

      onSuccess();
      onClose();
      setName('');
      setStudentId('');
      setCardUid('');
      setDepartment('');
      setInitialBalance('100.00');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#1b2235] bg-[#0f1420] p-6 shadow-card-subtle relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-[#151b2a] transition-smooth"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-100">Enroll RFID Student</h3>
            <p className="text-xs text-slate-400 font-light">Assign hardware card UID and initialize balance</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shahriar Hossain"
                className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Student ID</label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 2003001"
                className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono text-xs transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Department</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. CSE"
                  className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">
              RFID Card UID <span className="text-slate-500 font-light">(Auto-normalized)</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={cardUid}
                onChange={(e) => setCardUid(e.target.value)}
                placeholder="e.g. 43A1B2C3 or 43:a1:b2:c3"
                className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono uppercase text-xs transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Initial Balance (BDT)</label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="100.00"
                className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono text-xs transition-colors"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#1b2235] text-slate-400 hover:text-slate-200 hover:bg-[#151b2a] text-xs font-medium transition-smooth"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-full bg-[#0084ff] hover:bg-[#0074e0] text-white text-xs font-medium transition-smooth shadow-sky-pill disabled:opacity-50"
            >
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
