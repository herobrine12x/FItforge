import { Exercise } from './Exercise';
import { EquipmentType, ExperienceLevel } from './types';
import { WorkoutPlan } from './WorkoutPlan';

/**
 * OOP Principle: Inheritance & Polymorphism
 * FullBodySplit inherits from WorkoutPlan, delivering balanced full-body compound stimulus.
 * Queries the ExerciseLibrary for its full-body pool and selects 5 exercises.
 * Energy expenditure: 7.0 METs.
 */
export class FullBodySplit extends WorkoutPlan {
  constructor(_exp?: any, _goal?: any) {
    super('Full Body');
  }

  public getMETValue(): number {
    return 7.0;
  }

  public getExercises(level: ExperienceLevel, availableEquipment?: EquipmentType[]): Exercise[] {
    const pool = this.getPool();
    return this.selectFiveExercises(pool, level, false, availableEquipment);
  }
}
