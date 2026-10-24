import { DifficultyLevel, EquipmentType, ExerciseItem } from './types';

export function nameToKebabCase(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[/\\()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * OOP Principle: Encapsulation
 * The Exercise class encapsulates exercise specification attributes, validates
 * equipment and difficulty tiers, and derives a normalized image resource path.
 */
export class Exercise {
  private _id: string;
  private _name: string;
  private _targetMuscle: string;
  private _equipment: EquipmentType;
  private _difficulty: DifficultyLevel;
  private _imageUrl: string;
  private _formTip: string;

  // Prescribed attributes when selected into a WorkoutPlan routine
  public sets: number = 3;
  public reps: number | string = 10;
  public restSeconds: number = 60;
  public secondaryMuscles: string[] = [];
  public instructions: string[] = [];
  public defaultSets: number = 3;
  public defaultReps: number = 10;
  public suggestedRestSeconds: number = 60;

  constructor(
    id: string,
    name: string,
    targetMuscle: string,
    equipment: EquipmentType,
    difficulty: DifficultyLevel,
    formTip: string,
    customImageUrl?: string
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Exercise ID cannot be empty.');
    }
    if (!name || name.trim().length === 0) {
      throw new Error('Exercise name cannot be empty.');
    }
    if (!targetMuscle || targetMuscle.trim().length === 0) {
      throw new Error('Target muscle cannot be empty.');
    }

    this._id = id.trim();
    this._name = name.trim();
    this._targetMuscle = targetMuscle.trim();
    this._equipment = equipment;
    this._difficulty = difficulty;
    this._formTip = formTip.trim();
    this._imageUrl = customImageUrl || `/exercises/${nameToKebabCase(this._name)}.jpg`;
  }

  // Getters (Encapsulation)
  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get targetMuscle(): string {
    return this._targetMuscle;
  }

  public get equipment(): EquipmentType {
    return this._equipment;
  }

  public get difficulty(): DifficultyLevel {
    return this._difficulty;
  }

  public get imageUrl(): string {
    return this._imageUrl;
  }

  public get formTip(): string {
    return this._formTip;
  }

  // Compatibility getter
  public get tip(): string {
    return this._formTip;
  }

  /**
   * Produces a cloned exercise instance with specific prescribed sets, reps, and rest interval
   */
  public prescribe(sets: number, reps: number | string, restSeconds: number): Exercise {
    const clone = new Exercise(
      this._id,
      this._name,
      this._targetMuscle,
      this._equipment,
      this._difficulty,
      this._formTip,
      this._imageUrl
    );
    clone.sets = sets;
    clone.reps = reps;
    clone.restSeconds = restSeconds;
    clone.defaultSets = sets;
    clone.defaultReps = typeof reps === 'number' ? reps : 10;
    clone.suggestedRestSeconds = restSeconds;
    clone.secondaryMuscles = [...this.secondaryMuscles];
    clone.instructions = [...this.instructions];
    return clone;
  }

  public toJSON(): ExerciseItem {
    return {
      id: this._id,
      name: this._name,
      targetMuscle: this._targetMuscle,
      equipment: this._equipment,
      difficulty: this._difficulty,
      imageUrl: this._imageUrl,
      formTip: this._formTip,
      sets: this.sets,
      reps: this.reps,
      restSeconds: this.restSeconds,
      tip: this._formTip,
      secondaryMuscles: this.secondaryMuscles,
      instructions: this.instructions,
    };
  }

  public static fromJSON(data: any): Exercise {
    const ex = new Exercise(
      data.id || `ex_${Date.now()}`,
      data.name,
      data.targetMuscle || 'Full Body',
      (data.equipment as EquipmentType) || 'Bodyweight',
      (data.difficulty as DifficultyLevel) || 'Intermediate',
      data.formTip || data.tip || '',
      data.imageUrl
    );
    if (data.sets !== undefined) ex.sets = data.sets;
    if (data.reps !== undefined) ex.reps = data.reps;
    if (data.restSeconds !== undefined) ex.restSeconds = data.restSeconds;
    if (data.defaultSets !== undefined) ex.defaultSets = data.defaultSets;
    if (data.defaultReps !== undefined) ex.defaultReps = data.defaultReps;
    if (data.suggestedRestSeconds !== undefined) ex.suggestedRestSeconds = data.suggestedRestSeconds;
    if (data.secondaryMuscles && Array.isArray(data.secondaryMuscles)) {
      ex.secondaryMuscles = [...data.secondaryMuscles];
    }
    if (data.instructions && Array.isArray(data.instructions)) {
      ex.instructions = [...data.instructions];
    }
    return ex;
  }
}
