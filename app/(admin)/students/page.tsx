'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Users,
  Search,
  UserPlus,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  CreditCard,
  Building,
  Edit,
  Trash2,
} from 'lucide-react';
import { formatBDT } from '@/lib/utils';
import AddStudentModal from '@/components/AddStudentModal';
import EditStudentModal from '@/components/EditStudentModal';
import DeleteStudentModal from '@/components/DeleteStudentModal';
import RechargeModal from '@/components/RechargeModal';

interface Student {
  id: string;
  name: string;
  studentId: string;
  cardUid: string;
  department: string | null;
  balance: number;
  status: 'ACTIVE' | 'SUSPENDED';
  transactionsCount: number;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [rechargeTarget, setRechargeTarget] = useState<Student | null>(null);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);

  const { data, isLoading, mutate, isValidating } = useSWR<{ students: Student[] }>(
    `/api/students?${queryParams.toString()}`,
    fetcher
  );

  const students = data?.students || [];

  async function handleToggleStatus(student: Student) {
    setUpdatingId(student.id);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStatus' }),
      });
      if (res.ok) {
        mutate();
      }
    } catch (err) {
      console.error('Error toggling student status:', err);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-slate-100 tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-sky-400" />
            <span>Student RFID Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-light">
            Manage canteen credentials, assign RFID physical cards, and top up account balances.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-[#0084ff] hover:bg-[#0074e0] text-white text-xs font-medium shadow-sky-pill transition-smooth self-start sm:self-auto active:scale-[0.98]"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0f1420]/80 p-4 rounded-3xl border border-[#1b2235] backdrop-blur-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, student ID, card UID..."
            className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-1 bg-[#090c13] p-1 rounded-full border border-[#1b2235] text-xs">
            {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1 rounded-full font-medium transition-smooth ${
                  statusFilter === st
                    ? 'bg-[#0084ff] text-white shadow-sky-pill'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => mutate()}
            className="p-2 rounded-2xl border border-[#1b2235] bg-[#090c13] hover:bg-[#151b2a] text-slate-400 hover:text-slate-200 transition-smooth"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 overflow-hidden shadow-card-subtle backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#090c13]/80 text-[11px] text-slate-400 font-medium border-b border-[#1b2235]">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-medium">Student Info</th>
                <th scope="col" className="px-5 py-3.5 font-medium">RFID Card UID</th>
                <th scope="col" className="px-5 py-3.5 font-medium">Department</th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">Balance</th>
                <th scope="col" className="px-5 py-3.5 text-center font-medium">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2235]/60">
              {isLoading && students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-light">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                      <span>Loading students directory...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-light">
                    No students match the selected filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isActive = student.status === 'ACTIVE';
                  const isUpdating = updatingId === student.id;

                  return (
                    <tr key={student.id} className="hover:bg-[#151b2a]/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-slate-100 font-medium">{student.name}</div>
                        <div className="text-[11px] text-slate-500 font-light">ID: {student.studentId}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#151b2a] border border-[#222a42] text-[11px] text-sky-400 font-mono">
                          <CreditCard className="w-3 h-3" />
                          <span>{student.cardUid}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {student.department ? (
                          <div className="flex items-center space-x-1.5">
                            <Building className="w-3 h-3 text-slate-500" />
                            <span>{student.department}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium whitespace-nowrap">
                        <span className={student.balance < 10 ? 'text-amber-400' : 'text-emerald-400'}>
                          {formatBDT(student.balance)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Top up button */}
                          <button
                            onClick={() => setRechargeTarget(student)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#151b2a] text-sky-400 hover:bg-[#1b2235] border border-[#222a42] text-[11px] font-medium transition-smooth"
                            title="Top Up Balance"
                          >
                            <PlusCircle className="w-3 h-3 text-sky-400" />
                            <span>Top Up</span>
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => setEditTarget(student)}
                            className="p-1.5 rounded-full bg-[#151b2a] text-slate-400 hover:text-sky-400 hover:bg-[#1b2235] border border-[#222a42] transition-smooth"
                            title="Edit Student Profile"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Suspended */}
                          <button
                            disabled={isUpdating}
                            onClick={() => handleToggleStatus(student)}
                            className="p-1 rounded-full text-xs transition-smooth"
                            title={isActive ? 'Suspend Card' : 'Activate Card'}
                          >
                            {isActive ? (
                              <ToggleRight className="w-5 h-5 text-sky-400 hover:text-rose-400 transition-colors" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-600 hover:text-sky-400 transition-colors" />
                            )}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setDeleteTarget(student)}
                            className="p-1.5 rounded-full bg-[#151b2a] text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-[#222a42] hover:border-rose-500/30 transition-smooth"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => mutate()}
      />

      <EditStudentModal
        isOpen={!!editTarget}
        student={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => mutate()}
      />

      <DeleteStudentModal
        isOpen={!!deleteTarget}
        student={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => mutate()}
      />

      <RechargeModal
        isOpen={!!rechargeTarget}
        student={rechargeTarget}
        onClose={() => setRechargeTarget(null)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
