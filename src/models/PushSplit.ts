import { Exercise } from './Exercise';
import { EquipmentType, ExperienceLevel } from './types';
import { WorkoutPlan } from './WorkoutPlan';

/**
 * OOP Principle: Inheritance & Polymorphism
 * PushSplit inherits from WorkoutPlan, specializing in chest, shoulders, and triceps.
 * Queries the ExerciseLibrary for its push pool and selects 5 exercises.
 * Energy expenditure: 6.0 METs.
 */
export class PushSplit extends WorkoutPlan {
  constructor(_exp?: any, _goal?: any) {
    super('Push');
  }

  public getMETValue(): number {
    return 6.0;
  }

  public getExercises(level: ExperienceLevel, availableEquipment?: EquipmentType[]): Exercise[] {
    const pool = this.getPool();
    return this.selectFiveExercises(pool, level, false, availableEquipment);
  }
}
