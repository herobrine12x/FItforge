import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Calendar,
  Dumbbell,
  Flame,
  PlayCircle,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { PersonalRecord, PersonalRecordManager } from '../models/PersonalRecord';
import { SetLogManager } from '../models/SetLogManager';

interface PersonalRecordsViewProps {
  userId: string;
}

export const PersonalRecordsView: React.FC<PersonalRecordsViewProps> = ({ userId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<'weight_desc' | 'onerm_desc' | 'name_asc'>('onerm_desc');

  const prManager = useMemo(() => new PersonalRecordManager(), []);
  const setLogManager = useMemo(() => new SetLogManager(), []);

  // Compute records for current athlete
  const personalRecords = useMemo(() => {
    return prManager.getRecordsForUser(userId);
  }, [prManager, userId]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = personalRecords.filter((pr) =>
      pr.exerciseName.toLowerCase().includes(q)
    );

    list.sort((a, b) => {
      if (selectedSort === 'weight_desc') {
        return b.bestWeightKg - a.bestWeightKg;
      }
      if (selectedSort === 'onerm_desc') {
        return b.bestEstimatedOneRepMaxKg - a.bestEstimatedOneRepMaxKg;
      }
      return a.exerciseName.localeCompare(b.exerciseName);
    });

    return list;
  }, [personalRecords, searchQuery, selectedSort]);

  const totalPRs = personalRecords.length;
  const top1RM = personalRecords.reduce(
    (max, pr) => Math.max(max, pr.bestEstimatedOneRepMaxKg),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Stat Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">
              Exercises Tracked
            </div>
            <div className="font-heading text-3xl font-black text-slate-900 dark:text-[#F4F4F6] mt-1">
              {totalPRs}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#65a30d]/10 dark:bg-[#C6FF3D]/10 border border-[#65a30d]/20 dark:border-[#C6FF3D]/20 text-[#65a30d] dark:text-[#C6FF3D] flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">
              Peak Estimated 1RM
            </div>
            <div className="font-heading text-3xl font-black text-slate-900 dark:text-[#C6FF3D] mt-1">
              {top1RM > 0 ? `${top1RM} kg` : '--'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">
              1RM Calculation Standard
            </div>
            <div className="text-xs font-mono font-semibold text-slate-900 dark:text-[#F4F4F6] mt-1.5 leading-tight">
              Epley Formula: Weight × (1 + Reps/30)
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-[#f8fafc] dark:bg-[#16161D] rounded-2xl border border-slate-200 dark:border-[#24242E] shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 dark:text-[#A1A1AA] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search exercises by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-[#F4F4F6] placeholder:text-slate-400 dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-slate-400 dark:focus:border-[#C6FF3D] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-600 dark:text-[#A1A1AA] uppercase shrink-0">Sort:</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] rounded-xl text-xs font-mono text-slate-900 dark:text-[#F4F4F6] focus:outline-none focus:border-slate-400 dark:focus:border-[#C6FF3D]"
          >
            <option value="onerm_desc">Highest 1RM</option>
            <option value="weight_desc">Heaviest Weight</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Personal Records Cards Grid or Empty State */}
      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((pr) => {
            const overloadHint = setLogManager.generateProgressiveOverloadHint(
              userId,
              pr.exerciseName,
              10,
              pr.bestWeightKg
            );

            const bestWeightDateFormatted = new Date(pr.bestWeightDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            const best1RMDateFormatted = new Date(pr.bestEstimated1RMDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={pr.exerciseName}
                className="group relative p-5 bg-[#f8fafc] dark:bg-[#16161D] hover:bg-slate-100/70 dark:hover:bg-[#1a1a24] rounded-3xl border border-slate-200 dark:border-[#24242E] hover:border-slate-300 dark:hover:border-[#C6FF3D]/40 transition-all shadow-sm dark:shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-[#F4F4F6] tracking-wide group-hover:text-slate-950 dark:group-hover:text-[#C6FF3D] transition-colors line-clamp-1">
                      {pr.exerciseName}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#65a30d]/15 dark:bg-[#C6FF3D]/15 text-[#4d7c0f] dark:text-[#C6FF3D] border border-[#65a30d]/30 dark:border-[#C6FF3D]/30 shrink-0">
                      <Trophy className="w-3 h-3" />
                      <span>PR RECORD</span>
                    </span>
                  </div>

                  {/* Dual Stat Metrics: Best Weight & Best 1RM */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {/* Best Weight */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E]">
                      <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#A1A1AA] flex items-center justify-between">
                        <span>Best Weight</span>
                        <Award className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                      </div>
                      <div className="font-heading text-2xl font-black text-slate-900 dark:text-[#F4F4F6] mt-1">
                        {pr.bestWeightKg}{' '}
                        <span className="text-xs font-mono text-slate-500 dark:text-[#A1A1AA]">kg</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-[#A1A1AA] mt-0.5">
                        {pr.bestWeightReps} reps · {bestWeightDateFormatted}
                      </div>
                    </div>

                    {/* Best Estimated 1RM */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E]">
                      <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#A1A1AA] flex items-center justify-between">
                        <span>Estimated 1RM</span>
                        <Flame className="w-3 h-3 text-orange-500 dark:text-[#C6FF3D]" />
                      </div>
                      <div className="font-heading text-2xl font-black text-slate-900 dark:text-[#C6FF3D] mt-1">
                        {pr.bestEstimatedOneRepMaxKg}{' '}
                        <span className="text-xs font-mono text-slate-500 dark:text-[#A1A1AA]">kg</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-[#A1A1AA] mt-0.5">
                        {pr.bestEstimated1RMReps} reps · {best1RMDateFormatted}
                      </div>
                    </div>
                  </div>

                  {/* Progressive Overload Suggestion */}
                  <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-[#0B0B0F]/70 border border-slate-200 dark:border-[#24242E] text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-[#4d7c0f] dark:text-[#C6FF3D] font-bold mb-1">
                      <Zap className="w-3 h-3" />
                      <span>Progressive Overload Target</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-[#A1A1AA] leading-relaxed">
                      {overloadHint.message}
                    </p>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#24242E]/70 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#71717A]">
                  <span>{pr.totalSets} total sets logged</span>
                  <span>Epley 1RM Model</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 px-4 bg-[#f8fafc] dark:bg-[#16161D] rounded-3xl border border-slate-200 dark:border-[#24242E] text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-200 dark:bg-[#24242E] flex items-center justify-center text-slate-800 dark:text-[#C6FF3D] mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="font-heading text-2xl font-bold uppercase tracking-wide text-slate-900 dark:text-[#F4F4F6]">
            No Personal Records Yet
          </h3>
          <p className="text-sm text-slate-600 dark:text-[#A1A1AA] max-w-md mt-2 leading-relaxed">
            Personal Records and Estimated 1RMs are tracked automatically as you complete sets in the guided workout session. Complete your first workout to establish your baseline!
          </p>
          <Link
            to="/workout"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52e] dark:text-[#0B0B0F] font-bold text-sm tracking-wide transition-all shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/20 cursor-pointer"
          >
            <PlayCircle className="w-5 h-5" />
            <span>Launch Guided Workout</span>
          </Link>
        </div>
      )}
    </div>
  );
};
