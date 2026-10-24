import test from 'node:test';
import assert from 'node:assert/strict';
import { BMICalculator } from './BMICalculator';
import { FullBodySplit } from './FullBodySplit';
import { LegsCoreSplit } from './LegsCoreSplit';
import { PullSplit } from './PullSplit';
import { PushSplit } from './PushSplit';
import { WorkoutPlan } from './WorkoutPlan';
import { WorkoutPlanFactory } from './WorkoutPlanFactory';
import { WorkoutRecord } from './WorkoutRecord';
import {
  FOUR_RECOMMENDER_SPLITS,
  getLeastRecentlyTrainedSplit,
  RecommenderSplitKey,
} from '../utils/recommender';

test('Stage 4: WorkoutPlan subclasses polymorphically generate 5 valid exercises via a single shared interface', () => {
  const splitKeys: RecommenderSplitKey[] = ['push', 'pull', 'legs_core', 'full_body'];

  for (const key of splitKeys) {
    // Single shared code path on the base WorkoutPlan interface
    const plan: WorkoutPlan = WorkoutPlanFactory.create(key);
    assert.ok(plan instanceof WorkoutPlan, `Plan for ${key} must inherit from WorkoutPlan`);

    // Polymorphic method call
    const exercises = plan.getExercises('Intermediate');
    assert.equal(exercises.length, 5, `${plan.name} must return exactly 5 exercises`);

    // Verify each exercise has name, targetMuscle, sets, reps, and restSeconds
    for (const ex of exercises) {
      assert.ok(ex.name && ex.name.length > 0, 'Exercise name must not be empty');
      assert.ok(ex.targetMuscle && ex.targetMuscle.length > 0, 'Target muscle must not be empty');
      assert.ok(typeof ex.sets === 'number' && ex.sets > 0, 'Sets must be positive number');
      assert.ok(ex.reps !== undefined && ex.reps !== null, 'Reps must be defined');
      assert.ok(typeof ex.restSeconds === 'number' && ex.restSeconds > 0, 'Rest time must be positive number');
    }
  }
});

test('Stage 4: Experience level alters prescribed sets, reps, and rest polymorphically', () => {
  const pushPlan: WorkoutPlan = WorkoutPlanFactory.create('push');

  const beginnerRoutine = pushPlan.getExercises('Beginner');
  const advancedRoutine = pushPlan.getExercises('Advanced');

  assert.equal(beginnerRoutine.length, 5);
  assert.equal(advancedRoutine.length, 5);

  // Beginner sets are typically 3 with 75s rest, Advanced are 5 sets with 45s rest
  assert.equal(beginnerRoutine[0].sets, 3);
  assert.equal(beginnerRoutine[0].restSeconds, 75);

  assert.equal(advancedRoutine[0].sets, 5);
  assert.equal(advancedRoutine[0].restSeconds, 45);
});

test('Stage 4: getLeastRecentlyTrainedSplit suggests the split trained least recently', () => {
  // Scenario 1: Empty records -> picks default 'push'
  assert.equal(getLeastRecentlyTrainedSplit([]), 'push');

  // Scenario 2: Push trained yesterday, Pull trained 2 days ago, Legs trained 3 days ago, Full Body NEVER trained
  const records1: WorkoutRecord[] = [
    new WorkoutRecord({
      id: 'r1',
      userId: 'u1',
      splitName: 'Push',
      date: '2026-10-23T10:00:00.000Z',
      durationMinutes: 45,
      caloriesBurned: 350,
    }),
    new WorkoutRecord({
      id: 'r2',
      userId: 'u1',
      splitName: 'Pull',
      date: '2026-10-22T10:00:00.000Z',
      durationMinutes: 45,
      caloriesBurned: 350,
    }),
    new WorkoutRecord({
      id: 'r3',
      userId: 'u1',
      splitName: 'Legs & Core',
      date: '2026-10-21T10:00:00.000Z',
      durationMinutes: 45,
      caloriesBurned: 350,
    }),
  ];
  // Full Body was never trained, so it has timestamp 0 (least recently trained)
  assert.equal(getLeastRecentlyTrainedSplit(records1), 'full_body');

  // Scenario 3: All 4 splits have records, Pull was trained longest ago
  const records2: WorkoutRecord[] = [
    new WorkoutRecord({
      id: 'r4',
      userId: 'u1',
      splitName: 'Push',
      date: '2026-10-24T10:00:00.000Z',
      durationMinutes: 45,
      caloriesBurned: 350,
    }),
    new WorkoutRecord({
      id: 'r5',
      userId: 'u1',
      splitName: 'Full Body',
      date: '2026-10-23T10:00:00.000Z',
      durationMinutes: 45,
      caloriesBurned: 350,
    }),
    new WorkoutRecord({
      id: 'r6',
      userId: 'u1',
      splitName: 'Legs & Core',
      date: '2026-10-20T10:00:00.000Z',
      durationMinutes: 45,
      caloriesBurned: 350,
    }),
    new WorkoutRecord({
      id: 'r7',
      userId: 'u1',
      splitName: 'Pull',
      date: '2026-10-15T10:00:00.000Z', // Longest ago
      durationMinutes: 45,
      caloriesBurned: 350,
    }),
  ];
  assert.equal(getLeastRecentlyTrainedSplit(records2), 'pull');
});

test('Stage 4: BMI criteria correctly triggers low-impact warm-up recommendation', () => {
  // Normal BMI: 70kg at 175cm = 22.9
  const normalBmi = BMICalculator.calculate(70, 175);
  const normalCategory = BMICalculator.classify(normalBmi);
  const isNormalWarmUp = normalCategory === 'Overweight' || normalCategory === 'Obese';
  assert.equal(isNormalWarmUp, false);

  // Overweight BMI: 82kg at 175cm = 26.8
  const overBmi = BMICalculator.calculate(82, 175);
  const overCategory = BMICalculator.classify(overBmi);
  const isOverWarmUp = overCategory === 'Overweight' || overCategory === 'Obese';
  assert.equal(isOverWarmUp, true);

  // Obese BMI: 100kg at 175cm = 32.7
  const obeseBmi = BMICalculator.calculate(100, 175);
  const obeseCategory = BMICalculator.classify(obeseBmi);
  const isObeseWarmUp = obeseCategory === 'Overweight' || obeseCategory === 'Obese';
  assert.equal(isObeseWarmUp, true);
});
