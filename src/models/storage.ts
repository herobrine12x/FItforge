/**
 * Storage Layer: Simulates relational database tables in localStorage.
 * Tables:
 * - 'users': credentials and auth entity records
 * - 'profiles': member biometric and goal records (FK: userId -> users.id)
 * - 'workout_records': individual workout session records (FK: userId -> users.id)
 * - 'settings': client configuration and current session pointer
 * 
 * Includes in-memory fallback for non-browser / Node.js test environments.
 * All storage interactions are wrapped in try/catch to ensure resilient execution.
 */

export const STORAGE_KEYS = {
  USERS: 'users',
  PROFILES: 'profiles',
  WORKOUT_RECORDS: 'workout_records',
  SETTINGS: 'settings',
  SCHEDULED_WORKOUTS: 'scheduled_workouts',
  WEEKLY_SCHEDULE: 'weekly_schedule',
  CUSTOM_ROUTINES: 'custom_routines',
  BADGES: 'badges',
} as const;

// In-memory backing store for SSR/Node test execution
const memoryStore: Map<string, string> = new Map();

function getRawItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStore.get(key) || null;
    }
  }
  return memoryStore.get(key) || null;
}

function setRawItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  } else {
    memoryStore.set(key, value);
  }
}

function removeRawItem(key: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
  } else {
    memoryStore.delete(key);
  }
}

export class StorageLayer {
  public static getTable<T>(tableName: string): T[] {
    try {
      const raw = getRawItem(tableName);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn(`[StorageLayer] Failed to read table "${tableName}":`, error);
      return [];
    }
  }

  public static saveTable<T>(tableName: string, rows: T[]): boolean {
    try {
      setRawItem(tableName, JSON.stringify(rows));
      return true;
    } catch (error) {
      console.warn(`[StorageLayer] Failed to write table "${tableName}":`, error);
      return false;
    }
  }

  public static getSettings<T extends Record<string, unknown>>(defaultValues: T): T {
    try {
      const raw = getRawItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return defaultValues;
      return { ...defaultValues, ...JSON.parse(raw) };
    } catch (error) {
      console.warn(`[StorageLayer] Failed to read settings:`, error);
      return defaultValues;
    }
  }

  public static saveSettings<T extends Record<string, unknown>>(settings: T): boolean {
    try {
      setRawItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.warn(`[StorageLayer] Failed to save settings:`, error);
      return false;
    }
  }

  public static clearAll(): void {
    try {
      removeRawItem(STORAGE_KEYS.USERS);
      removeRawItem(STORAGE_KEYS.PROFILES);
      removeRawItem(STORAGE_KEYS.WORKOUT_RECORDS);
      removeRawItem(STORAGE_KEYS.SETTINGS);
      memoryStore.clear();
    } catch (error) {
      console.warn(`[StorageLayer] Failed to clear storage:`, error);
    }
  }
}
