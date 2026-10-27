import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Dumbbell,
  Flame,
  HeartHandshake,
  HelpCircle,
  Info,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  Wrench,
  Zap,
} from 'lucide-react';
import { EquipmentSelector } from '../components/EquipmentSelector';
import { ExerciseImage } from '../components/ExerciseImage';
import { ExerciseGuideView } from '../components/ExerciseGuideView';
import { getExerciseGuide } from '../models/exerciseGuides';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BMICalculator } from '../models/BMICalculator';
import { Exercise } from '../models/Exercise';
import { ExerciseLibrary } from '../models/ExerciseLibrary';
import { RecordManager } from '../models/RecordManager';
import { EquipmentType, ExperienceLevel } from '../models/types';
import { WorkoutPlan } from '../models/WorkoutPlan';
import { WorkoutPlanFactory } from '../models/WorkoutPlanFactory';
import {
  FOUR_RECOMMENDER_SPLITS,
  getLeastRecentlyTrainedSplit,
  RecommenderSplitKey,
  SplitCardConfig,
} from '../utils/recommender';

export function RecommenderPage() {
  const { currentUser, currentProfile, updateProfile } = useAuth();
  const { success: showToastSuccess, info: showToastInfo, error: showToastError } = useToast();
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

  // State: Available Equipment initialized from profile or default
  const defaultEquipment = useMemo<EquipmentType[]>(() => {
    if (currentProfile?.availableEquipment && currentProfile.availableEquipment.length > 0) {
      return [...currentProfile.availableEquipment];
    }
    return ['Bodyweight', 'Dumbbell', 'Barbell', 'Machine', 'Cable'];
  }, [currentProfile?.availableEquipment]);

  const [availableEquipment, setAvailableEquipment] = useState<EquipmentType[]>(defaultEquipment);

  // User-swapped exercises override (null when using default generated routine)
  const [customExercises, setCustomExercises] = useState<Exercise[] | null>(null);

  // Accordion state: only one exercise guide card can be open at a time
  const [openGuideIndex, setOpenGuideIndex] = useState<number | null>(null);

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

  // Handle Equipment changes: update state and persist to athlete profile
  const handleEquipmentChange = (newEquipment: EquipmentType[]) => {
    setAvailableEquipment(newEquipment);
    setCustomExercises(null); // Reset manual swaps when equipment changes
    updateProfile({ availableEquipment: newEquipment });
  };

  // Handle Split change: reset manual swaps
  const handleSplitChange = (splitKey: RecommenderSplitKey) => {
    setSelectedSplit(splitKey);
    setCustomExercises(null);
  };

  // Handle Level change: reset manual swaps
  const handleLevelChange = (newLevel: ExperienceLevel) => {
    setExperienceLevel(newLevel);
    setCustomExercises(null);
  };

  // Polymorphic exercise prescription passing availableEquipment to base class
  const baseExercises: Exercise[] = useMemo(() => {
    return workoutPlan.getExercises(experienceLevel, availableEquipment);
  }, [workoutPlan, experienceLevel, availableEquipment]);

  // Active exercises: custom swapped list or polymorphically generated routine
  const exercises: Exercise[] = useMemo(() => {
    if (customExercises && customExercises.length === 5) {
      return customExercises;
    }
    return baseExercises;
  }, [customExercises, baseExercises]);

  // Calories estimated for a standard 45-minute session
  const estimatedCalories = useMemo(() => {
    return workoutPlan.calculateCalories(weightKg, 45);
  }, [workoutPlan, weightKg]);

  // Swap this exercise with another valid exercise for the same muscle
  const handleSwapExercise = (index: number) => {
    const currentEx = exercises[index];
    if (!currentEx) return;

    const allExercises = ExerciseLibrary.getInstance().getAllExercises();

    // Find candidates matching the same target muscle, valid equipment, not currently in plan
    const candidates = allExercises.filter((cand) => {
      const sameMuscle = cand.targetMuscle.toLowerCase() === currentEx.targetMuscle.toLowerCase();
      const validEquipment = availableEquipment.includes(cand.equipment as EquipmentType);
      const notInPlan = !exercises.some((e) => e.id === cand.id || e.name === cand.name);
      return sameMuscle && validEquipment && notInPlan;
    });

    if (candidates.length === 0) {
      showToastInfo(
        `No other ${currentEx.targetMuscle} exercises match your available equipment.`
      );
      return;
    }

    // Pick first candidate (or cycle next)
    const replacement = candidates[0];
    const prescribed = replacement.prescribe(
      currentEx.sets,
      currentEx.reps,
      currentEx.restSeconds
    );

    const updated = [...exercises];
    updated[index] = prescribed;
    setCustomExercises(updated);

    showToastSuccess(`Swapped "${currentEx.name}" for "${prescribed.name}"`);
  };

  // Launch live session with chosen plan and exact exercises
  const handleStartWorkout = () => {
    if (exercises.length === 0) {
      showToastError('Please select a workout split with valid exercises first.');
      return;
    }

    try {
      localStorage.setItem('fitforge_active_split', selectedSplit);
      localStorage.setItem('fitforge_active_level', String(experienceLevel));
      localStorage.setItem(
        'fitforge_active_exercises',
        JSON.stringify(exercises.map((e) => e.toJSON()))
      );
    } catch {
      // Storage safe
    }

    navigate('/workout', {
      state: {
        splitType: selectedSplit,
        experienceLevel,
        planName: workoutPlan.name,
        customExercises: exercises.map((e) => e.toJSON()),
      },
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ================= PAGE HEADER & PRIMARY CTA ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#24242E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D]">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
              Workout Recommender
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-0.5">
              Polymorphic 5-exercise resistance splits dynamically tailored to equipment and tier.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/schedule')}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 dark:bg-[#16161D] dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] hover:border-[#C6FF3D]/40 text-slate-800 dark:text-[#F4F4F6] font-heading font-black uppercase tracking-wider text-xs sm:text-sm transition-all duration-200 cursor-pointer shrink-0 shadow-sm"
          >
            <Calendar className="w-4 h-4 text-[#C6FF3D]" />
            <span>Customize Weekly Schedule</span>
          </button>

          <button
            type="button"
            onClick={handleStartWorkout}
            disabled={exercises.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d5ff6a] dark:text-[#0B0B0F] disabled:opacity-40 disabled:cursor-not-allowed font-heading font-black uppercase tracking-wider text-xs sm:text-sm transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start This Workout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
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

      {/* ================= SECTION 1: EQUIPMENT AVAILABILITY & PRESETS ================= */}
      <section className="p-6 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] space-y-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#24242E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-[#24242E] flex items-center justify-center text-slate-800 dark:text-[#C6FF3D]">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-[#F4F4F6] uppercase tracking-wide">
                Equipment Availability
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-[#A1A1AA]">
                Filter routines by what you have. Bodyweight is always included.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
            <span>Active:</span>
            <span className="text-slate-900 dark:text-[#C6FF3D] font-bold">
              {availableEquipment.length} / 5 types
            </span>
          </div>
        </div>

        <EquipmentSelector
          selectedEquipment={availableEquipment}
          onChange={handleEquipmentChange}
        />
      </section>

      {/* ================= SECTION 2: FOUR SPLIT CARDS ================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C6FF3D]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">
              Select Training Split
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-600 dark:text-[#A1A1AA]">
            Active Split: <strong className="text-slate-900 dark:text-[#C6FF3D]">{workoutPlan.name}</strong>
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
                onClick={() => handleSplitChange(split.key)}
                className={`relative p-5 rounded-3xl text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-sm ${
                  isSelected
                    ? 'bg-white dark:bg-[#16161D] border-[#C6FF3D] shadow-md shadow-[#C6FF3D]/10 ring-2 ring-[#C6FF3D]/50'
                    : 'bg-[#f8fafc] dark:bg-[#16161D] border-slate-200 dark:border-[#24242E] hover:border-slate-300 dark:hover:border-[#383846] hover:bg-white dark:hover:bg-[#1A1A22]'
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
                        isSelected ? 'text-slate-900 dark:text-[#C6FF3D]' : 'text-slate-900 dark:text-[#F4F4F6] group-hover:text-slate-950 dark:group-hover:text-[#C6FF3D]'
                      }`}
                    >
                      {split.name}
                    </h3>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#C6FF3D] text-[#0B0B0F]' : 'border border-slate-300 dark:border-[#24242E] text-transparent'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-[#F4F4F6] font-medium leading-snug">
                    {split.tagline}
                  </p>

                  <p className="text-[11px] text-slate-600 dark:text-[#A1A1AA] line-clamp-2 leading-relaxed">
                    {split.muscles}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-[#24242E]/70 flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-[#A1A1AA]">
                  <span>MET: {split.metValue.toFixed(1)}</span>
                  <span className="text-slate-900 dark:text-[#C6FF3D] font-bold">5 Exercises</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= SECTION 3: EXPERIENCE LEVEL SELECTOR ================= */}
      <section className="p-6 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm dark:shadow-none">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">
            Experience Tier
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-[#F4F4F6]">
            Prescribe volume, reps, and rest intervals tailored to conditioning
          </div>
          <p className="text-[11px] text-slate-600 dark:text-[#A1A1AA]">
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
                onClick={() => handleLevelChange(level)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-heading uppercase tracking-wider transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#C6FF3D] text-[#0B0B0F] border-[#C6FF3D] shadow-sm'
                    : 'bg-white dark:bg-[#0B0B0F] text-slate-600 dark:text-[#A1A1AA] border-slate-200 dark:border-[#24242E] hover:text-slate-900 dark:hover:text-[#F4F4F6] hover:bg-slate-100 dark:hover:bg-[#24242E]'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= BODYWEIGHT SWAP NOTE BANNER ================= */}
      {workoutPlan.hasEquipmentSwaps && exercises.length > 0 && (
        <section
          className="p-4 sm:p-5 rounded-3xl bg-[#C6FF3D]/10 border border-green-300 dark:border-[#C6FF3D]/30 text-slate-700 dark:text-[#F4F4F6] flex items-center gap-3.5 shadow-md shadow-[#C6FF3D]/5 animate-in fade-in"
          role="note"
        >
          <div className="w-9 h-9 rounded-2xl bg-green-700/15 dark:bg-[#C6FF3D]/20 border border-green-700/40 dark:border-[#C6FF3D]/40 flex items-center justify-center text-green-700 dark:text-[#C6FF3D] shrink-0">
            <Info className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="text-xs sm:text-sm text-slate-700 dark:text-[#F4F4F6] leading-relaxed">
            <span className="font-bold text-green-800 dark:text-[#C6FF3D]">Equipment Adaptation: </span>
            Some exercises were swapped for bodyweight alternatives because of your equipment.
          </div>
        </section>
      )}

      {/* ================= 5 EXERCISE CARDS OR FRIENDLY EMPTY STATE ================= */}
      {exercises.length === 0 ? (
        /* Requirement 8: Friendly message and suggest another split when no exercises match */
        <section className="p-8 sm:p-12 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-amber-300 dark:border-amber-500/40 text-center space-y-6 shadow-sm dark:shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="font-heading text-2xl font-black uppercase text-slate-900 dark:text-[#F4F4F6]">
              No exercises match your equipment for {workoutPlan.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-[#A1A1AA] leading-relaxed">
              Pull movements generally require resistance equipment like dumbbells, a barbell, cables, or machines. Because your profile is set to Bodyweight only, no exercises in the {workoutPlan.name} split match.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => handleSplitChange('full_body')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d5ff6a] dark:text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs transition-all shadow-sm dark:shadow-md dark:shadow-[#C6FF3D]/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Switch to Full Body</span>
            </button>

            <button
              type="button"
              onClick={() => handleSplitChange('legs_core')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-[#24242E] dark:hover:bg-[#2E2E3C] dark:text-[#F4F4F6] font-heading font-black uppercase tracking-wider text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Switch to Legs & Core</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-[#24242E] text-xs text-slate-600 dark:text-[#A1A1AA]">
            Or quick-enable dumbbells in the equipment checklist above to unlock pull exercises.
          </div>
        </section>
      ) : (
        /* The 5 Exercise Cards */
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600 dark:text-[#C6FF3D]" />
                <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
                  {workoutPlan.name} Routine · 5 Prescribed Exercises
                </h2>
              </div>
              <Link
                to="/basics"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-[#C6FF3D]/10 hover:bg-emerald-200 dark:hover:bg-[#C6FF3D]/20 text-xs font-mono text-emerald-800 dark:text-[#C6FF3D] border border-emerald-300 dark:border-[#C6FF3D]/30 transition-colors"
                title="Read Beginner Basics Guide"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Beginner Basics Guide</span>
              </Link>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C6FF3D]" />
                ~45 Min Session
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-[#C6FF3D]" />
                ~{estimatedCalories} kcal
              </span>
            </div>
          </div>

          {/* Cards Grid - items-start ensures each card sizes to its own content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {exercises.map((exercise: Exercise, index: number) => {
              const isBeginner = experienceLevel.toLowerCase() === 'beginner';
              const guide = getExerciseGuide(exercise.name, exercise.equipment, exercise.targetMuscle);
              const isGuideOpen = openGuideIndex === index;

              return (
                <div
                  key={`${exercise.id}-${index}`}
                  className="p-5 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] hover:border-slate-300 dark:hover:border-[#383846] transition-all flex flex-col justify-between space-y-4 group overflow-hidden self-start shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Top of prescribed exercise card: image with order pill and muscle badge overlay */}
                    <div className="relative rounded-2xl overflow-hidden mb-1">
                      <ExerciseImage
                        exerciseName={exercise.name}
                        targetMuscle={exercise.targetMuscle}
                        imageUrl={exercise.imageUrl}
                        className="w-full aspect-[16/9] rounded-2xl"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-black/75 backdrop-blur-sm border border-black/40 flex items-center justify-center font-mono font-bold text-xs text-[#F4F4F6]">
                          0{index + 1}
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-black/40 text-[#C6FF3D] font-bold">
                          {exercise.targetMuscle}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSwapExercise(index)}
                        title={`Swap ${exercise.name} for another ${exercise.targetMuscle} exercise`}
                        className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-sm hover:bg-black/90 border border-black/40 text-slate-200 hover:text-[#C6FF3D] text-[11px] font-mono transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
                        <span>Swap</span>
                      </button>
                    </div>

                    {/* Exercise Title */}
                    <div>
                      <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-[#F4F4F6] group-hover:text-emerald-600 dark:group-hover:text-[#C6FF3D] transition-colors">
                        {exercise.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-[#A1A1AA] mt-0.5">
                        Equipment: <span className="text-slate-700 dark:text-zinc-300 font-medium">{exercise.equipment}</span>
                      </p>
                    </div>

                    {/* Beginner Tip Line (shown without opening the guide when Beginner level is selected) */}
                    {isBeginner ? (
                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-[#0B0B0F] border border-[#C6FF3D]/40 flex items-start gap-2 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#C6FF3D] shrink-0 mt-0.5" />
                        <div className="space-y-0.5 flex-1">
                          <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-[#C6FF3D] font-bold block">
                            Beginner Tip
                          </span>
                          <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                            {guide.safetyTips[0] || guide.setup[0] || exercise.formTip}
                          </p>
                        </div>
                      </div>
                    ) : (
                      exercise.formTip && (
                        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E]/70 text-[11px] text-slate-600 dark:text-[#A1A1AA] italic leading-relaxed">
                          "{exercise.formTip}"
                        </div>
                      )
                    )}

                    {/* How to do it Accordion Button */}
                    <button
                      type="button"
                      onClick={() => setOpenGuideIndex(isGuideOpen ? null : index)}
                      className={`w-full py-2 px-3 rounded-2xl border text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        isGuideOpen
                          ? 'bg-[#C6FF3D]/15 border-[#C6FF3D] text-slate-900 dark:text-[#C6FF3D]'
                          : 'bg-white dark:bg-[#0B0B0F] border-slate-200 dark:border-[#24242E] text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] hover:border-slate-300 dark:hover:border-[#383848]'
                      }`}
                      aria-expanded={isGuideOpen}
                    >
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-[#C6FF3D]" />
                        <span>How to do it</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isGuideOpen ? 'rotate-180 text-slate-900 dark:text-[#C6FF3D]' : ''
                        }`}
                      />
                    </button>

                    {/* Expanded Guide Accordion (Only one open at a time) */}
                    {isGuideOpen && (
                      <div className="pt-1 animate-in fade-in duration-200">
                        <ExerciseGuideView
                          guide={guide}
                          exerciseName={exercise.name}
                          targetMuscle={exercise.targetMuscle}
                          onClose={() => setOpenGuideIndex(null)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats: Sets x Reps & Rest Time */}
                  <div className="pt-3 border-t border-slate-200 dark:border-[#24242E] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-heading font-black text-xs text-slate-900 dark:text-[#F4F4F6]">
                      <span className="text-emerald-600 dark:text-[#C6FF3D] font-bold">{exercise.sets}</span> sets ×{' '}
                      <span className="text-emerald-600 dark:text-[#C6FF3D] font-bold">{exercise.reps}</span> reps
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-[#A1A1AA] bg-slate-100 dark:bg-[#24242E]/50 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-transparent">
                      <Clock className="w-3 h-3 text-[#C6FF3D]" />
                      <span>{exercise.restSeconds}s rest</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= BOTTOM LAUNCH CTA ================= */}
      {exercises.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#f8fafc] dark:bg-gradient-to-r dark:from-[#16161D] dark:via-[#16161D] dark:to-[#24242E] border border-slate-200 dark:border-[#24242E] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-heading text-xl font-black uppercase text-slate-900 dark:text-[#F4F4F6]">
              Ready to Forge Your Routine?
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA]">
              Launch the live session tracker to log your weights, complete sets, and time rest countdowns.
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartWorkout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d5ff6a] dark:text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs sm:text-sm transition-all duration-200 shadow-md hover:scale-[1.03] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start This Workout Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
