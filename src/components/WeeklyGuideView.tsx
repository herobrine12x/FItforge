import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Edit3,
  Layers,
  Move,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ExerciseLibrary } from '../models/ExerciseLibrary';
import { RecordManager } from '../models/RecordManager';
import {
  ALL_WEEKDAYS,
  checkBackToBackDays,
  ScheduleManager,
  WEEKDAY_FULL_NAMES,
  WEEKDAY_LABELS,
} from '../models/ScheduleManager';
import {
  formatLocalDateString,
  getTodayDateString,
  ScheduledWorkout,
} from '../models/ScheduledWorkout';
import {
  EquipmentType,
  ICustomRoutineData,
  IScheduledWorkoutData,
  IWeeklyDaySchedule,
  IWeeklyScheduleData,
  ScheduleRepeat,
  WeekdayKey,
} from '../models/types';
import { WorkoutPlanFactory } from '../models/WorkoutPlanFactory';
import { ConfirmModal } from './ConfirmModal';

interface WeeklyGuideViewProps {
  onStartRoutine?: (splitType: string, customRoutineId?: string) => void;
}

const DEFAULT_SPLIT_OPTIONS: { id: string; name: string; targetMuscle: string }[] = [
  { id: 'push', name: 'Push Split', targetMuscle: 'Chest, Shoulders & Triceps' },
  { id: 'pull', name: 'Pull Split', targetMuscle: 'Back, Rear Delts & Biceps' },
  { id: 'legs_core', name: 'Legs & Core', targetMuscle: 'Quads, Hamstrings & Core' },
  { id: 'full_body', name: 'Full Body', targetMuscle: 'Compound Synergy' },
  { id: 'upper_body', name: 'Upper Body', targetMuscle: 'Upper Torso & Arms' },
  { id: 'home_bodyweight', name: 'Home Bodyweight', targetMuscle: 'Calisthenics & Core' },
  { id: 'cardio_hiit', name: 'Cardio HIIT', targetMuscle: 'Metabolic Conditioning' },
];

export const WeeklyGuideView: React.FC<WeeklyGuideViewProps> = ({ onStartRoutine }) => {
  const { currentUser, currentProfile } = useAuth();
  const { success: showToastSuccess, error: showToastError, info: showToastInfo } = useToast();
  const navigate = useNavigate();

  const [scheduleManager] = useState(() => new ScheduleManager());
  const [recordManager] = useState(() => new RecordManager());

  const userId = currentUser?.id || 'demo_user';
  const todayDateStr = getTodayDateString();

  // Active view toggle: 'week' or 'month'
  const [activeView, setActiveView] = useState<'week' | 'month'>('week');

  // Weekly schedule state (Mon to Sun)
  const [weeklySchedule, setWeeklySchedule] = useState<IWeeklyScheduleData>(() =>
    scheduleManager.getWeeklySchedule(userId)
  );

  // Scheduled specific date workouts
  const [scheduledList, setScheduledList] = useState<ScheduledWorkout[]>([]);

  // Custom routines ("My Routines")
  const [customRoutines, setCustomRoutines] = useState<ICustomRoutineData[]>([]);

  // Month calendar state
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayDateStr);

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isCreateRoutineModalOpen, setIsCreateRoutineModalOpen] = useState(false);
  const [activeDayToModify, setActiveDayToModify] = useState<WeekdayKey | null>(null);

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<ScheduledWorkout | null>(null);

  // Editing existing scheduled workout
  const [editingScheduleItem, setEditingScheduleItem] = useState<ScheduledWorkout | null>(null);

  // Form states for Schedule a Workout Modal
  const [formRoutineId, setFormRoutineId] = useState<string>('push');
  const [formDate, setFormDate] = useState<string>(todayDateStr);
  const [formTime, setFormTime] = useState<string>('');
  const [formRepeat, setFormRepeat] = useState<ScheduleRepeat>('never');
  const [formNotes, setFormNotes] = useState<string>('');
  const [scheduleFormError, setScheduleFormError] = useState<string>('');

  // Form states for Create Custom Routine Modal
  const [newRoutineName, setNewRoutineName] = useState<string>('');
  const [newRoutineTarget, setNewRoutineTarget] = useState<string>('');

  // Synchronize on load and when records or user change
  const refreshData = () => {
    if (!currentUser) return;
    const userRecords = recordManager.readAll(currentUser.id);
    const updatedScheduled = scheduleManager.checkAndUpdateMissedWorkouts(currentUser.id, userRecords);
    setScheduledList(updatedScheduled);
    setWeeklySchedule(scheduleManager.getWeeklySchedule(currentUser.id));
    setCustomRoutines(scheduleManager.getCustomRoutines(currentUser.id));
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  // Back-to-back training days check (Requirement 1)
  const backToBackInfo = useMemo(() => {
    return checkBackToBackDays(weeklySchedule.selectedDays);
  }, [weeklySchedule.selectedDays]);

  // 1. Toggle Weekday chip (Mon to Sun)
  const handleToggleWeekday = (day: WeekdayKey) => {
    const isCurrentlySelected = weeklySchedule.selectedDays.includes(day);
    let updatedDays: WeekdayKey[];

    if (isCurrentlySelected) {
      // Must keep at least 1 day
      if (weeklySchedule.selectedDays.length <= 1) {
        showToastInfo('You must keep at least 1 active training day.');
        return;
      }
      updatedDays = weeklySchedule.selectedDays.filter((d) => d !== day);
    } else {
      updatedDays = [...weeklySchedule.selectedDays, day];
      // Keep in order Mon -> Sun
      updatedDays.sort((a, b) => ALL_WEEKDAYS.indexOf(a) - ALL_WEEKDAYS.indexOf(b));
    }

    const updated = scheduleManager.updateSelectedWeekdays(userId, updatedDays);
    setWeeklySchedule(updated);
    showToastSuccess(`Training schedule updated: ${updatedDays.length} days/week.`);
  };

  // 2. Open Change Routine Modal for a day
  const handleOpenChangeRoutine = (day: WeekdayKey) => {
    setActiveDayToModify(day);
    setIsChangeModalOpen(true);
  };

  const handleConfirmChangeRoutine = (routineId: string, routineName: string, targetMuscle: string) => {
    if (!activeDayToModify) return;
    const updated = scheduleManager.changeDayRoutine(
      userId,
      activeDayToModify,
      routineId,
      routineName,
      targetMuscle
    );
    setWeeklySchedule(updated);
    setIsChangeModalOpen(false);
    showToastSuccess(`${WEEKDAY_FULL_NAMES[activeDayToModify]} changed to ${routineName}.`);
  };

  // 3. Open Move Routine Modal for a day
  const handleOpenMoveRoutine = (day: WeekdayKey) => {
    setActiveDayToModify(day);
    setIsMoveModalOpen(true);
  };

  const handleConfirmMoveRoutine = (targetDay: WeekdayKey) => {
    if (!activeDayToModify || activeDayToModify === targetDay) {
      setIsMoveModalOpen(false);
      return;
    }
    const updated = scheduleManager.moveOrSwapDay(userId, activeDayToModify, targetDay);
    setWeeklySchedule(updated);
    setIsMoveModalOpen(false);
    showToastSuccess(
      `Moved ${WEEKDAY_FULL_NAMES[activeDayToModify]} routine to ${WEEKDAY_FULL_NAMES[targetDay]}.`
    );
  };

  // 4. Start Workout from a Day Card
  const handleLaunchWorkout = (routineId: string) => {
    if (routineId === 'rest') return;

    if (onStartRoutine) {
      onStartRoutine(routineId);
      return;
    }

    // Default navigation to workout
    try {
      localStorage.setItem('fitforge_active_split', routineId);
    } catch {
      // safe
    }
    navigate('/workout', {
      state: { splitType: routineId },
    });
  };

  // 5. Open Schedule a Workout Modal (for specific dates)
  const handleOpenScheduleModal = (preselectedDate?: string, itemToEdit?: ScheduledWorkout) => {
    if (itemToEdit) {
      setEditingScheduleItem(itemToEdit);
      setFormRoutineId(itemToEdit.routineId);
      setFormDate(itemToEdit.date);
      setFormTime(itemToEdit.time);
      setFormRepeat(itemToEdit.repeat);
      setFormNotes(itemToEdit.notes);
    } else {
      setEditingScheduleItem(null);
      setFormRoutineId('push');
      setFormDate(preselectedDate || todayDateStr);
      setFormTime('');
      setFormRepeat('never');
      setFormNotes('');
    }
    setScheduleFormError('');
    setIsScheduleModalOpen(true);
  };

  // 6. Submit Schedule a Workout Form (Requirement 3 & 4)
  const handleSubmitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleFormError('');

    if (!formDate) {
      setScheduleFormError('Please select a valid date.');
      return;
    }

    // Find routine info
    const splitFound = DEFAULT_SPLIT_OPTIONS.find((s) => s.id === formRoutineId);
    const customFound = customRoutines.find((c) => c.id === formRoutineId);
    const routineName = splitFound?.name || customFound?.name || ScheduledWorkout.resolveRoutineName(formRoutineId);
    const targetMuscle = splitFound?.targetMuscle || customFound?.targetMuscle || 'General Conditioning';

    if (editingScheduleItem) {
      // Edit existing
      const res = scheduleManager.updateScheduledWorkout(editingScheduleItem.id, {
        routineId: formRoutineId,
        routineName,
        targetMuscle,
        date: formDate,
        time: formTime,
        repeat: formRepeat,
        notes: formNotes,
      });

      if (res.success) {
        showToastSuccess(`Workout on ${formDate} updated successfully.`);
        setIsScheduleModalOpen(false);
        refreshData();
      } else {
        setScheduleFormError(res.error || 'Failed to update schedule.');
      }
    } else {
      // Create new (enforces date not in the past)
      const res = scheduleManager.addScheduledWorkout(
        userId,
        formRoutineId,
        formDate,
        formTime,
        formRepeat,
        {
          routineName,
          targetMuscle,
          notes: formNotes,
        }
      );

      if (res.success) {
        showToastSuccess(`Workout scheduled for ${formDate}!`);
        setIsScheduleModalOpen(false);
        refreshData();
      } else {
        setScheduleFormError(res.error || 'Failed to schedule workout.');
      }
    }
  };

  // 7. Delete Scheduled Workout
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const res = scheduleManager.deleteScheduledWorkout(itemToDelete.id);
    if (res.success) {
      showToastSuccess('Scheduled workout removed.');
      setItemToDelete(null);
      refreshData();
    } else {
      showToastError(res.error || 'Failed to delete workout.');
    }
  };

  // 8. Reschedule a missed workout (Requirement 5)
  const handleRescheduleMissed = (workoutId: string) => {
    const res = scheduleManager.rescheduleToNextAvailableDay(workoutId, userId);
    if (res.success) {
      showToastSuccess(`Workout rescheduled to ${res.newDate}!`);
      refreshData();
    } else {
      showToastError(res.error || 'Failed to reschedule.');
    }
  };

  // 9. Quick Add Custom Routine
  const handleCreateCustomRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) {
      showToastError('Please enter a routine name.');
      return;
    }
    // Prescribe 5 exercises from library
    const lib = ExerciseLibrary.getInstance();
    const available = lib.getAllExercises().slice(0, 5);

    scheduleManager.saveCustomRoutine(
      userId,
      newRoutineName.trim(),
      newRoutineTarget.trim() || 'Custom Synergy',
      available.map((ex) => ex.toJSON())
    );

    showToastSuccess(`Custom routine "${newRoutineName}" created!`);
    setNewRoutineName('');
    setNewRoutineTarget('');
    setIsCreateRoutineModalOpen(false);
    refreshData();
  };

  // ================= MONTH CALENDAR COMPUTATIONS =================
  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Day of week: 0 (Sun) to 6 (Sat) -> convert to Mon=0 ... Sun=6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const totalDaysInMonth = lastDay.getDate();
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        dateStr: formatLocalDateString(d),
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      days.push({
        dateStr: formatLocalDateString(d),
        dayNum: day,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill out 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        dateStr: formatLocalDateString(d),
        dayNum: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentCalendarMonth]);

  // Index scheduled workouts by date string
  const scheduledByDate = useMemo(() => {
    const map: Record<string, ScheduledWorkout[]> = {};
    scheduledList.forEach((item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return map;
  }, [scheduledList]);

  // Workouts scheduled on selected calendar date
  const selectedDateWorkouts = useMemo(() => {
    return scheduledByDate[selectedCalendarDate] || [];
  }, [scheduledByDate, selectedCalendarDate]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ================= HEADER & VIEW TOGGLES ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#24242E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D] shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
              Weekly Guide & Schedule
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-0.5">
              Customize your weekly training rhythm, swap routines, and schedule specific calendar dates.
            </p>
          </div>
        </div>

        {/* Action Controls: View Switcher & "Schedule a workout" button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week vs Month View Toggle (Requirement 3) */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 dark:bg-[#16161D] border border-slate-300 dark:border-[#24242E]">
            <button
              type="button"
              onClick={() => setActiveView('week')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'week'
                  ? 'bg-[#C6FF3D] text-[#0B0B0F] shadow-sm'
                  : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6]'
              }`}
            >
              Week View
            </button>
            <button
              type="button"
              onClick={() => setActiveView('month')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'month'
                  ? 'bg-[#C6FF3D] text-[#0B0B0F] shadow-sm'
                  : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6]'
              }`}
            >
              Month Calendar
            </button>
          </div>

          {/* Schedule a Workout Button (Requirement 3 - Ash grey in light mode) */}
          <button
            type="button"
            onClick={() => handleOpenScheduleModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d5ff6a] dark:text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Schedule a Workout</span>
          </button>
        </div>
      </div>

      {/* ================= BACK-TO-BACK WARNING BANNER (Requirement 1) ================= */}
      {backToBackInfo.hasWarning && (
        <div
          className="p-4 sm:p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/50 text-slate-900 dark:text-amber-200 flex items-start gap-3.5 shadow-sm dark:shadow-lg dark:shadow-amber-950/20 animate-in fade-in"
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Rest Day Recommendation
            </h4>
            <p className="text-xs text-slate-700 dark:text-amber-200/90 leading-relaxed">
              {backToBackInfo.warningMessage}
            </p>
          </div>
        </div>
      )}

      {/* ================= VIEW 1: WEEKLY GUIDE VIEW (Requirement 1 & 2) ================= */}
      {activeView === 'week' && (
        <div className="space-y-6">
          {/* Weekday Toggle Chips (Mon to Sun) */}
          <div className="p-6 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] space-y-4 shadow-sm dark:shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
                  Training Days ({weeklySchedule.selectedDays.length} Days / Week)
                </h2>
                <p className="text-xs text-slate-600 dark:text-[#A1A1AA]">
                  Select the weekdays you intend to train. Focus splits automatically adjust across chosen days.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-600 dark:text-[#C6FF3D] font-bold">
                {weeklySchedule.selectedDays.length} of 7 Days Active
              </span>
            </div>

            {/* Seven Weekday Toggle Chips */}
            <div className="grid grid-cols-7 gap-2">
              {ALL_WEEKDAYS.map((day) => {
                const isSelected = weeklySchedule.selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleWeekday(day)}
                    className={`py-3 rounded-2xl text-xs font-heading font-black uppercase tracking-wider transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-[#C6FF3D] text-[#0B0B0F] border-[#C6FF3D] shadow-md shadow-[#C6FF3D]/15 scale-[1.02]'
                        : 'bg-white dark:bg-[#0B0B0F] text-slate-600 dark:text-[#A1A1AA] border-slate-200 dark:border-[#24242E] hover:text-slate-900 dark:hover:text-[#F4F4F6] hover:bg-slate-100 dark:hover:bg-[#24242E]/50'
                    }`}
                  >
                    <span className="text-sm">{WEEKDAY_LABELS[day]}</span>
                    <span className="text-[9px] font-mono opacity-80">
                      {isSelected ? 'TRAIN' : 'REST'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7 Per-Day Cards Grid (Requirement 2) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
                Weekly Routine Breakdown
              </h3>
              <span className="text-xs font-mono text-slate-500 dark:text-[#A1A1AA]">
                Swap or move routines to customize your schedule
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ALL_WEEKDAYS.map((day) => {
                const daySched = weeklySchedule.days[day];
                const isTraining = daySched?.isTrainingDay;
                const isRest = !isTraining || daySched?.routineId === 'rest';

                return (
                  <div
                    key={day}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                      isRest
                        ? 'bg-slate-100/90 border-slate-200 text-slate-700 shadow-sm dark:bg-[#16161D]/50 dark:border-[#24242E]/60 dark:text-[#A1A1AA]'
                        : 'bg-[#f8fafc] dark:bg-[#16161D] border-slate-200/90 dark:border-[#24242E] hover:border-slate-300 dark:hover:border-[#C6FF3D]/30 shadow-sm dark:shadow-lg text-slate-900 dark:text-[#F4F4F6]'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Card Header: Weekday Name & Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`font-heading text-lg font-black uppercase ${
                          isRest ? 'text-slate-800 dark:text-[#F4F4F6]' : 'text-slate-900 dark:text-[#F4F4F6]'
                        }`}>
                          {WEEKDAY_FULL_NAMES[day]}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                            isRest
                              ? 'bg-slate-200/80 text-slate-700 border border-slate-300/60 dark:bg-[#24242E] dark:text-[#A1A1AA] dark:border-transparent'
                              : 'bg-[#C6FF3D]/20 text-slate-900 dark:text-[#C6FF3D] border border-[#C6FF3D]/40'
                          }`}
                        >
                          {isRest ? 'Rest Day' : 'Training Day'}
                        </span>
                      </div>

                      {/* Routine Focus */}
                      <div className="space-y-1">
                        <h4
                          className={`text-base font-bold transition-colors ${
                            isRest ? 'text-slate-700 dark:text-[#A1A1AA]' : 'text-slate-900 dark:text-[#F4F4F6]'
                          }`}
                        >
                          {daySched?.routineName || 'Rest & Recovery Day'}
                        </h4>
                        <p className={`text-xs line-clamp-1 ${
                          isRest ? 'text-slate-500 dark:text-[#A1A1AA]' : 'text-slate-600 dark:text-[#A1A1AA]'
                        }`}>
                          {daySched?.targetMuscle || 'Active recovery & mobility'}
                        </p>
                      </div>

                      {!isRest && (
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 dark:text-[#A1A1AA] pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#C6FF3D]" />
                            ~45 min
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Dumbbell className="w-3.5 h-3.5 text-[#C6FF3D]" />
                            5 Exercises
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Per-Day Actions: Change, Move, Start (Requirement 2) */}
                    <div className="pt-3 border-t border-slate-200 dark:border-[#24242E] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Change Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenChangeRoutine(day)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0B0B0F] hover:bg-slate-100 dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] hover:border-slate-300 dark:hover:border-[#C6FF3D]/40 text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] text-xs font-mono transition-colors cursor-pointer"
                          title="Change routine for this day"
                        >
                          Change
                        </button>

                        {/* Move Button (Swaps if target day has workout) */}
                        <button
                          type="button"
                          onClick={() => handleOpenMoveRoutine(day)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0B0B0F] hover:bg-slate-100 dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] hover:border-slate-300 dark:hover:border-[#C6FF3D]/40 text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
                          title="Move or swap this workout to another day"
                        >
                          <ArrowLeftRight className="w-3 h-3 text-[#C6FF3D]" />
                          <span>Move</span>
                        </button>
                      </div>

                      {/* Start Workout Button - Ash grey in light mode, lime in dark mode */}
                      {!isRest && (
                        <button
                          type="button"
                          onClick={() => handleLaunchWorkout(daySched.routineId)}
                          className="p-2 rounded-xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d5ff6a] dark:text-[#0B0B0F] transition-all cursor-pointer shadow-sm"
                          title="Launch this workout in Live Session"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: MONTH CALENDAR VIEW (Requirement 3 & 5) ================= */}
      {activeView === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Month Calendar Grid (8 cols) */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-5 shadow-xl">
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#24242E]">
              <div className="flex items-center gap-3">
                <h2 className="font-heading text-2xl font-black uppercase text-[#F4F4F6]">
                  {currentCalendarMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setCurrentCalendarMonth(today);
                    setSelectedCalendarDate(getTodayDateString());
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#0B0B0F] border border-[#24242E] text-[10px] font-mono text-[#A1A1AA] hover:text-[#C6FF3D] transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>

              {/* Month navigation buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(currentCalendarMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentCalendarMonth(prev);
                  }}
                  className="p-2 rounded-xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors cursor-pointer"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(currentCalendarMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentCalendarMonth(next);
                  }}
                  className="p-2 rounded-xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors cursor-pointer"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Column Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs text-[#A1A1AA] font-bold">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                const isSelected = selectedCalendarDate === cell.dateStr;
                const isToday = todayDateStr === cell.dateStr;
                const workoutsOnDay = scheduledByDate[cell.dateStr] || [];

                // Status breakdown for scheduled workouts on this day
                const hasPlanned = workoutsOnDay.some((w) => w.status === 'planned');
                const hasDone = workoutsOnDay.some((w) => w.status === 'done');
                const hasMissed = workoutsOnDay.some((w) => w.status === 'missed');

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    onClick={() => setSelectedCalendarDate(cell.dateStr)}
                    className={`min-h-[64px] sm:min-h-[72px] p-1.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#C6FF3D] bg-[#1c1c27] ring-1 ring-[#C6FF3D]/40'
                        : isToday
                        ? 'border-[#C6FF3D]/40 bg-[#0B0B0F]'
                        : cell.isCurrentMonth
                        ? 'border-[#24242E] bg-[#0B0B0F] hover:border-[#383848]'
                        : 'border-transparent bg-transparent opacity-35'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday
                            ? 'text-[#C6FF3D]'
                            : cell.isCurrentMonth
                            ? 'text-[#F4F4F6]'
                            : 'text-[#A1A1AA]'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Completed Day Check Indicator */}
                      {hasDone && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                      )}
                    </div>

                    {/* Scheduled Day Lime Dots / Badges (Requirement 3) */}
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {hasPlanned && (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-[#C6FF3D] shadow-sm shadow-[#C6FF3D]/50"
                          title="Planned Workout"
                        />
                      )}
                      {hasDone && (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                          title="Completed Workout"
                        />
                      )}
                      {hasMissed && (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"
                          title="Missed Workout"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#24242E] text-xs font-mono text-[#A1A1AA]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF3D]" />
                <span>Planned (Lime dot)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Completed (Green check)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Missed</span>
              </div>
            </div>
          </div>

          {/* Right: Selected Date Workout Details (4 cols) */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#24242E]">
                <div>
                  <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-[#F4F4F6]">
                    {new Date(`${selectedCalendarDate}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h3>
                  <span className="text-xs font-mono text-[#A1A1AA]">
                    {selectedDateWorkouts.length} Scheduled
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenScheduleModal(selectedCalendarDate)}
                  className="p-2 rounded-xl bg-[#C6FF3D]/10 hover:bg-[#C6FF3D]/20 text-[#C6FF3D] border border-[#C6FF3D]/30 transition-colors cursor-pointer"
                  title="Schedule a workout on this date"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Workouts scheduled on this date */}
              {selectedDateWorkouts.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B0B0F] border border-[#24242E] flex items-center justify-center text-[#A1A1AA] mx-auto">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-[#A1A1AA]">
                    No workouts scheduled for this date.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenScheduleModal(selectedCalendarDate)}
                    className="px-3.5 py-2 rounded-xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D]/40 text-xs font-mono text-[#F4F4F6] transition-colors cursor-pointer"
                  >
                    + Schedule on {selectedCalendarDate}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateWorkouts.map((workout) => {
                    const isMissed = workout.status === 'missed';
                    const isDone = workout.status === 'done';

                    return (
                      <div
                        key={workout.id}
                        className={`p-4 rounded-2xl border space-y-3 transition-all ${
                          isDone
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : isMissed
                            ? 'bg-rose-950/20 border-rose-500/50 text-rose-300'
                            : 'bg-[#0B0B0F] border-[#24242E]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-[#F4F4F6]">
                                {workout.routineName}
                              </h4>
                              {isDone && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-[#A1A1AA]">
                              {workout.targetMuscle}
                              {workout.time && ` · ${workout.time}`}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isMissed
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/30'
                            }`}
                          >
                            {workout.status}
                          </span>
                        </div>

                        {/* Missed Warning & Reschedule CTA (Requirement 5) */}
                        {isMissed && (
                          <div className="pt-2 border-t border-rose-900/40 space-y-2">
                            <p className="text-[11px] text-rose-300/80">
                              This planned day passed without a logged workout.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRescheduleMissed(workout.id)}
                              className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reschedule to Next Available Day</span>
                            </button>
                          </div>
                        )}

                        {/* Normal Actions: Start, Edit, Delete */}
                        {!isMissed && (
                          <div className="pt-2 border-t border-[#24242E] flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenScheduleModal(undefined, workout)}
                                className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setItemToDelete(workout)}
                                className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-rose-400 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {!isDone && (
                              <button
                                type="button"
                                onClick={() => handleLaunchWorkout(workout.routineId)}
                                className="px-3 py-1.5 rounded-xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-bold text-xs font-heading uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-sm"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Start</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCreateRoutineModalOpen(true)}
              className="w-full py-2.5 rounded-2xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] text-xs font-mono text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors cursor-pointer"
            >
              + Create Custom Routine in "My Routines"
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: SCHEDULE A WORKOUT (Requirement 3 & 4) ================= */}
      {isScheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0F]/85 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#16161D] border border-[#24242E] rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[#24242E] pb-3">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-5 h-5 text-[#C6FF3D]" />
                <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-[#F4F4F6]">
                  {editingScheduleItem ? 'Edit Scheduled Workout' : 'Schedule a Workout'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-[#A1A1AA] hover:text-[#F4F4F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {scheduleFormError && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{scheduleFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSchedule} className="space-y-4">
              {/* Routine Selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Pick Routine
                </label>
                <select
                  value={formRoutineId}
                  onChange={(e) => setFormRoutineId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs text-[#F4F4F6] outline-none focus:border-[#C6FF3D]"
                >
                  <optgroup label="Default 5-Exercise Splits">
                    {DEFAULT_SPLIT_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.targetMuscle})
                      </option>
                    ))}
                  </optgroup>
                  {customRoutines.length > 0 && (
                    <optgroup label="My Custom Routines">
                      {customRoutines.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.targetMuscle})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    min={editingScheduleItem ? undefined : todayDateStr}
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs font-mono text-[#F4F4F6] outline-none focus:border-[#C6FF3D]"
                  />
                  {!editingScheduleItem && (
                    <span className="text-[10px] text-[#A1A1AA]">Must not be in the past</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs font-mono text-[#F4F4F6] outline-none focus:border-[#C6FF3D]"
                  />
                </div>
              </div>

              {/* Repeat Options (Requirement 3: repeat weekly, every 2 weeks or never) */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Recurrence Repeat
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'never' as ScheduleRepeat, label: 'Never' },
                    { id: 'weekly' as ScheduleRepeat, label: 'Weekly' },
                    { id: 'biweekly' as ScheduleRepeat, label: 'Every 2 wks' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFormRepeat(r.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                        formRepeat === r.id
                          ? 'bg-[#C6FF3D] text-[#0B0B0F] border-[#C6FF3D]'
                          : 'bg-[#0B0B0F] text-[#A1A1AA] border-[#24242E]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus on progressive overload"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs text-[#F4F4F6] outline-none focus:border-[#C6FF3D]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#24242E]">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#24242E] hover:bg-[#2E2E3C] text-xs font-semibold text-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs shadow-md shadow-[#C6FF3D]/15"
                >
                  {editingScheduleItem ? 'Save Changes' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CHANGE ROUTINE MODAL (Requirement 2) ================= */}
      {isChangeModalOpen && activeDayToModify && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0F]/85 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#16161D] border border-[#24242E] rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-[#24242E] pb-3">
              <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-[#F4F4F6]">
                Change Routine for {WEEKDAY_FULL_NAMES[activeDayToModify]}
              </h3>
              <button
                type="button"
                onClick={() => setIsChangeModalOpen(false)}
                className="text-[#A1A1AA] hover:text-[#F4F4F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#A1A1AA]">
              Select a routine to assign to {WEEKDAY_FULL_NAMES[activeDayToModify]}. You can choose from default splits, custom saved routines, or set as rest.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {DEFAULT_SPLIT_OPTIONS.map((split) => (
                <button
                  key={split.id}
                  type="button"
                  onClick={() => handleConfirmChangeRoutine(split.id, split.name, split.targetMuscle)}
                  className="w-full p-3 rounded-2xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D]/40 text-left transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <h5 className="font-bold text-sm text-[#F4F4F6] group-hover:text-[#C6FF3D]">
                      {split.name}
                    </h5>
                    <p className="text-xs text-[#A1A1AA]">{split.targetMuscle}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#C6FF3D]" />
                </button>
              ))}

              {customRoutines.map((routine) => (
                <button
                  key={routine.id}
                  type="button"
                  onClick={() => handleConfirmChangeRoutine(routine.id, routine.name, routine.targetMuscle)}
                  className="w-full p-3 rounded-2xl bg-[#0B0B0F] hover:bg-[#24242E] border border-cyan-800/40 hover:border-cyan-400 text-left transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-sm text-[#F4F4F6] group-hover:text-cyan-400">
                        {routine.name}
                      </h5>
                      <span className="text-[10px] font-mono uppercase bg-cyan-950/60 text-cyan-300 px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    </div>
                    <p className="text-xs text-[#A1A1AA]">{routine.targetMuscle}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-cyan-400" />
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleConfirmChangeRoutine('rest', 'Rest & Recovery Day', 'Active Recovery & Mobility')}
                className="w-full p-3 rounded-2xl bg-[#0B0B0F] hover:bg-[#24242E] border border-zinc-800 text-left transition-colors flex items-center justify-between text-[#A1A1AA] hover:text-white cursor-pointer"
              >
                <div>
                  <h5 className="font-bold text-sm">Rest & Recovery Day</h5>
                  <p className="text-xs">Take a day off for joint and muscle recovery</p>
                </div>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: MOVE ROUTINE MODAL (Requirement 2) ================= */}
      {isMoveModalOpen && activeDayToModify && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0F]/85 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#16161D] border border-[#24242E] rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#24242E] pb-3">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-[#F4F4F6]">
                Move {WEEKDAY_FULL_NAMES[activeDayToModify]} Workout
              </h3>
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                className="text-[#A1A1AA] hover:text-[#F4F4F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#A1A1AA]">
              Select which day to move this workout to. If the target day already has a workout, the two will swap.
            </p>

            <div className="grid grid-cols-1 gap-2">
              {ALL_WEEKDAYS.map((targetDay) => {
                const isSame = targetDay === activeDayToModify;
                const targetSched = weeklySchedule.days[targetDay];
                const hasExisting = targetSched?.isTrainingDay && targetSched.routineId !== 'rest';

                return (
                  <button
                    key={targetDay}
                    type="button"
                    disabled={isSame}
                    onClick={() => handleConfirmMoveRoutine(targetDay)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSame
                        ? 'opacity-30 border-transparent bg-transparent cursor-not-allowed'
                        : 'bg-[#0B0B0F] hover:bg-[#24242E] border-[#24242E] hover:border-[#C6FF3D]/40'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-[#F4F4F6]">
                        {WEEKDAY_FULL_NAMES[targetDay]}
                      </span>
                      <p className="text-[11px] text-[#A1A1AA]">
                        {hasExisting ? `Swaps with ${targetSched.routineName}` : 'Moves to rest day'}
                      </p>
                    </div>
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#C6FF3D]" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: CREATE CUSTOM ROUTINE ("MY ROUTINES") ================= */}
      {isCreateRoutineModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0F]/85 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#16161D] border border-[#24242E] rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-[#24242E] pb-3">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-[#F4F4F6]">
                Save Custom Routine
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateRoutineModalOpen(false)}
                className="text-[#A1A1AA] hover:text-[#F4F4F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRoutine} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Routine Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chest Hypertrophy Day"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs text-[#F4F4F6] outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                  Target Muscle Group
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pectorals & Front Delts"
                  value={newRoutineTarget}
                  onChange={(e) => setNewRoutineTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs text-[#F4F4F6] outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#24242E]">
                <button
                  type="button"
                  onClick={() => setIsCreateRoutineModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#24242E] text-xs font-semibold text-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase text-xs"
                >
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Scheduled Workout?"
        description={`Are you sure you want to remove the scheduled ${itemToDelete?.routineName} on ${itemToDelete?.date}?`}
        confirmLabel="Yes, Delete"
        isDestructive={true}
      />
    </div>
  );
};
