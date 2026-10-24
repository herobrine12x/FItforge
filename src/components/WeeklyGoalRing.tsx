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
      className="flex flex-col items-center justify-between p-4 bg-[#16161D] rounded-3xl border border-[#24242E] relative overflow-hidden"
      role="region"
      aria-label={`Weekly goal progress: ${safeCompleted} of ${safeGoal} workouts completed (${percentage}%)`}
    >
      <div className="w-full flex items-center justify-between pb-2 border-b border-[#24242E]/60 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">Weekly Goal Target</span>
        <span className="text-[11px] font-mono text-[#C6FF3D] flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-[#C6FF3D]" />
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
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1E1E28"
            strokeWidth={strokeWidth}
          />
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#C6FF3D"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline gap-0.5">
            <span className="font-heading text-3xl font-black text-[#F4F4F6]">{safeCompleted}</span>
            <span className="text-sm font-bold text-[#A1A1AA]">/ {safeGoal}</span>
          </div>
          <span className="text-[11px] font-mono text-[#A1A1AA] uppercase tracking-wider">Workouts</span>
        </div>
      </div>

      {/* Footer Motivation */}
      <div className="mt-2 text-center w-full">
        {isCompleted ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6FF3D]/15 border border-[#C6FF3D]/40 text-[#C6FF3D] text-xs font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>Target Achieved!</span>
          </div>
        ) : (
          <div className="text-xs text-[#A1A1AA]">
            <strong className="text-[#F4F4F6] font-semibold">{safeGoal - safeCompleted} more</strong> session
            {safeGoal - safeCompleted === 1 ? '' : 's'} to hit target
          </div>
        )}
      </div>
    </div>
  );
}
