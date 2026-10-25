import { StorageLayer, STORAGE_KEYS } from './storage';
import { IWorkoutRecordData } from './types';
import { WorkoutRecord } from './WorkoutRecord';

/**
 * OOP Principle: Encapsulation & Separation of Concerns
 * RecordManager isolates data persistence and transactional CRUD logic
 * for workout history records stored in the 'workout_records' table.
 */
export class RecordManager {
  private _tableName: string = STORAGE_KEYS.WORKOUT_RECORDS;

  /**
   * Helper: Loads all records from storage table safely
   */
  private loadRecords(): WorkoutRecord[] {
    try {
      const rows = StorageLayer.getTable<IWorkoutRecordData>(this._tableName);
      return rows.map((r) => WorkoutRecord.fromJSON(r));
    } catch (error) {
      console.warn('[RecordManager] Failed to load records:', error);
      return [];
    }
  }

  /**
   * Helper: Persists all records to storage table safely
   */
  private persistRecords(records: WorkoutRecord[]): boolean {
    try {
      const rows = records.map((r) => r.toJSON());
      return StorageLayer.saveTable(this._tableName, rows);
    } catch (error) {
      console.warn('[RecordManager] Failed to persist records:', error);
      return false;
    }
  }

  /**
   * CREATE: Adds a new workout record
   */
  public create(
    data: Omit<IWorkoutRecordData, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): WorkoutRecord {
    try {
      const records = this.loadRecords();
      const newRecord = new WorkoutRecord({
        ...data,
        id: data.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      records.unshift(newRecord);
      this.persistRecords(records);
      return newRecord;
    } catch (error) {
      console.error('[RecordManager] create() failed:', error);
      throw error;
    }
  }

  /**
   * Compatibility alias for create()
   */
  public addRecord(
    data: Omit<IWorkoutRecordData, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): WorkoutRecord {
    return this.create(data);
  }

  public createRecord(
    data: Omit<IWorkoutRecordData, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): WorkoutRecord {
    return this.create(data);
  }

  /**
   * READ ALL: Retrieves all records associated with a specific userId
   */
  public readAll(userId: string): WorkoutRecord[] {
    try {
      const records = this.loadRecords();
      return records
        .filter((r) => r.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.warn('[RecordManager] readAll() failed:', error);
      return [];
    }
  }

  /**
   * Compatibility alias for readAll()
   */
  public getByUserId(userId: string): WorkoutRecord[] {
    return this.readAll(userId);
  }

  public getAll(): WorkoutRecord[] {
    return this.loadRecords().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * READ ONE: Retrieves a single record by its primary key id
   */
  public getById(id: string): WorkoutRecord | undefined {
    try {
      const records = this.loadRecords();
      return records.find((r) => r.id === id);
    } catch (error) {
      console.warn('[RecordManager] getById() failed:', error);
      return undefined;
    }
  }

  /**
   * UPDATE: Updates attributes of an existing record
   */
  public update(id: string, updates: Partial<IWorkoutRecordData>): WorkoutRecord {
    try {
      const records = this.loadRecords();
      const index = records.findIndex((r) => r.id === id);
      if (index === -1) {
        throw new Error(`Record with ID "${id}" was not found.`);
      }

      const target = records[index];
      if (updates.splitName !== undefined) target.splitName = updates.splitName;
      if (updates.date !== undefined) target.date = updates.date;
      if (updates.durationMinutes !== undefined) target.durationMinutes = updates.durationMinutes;
      if (updates.caloriesBurned !== undefined) target.caloriesBurned = updates.caloriesBurned;
      if (updates.exercisesCompleted !== undefined) target.exercisesCompleted = updates.exercisesCompleted;
      if (updates.totalExercises !== undefined) target.totalExercises = updates.totalExercises;
      if (updates.notes !== undefined) target.notes = updates.notes;

      this.persistRecords(records);
      return target;
    } catch (error) {
      console.error('[RecordManager] update() failed:', error);
      throw error;
    }
  }

  /**
   * Compatibility alias for update()
   */
  public updateRecord(id: string, updates: Partial<IWorkoutRecordData>): WorkoutRecord {
    return this.update(id, updates);
  }

  /**
   * DELETE: Removes a record by id
   */
  public delete(id: string): boolean {
    try {
      const records = this.loadRecords();
      const initialLength = records.length;
      const filtered = records.filter((r) => r.id !== id);

      if (filtered.length !== initialLength) {
        this.persistRecords(filtered);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[RecordManager] delete() failed:', error);
      return false;
    }
  }

  /**
   * Compatibility alias for delete()
   */
  public deleteRecord(id: string): boolean {
    return this.delete(id);
  }

  /**
   * Clears all workout history records for a specific user.
   * Returns the count of deleted records.
   */
  public clearRecordsByUserId(userId: string): number {
    try {
      const records = this.loadRecords();
      const initialCount = records.length;
      const remaining = records.filter((r) => r.userId !== userId);
      const deletedCount = initialCount - remaining.length;
      if (deletedCount > 0) {
        this.persistRecords(remaining);
      }
      return deletedCount;
    } catch (error) {
      console.warn('[RecordManager] clearRecordsByUserId() failed:', error);
      return 0;
    }
  }

  /**
   * Compatibility search & filter
   */
  public searchAndFilter(userId: string, query: string = '', splitFilter: string = 'all'): WorkoutRecord[] {
    let list = this.readAll(userId);
    if (splitFilter !== 'all') {
      list = list.filter((r) => r.splitName.toLowerCase().includes(splitFilter.toLowerCase()));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => r.splitName.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q));
    }
    return list;
  }

  /**
   * Compatibility stats aggregator
   */
  public getStats(userId: string) {
    const records = this.readAll(userId);
    const totalWorkouts = records.length;
    const totalMinutes = records.reduce((acc, r) => acc + r.durationMinutes, 0);
    const totalCalories = records.reduce((acc, r) => acc + r.caloriesBurned, 0);
    return {
      totalWorkouts,
      totalMinutes,
      totalCalories,
      avgRating: 5,
      splitCounts: { push: 0, pull: 0, legs_core: 0, full_body: 0 },
    };
  }

  /**
   * Seed batch: Inserts records if table is currently empty
   */
  public seedIfEmpty(defaultRecords: IWorkoutRecordData[]): void {
    try {
      const current = this.loadRecords();
      if (current.length === 0) {
        const models = defaultRecords.map((d) => new WorkoutRecord(d));
        this.persistRecords(models);
      }
    } catch (error) {
      console.warn('[RecordManager] seedIfEmpty() failed:', error);
    }
  }
}
