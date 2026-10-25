import { IPersonalRecordData, ISetLogData } from './types';
import { StorageLayer, STORAGE_KEYS } from './storage';

/**
 * OOP Principle: Encapsulation & Domain Invariants
 * PersonalRecord encapsulates the athlete's peak performance metrics for a specific exercise:
 * - Absolute heaviest weight lifted (with reps and date)
 * - Highest estimated One-Rep Maximum (1RM via Epley formula)
 */
export class PersonalRecord {
  private _exerciseName: string;
  private _bestWeightKg: number;
  private _bestWeightReps: number;
  private _bestWeightDate: string;
  private _bestEstimatedOneRepMaxKg: number;
  private _bestEstimated1RMReps: number;
  private _bestEstimated1RMWeightKg: number;
  private _bestEstimated1RMDate: string;
  private _totalSets: number;

  constructor(data: {
    exerciseName: string;
    bestWeightKg?: number;
    bestWeightReps?: number;
    bestWeightDate?: string;
    bestEstimatedOneRepMaxKg?: number;
    bestEstimated1RMReps?: number;
    bestEstimated1RMWeightKg?: number;
    bestEstimated1RMDate?: string;
    totalSets?: number;
  }) {
    if (!data.exerciseName || data.exerciseName.trim().length === 0) {
      throw new Error('Exercise name cannot be empty.');
    }

    this._exerciseName = data.exerciseName.trim();
    this._bestWeightKg = Math.max(0, data.bestWeightKg || 0);
    this._bestWeightReps = Math.max(0, data.bestWeightReps || 0);
    this._bestWeightDate = data.bestWeightDate || new Date().toISOString();
    this._bestEstimatedOneRepMaxKg = Math.max(0, data.bestEstimatedOneRepMaxKg || 0);
    this._bestEstimated1RMReps = Math.max(0, data.bestEstimated1RMReps || 0);
    this._bestEstimated1RMWeightKg = Math.max(0, data.bestEstimated1RMWeightKg || 0);
    this._bestEstimated1RMDate = data.bestEstimated1RMDate || new Date().toISOString();
    this._totalSets = Math.max(0, data.totalSets || 0);
  }

  // Getters
  public get exerciseName(): string {
    return this._exerciseName;
  }

  public get bestWeightKg(): number {
    return this._bestWeightKg;
  }

  public get bestWeightReps(): number {
    return this._bestWeightReps;
  }

  public get bestWeightDate(): string {
    return this._bestWeightDate;
  }

  public get bestEstimatedOneRepMaxKg(): number {
    return this._bestEstimatedOneRepMaxKg;
  }

  public get bestEstimated1RMReps(): number {
    return this._bestEstimated1RMReps;
  }

  public get bestEstimated1RMWeightKg(): number {
    return this._bestEstimated1RMWeightKg;
  }

  public get bestEstimated1RMDate(): string {
    return this._bestEstimated1RMDate;
  }

  public get totalSets(): number {
    return this._totalSets;
  }

  /**
   * Calculates Estimated One-Rep Max (1RM) using the standard Epley equation:
   * 1RM = Weight * (1 + Reps / 30)
   * Reps = 1 returns the exact weight.
   */
  public static calculate1RM(weightKg: number, reps: number): number {
    if (weightKg <= 0 || reps <= 0) return 0;
    if (reps === 1) return Math.round(weightKg * 10) / 10;
    const est = weightKg * (1 + reps / 30);
    return Math.round(est * 10) / 10;
  }

  /**
   * Evaluates a completed set and updates records if a new peak was achieved.
   */
  public recordSet(
    weightKg: number,
    reps: number,
    date: string = new Date().toISOString()
  ): {
    isNewWeightPR: boolean;
    isNew1RMPR: boolean;
    prevWeight: number;
    prev1RM: number;
    newWeight: number;
    new1RM: number;
  } {
    // Validate bounds
    const safeWeight = Math.min(500, Math.max(0, Number(weightKg) || 0));
    const safeReps = Math.min(100, Math.max(1, Math.round(Number(reps) || 1)));

    this._totalSets += 1;

    const prevWeight = this._bestWeightKg;
    const prev1RM = this._bestEstimatedOneRepMaxKg;

    let isNewWeightPR = false;
    let isNew1RMPR = false;

    // Weight PR check (must exceed previous best weight)
    if (safeWeight > this._bestWeightKg) {
      this._bestWeightKg = safeWeight;
      this._bestWeightReps = safeReps;
      this._bestWeightDate = date;
      isNewWeightPR = true;
    }

    // 1RM PR check
    const currentEst1RM = PersonalRecord.calculate1RM(safeWeight, safeReps);
    if (currentEst1RM > this._bestEstimatedOneRepMaxKg) {
      this._bestEstimatedOneRepMaxKg = currentEst1RM;
      this._bestEstimated1RMReps = safeReps;
      this._bestEstimated1RMWeightKg = safeWeight;
      this._bestEstimated1RMDate = date;
      isNew1RMPR = true;
    }

    return {
      isNewWeightPR,
      isNew1RMPR,
      prevWeight,
      prev1RM,
      newWeight: this._bestWeightKg,
      new1RM: this._bestEstimatedOneRepMaxKg,
    };
  }

  public toJSON(): IPersonalRecordData {
    return {
      exerciseName: this._exerciseName,
      bestWeightKg: this._bestWeightKg,
      bestWeightReps: this._bestWeightReps,
      bestWeightDate: this._bestWeightDate,
      bestEstimatedOneRepMaxKg: this._bestEstimatedOneRepMaxKg,
      bestEstimated1RMReps: this._bestEstimated1RMReps,
      bestEstimated1RMWeightKg: this._bestEstimated1RMWeightKg,
      bestEstimated1RMDate: this._bestEstimated1RMDate,
      totalSetsCompleted: this._totalSets,
      lastLoggedDate: this._bestWeightDate,
    };
  }

  public static fromJSON(json: IPersonalRecordData): PersonalRecord {
    return new PersonalRecord({
      exerciseName: json.exerciseName,
      bestWeightKg: json.bestWeightKg,
      bestWeightReps: json.bestWeightReps,
      bestWeightDate: json.bestWeightDate,
      bestEstimatedOneRepMaxKg: json.bestEstimatedOneRepMaxKg,
      bestEstimated1RMReps: json.bestEstimated1RMReps,
      bestEstimated1RMWeightKg: json.bestEstimated1RMWeightKg,
      bestEstimated1RMDate: json.bestEstimated1RMDate,
      totalSets: json.totalSetsCompleted,
    });
  }
}

/**
 * PersonalRecordManager encapsulates calculation and caching of personal records
 * across all historical set logs for a given athlete.
 */
export class PersonalRecordManager {
  private _tableName: string = STORAGE_KEYS.SET_LOGS;

  /**
   * Computes all PersonalRecord instances for a user by aggregating their set_logs.
   */
  public getRecordsForUser(userId: string): PersonalRecord[] {
    try {
      const allLogs = StorageLayer.getTable<ISetLogData>(this._tableName);
      const userLogs = allLogs.filter((log) => log.userId === userId);

      const prMap = new Map<string, PersonalRecord>();

      // Sort chronologically ascending to playback progression
      const sorted = [...userLogs].sort(
        (a, b) => new Date(a.date || a.createdAt || 0).getTime() - new Date(b.date || b.createdAt || 0).getTime()
      );

      for (const log of sorted) {
        if (!log.exerciseName) continue;
        const name = log.exerciseName.trim();
        let pr = prMap.get(name);
        if (!pr) {
          pr = new PersonalRecord({ exerciseName: name });
          prMap.set(name, pr);
        }
        pr.recordSet(log.weightKg, log.reps, log.date || log.createdAt || new Date().toISOString());
      }

      // Return sorted alphabetically by exercise name
      return Array.from(prMap.values()).sort((a, b) =>
        a.exerciseName.localeCompare(b.exerciseName)
      );
    } catch (err) {
      console.warn('[PersonalRecordManager] getRecordsForUser failed:', err);
      return [];
    }
  }

  /**
   * Retrieves the PersonalRecord for a specific exercise.
   */
  public getRecordForExercise(userId: string, exerciseName: string): PersonalRecord | null {
    const records = this.getRecordsForUser(userId);
    return records.find((r) => r.exerciseName.toLowerCase() === exerciseName.toLowerCase().trim()) || null;
  }

  /**
   * Tests whether a candidate set would constitute a new Personal Record before or after saving.
   */
  public testCandidateSet(
    userId: string,
    exerciseName: string,
    weightKg: number,
    reps: number
  ): {
    isWeightPR: boolean;
    is1RMPR: boolean;
    est1RM: number;
    prevBestWeight: number;
    prevBest1RM: number;
  } {
    const existing = this.getRecordForExercise(userId, exerciseName);
    const est1RM = PersonalRecord.calculate1RM(weightKg, reps);

    if (!existing || existing.totalSets === 0) {
      // First time logging this exercise: constitutes an initial benchmark PR
      const isMeaningful = weightKg > 0 || reps > 0;
      return {
        isWeightPR: isMeaningful && weightKg > 0,
        is1RMPR: isMeaningful && est1RM > 0,
        est1RM,
        prevBestWeight: 0,
        prevBest1RM: 0,
      };
    }

    const isWeightPR = weightKg > existing.bestWeightKg;
    const is1RMPR = est1RM > existing.bestEstimatedOneRepMaxKg;

    return {
      isWeightPR,
      is1RMPR,
      est1RM,
      prevBestWeight: existing.bestWeightKg,
      prevBest1RM: existing.bestEstimatedOneRepMaxKg,
    };
  }
}
