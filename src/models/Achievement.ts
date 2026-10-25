import { StorageLayer, STORAGE_KEYS } from './storage';
import { IBadgeData, IBadgeDefinition } from './types';
import { WorkoutRecord } from './WorkoutRecord';

/**
 * 8 Canonical Motivation Badges defined by FitForge
 */
export const BADGE_DEFINITIONS: Record<string, IBadgeDefinition> = {
  first_workout: {
    id: 'first_workout',
    title: 'First Workout',
    description: 'Completed your very first workout or walk session. The journey begins!',
    iconName: 'Play',
    requirement: 'Log 1 workout or walk',
  },
  streak_3: {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Maintained a 3-day active streak (with 1-day rest grace). Momentum ignited!',
    iconName: 'Flame',
    requirement: 'Achieve a 3-day active streak',
  },
  streak_7: {
    id: 'streak_7',
    title: '7-Day Streak',
    description: 'A full week of relentless consistency. Unstoppable discipline!',
    iconName: 'Zap',
    requirement: 'Achieve a 7-day active streak',
  },
  workouts_10: {
    id: 'workouts_10',
    title: '10 Workouts',
    description: 'Double digits reached! Your habits are becoming a permanent lifestyle.',
    iconName: 'Target',
    requirement: 'Log 10 total sessions',
  },
  workouts_25: {
    id: 'workouts_25',
    title: '25 Workouts',
    description: 'Quarter-century club! Elite dedication to your physical progression.',
    iconName: 'Trophy',
    requirement: 'Log 25 total sessions',
  },
  first_full_week: {
    id: 'first_full_week',
    title: 'First Full Week',
    description: 'Crushed your weekly target (Monday–Sunday). Goal fulfilled!',
    iconName: 'Award',
    requirement: 'Meet your weekly goal in any full week',
  },
  first_walk: {
    id: 'first_walk',
    title: 'First Walk',
    description: 'Logged your first recovery or outdoor walk session. Active recovery matters!',
    iconName: 'Footprints',
    requirement: 'Log at least 1 walk or stroll',
  },
  session_30_min: {
    id: 'session_30_min',
    title: '30-Minute Session',
    description: 'Pushed through a dedicated workout or walk lasting 30 minutes or more.',
    iconName: 'Clock',
    requirement: 'Complete a session of 30+ minutes',
  },
};

/**
 * Formats date into standard YYYY-MM-DD local string for accurate day comparisons.
 */
export function toLocalDateString(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar day difference (dateB - dateA) in days.
 */
export function getDaysDiff(dateStrA: string, dateStrB: string): number {
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  const utcA = Date.UTC(y1, m1 - 1, d1);
  const utcB = Date.UTC(y2, m2 - 1, d2);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

/**
 * Checks if a record represents a walk (e.g. splitType, splitName, or notes).
 */
export function isWalkRecord(record: WorkoutRecord): boolean {
  if (!record) return false;
  const name = (record.splitName || '').toLowerCase();
  const title = (record.title || '').toLowerCase();
  const split = String(record.splitType || '').toLowerCase();
  const notes = (record.notes || '').toLowerCase();
  return (
    name.includes('walk') ||
    title.includes('walk') ||
    split.includes('walk') ||
    notes.includes('walk')
  );
}

/**
 * Streak Calculation Engine with 1-Day Rest Grace Rule
 * - Consecutive training days (diff = 1) extend streak.
 * - Exactly one rest day between training days (diff = 2) is permitted under the grace rule.
 * - Two or more consecutive rest days (diff >= 3) break the streak.
 */
export function calculateStreak(
  records: WorkoutRecord[],
  referenceDate: Date = new Date()
): { currentStreak: number; bestStreak: number } {
  if (!records || records.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // 1. Gather all unique valid dates in YYYY-MM-DD
  const dateSet = new Set<string>();
  for (const r of records) {
    const key = toLocalDateString(r.date);
    if (key) dateSet.add(key);
  }

  const sortedDates = Array.from(dateSet).sort();
  if (sortedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // 2. Build streak segments using the 1-day rest grace rule (diff <= 2)
  let bestStreak = 1;
  let currentSegmentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = getDaysDiff(sortedDates[i - 1], sortedDates[i]);
    if (diff <= 2) {
      // Unbroken with 0 or 1 rest day grace
      currentSegmentStreak += 1;
    } else {
      // 2 or more rest days: streak broke
      currentSegmentStreak = 1;
    }

    if (currentSegmentStreak > bestStreak) {
      bestStreak = currentSegmentStreak;
    }
  }

  // 3. Determine current active streak relative to referenceDate
  const todayStr = toLocalDateString(referenceDate);
  const lastActiveDate = sortedDates[sortedDates.length - 1];
  const diffFromLastWorkout = getDaysDiff(lastActiveDate, todayStr);

  let currentStreak = 0;
  // If trained today (diff 0), trained yesterday (diff 1),
  // or trained 2 days ago (diff 2 -> 1 rest day yesterday, today pending with grace),
  // then the streak is currently alive!
  if (diffFromLastWorkout >= 0 && diffFromLastWorkout <= 2) {
    currentStreak = currentSegmentStreak;
  } else if (diffFromLastWorkout < 0) {
    // In case referenceDate is before recorded workouts, still count current segment
    currentStreak = currentSegmentStreak;
  } else {
    // 2 or more rest days passed without a workout
    currentStreak = 0;
  }

  return { currentStreak, bestStreak };
}

/**
 * Checks if weekly goal was met in at least one Monday-Sunday week.
 */
export function checkHasMetWeeklyGoal(records: WorkoutRecord[], weeklyGoal: number): boolean {
  if (!records || records.length === 0) return false;
  const target = Math.max(1, weeklyGoal || 3);

  // Group records by week (Monday YYYY-MM-DD)
  const weekMap = new Map<string, number>();

  for (const r of records) {
    const d = new Date(r.date);
    if (isNaN(d.getTime())) continue;

    // Calculate Monday of this record's week
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    const weekKey = toLocalDateString(monday);

    const count = (weekMap.get(weekKey) || 0) + 1;
    weekMap.set(weekKey, count);

    if (count >= target) {
      return true;
    }
  }

  return false;
}

/**
 * OOP Domain Model: Achievement
 * Encapsulates badge status, unlock dates, definition, and serialization.
 */
export class Achievement {
  private _id: string;
  private _userId: string;
  private _unlockedAt: string | null;
  private _title: string;
  private _description: string;
  private _iconName: string;
  private _requirement: string;

  constructor(
    id: string,
    userId: string,
    unlockedAt: string | null = null
  ) {
    const def = BADGE_DEFINITIONS[id];
    if (!def) {
      throw new Error(`Unknown badge id: "${id}"`);
    }

    this._id = id;
    this._userId = userId;
    this._unlockedAt = unlockedAt;
    this._title = def.title;
    this._description = def.description;
    this._iconName = def.iconName;
    this._requirement = def.requirement;
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get unlockedAt(): string | null {
    return this._unlockedAt;
  }

  public get isUnlocked(): boolean {
    return !!this._unlockedAt;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string {
    return this._description;
  }

  public get iconName(): string {
    return this._iconName;
  }

  public get requirement(): string {
    return this._requirement;
  }

  public unlock(timestamp: string = new Date().toISOString()): void {
    if (!this._unlockedAt) {
      this._unlockedAt = timestamp;
    }
  }

  public toJSON(): IBadgeData {
    return {
      id: this._id,
      userId: this._userId,
      unlockedAt: this._unlockedAt || new Date().toISOString(),
    };
  }

  public static fromData(data: IBadgeData): Achievement {
    return new Achievement(data.id, data.userId, data.unlockedAt);
  }
}

/**
 * AchievementManager
 * Handles badge evaluation, persistence in the 'badges' table, and streak computations.
 */
export class AchievementManager {
  /**
   * Retrieves all badges for a user with their unlock status from the 'badges' table.
   */
  public getBadges(userId: string): Achievement[] {
    const table = StorageLayer.getTable<IBadgeData>(STORAGE_KEYS.BADGES);
    const userBadges = table.filter((b) => b.userId === userId);
    const unlockedMap = new Map<string, string>();
    for (const b of userBadges) {
      unlockedMap.set(b.id, b.unlockedAt);
    }

    return Object.keys(BADGE_DEFINITIONS).map((id) => {
      const unlockedAt = unlockedMap.get(id) || null;
      return new Achievement(id, userId, unlockedAt);
    });
  }

  /**
   * Evaluates user records and goal, awards new badges, persists them,
   * and returns newly unlocked badges so the UI can trigger celebration effects.
   */
  public checkAndUnlockBadges(
    userId: string,
    records: WorkoutRecord[],
    weeklyGoal: number = 3
  ): { allBadges: Achievement[]; newlyUnlocked: Achievement[] } {
    if (!userId) {
      return { allBadges: [], newlyUnlocked: [] };
    }

    const table = StorageLayer.getTable<IBadgeData>(STORAGE_KEYS.BADGES);
    const userRows = table.filter((b) => b.userId === userId);
    const unlockedSet = new Set(userRows.map((b) => b.id));

    const { currentStreak, bestStreak } = calculateStreak(records);
    const totalWorkouts = records.length;
    const hasWalk = records.some(isWalkRecord);
    const has30Min = records.some((r) => (r.durationMinutes || 0) >= 30);
    const hasFullWeek = checkHasMetWeeklyGoal(records, weeklyGoal);

    const maxStreak = Math.max(currentStreak, bestStreak);

    const newlyUnlockedIds: string[] = [];

    // 1. First workout
    if (totalWorkouts >= 1 && !unlockedSet.has('first_workout')) {
      newlyUnlockedIds.push('first_workout');
    }

    // 2. 3-day streak
    if (maxStreak >= 3 && !unlockedSet.has('streak_3')) {
      newlyUnlockedIds.push('streak_3');
    }

    // 3. 7-day streak
    if (maxStreak >= 7 && !unlockedSet.has('streak_7')) {
      newlyUnlockedIds.push('streak_7');
    }

    // 4. 10 workouts
    if (totalWorkouts >= 10 && !unlockedSet.has('workouts_10')) {
      newlyUnlockedIds.push('workouts_10');
    }

    // 5. 25 workouts
    if (totalWorkouts >= 25 && !unlockedSet.has('workouts_25')) {
      newlyUnlockedIds.push('workouts_25');
    }

    // 6. First full week (weekly goal met)
    if (hasFullWeek && !unlockedSet.has('first_full_week')) {
      newlyUnlockedIds.push('first_full_week');
    }

    // 7. First walk
    if (hasWalk && !unlockedSet.has('first_walk')) {
      newlyUnlockedIds.push('first_walk');
    }

    // 8. First 30-minute session
    if (has30Min && !unlockedSet.has('session_30_min')) {
      newlyUnlockedIds.push('session_30_min');
    }

    const newlyUnlocked: Achievement[] = [];

    if (newlyUnlockedIds.length > 0) {
      const nowIso = new Date().toISOString();
      const newRows: IBadgeData[] = newlyUnlockedIds.map((id) => ({
        id,
        userId,
        unlockedAt: nowIso,
      }));

      StorageLayer.saveTable(STORAGE_KEYS.BADGES, [...table, ...newRows]);

      for (const row of newRows) {
        newlyUnlocked.push(Achievement.fromData(row));
      }
    }

    const allBadges = this.getBadges(userId);
    return { allBadges, newlyUnlocked };
  }
}
