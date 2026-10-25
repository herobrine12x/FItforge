import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Image,
  Printer,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RecordManager } from '../models/RecordManager';
import { computeWeeklySummary, getWeekBoundaries } from '../models/SummaryEngine';
import { exportSummaryAsImage } from '../utils/summaryImageExport';

export function SummaryPage() {
  const { currentUser, currentProfile } = useAuth();
  const { success, error, info } = useToast();
  const [recordManager] = useState(() => new RecordManager());
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);

  const userId = currentUser?.id || 'demo_user';
  const athleteName = currentProfile?.name || currentUser?.username || 'Athlete';
  const weeklyGoal = currentProfile?.weeklyGoal || 3;

  // Load records for the current user
  const userRecords = useMemo(() => {
    if (!currentUser) return [];
    return recordManager.readAll(currentUser.id);
  }, [currentUser, recordManager]);

  // Compute summary metrics based on selected weekOffset
  const summary = useMemo(() => {
    return computeWeeklySummary(userRecords, weeklyGoal, weekOffset);
  }, [userRecords, weeklyGoal, weekOffset]);

  // Records for this specific week
  const weekRecords = useMemo(() => {
    const { startOfWeek, endOfWeek } = getWeekBoundaries(weekOffset);
    return userRecords.filter((r) => {
      const d = new Date(r.date);
      return d >= startOfWeek && d <= endOfWeek;
    });
  }, [userRecords, weekOffset]);

  // Handle Export Image (PNG)
  const handleExportImage = async () => {
    setIsExportingImage(true);
    try {
      await exportSummaryAsImage(summary, athleteName);
      success('Weekly summary card exported as high-resolution PNG image!');
    } catch (err) {
      error('Could not generate summary image. Please try again.');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Handle Print or Save as PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ================= HEADER & ACTIONS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#24242E] print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#F4F4F6]">
              Weekly Summary
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Consolidated training metrics, streak verification, and tailored goals for next week.
            </p>
          </div>
        </div>

        {/* Action Buttons: Print / PDF & Export Image */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isExportingImage}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#16161D] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D]/50 text-[#F4F4F6] text-xs font-heading font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Image className="w-4 h-4 text-[#C6FF3D]" />
            <span>{isExportingImage ? 'Generating...' : 'Export Image'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] text-xs font-heading font-black uppercase tracking-wider transition-all shadow-md shadow-[#C6FF3D]/20 cursor-pointer"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* ================= PRINT-FRIENDLY SUMMARY CARD ================= */}
      <div
        id="weekly-summary-printable-card"
        className="bg-[#16161D] rounded-3xl border border-[#24242E] p-6 sm:p-8 space-y-7 shadow-2xl relative overflow-hidden print:p-0 print:border-none print:shadow-none print:bg-white print:text-black"
      >
        {/* Top Lime Accent line for web view */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#C6FF3D] print:hidden" />

        {/* Card Header & Week Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#24242E] print:border-gray-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#C6FF3D]/10 text-[#C6FF3D] font-bold border border-[#C6FF3D]/20 print:border-black print:text-black">
                Performance Report
              </span>
              <span className="text-xs text-[#A1A1AA] print:text-gray-600 font-mono">
                Athlete: <strong className="text-white print:text-black">{athleteName}</strong>
              </span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wide text-[#F4F4F6] print:text-black">
              Week of {summary.weekStart} – {summary.weekEnd}
            </h2>
          </div>

          {/* Week Navigation Selector (hidden in print) */}
          <div className="flex items-center gap-2 self-start md:self-auto print:hidden">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-2 rounded-xl bg-[#0B0B0F] border border-[#24242E] hover:border-[#C6FF3D]/40 text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              title="Previous Week"
              aria-label="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#0B0B0F] border border-[#24242E] text-[#F4F4F6]">
              {weekOffset === 0 ? 'Current Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} Weeks Ago`}
            </span>

            <button
              type="button"
              onClick={() => setWeekOffset((prev) => Math.min(0, prev + 1))}
              disabled={weekOffset === 0}
              className="p-2 rounded-xl bg-[#0B0B0F] border border-[#24242E] hover:border-[#C6FF3D]/40 text-[#A1A1AA] hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next Week"
              aria-label="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= 4 CORE TILES GRID ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Workouts Done & Goal Progress */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] print:border-gray-300 print:bg-gray-50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[#A1A1AA] print:text-gray-600">
              <span className="text-[11px] font-mono uppercase">Workouts Done</span>
              <Target className="w-4 h-4 text-[#C6FF3D] print:text-black" />
            </div>
            <div>
              <div className="font-heading text-3xl sm:text-4xl font-black text-[#F4F4F6] print:text-black">
                {summary.workoutsDone}
                <span className="text-base text-[#A1A1AA] font-normal"> / {summary.weeklyGoal}</span>
              </div>
              <div className="text-[11px] text-[#C6FF3D] font-mono mt-1 print:text-black font-semibold">
                {summary.goalProgressPercent}% of Weekly Goal
              </div>
            </div>
          </div>

          {/* Tile 2: Total Active Minutes */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] print:border-gray-300 print:bg-gray-50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[#A1A1AA] print:text-gray-600">
              <span className="text-[11px] font-mono uppercase">Total Minutes</span>
              <Clock className="w-4 h-4 text-[#C6FF3D] print:text-black" />
            </div>
            <div>
              <div className="font-heading text-3xl sm:text-4xl font-black text-[#F4F4F6] print:text-black">
                {summary.totalMinutes}
                <span className="text-sm text-[#A1A1AA] font-normal"> mins</span>
              </div>
              <div className="text-[11px] text-[#A1A1AA] font-mono mt-1 print:text-gray-600">
                {summary.workoutsDone > 0 ? `~${Math.round(summary.totalMinutes / summary.workoutsDone)} min / session` : 'No sessions logged'}
              </div>
            </div>
          </div>

          {/* Tile 3: Total Calories Burned */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] print:border-gray-300 print:bg-gray-50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[#A1A1AA] print:text-gray-600">
              <span className="text-[11px] font-mono uppercase">Total Calories</span>
              <Flame className="w-4 h-4 text-[#C6FF3D] print:text-black" />
            </div>
            <div>
              <div className="font-heading text-3xl sm:text-4xl font-black text-[#F4F4F6] print:text-black">
                {summary.totalCalories.toLocaleString()}
                <span className="text-sm text-[#A1A1AA] font-normal"> kcal</span>
              </div>
              <div className="text-[11px] text-[#A1A1AA] font-mono mt-1 print:text-gray-600">
                Estimated Energy Output
              </div>
            </div>
          </div>

          {/* Tile 4: Active Streak Counter */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] print:border-gray-300 print:bg-gray-50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[#A1A1AA] print:text-gray-600">
              <span className="text-[11px] font-mono uppercase">Active Streak</span>
              <Zap className="w-4 h-4 text-[#C6FF3D] print:text-black" />
            </div>
            <div>
              <div className="font-heading text-3xl sm:text-4xl font-black text-[#C6FF3D] print:text-black flex items-center gap-1">
                <Flame className="w-6 h-6 fill-current" />
                <span>{summary.currentStreak} {summary.currentStreak === 1 ? 'day' : 'days'}</span>
              </div>
              <div className="text-[11px] text-[#A1A1AA] font-mono mt-1 print:text-gray-600">
                Best Ever: <strong>{summary.bestStreak} days</strong> (1-day grace)
              </div>
            </div>
          </div>
        </div>

        {/* ================= BEST DAY CARD ================= */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0B0F] border border-[#24242E] print:border-gray-300 print:bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#C6FF3D] print:text-black" />
              <span className="font-heading text-sm font-bold uppercase tracking-wider text-[#F4F4F6] print:text-black">
                Best Training Day of the Week
              </span>
            </div>
            {summary.bestDay && (
              <span className="text-[11px] font-mono text-[#C6FF3D] print:text-black font-bold">
                Top Energy Peak
              </span>
            )}
          </div>

          {summary.bestDay ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#16161D] border border-[#24242E] print:border-gray-300 print:bg-white">
              <div className="space-y-1">
                <div className="font-heading text-lg font-bold text-[#F4F4F6] print:text-black">
                  {summary.bestDay.dayName} · {summary.bestDay.splitName}
                </div>
                <div className="text-xs text-[#A1A1AA] print:text-gray-600 font-mono">
                  Recorded on {summary.bestDay.date}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-[#C6FF3D] print:text-black font-bold">
                  <Flame className="w-4 h-4" />
                  <span>{summary.bestDay.caloriesBurned} kcal</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#A1A1AA] print:text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{summary.bestDay.durationMinutes} mins</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#A1A1AA] italic p-3">
              No workouts or walks recorded for this calendar week.
            </div>
          )}
        </div>

        {/* ================= WHAT TO AIM FOR NEXT WEEK ================= */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#16161D] via-[#16161D] to-[#24242E] border border-[#C6FF3D]/40 shadow-lg shadow-[#C6FF3D]/5 print:border-black print:bg-gray-100 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#C6FF3D] text-[#0B0B0F] text-[10px] font-heading font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>What to Aim for Next Week</span>
          </div>

          <p className="text-sm sm:text-base text-[#F4F4F6] print:text-black leading-relaxed font-medium">
            "{summary.whatToAimForNextWeek}"
          </p>
        </div>

        {/* ================= SESSIONS BREAKDOWN IN THIS WEEK ================= */}
        {weekRecords.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-heading text-xs uppercase tracking-wider text-[#A1A1AA] print:text-gray-700">
                Sessions Logged This Week ({weekRecords.length})
              </span>
              <span className="text-[11px] font-mono text-[#A1A1AA] print:text-gray-600">
                Mon to Sun
              </span>
            </div>

            <div className="divide-y divide-[#24242E] print:divide-gray-300 border border-[#24242E] print:border-gray-300 rounded-2xl overflow-hidden bg-[#0B0B0F] print:bg-white">
              {weekRecords.map((rec) => {
                const recDate = new Date(rec.date);
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][recDate.getDay()];
                const isWalk = (rec.splitName || '').toLowerCase().includes('walk') || (rec.splitType || '').toLowerCase().includes('walk');

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#16161D] print:bg-gray-100 flex items-center justify-center text-[#C6FF3D] print:text-black shrink-0 font-mono font-bold text-[11px]">
                        {dayName}
                      </div>
                      <div>
                        <div className="font-semibold text-[#F4F4F6] print:text-black flex items-center gap-1.5">
                          {isWalk ? <Footprints className="w-3.5 h-3.5 text-[#C6FF3D] print:text-black" /> : <Dumbbell className="w-3.5 h-3.5 text-[#C6FF3D] print:text-black" />}
                          <span>{rec.splitName}</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#A1A1AA] print:text-gray-600">
                          {rec.date.split('T')[0]}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-[#C6FF3D] print:text-black font-semibold">
                        {rec.caloriesBurned} kcal
                      </span>
                      <span className="text-[#A1A1AA] print:text-gray-600">
                        {rec.durationMinutes}m
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-[#24242E] print:border-gray-300 text-[11px] font-mono text-[#71717A] print:text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FitForge Motivation & Accountability Engine</span>
          <span>Week Cycle: Monday 00:00 → Sunday 23:59</span>
        </div>
      </div>
    </div>
  );
}
