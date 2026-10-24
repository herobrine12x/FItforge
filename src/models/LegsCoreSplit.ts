import { Exercise } from './Exercise';
import { EquipmentType, ExperienceLevel } from './types';
import { WorkoutPlan } from './WorkoutPlan';

/**
 * OOP Principle: Inheritance & Polymorphism
 * LegsCoreSplit inherits from WorkoutPlan, specializing in quads, hamstrings, glutes, calves, and core.
 * Queries the ExerciseLibrary for its legs/core pool and selects 5 exercises.
 * Energy expenditure: 7.5 METs.
 */
export class LegsCoreSplit extends WorkoutPlan {
  constructor(_exp?: any, _goal?: any) {
    super('Legs & Core');
  }

  public getMETValue(): number {
    return 7.5;
  }

  public getExercises(level: ExperienceLevel, availableEquipment?: EquipmentType[]): Exercise[] {
    const pool = this.getPool();
    return this.selectFiveExercises(pool, level, false, availableEquipment);
  }
}
