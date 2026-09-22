'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, CreditCard, User, Building, DollarSign, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { normalizeCardUid } from '@/lib/utils';

interface StudentData {
  id: string;
  name: string;
  studentId: string;
  cardUid: string;
  department: string | null;
  balance: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

interface EditStudentModalProps {
  isOpen: boolean;
  student: StudentData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditStudentModal({
  isOpen,
  student,
  onClose,
  onSuccess,
}: EditStudentModalProps) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [cardUid, setCardUid] = useState('');
  const [department, setDepartment] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setStudentId(student.studentId);
      setCardUid(student.cardUid);
      setDepartment(student.department || '');
      setBalance(Number(student.balance).toFixed(2));
      setStatus(student.status);
      setError(null);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          studentId,
          cardUid: normalizeCardUid(cardUid),
          department,
          balance: parseFloat(balance) || 0,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update student profile');
      }

      onSuccess();
      onClose();
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
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-100">Edit Student Record</h3>
            <p className="text-xs text-slate-400 font-light">Update RFID credentials, ID, or status</p>
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
                placeholder="e.g. Shahriar Mehedi"
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
                className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. CSE"
                className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Hardware RFID Card UID</label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={cardUid}
                onChange={(e) => setCardUid(e.target.value)}
                placeholder="e.g. 43A1B2C3"
                className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Current Balance (৳)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Account Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')}
                className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-[#222a42] text-slate-400 hover:text-slate-200 hover:bg-[#151b2a] transition-smooth font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-full bg-[#0084ff] hover:bg-[#0074e0] text-white shadow-sky-pill transition-smooth font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
