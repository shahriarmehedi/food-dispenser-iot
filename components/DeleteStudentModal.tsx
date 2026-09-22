'use client';

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { formatBDT } from '@/lib/utils';

interface StudentData {
  id: string;
  name: string;
  studentId: string;
  cardUid: string;
  balance: number;
}

interface DeleteStudentModalProps {
  isOpen: boolean;
  student: StudentData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteStudentModal({
  isOpen,
  student,
  onClose,
  onSuccess,
}: DeleteStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  async function handleDelete() {
    if (!student) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete student');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during deletion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-3xl border border-rose-500/20 bg-[#0f1420] p-6 shadow-card-subtle relative text-slate-200">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-[#151b2a] transition-smooth"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/25 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-100">Delete Student Record</h3>
            <p className="text-xs text-rose-400/80 font-light">Irreversible administrative action</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="bg-[#090c13] rounded-2xl p-4 border border-[#1b2235] space-y-2 mb-5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Student Name:</span>
            <span className="font-medium text-slate-200">{student.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Institutional ID:</span>
            <span className="font-mono text-slate-200">{student.studentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Card UID:</span>
            <span className="font-mono text-sky-400">{student.cardUid}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Remaining Balance:</span>
            <span className="font-mono text-amber-400">{formatBDT(student.balance)}</span>
          </div>
        </div>

        <div className="flex items-start space-x-2.5 p-3 rounded-2xl bg-rose-500/5 border border-rose-500/15 text-[11px] text-rose-300/90 mb-6">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>
            Deleting this student will also permanently purge their purchase receipts and recharge records. This action cannot be undone.
          </span>
        </div>

        <div className="flex space-x-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full border border-[#222a42] text-slate-400 hover:text-slate-200 hover:bg-[#151b2a] transition-smooth font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 transition-smooth font-medium disabled:opacity-50 flex items-center justify-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
