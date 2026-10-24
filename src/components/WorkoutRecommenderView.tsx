import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Info,
  Play,
  Target,
  Zap,
} from 'lucide-react';
import { MemberProfile } from '../models/MemberProfile';
import { ExperienceLevel, FitnessGoal, SplitType } from '../models/types';
import { WorkoutPlanFactory } from '../models/WorkoutPlanFactory';

interface WorkoutRecommenderViewProps {
  currentProfile: MemberProfile | null;
  onLaunchLiveSession: (planSplit: SplitType, experience: ExperienceLevel, goal: FitnessGoal) => void;
}

export const WorkoutRecommenderView: React.FC<WorkoutRecommenderViewProps> = ({
  currentProfile,
  onLaunchLiveSession,
}) => {
  const [selectedSplit, setSelectedSplit] = useState<SplitType>('push');
  const [experience, setExperience] = useState<ExperienceLevel>(
    currentProfile?.experienceLevel || 'intermediate'
  );
  const [goal, setGoal] = useState<FitnessGoal>(currentProfile?.fitnessGoal || 'muscle_gain');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  const plan = WorkoutPlanFactory.create(selectedSplit, experience, goal);
  const overview = plan.getSplitOverview();
  const routine = plan.generateRoutine();
  const estimatedCalories60m = plan.calculateEstimatedCalories(60, currentProfile?.weightKg || 70);

  const toggleExpand = (id: string) => {
    setExpandedExerciseId(expandedExerciseId === id ? null : id);
  };

  const splitTabs: { id: SplitType; label: string; muscles: string }[] = [
    { id: 'push', label: 'Push Split', muscles: 'Chest, Shoulders & Triceps' },
    { id: 'pull', label: 'Pull Split', muscles: 'Back, Biceps & Rear Delts' },
    { id: 'legs_core', label: 'Legs & Core', muscles: 'Quads, Hamstrings, Glutes & Abs' },
    { id: 'full_body', label: 'Full Body', muscles: 'Compound Synergy' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Launch CTA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            OOP Routine Generator · SDF04
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            FitForge Workout Recommender
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Polymorphic 5-exercise routine generation adjusted to athlete tier and target split.
          </p>
        </div>

        <button
          onClick={() => onLaunchLiveSession(selectedSplit, experience, goal)}
          className="px-5 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-gray-950" />
          <span>Launch Live Workout Tracker</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      {/* Split Selector & Parameter Controls */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/40 p-5 space-y-5">
        {/* Split Tabs */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
            Select Training Split
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {splitTabs.map((tab) => {
              const isSelected = selectedSplit === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSplit(tab.id)}
                  className={`p-3 text-left border rounded-md transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-gray-900 text-white'
                      : 'border-gray-800 bg-gray-950/40 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{tab.label}</div>
                  <div className="text-[11px] text-gray-400 truncate mt-0.5">{tab.muscles}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Experience & Goal Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-800/80">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Experience Tier (Sets Prescribed)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setExperience(lvl)}
                  className={`py-2 px-3 text-xs font-medium rounded-md capitalize border transition-colors cursor-pointer text-center ${
                    experience === lvl
                      ? 'border-emerald-500 bg-gray-900 text-emerald-400'
                      : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  {lvl} ({lvl === 'beginner' ? '3' : lvl === 'intermediate' ? '4' : '5'} sets)
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Primary Goal (Rep & Rest Scheme)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'muscle_gain' as const, label: 'Hypertrophy', desc: '8-12 reps' },
                { id: 'strength' as const, label: 'Strength', desc: '3-6 reps' },
                { id: 'weight_loss' as const, label: 'Fat Loss', desc: '12-15 reps' },
                { id: 'endurance' as const, label: 'Endurance', desc: '15+ reps' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`py-1.5 px-2 text-center rounded-md border transition-colors cursor-pointer ${
                    goal === g.id
                      ? 'border-cyan-500 bg-gray-900 text-cyan-400'
                      : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  <div className="text-xs font-medium">{g.label}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Routine Prescription Header Bar */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/60 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            {plan.splitType.toUpperCase()} Class Prescription · 5 Exercises
          </div>
          <h2 className="text-base font-bold text-white mt-0.5">{overview.title}</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">{overview.focus}</p>
        </div>

        <div className="flex items-center gap-6 shrink-0 text-xs font-mono">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase">Prescription</span>
            <span className="font-bold text-white">
              {plan.getRecommendedSets()} Sets × {plan.getRecommendedReps()} Reps
            </span>
          </div>
          <div className="h-6 w-px bg-gray-800" />
          <div>
            <span className="text-gray-400 block text-[10px] uppercase">Rest Time</span>
            <span className="font-bold text-cyan-400">
              {plan.getRecommendedRestSeconds()}s Countdown
            </span>
          </div>
          <div className="h-6 w-px bg-gray-800" />
          <div>
            <span className="text-gray-400 block text-[10px] uppercase">Calorie Burn</span>
            <span className="font-bold text-emerald-400">
              ~{estimatedCalories60m} kcal / hr
            </span>
          </div>
        </div>
      </div>

      {/* 5-Exercise Routine Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
          <span>Prescribed 5-Exercise Sequence</span>
          <span>Click to toggle technique instructions</span>
        </div>

        <div className="space-y-2">
          {routine.map((ex, index) => {
            const isExpanded = expandedExerciseId === ex.id;
            return (
              <div
                key={ex.id}
                className="border border-gray-800 rounded-md bg-gray-900/50 hover:border-gray-700 transition-colors overflow-hidden"
              >
                {/* Exercise Row */}
                <div
                  onClick={() => toggleExpand(ex.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded border border-gray-800 bg-gray-950 font-mono text-xs font-bold text-emerald-400 flex items-center justify-center shrink-0">
                      0{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{ex.name}</span>
                        <span className="text-[11px] font-mono text-gray-400">
                          [{ex.equipment}]
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        <span className="text-emerald-400">{ex.targetMuscle}</span>
                        {ex.secondaryMuscles.length > 0 && (
                          <span className="text-gray-400">
                            {' '}· Secondary: {ex.secondaryMuscles.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block font-mono text-xs">
                      <div className="text-gray-200">
                        {ex.defaultSets} Sets × {ex.defaultReps} Reps
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {ex.suggestedRestSeconds}s Rest
                      </div>
                    </div>
                    <div className="text-gray-500 p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-2 border-t border-gray-800 bg-gray-950/60 space-y-3">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-gray-400 mb-1.5">
                        Execution Guide:
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-xs text-gray-300">
                        {ex.instructions.map((step, sIdx) => (
                          <li key={sIdx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {ex.tip && (
                      <div className="p-3 rounded border border-gray-800 bg-gray-900/60 text-xs text-gray-300 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                        <div>
                          <strong className="text-white font-medium">Coach Cue: </strong>
                          {ex.tip}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
