import { IScheduledWorkoutData, ScheduleRepeat, ScheduleStatus } from './types';

/**
 * Format date to YYYY-MM-DD local string
 */
export function formatLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatLocalDateString(new Date());
}

/**
 * OOP Principle: Encapsulation & Domain Invariants
 * The ScheduledWorkout class models a calendar workout commitment.
 * Enforces date validity (cannot be scheduled in the past for new items).
 */
export class ScheduledWorkout {
  private _id: string;
  private _userId: string;
  private _routineId: string;
  private _routineName: string;
  private _targetMuscle: string;
  private _date: string; // YYYY-MM-DD
  private _time: string; // HH:mm or ''
  private _repeat: ScheduleRepeat;
  private _status: ScheduleStatus;
  private _notes: string;
  private _createdAt: string;
  private _updatedAt: string;

  constructor(
    id: string,
    userId: string,
    routineId: string,
    date: string,
    time: string = '',
    repeat: ScheduleRepeat = 'never',
    status: ScheduleStatus = 'planned',
    options?: {
      routineName?: string;
      targetMuscle?: string;
      notes?: string;
      createdAt?: string;
      updatedAt?: string;
      isNew?: boolean;
    }
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('ScheduledWorkout ID cannot be empty.');
    }
    if (!userId || userId.trim().length === 0) {
      throw new Error('ScheduledWorkout userId cannot be empty.');
    }
    if (!routineId || routineId.trim().length === 0) {
      throw new Error('ScheduledWorkout routineId cannot be empty.');
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD.');
    }

    // Validate that the date is not in the past for new items
    if (options?.isNew) {
      const today = getTodayDateString();
      if (date < today) {
        throw new Error('Cannot schedule a new workout in the past.');
      }
    }

    this._id = id.trim();
    this._userId = userId.trim();
    this._routineId = routineId.trim();
    this._date = date;
    this._time = (time || '').trim();
    this._repeat = repeat;
    this._status = status;
    this._routineName = options?.routineName || ScheduledWorkout.resolveRoutineName(routineId);
    this._targetMuscle = options?.targetMuscle || 'Full Body';
    this._notes = (options?.notes || '').trim();
    this._createdAt = options?.createdAt || new Date().toISOString();
    this._updatedAt = options?.updatedAt || new Date().toISOString();
  }

  // Getters (Encapsulation)
  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get routineId(): string {
    return this._routineId;
  }

  public get routineName(): string {
    return this._routineName;
  }

  public get targetMuscle(): string {
    return this._targetMuscle;
  }

  public get date(): string {
    return this._date;
  }

  public get time(): string {
    return this._time;
  }

  public get repeat(): ScheduleRepeat {
    return this._repeat;
  }

  public get status(): ScheduleStatus {
    return this._status;
  }

  public get notes(): string {
    return this._notes;
  }

  public get createdAt(): string {
    return this._createdAt;
  }

  public get updatedAt(): string {
    return this._updatedAt;
  }

  // Setters with validation
  public set date(newDate: string) {
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD.');
    }
    this._date = newDate;
    this._updatedAt = new Date().toISOString();
  }

  public set time(newTime: string) {
    this._time = (newTime || '').trim();
    this._updatedAt = new Date().toISOString();
  }

  public set repeat(newRepeat: ScheduleRepeat) {
    this._repeat = newRepeat;
    this._updatedAt = new Date().toISOString();
  }

  public set status(newStatus: ScheduleStatus) {
    this._status = newStatus;
    this._updatedAt = new Date().toISOString();
  }

  public set routineId(newRoutineId: string) {
    if (!newRoutineId || newRoutineId.trim().length === 0) {
      throw new Error('Routine ID cannot be empty.');
    }
    this._routineId = newRoutineId.trim();
    this._routineName = ScheduledWorkout.resolveRoutineName(newRoutineId);
    this._updatedAt = new Date().toISOString();
  }

  public set routineName(name: string) {
    this._routineName = name;
    this._updatedAt = new Date().toISOString();
  }

  public set notes(newNotes: string) {
    this._notes = (newNotes || '').trim();
    this._updatedAt = new Date().toISOString();
  }

  // Domain Actions
  public markDone(): void {
    this._status = 'done';
    this._updatedAt = new Date().toISOString();
  }

  public markSkipped(): void {
    this._status = 'skipped';
    this._updatedAt = new Date().toISOString();
  }

  public markMissed(): void {
    this._status = 'missed';
    this._updatedAt = new Date().toISOString();
  }

  public reschedule(newDate: string, newTime?: string): void {
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      throw new Error('Invalid reschedule date. Expected YYYY-MM-DD.');
    }
    this._date = newDate;
    if (newTime !== undefined) {
      this._time = newTime;
    }
    this._status = 'planned';
    this._updatedAt = new Date().toISOString();
  }

  public toJSON(): IScheduledWorkoutData {
    return {
      id: this._id,
      userId: this._userId,
      routineId: this._routineId,
      routineName: this._routineName,
      targetMuscle: this._targetMuscle,
      date: this._date,
      time: this._time,
      repeat: this._repeat,
      status: this._status,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public static fromJSON(data: IScheduledWorkoutData): ScheduledWorkout {
    return new ScheduledWorkout(
      data.id,
      data.userId,
      data.routineId,
      data.date,
      data.time || '',
      data.repeat || 'never',
      data.status || 'planned',
      {
        routineName: data.routineName,
        targetMuscle: data.targetMuscle,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        isNew: false,
      }
    );
  }

  public static createNew(
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
  ): ScheduledWorkout {
    const id = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return new ScheduledWorkout(
      id,
      userId,
      routineId,
      date,
      time,
      repeat,
      'planned',
      {
        ...options,
        isNew: true,
      }
    );
  }

  public static resolveRoutineName(routineId: string): string {
    const mapping: Record<string, string> = {
      push: 'Push Split',
      pull: 'Pull Split',
      legs_core: 'Legs & Core',
      full_body: 'Full Body',
      upper_body: 'Upper Body',
      home_bodyweight: 'Home Bodyweight',
      cardio_hiit: 'Cardio HIIT',
      rest: 'Rest & Recovery Day',
    };
    return mapping[routineId.toLowerCase()] || routineId;
  }
}
