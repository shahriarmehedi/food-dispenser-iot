'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { X, Wallet, ArrowUpCircle, User } from 'lucide-react';
import { formatBDT } from '@/lib/utils';

interface StudentItem {
  id: string;
  name: string;
  studentId: string;
  cardUid: string;
  balance: number;
}

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student?: StudentItem | null;
}

const PRESET_AMOUNTS = [50, 100, 200, 500];
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RechargeModal({
  isOpen,
  onClose,
  onSuccess,
  student,
}: RechargeModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customAmount, setCustomAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch students if opened generally from the right panel
  const { data: studentsData } = useSWR<{ students: StudentItem[] }>(
    isOpen && !student ? '/api/students' : null,
    fetcher
  );

  useEffect(() => {
    if (student) {
      setSelectedStudentId(student.id);
    } else if (studentsData?.students?.length) {
      setSelectedStudentId(studentsData.students[0].id);
    }
  }, [student, studentsData]);

  if (!isOpen) return null;

  const currentStudent =
    student ||
    studentsData?.students?.find((s) => s.id === selectedStudentId) ||
    studentsData?.students?.[0];

  async function handleRecharge(amount: number) {
    if (!currentStudent) {
      setError('Please select a student');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/students/${currentStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recharge',
          amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to recharge account');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to top up balance');
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
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-100">Top-Up RFID Balance</h3>
            <p className="text-xs text-slate-400 font-light">Credit funds with audit tracking</p>
          </div>
        </div>

        {/* Student Selector if not preselected */}
        {!student && studentsData?.students && (
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Select Student</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-500" />
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              >
                {studentsData.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.studentId}) — ৳{s.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Selected Student Card */}
        {currentStudent && (
          <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] mb-5">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-1 font-light">
              <span>Card UID:</span>
              <span className="font-mono text-sky-400">{currentStudent.cardUid}</span>
            </div>
            <div className="text-sm font-medium text-slate-100">{currentStudent.name}</div>
            <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-[#1b2235]">
              <span className="text-slate-400 font-light">Current Balance:</span>
              <span className="font-medium text-emerald-400">{formatBDT(currentStudent.balance)}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2 font-medium">Quick Amount Presets (BDT)</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCustomAmount(amt.toString())}
                  className={`py-2 text-xs font-medium rounded-full border transition-smooth ${
                    customAmount === amt.toString()
                      ? 'bg-[#0084ff] border-sky-400 text-white shadow-sky-pill'
                      : 'bg-[#090c13] border-[#1b2235] text-slate-300 hover:border-[#2b3452]'
                  }`}
                >
                  +৳{amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Custom Amount (BDT)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-mono">৳</span>
              <input
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="100.00"
                className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-8 pr-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 text-xs transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#1b2235] text-slate-400 hover:text-slate-200 hover:bg-[#151b2a] text-xs font-medium transition-smooth"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !customAmount || parseFloat(customAmount) <= 0 || !currentStudent}
              onClick={() => handleRecharge(parseFloat(customAmount))}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-full bg-[#0084ff] hover:bg-[#0074e0] text-white text-xs font-medium transition-smooth shadow-sky-pill disabled:opacity-50"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing...' : `Confirm +${formatBDT(parseFloat(customAmount) || 0)}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
