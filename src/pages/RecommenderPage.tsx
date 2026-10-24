import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Dumbbell,
  Flame,
  HeartHandshake,
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
              Polymorphic 5-exercise resistance splits dynamically tailored to equipment and tier.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartWorkout}
          disabled={exercises.length === 0}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#C6FF3D] hover:bg-[#d5ff6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-[#C6FF3D]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
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

      {/* ================= SECTION 1: EQUIPMENT AVAILABILITY & PRESETS ================= */}
      <section className="p-6 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#24242E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                Equipment Availability
              </h2>
              <p className="text-[11px] text-[#A1A1AA]">
                Filter routines by what you have. Bodyweight is always included.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-[#A1A1AA]">
            <span>Active:</span>
            <span className="text-[#C6FF3D] font-bold">
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
                onClick={() => handleSplitChange(split.key)}
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
                  <span>MET: {split.metValue.toFixed(1)}</span>
                  <span className="text-[#C6FF3D]">5 Exercises</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= SECTION 3: EXPERIENCE LEVEL SELECTOR ================= */}
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
                onClick={() => handleLevelChange(level)}
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

      {/* ================= BODYWEIGHT SWAP NOTE BANNER ================= */}
      {workoutPlan.hasEquipmentSwaps && exercises.length > 0 && (
        <section
          className="p-4 sm:p-5 rounded-3xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 text-[#F4F4F6] flex items-center gap-3.5 shadow-md shadow-[#C6FF3D]/5 animate-in fade-in"
          role="note"
        >
          <div className="w-9 h-9 rounded-2xl bg-[#C6FF3D]/20 border border-[#C6FF3D]/40 flex items-center justify-center text-[#C6FF3D] shrink-0">
            <Info className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="text-xs sm:text-sm text-[#F4F4F6] leading-relaxed">
            <span className="font-bold text-[#C6FF3D]">Equipment Adaptation: </span>
            Some exercises were swapped for bodyweight alternatives because of your equipment.
          </div>
        </section>
      )}

      {/* ================= 5 EXERCISE CARDS OR FRIENDLY EMPTY STATE ================= */}
      {exercises.length === 0 ? (
        /* Requirement 8: Friendly message and suggest another split when no exercises match */
        <section className="p-8 sm:p-12 rounded-3xl bg-[#16161D] border border-amber-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="font-heading text-2xl font-black uppercase text-[#F4F4F6]">
              No exercises match your equipment for {workoutPlan.name}
            </h3>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Pull movements generally require resistance equipment like dumbbells, a barbell, cables, or machines. Because your profile is set to Bodyweight only, no exercises in the {workoutPlan.name} split match.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => handleSplitChange('full_body')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs transition-all shadow-md shadow-[#C6FF3D]/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Switch to Full Body</span>
            </button>

            <button
              type="button"
              onClick={() => handleSplitChange('legs_core')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#24242E] hover:bg-[#2E2E3C] text-[#F4F4F6] font-heading font-black uppercase tracking-wider text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Switch to Legs & Core</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#24242E] text-xs text-[#A1A1AA]">
            Or quick-enable dumbbells in the equipment checklist above to unlock pull exercises.
          </div>
        </section>
      ) : (
        /* The 5 Exercise Cards */
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

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map((exercise: Exercise, index: number) => {
              return (
                <div
                  key={`${exercise.id}-${index}`}
                  className="p-5 rounded-3xl bg-[#16161D] border border-[#24242E] hover:border-[#383846] transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top Bar: Order number, Muscle tag & Swap Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-[#24242E] group-hover:bg-[#C6FF3D]/15 group-hover:text-[#C6FF3D] flex items-center justify-center font-mono font-bold text-xs text-[#F4F4F6] transition-colors">
                          0{index + 1}
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-[#0B0B0F] px-2.5 py-1 rounded-xl border border-[#24242E] text-[#C6FF3D] font-bold">
                          {exercise.targetMuscle}
                        </span>
                      </div>

                      {/* Requirement 6: Swap this exercise button */}
                      <button
                        type="button"
                        onClick={() => handleSwapExercise(index)}
                        title={`Swap ${exercise.name} for another ${exercise.targetMuscle} exercise`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D]/40 text-[#A1A1AA] hover:text-[#C6FF3D] text-[11px] font-mono transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
                        <span>Swap</span>
                      </button>
                    </div>

                    {/* Exercise Title */}
                    <div>
                      <h3 className="font-heading text-lg font-bold text-[#F4F4F6] group-hover:text-[#C6FF3D] transition-colors">
                        {exercise.name}
                      </h3>
                      <p className="text-[11px] font-mono text-[#A1A1AA] mt-0.5">
                        Equipment: <span className="text-zinc-300">{exercise.equipment}</span>
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
      )}

      {/* ================= BOTTOM LAUNCH CTA ================= */}
      {exercises.length > 0 && (
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
      )}
    </div>
  );
}
