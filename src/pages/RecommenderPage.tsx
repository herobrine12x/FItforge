import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  HeartHandshake,
  Info,
  Layers,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BMICalculator } from '../models/BMICalculator';
import { Exercise } from '../models/Exercise';
import { RecordManager } from '../models/RecordManager';
import { ExperienceLevel } from '../models/types';
import { WorkoutPlan } from '../models/WorkoutPlan';
import { WorkoutPlanFactory } from '../models/WorkoutPlanFactory';
import {
  FOUR_RECOMMENDER_SPLITS,
  getLeastRecentlyTrainedSplit,
  RecommenderSplitKey,
  SplitCardConfig,
} from '../utils/recommender';

export function RecommenderPage() {
  const { currentUser, currentProfile } = useAuth();
  const navigate = useNavigate();
  const [recordManager] = useState(() => new RecordManager());

  // Athlete records for computing least-recently-trained split
  const userRecords = useMemo(() => {
    if (!currentUser) return [];
    return recordManager.readAll(currentUser.id);
  }, [currentUser, recordManager]);

  // Compute "Suggested for today" split (least recently trained)
  const suggestedSplitKey = useMemo<RecommenderSplitKey>(() => {
    return getLeastRecentlyTrainedSplit(userRecords);
  }, [userRecords]);

  // State: selected split (default to suggested split or 'push')
  const [selectedSplit, setSelectedSplit] = useState<RecommenderSplitKey>(suggestedSplitKey || 'push');

  // State: Experience level selector, defaulting to saved profile value
  const defaultExperience = useMemo<ExperienceLevel>(() => {
    const raw = currentProfile?.experienceLevel;
    if (!raw) return 'Intermediate';
    const lower = String(raw).toLowerCase();
    if (lower.includes('beg')) return 'Beginner';
    if (lower.includes('adv')) return 'Advanced';
    return 'Intermediate';
  }, [currentProfile?.experienceLevel]);

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(defaultExperience);

  // Biometrics & BMI evaluation
  const weightKg = currentProfile?.weightKg || 70;
  const heightCm = currentProfile?.heightCm || 175;

  const bmiScore = useMemo(() => {
    try {
      return BMICalculator.calculate(weightKg, heightCm);
    } catch {
      return 22.5;
    }
  }, [weightKg, heightCm]);

  const bmiCategory = useMemo(() => {
    try {
      return BMICalculator.classify(bmiScore);
    } catch {
      return 'Normal';
    }
  }, [bmiScore]);

  // Check if BMI is Overweight or Obese
  const isOverweightOrObese = bmiCategory === 'Overweight' || bmiCategory === 'Obese';

  // OOP POLYMORPHISM: One shared code path generates the 5 exercises
  // Instantiate matching WorkoutPlan subclass via Factory and call getExercises polymorphically
  const workoutPlan: WorkoutPlan = useMemo(() => {
    return WorkoutPlanFactory.create(selectedSplit);
  }, [selectedSplit]);

  const exercises: Exercise[] = useMemo(() => {
    // Single shared code path calling abstract WorkoutPlan.getExercises() polymorphically
    return workoutPlan.getExercises(experienceLevel);
  }, [workoutPlan, experienceLevel]);

  // Calories estimated for a standard 45-minute session
  const estimatedCalories = useMemo(() => {
    return workoutPlan.calculateCalories(weightKg, 45);
  }, [workoutPlan, weightKg]);

  // Launch live session with chosen plan
  const handleStartWorkout = () => {
    try {
      localStorage.setItem('fitforge_active_split', selectedSplit);
      localStorage.setItem('fitforge_active_level', String(experienceLevel));
    } catch {
      // Storage quota safe
    }

    navigate('/workout', {
      state: {
        splitType: selectedSplit,
        experienceLevel,
        planName: workoutPlan.name,
      },
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ================= PAGE HEADER & PRIMARY CTA ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#24242E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D]">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#F4F4F6]">
              Workout Recommender
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Polymorphic 5-exercise resistance splits dynamically tailored to your tier.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartWorkout}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-[#C6FF3D]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Play className="w-4 h-4 fill-[#0B0B0F]" />
          <span>Start This Workout</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ================= BMI OVERWEIGHT / OBESE LOW-IMPACT WARM-UP NOTE ================= */}
      {isOverweightOrObese && (
        <section
          className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg shadow-amber-950/20"
          role="note"
          aria-label="Low-impact warm-up recommendation"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold uppercase tracking-wider text-amber-300">
                Low-Impact Warm-Up Recommended
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold">
                BMI {bmiScore.toFixed(1)} · {bmiCategory}
              </span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Based on your biometric profile, we strongly recommend 5–8 minutes of low-impact cardiovascular warm-up
              (e.g., incline treadmill walk, elliptical, or dynamic joint rotations) before commencing compound working sets.
              This increases synovial fluid circulation, elevates core temperature, and shields knee and lumbar joints.
            </p>
          </div>
        </section>
      )}

      {/* ================= FOUR SPLIT CARDS ================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C6FF3D]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
              Select Training Split
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#A1A1AA]">
            Active Split: <strong className="text-[#C6FF3D]">{workoutPlan.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {FOUR_RECOMMENDER_SPLITS.map((split: SplitCardConfig) => {
            const isSelected = selectedSplit === split.key;
            const isSuggested = suggestedSplitKey === split.key;

            return (
              <button
                key={split.key}
                type="button"
                onClick={() => setSelectedSplit(split.key)}
                className={`relative p-5 rounded-3xl text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-[#16161D] border-[#C6FF3D] shadow-lg shadow-[#C6FF3D]/10 ring-1 ring-[#C6FF3D]/40'
                    : 'bg-[#16161D] border-[#24242E] hover:border-[#383846] hover:bg-[#1A1A22]'
                }`}
                aria-pressed={isSelected}
              >
                {/* "Suggested for today" badge on the split trained least recently */}
                {isSuggested && (
                  <div className="absolute -top-2.5 right-4 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C6FF3D] text-[#0B0B0F] text-[10px] font-heading font-black uppercase tracking-wider shadow-md shadow-[#C6FF3D]/30">
                    <Sparkles className="w-3 h-3 stroke-[2.5]" />
                    <span>Suggested for today</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-heading text-xl font-black uppercase tracking-wide transition-colors ${
                        isSelected ? 'text-[#C6FF3D]' : 'text-[#F4F4F6] group-hover:text-[#C6FF3D]'
                      }`}
                    >
                      {split.name}
                    </h3>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#C6FF3D] text-[#0B0B0F]' : 'border border-[#24242E] text-transparent'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-[#F4F4F6] font-medium leading-snug">
                    {split.tagline}
                  </p>

                  <p className="text-[11px] text-[#A1A1AA] line-clamp-2 leading-relaxed">
                    {split.muscles}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#24242E]/70 flex items-center justify-between text-[10px] font-mono text-[#A1A1AA]">
                  <span>MET Rating: {split.metValue.toFixed(1)}</span>
                  <span className="text-[#C6FF3D]">5 Exercises</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= EXPERIENCE LEVEL SELECTOR & ROUTINE META ================= */}
      <section className="p-6 rounded-3xl bg-[#16161D] border border-[#24242E] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
            Experience Tier
          </div>
          <div className="text-sm font-semibold text-[#F4F4F6]">
            Prescribe volume, reps, and rest intervals tailored to conditioning
          </div>
          <p className="text-[11px] text-[#A1A1AA]">
            Defaulted to your saved athlete profile ({currentProfile?.experienceLevel || 'Intermediate'}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['Beginner', 'Intermediate', 'Advanced'] as ExperienceLevel[]).map((level) => {
            const isSelected = experienceLevel.toLowerCase() === level.toLowerCase();
            return (
              <button
                key={level}
                type="button"
                onClick={() => setExperienceLevel(level)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-heading uppercase tracking-wider transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#C6FF3D] text-[#0B0B0F] border-[#C6FF3D] shadow-md shadow-[#C6FF3D]/15'
                    : 'bg-[#0B0B0F] text-[#A1A1AA] border-[#24242E] hover:text-[#F4F4F6] hover:bg-[#24242E]'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= 5 EXERCISE CARDS (POLYMORPHICALLY GENERATED) ================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#C6FF3D]" />
            <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-[#F4F4F6]">
              {workoutPlan.name} Routine · 5 Prescribed Exercises
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[#A1A1AA]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#C6FF3D]" />
              ~45 Min Session
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#C6FF3D]" />
              ~{estimatedCalories} kcal
            </span>
          </div>
        </div>

        {/* The 5 Exercise Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise: Exercise, index: number) => {
            return (
              <div
                key={`${exercise.id}-${index}`}
                className="p-5 rounded-3xl bg-[#16161D] border border-[#24242E] hover:border-[#383846] transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Order number & Muscle tag */}
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-xl bg-[#24242E] group-hover:bg-[#C6FF3D]/15 group-hover:text-[#C6FF3D] flex items-center justify-center font-mono font-bold text-xs text-[#F4F4F6] transition-colors">
                      0{index + 1}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-[#0B0B0F] px-2.5 py-1 rounded-xl border border-[#24242E] text-[#C6FF3D] font-bold">
                      {exercise.targetMuscle}
                    </span>
                  </div>

                  {/* Exercise Title */}
                  <div>
                    <h3 className="font-heading text-lg font-bold text-[#F4F4F6] group-hover:text-[#C6FF3D] transition-colors">
                      {exercise.name}
                    </h3>
                    <p className="text-[11px] font-mono text-[#A1A1AA] mt-0.5">
                      Equipment: {exercise.equipment}
                    </p>
                  </div>

                  {/* Form Tip / Coaching cue */}
                  {exercise.formTip && (
                    <div className="p-3 rounded-2xl bg-[#0B0B0F] border border-[#24242E]/70 text-[11px] text-[#A1A1AA] italic leading-relaxed">
                      "{exercise.formTip}"
                    </div>
                  )}
                </div>

                {/* Bottom Stats: Sets x Reps & Rest Time */}
                <div className="pt-3 border-t border-[#24242E] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-heading font-black text-xs text-[#F4F4F6]">
                    <span className="text-[#C6FF3D]">{exercise.sets}</span> sets ×{' '}
                    <span className="text-[#C6FF3D]">{exercise.reps}</span> reps
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-[#A1A1AA] bg-[#24242E]/50 px-2 py-0.5 rounded-lg">
                    <Clock className="w-3 h-3 text-[#C6FF3D]" />
                    <span>{exercise.restSeconds}s rest</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= BOTTOM LAUNCH CTA ================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#16161D] via-[#16161D] to-[#24242E] border border-[#24242E] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-heading text-xl font-black uppercase text-[#F4F4F6]">
            Ready to Forge Your Routine?
          </h3>
          <p className="text-xs text-[#A1A1AA]">
            Launch the live session tracker to log your weights, complete sets, and time rest countdowns.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartWorkout}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs sm:text-sm transition-all duration-200 shadow-xl shadow-[#C6FF3D]/25 hover:scale-[1.03] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Play className="w-4 h-4 fill-[#0B0B0F]" />
          <span>Start This Workout Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
