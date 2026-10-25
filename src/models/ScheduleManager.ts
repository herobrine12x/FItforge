import {
  formatLocalDateString,
  getTodayDateString,
  ScheduledWorkout,
} from './ScheduledWorkout';
import { StorageLayer, STORAGE_KEYS } from './storage';
import {
  ICustomRoutineData,
  IScheduledWorkoutData,
  IWeeklyDaySchedule,
  IWeeklyScheduleData,
  IWorkoutRecordData,
  ScheduleRepeat,
  ScheduleStatus,
  WeekdayKey,
} from './types';

export type { WeekdayKey };

export const ALL_WEEKDAYS: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export const WEEKDAY_FULL_NAMES: Record<WeekdayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

/**
 * Standard workout focus templates based on the count of active training days.
 * The focus of each day (e.g. Chest & Triceps, Back & Biceps, Legs & Core) is
 * reassigned automatically across the chosen weekdays in order.
 */
export const SPLIT_FOCUS_PRESETS: Record<
  number,
  { routineId: string; routineName: string; targetMuscle: string }[]
> = {
  1: [
    { routineId: 'full_body', routineName: 'Full Body Synergy', targetMuscle: 'Chest, Back, Legs & Core' },
  ],
  2: [
    { routineId: 'upper_body', routineName: 'Upper Body Torso', targetMuscle: 'Chest, Back, Delts & Arms' },
    { routineId: 'legs_core', routineName: 'Lower Body & Core', targetMuscle: 'Quads, Hamstrings & Core' },
  ],
  3: [
    { routineId: 'push', routineName: 'Push Split', targetMuscle: 'Chest, Shoulders & Triceps' },
    { routineId: 'pull', routineName: 'Pull Split', targetMuscle: 'Back, Rear Delts & Biceps' },
    { routineId: 'legs_core', routineName: 'Legs & Core', targetMuscle: 'Quads, Hamstrings & Core' },
  ],
  4: [
    { routineId: 'push', routineName: 'Push Compounds', targetMuscle: 'Chest, Shoulders & Triceps' },
    { routineId: 'pull', routineName: 'Pull Density', targetMuscle: 'Back, Lats & Biceps' },
    { routineId: 'legs_core', routineName: 'Legs & Core', targetMuscle: 'Quads, Hamstrings & Glutes' },
    { routineId: 'upper_body', routineName: 'Upper Hypertrophy', targetMuscle: 'Chest, Back & Arms' },
  ],
  5: [
    { routineId: 'push', routineName: 'Push Split', targetMuscle: 'Chest, Shoulders & Triceps' },
    { routineId: 'pull', routineName: 'Pull Split', targetMuscle: 'Back & Biceps' },
    { routineId: 'legs_core', routineName: 'Legs & Core', targetMuscle: 'Quads, Hamstrings & Abs' },
    { routineId: 'upper_body', routineName: 'Upper Body Pump', targetMuscle: 'Torso Hypertrophy' },
    { routineId: 'cardio_hiit', routineName: 'Cardio HIIT', targetMuscle: 'Full Body Metabolic' },
  ],
  6: [
    { routineId: 'push', routineName: 'Push (Heavy)', targetMuscle: 'Chest & Triceps' },
    { routineId: 'pull', routineName: 'Pull (Heavy)', targetMuscle: 'Back & Biceps' },
    { routineId: 'legs_core', routineName: 'Legs (Compound)', targetMuscle: 'Quads & Glutes' },
    { routineId: 'upper_body', routineName: 'Upper (Hypertrophy)', targetMuscle: 'Torso Isolation' },
    { routineId: 'home_bodyweight', routineName: 'Calisthenics Core', targetMuscle: 'Functional Calisthenics' },
    { routineId: 'cardio_hiit', routineName: 'Conditioning Intervals', targetMuscle: 'Cardiovascular Peak' },
  ],
  7: [
    { routineId: 'push', routineName: 'Push Split', targetMuscle: 'Chest & Triceps' },
    { routineId: 'pull', routineName: 'Pull Split', targetMuscle: 'Back & Biceps' },
    { routineId: 'legs_core', routineName: 'Legs & Core', targetMuscle: 'Lower Body' },
    { routineId: 'full_body', routineName: 'Full Body Synergy', targetMuscle: 'Multi-joint Compounds' },
    { routineId: 'upper_body', routineName: 'Upper Body Sculpt', targetMuscle: 'Arms & Shoulders' },
    { routineId: 'home_bodyweight', routineName: 'Bodyweight Mobility', targetMuscle: 'Core & Joint Mobility' },
    { routineId: 'cardio_hiit', routineName: 'Cardio Intervals', targetMuscle: 'Metabolic Conditioning' },
  ],
};

/**
 * Calculates whether chosen weekdays contain more than 3 consecutive training days.
 * Returns { hasWarning: boolean, maxConsecutive: number, warningMessage: string }
 */
export function checkBackToBackDays(selectedDays: WeekdayKey[]): {
  hasWarning: boolean;
  maxConsecutive: number;
  warningMessage: string;
} {
  if (selectedDays.length <= 3) {
    return { hasWarning: false, maxConsecutive: selectedDays.length, warningMessage: '' };
  }

  // Double the week array to inspect circular wrap-around (e.g. Fri, Sat, Sun, Mon)
  const fullCycle: WeekdayKey[] = [...ALL_WEEKDAYS, ...ALL_WEEKDAYS];
  let maxStreak = 0;
  let currentStreak = 0;

  for (const day of fullCycle) {
    if (selectedDays.includes(day)) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  // Cap at 7
  maxStreak = Math.min(7, maxStreak);

  if (maxStreak > 3) {
    return {
      hasWarning: true,
      maxConsecutive: maxStreak,
      warningMessage: `You have ${maxStreak} consecutive training days selected. We recommend scheduling a rest day after 3 consecutive days for optimal neuromuscular recovery and hypertrophy.`,
    };
  }

  return { hasWarning: false, maxConsecutive: maxStreak, warningMessage: '' };
}

/**
 * Generates an initial default weekly schedule across the chosen weekdays
 */
export function buildWeeklyScheduleFromDays(
  userId: string,
  selectedDays: WeekdayKey[]
): IWeeklyScheduleData {
  const chosenCount = Math.max(1, Math.min(7, selectedDays.length));
  const presets = SPLIT_FOCUS_PRESETS[chosenCount] || SPLIT_FOCUS_PRESETS[3];

  const daysRecord: Record<WeekdayKey, IWeeklyDaySchedule> = {} as any;
  let presetIdx = 0;

  ALL_WEEKDAYS.forEach((day) => {
    const isTraining = selectedDays.includes(day);
    if (isTraining && presetIdx < presets.length) {
      const p = presets[presetIdx++];
      daysRecord[day] = {
        day,
        isTrainingDay: true,
        routineId: p.routineId,
        routineName: p.routineName,
        targetMuscle: p.targetMuscle,
        estimatedMinutes: 45,
      };
    } else {
      daysRecord[day] = {
        day,
        isTrainingDay: false,
        routineId: 'rest',
        routineName: 'Rest & Recovery Day',
        targetMuscle: 'Active Recovery & Mobility',
        estimatedMinutes: 0,
      };
    }
  });

  return {
    userId,
    selectedDays: [...selectedDays],
    days: daysRecord,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * OOP Principle: Single Responsibility & Data Access Object
 * ScheduleManager manages scheduled workout entities, custom routines,
 * and weekly recurring routines.
 */
export class ScheduleManager {
  /**
   * Reads all ScheduledWorkout instances for a given user.
   */
  public getScheduledWorkouts(userId: string): ScheduledWorkout[] {
    const raw = StorageLayer.getTable<IScheduledWorkoutData>(STORAGE_KEYS.SCHEDULED_WORKOUTS);
    return raw
      .filter((item) => item.userId === userId)
      .map((item) => ScheduledWorkout.fromJSON(item))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Adds a new ScheduledWorkout.
   * Enforces domain validation: date cannot be in the past for new items.
   */
  public addScheduledWorkout(
    userId: string,
    routineId: string,
    date: string,
    time: string = '',
    repeat: ScheduleRepeat = 'never',
    options?: {
      routineName?: string;
      targetMuscle?: string;
      notes?: string;
    }
  ): { success: boolean; item?: ScheduledWorkout; error?: string } {
    try {
      const workout = ScheduledWorkout.createNew(
        userId,
        routineId,
        date,
        time,
        repeat,
        options
      );

      const table = StorageLayer.getTable<IScheduledWorkoutData>(STORAGE_KEYS.SCHEDULED_WORKOUTS);
      table.push(workout.toJSON());
      StorageLayer.saveTable(STORAGE_KEYS.SCHEDULED_WORKOUTS, table);

      return { success: true, item: workout };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule workout.';
      return { success: false, error: msg };
    }
  }

  /**
   * Updates an existing ScheduledWorkout item.
   */
  public updateScheduledWorkout(
    id: string,
    updates: Partial<IScheduledWorkoutData>
  ): { success: boolean; item?: ScheduledWorkout; error?: string } {
    try {
      const table = StorageLayer.getTable<IScheduledWorkoutData>(STORAGE_KEYS.SCHEDULED_WORKOUTS);
      const index = table.findIndex((item) => item.id === id);

      if (index === -1) {
        return { success: false, error: 'Scheduled workout not found.' };
      }

      const existing = ScheduledWorkout.fromJSON(table[index]);

      if (updates.date !== undefined) existing.date = updates.date;
      if (updates.time !== undefined) existing.time = updates.time;
      if (updates.repeat !== undefined) existing.repeat = updates.repeat;
      if (updates.status !== undefined) existing.status = updates.status;
      if (updates.routineId !== undefined) existing.routineId = updates.routineId;
      if (updates.routineName !== undefined) existing.routineName = updates.routineName;
      if (updates.notes !== undefined) existing.notes = updates.notes;

      table[index] = existing.toJSON();
      StorageLayer.saveTable(STORAGE_KEYS.SCHEDULED_WORKOUTS, table);

      return { success: true, item: existing };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update scheduled workout.';
      return { success: false, error: msg };
    }
  }

  /**
   * Deletes a ScheduledWorkout item.
   */
  public deleteScheduledWorkout(id: string): { success: boolean; error?: string } {
    try {
      const table = StorageLayer.getTable<IScheduledWorkoutData>(STORAGE_KEYS.SCHEDULED_WORKOUTS);
      const filtered = table.filter((item) => item.id !== id);
      StorageLayer.saveTable(STORAGE_KEYS.SCHEDULED_WORKOUTS, filtered);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete scheduled workout.';
      return { success: false, error: msg };
    }
  }

  /**
   * Synchronizes missed and completed workouts:
   * "5. Skipped days: if a planned day passes without a saved workout, mark it Missed,
   * with a button to Reschedule it to the next available day. Never auto-delete missed workouts."
   */
  public checkAndUpdateMissedWorkouts(
    userId: string,
    userRecords: IWorkoutRecordData[] = []
  ): ScheduledWorkout[] {
    const today = getTodayDateString();
    const table = StorageLayer.getTable<IScheduledWorkoutData>(STORAGE_KEYS.SCHEDULED_WORKOUTS);
    let changed = false;

    const updatedTable = table.map((item) => {
      if (item.userId !== userId) return item;

      // Only check planned items whose scheduled date is in the past
      if (item.status === 'planned' && item.date < today) {
        // Check if there is a saved workout record for this user on that date
        const hasMatchingRecord = userRecords.some((rec) => {
          const recDateStr = formatLocalDateString(new Date(rec.date));
          return recDateStr === item.date;
        });

        if (hasMatchingRecord) {
          item.status = 'done';
          changed = true;
        } else {
          item.status = 'missed';
          changed = true;
        }
      }
      return item;
    });

    if (changed) {
      StorageLayer.saveTable(STORAGE_KEYS.SCHEDULED_WORKOUTS, updatedTable);
    }

    return updatedTable
      .filter((item) => item.userId === userId)
      .map((item) => ScheduledWorkout.fromJSON(item))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Reschedules a workout to the next available upcoming day.
   */
  public rescheduleToNextAvailableDay(
    id: string,
    userId: string
  ): { success: boolean; newDate?: string; error?: string } {
    try {
      const table = StorageLayer.getTable<IScheduledWorkoutData>(STORAGE_KEYS.SCHEDULED_WORKOUTS);
      const index = table.findIndex((item) => item.id === id);

      if (index === -1) {
        return { success: false, error: 'Scheduled workout not found.' };
      }

      // Collect dates already booked by this user
      const bookedDates = new Set(
        table.filter((item) => item.userId === userId && item.id !== id).map((item) => item.date)
      );

      // Find next free date starting from tomorrow
      let candidate = new Date();
      candidate.setDate(candidate.getDate() + 1); // Start tomorrow

      let foundDateStr = '';
      for (let i = 0; i < 30; i++) {
        const dateStr = formatLocalDateString(candidate);
        if (!bookedDates.has(dateStr)) {
          foundDateStr = dateStr;
          break;
        }
        candidate.setDate(candidate.getDate() + 1);
      }

      if (!foundDateStr) {
        // Fallback to tomorrow if packed
        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 1);
        foundDateStr = formatLocalDateString(fallback);
      }

      const workout = ScheduledWorkout.fromJSON(table[index]);
      workout.reschedule(foundDateStr);
      table[index] = workout.toJSON();
      StorageLayer.saveTable(STORAGE_KEYS.SCHEDULED_WORKOUTS, table);

      return { success: true, newDate: foundDateStr };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reschedule workout.';
      return { success: false, error: msg };
    }
  }

  // ================= WEEKLY SCHEDULE (MON TO SUN) =================
  public getWeeklySchedule(userId: string): IWeeklyScheduleData {
    const allWeekly = StorageLayer.getTable<IWeeklyScheduleData>(STORAGE_KEYS.WEEKLY_SCHEDULE);
    const userSched = allWeekly.find((s) => s.userId === userId);

    if (userSched && userSched.days && userSched.selectedDays) {
      return userSched;
    }

    // Default: Mon, Wed, Fri (3 days)
    const initialDays: WeekdayKey[] = ['mon', 'wed', 'fri'];
    const fresh = buildWeeklyScheduleFromDays(userId, initialDays);
    this.saveWeeklySchedule(fresh);
    return fresh;
  }

  public saveWeeklySchedule(schedule: IWeeklyScheduleData): void {
    const allWeekly = StorageLayer.getTable<IWeeklyScheduleData>(STORAGE_KEYS.WEEKLY_SCHEDULE);
    const index = allWeekly.findIndex((s) => s.userId === schedule.userId);

    schedule.updatedAt = new Date().toISOString();

    if (index !== -1) {
      allWeekly[index] = schedule;
    } else {
      allWeekly.push(schedule);
    }
    StorageLayer.saveTable(STORAGE_KEYS.WEEKLY_SCHEDULE, allWeekly);
  }

  /**
   * Updates chosen training days chips (Mon to Sun) and reassigns routine focus
   * automatically across the chosen days.
   */
  public updateSelectedWeekdays(userId: string, newDays: WeekdayKey[]): IWeeklyScheduleData {
    const fresh = buildWeeklyScheduleFromDays(userId, newDays);
    this.saveWeeklySchedule(fresh);
    return fresh;
  }

  /**
   * Swap routine of day A with day B (or move to rest day B)
   */
  public moveOrSwapDay(
    userId: string,
    fromDay: WeekdayKey,
    toDay: WeekdayKey
  ): IWeeklyScheduleData {
    const schedule = this.getWeeklySchedule(userId);
    const dayFrom = { ...schedule.days[fromDay] };
    const dayTo = { ...schedule.days[toDay] };

    // Swap routines and training day flags
    schedule.days[fromDay] = {
      ...dayTo,
      day: fromDay,
    };
    schedule.days[toDay] = {
      ...dayFrom,
      day: toDay,
    };

    // Recalculate selectedDays array
    schedule.selectedDays = ALL_WEEKDAYS.filter((d) => schedule.days[d].isTrainingDay);

    this.saveWeeklySchedule(schedule);
    return schedule;
  }

  /**
   * Changes the routine of a specific day
   */
  public changeDayRoutine(
    userId: string,
    day: WeekdayKey,
    routineId: string,
    routineName: string,
    targetMuscle: string
  ): IWeeklyScheduleData {
    const schedule = this.getWeeklySchedule(userId);
    const isRest = routineId === 'rest';

    schedule.days[day] = {
      day,
      isTrainingDay: !isRest,
      routineId,
      routineName: isRest ? 'Rest & Recovery Day' : routineName,
      targetMuscle: isRest ? 'Active Recovery & Mobility' : targetMuscle,
      estimatedMinutes: isRest ? 0 : 45,
    };

    schedule.selectedDays = ALL_WEEKDAYS.filter((d) => schedule.days[d].isTrainingDay);
    this.saveWeeklySchedule(schedule);
    return schedule;
  }

  // ================= CUSTOM ROUTINES ("MY ROUTINES") =================
  public getCustomRoutines(userId: string): ICustomRoutineData[] {
    const table = StorageLayer.getTable<ICustomRoutineData>(STORAGE_KEYS.CUSTOM_ROUTINES);
    return table.filter((r) => r.userId === userId);
  }

  public saveCustomRoutine(
    userId: string,
    name: string,
    targetMuscle: string,
    exercises: any[],
    splitType?: string
  ): ICustomRoutineData {
    const table = StorageLayer.getTable<ICustomRoutineData>(STORAGE_KEYS.CUSTOM_ROUTINES);
    const routine: ICustomRoutineData = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      name: name.trim(),
      targetMuscle: targetMuscle.trim(),
      splitType: splitType || 'custom',
      exercises: exercises || [],
      createdAt: new Date().toISOString(),
    };
    table.push(routine);
    StorageLayer.saveTable(STORAGE_KEYS.CUSTOM_ROUTINES, table);
    return routine;
  }

  public deleteCustomRoutine(id: string): boolean {
    const table = StorageLayer.getTable<ICustomRoutineData>(STORAGE_KEYS.CUSTOM_ROUTINES);
    const filtered = table.filter((r) => r.id !== id);
    return StorageLayer.saveTable(STORAGE_KEYS.CUSTOM_ROUTINES, filtered);
  }
}
