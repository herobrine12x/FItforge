import { CardioHIITSplit } from './CardioHIITSplit';
import { FullBodySplit } from './FullBodySplit';
import { HomeBodyweightSplit } from './HomeBodyweightSplit';
import { LegsCoreSplit } from './LegsCoreSplit';
import { PullSplit } from './PullSplit';
import { PushSplit } from './PushSplit';
import { SplitType } from './types';
import { UpperBodySplit } from './UpperBodySplit';
import { WorkoutPlan } from './WorkoutPlan';

/**
 * OOP Design Pattern: Factory Pattern
 * Encapsulates instantiation logic for all 7 polymorphic WorkoutPlan subclasses.
 */
export class WorkoutPlanFactory {
  public static create(splitType: SplitType | string, _experienceLevel?: any, _fitnessGoal?: any): WorkoutPlan {
    const normalized = String(splitType).toLowerCase().replace(/[^a-z]/g, '');

    if (normalized.includes('cardio') || normalized.includes('hiit')) {
      return new CardioHIITSplit();
    }
    if (normalized.includes('home') || normalized.includes('bodyweight')) {
      return new HomeBodyweightSplit();
    }
    if (normalized.includes('upper')) {
      return new UpperBodySplit();
    }
    if (normalized.includes('leg')) {
      return new LegsCoreSplit();
    }
    if (normalized.includes('pull')) {
      return new PullSplit();
    }
    if (normalized.includes('full')) {
      return new FullBodySplit();
    }
    if (normalized.includes('push')) {
      return new PushSplit();
    }

    // Default to Push split
    return new PushSplit();
  }

  public static getAllSplits(): WorkoutPlan[] {
    return [
      new PushSplit(),
      new PullSplit(),
      new LegsCoreSplit(),
      new FullBodySplit(),
      new UpperBodySplit(),
      new HomeBodyweightSplit(),
      new CardioHIITSplit(),
    ];
  }
}
