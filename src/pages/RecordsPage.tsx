import React from 'react';
import { Award, Trophy } from 'lucide-react';
import { PersonalRecordsView } from '../components/PersonalRecordsView';
import { useAuth } from '../context/AuthContext';

export function RecordsPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || 'demo_user';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#24242E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-[#C6FF3D]/10 dark:text-[#C6FF3D] dark:border-[#C6FF3D]/20 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
              Personal Records
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-0.5">
              Best weight, estimated 1RM, and progressive overload targets per exercise
            </p>
          </div>
        </div>
      </div>

      {/* Main Records Component */}
      <PersonalRecordsView userId={userId} />
    </div>
  );
}
