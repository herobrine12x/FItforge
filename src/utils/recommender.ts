import { WorkoutRecord } from '../models/WorkoutRecord';

export type RecommenderSplitKey = 'push' | 'pull' | 'legs_core' | 'full_body';

export interface SplitCardConfig {
  key: RecommenderSplitKey;
  name: string;
  tagline: string;
  muscles: string;
  primaryTarget: string;
  metValue: number;
}

export const FOUR_RECOMMENDER_SPLITS: SplitCardConfig[] = [
  {
    key: 'push',
    name: 'Push',
    tagline: 'Chest, Shoulders & Triceps',
    muscles: 'Pectorals, Anterior Deltoids, Triceps Brachii',
    primaryTarget: 'Upper Body Pressing & Extension',
    metValue: 6.0,
  },
  {
    key: 'pull',
    name: 'Pull',
    tagline: 'Back, Biceps & Rear Delts',
    muscles: 'Latissimus Dorsi, Rhomboids, Biceps Brachii',
    primaryTarget: 'Posterior Chain Pulling & Flexion',
    metValue: 6.0,
  },
  {
    key: 'legs_core',
    name: 'Legs and Core',
    tagline: 'Quads, Hamstrings, Glutes & Abs',
    muscles: 'Quadriceps, Hamstrings, Gluteus, Core',
    primaryTarget: 'Lower Body Drive & Core Stability',
    metValue: 6.5,
  },
  {
    key: 'full_body',
    name: 'Full Body',
    tagline: 'Compound Kinetic Synergy',
    muscles: 'Full Muscular Chain, Core, Squats, Pressing',
    primaryTarget: 'Total Body Metabolic Conditioning',
    metValue: 7.0,
  },
];

/**
 * Calculates which split the user trained least recently.
 * If a split has never been logged, its last trained timestamp is 0 (least recent).
 * Returns the RecommenderSplitKey.
 */
export function getLeastRecentlyTrainedSplit(records: WorkoutRecord[]): RecommenderSplitKey {
  const lastTrainedTimes: Record<RecommenderSplitKey, number> = {
    push: 0,
    pull: 0,
    legs_core: 0,
    full_body: 0,
  };

  records.forEach((r) => {
    const splitKey = (r.splitName || '').toLowerCase().replace(/[^a-z]/g, '');
    const recordTime = new Date(r.date).getTime();

    if (splitKey.includes('push')) {
      if (recordTime > lastTrainedTimes.push) lastTrainedTimes.push = recordTime;
    } else if (splitKey.includes('pull')) {
      if (recordTime > lastTrainedTimes.pull) lastTrainedTimes.pull = recordTime;
    } else if (splitKey.includes('leg') || splitKey.includes('core')) {
      if (recordTime > lastTrainedTimes.legs_core) lastTrainedTimes.legs_core = recordTime;
    } else if (splitKey.includes('full')) {
      if (recordTime > lastTrainedTimes.full_body) lastTrainedTimes.full_body = recordTime;
    }
  });

  // Find the split with the minimum last trained timestamp
  let leastRecentSplit: RecommenderSplitKey = 'push';
  let oldestTime = Infinity;

  // Check in deterministic order
  const order: RecommenderSplitKey[] = ['push', 'pull', 'legs_core', 'full_body'];
  for (const key of order) {
    if (lastTrainedTimes[key] < oldestTime) {
      oldestTime = lastTrainedTimes[key];
      leastRecentSplit = key;
    }
  }

  return leastRecentSplit;
}
