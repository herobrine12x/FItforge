import { Exercise } from './Exercise';
import { ExperienceLevel } from './types';
import { WorkoutPlan } from './WorkoutPlan';

/**
 * OOP Principle: Inheritance & Polymorphism
 * UpperBodySplit inherits from WorkoutPlan, specializing in chest, back, shoulders, and arms.
 * Queries the ExerciseLibrary for its upper body pool and selects 5 exercises.
 * Energy expenditure: 6.8 METs.
 */
export class UpperBodySplit extends WorkoutPlan {
  constructor(_exp?: any, _goal?: any) {
    super('Upper Body');
  }

  public getMETValue(): number {
    return 6.8;
  }

  public getExercises(level: ExperienceLevel): Exercise[] {
    const pool = this.getPool();
    return this.selectFiveExercises(pool, level, false);
  }
}
