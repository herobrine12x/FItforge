import { StorageLayer } from './storage';
import { WorkoutRecord } from './WorkoutRecord';

/**
 * Helper to compute an ISO week key (e.g. "2026-W43") from a date
 */
export function getISOWeekKey(dateInput: Date | string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * DeloadManager
 * Encapsulates fatigue accumulation detection and deload week suggestions.
 * Deload suggestion triggers after 4 consecutive weeks of training.
 */
export class DeloadManager {
  private static readonly DISMISS_KEY = 'fitforge_deload_dismissed_week';
  private static readonly DELOAD_MODE_KEY = 'fitforge_deload_mode_active';

  /**
   * Evaluates workout records to determine how many consecutive weeks the user has trained.
   */
  public static calculateConsecutiveTrainingWeeks(records: WorkoutRecord[]): {
    consecutiveWeeks: number;
    isDeloadRecommended: boolean;
    currentWeekKey: string;
  } {
    const currentWeekKey = getISOWeekKey(new Date());

    if (!records || records.length === 0) {
      return { consecutiveWeeks: 0, isDeloadRecommended: false, currentWeekKey };
    }

    // Collect distinct training weeks
    const trainingWeeks = new Set<string>();
    for (const record of records) {
      const wk = getISOWeekKey(record.date);
      if (wk) trainingWeeks.add(wk);
    }

    if (trainingWeeks.size === 0) {
      return { consecutiveWeeks: 0, isDeloadRecommended: false, currentWeekKey };
    }

    // Build contiguous calendar weeks stepping backwards from current week
    let count = 0;
    const now = new Date();

    // Check up to 12 weeks back
    for (let i = 0; i < 12; i++) {
      const checkDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekKey = getISOWeekKey(checkDate);

      // If it's the current week and user hasn't trained yet this week, allow checking from previous week
      if (i === 0 && !trainingWeeks.has(weekKey)) {
        continue;
      }

      if (trainingWeeks.has(weekKey)) {
        count++;
      } else {
        // Gap encountered: streak of consecutive weeks breaks
        break;
      }
    }

    const isDeloadRecommended = count >= 4;

    return {
      consecutiveWeeks: count,
      isDeloadRecommended,
      currentWeekKey,
    };
  }

  /**
   * Checks if the deload banner was dismissed for the current week
   */
  public static isDismissed(): boolean {
    const dismissedWeek = StorageLayer.getItem(this.DISMISS_KEY);
    const currentWeekKey = getISOWeekKey(new Date());
    return dismissedWeek === currentWeekKey;
  }

  /**
   * Dismisses the deload suggestion for the current week
   */
  public static dismiss(): void {
    const currentWeekKey = getISOWeekKey(new Date());
    StorageLayer.setItem(this.DISMISS_KEY, currentWeekKey);
  }

  /**
   * Checks if the athlete has activated deload mode
   */
  public static isDeloadModeActive(): boolean {
    return StorageLayer.getItem(this.DELOAD_MODE_KEY) === 'true';
  }

  /**
   * Activates or deactivates deload mode
   */
  public static setDeloadModeActive(active: boolean): void {
    StorageLayer.setItem(this.DELOAD_MODE_KEY, active ? 'true' : 'false');
  }
}
