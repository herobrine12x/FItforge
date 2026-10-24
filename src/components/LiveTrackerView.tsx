import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Save,
  Square,
  Zap,
} from 'lucide-react';
import { MemberProfile } from '../models/MemberProfile';
import { RecordManager } from '../models/RecordManager';
import {
  ExperienceLevel,
  FitnessGoal,
  SplitType,
  WorkoutExerciseLog,
} from '../models/types';
import { User } from '../models/User';
import { WorkoutPlanFactory } from '../models/WorkoutPlanFactory';
import { sounds } from '../utils/audio';

interface LiveTrackerViewProps {
  currentUser: User | null;
  currentProfile: MemberProfile | null;
  recordManager: RecordManager;
  initialSplit?: SplitType;
  onWorkoutSaved: () => void;
  onActiveStateChange?: (isActive: boolean) => void;
}

export const LiveTrackerView: React.FC<LiveTrackerViewProps> = ({
  currentUser,
  currentProfile,
  recordManager,
  initialSplit = 'push',
  onWorkoutSaved,
  onActiveStateChange,
}) => {
  const [splitType, setSplitType] = useState<SplitType>(initialSplit);
  const [experience] = useState<ExperienceLevel>(
    currentProfile?.experienceLevel || 'intermediate'
  );
  const [goal] = useState<FitnessGoal>(currentProfile?.fitnessGoal || 'muscle_gain');

  const [exercisesLog, setExercisesLog] = useState<WorkoutExerciseLog[]>([]);

  // Stopwatch state
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rest Countdown Timer state
  const [restDuration, setRestDuration] = useState(60);
  const [restRemaining, setRestRemaining] = useState(0);
  const [isRestActive, setIsRestActive] = useState(false);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Workout rating & notes
  const [workoutRating, setWorkoutRating] = useState(5);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initializeRoutine = (split: SplitType, exp: ExperienceLevel, g: FitnessGoal) => {
    const plan = WorkoutPlanFactory.create(split, exp, g);
    const routine = plan.generateRoutine();
    const setsPerEx = plan.getRecommendedSets();
    const repsPerEx = plan.getRecommendedReps();

    const logs: WorkoutExerciseLog[] = routine.map((ex) => ({
      exercise: ex,
      sets: Array.from({ length: setsPerEx }).map((_, idx) => ({
        setNumber: idx + 1,
        targetReps: repsPerEx,
        actualReps: repsPerEx,
        targetWeightKg: exp === 'beginner' ? 20 : exp === 'intermediate' ? 40 : 60,
        actualWeightKg: exp === 'beginner' ? 20 : exp === 'intermediate' ? 40 : 60,
        completed: false,
      })),
    }));

    setExercisesLog(logs);
    setRestDuration(plan.getRecommendedRestSeconds());
  };

  useEffect(() => {
    initializeRoutine(splitType, experience, goal);
  }, [splitType, experience, goal]);

  useEffect(() => {
    if (onActiveStateChange) {
      onActiveStateChange(isStopwatchRunning || stopwatchSeconds > 0);
    }
  }, [isStopwatchRunning, stopwatchSeconds, onActiveStateChange]);

  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning]);

  useEffect(() => {
    if (isRestActive && restRemaining > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            sounds.playCountdownBeep(true);
            setIsRestActive(false);
            return 0;
          }
          if (prev <= 4) {
            sounds.playCountdownBeep(false);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isRestActive, restRemaining]);

  const toggleStopwatch = () => {
    sounds.playTick();
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const resetStopwatch = () => {
    sounds.playTick();
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);
  };

  const startRestTimer = (seconds: number) => {
    sounds.playTick();
    setRestDuration(seconds);
    setRestRemaining(seconds);
    setIsRestActive(true);
  };

  const cancelRestTimer = () => {
    setIsRestActive(false);
    setRestRemaining(0);
  };

  const toggleSetCompleted = (exIndex: number, setIndex: number) => {
    sounds.playTick();

    if (!isStopwatchRunning && stopwatchSeconds === 0) {
      setIsStopwatchRunning(true);
    }

    setExercisesLog((prev) => {
      const cloned = [...prev];
      const targetEx = { ...cloned[exIndex] };
      const targetSets = [...targetEx.sets];
      const wasCompleted = targetSets[setIndex].completed;
      targetSets[setIndex] = {
        ...targetSets[setIndex],
        completed: !wasCompleted,
      };
      targetEx.sets = targetSets;
      cloned[exIndex] = targetEx;

      if (!wasCompleted) {
        startRestTimer(targetEx.exercise.suggestedRestSeconds || restDuration);
      }

      return cloned;
    });
  };

  const updateSetWeight = (exIndex: number, setIndex: number, weightKg: number) => {
    setExercisesLog((prev) => {
      const cloned = [...prev];
      const targetEx = { ...cloned[exIndex] };
      const targetSets = [...targetEx.sets];
      targetSets[setIndex] = {
        ...targetSets[setIndex],
        actualWeightKg: Math.max(0, weightKg),
      };
      targetEx.sets = targetSets;
      cloned[exIndex] = targetEx;
      return cloned;
    });
  };

  const updateSetReps = (exIndex: number, setIndex: number, reps: number) => {
    setExercisesLog((prev) => {
      const cloned = [...prev];
      const targetEx = { ...cloned[exIndex] };
      const targetSets = [...targetEx.sets];
      targetSets[setIndex] = {
        ...targetSets[setIndex],
        actualReps: Math.max(0, reps),
      };
      targetEx.sets = targetSets;
      cloned[exIndex] = targetEx;
      return cloned;
    });
  };

  const totalSets = exercisesLog.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercisesLog.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const activePlan = WorkoutPlanFactory.create(splitType, experience, goal);
  const minutesElapsed = Math.max(1, Math.round(stopwatchSeconds / 60));
  const estimatedCalories = activePlan.calculateEstimatedCalories(
    minutesElapsed,
    currentProfile?.weightKg || 70
  );

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishWorkout = () => {
    sounds.playFanfare();
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // fallback
    }
    setIsFinishModalOpen(true);
  };

  const handleSaveToDatabase = () => {
    if (!currentUser) return;
    const duration = Math.max(1, Math.round(stopwatchSeconds / 60));

    const titleMap: Record<SplitType, string> = {
      push: 'Push Session (Chest, Shoulders, Triceps)',
      pull: 'Pull Session (Back, Biceps, Delts)',
      legs_core: 'Legs & Core Session',
      full_body: 'Full Body Synergy Session',
    };

    recordManager.addRecord({
      userId: currentUser.id,
      date: new Date().toISOString(),
      title: titleMap[splitType] || 'FitForge Workout Session',
      splitType,
      durationMinutes: duration,
      caloriesBurned: estimatedCalories,
      exercises: exercisesLog,
      rating: workoutRating,
      notes: sessionNotes || `Completed ${completedSets} of ${totalSets} prescribed sets.`,
    });

    setSaveSuccess(true);
    setIsStopwatchRunning(false);

    setTimeout(() => {
      setSaveSuccess(false);
      setIsFinishModalOpen(false);
      onWorkoutSaved();
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Precision Instrument HUD: Stopwatch, Rest Countdown & Progress Bar */}
      <div className="border border-gray-800 rounded-lg bg-gray-950/95 sticky top-20 z-30 backdrop-blur-md overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Stopwatch */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded border border-gray-800 bg-gray-900 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">
                Active Stopwatch {isStopwatchRunning && '· RUNNING'}
              </div>
              <div className="text-3xl font-mono font-bold tabular-nums text-white tracking-tight">
                {formatTime(stopwatchSeconds)}
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={toggleStopwatch}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  isStopwatchRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-gray-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-gray-950'
                }`}
                aria-label={isStopwatchRunning ? 'Pause Stopwatch' : 'Start Stopwatch'}
              >
                {isStopwatchRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-gray-950" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-gray-950" />
                    <span>Start</span>
                  </>
                )}
              </button>
              <button
                onClick={resetStopwatch}
                className="p-1.5 rounded border border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Reset stopwatch"
                aria-label="Reset Stopwatch"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Rest Countdown Timer */}
          <div className="flex items-center gap-3 border-l md:border-r border-gray-800 md:px-6">
            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400">
                Rest Timer
              </div>
              <div className="text-xl font-mono font-bold tabular-nums text-cyan-400">
                {isRestActive ? `${restRemaining}s` : 'Ready'}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[30, 60, 90].map((s) => (
                <button
                  key={s}
                  onClick={() => startRestTimer(s)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer border ${
                    isRestActive && restDuration === s
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                      : 'border-gray-800 bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  {s}s
                </button>
              ))}
              {isRestActive && (
                <button
                  onClick={cancelRestTimer}
                  className="p-1 rounded border border-red-800/80 bg-red-950/40 text-red-400 hover:bg-red-900/40 transition-colors cursor-pointer"
                  title="Cancel rest"
                  aria-label="Cancel rest"
                >
                  <Square className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Calorie & Finish CTA */}
          <div className="flex items-center gap-5 justify-between md:justify-end">
            <div className="text-right font-mono">
              <span className="text-[10px] uppercase text-gray-400 block">Est. Calorie Burn</span>
              <span className="text-base font-bold text-white tabular-nums">
                {estimatedCalories} kcal
              </span>
            </div>

            <button
              onClick={handleFinishWorkout}
              className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Finish & Log</span>
            </button>
          </div>
        </div>

        {/* Dynamic Linear Progress Bar */}
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1">
            <span>
              Session Progress: {completedSets} / {totalSets} Sets Completed
            </span>
            <span className="text-emerald-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-900 rounded-sm overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Split Switcher */}
      <div className="flex items-center justify-between gap-3 text-xs border border-gray-800 rounded-md bg-gray-900/40 p-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-gray-400 uppercase text-[11px]">Training Split:</span>
          <div className="flex items-center gap-1">
            {(['push', 'pull', 'legs_core', 'full_body'] as SplitType[]).map((st) => (
              <button
                key={st}
                onClick={() => setSplitType(st)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                  splitType === st
                    ? 'bg-gray-800 text-emerald-400 font-semibold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="text-[11px] text-gray-400 hidden sm:block">
          Checking a set automatically starts the rest countdown timer.
        </div>
      </div>

      {/* 5-Exercise Checklist Table */}
      <div className="space-y-4">
        {exercisesLog.map((exLog, exIdx) => (
          <div
            key={exLog.exercise.id}
            className="border border-gray-800 rounded-lg bg-gray-900/40 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-gray-950 border border-gray-800 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                  {exIdx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">{exLog.exercise.name}</h4>
                  <div className="text-xs text-gray-400 mt-0.5">
                    <span className="text-emerald-400">{exLog.exercise.targetMuscle}</span>
                    <span className="text-gray-600"> · </span>
                    <span>{exLog.exercise.equipment}</span>
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-mono text-gray-400">
                Rest: {exLog.exercise.suggestedRestSeconds}s
              </span>
            </div>

            {/* Sets Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-mono text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="py-2 font-medium w-16">Set</th>
                    <th className="py-2 font-medium">Load (kg)</th>
                    <th className="py-2 font-medium">Reps</th>
                    <th className="py-2 font-medium text-right">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {exLog.sets.map((set, setIdx) => (
                    <tr
                      key={set.setNumber}
                      className={set.completed ? 'bg-emerald-950/20' : undefined}
                    >
                      <td className="py-2 font-mono font-medium text-gray-400">
                        Set {set.setNumber}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1 font-mono">
                          <input
                            type="number"
                            min="0"
                            step="2.5"
                            value={set.actualWeightKg}
                            onChange={(e) =>
                              updateSetWeight(exIdx, setIdx, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-2 py-1 bg-gray-950 border border-gray-800 rounded text-center text-xs text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                          />
                          <span className="text-gray-400 text-[10px]">kg</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1 font-mono">
                          <input
                            type="number"
                            min="1"
                            value={set.actualReps}
                            onChange={(e) =>
                              updateSetReps(exIdx, setIdx, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-14 px-2 py-1 bg-gray-950 border border-gray-800 rounded text-center text-xs text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                          />
                          <span className="text-gray-400 text-[10px]">reps</span>
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSetCompleted(exIdx, setIdx)}
                          className={`px-3 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                            set.completed
                              ? 'bg-emerald-500 text-gray-950'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{set.completed ? 'Done' : 'Check'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Save Session Dialog */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white">Workout Session Complete</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Commit exercise results to relational database
              </p>
            </div>

            {saveSuccess ? (
              <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-center text-xs font-medium">
                Session persisted to database successfully!
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center border border-gray-800 p-3 rounded bg-gray-950/40 font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block">Duration</span>
                    <span className="text-sm font-bold text-white">
                      {Math.max(1, Math.round(stopwatchSeconds / 60))}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block">Calories</span>
                    <span className="text-sm font-bold text-white">
                      {estimatedCalories}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block">Sets</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {completedSets} / {totalSets}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                    Athlete Rating (1-5)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setWorkoutRating(star)}
                        className={`text-lg cursor-pointer ${
                          star <= workoutRating ? 'text-amber-400' : 'text-gray-700'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-mono text-gray-400 ml-2">
                      ({workoutRating}/5)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                    Athlete Session Notes
                  </label>
                  <textarea
                    rows={3}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Record comments, weights, or physical observations..."
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsFinishModalOpen(false)}
                    className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium cursor-pointer"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToDatabase}
                    className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Database</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
