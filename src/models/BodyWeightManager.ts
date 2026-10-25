import { IBodyWeightEntry, IMemberProfileData } from './types';
import { StorageLayer, STORAGE_KEYS } from './storage';

/**
 * OOP Principle: Encapsulation & Separation of Concerns
 * BodyWeightManager handles CRUD for the 'body_weight' table
 * (id, userId, date, weightKg, notes) and syncs biometric updates
 * with the athlete's member profile.
 */
export class BodyWeightManager {
  private _tableName: string = STORAGE_KEYS.BODY_WEIGHT;

  private loadAll(): IBodyWeightEntry[] {
    try {
      return StorageLayer.getTable<IBodyWeightEntry>(this._tableName);
    } catch (err) {
      console.warn('[BodyWeightManager] Failed to load table:', err);
      return [];
    }
  }

  private saveAll(rows: IBodyWeightEntry[]): boolean {
    try {
      return StorageLayer.saveTable(this._tableName, rows);
    } catch (err) {
      console.warn('[BodyWeightManager] Failed to save table:', err);
      return false;
    }
  }

  /**
   * Inline validation for body weight input (0 < weight <= 500 kg)
   */
  public static validate(weight: number | string): {
    isValid: boolean;
    error?: string;
    sanitized: number;
  } {
    const num = Number(weight);
    if (isNaN(num)) {
      return { isValid: false, error: 'Please enter a valid weight number.', sanitized: 70 };
    }
    if (num <= 0) {
      return { isValid: false, error: 'Weight must be greater than 0 kg.', sanitized: 70 };
    }
    if (num > 500) {
      return { isValid: false, error: 'Weight cannot exceed 500 kg.', sanitized: 500 };
    }
    return {
      isValid: true,
      sanitized: Math.round(num * 10) / 10,
    };
  }

  /**
   * Retrieves all weight logs for a user, sorted chronologically ascending
   */
  public getEntriesAscending(userId: string): IBodyWeightEntry[] {
    const entries = this.loadAll().filter((e) => e.userId === userId);
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Retrieves all weight logs for a user, sorted chronologically descending
   */
  public getEntriesDescending(userId: string): IBodyWeightEntry[] {
    const entries = this.loadAll().filter((e) => e.userId === userId);
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Adds a new body weight entry and automatically syncs the member profile
   */
  public addEntry(
    userId: string,
    weightKg: number,
    date: string = new Date().toISOString().split('T')[0],
    notes?: string
  ): IBodyWeightEntry {
    const validation = BodyWeightManager.validate(weightKg);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid weight value.');
    }

    const all = this.loadAll();
    const id = `bw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newEntry: IBodyWeightEntry = {
      id,
      userId,
      date,
      weightKg: validation.sanitized,
      notes: notes?.trim() || undefined,
      createdAt: now,
    };

    all.push(newEntry);
    this.saveAll(all);

    // Sync to profile if this entry is the most recent date
    this.syncLatestWeightToProfile(userId);

    return newEntry;
  }

  /**
   * Deletes a body weight entry
   */
  public deleteEntry(id: string, userId: string): boolean {
    const all = this.loadAll();
    const filtered = all.filter((e) => !(e.id === id && e.userId === userId));
    const changed = filtered.length !== all.length;
    if (changed) {
      this.saveAll(filtered);
      this.syncLatestWeightToProfile(userId);
    }
    return changed;
  }

  /**
   * Syncs the latest recorded weight into the member profile table
   */
  public syncLatestWeightToProfile(userId: string): void {
    try {
      const descending = this.getEntriesDescending(userId);
      if (descending.length === 0) return;

      const latestWeight = descending[0].weightKg;
      const profiles = StorageLayer.getTable<IMemberProfileData>(STORAGE_KEYS.PROFILES);
      const profile = profiles.find((p) => p.userId === userId);

      if (profile && profile.weightKg !== latestWeight) {
        profile.weightKg = latestWeight;
        profile.updatedAt = new Date().toISOString();
        StorageLayer.saveTable(STORAGE_KEYS.PROFILES, profiles);
      }
    } catch (err) {
      console.warn('[BodyWeightManager] Failed to sync profile:', err);
    }
  }

  /**
   * Calculates weight summary metrics (current, starting, change, min, max)
   */
  public getWeightStats(userId: string): {
    current: number | null;
    starting: number | null;
    change: number;
    min: number | null;
    max: number | null;
    count: number;
  } {
    const ascending = this.getEntriesAscending(userId);
    if (ascending.length === 0) {
      return {
        current: null,
        starting: null,
        change: 0,
        min: null,
        max: null,
        count: 0,
      };
    }

    const weights = ascending.map((e) => e.weightKg);
    const starting = weights[0];
    const current = weights[weights.length - 1];
    const change = Math.round((current - starting) * 10) / 10;
    const min = Math.min(...weights);
    const max = Math.max(...weights);

    return {
      current,
      starting,
      change,
      min,
      max,
      count: weights.length,
    };
  }
}
