import { IWorkoutRecordData, WorkoutExerciseLog } from './types';

/**
 * OOP Principle: Encapsulation
 * WorkoutRecord encapsulates individual workout performance metrics and provides
 * validated getters and setters to protect data integrity against invalid mutations.
 */
export class WorkoutRecord {
  private _id: string;
  private _userId: string;
  private _splitName: string;
  private _date: string;
  private _durationMinutes: number;
  private _caloriesBurned: number;
  private _exercisesCompleted: number;
  private _totalExercises: number;
  private _notes: string;
  private _createdAt: string;
  private _updatedAt: string;

  constructor(data: IWorkoutRecordData) {
    const userId = data.userId;
    const splitName = data.splitName || data.splitType || data.title || 'Push';

    if (!userId || userId.trim().length === 0) {
      throw new Error('WorkoutRecord requires a valid userId foreign key.');
    }
    if (!splitName || splitName.trim().length === 0) {
      throw new Error('WorkoutRecord requires a valid splitName.');
    }

    this._id = data.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this._userId = userId.trim();
    this._splitName = splitName.trim();
    this._date = data.date || new Date().toISOString();
    this._durationMinutes = Math.max(1, Math.round(data.durationMinutes || 30));
    this._caloriesBurned = Math.max(0, Math.round(data.caloriesBurned || 0));
    this._exercisesCompleted = Math.max(0, Math.round(data.exercisesCompleted ?? 5));
    this._totalExercises = Math.max(1, Math.round(data.totalExercises || 5));
    this._notes = data.notes || '';
    this._createdAt = data.createdAt || new Date().toISOString();
    this._updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Getters & Setters
  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get splitName(): string {
    return this._splitName;
  }

  public set splitName(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Split name cannot be empty.');
    }
    this._splitName = value.trim();
    this.touch();
  }

  public get date(): string {
    return this._date;
  }

  public set date(value: string) {
    if (!value) throw new Error('Date cannot be empty.');
    this._date = value;
    this.touch();
  }

  public get durationMinutes(): number {
    return this._durationMinutes;
  }

  public set durationMinutes(value: number) {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      throw new Error('Duration must be a positive number of minutes.');
    }
    this._durationMinutes = Math.round(value);
    this.touch();
  }

  public get caloriesBurned(): number {
    return this._caloriesBurned;
  }

  public set caloriesBurned(value: number) {
    if (typeof value !== 'number' || isNaN(value) || value < 0) {
      throw new Error('Calories burned cannot be negative.');
    }
    this._caloriesBurned = Math.round(value);
    this.touch();
  }

  public get exercisesCompleted(): number {
    return this._exercisesCompleted;
  }

  public set exercisesCompleted(value: number) {
    if (typeof value !== 'number' || isNaN(value) || value < 0) {
      throw new Error('Exercises completed cannot be negative.');
    }
    this._exercisesCompleted = Math.round(value);
    this.touch();
  }

  public get totalExercises(): number {
    return this._totalExercises;
  }

  public set totalExercises(value: number) {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      throw new Error('Total exercises must be greater than zero.');
    }
    this._totalExercises = Math.round(value);
    this.touch();
  }

  public get notes(): string {
    return this._notes;
  }

  public set notes(value: string) {
    this._notes = value || '';
    this.touch();
  }

  public get createdAt(): string {
    return this._createdAt;
  }

  public get updatedAt(): string {
    return this._updatedAt;
  }

  // Backwards compatibility aliases
  public get title(): string {
    return `${this._splitName} Session`;
  }

  public set title(val: string) {
    this.splitName = val;
  }

  public get splitType(): any {
    return this._splitName;
  }

  public set splitType(val: any) {
    this.splitName = String(val);
  }

  public get rating(): number {
    return 5;
  }

  public get exercises(): WorkoutExerciseLog[] {
    return [];
  }

  public get totalTonnageKg(): number {
    return 0;
  }

  public get completedSetsCount(): number {
    return this._exercisesCompleted;
  }

  private touch(): void {
    this._updatedAt = new Date().toISOString();
  }

  public toJSON(): IWorkoutRecordData {
    return {
      id: this._id,
      userId: this._userId,
      splitName: this._splitName,
      title: `${this._splitName} Session`,
      splitType: this._splitName,
      date: this._date,
      durationMinutes: this._durationMinutes,
      caloriesBurned: this._caloriesBurned,
      exercisesCompleted: this._exercisesCompleted,
      totalExercises: this._totalExercises,
      notes: this._notes,
      rating: 5,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public static fromJSON(data: IWorkoutRecordData): WorkoutRecord {
    return new WorkoutRecord(data);
  }
}
