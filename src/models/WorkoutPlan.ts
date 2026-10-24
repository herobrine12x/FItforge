import { Exercise } from './Exercise';
import { ExerciseLibrary } from './ExerciseLibrary';
import { EquipmentType, ExperienceLevel } from './types';

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
function pseudoRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * OOP Principle: Abstraction & Polymorphism
 * WorkoutPlan is an abstract base class establishing the contract for training splits.
 * Subclasses implement polymorphic getExercises(level, availableEquipment) querying the ExerciseLibrary pool
 * and define split-specific MET values for calorie calculation.
 * Centralizes equipment filtering and bodyweight fallbacks polymorphically.
 */
export abstract class WorkoutPlan {
  protected _name: string;
  protected _currentSeed: number = 0;
  protected _currentLevel: ExperienceLevel = 'Intermediate';
  protected _availableEquipment: EquipmentType[] = [
    'Bodyweight',
    'Dumbbell',
    'Barbell',
    'Machine',
    'Cable',
  ];
  protected _hasEquipmentSwaps: boolean = false;

  constructor(name: string, _experienceLevel?: any, _fitnessGoal?: any) {
    this._name = name;
  }

  public get name(): string {
    return this._name;
  }

  public get splitType(): string {
    return this._name;
  }

  public get currentSeed(): number {
    return this._currentSeed;
  }

  public get hasEquipmentSwaps(): boolean {
    return this._hasEquipmentSwaps;
  }

  public get availableEquipment(): EquipmentType[] {
    return this._availableEquipment;
  }

  public set availableEquipment(equipment: EquipmentType[] | undefined | null) {
    if (equipment && equipment.length > 0) {
      this._availableEquipment = [...equipment];
      if (!this._availableEquipment.includes('Bodyweight')) {
        this._availableEquipment.unshift('Bodyweight');
      }
    } else {
      this._availableEquipment = [
        'Bodyweight',
        'Dumbbell',
        'Barbell',
        'Machine',
        'Cable',
      ];
    }
  }

  /**
   * Checks if any exercises in the split pool match the user's available equipment
   */
  public hasMatchingExercises(availableEquipment?: EquipmentType[]): boolean {
    const allowed = availableEquipment && availableEquipment.length > 0
      ? availableEquipment
      : this._availableEquipment;
    const pool = this.getPool();
    return pool.some((ex) => allowed.includes(ex.equipment as EquipmentType));
  }

  /**
   * Retrieves the full exercise pool for this split from the ExerciseLibrary
   */
  public getPool(): Exercise[] {
    return ExerciseLibrary.getInstance().getPool(this._name);
  }

  /**
   * Abstract method: Subclasses provide their custom prescription of 5 exercises
   */
  public abstract getExercises(level: ExperienceLevel, availableEquipment?: EquipmentType[]): Exercise[];

  /**
   * Abstract method: Returns the Metabolic Equivalent of Task (MET) value for this split.
   */
  public abstract getMETValue(): number;

  /**
   * Concrete method: Calculates total calories burned during a session.
   * Formula: MET x weightKg x (minutes / 60)
   */
  public calculateCalories(weightKg: number, minutes: number): number {
    if (weightKg <= 0 || minutes <= 0) {
      return 0;
    }
    const met = this.getMETValue();
    const calories = met * weightKg * (minutes / 60);
    return Math.round(calories);
  }

  /**
   * Shuffles the exercise selection for this split using an optional seed.
   * Passing no seed or a numeric seed enables alternate deterministic sets.
   */
  public shuffle(seed?: number | string, availableEquipment?: EquipmentType[]): Exercise[] {
    if (typeof seed === 'number') {
      this._currentSeed = seed;
    } else if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      this._currentSeed = Math.abs(hash);
    } else {
      this._currentSeed = Math.floor(Math.random() * 100000) + 1;
    }

    return this.getExercises(this._currentLevel, availableEquipment || this._availableEquipment);
  }

  /**
   * Polymorphic helper algorithm for all subclasses:
   * Selects exactly 5 exercises from pool satisfying:
   * 1. Filters by user availableEquipment (Bodyweight always allowed).
   * 2. If filtered pool is too small, fills gap with closest bodyweight alternative.
   * 3. Sets hasEquipmentSwaps note flag when replacements are made.
   * 4. Matches requested level prescription (Beginner, Intermediate, Advanced).
   * 5. Must include at least 2 distinct target muscles where possible.
   * 6. Never repeats an exercise within the selection.
   * 7. Permuted deterministically by seed.
   * 8. Returns empty array if no exercises at all match the split pool.
   */
  protected selectFiveExercises(
    pool: Exercise[],
    level: ExperienceLevel,
    isTimedInterval: boolean = false,
    availableEquipment?: EquipmentType[]
  ): Exercise[] {
    this._currentLevel = level;
    this._hasEquipmentSwaps = false;
    const normalizedLevel = String(level).toLowerCase();

    // Determine allowed equipment (Bodyweight is always included)
    const allowedEquipment: EquipmentType[] =
      availableEquipment && availableEquipment.length > 0
        ? [...availableEquipment]
        : [...this._availableEquipment];

    if (!allowedEquipment.includes('Bodyweight')) {
      allowedEquipment.unshift('Bodyweight');
    }

    // 1. Filter candidate pool by equipment availability
    const matchingPool = pool.filter((ex) =>
      allowedEquipment.includes(ex.equipment as EquipmentType)
    );

    // Requirement 8: If no exercises at all match a split (for example Pull with no equipment), return empty
    if (matchingPool.length === 0) {
      this._hasEquipmentSwaps = false;
      return [];
    }

    // Configure sets, reps, rest interval based on difficulty tier
    let defaultSets = 4;
    let defaultReps: number | string = 10;
    let defaultRest = 60;

    if (isTimedInterval) {
      // Cardio HIIT interval timing
      if (normalizedLevel.includes('beg')) {
        defaultSets = 3;
        defaultReps = '30s work';
        defaultRest = 30;
      } else if (normalizedLevel.includes('adv')) {
        defaultSets = 5;
        defaultReps = '45s work';
        defaultRest = 15;
      } else {
        defaultSets = 4;
        defaultReps = '40s work';
        defaultRest = 20;
      }
    } else {
      // Resistance / Weight training
      if (normalizedLevel.includes('beg')) {
        defaultSets = 3;
        defaultReps = 10; // 10-12 reps
        defaultRest = 75; // 75-90s rest
      } else if (normalizedLevel.includes('adv')) {
        defaultSets = 5;
        defaultReps = 8; // 6-10 reps
        defaultRest = 45; // 45-60s rest
      } else {
        defaultSets = 4;
        defaultReps = 10; // 8-12 reps
        defaultRest = 60; // 60-75s rest
      }
    }

    // Score function based on level preference
    const scoreCandidate = (ex: Exercise): number => {
      const exDiff = ex.difficulty.toLowerCase();
      if (normalizedLevel.includes('beg')) {
        if (exDiff === 'beginner') return 3;
        if (exDiff === 'intermediate') return 2;
        return 1;
      }
      if (normalizedLevel.includes('adv')) {
        if (exDiff === 'advanced') return 3;
        if (exDiff === 'intermediate') return 2;
        return 1;
      }
      // Intermediate
      if (exDiff === 'intermediate') return 3;
      if (exDiff === 'advanced') return 2;
      return 2;
    };

    const candidates = [...matchingPool];

    // Deterministic shuffle with seed
    if (this._currentSeed !== 0) {
      const rand = pseudoRandom(this._currentSeed);
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
    }

    // Sort stable by score (so highest scored for the level appear first)
    candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));

    const selected: Exercise[] = [];
    const usedMuscles = new Set<string>();

    // Pass 1: Select top candidate
    if (candidates.length > 0) {
      selected.push(candidates[0]);
      usedMuscles.add(candidates[0].targetMuscle);
    }

    // Pass 2: Ensure at least a second distinct muscle group is chosen
    for (let i = 1; i < candidates.length; i++) {
      if (candidates[i].targetMuscle !== selected[0].targetMuscle) {
        selected.push(candidates[i]);
        usedMuscles.add(candidates[i].targetMuscle);
        break;
      }
    }

    // Pass 3: Fill up to 5 distinct exercises from matchingPool
    for (let i = 0; i < candidates.length && selected.length < 5; i++) {
      const cand = candidates[i];
      if (!selected.some((s) => s.id === cand.id || s.name === cand.name)) {
        selected.push(cand);
        usedMuscles.add(cand.targetMuscle);
      }
    }

    // Requirement 5: Never return fewer than 5 exercises.
    // If the filtered pool is too small, fill the gap with the closest bodyweight alternative
    // for the same target muscle, and show note flag: hasEquipmentSwaps = true
    if (selected.length < 5) {
      this._hasEquipmentSwaps = true;
      const allExercises = ExerciseLibrary.getInstance().getAllExercises();
      const bodyweightCatalog = allExercises.filter(
        (e) =>
          e.equipment === 'Bodyweight' &&
          !selected.some((s) => s.id === e.id || s.name === e.name)
      );

      const poolMuscles = Array.from(new Set(pool.map((e) => e.targetMuscle)));

      while (selected.length < 5) {
        const targetMuscle = poolMuscles[selected.length % poolMuscles.length];

        // 1. Try exact target muscle match
        let match = bodyweightCatalog.find(
          (e) =>
            e.targetMuscle.toLowerCase() === targetMuscle.toLowerCase() &&
            !selected.some((s) => s.id === e.id || s.name === e.name)
        );

        // 2. If no exact muscle match in bodyweight catalog, take any unused bodyweight exercise
        if (!match) {
          match = bodyweightCatalog.find(
            (e) => !selected.some((s) => s.id === e.id || s.name === e.name)
          );
        }

        if (match) {
          selected.push(match);
        } else {
          // If bodyweight catalog completely exhausted, recycle matching pool
          if (matchingPool.length > 0) {
            selected.push(matchingPool[selected.length % matchingPool.length]);
          } else {
            break;
          }
        }
      }
    }

    // Prescribe sets, reps, rest
    return selected.map((ex, idx) => {
      let repsVal = defaultReps;
      let restVal = defaultRest;

      if (!isTimedInterval) {
        // Subtle variation across exercises in workout
        if (idx === 0) repsVal = typeof defaultReps === 'number' ? defaultReps : 10;
        else if (idx >= 3) repsVal = typeof defaultReps === 'number' ? defaultReps + 2 : 12;
      }

      return ex.prescribe(defaultSets, repsVal, restVal);
    });
  }

  // Compatibility helpers
  public getSplitOverview(): { title: string; focus: string } {
    return {
      title: `${this._name} Routine`,
      focus: `Targeted workout session focusing on balanced muscular stimulation and progressive overload.`,
    };
  }
  public getRecommendedSets(): number { return 4; }
  public getRecommendedReps(): number { return 10; }
  public getRecommendedRestSeconds(): number { return 60; }
  public generateRoutine(): Exercise[] { return this.getExercises('Intermediate'); }
  public calculateEstimatedCalories(durationMinutes: number, bodyWeightKg: number): number {
    return this.calculateCalories(bodyWeightKg, durationMinutes);
  }
}
