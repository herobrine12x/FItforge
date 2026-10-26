import React from 'react';
import { Award, Flame } from 'lucide-react';

interface WeeklyGoalRingProps {
  completedThisWeek: number;
  weeklyGoal: number;
}

export function WeeklyGoalRing({ completedThisWeek, weeklyGoal }: WeeklyGoalRingProps) {
  const safeGoal = Math.max(1, weeklyGoal || 3);
  const safeCompleted = Math.max(0, completedThisWeek || 0);
  const percentage = Math.min(100, Math.round((safeCompleted / safeGoal) * 100));

  // Circle SVG dimensions
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isCompleted = safeCompleted >= safeGoal;

  return (
    <div
      className="flex flex-col items-center justify-between p-5 bg-[#f8fafc] dark:bg-[#16161D] rounded-3xl border border-slate-200 dark:border-[#24242E] shadow-sm relative overflow-hidden"
      role="region"
      aria-label={`Weekly goal progress: ${safeCompleted} of ${safeGoal} workouts completed (${percentage}%)`}
    >
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#24242E]/60 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">Weekly Goal Target</span>
        <span className="text-[11px] font-mono text-emerald-800 dark:text-[#C6FF3D] flex items-center gap-1 font-bold">
          <Flame className="w-3.5 h-3.5 text-emerald-700 dark:text-[#C6FF3D]" />
          {percentage}% Done
        </span>
      </div>

      <div className="relative flex items-center justify-center my-1">
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg] overflow-visible"
          aria-hidden="true"
        >
          {/* Background Track / Empty Goal Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-slate-200 dark:text-[#1E1E28]"
            strokeWidth={strokeWidth}
          />
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-emerald-600 dark:text-[#C6FF3D] transition-all duration-700 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline gap-0.5">
            <span className="font-heading text-3xl font-black text-slate-900 dark:text-[#F4F4F6]">{safeCompleted}</span>
            <span className="text-sm font-bold text-slate-500 dark:text-[#A1A1AA]">/ {safeGoal}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider">Workouts</span>
        </div>
      </div>

      {/* Footer Motivation */}
      <div className="mt-2 text-center w-full">
        {isCompleted ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 dark:bg-[#C6FF3D]/15 dark:border-[#C6FF3D]/40 dark:text-[#C6FF3D] text-xs font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>Target Achieved!</span>
          </div>
        ) : (
          <div className="text-xs text-slate-600 dark:text-[#A1A1AA]">
            <strong className="text-slate-900 dark:text-[#F4F4F6] font-semibold">{safeGoal - safeCompleted} more</strong> session
            {safeGoal - safeCompleted === 1 ? '' : 's'} to hit target
          </div>
        )}
      </div>
    </div>
  );
}
