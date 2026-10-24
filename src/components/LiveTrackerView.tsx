import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Dumbbell,
  FastForward,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Exercise } from '../models/Exercise';
import { MemberProfile } from '../models/MemberProfile';
import { RecordManager } from '../models/RecordManager';
import { ExperienceLevel, ExtendedSplitType, SplitType } from '../models/types';
import { User } from '../models/User';
import { WorkoutPlan } from '../models/WorkoutPlan';
import { WorkoutPlanFactory } from '../models/WorkoutPlanFactory';
import { sounds } from '../utils/audio';
import { ConfirmModal } from './ConfirmModal';

const SPLIT_DESCRIPTIONS: Record<string, string> = {
  push: 'Targeting chest, anterior deltoids, and triceps with pressing compounds.',
  pull: 'Targeting latissimus dorsi, rhomboids, rear deltoids, and biceps.',
  legs_core: 'Targeting quadriceps, hamstrings, gluteals, and abdominal core.',
  full_body: 'Total-body multi-joint kinetic compounds for systemic muscle stimulation.',
  upper_body: 'Comprehensive upper-torso hypertrophy and antagonistic muscle pairs.',
  home_bodyweight: 'Calisthenics compound patterns with zero gym equipment required.',
  cardio_hiit: 'Metabolic conditioning and cardiovascular intervals for peak endurance.',
};

interface LiveTrackerViewProps {
  currentUser: User | null;
  currentProfile: MemberProfile | null;
  recordManager: RecordManager;
  initialSplit?: ExtendedSplitType | SplitType | string | null;
  onWorkoutSaved: () => void;
  onActiveStateChange?: (isActive: boolean) => void;
}

export const LiveTrackerView: React.FC<LiveTrackerViewProps> = ({
  currentUser,
  currentProfile,
  recordManager,
  initialSplit = null,
  onWorkoutSaved,
  onActiveStateChange,
}) => {
  const navigate = useNavigate();
  const { userPreferences } = useAuth();
  const { success: showToastSuccess, info: showToastInfo } = useToast();

  // Active training split (null if no plan was picked yet)
  const [selectedSplit, setSelectedSplit] = useState<ExtendedSplitType | string | null>(initialSplit);

  // Experience level for exercise prescription
  const experienceLevel: ExperienceLevel = currentProfile?.experienceLevel || 'intermediate';
  const userWeightKg: number = currentProfile?.weightKg || 70;

  // Active WorkoutPlan subclass instance
  const workoutPlan: WorkoutPlan | null = useMemo(() => {
    if (!selectedSplit) return null;
    return WorkoutPlanFactory.create(selectedSplit);
  }, [selectedSplit]);

  // Prescribed 5 exercises derived polymorphically from the selected split
  const exercises: Exercise[] = useMemo(() => {
    if (!workoutPlan) return [];
    return workoutPlan.getExercises(experienceLevel);
  }, [workoutPlan, experienceLevel]);

  // Clickable checklist state for the 5 exercises
  const [completedExercises, setCompletedExercises] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  // ================= STOPWATCH STATE & TIMER SAFETY =================
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ================= REST COUNTDOWN TIMER STATE & SAFETY =================
  const [isRestActive, setIsRestActive] = useState<boolean>(false);
  const [restDuration, setRestDuration] = useState<number>(60);
  const [restRemaining, setRestRemaining] = useState<number>(0);
  const [restExerciseName, setRestExerciseName] = useState<string>('');
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ================= FINISH MODAL & NOTES =================
  const [isFinishModalOpen, setIsFinishModalOpen] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState<boolean>(false);

  // Reset checklist when split changes
  useEffect(() => {
    setCompletedExercises([false, false, false, false, false]);
  }, [selectedSplit]);

  // Active session status check: session is considered active if stopwatch is running,
  // time has elapsed, or at least one exercise is checked
  const completedCount = completedExercises.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);
  const isSessionActive = isStopwatchRunning || stopwatchSeconds > 0 || completedCount > 0;

  useEffect(() => {
    if (onActiveStateChange) {
      onActiveStateChange(isSessionActive);
    }
  }, [isSessionActive, onActiveStateChange]);

  // Warn before browser unload/refresh if session is active
  useEffect(() => {
    if (!isSessionActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSessionActive]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
        stopwatchIntervalRef.current = null;
      }
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    };
  }, []);

  // Stopwatch interval manager (guaranteed to never run twice or leak)
  useEffect(() => {
    if (isStopwatchRunning) {
      // Clear any prior interval before creating a new one
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
        stopwatchIntervalRef.current = null;
      }

      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
        stopwatchIntervalRef.current = null;
      }
    }

    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
        stopwatchIntervalRef.current = null;
      }
    };
  }, [isStopwatchRunning]);

  // Rest countdown interval manager
  useEffect(() => {
    if (isRestActive && restRemaining > 0) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }

      restIntervalRef.current = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            if (restIntervalRef.current) {
              clearInterval(restIntervalRef.current);
              restIntervalRef.current = null;
            }
            setIsRestActive(false);

            // Play end sound if sound setting is enabled
            if (userPreferences.soundEnabled && !sounds.muted) {
              sounds.playCountdownBeep(true);
            }
            return 0;
          }

          // Countdown beeps on last 3 seconds
          if (prev <= 4 && prev > 1) {
            if (userPreferences.soundEnabled && !sounds.muted) {
              sounds.playCountdownBeep(false);
            }
          }

          return prev - 1;
        });
      }, 1000);
    } else if (!isRestActive) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    };
  }, [isRestActive, restRemaining, userPreferences.soundEnabled]);

  // Stopwatch Controls
  const handleStartStopwatch = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    setIsStopwatchRunning(true);
  };

  const handlePauseStopwatch = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    setIsStopwatchRunning(false);
  };

  const handleResetStopwatch = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
      stopwatchIntervalRef.current = null;
    }
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);
  };

  // Rest Timer Controls
  const handleStartRest = (seconds: number, exerciseName: string) => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    const safeDuration = Math.max(5, Math.round(seconds || 60));
    setRestDuration(safeDuration);
    setRestRemaining(safeDuration);
    setRestExerciseName(exerciseName);
    setIsRestActive(true);
  };

  const handleSkipRest = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    setIsRestActive(false);
    setRestRemaining(0);
  };

  const handleAddRestTime = (seconds: number) => {
    setRestRemaining((prev) => prev + seconds);
    setRestDuration((prev) => prev + seconds);
  };

  // Exercise Checklist Toggle
  const handleToggleExercise = (index: number) => {
    const wasCompleted = completedExercises[index];
    const targetExercise = exercises[index];

    // Sound effect
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }

    // Auto-start stopwatch on first check if not running
    if (!isStopwatchRunning && stopwatchSeconds === 0) {
      setIsStopwatchRunning(true);
    }

    const updated = [...completedExercises];
    updated[index] = !wasCompleted;
    setCompletedExercises(updated);

    // If transitioning from incomplete to complete, automatically trigger rest countdown
    if (!wasCompleted && targetExercise) {
      const restSec = targetExercise.restSeconds || targetExercise.suggestedRestSeconds || 60;
      handleStartRest(restSec, targetExercise.name);
    }
  };

  // Real-time calories burned calculation: calories = MET x weightKg x (stopwatchSeconds / 3600)
  const { currentCalories, displayCalories } = useMemo(() => {
    if (!workoutPlan || stopwatchSeconds <= 0 || userWeightKg <= 0) {
      return { currentCalories: 0, displayCalories: '0' };
    }
    const met = workoutPlan.getMETValue();
    const exact = met * userWeightKg * (stopwatchSeconds / 3600);

    if (exact < 9.95) {
      const formatted = exact.toFixed(1);
      return {
        currentCalories: parseFloat(formatted),
        displayCalories: formatted,
      };
    } else {
      const rounded = Math.round(exact);
      return {
        currentCalories: rounded,
        displayCalories: rounded.toString(),
      };
    }
  }, [workoutPlan, stopwatchSeconds, userWeightKg]);

  const elapsedMinutes = Math.max(1, Math.round(stopwatchSeconds / 60));

  // Format stopwatch seconds MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Open Finish Modal
  const handleOpenFinishModal = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    setIsFinishModalOpen(true);
  };

  // Save Workout Session to Database
  const handleSaveWorkout = () => {
    if (!currentUser || !workoutPlan) return;

    // Calculate final metrics
    const finalMinutes = Math.max(1, Math.round(stopwatchSeconds / 60));
    const finalCalories = currentCalories;
    const planName = workoutPlan.name;

    try {
      recordManager.addRecord({
        userId: currentUser.id,
        date: new Date().toISOString(),
        title: `${planName} Session`,
        splitName: planName,
        splitType: workoutPlan.splitType,
        durationMinutes: finalMinutes,
        caloriesBurned: finalCalories,
        exercisesCompleted: completedCount,
        totalExercises: 5,
        notes: sessionNotes.trim() || `Completed ${completedCount} of 5 exercises in ${finalMinutes}m.`,
      });

      // Clear active stored split
      try {
        localStorage.removeItem('fitforge_active_split');
        localStorage.removeItem('fitforge_active_level');
      } catch {
        // Safe storage
      }

      // Fanfare & Confetti
      if (userPreferences.soundEnabled && !sounds.muted) {
        sounds.playFanfare();
      }
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C6FF3D', '#3B82F6', '#10B981', '#F59E0B'],
        });
      } catch {
        // Confetti fallback
      }

      // Toast notification
      showToastSuccess(
        `Workout saved! Logged ${finalMinutes}m and ${displayCalories} kcal burned.`
      );

      setIsFinishModalOpen(false);
      onWorkoutSaved();
    } catch (err) {
      console.error('Failed to save workout session:', err);
      showToastInfo('Error saving workout. Please try again.');
    }
  };

  // Abandon Session Flow
  const handleConfirmAbandon = () => {
    handleResetStopwatch();
    handleSkipRest();
    setCompletedExercises([false, false, false, false, false]);
    try {
      localStorage.removeItem('fitforge_active_split');
    } catch {
      // safe
    }
    showToastInfo('Workout session cancelled.');
    navigate('/recommender');
  };

  // ================= SCENARIO A: NO PLAN CHOSEN PROMPT =================
  if (!selectedSplit || !workoutPlan) {
    const allSplits: { id: ExtendedSplitType; name: string; desc: string }[] = [
      { id: 'push', name: 'Push Split', desc: 'Chest, Shoulders & Triceps' },
      { id: 'pull', name: 'Pull Split', desc: 'Back, Rear Delts & Biceps' },
      { id: 'legs_core', name: 'Legs & Core', desc: 'Quads, Hamstrings & Core' },
      { id: 'full_body', name: 'Full Body', desc: 'Total Body Compound Synergy' },
      { id: 'upper_body', name: 'Upper Body', desc: 'Comprehensive Torso Hypertrophy' },
      { id: 'home_bodyweight', name: 'Home Bodyweight', desc: 'Zero-Equipment Calisthenics' },
      { id: 'cardio_hiit', name: 'Cardio HIIT', desc: 'High-Intensity Conditioning' },
    ];

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#24242E]">
          <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D]">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#F4F4F6]">
              Live Workout Session
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Real-time workout execution, interactive stopwatch, and rest intervals.
            </p>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#16161D] border border-[#24242E] text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C6FF3D]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-3xl bg-[#0B0B0F] border border-[#24242E] text-[#C6FF3D] flex items-center justify-center mx-auto shadow-inner">
            <Compass className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-[#F4F4F6]">
              No Workout Plan Selected
            </h2>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              You haven't selected a training routine yet. Visit the Workout Recommender to get an automated 5-exercise prescription tailored to your BMI and experience tier.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/recommender')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0B0B0F] font-bold text-sm transition-all duration-200 shadow-lg shadow-[#C6FF3D]/15 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Pick a Plan in Recommender</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick-Pick Alternative */}
          <div className="pt-6 border-t border-[#24242E] space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA]">
              Or Quick-Start a Workout Split
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
              {allSplits.map((split) => (
                <button
                  key={split.id}
                  type="button"
                  onClick={() => {
                    setSelectedSplit(split.id);
                    try {
                      localStorage.setItem('fitforge_active_split', split.id);
                    } catch {
                      // Safe
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D]/40 text-xs font-semibold text-[#F4F4F6] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{split.name}</span>
                  <span className="text-[10px] text-[#A1A1AA] hidden sm:inline">
                    · {split.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= SCENARIO B: ACTIVE LIVE SESSION VIEW =================
  // Circular Ring SVG Calculations (radius 48, circumference ~301.59)
  const ringRadius = 48;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const restRatio = restDuration > 0 ? Math.max(0, Math.min(1, restRemaining / restDuration)) : 0;
  const strokeOffset = ringCircumference * (1 - restRatio);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ================= PAGE TOP HEADER & ABANDON BUTTON ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#24242E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D] shrink-0">
            <Play className="w-5 h-5 fill-[#C6FF3D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#F4F4F6]">
                {workoutPlan.name}
              </h1>
              {isStopwatchRunning && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              {SPLIT_DESCRIPTIONS[String(selectedSplit).toLowerCase()] ||
                '5-exercise resistance routine tailored for your profile.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sound Indicator */}
          <div
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#16161D] border border-[#24242E] text-xs text-[#A1A1AA]"
            title={userPreferences.soundEnabled ? 'Rest timer sounds enabled' : 'Rest timer sounds muted'}
          >
            {userPreferences.soundEnabled && !sounds.muted ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#C6FF3D]" />
                <span className="text-[10px] font-mono text-[#F4F4F6]">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-mono text-zinc-500">Muted</span>
              </>
            )}
          </div>

          {/* Change Plan Button */}
          <button
            type="button"
            onClick={() => {
              if (isSessionActive) {
                setIsAbandonModalOpen(true);
              } else {
                setSelectedSplit(null);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-[#16161D] hover:bg-[#24242E] border border-[#24242E] text-xs font-semibold text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors cursor-pointer"
          >
            Switch Plan
          </button>
        </div>
      </div>

      {/* ================= PRECISION HUD: STOPWATCH & CALORIES ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Stopwatch Card (8 cols) */}
        <div className="md:col-span-8 p-5 sm:p-6 rounded-3xl bg-[#16161D] border border-[#24242E] shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
              <Clock className="w-4 h-4 text-[#C6FF3D]" />
              <span className="uppercase tracking-wider">Session Stopwatch</span>
            </div>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                isStopwatchRunning
                  ? 'bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/30'
                  : stopwatchSeconds > 0
                  ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                  : 'bg-[#24242E] text-[#A1A1AA]'
              }`}
            >
              {isStopwatchRunning ? 'Running' : stopwatchSeconds > 0 ? 'Paused' : 'Ready'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 my-1">
            <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-[#F4F4F6] tabular-nums">
              {formatTime(stopwatchSeconds)}
            </div>

            {/* Stopwatch Controls: Start, Pause, Reset */}
            <div className="flex items-center gap-2">
              {isStopwatchRunning ? (
                <button
                  type="button"
                  onClick={handlePauseStopwatch}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B0B0F] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartStopwatch}
                  className="px-5 py-2.5 rounded-xl bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0B0B0F] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#C6FF3D]/15"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{stopwatchSeconds > 0 ? 'Resume' : 'Start'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetStopwatch}
                title="Reset Stopwatch to 00:00"
                className="p-2.5 rounded-xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors cursor-pointer"
                aria-label="Reset Stopwatch"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-[#A1A1AA] flex items-center gap-2 border-t border-[#24242E] pt-3">
            <span>Tip: Checking an exercise starts the rest timer automatically.</span>
          </div>
        </div>

        {/* Burned Calories & Finish CTA Card (4 cols) */}
        <div className="md:col-span-4 p-5 sm:p-6 rounded-3xl bg-[#16161D] border border-[#24242E] shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="uppercase tracking-wider">Energy Burned</span>
            </div>
            <span className="text-[10px] font-mono text-[#A1A1AA]">
              {userWeightKg}kg Athlete
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-[#F4F4F6] tabular-nums">
              {displayCalories}{' '}
              <span className="text-sm font-sans font-medium text-[#A1A1AA]">kcal</span>
            </div>
            <div className="text-[11px] font-mono text-[#A1A1AA] mt-1">
              Calculated via MET {workoutPlan.getMETValue().toFixed(1)} formula
            </div>
          </div>

          {/* Primary Finish & Save Button */}
          <button
            type="button"
            onClick={handleOpenFinishModal}
            className="w-full py-3 rounded-2xl bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0B0B0F] font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF3D]/15"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Finish and Save</span>
          </button>
        </div>
      </div>

      {/* ================= CIRCULAR REST COUNTDOWN RING ================= */}
      {isRestActive && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#16161D] via-[#1c1c27] to-[#16161D] border border-[#C6FF3D]/40 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left: Animated Circular Progress Ring */}
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                  {/* Background Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    className="text-[#24242E]"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Dynamic Neon Lime Progress Ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    className="text-[#C6FF3D] transition-all duration-1000 ease-linear"
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                {/* Ring Interior Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-2xl font-black text-[#F4F4F6] tabular-nums leading-none">
                    {restRemaining}s
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#C6FF3D] mt-1 font-bold">
                    Rest
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#C6FF3D] font-bold">
                  Rest Countdown Active
                </div>
                <h3 className="text-lg font-bold text-[#F4F4F6] leading-snug">
                  Catch your breath & hydrate
                </h3>
                {restExerciseName && (
                  <p className="text-xs text-[#A1A1AA]">
                    Resting after completing <strong className="text-white">{restExerciseName}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Right: Rest Controls (Skip Rest + Quick Add) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddRestTime(15)}
                className="px-3 py-2 rounded-xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] text-xs font-mono text-[#F4F4F6] transition-colors cursor-pointer"
                title="Add 15 seconds to rest"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={handleSkipRest}
                className="px-4 py-2 rounded-xl bg-[#24242E] hover:bg-[#2E2E3C] text-[#F4F4F6] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 text-[#C6FF3D]" />
                <span>Skip Rest</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DYNAMIC PROGRESS BAR ================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#16161D] border border-[#24242E] space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="font-mono text-[#A1A1AA] flex items-center gap-2">
            <span>Exercises Completed:</span>
            <strong className="text-[#F4F4F6] font-bold">
              {completedCount} / 5
            </strong>
          </div>
          <div className="font-mono text-[#C6FF3D] font-bold tabular-nums">
            {progressPercent}% Complete
          </div>
        </div>

        {/* Linear Progress Track */}
        <div className="h-2.5 bg-[#0B0B0F] border border-[#24242E] rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-[#C6FF3D] rounded-full transition-all duration-500 ease-out shadow-sm shadow-[#C6FF3D]/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ================= CLICKABLE CHECKLIST OF 5 EXERCISES ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-[#F4F4F6]">
            Prescribed Routine Checklist ({exercises.length} Exercises)
          </h2>
          <span className="text-xs font-mono text-[#A1A1AA]">
            Click to complete
          </span>
        </div>

        <div className="space-y-3">
          {exercises.map((exercise, index) => {
            const isCompleted = completedExercises[index];
            const sets = exercise.sets || exercise.defaultSets || 3;
            const reps = exercise.reps || exercise.defaultReps || 10;
            const rest = exercise.restSeconds || exercise.suggestedRestSeconds || 60;

            return (
              <div
                key={exercise.id || index}
                onClick={() => handleToggleExercise(index)}
                className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 cursor-pointer select-none group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-[#16161D]/60 border-[#C6FF3D]/40 shadow-sm shadow-[#C6FF3D]/5'
                    : 'bg-[#16161D] hover:bg-[#1a1a24] border-[#24242E] hover:border-[#383848]'
                }`}
              >
                {/* Left: Number + Checkbox + Details */}
                <div className="flex items-start sm:items-center gap-4">
                  {/* Interactive Checkbox Circle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleExercise(index);
                    }}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-[#C6FF3D] border-[#C6FF3D] text-[#0B0B0F] shadow-md shadow-[#C6FF3D]/20'
                        : 'bg-[#0B0B0F] border-[#24242E] text-transparent group-hover:border-[#C6FF3D]/50'
                    }`}
                    aria-label={`Mark ${exercise.name} as ${isCompleted ? 'incomplete' : 'complete'}`}
                  >
                    <Check className={`w-5 h-5 stroke-[3] ${isCompleted ? 'text-[#0B0B0F]' : 'opacity-0'}`} />
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#0B0B0F] border border-[#24242E] text-[#A1A1AA]">
                        Exercise {index + 1} of 5
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#C6FF3D]/10 text-[#C6FF3D]">
                        {exercise.targetMuscle}
                      </span>
                      <span className="text-[10px] font-mono text-[#A1A1AA] hidden sm:inline">
                        · {exercise.equipment}
                      </span>
                    </div>

                    <h3
                      className={`text-base font-bold transition-colors ${
                        isCompleted
                          ? 'text-[#A1A1AA] line-through decoration-[#C6FF3D]/50'
                          : 'text-[#F4F4F6] group-hover:text-white'
                      }`}
                    >
                      {exercise.name}
                    </h3>

                    {exercise.formTip && (
                      <p className="text-xs text-[#A1A1AA] line-clamp-1 italic">
                        Tip: {exercise.formTip}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Prescribed Sets, Reps & Rest Pill */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#24242E]/50">
                  <div className="text-left sm:text-right font-mono">
                    <div className="text-xs font-bold text-[#F4F4F6]">
                      {sets} sets × {reps} reps
                    </div>
                    <div className="text-[10px] text-[#A1A1AA]">
                      Rest: {rest}s
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isCompleted
                        ? 'bg-[#C6FF3D]/15 text-[#C6FF3D] border border-[#C6FF3D]/30'
                        : 'bg-[#0B0B0F] text-[#A1A1AA] border border-[#24242E]'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <span>Pending</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= FINISH AND SAVE MODAL ================= */}
      {isFinishModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0F]/85 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#16161D] border border-[#24242E] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden space-y-5 p-6 sm:p-7">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#24242E] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D] shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-bold uppercase tracking-wider text-[#F4F4F6]">
                    Finish Workout Session
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Save session performance metrics to your workout history.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="p-1 rounded-lg text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Session Summary Statistics */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-center font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-[#A1A1AA] block">Duration</span>
                <span className="text-base font-black text-[#F4F4F6] tabular-nums">
                  {elapsedMinutes}m
                </span>
                <span className="text-[10px] text-[#A1A1AA] block">
                  {formatTime(stopwatchSeconds)}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-[#A1A1AA] block">Calories</span>
                <span className="text-base font-black text-[#C6FF3D] tabular-nums">
                  {displayCalories}
                </span>
                <span className="text-[10px] text-[#A1A1AA] block">kcal burned</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-[#A1A1AA] block">Exercises</span>
                <span className="text-base font-black text-[#F4F4F6] tabular-nums">
                  {completedCount} / 5
                </span>
                <span className="text-[10px] text-[#C6FF3D] font-bold block">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Notes Form Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="session-notes-input"
                className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA]"
              >
                Session Notes (Optional)
              </label>
              <textarea
                id="session-notes-input"
                rows={3}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Felt strong on compound lifts, improved endurance, notes for next session..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] focus:border-[#C6FF3D] text-xs text-[#F4F4F6] outline-none transition-colors resize-none placeholder:text-zinc-600"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#24242E]">
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#24242E] hover:bg-[#2E2E3C] text-[#F4F4F6] text-xs font-semibold cursor-pointer transition-colors"
              >
                Resume Session
              </button>
              <button
                type="button"
                onClick={handleSaveWorkout}
                className="px-5 py-2.5 rounded-xl bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0B0B0F] text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#C6FF3D]/15"
              >
                <Save className="w-4 h-4" />
                <span>Save to History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABANDON ACTIVE SESSION CONFIRMATION ================= */}
      <ConfirmModal
        isOpen={isAbandonModalOpen}
        onClose={() => setIsAbandonModalOpen(false)}
        onConfirm={handleConfirmAbandon}
        title="Leave Active Workout Session?"
        description="You have an active workout session with running timers and checked exercises. If you switch plans or leave now without saving, your session progress will be lost."
        confirmLabel="Discard & Leave"
        isDestructive={true}
      />
    </div>
  );
};
