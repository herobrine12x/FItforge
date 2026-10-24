import { Exercise } from './Exercise';
import { EquipmentType, ExperienceLevel } from './types';
import { WorkoutPlan } from './WorkoutPlan';

/**
 * OOP Principle: Inheritance & Polymorphism
 * HomeBodyweightSplit inherits from WorkoutPlan, prescribing equipment-free bodyweight
 * calisthenics (push-ups, air squats, lunges, planks, glute bridges).
 * Lowest energy expenditure rate of all splits: 5.0 METs.
 */
export class HomeBodyweightSplit extends WorkoutPlan {
  constructor(_exp?: any, _goal?: any) {
    super('Home Bodyweight');
  }

  public getMETValue(): number {
    return 5.0; // Lowest MET
  }

  public getExercises(level: ExperienceLevel, availableEquipment?: EquipmentType[]): Exercise[] {
    const pool = this.getPool();
    return this.selectFiveExercises(pool, level, false, availableEquipment);
  }
}
