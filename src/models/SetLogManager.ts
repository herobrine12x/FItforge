import { IProgressiveOverloadHint, ISetLogData } from './types';
import { StorageLayer, STORAGE_KEYS } from './storage';

/**
 * OOP Principle: Encapsulation & Separation of Concerns
 * SetLogManager isolates transactions for the 'set_logs' table:
 * (id, userId, recordId, exerciseName, setNumber, weightKg, reps)
 * and computes progressive overload recommendations adhering strictly
 * to the 5% maximum progressive threshold constraint.
 */
export class SetLogManager {
  private _tableName: string = STORAGE_KEYS.SET_LOGS;

  /**
   * Helper: Loads all set logs from storage
   */
  private loadAll(): ISetLogData[] {
    try {
      return StorageLayer.getTable<ISetLogData>(this._tableName);
    } catch (err) {
      console.warn('[SetLogManager] Failed to load table:', err);
      return [];
    }
  }

  /**
   * Helper: Persists all set logs to storage
   */
  private saveAll(rows: ISetLogData[]): boolean {
    try {
      return StorageLayer.saveTable(this._tableName, rows);
    } catch (err) {
      console.warn('[SetLogManager] Failed to persist table:', err);
      return false;
    }
  }

  /**
   * Inline validation rule: weight 0 to 500 kg, reps 1 to 100
   */
  public static validate(
    weightKg: number | string,
    reps: number | string
  ): {
    isValid: boolean;
    weightError?: string;
    repsError?: string;
    sanitizedWeight: number;
    sanitizedReps: number;
  } {
    const numWeight = Number(weightKg);
    const numReps = Number(reps);

    let weightError: string | undefined;
    let repsError: string | undefined;

    if (isNaN(numWeight)) {
      weightError = 'Enter a valid number for weight.';
    } else if (numWeight < 0 || numWeight > 500) {
      weightError = 'Weight must be between 0 and 500 kg.';
    }

    if (isNaN(numReps)) {
      repsError = 'Enter a valid number for reps.';
    } else if (numReps < 1 || numReps > 100 || !Number.isInteger(numReps)) {
      repsError = 'Reps must be a whole number between 1 and 100.';
    }

    const sanitizedWeight = isNaN(numWeight) ? 0 : Math.min(500, Math.max(0, numWeight));
    const sanitizedReps = isNaN(numReps) ? 10 : Math.min(100, Math.max(1, Math.round(numReps)));

    return {
      isValid: !weightError && !repsError,
      weightError,
      repsError,
      sanitizedWeight,
      sanitizedReps,
    };
  }

  /**
   * Adds a single set log to the set_logs table
   */
  public create(
    data: Omit<ISetLogData, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ): ISetLogData {
    const all = this.loadAll();
    const id = data.id || `set_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newRow: ISetLogData = {
      id,
      userId: data.userId,
      recordId: data.recordId,
      exerciseName: data.exerciseName.trim(),
      setNumber: Math.max(1, Number(data.setNumber) || 1),
      weightKg: Math.min(500, Math.max(0, Number(data.weightKg) || 0)),
      reps: Math.min(100, Math.max(1, Math.round(Number(data.reps) || 1))),
      targetReps: data.targetReps,
      targetWeightKg: data.targetWeightKg,
      date: data.date || now,
      createdAt: data.createdAt || now,
    };

    all.push(newRow);
    this.saveAll(all);
    return newRow;
  }

  /**
   * Persists a batch of set logs (e.g. when saving a workout session)
   */
  public createBatch(
    items: Array<Omit<ISetLogData, 'id' | 'createdAt'> & { id?: string; createdAt?: string }>
  ): ISetLogData[] {
    const all = this.loadAll();
    const now = new Date().toISOString();
    const created: ISetLogData[] = [];

    for (const item of items) {
      const id = item.id || `set_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const row: ISetLogData = {
        id,
        userId: item.userId,
        recordId: item.recordId,
        exerciseName: item.exerciseName.trim(),
        setNumber: Math.max(1, Number(item.setNumber) || 1),
        weightKg: Math.min(500, Math.max(0, Number(item.weightKg) || 0)),
        reps: Math.min(100, Math.max(1, Math.round(Number(item.reps) || 1))),
        targetReps: item.targetReps,
        targetWeightKg: item.targetWeightKg,
        date: item.date || now,
        createdAt: item.createdAt || now,
      };
      all.push(row);
      created.push(row);
    }

    this.saveAll(all);
    return created;
  }

  /**
   * Retrieves all set logs for a given user
   */
  public getLogsForUser(userId: string): ISetLogData[] {
    return this.loadAll().filter((s) => s.userId === userId);
  }

  /**
   * Retrieves all set logs for a specific exercise for a user
   */
  public getLogsForExercise(userId: string, exerciseName: string): ISetLogData[] {
    const target = exerciseName.toLowerCase().trim();
    return this.loadAll().filter(
      (s) => s.userId === userId && s.exerciseName.toLowerCase().trim() === target
    );
  }

  /**
   * Retrieves the most recently logged set for an exercise (useful for prefilling)
   */
  public getLastSetForExercise(userId: string, exerciseName: string): ISetLogData | null {
    const logs = this.getLogsForExercise(userId, exerciseName);
    if (logs.length === 0) return null;

    // Return the latest one by date/createdAt
    return logs.sort(
      (a, b) =>
        new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
    )[0];
  }

  /**
   * Retrieves all sets from the most recent previous session of an exercise
   */
  public getLastSessionSetsForExercise(userId: string, exerciseName: string): ISetLogData[] {
    const logs = this.getLogsForExercise(userId, exerciseName);
    if (logs.length === 0) return [];

    // Group logs by recordId or distinct date
    const sorted = [...logs].sort(
      (a, b) =>
        new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
    );

    const latestRecordId = sorted[0].recordId;
    const sessionSets = sorted.filter((s) => s.recordId === latestRecordId);
    return sessionSets.sort((a, b) => a.setNumber - b.setNumber);
  }

  /**
   * Progressive Overload Hint Engine:
   * "before each exercise, show a suggestion (for example, Last time 20 kg x 10. Try 21 kg or 11 reps).
   * Suggest a small increase only when the last session hit all target reps.
   * Never suggest more than 5 percent."
   */
  public generateProgressiveOverloadHint(
    userId: string,
    exerciseName: string,
    defaultTargetReps: number = 10,
    defaultTargetWeightKg: number = 0
  ): IProgressiveOverloadHint {
    const sessionSets = this.getLastSessionSetsForExercise(userId, exerciseName);

    if (sessionSets.length === 0) {
      return {
        exerciseName,
        hasHistory: false,
        suggestedWeightKg: defaultTargetWeightKg,
        suggestedReps: defaultTargetReps,
        message: 'First time logging this exercise. Focus on strict form and finding a comfortable working weight.',
        badgeText: 'Baseline Session',
      };
    }

    // Determine the working weight and reps from the last session
    // Find representative set (heaviest or last completed set)
    const validSets = sessionSets.filter((s) => s.reps > 0);
    if (validSets.length === 0) {
      return {
        exerciseName,
        hasHistory: false,
        message: 'First time logging this exercise. Establish a baseline with clean form.',
        badgeText: 'Baseline Session',
      };
    }

    // Pick top working set
    const topSet = [...validSets].sort((a, b) => {
      if (b.weightKg !== a.weightKg) return b.weightKg - a.weightKg;
      return b.reps - a.reps;
    })[0];

    const lastWeight = topSet.weightKg;
    const lastReps = topSet.reps;
    const targetReps = topSet.targetReps || defaultTargetReps;

    // Check if user hit all target reps across all sets in that session
    const allHit = validSets.every((s) => {
      const needed = s.targetReps || targetReps;
      return s.reps >= needed;
    });

    if (allHit) {
      // Small progressive increase strictly <= 5%
      let suggestedWeight = lastWeight;
      let suggestedReps = lastReps + 1;

      if (lastWeight > 0) {
        // Calculate 5% increase and ensure suggestedWeight <= lastWeight * 1.05
        const maxIncrement = lastWeight * 0.05;
        // Smallest realistic jump: 0.5 kg or 1 kg if increment allows, else precise 5%
        let increment = 0;
        if (maxIncrement >= 2.5) {
          increment = 2.5;
        } else if (maxIncrement >= 1) {
          increment = 1.0;
        } else if (maxIncrement >= 0.5) {
          increment = 0.5;
        } else {
          increment = Math.floor(maxIncrement * 10) / 10;
        }

        // Guarantee <= 5%
        if (lastWeight + increment > lastWeight * 1.05001) {
          increment = Math.floor(lastWeight * 0.05 * 10) / 10;
        }

        suggestedWeight = Math.round((lastWeight + increment) * 10) / 10;
      }

      const weightPart =
        suggestedWeight > lastWeight ? `${suggestedWeight} kg` : '';
      const repsPart = `${suggestedReps} reps`;
      const orPart = weightPart ? `${weightPart} or ${repsPart}` : repsPart;

      return {
        exerciseName,
        hasHistory: true,
        lastWeightKg: lastWeight,
        lastReps,
        lastTargetReps: targetReps,
        allTargetRepsHit: true,
        suggestedWeightKg: suggestedWeight,
        suggestedReps,
        message: `Last time ${lastWeight > 0 ? `${lastWeight} kg x ` : ''}${lastReps} reps. All target reps achieved! Try ${orPart}.`,
        badgeText: '+5% Overload',
      };
    } else {
      // Target reps not hit: consolidate current weight and repeat
      return {
        exerciseName,
        hasHistory: true,
        lastWeightKg: lastWeight,
        lastReps,
        lastTargetReps: targetReps,
        allTargetRepsHit: false,
        suggestedWeightKg: lastWeight,
        suggestedReps: targetReps,
        message: `Last time ${lastWeight > 0 ? `${lastWeight} kg x ` : ''}${lastReps} reps (${targetReps} target). Consolidate ${lastWeight > 0 ? `${lastWeight} kg` : 'form'} and aim for all ${targetReps} reps before increasing.`,
        badgeText: 'Consolidation',
      };
    }
  }
}
