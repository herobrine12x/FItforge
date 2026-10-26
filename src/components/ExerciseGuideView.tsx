import React from 'react';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  HelpCircle,
  Info,
  ShieldAlert,
  Sparkles,
  Wind,
  X,
} from 'lucide-react';
import { ExerciseGuide, SAFETY_WORDING } from '../models/exerciseGuides';

export interface ExerciseGuideViewProps {
  guide: ExerciseGuide;
  exerciseName: string;
  targetMuscle?: string;
  onClose?: () => void;
  actionButton?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const ExerciseGuideView: React.FC<ExerciseGuideViewProps> = ({
  guide,
  exerciseName,
  targetMuscle,
  onClose,
  actionButton,
  className = '',
  compact = false,
}) => {
  return (
    <div
      className={`rounded-2xl bg-[#f8fafc] dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] p-4 sm:p-5 space-y-4 text-left shadow-sm ${className}`}
    >
      {/* Header if standalone or collapsible */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#24242E]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-lime-500/15 border border-lime-500/30 text-lime-800 dark:border-transparent dark:bg-[#C6FF3D]/15 dark:text-[#C6FF3D] font-bold">
              Technique Guide
            </span>
            {targetMuscle && (
              <span className="text-[10px] font-mono text-slate-500 dark:text-[#A1A1AA] uppercase">
                · {targetMuscle}
              </span>
            )}
          </div>
          <h4 className="font-heading text-lg font-bold text-slate-900 dark:text-[#F4F4F6] uppercase tracking-wide">
            How to do {exerciseName}
          </h4>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F6] dark:hover:bg-[#16161D] transition-colors"
            title="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Safety Wording Banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 dark:bg-amber-950/20 dark:border-amber-500/30 dark:text-amber-300 text-xs font-mono">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>{SAFETY_WORDING}</span>
      </div>

      {/* 1. Setup */}
      <div className="space-y-1.5">
        <h5 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] flex items-center gap-1.5 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-lime-700 dark:text-[#C6FF3D]" />
          1. Getting into Position
        </h5>
        <ul className="space-y-1 text-xs text-slate-700 dark:text-[#F4F4F6] pl-5 list-disc marker:text-lime-700 dark:marker:text-[#C6FF3D]">
          {guide.setup.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* 2. Repetition Steps */}
      <div className="space-y-1.5">
        <h5 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] flex items-center gap-1.5 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-lime-700 dark:text-[#C6FF3D]" />
          2. Doing One Rep
        </h5>
        <div className="space-y-1.5">
          {guide.steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-[#F4F4F6]">
              <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 text-lime-800 dark:bg-[#16161D] dark:border-[#24242E] dark:text-[#C6FF3D] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed flex-1">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Breathing & Feels Like */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {/* Breathing */}
        <div className="p-3 rounded-xl bg-white dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] space-y-1 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">
            <Wind className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>Breathing</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-[#F4F4F6] leading-relaxed">
            {guide.breathing}
          </p>
        </div>

        {/* Feels Like */}
        <div className="p-3 rounded-xl bg-white dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] space-y-1 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">
            <Info className="w-3.5 h-3.5 text-lime-700 dark:text-[#C6FF3D] shrink-0" />
            <span>Target Feel</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-[#F4F4F6] leading-relaxed">
            {guide.feelsLike}
          </p>
        </div>
      </div>

      {/* 4. Common Mistakes & Safety Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Mistakes */}
        <div className="p-3 rounded-xl bg-white dark:bg-[#16161D] border border-rose-200 dark:border-rose-950/40 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-rose-700 dark:text-rose-400 font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Common Mistakes</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-[#A1A1AA] pl-4 list-disc marker:text-rose-500">
            {guide.commonMistakes.map((mistake, idx) => (
              <li key={idx} className="leading-relaxed">
                {mistake}
              </li>
            ))}
          </ul>
        </div>

        {/* Safety Tips */}
        <div className="p-3 rounded-xl bg-white dark:bg-[#16161D] border border-emerald-200 dark:border-[#24242E] space-y-1.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Safety Tips</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-[#A1A1AA] pl-4 list-disc marker:text-emerald-600 dark:marker:text-emerald-400">
            {guide.safetyTips.map((tip, idx) => (
              <li key={idx} className="leading-relaxed">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Easier & Harder Options */}
      <div className="pt-2 border-t border-slate-200 dark:border-[#24242E] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-[#16161D]/70 border border-slate-200 dark:border-[#24242E] shadow-xs">
          <ArrowDownCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-mono font-bold text-[10px] uppercase text-emerald-700 dark:text-emerald-400 block">
              Easier Option
            </span>
            <span className="text-slate-600 dark:text-[#A1A1AA] leading-snug">{guide.easierOption}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-[#16161D]/70 border border-slate-200 dark:border-[#24242E] shadow-xs">
          <ArrowUpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-mono font-bold text-[10px] uppercase text-amber-700 dark:text-amber-400 block">
              Harder Option
            </span>
            <span className="text-slate-600 dark:text-[#A1A1AA] leading-snug">{guide.harderOption}</span>
          </div>
        </div>
      </div>

      {/* Action CTA if provided (e.g. Got it, start set 1) */}
      {actionButton && <div className="pt-2">{actionButton}</div>}
    </div>
  );
};
