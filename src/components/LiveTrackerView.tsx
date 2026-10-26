import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Dumbbell,
  FastForward,
  Flame,
  Heart,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Save,
  Settings,
  SkipForward,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DeloadManager } from '../models/DeloadManager';
import { Exercise } from '../models/Exercise';
import { ExerciseImage } from './ExerciseImage';
import { ExerciseGuideView } from './ExerciseGuideView';
import { getExerciseGuide } from '../models/exerciseGuides';
import { MemberProfile } from '../models/MemberProfile';
import { PersonalRecord, PersonalRecordManager } from '../models/PersonalRecord';
import { RecordManager } from '../models/RecordManager';
import { SetLogManager } from '../models/SetLogManager';
import { ExperienceLevel, ExtendedSplitType, SplitType } from '../models/types';
import { User } from '../models/User';
import { WorkoutPlan } from '../models/WorkoutPlan';
import { WorkoutPlanFactory } from '../models/WorkoutPlanFactory';
import { sounds } from '../utils/audio';
import { ConfirmModal } from './ConfirmModal';
import {
  getWarmUpRoutine,
  isWarmUpSkippedForSession,
  setWarmUpSkippedForSession,
  WarmUpRoutine,
} from '../models/warmups';

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
  initialExercises?: any[] | null;
  onWorkoutSaved: () => void;
  onActiveStateChange?: (isActive: boolean) => void;
}

type SessionState = 'ready' | 'warmup' | 'guided' | 'finished';
type GuidedPhase = 'work' | 'rest' | 'get_ready';

export const LiveTrackerView: React.FC<LiveTrackerViewProps> = ({
  currentUser,
  currentProfile,
  recordManager,
  initialSplit = null,
  initialExercises = null,
  onWorkoutSaved,
  onActiveStateChange,
}) => {
  const navigate = useNavigate();
  const { userPreferences, updatePreferences } = useAuth();
  const { success: showToastSuccess, info: showToastInfo } = useToast();

  // Active training split
  const [selectedSplit, setSelectedSplit] = useState<ExtendedSplitType | string | null>(initialSplit);

  // Experience level & athlete biometrics
  const experienceLevel: ExperienceLevel = currentProfile?.experienceLevel || 'intermediate';
  const isBeginner = (experienceLevel || '').toLowerCase() === 'beginner';
  const userWeightKg: number = currentProfile?.weightKg || 70;

  // Active WorkoutPlan subclass instance
  const workoutPlan: WorkoutPlan | null = useMemo(() => {
    if (!selectedSplit) return null;
    return WorkoutPlanFactory.create(selectedSplit);
  }, [selectedSplit]);

  // Prescribed 5 exercises derived polymorphically from the selected split and equipment
  const exercises: Exercise[] = useMemo(() => {
    if (initialExercises && Array.isArray(initialExercises) && initialExercises.length === 5) {
      return initialExercises.map((data) => Exercise.fromJSON(data));
    }
    if (!workoutPlan) return [];
    const base = workoutPlan.getExercises(experienceLevel, currentProfile?.availableEquipment);
    if (DeloadManager.isDeloadModeActive()) {
      return base.map((ex) => ex.prescribe(2, ex.reps, ex.restSeconds));
    }
    return base;
  }, [workoutPlan, experienceLevel, currentProfile?.availableEquipment, initialExercises]);

  // ================= SECONDS PER REP SETTING =================
  const [secondsPerRep, setSecondsPerRep] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('fitforge_seconds_per_rep');
      if (stored) return Number(stored);
    } catch {
      // safe
    }
    return userPreferences.secondsPerRep || 4;
  });

  const [isPaceModalOpen, setIsPaceModalOpen] = useState(false);

  const handleUpdateSecondsPerRep = (val: number) => {
    setSecondsPerRep(val);
    try {
      localStorage.setItem('fitforge_seconds_per_rep', String(val));
    } catch {
      // safe
    }
    updatePreferences({ secondsPerRep: val });
    showToastSuccess(`Tempo adjusted: ${val} seconds per rep.`);
    setIsPaceModalOpen(false);
  };

  // ================= GUIDED SESSION FLOW STATES =================
  const [sessionState, setSessionState] = useState<SessionState>('ready');
  const [phase, setPhase] = useState<GuidedPhase>('work');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Sets actually completed per exercise (5 exercises)
  const [completedSetsByExercise, setCompletedSetsByExercise] = useState<number[]>([0, 0, 0, 0, 0]);

  // ================= WARM-UP FLOW STATES =================
  const [warmupSecondsRemaining, setWarmupSecondsRemaining] = useState<number>(300); // 5 minutes
  const [isWarmupTimerRunning, setIsWarmupTimerRunning] = useState<boolean>(false);
  const [currentWarmupMoveIndex, setCurrentWarmupMoveIndex] = useState<number>(0);
  const [completedWarmupMoves, setCompletedWarmupMoves] = useState<Record<string, boolean>>({});
  const [skipWarmupForSession, setSkipWarmupForSession] = useState<boolean>(() => isWarmUpSkippedForSession());
  const warmupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const warmUpRoutine: WarmUpRoutine = useMemo(() => {
    return getWarmUpRoutine(selectedSplit, exercises);
  }, [selectedSplit, exercises]);

  // ================= STOPWATCH TIMER =================
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ================= WORK PHASE COUNTDOWN TIMER =================
  const [workRemaining, setWorkRemaining] = useState<number>(0);
  const [workTotalDuration, setWorkTotalDuration] = useState<number>(40);
  const workIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ================= REST PHASE COUNTDOWN TIMER =================
  const [restRemaining, setRestRemaining] = useState<number>(0);
  const [restTotalDuration, setRestTotalDuration] = useState<number>(60);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ================= GET READY (3-2-1) COUNTDOWN TIMER =================
  const [getReadyRemaining, setGetReadyRemaining] = useState<number>(3);
  const getReadyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ================= FINISH MODAL, NOTES & OVERVIEW =================
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [isQuitModalOpen, setIsQuitModalOpen] = useState<boolean>(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState<boolean>(true);

  // Beginner-friendly exercise instruction panel state
  // Open by default for Beginners before set 1, collapsed for others
  const [isGuidePanelOpen, setIsGuidePanelOpen] = useState<boolean>(() => isBeginner);

  useEffect(() => {
    if (currentSetIndex === 1) {
      setIsGuidePanelOpen(isBeginner);
    } else {
      setIsGuidePanelOpen(false);
    }
  }, [currentExerciseIndex, isBeginner]);

  // Current active exercise object
  const currentExercise = exercises[currentExerciseIndex] || exercises[0];
  const currentExTotalSets = currentExercise?.sets || currentExercise?.defaultSets || 3;
  const currentExReps = typeof currentExercise?.reps === 'number'
    ? currentExercise.reps
    : parseInt(String(currentExercise?.reps || '10'), 10) || 10;

  // Calculate total workout sets & completed sets
  const totalWorkoutSets = useMemo(() => {
    return exercises.reduce((acc, ex) => acc + (ex.sets || ex.defaultSets || 3), 0) || 15;
  }, [exercises]);

  const totalCompletedSets = useMemo(() => {
    return completedSetsByExercise.reduce((acc, count) => acc + count, 0);
  }, [completedSetsByExercise]);

  // Exercises completed count: an exercise is Complete ONLY after its last set
  const completedCount = useMemo(() => {
    return exercises.filter((ex, idx) => {
      const required = ex.sets || ex.defaultSets || 3;
      return (completedSetsByExercise[idx] || 0) >= required;
    }).length;
  }, [exercises, completedSetsByExercise]);

  const progressPercent = Math.min(100, Math.round((totalCompletedSets / totalWorkoutSets) * 100));

  // Session active check: if guided mode has started or stopwatch is running
  const isSessionActive = sessionState === 'guided' || stopwatchSeconds > 0;

  // Sync active state with parent / layout
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

  // Clear all timer intervals on component unmount
  useEffect(() => {
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
      if (workIntervalRef.current) clearInterval(workIntervalRef.current);
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
      if (getReadyIntervalRef.current) clearInterval(getReadyIntervalRef.current);
      if (warmupIntervalRef.current) clearInterval(warmupIntervalRef.current);
    };
  }, []);

  // Warm-up 5-minute countdown interval
  useEffect(() => {
    if (sessionState === 'warmup' && isWarmupTimerRunning && !isPaused) {
      warmupIntervalRef.current = setInterval(() => {
        setWarmupSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (userPreferences.soundEnabled && !sounds.muted) {
              sounds.playCountdownBeep(true);
            }
            setIsWarmupTimerRunning(false);
            return 0;
          }
          if (prev <= 4 && prev > 1 && userPreferences.soundEnabled && !sounds.muted) {
            sounds.playCountdownBeep(false);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (warmupIntervalRef.current) {
        clearInterval(warmupIntervalRef.current);
        warmupIntervalRef.current = null;
      }
    }
    return () => {
      if (warmupIntervalRef.current) {
        clearInterval(warmupIntervalRef.current);
        warmupIntervalRef.current = null;
      }
    };
  }, [sessionState, isWarmupTimerRunning, isPaused, userPreferences.soundEnabled]);

  // Reset exercise sets tracker when split changes
  useEffect(() => {
    setCompletedSetsByExercise([0, 0, 0, 0, 0]);
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(1);
    setSessionState('ready');
    setPhase('work');
    setIsPaused(false);
  }, [selectedSplit]);

  // ================= 1. SESSION STOPWATCH INTERVAL =================
  useEffect(() => {
    if (isStopwatchRunning && !isPaused && sessionState === 'guided') {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
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
  }, [isStopwatchRunning, isPaused, sessionState]);

  // ================= PER-SET LOGGING & PROGRESS TRACKING =================
  const [setLogManager] = useState(() => new SetLogManager());
  const [personalRecordManager] = useState(() => new PersonalRecordManager());

  // Completed set logs for the active guided session
  const [sessionSetLogs, setSessionSetLogs] = useState<
    Array<{
      exerciseName: string;
      setNumber: number;
      weightKg: number;
      reps: number;
      targetReps: number;
    }>
  >([]);

  // Current active set input values
  const [currentSetWeight, setCurrentSetWeight] = useState<number>(0);
  const [currentSetReps, setCurrentSetReps] = useState<number>(10);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [repsError, setRepsError] = useState<string | null>(null);

  // Active PR celebration alert
  const [activePRAlert, setActivePRAlert] = useState<{
    exerciseName: string;
    weightKg: number;
    reps: number;
    est1RM: number;
    isWeightPR: boolean;
    is1RMPR: boolean;
  } | null>(null);

  // Helper to prefill weight and reps from previous set, exercise history, or plan default
  const prefillForSet = (exIndex: number, setNum: number) => {
    const ex = exercises[exIndex];
    if (!ex) return;

    const exReps =
      typeof ex.reps === 'number'
        ? ex.reps
        : parseInt(String(ex.reps || '10'), 10) || 10;

    // 1. Previous set in this exact session
    const prevInSession = sessionSetLogs.find(
      (s) => s.exerciseName === ex.name && s.setNumber === setNum - 1
    );

    if (prevInSession) {
      setCurrentSetWeight(prevInSession.weightKg);
      setCurrentSetReps(prevInSession.reps);
      setWeightError(null);
      setRepsError(null);
      return;
    }

    // 2. Query last set from history for this exercise & user
    if (currentUser) {
      const lastHistory = setLogManager.getLastSetForExercise(currentUser.id, ex.name);
      if (lastHistory) {
        setCurrentSetWeight(lastHistory.weightKg);
        setCurrentSetReps(lastHistory.reps || exReps);
        setWeightError(null);
        setRepsError(null);
        return;
      }
    }

    // 3. Plan default fallback
    const isBodyweight =
      ex.equipment.toLowerCase().includes('bodyweight') ||
      ex.name.toLowerCase().includes('push-up') ||
      ex.name.toLowerCase().includes('plank') ||
      ex.name.toLowerCase().includes('pull-up');

    const defaultWeight = isBodyweight
      ? 0
      : ex.equipment.toLowerCase().includes('dumbbell')
      ? 12
      : ex.equipment.toLowerCase().includes('barbell')
      ? 30
      : 20;

    setCurrentSetWeight(defaultWeight);
    setCurrentSetReps(exReps);
    setWeightError(null);
    setRepsError(null);
  };

  // Progressive overload hint for active exercise
  const overloadHint = useMemo(() => {
    if (!currentUser || !currentExercise) return null;
    return setLogManager.generateProgressiveOverloadHint(
      currentUser.id,
      currentExercise.name,
      currentExReps,
      currentSetWeight
    );
  }, [currentUser, currentExercise, currentExReps, currentSetWeight, setLogManager]);

  // ================= 2. WORK PHASE TIMER =================
  // Initializes work timer when entering work phase or changing exercise/set
  const startWorkPhase = (exIndex: number, setNum: number) => {
    const ex = exercises[exIndex];
    const reps = typeof ex?.reps === 'number'
      ? ex.reps
      : parseInt(String(ex?.reps || '10'), 10) || 10;
    const duration = Math.max(5, reps * secondsPerRep);

    setWorkTotalDuration(duration);
    setWorkRemaining(duration);
    setPhase('work');
    prefillForSet(exIndex, setNum);
  };

  useEffect(() => {
    if (sessionState === 'guided' && phase === 'work' && !isPaused) {
      if (workIntervalRef.current) {
        clearInterval(workIntervalRef.current);
      }

      workIntervalRef.current = setInterval(() => {
        setWorkRemaining((prev) => {
          if (prev <= 1) {
            if (workIntervalRef.current) {
              clearInterval(workIntervalRef.current);
              workIntervalRef.current = null;
            }
            // Sound notification on timer expiration
            if (userPreferences.soundEnabled && !sounds.muted) {
              sounds.playCountdownBeep(true);
            }
            // Requirement 3: When the countdown ends it waits for the user to press I'm done and never auto-completes the set.
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (workIntervalRef.current) {
        clearInterval(workIntervalRef.current);
        workIntervalRef.current = null;
      }
    }

    return () => {
      if (workIntervalRef.current) {
        clearInterval(workIntervalRef.current);
        workIntervalRef.current = null;
      }
    };
  }, [sessionState, phase, isPaused, userPreferences.soundEnabled]);

  // ================= 3. REST PHASE TIMER =================
  useEffect(() => {
    if (sessionState === 'guided' && phase === 'rest' && !isPaused && restRemaining > 0) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }

      restIntervalRef.current = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            if (restIntervalRef.current) {
              clearInterval(restIntervalRef.current);
              restIntervalRef.current = null;
            }
            // Beep at rest expiration
            if (userPreferences.soundEnabled && !sounds.muted) {
              sounds.playCountdownBeep(true);
            }
            // Trigger Get Ready 3-2-1 countdown
            startGetReadyPhase();
            return 0;
          }

          // Countdown beeps on last 3 seconds (3, 2, 1)
          if (prev <= 4 && prev > 1) {
            if (userPreferences.soundEnabled && !sounds.muted) {
              sounds.playCountdownBeep(false);
            }
          }

          return prev - 1;
        });
      }, 1000);
    } else {
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
  }, [sessionState, phase, isPaused, restRemaining, userPreferences.soundEnabled]);

  // ================= 4. GET READY (3-2-1) PHASE TIMER =================
  const startGetReadyPhase = () => {
    setPhase('get_ready');
    setGetReadyRemaining(3);
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playCountdownBeep(false);
    }
  };

  useEffect(() => {
    if (sessionState === 'guided' && phase === 'get_ready' && !isPaused) {
      if (getReadyIntervalRef.current) {
        clearInterval(getReadyIntervalRef.current);
      }

      getReadyIntervalRef.current = setInterval(() => {
        setGetReadyRemaining((prev) => {
          if (prev <= 1) {
            if (getReadyIntervalRef.current) {
              clearInterval(getReadyIntervalRef.current);
              getReadyIntervalRef.current = null;
            }
            if (userPreferences.soundEnabled && !sounds.muted) {
              sounds.playCountdownBeep(true);
            }
            // Advance to the next set or next exercise
            advanceToNextSet();
            return 0;
          }

          if (userPreferences.soundEnabled && !sounds.muted) {
            sounds.playCountdownBeep(false);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (getReadyIntervalRef.current) {
        clearInterval(getReadyIntervalRef.current);
        getReadyIntervalRef.current = null;
      }
    }

    return () => {
      if (getReadyIntervalRef.current) {
        clearInterval(getReadyIntervalRef.current);
        getReadyIntervalRef.current = null;
      }
    };
  }, [sessionState, phase, isPaused, userPreferences.soundEnabled]);

  // ================= ADVANCING SETS & EXERCISES =================
  const advanceToNextSet = () => {
    const currentEx = exercises[currentExerciseIndex];
    const totalSets = currentEx?.sets || currentEx?.defaultSets || 3;

    if (currentSetIndex < totalSets) {
      // Advance to next set of same exercise
      const nextSet = currentSetIndex + 1;
      setCurrentSetIndex(nextSet);
      startWorkPhase(currentExerciseIndex, nextSet);
    } else {
      // Advance to next exercise
      if (currentExerciseIndex < exercises.length - 1) {
        const nextExIdx = currentExerciseIndex + 1;
        setCurrentExerciseIndex(nextExIdx);
        setCurrentSetIndex(1);
        startWorkPhase(nextExIdx, 1);
      } else {
        // All exercises completed!
        handleCompleteWorkout();
      }
    }
  };

  // ================= WORKOUT & WARM-UP ACTIONS =================
  const beginGuidedWorkout = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    if (warmupIntervalRef.current) {
      clearInterval(warmupIntervalRef.current);
      warmupIntervalRef.current = null;
    }
    setIsWarmupTimerRunning(false);
    setSessionState('guided');
    setIsStopwatchRunning(true);
    setIsPaused(false);
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(1);
    startWorkPhase(0, 1);
  };

  // 1. Start Workout from Ready screen (triggers Warm-up unless skipped for session)
  const handleStartWorkout = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    // Check if the user chose to skip warm-up for this session
    if (isWarmUpSkippedForSession()) {
      beginGuidedWorkout();
    } else {
      setSessionState('warmup');
      setWarmupSecondsRemaining(300);
      setIsWarmupTimerRunning(false);
      setCurrentWarmupMoveIndex(0);
    }
  };

  // Warm-up actions
  const handleStartWarmupTimer = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    setIsWarmupTimerRunning(true);
    setIsPaused(false);
  };

  const handlePauseWarmupTimer = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    setIsWarmupTimerRunning((prev) => !prev);
  };

  const handleResetWarmupTimer = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    setWarmupSecondsRemaining(300);
    setIsWarmupTimerRunning(false);
  };

  const handleSkipWarmup = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    setWarmUpSkippedForSession(true);
    setSkipWarmupForSession(true);
    showToastInfo('Warm-up skipped for this session.');
    beginGuidedWorkout();
  };

  const handleCompleteWarmup = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    showToastSuccess('Warm-up complete! Beginning main workout.');
    beginGuidedWorkout();
  };

  const handleToggleWarmupMove = (moveId: string) => {
    setCompletedWarmupMoves((prev) => ({
      ...prev,
      [moveId]: !prev[moveId],
    }));
  };

  const handleResetSkipChoice = () => {
    setWarmUpSkippedForSession(false);
    setSkipWarmupForSession(false);
    showToastSuccess('Warm-up will show for your next workout.');
  };

  // 2. User presses "I'm done" on current set
  const handleSetDone = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }

    // Validate current working set inputs (weight 0 to 500, reps 1 to 100)
    const validation = SetLogManager.validate(currentSetWeight, currentSetReps);
    if (!validation.isValid) {
      if (validation.weightError) setWeightError(validation.weightError);
      if (validation.repsError) setRepsError(validation.repsError);
      return;
    }

    setWeightError(null);
    setRepsError(null);

    // Stop work interval
    if (workIntervalRef.current) {
      clearInterval(workIntervalRef.current);
      workIntervalRef.current = null;
    }

    // Append/update set in this session's logs
    setSessionSetLogs((prev) => {
      const filtered = prev.filter(
        (s) => !(s.exerciseName === currentExercise.name && s.setNumber === currentSetIndex)
      );
      return [
        ...filtered,
        {
          exerciseName: currentExercise.name,
          setNumber: currentSetIndex,
          weightKg: validation.sanitizedWeight,
          reps: validation.sanitizedReps,
          targetReps: currentExReps,
        },
      ];
    });

    // Check for Personal Record
    if (currentUser) {
      const prTest = personalRecordManager.testCandidateSet(
        currentUser.id,
        currentExercise.name,
        validation.sanitizedWeight,
        validation.sanitizedReps
      );

      if (prTest.isWeightPR || prTest.is1RMPR) {
        setActivePRAlert({
          exerciseName: currentExercise.name,
          weightKg: validation.sanitizedWeight,
          reps: validation.sanitizedReps,
          est1RM: prTest.est1RM,
          isWeightPR: prTest.isWeightPR,
          is1RMPR: prTest.is1RMPR,
        });

        try {
          confetti({
            particleCount: 85,
            spread: 65,
            origin: { y: 0.65 },
            colors: ['#C6FF3D', '#FFFFFF', '#FFD700'],
          });
        } catch {}

        showToastSuccess(
          `🔥 NEW PERSONAL RECORD! ${currentExercise.name}: ${validation.sanitizedWeight} kg × ${validation.sanitizedReps} reps · Est. 1RM: ${prTest.est1RM} kg!`
        );
      } else {
        setActivePRAlert(null);
      }
    }

    // Record set completion
    setCompletedSetsByExercise((prev) => {
      const updated = [...prev];
      updated[currentExerciseIndex] = Math.min(
        currentExTotalSets,
        (updated[currentExerciseIndex] || 0) + 1
      );
      return updated;
    });

    // Check if this was the last set of the last exercise (Exercise 5, last set)
    const isFinalSetOfFinalExercise =
      currentExerciseIndex === exercises.length - 1 && currentSetIndex >= currentExTotalSets;

    if (isFinalSetOfFinalExercise) {
      // Requirement 6: After the last set of the last exercise, skip the rest and show the Finish and Save screen
      handleCompleteWorkout();
    } else {
      // Automatically transition to rest phase
      const restTime = currentExercise?.restSeconds || currentExercise?.suggestedRestSeconds || 60;
      setRestTotalDuration(restTime);
      setRestRemaining(restTime);
      setPhase('rest');
    }
  };

  // 3. Skip Rest button
  const handleSkipRest = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    setRestRemaining(0);
    startGetReadyPhase();
  };

  // 4. Add +15s to rest
  const handleAddRestTime = (seconds: number) => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    setRestRemaining((prev) => prev + seconds);
    setRestTotalDuration((prev) => prev + seconds);
  };

  // 5. Previous Set button
  const handlePreviousSet = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }

    // Clear any rest or get-ready intervals
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    if (getReadyIntervalRef.current) clearInterval(getReadyIntervalRef.current);

    if (currentSetIndex > 1) {
      const prevSet = currentSetIndex - 1;
      setCurrentSetIndex(prevSet);
      startWorkPhase(currentExerciseIndex, prevSet);
    } else if (currentExerciseIndex > 0) {
      const prevExIdx = currentExerciseIndex - 1;
      const prevExSets = exercises[prevExIdx].sets || exercises[prevExIdx].defaultSets || 3;
      setCurrentExerciseIndex(prevExIdx);
      setCurrentSetIndex(prevExSets);
      startWorkPhase(prevExIdx, prevExSets);
    }
  };

  // 6. Skip Exercise button
  const handleSkipExercise = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }

    // Clear timers
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    if (getReadyIntervalRef.current) clearInterval(getReadyIntervalRef.current);
    if (workIntervalRef.current) clearInterval(workIntervalRef.current);

    if (currentExerciseIndex < exercises.length - 1) {
      const nextExIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextExIdx);
      setCurrentSetIndex(1);
      startWorkPhase(nextExIdx, 1);
    } else {
      // On last exercise, skip triggers finish
      handleCompleteWorkout();
    }
  };

  // 7. Pause / Resume Toggle
  const handleTogglePause = () => {
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playTick();
    }
    setIsPaused((prev) => !prev);
  };

  // 8. Complete Workout (transitions to Finish & Save screen)
  const handleCompleteWorkout = () => {
    setIsStopwatchRunning(false);
    setIsPaused(false);
    setSessionState('finished');

    // Clean up timers
    if (workIntervalRef.current) clearInterval(workIntervalRef.current);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    if (getReadyIntervalRef.current) clearInterval(getReadyIntervalRef.current);

    // Audio and confetti celebration
    if (userPreferences.soundEnabled && !sounds.muted) {
      sounds.playFanfare();
    }
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C6FF3D', '#3B82F6', '#10B981', '#F59E0B'],
      });
    } catch {
      // safe
    }
  };

  // 9. Save Workout to Database
  const handleSaveWorkout = () => {
    if (!currentUser || !workoutPlan) return;

    const finalMinutes = Math.max(1, Math.round(stopwatchSeconds / 60));
    const finalCalories = currentCalories;
    const planName = workoutPlan.name;

    try {
      const savedRecord = recordManager.addRecord({
        userId: currentUser.id,
        date: new Date().toISOString(),
        title: `${planName} Guided Session`,
        splitName: planName,
        splitType: workoutPlan.splitType,
        durationMinutes: finalMinutes,
        caloriesBurned: finalCalories,
        exercisesCompleted: completedCount,
        totalExercises: 5,
        notes: sessionNotes.trim() || `Completed ${totalCompletedSets} of ${totalWorkoutSets} sets across ${completedCount} exercises in ${finalMinutes}m.`,
      });

      // Save each set to set_logs table (id, userId, recordId, exerciseName, setNumber, weightKg, reps)
      if (sessionSetLogs.length > 0) {
        setLogManager.createBatch(
          sessionSetLogs.map((s) => ({
            userId: currentUser.id,
            recordId: savedRecord.id,
            exerciseName: s.exerciseName,
            setNumber: s.setNumber,
            weightKg: s.weightKg,
            reps: s.reps,
            targetReps: s.targetReps,
            date: new Date().toISOString(),
          }))
        );
      }

      // Clear active stored split
      try {
        localStorage.removeItem('fitforge_active_split');
        localStorage.removeItem('fitforge_active_exercises');
        localStorage.removeItem('fitforge_active_level');
      } catch {
        // safe
      }

      showToastSuccess(
        `Workout saved! Logged ${finalMinutes}m and ${displayCalories} kcal burned.`
      );

      onWorkoutSaved();
    } catch (err) {
      console.error('Failed to save workout session:', err);
      showToastInfo('Error saving workout. Please try again.');
    }
  };

  // 10. Quit & Discard Session
  const handleConfirmQuit = () => {
    setIsStopwatchRunning(false);
    setIsPaused(false);
    setStopwatchSeconds(0);
    setSessionState('ready');
    setPhase('work');
    setCompletedSetsByExercise([0, 0, 0, 0, 0]);
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(1);

    if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    if (workIntervalRef.current) clearInterval(workIntervalRef.current);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    if (getReadyIntervalRef.current) clearInterval(getReadyIntervalRef.current);

    try {
      localStorage.removeItem('fitforge_active_split');
      localStorage.removeItem('fitforge_active_exercises');
      localStorage.removeItem('fitforge_active_level');
    } catch {
      // safe
    }

    setIsQuitModalOpen(false);
    showToastInfo('Workout session discarded.');
    navigate('/recommender');
  };

  // ================= REAL-TIME CALORIES CALCULATION =================
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

  // Estimated total routine duration in minutes (calculated for Ready screen)
  const estimatedRoutineMinutes = useMemo(() => {
    if (!exercises || exercises.length === 0) return 30;
    const totalSec = exercises.reduce((acc, ex) => {
      const sets = ex.sets || ex.defaultSets || 3;
      const reps = typeof ex.reps === 'number'
        ? ex.reps
        : parseInt(String(ex.reps || '10'), 10) || 10;
      const rest = ex.restSeconds || ex.suggestedRestSeconds || 60;
      const work = reps * secondsPerRep;
      return acc + (sets * work) + (Math.max(1, sets - 1) * rest) + 30; // 30s buffer between exercises
    }, 0);
    return Math.max(15, Math.round(totalSec / 60));
  }, [exercises, secondsPerRep]);

  // Next up preview calculation for Guided View
  const nextUpPreview = useMemo(() => {
    if (!currentExercise) return null;
    if (currentSetIndex < currentExTotalSets) {
      return `Next up: Set ${currentSetIndex + 1} of ${currentExTotalSets} (${currentExercise.name})`;
    }
    if (currentExerciseIndex < exercises.length - 1) {
      const nextEx = exercises[currentExerciseIndex + 1];
      const nextSets = nextEx.sets || nextEx.defaultSets || 3;
      return `Next up: Exercise ${currentExerciseIndex + 2} — ${nextEx.name} (Set 1 of ${nextSets})`;
    }
    return 'Next up: Finish & Save Workout 🏆';
  }, [currentExercise, currentSetIndex, currentExTotalSets, currentExerciseIndex, exercises]);

  // SVG circular calculations
  const ringRadius = 58;
  const ringCircumference = 2 * Math.PI * ringRadius;

  // Work ring offset
  const workRatio = workTotalDuration > 0 ? Math.max(0, Math.min(1, workRemaining / workTotalDuration)) : 0;
  const workStrokeOffset = ringCircumference * (1 - workRatio);

  // Rest ring offset
  const restRatio = restTotalDuration > 0 ? Math.max(0, Math.min(1, restRemaining / restTotalDuration)) : 0;
  const restStrokeOffset = ringCircumference * (1 - restRatio);

  // ================= SCENARIO A: NO PLAN CHOSEN =================
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
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-[#24242E]">
          <div className="w-10 h-10 rounded-2xl bg-lime-500/10 border border-lime-500/30 dark:bg-[#C6FF3D]/10 dark:border-[#C6FF3D]/30 flex items-center justify-center text-lime-700 dark:text-[#C6FF3D]">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
              Live Workout Session
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-0.5">
              Guided workout mode with set countdowns, automatic rest intervals, and live progress.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] text-center space-y-6 shadow-sm dark:shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C6FF3D]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-lime-700 dark:text-[#C6FF3D] flex items-center justify-center mx-auto shadow-inner">
            <Compass className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
              No Workout Plan Selected
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#A1A1AA] leading-relaxed">
              Select a routine to enter Guided Workout Mode. You will receive a structured 5-exercise regimen with custom set tempos and recovery periods.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/recommender')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] font-bold text-sm transition-all duration-200 shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/15 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Pick a Plan in Recommender</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-[#24242E] space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">
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
                      // safe
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0B0B0F] hover:bg-slate-100 dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] hover:border-slate-300 dark:hover:border-[#C6FF3D]/40 text-xs font-semibold text-slate-900 dark:text-[#F4F4F6] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{split.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-[#A1A1AA] hidden sm:inline">
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

  // ================= SCENARIO B: READY SCREEN (Requirement 1) =================
  if (sessionState === 'ready') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#24242E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-500/10 border border-lime-500/30 dark:bg-[#C6FF3D]/10 dark:border-[#C6FF3D]/30 flex items-center justify-center text-lime-700 dark:text-[#C6FF3D] shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
                  {workoutPlan.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-lime-500/10 border border-lime-500/30 dark:bg-[#C6FF3D]/10 dark:border-[#C6FF3D]/30 text-[10px] font-mono font-bold text-lime-700 dark:text-[#C6FF3D] uppercase">
                  Ready Mode
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-0.5">
                {SPLIT_DESCRIPTIONS[String(selectedSplit).toLowerCase()] ||
                  'Structured 5-exercise resistance routine tailored for your profile.'}
              </p>
            </div>
          </div>

          {/* Quick Actions: Switch Plan & Tempo Setting */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPaceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#16161D] hover:bg-slate-100 dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] text-xs font-mono text-slate-800 dark:text-[#F4F4F6] transition-colors cursor-pointer"
              title="Configure seconds per rep tempo"
            >
              <Settings className="w-3.5 h-3.5 text-lime-700 dark:text-[#C6FF3D]" />
              <span>{secondsPerRep}s / rep</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSplit(null)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#16161D] hover:bg-slate-100 dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] text-xs font-semibold text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] transition-colors cursor-pointer"
            >
              Switch Plan
            </button>
          </div>
        </div>

        {/* Ready Briefing Card */}
        <div className="bg-[#f8fafc] dark:bg-[#16161D] rounded-3xl border border-slate-200 dark:border-[#24242E] p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#C6FF3D]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Overview Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-center font-mono">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase text-slate-500 dark:text-[#A1A1AA] block">Exercises</span>
              <span className="text-xl font-black text-slate-900 dark:text-[#F4F4F6]">5 Exercises</span>
              <span className="text-[10px] text-slate-500 dark:text-[#A1A1AA] block">Sequential</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase text-slate-500 dark:text-[#A1A1AA] block">Total Sets</span>
              <span className="text-xl font-black text-slate-900 dark:text-[#F4F4F6]">{totalWorkoutSets} Sets</span>
              <span className="text-[10px] text-slate-500 dark:text-[#A1A1AA] block">Prescribed</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase text-lime-700 dark:text-[#C6FF3D] block font-bold">Estimated Time</span>
              <span className="text-xl font-black text-lime-700 dark:text-[#C6FF3D]">{estimatedRoutineMinutes} mins</span>
              <span className="text-[10px] text-slate-500 dark:text-[#A1A1AA] block">Work + Rest</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase text-slate-500 dark:text-[#A1A1AA] block">Intensity Rating</span>
              <span className="text-xl font-black text-slate-900 dark:text-[#F4F4F6]">
                {workoutPlan.getMETValue().toFixed(1)} MET
              </span>
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold block">
                ~{Math.round(workoutPlan.getMETValue() * userWeightKg * (estimatedRoutineMinutes / 60))} kcal
              </span>
            </div>
          </div>

          {/* Big "Start Workout" CTA Button */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={handleStartWorkout}
              className="w-full py-4 sm:py-5 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] font-heading font-black text-xl sm:text-2xl uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-sm dark:shadow-xl dark:shadow-[#C6FF3D]/20 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Play className="w-6 h-6 fill-current stroke-[2.5]" />
              <span>Start Workout</span>
            </button>

            {skipWarmupForSession ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-xs">
                <span className="text-slate-600 dark:text-[#A1A1AA] flex items-center gap-1.5 font-mono text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Warm-up skipped for this session
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSessionState('warmup');
                      setWarmupSecondsRemaining(300);
                      setIsWarmupTimerRunning(false);
                      setCurrentWarmupMoveIndex(0);
                    }}
                    className="text-lime-700 dark:text-[#C6FF3D] hover:underline font-bold font-mono text-[11px] cursor-pointer"
                  >
                    View Warm-up
                  </button>
                  <span className="text-slate-300 dark:text-[#24242E]">·</span>
                  <button
                    type="button"
                    onClick={handleResetSkipChoice}
                    className="text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] font-mono text-[11px] cursor-pointer"
                  >
                    Re-enable
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-[#A1A1AA] font-mono">
                <Flame className="w-3.5 h-3.5 text-lime-700 dark:text-[#C6FF3D]" />
                <span>Starts with ~5-min warm-up ({warmUpRoutine.moves.length} simple moves)</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => {
                    setSessionState('warmup');
                    setWarmupSecondsRemaining(300);
                    setIsWarmupTimerRunning(false);
                    setCurrentWarmupMoveIndex(0);
                  }}
                  className="text-lime-700 dark:text-[#C6FF3D] hover:underline cursor-pointer"
                >
                  Preview
                </button>
              </div>
            )}
          </div>

          {/* Ordered 5-Exercise Routine List */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#24242E]">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
                Prescribed 5-Exercise Routine (Order of Execution)
              </h2>
              <span className="text-xs font-mono text-slate-500 dark:text-[#A1A1AA]">
                Pace: {secondsPerRep}s / rep
              </span>
            </div>

            <div className="space-y-3">
              {exercises.map((exercise, index) => {
                const sets = exercise.sets || exercise.defaultSets || 3;
                const reps = exercise.reps || exercise.defaultReps || 10;
                const rest = exercise.restSeconds || exercise.suggestedRestSeconds || 60;

                return (
                  <div
                    key={exercise.id || index}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-slate-300 dark:hover:border-[#383848]"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] text-slate-900 dark:text-[#C6FF3D] font-mono font-bold text-sm flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-lime-500/15 border border-lime-500/30 text-lime-800 dark:bg-[#C6FF3D]/10 dark:text-[#C6FF3D] dark:border-transparent font-bold">
                            {exercise.targetMuscle}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-[#A1A1AA]">
                            · {exercise.equipment}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F4F6]">
                          {exercise.name}
                        </h3>

                        {/* Beginner Form Cue Line (Requirement 1: Beginners get a short tip line for each exercise) */}
                        {isBeginner ? (
                          <div className="text-xs text-lime-800 dark:text-[#C6FF3D] font-mono flex items-center gap-1.5 pt-0.5">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Beginner Tip: {exercise.formTip || 'Maintain steady cadence and control the weight on every rep.'}
                            </span>
                          </div>
                        ) : (
                          exercise.formTip && (
                            <p className="text-xs text-slate-500 dark:text-[#A1A1AA] italic line-clamp-1">
                              Cue: {exercise.formTip}
                            </p>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 font-mono text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-[#24242E]/50">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-[#F4F4F6]">
                          {sets} sets × {reps} reps
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-[#A1A1AA]">
                          Rest: {rest}s
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#16161D] text-[10px] font-mono text-slate-600 dark:text-[#A1A1AA] border border-slate-200 dark:border-[#24242E]">
                        Pending
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pace Settings Modal */}
        {isPaceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#0B0B0F]/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#24242E] pb-3">
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-[#F4F4F6] uppercase">
                  Workout Pace Tempo
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPaceModalOpen(false)}
                  className="text-slate-500 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#A1A1AA]">
                Set the suggested time per repetition for work countdown rings (default is 4 seconds).
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleUpdateSecondsPerRep(sec)}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                      secondsPerRep === sec
                        ? 'bg-[#C6FF3D] text-[#0B0B0F] border-[#C6FF3D]'
                        : 'bg-slate-100 dark:bg-[#0B0B0F] text-slate-700 dark:text-[#A1A1AA] border-slate-200 dark:border-[#24242E]'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= SCENARIO B.2: WARM-UP SCREEN =================
  if (sessionState === 'warmup') {
    const warmupMinutes = Math.floor(warmupSecondsRemaining / 60);
    const warmupSeconds = warmupSecondsRemaining % 60;
    const formattedWarmupTime = `${warmupMinutes}:${String(warmupSeconds).padStart(2, '0')}`;
    const activeMove = warmUpRoutine.moves[currentWarmupMoveIndex] || warmUpRoutine.moves[0];

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#24242E]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsWarmupTimerRunning(false);
                setSessionState('ready');
              }}
              className="p-2.5 rounded-2xl bg-white dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] hover:border-slate-300 dark:hover:border-[#383848] transition-colors cursor-pointer"
              title="Back to workout overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-lime-500/10 border border-lime-500/30 dark:bg-[#C6FF3D]/10 dark:border-[#C6FF3D]/30 flex items-center justify-center text-lime-700 dark:text-[#C6FF3D] shrink-0">
              <Flame className="w-5 h-5 fill-lime-600 dark:fill-[#C6FF3D]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
                  {warmUpRoutine.title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-lime-500/10 border border-lime-500/30 dark:bg-[#C6FF3D]/10 dark:border-[#C6FF3D]/30 text-[10px] font-mono font-bold text-lime-700 dark:text-[#C6FF3D] uppercase">
                  ~5 Minutes
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] text-[10px] font-mono text-slate-600 dark:text-[#A1A1AA] uppercase">
                  {warmUpRoutine.moves.length} Moves
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-0.5">
                {warmUpRoutine.subtitle} · Loosen joints and prime muscles before lifting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkipWarmup}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#16161D] hover:bg-slate-100 dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] text-xs font-mono font-bold text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Skip warm-up and start workout now"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip warm-up</span>
            </button>
          </div>
        </div>

        {/* First Exercise Priming Notice Card (Required) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-[#16161D] border border-amber-200 dark:border-amber-500/30 flex items-start gap-3.5 shadow-sm dark:shadow-lg dark:shadow-amber-500/5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              Light Sets on First Exercise
            </span>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-[#F4F4F6] leading-relaxed">
              {warmUpRoutine.firstExerciseWarmupNote}
            </p>
          </div>
        </div>

        {/* Warm-up Controls & Timer Box */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] space-y-5 shadow-sm dark:shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA] block">
                  Warm-up Clock
                </span>
                <span className="text-3xl sm:text-4xl font-mono font-black text-lime-700 dark:text-[#C6FF3D] tracking-tight">
                  {formattedWarmupTime}
                </span>
              </div>
              {isWarmupTimerRunning && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePauseWarmupTimer}
                    className="p-3 rounded-2xl bg-slate-200 dark:bg-[#24242E] hover:bg-slate-300 dark:hover:bg-[#2E2E3C] text-slate-900 dark:text-[#F4F4F6] transition-colors cursor-pointer"
                    title={isWarmupTimerRunning ? 'Pause timer' : 'Resume timer'}
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetWarmupTimer}
                    className="p-3 rounded-2xl bg-slate-200 dark:bg-[#24242E] hover:bg-slate-300 dark:hover:bg-[#2E2E3C] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] transition-colors cursor-pointer"
                    title="Reset to 5:00"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {!isWarmupTimerRunning && warmupSecondsRemaining === 300 ? (
                <>
                  <button
                    type="button"
                    onClick={handleStartWarmupTimer}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] font-heading font-black text-lg uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/15 cursor-pointer active:scale-95"
                  >
                    <Flame className="w-5 h-5 fill-current" />
                    <span>Start warm-up</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipWarmup}
                    className="flex-1 sm:flex-none px-5 py-3.5 rounded-2xl bg-white dark:bg-[#0B0B0F] hover:bg-slate-100 dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] text-slate-800 dark:text-[#F4F4F6] font-heading font-bold text-base uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4 text-slate-500 dark:text-[#A1A1AA]" />
                    <span>Skip warm-up</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCompleteWarmup}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] font-heading font-black text-lg uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/15 cursor-pointer active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>I'm Ready — Start Workout</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipWarmup}
                    className="px-4 py-3.5 rounded-2xl bg-white dark:bg-[#0B0B0F] hover:bg-slate-100 dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] font-heading font-bold text-sm uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Skip warm-up
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Session Skip Preference Info */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#24242E] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-[#A1A1AA]">
            <p className="flex items-center gap-1.5 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-lime-700 dark:text-[#C6FF3D]" />
              "Skip warm-up" remembers your choice for this browser session only.
            </p>
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#71717A]">
              Focus: {warmUpRoutine.targetArea}
            </span>
          </div>
        </div>

        {/* 4-6 Warm-up Moves List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
              Warm-up Moves ({warmUpRoutine.moves.length})
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-[#A1A1AA]">
              Complete in order or at your own pace
            </span>
          </div>

          <div className="space-y-3">
            {warmUpRoutine.moves.map((move, index) => {
              const isChecked = !!completedWarmupMoves[move.id];
              const isCurrent = isWarmupTimerRunning && index === currentWarmupMoveIndex;

              return (
                <div
                  key={move.id}
                  onClick={() => handleToggleWarmupMove(move.id)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-slate-100/70 dark:bg-[#16161D]/60 border-lime-600/30 dark:border-[#C6FF3D]/30 opacity-80'
                      : isCurrent
                      ? 'bg-white dark:bg-[#16161D] border-lime-600 dark:border-[#C6FF3D] shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/10'
                      : 'bg-[#f8fafc] dark:bg-[#16161D] border-slate-200 dark:border-[#24242E] hover:border-slate-300 dark:hover:border-[#383848]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                          isChecked
                            ? 'bg-[#C6FF3D] border-[#C6FF3D] text-[#0B0B0F]'
                            : 'bg-white dark:bg-[#0B0B0F] border-slate-200 dark:border-[#24242E] text-lime-700 dark:text-[#C6FF3D]'
                        }`}
                      >
                        {isChecked ? <Check className="w-4 h-4 stroke-[3]" /> : `0${index + 1}`}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900 dark:text-[#F4F4F6]">{move.name}</h3>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-lime-500/15 border border-lime-500/30 text-lime-800 dark:bg-[#C6FF3D]/10 dark:text-[#C6FF3D] dark:border-transparent font-bold">
                            {move.targetMuscles}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A1A1AA] leading-relaxed">
                          {move.description}
                        </p>

                        {move.tip && (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 italic flex items-center gap-1.5 pt-0.5">
                            <span className="text-lime-700 dark:text-[#C6FF3D] font-bold not-italic">Tip:</span>{' '}
                            {move.tip}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-block px-3 py-1 rounded-xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-xs font-mono font-bold text-lime-700 dark:text-[#C6FF3D]">
                        {move.durationOrReps}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <p className="text-xs text-slate-600 dark:text-[#A1A1AA]">
            Finished your warm-up? Jump straight into your first working set.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkipWarmup}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#0B0B0F] hover:bg-slate-100 dark:hover:bg-[#24242E] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] text-xs font-bold font-mono transition-colors cursor-pointer border border-slate-200 dark:border-transparent"
            >
              Skip warm-up
            </button>
            <button
              type="button"
              onClick={handleCompleteWarmup}
              className="px-6 py-2.5 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] font-heading font-black text-sm uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/15 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Workout</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= SCENARIO C: GUIDED WORKOUT MODE =================
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ================= TOP HUD: STOPWATCH, CALORIES, PAUSE & CONTROLS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#24242E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-lime-500/10 border border-lime-500/30 text-lime-700 dark:bg-[#C6FF3D]/10 dark:border-[#C6FF3D]/30 dark:text-[#C6FF3D] flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
                {workoutPlan.name}
              </h1>
              {isPaused ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-[10px] font-mono text-amber-800 font-bold dark:bg-amber-950/60 dark:border-amber-500/40 dark:text-amber-400">
                  PAUSED
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-[10px] font-mono text-emerald-800 font-bold dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
                  GUIDED LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-0.5">
              Exercise {currentExerciseIndex + 1} of 5 · Set {currentSetIndex} of {currentExTotalSets}
            </p>
          </div>
        </div>

        {/* Global Controls: Audio, Pace, Pause, Quit */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume Button (Requirement 4) */}
          <button
            type="button"
            onClick={handleTogglePause}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isPaused
                ? 'bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] dark:shadow-[#C6FF3D]/15'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 dark:text-[#0B0B0F] shadow-amber-500/10'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !userPreferences.soundEnabled;
              updatePreferences({ soundEnabled: next });
              if (next && !sounds.muted) sounds.playTick();
            }}
            className="p-2 rounded-xl bg-[#f8fafc] hover:bg-slate-200 border border-slate-200 text-xs text-slate-600 dark:bg-[#16161D] dark:hover:bg-[#24242E] dark:border-[#24242E] dark:text-[#A1A1AA] transition-colors cursor-pointer"
            title={userPreferences.soundEnabled ? 'Mute audio cues' : 'Enable audio cues'}
            aria-label="Toggle sound"
          >
            {userPreferences.soundEnabled && !sounds.muted ? (
              <Volume2 className="w-4 h-4 text-lime-700 dark:text-[#C6FF3D]" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            )}
          </button>

          {/* Tempo Quick Setting */}
          <button
            type="button"
            onClick={() => setIsPaceModalOpen(true)}
            className="px-2.5 py-2 rounded-xl bg-[#f8fafc] hover:bg-slate-200 border border-slate-200 text-xs font-mono text-slate-600 dark:bg-[#16161D] dark:hover:bg-[#24242E] dark:border-[#24242E] dark:text-[#A1A1AA] transition-colors cursor-pointer"
            title="Adjust seconds per rep pace"
          >
            <Settings className="w-4 h-4 text-lime-700 dark:text-[#C6FF3D]" />
          </button>

          {/* Quit Workout Button (Requirement 4) */}
          <button
            type="button"
            onClick={() => setIsQuitModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            Quit
          </button>
        </div>
      </div>

      {/* ================= METRICS BAR: STOPWATCH & ENERGY ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] font-mono shadow-sm dark:shadow-none">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-slate-500 dark:text-[#A1A1AA]">
            <Clock className="w-3.5 h-3.5 text-lime-700 dark:text-[#C6FF3D]" />
            <span>Stopwatch</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F4F4F6] tabular-nums">
            {formatTime(stopwatchSeconds)}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-slate-500 dark:text-[#A1A1AA]">
            <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
            <span>Energy Burned</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F4F4F6] tabular-nums">
            {displayCalories} <span className="text-xs text-slate-500 dark:text-[#A1A1AA] font-normal">kcal</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] uppercase text-slate-500 dark:text-[#A1A1AA] block">Exercises Done</span>
          <div className="text-xl sm:text-2xl font-black text-lime-700 dark:text-[#C6FF3D] tabular-nums">
            {completedCount} / 5
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] uppercase text-slate-500 dark:text-[#A1A1AA] block">Overall Sets</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F4F4F6] tabular-nums">
            {totalCompletedSets} / {totalWorkoutSets}
          </div>
        </div>
      </div>

      {/* ================= DYNAMIC PROGRESS BAR (Requirement 5) ================= */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-600 dark:text-[#A1A1AA]">
            Workout Progress ({totalCompletedSets} of {totalWorkoutSets} sets completed)
          </span>
          <span className="text-lime-700 dark:text-[#C6FF3D] font-bold">{progressPercent}%</span>
        </div>
        <div className="h-2.5 bg-slate-200 dark:bg-[#0B0B0F] border border-slate-300 dark:border-[#24242E] rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-lime-600 dark:bg-[#C6FF3D] rounded-full transition-all duration-500 ease-out shadow-sm shadow-lime-600/30 dark:shadow-[#C6FF3D]/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ================= PAUSED NOTICE BANNER (Requirement 4) ================= */}
      {isPaused && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Pause className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Workout Session Paused</h4>
              <p className="text-xs text-amber-800 dark:text-amber-200/70">
                All timers (stopwatch, set countdown, and rest intervals) are frozen.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTogglePause}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 dark:text-[#0B0B0F] font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors shrink-0"
          >
            Resume Workout
          </button>
        </div>
      )}

      {/* ================= GUIDED VIEW: SINGLE ACTIVE EXERCISE (Requirement 2 & 3) ================= */}
      <div className="bg-[#f8fafc] dark:bg-[#16161D] rounded-3xl border border-slate-200 dark:border-[#24242E] p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-lime-500/5 dark:bg-[#C6FF3D]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Current Exercise Photo */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-[#24242E]">
          <ExerciseImage
            exerciseName={currentExercise.name}
            targetMuscle={currentExercise.targetMuscle}
            imageUrl={currentExercise.imageUrl}
            className="w-full aspect-[16/9]"
          />
        </div>

        {/* Top Badges & Exercise Identity */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
                Exercise {currentExerciseIndex + 1} of 5
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-lime-500/15 border border-lime-500/30 text-lime-800 dark:border-transparent dark:bg-[#C6FF3D]/10 dark:text-[#C6FF3D] text-xs font-mono font-bold uppercase">
                {currentExercise.targetMuscle}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
                {currentExercise.equipment}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* How to button available during the exercise (does not pause or reset any timer) */}
              <button
                type="button"
                onClick={() => setIsGuidePanelOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-[#0B0B0F] hover:bg-slate-100 dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] hover:border-lime-600 dark:hover:border-[#C6FF3D]/40 text-lime-700 dark:text-[#C6FF3D] text-xs font-mono transition-colors cursor-pointer"
                title="View how to do this exercise"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{isGuidePanelOpen ? 'Hide Guide' : 'How to'}</span>
              </button>

              {/* Set Indicator Pill */}
              <div className="px-3 py-1 rounded-xl bg-lime-500/15 border border-lime-500/30 text-lime-800 dark:bg-[#C6FF3D]/15 dark:border-[#C6FF3D]/30 dark:text-[#C6FF3D] text-xs font-mono font-bold">
                Set {currentSetIndex} of {currentExTotalSets}
              </div>
            </div>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
            {currentExercise.name}
          </h2>

          <div className="flex items-center gap-3 font-mono text-sm text-slate-600 dark:text-[#A1A1AA]">
            <span>Target: <strong className="text-slate-900 dark:text-[#F4F4F6]">{currentExReps} reps</strong></span>
            <span>·</span>
            <span>Rest interval: <strong className="text-slate-900 dark:text-[#F4F4F6]">{currentExercise.restSeconds || 60}s</strong></span>
          </div>
        </div>

        {/* Beginner-friendly Exercise Instruction Panel */}
        {isGuidePanelOpen && currentExercise && (
          <div className="animate-in fade-in duration-200">
            <ExerciseGuideView
              guide={getExerciseGuide(
                currentExercise.name,
                currentExercise.equipment,
                currentExercise.targetMuscle
              )}
              exerciseName={currentExercise.name}
              targetMuscle={currentExercise.targetMuscle}
              onClose={() => setIsGuidePanelOpen(false)}
              actionButton={
                currentSetIndex === 1 ? (
                  <button
                    type="button"
                    onClick={() => setIsGuidePanelOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d5ff6a] dark:text-[#0B0B0F] font-heading font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm dark:shadow-md dark:shadow-[#C6FF3D]/15"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Got it, start set 1</span>
                  </button>
                ) : undefined
              }
            />
          </div>
        )}

        {/* Progressive Overload Suggestion (Requirement 4) */}
        {overloadHint && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] flex items-start gap-3 shadow-sm">
            <div className="p-2 rounded-xl bg-lime-500/10 text-lime-700 border border-lime-500/30 dark:bg-[#C6FF3D]/10 dark:text-[#C6FF3D] dark:border-[#C6FF3D]/20 shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-lime-800 dark:text-[#C6FF3D] font-bold">
                  Progressive Overload Target
                </span>
                {overloadHint.badgeText && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-lime-500/15 text-lime-800 border border-lime-500/30 dark:bg-[#C6FF3D]/15 dark:text-[#C6FF3D] dark:border-[#C6FF3D]/30">
                    {overloadHint.badgeText}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-[#F4F4F6] leading-relaxed">
                {overloadHint.message}
              </p>
            </div>
          </div>
        )}

        {/* Active Personal Record Celebration Alert (Requirement 2) */}
        {activePRAlert && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-lime-100/70 via-amber-50 to-white dark:from-[#C6FF3D]/20 dark:via-amber-500/15 dark:to-[#16161D] border border-lime-500 dark:border-[#C6FF3D] flex items-center justify-between gap-3 animate-in fade-in duration-300 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-lime-500/20 text-lime-800 border border-lime-500/40 dark:bg-[#C6FF3D]/20 dark:text-[#C6FF3D] dark:border-[#C6FF3D]/40">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading text-sm font-black uppercase text-lime-800 dark:text-[#C6FF3D] tracking-wider block">
                  New Personal Record!
                </span>
                <p className="text-xs text-slate-800 dark:text-[#F4F4F6]">
                  {activePRAlert.exerciseName}: <strong className="text-slate-950 dark:text-white">{activePRAlert.weightKg} kg</strong> × {activePRAlert.reps} reps · Estimated 1RM: <strong className="text-lime-800 dark:text-[#C6FF3D]">{activePRAlert.est1RM} kg</strong>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-lime-600 text-white dark:bg-[#C6FF3D] dark:text-[#0B0B0F] uppercase">
              PR Set
            </span>
          </div>
        )}

        {/* Form Tip Card */}
        {currentExercise.formTip && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] flex items-start gap-3 shadow-sm">
            <Sparkles className="w-5 h-5 text-lime-700 dark:text-[#C6FF3D] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-lime-800 dark:text-[#C6FF3D] font-bold block">
                Form & Execution Cue
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-[#F4F4F6] leading-relaxed">
                {currentExercise.formTip}
              </p>
            </div>
          </div>
        )}

        {/* ================= DYNAMIC WORK / REST / GET READY PHASE ================= */}
        {phase === 'work' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#1c1c27] dark:to-[#16161D] border border-slate-200 dark:border-[#24242E] space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Circular Set Countdown Ring */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r={ringRadius}
                    className="text-slate-200 dark:text-[#24242E]"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={ringRadius}
                    className={`transition-all duration-1000 ease-linear ${
                      workRemaining === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-lime-600 dark:text-[#C6FF3D]'
                    }`}
                    strokeWidth="10"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={workStrokeOffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-3xl font-black text-slate-900 dark:text-[#F4F4F6] tabular-nums leading-none">
                    {workRemaining > 0 ? `${workRemaining}s` : '0s'}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-lime-700 dark:text-[#C6FF3D] mt-1 font-bold">
                    {workRemaining > 0 ? 'Work Phase' : 'Set Complete'}
                  </span>
                </div>
              </div>

              {/* Work Instructions & "I'm Done" Action */}
              <div className="flex-1 space-y-4 text-center sm:text-left">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-lime-800 dark:text-[#C6FF3D] font-bold">
                    Suggested Pace: {currentExReps} reps × {secondsPerRep}s = {workTotalDuration}s
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-[#F4F4F6] mt-0.5">
                    Execute Set {currentSetIndex} of {currentExTotalSets} with controlled tempo
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-1">
                    {workRemaining > 0
                      ? 'Confirm your weight and reps below, then press "I\'m done" when complete.'
                      : 'Countdown finished! Confirm your weight and reps, then press "I\'m done" to rest.'}
                  </p>
                </div>

                {/* Requirement 1 & 6: Per-Set Logging Inputs with Inline Validation */}
                <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">
                      Set {currentSetIndex} Data:
                    </span>
                    <span className="text-lime-700 dark:text-[#C6FF3D] font-bold">
                      Est. 1RM: {PersonalRecord.calculate1RM(currentSetWeight, currentSetReps)} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    {/* Weight (kg) */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-[#A1A1AA] mb-1">
                        Weight (kg) <span className="text-[10px] text-slate-400 dark:text-[#71717A]">(0-500)</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(0, currentSetWeight - 2.5);
                            setCurrentSetWeight(next);
                            const val = SetLogManager.validate(next, currentSetReps);
                            setWeightError(val.weightError || null);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-[#16161D] dark:hover:bg-[#24242E] text-xs font-mono font-bold text-slate-800 dark:text-[#F4F4F6] cursor-pointer transition-colors shadow-xs"
                        >
                          -2.5
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="500"
                          value={currentSetWeight}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCurrentSetWeight(val);
                            const res = SetLogManager.validate(val, currentSetReps);
                            setWeightError(res.weightError || null);
                          }}
                          className={`w-full px-2 py-2 bg-white dark:bg-[#16161D] border rounded-xl font-mono text-sm font-bold text-center text-slate-900 dark:text-[#F4F4F6] focus:outline-none transition-colors ${
                            weightError
                              ? 'border-red-500'
                              : 'border-slate-300 dark:border-[#24242E] focus:border-slate-500 dark:focus:border-[#C6FF3D]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.min(500, currentSetWeight + 2.5);
                            setCurrentSetWeight(next);
                            const val = SetLogManager.validate(next, currentSetReps);
                            setWeightError(val.weightError || null);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-[#16161D] dark:hover:bg-[#24242E] text-xs font-mono font-bold text-slate-800 dark:text-[#F4F4F6] cursor-pointer transition-colors shadow-xs"
                        >
                          +2.5
                        </button>
                      </div>
                      {weightError && (
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-medium block mt-1">
                          {weightError}
                        </span>
                      )}
                    </div>

                    {/* Reps */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-[#A1A1AA] mb-1">
                        Reps Done <span className="text-[10px] text-slate-400 dark:text-[#71717A]">(1-100)</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(1, currentSetReps - 1);
                            setCurrentSetReps(next);
                            const val = SetLogManager.validate(currentSetWeight, next);
                            setRepsError(val.repsError || null);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-[#16161D] dark:hover:bg-[#24242E] text-xs font-mono font-bold text-slate-800 dark:text-[#F4F4F6] cursor-pointer transition-colors shadow-xs"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={currentSetReps}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCurrentSetReps(val);
                            const res = SetLogManager.validate(currentSetWeight, val);
                            setRepsError(res.repsError || null);
                          }}
                          className={`w-full px-2 py-2 bg-white dark:bg-[#16161D] border rounded-xl font-mono text-sm font-bold text-center text-slate-900 dark:text-[#F4F4F6] focus:outline-none transition-colors ${
                            repsError
                              ? 'border-red-500'
                              : 'border-slate-300 dark:border-[#24242E] focus:border-slate-500 dark:focus:border-[#C6FF3D]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.min(100, currentSetReps + 1);
                            setCurrentSetReps(next);
                            const val = SetLogManager.validate(currentSetWeight, next);
                            setRepsError(val.repsError || null);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 dark:border-transparent dark:bg-[#16161D] dark:hover:bg-[#24242E] text-xs font-mono font-bold text-slate-800 dark:text-[#F4F4F6] cursor-pointer transition-colors shadow-xs"
                        >
                          +1
                        </button>
                      </div>
                      {repsError && (
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-medium block mt-1">
                          {repsError}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary "I'm Done" Button (Requirement 3) */}
                <button
                  type="button"
                  onClick={handleSetDone}
                  disabled={isPaused || !!weightError || !!repsError}
                  className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-heading font-black text-lg uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-sm ${
                    weightError || repsError
                      ? 'bg-slate-200 text-slate-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                      : workRemaining === 0
                      ? 'bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 ring-4 ring-slate-300/40 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] dark:shadow-xl dark:shadow-[#C6FF3D]/25 dark:ring-[#C6FF3D]/30 animate-pulse'
                      : 'bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] dark:shadow-xl dark:shadow-[#C6FF3D]/15'
                  } disabled:opacity-50`}
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>I'm Done (Log Set {currentSetIndex})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REST PHASE (Requirement 3) */}
        {phase === 'rest' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-[#16161D] dark:via-[#1e1e2d] dark:to-[#16161D] border border-slate-200 dark:border-[#C6FF3D]/40 space-y-6 animate-in fade-in duration-300 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Circular Rest Ring */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r={ringRadius}
                    className="text-slate-200 dark:text-[#24242E]"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={ringRadius}
                    className="text-lime-600 dark:text-[#C6FF3D] transition-all duration-1000 ease-linear"
                    strokeWidth="10"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={restStrokeOffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-3xl font-black text-slate-900 dark:text-[#F4F4F6] tabular-nums leading-none">
                    {restRemaining}s
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-lime-700 dark:text-[#C6FF3D] mt-1 font-bold">
                    Rest
                  </span>
                </div>
              </div>

              {/* Rest Details & Controls */}
              <div className="flex-1 space-y-4 text-center sm:text-left">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-lime-800 dark:text-[#C6FF3D] font-bold">
                    Active Recovery Interval
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-[#F4F4F6] mt-0.5">
                    Hydrate & prepare for the next effort
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-1">
                    Resting after Set {currentSetIndex}. Next set starts automatically with a 3-second ready cue.
                  </p>
                </div>

                {/* Logged Set Confirmation Card */}
                <div className="p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-500 dark:text-[#A1A1AA] uppercase block text-[10px]">Set {currentSetIndex} Logged</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-[#F4F4F6]">
                      {currentSetWeight} kg × {currentSetReps} reps
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 dark:text-[#A1A1AA] uppercase block text-[10px]">Est. 1RM</span>
                    <span className="text-sm font-bold text-lime-700 dark:text-[#C6FF3D]">
                      {PersonalRecord.calculate1RM(currentSetWeight, currentSetReps)} kg
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleAddRestTime(15)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800 dark:bg-[#0B0B0F] dark:hover:bg-[#24242E] dark:border-[#24242E] dark:text-[#F4F4F6] transition-colors cursor-pointer"
                  >
                    +15s Rest
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipRest}
                    className="px-5 py-2.5 rounded-xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#24242E] dark:hover:bg-[#2E2E3C] dark:text-[#F4F4F6] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FastForward className="w-4 h-4 text-slate-700 dark:text-[#C6FF3D]" />
                    <span>Skip Rest</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GET READY 3-2-1 PHASE (Requirement 3) */}
        {phase === 'get_ready' && (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B0B0F] border border-lime-500 dark:border-[#C6FF3D] text-center space-y-4 animate-in zoom-in-95 duration-200 shadow-sm">
            <span className="text-xs font-mono uppercase tracking-widest text-lime-700 dark:text-[#C6FF3D] font-bold">
              Next Set Starting
            </span>
            <div className="font-mono text-6xl font-black text-slate-900 dark:text-[#F4F4F6] animate-pulse">
              {getReadyRemaining}
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA]">
              Get in position and grip the bar.
            </p>
          </div>
        )}

        {/* Next Up Preview (Requirement 2) */}
        {nextUpPreview && (
          <div className="p-3.5 rounded-xl bg-[#f8fafc] dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-xs font-mono text-slate-600 dark:text-[#A1A1AA] flex items-center justify-between">
            <span className="text-lime-700 dark:text-[#C6FF3D] font-bold uppercase tracking-wider text-[11px]">
              {nextUpPreview}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">Upcoming</span>
          </div>
        )}

        {/* Guided Navigation Buttons: Previous Set & Skip Exercise (Requirement 4) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-[#24242E]">
          <button
            type="button"
            onClick={handlePreviousSet}
            disabled={currentExerciseIndex === 0 && currentSetIndex === 1}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:bg-[#0B0B0F] dark:hover:bg-[#24242E] dark:border-[#24242E] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F6] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Set</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkipExercise}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:bg-[#0B0B0F] dark:hover:bg-[#24242E] dark:border-[#24242E] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F6] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Skip Exercise</span>
              <SkipForward className="w-4 h-4 text-lime-700 dark:text-[#C6FF3D]" />
            </button>

            <button
              type="button"
              onClick={handleCompleteWorkout}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 dark:border-transparent dark:bg-[#24242E] dark:hover:bg-[#2E2E3C] dark:text-[#F4F4F6] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-lime-700 dark:text-[#C6FF3D]" />
              <span>Finish Early</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= COLLAPSIBLE OVERVIEW LIST (Requirement 7) ================= */}
      <div className="bg-[#f8fafc] dark:bg-[#16161D] rounded-3xl border border-slate-200 dark:border-[#24242E] overflow-hidden transition-all duration-300 shadow-sm">
        <button
          type="button"
          onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1a1a24] transition-colors"
          aria-expanded={isOverviewExpanded}
        >
          <div className="flex items-center gap-3">
            <Dumbbell className="w-5 h-5 text-lime-700 dark:text-[#C6FF3D]" />
            <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
              Routine Overview ({exercises.length} Exercises)
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-[#A1A1AA]">
              · {completedCount} / 5 completed
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
            <span>{isOverviewExpanded ? 'Hide' : 'Show'}</span>
            {isOverviewExpanded ? (
              <ChevronUp className="w-4 h-4 text-lime-700 dark:text-[#C6FF3D]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-lime-700 dark:text-[#C6FF3D]" />
            )}
          </div>
        </button>

        {isOverviewExpanded && (
          <div className="p-4 sm:p-5 pt-0 space-y-2.5 border-t border-slate-200 dark:border-[#24242E]/60 animate-in fade-in duration-200">
            {exercises.map((exercise, idx) => {
              const setsRequired = exercise.sets || exercise.defaultSets || 3;
              const setsDone = completedSetsByExercise[idx] || 0;
              const isExComplete = setsDone >= setsRequired;
              const isCurrent = idx === currentExerciseIndex;

              return (
                <div
                  key={exercise.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-white border-2 border-lime-500 shadow-sm dark:bg-[#1c1c27] dark:border-[#C6FF3D]/50 dark:shadow-md dark:shadow-[#C6FF3D]/5'
                      : isExComplete
                      ? 'bg-slate-100/70 border-slate-200 text-slate-500 dark:bg-[#0B0B0F]/60 dark:border-emerald-900/40 dark:text-[#A1A1AA]'
                      : 'bg-white border-slate-200 dark:bg-[#0B0B0F] dark:border-[#24242E]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isExComplete
                          ? 'bg-[#cbd5e1] text-slate-900 dark:bg-[#C6FF3D] dark:text-[#0B0B0F]'
                          : isCurrent
                          ? 'bg-lime-500/15 text-lime-800 border border-lime-500/40 dark:bg-[#C6FF3D]/10 dark:text-[#C6FF3D] dark:border-[#C6FF3D]/40'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#16161D] dark:text-[#A1A1AA] dark:border-[#24242E]'
                      }`}
                    >
                      {isExComplete ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </div>

                    <ExerciseImage
                      exerciseName={exercise.name}
                      targetMuscle={exercise.targetMuscle}
                      imageUrl={exercise.imageUrl}
                      className="w-14 h-14 rounded-xl shrink-0 border border-slate-200 dark:border-[#24242E]"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isExComplete
                              ? 'line-through text-slate-400 dark:text-[#A1A1AA]'
                              : isCurrent
                              ? 'text-slate-900 dark:text-[#F4F4F6]'
                              : 'text-slate-900 dark:text-[#F4F4F6]'
                          }`}
                        >
                          {exercise.name}
                        </span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-lime-700 dark:text-[#C6FF3D]">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-[#C6FF3D] animate-ping" />
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-[#A1A1AA]">
                        {exercise.targetMuscle} · {setsRequired} sets × {exercise.reps || 10} reps
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono">
                    <span className="text-slate-500 dark:text-[#A1A1AA]">
                      {setsDone} / {setsRequired} sets
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold ${
                        isExComplete
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40'
                          : isCurrent
                          ? 'bg-lime-500/15 text-lime-800 border border-lime-500/30 dark:bg-[#C6FF3D]/10 dark:text-[#C6FF3D] dark:border-[#C6FF3D]/30'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#16161D] dark:text-[#A1A1AA] dark:border-[#24242E]'
                      }`}
                    >
                      {isExComplete
                        ? 'Completed'
                        : isCurrent
                        ? `Set ${currentSetIndex}/${setsRequired}`
                        : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= FINISH AND SAVE SCREEN (Requirement 6) ================= */}
      {sessionState === 'finished' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#0B0B0F]/85 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden space-y-5 p-6 sm:p-8">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-[#24242E] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-lime-500/10 border border-lime-500/30 dark:bg-[#C6FF3D]/10 dark:border-[#C6FF3D]/30 flex items-center justify-center text-lime-700 dark:text-[#C6FF3D] shrink-0">
                  <Trophy className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
                    Workout Complete!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-0.5">
                    Save performance metrics to your workout history log.
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Metrics Summary */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-center font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-slate-500 dark:text-[#A1A1AA] block">Duration</span>
                <span className="text-base font-black text-slate-900 dark:text-[#F4F4F6] tabular-nums">
                  {elapsedMinutes}m
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#A1A1AA] block">
                  {formatTime(stopwatchSeconds)}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-slate-500 dark:text-[#A1A1AA] block">Calories</span>
                <span className="text-base font-black text-lime-700 dark:text-[#C6FF3D] tabular-nums">
                  {displayCalories}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#A1A1AA] block">kcal burned</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-slate-500 dark:text-[#A1A1AA] block">Sets Done</span>
                <span className="text-base font-black text-slate-900 dark:text-[#F4F4F6] tabular-nums">
                  {totalCompletedSets} / {totalWorkoutSets}
                </span>
                <span className="text-[10px] text-lime-700 dark:text-[#C6FF3D] font-bold block">
                  {completedCount} of 5 done
                </span>
              </div>
            </div>

            {/* Session Notes */}
            <div className="space-y-1.5">
              <label
                htmlFor="session-notes-input"
                className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]"
              >
                Session Notes (Optional)
              </label>
              <textarea
                id="session-notes-input"
                rows={3}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Felt strong on compound sets, sustained cadence, notes for next session..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] focus:border-[#C6FF3D] text-xs text-slate-900 dark:text-[#F4F4F6] outline-none transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-zinc-600"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-[#24242E]">
              <button
                type="button"
                onClick={() => setSessionState('guided')}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-[#24242E] hover:bg-slate-300 dark:hover:bg-[#2E2E3C] text-slate-900 dark:text-[#F4F4F6] text-xs font-semibold cursor-pointer transition-colors"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={handleSaveWorkout}
                className="px-6 py-2.5 rounded-xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] text-xs font-bold font-heading uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/15"
              >
                <Save className="w-4 h-4" />
                <span>Save to History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= QUIT CONFIRMATION MODAL (Requirement 4 & 9) ================= */}
      <ConfirmModal
        isOpen={isQuitModalOpen}
        onClose={() => setIsQuitModalOpen(false)}
        onConfirm={handleConfirmQuit}
        title="Quit Workout Session?"
        description="Are you sure you want to quit? Your active session progress, timer, and completed sets will be discarded."
        confirmLabel="Quit & Discard"
        isDestructive={true}
      />

      {/* Pace Settings Modal */}
      {isPaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#0B0B0F]/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#24242E] pb-3">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-[#F4F4F6] uppercase">
                Workout Pace Tempo
              </h3>
              <button
                type="button"
                onClick={() => setIsPaceModalOpen(false)}
                className="text-slate-500 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA]">
              Set the suggested time per repetition for work countdown rings (default is 4 seconds).
            </p>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleUpdateSecondsPerRep(sec)}
                  className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                    secondsPerRep === sec
                      ? 'bg-[#C6FF3D] text-[#0B0B0F] border-[#C6FF3D]'
                      : 'bg-slate-100 dark:bg-[#0B0B0F] text-slate-700 dark:text-[#A1A1AA] border-slate-200 dark:border-[#24242E]'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
