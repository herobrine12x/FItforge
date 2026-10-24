import { Exercise } from './Exercise';
import { EquipmentType, ExperienceLevel } from './types';
import { WorkoutPlan } from './WorkoutPlan';

/**
 * OOP Principle: Inheritance & Polymorphism
 * PullSplit inherits from WorkoutPlan, specializing in back, biceps, and rear delts.
 * Queries the ExerciseLibrary for its pull pool and selects 5 exercises.
 * Energy expenditure: 6.5 METs.
 */
export class PullSplit extends WorkoutPlan {
  constructor(_exp?: any, _goal?: any) {
    super('Pull');
  }

  public getMETValue(): number {
    return 6.5;
  }

  public getExercises(level: ExperienceLevel, availableEquipment?: EquipmentType[]): Exercise[] {
    const pool = this.getPool();
    return this.selectFiveExercises(pool, level, false, availableEquipment);
  }
}
