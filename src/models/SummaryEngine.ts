import { calculateStreak, toLocalDateString } from './Achievement';
import { IWeeklySummaryMetrics } from './types';
import { WorkoutRecord } from './WorkoutRecord';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Returns Monday 00:00:00 and Sunday 23:59:59 for a given week offset from today (0 = current week, -1 = last week).
 */
export function getWeekBoundaries(offsetWeeks: number = 0): { startOfWeek: Date; endOfWeek: Date } {
  const now = new Date();
  const day = now.getDay();
  // 0 is Sunday, 1 is Monday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + offsetWeeks * 7, 0, 0, 0, 0);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

  return { startOfWeek: monday, endOfWeek: sunday };
}

/**
 * Computes weekly performance summary metrics and motivational advice rules.
 */
export function computeWeeklySummary(
  records: WorkoutRecord[],
  weeklyGoal: number = 3,
  offsetWeeks: number = 0
): IWeeklySummaryMetrics {
  const goal = Math.max(1, weeklyGoal || 3);
  const { startOfWeek, endOfWeek } = getWeekBoundaries(offsetWeeks);

  // Records for the target week
  const thisWeekRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d >= startOfWeek && d <= endOfWeek;
  });

  // Records for previous week to detect multi-week streak
  const { startOfWeek: prevStart, endOfWeek: prevEnd } = getWeekBoundaries(offsetWeeks - 1);
  const prevWeekRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d >= prevStart && d <= prevEnd;
  });

  const workoutsDone = thisWeekRecords.length;
  const prevWorkoutsDone = prevWeekRecords.length;

  const totalMinutes = thisWeekRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
  const totalCalories = thisWeekRecords.reduce((sum, r) => sum + (r.caloriesBurned || 0), 0);

  const { currentStreak, bestStreak } = calculateStreak(records);

  const goalProgressPercent = Math.min(100, Math.round((workoutsDone / goal) * 100));

  // Determine Best Day (highest calories, or highest duration)
  let bestDay: IWeeklySummaryMetrics['bestDay'] = null;
  if (thisWeekRecords.length > 0) {
    const sorted = [...thisWeekRecords].sort((a, b) => {
      const scoreA = (a.caloriesBurned || 0) * 2 + (a.durationMinutes || 0);
      const scoreB = (b.caloriesBurned || 0) * 2 + (b.durationMinutes || 0);
      return scoreB - scoreA;
    });

    const top = sorted[0];
    const topDate = new Date(top.date);
    bestDay = {
      date: toLocalDateString(topDate),
      dayName: DAY_NAMES[topDate.getDay()],
      caloriesBurned: top.caloriesBurned || 0,
      durationMinutes: top.durationMinutes || 0,
      splitName: top.splitName || 'Workout',
    };
  }

  // ================= RULE ENGINE: What to aim for next week =================
  let whatToAimForNextWeek = '';
  const goalMetThisWeek = workoutsDone >= goal;
  const goalMetPrevWeek = prevWorkoutsDone >= goal;

  if (goalMetThisWeek && goalMetPrevWeek) {
    const nextGoal = Math.min(7, goal + 1);
    whatToAimForNextWeek = `Outstanding discipline! You met your weekly goal two weeks in a row. Next week, aim to challenge yourself by adding one more day (target ${nextGoal} days) or increasing your session intensity by 5–10%.`;
  } else if (goalMetThisWeek) {
    whatToAimForNextWeek = `Target achieved! You hit your ${goal}-workout goal this week. Next week, aim to maintain this rhythm and lock in your rest days for optimal recovery.`;
  } else if (workoutsDone === goal - 1) {
    whatToAimForNextWeek = `So close! You were just 1 workout away from hitting your ${goal}-day target. For next week, aim to schedule your first workout on Monday or Tuesday to bank momentum early.`;
  } else if (workoutsDone > 0) {
    whatToAimForNextWeek = `Keep the foundation strong. Keep your target at ${goal} workouts next week, and aim for 2 consecutive active sessions to build your streak.`;
  } else {
    whatToAimForNextWeek = `A fresh week is waiting! Aim for at least 1 or 2 workouts or brisk walks next week to kick off your streak—every single session counts toward your progression.`;
  }

  return {
    weekStart: toLocalDateString(startOfWeek),
    weekEnd: toLocalDateString(endOfWeek),
    workoutsDone,
    totalMinutes,
    totalCalories,
    currentStreak,
    bestStreak,
    weeklyGoal: goal,
    goalProgressPercent,
    bestDay,
    whatToAimForNextWeek,
  };
}
