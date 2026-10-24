import { Exercise } from './Exercise';
import { ExperienceLevel } from './types';
import { WorkoutPlan } from './WorkoutPlan';

/**
 * OOP Principle: Inheritance & Polymorphism
 * CardioHIITSplit inherits from WorkoutPlan, prescribing timed interval training
 * (e.g. 40s work / 20s rest) with high cardiovascular and metabolic intensity.
 * Highest energy expenditure rate of all splits: 8.5 METs.
 */
export class CardioHIITSplit extends WorkoutPlan {
  constructor(_exp?: any, _goal?: any) {
    super('Cardio HIIT');
  }

  public getMETValue(): number {
    return 8.5; // Highest MET
  }

  public getExercises(level: ExperienceLevel): Exercise[] {
    const pool = this.getPool();
    return this.selectFiveExercises(pool, level, true);
  }
}
