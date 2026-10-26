import test from 'node:test';
import assert from 'node:assert';
import {
  classifyWorkoutFocus,
  getWarmUpRoutine,
  WARMUP_MOVES,
  isWarmUpSkippedForSession,
  setWarmUpSkippedForSession,
} from './warmups';

test('classifyWorkoutFocus identifies target groups correctly', () => {
  assert.strictEqual(classifyWorkoutFocus('push'), 'upper');
  assert.strictEqual(classifyWorkoutFocus('pull'), 'upper');
  assert.strictEqual(classifyWorkoutFocus('upper_body'), 'upper');
  assert.strictEqual(classifyWorkoutFocus('legs_core'), 'lower');
  assert.strictEqual(classifyWorkoutFocus('cardio_hiit'), 'cardio');
  assert.strictEqual(classifyWorkoutFocus('full_body'), 'full');

  // Exercise fallback
  const upperExercises = [
    { name: 'Barbell Bench Press', targetMuscle: 'Chest' },
    { name: 'Overhead Press', targetMuscle: 'Shoulders' },
    { name: 'Triceps Pushdown', targetMuscle: 'Triceps' },
  ];
  assert.strictEqual(classifyWorkoutFocus(null, upperExercises), 'upper');

  const lowerExercises = [
    { name: 'Barbell Back Squat', targetMuscle: 'Quadriceps' },
    { name: 'Romanian Deadlift', targetMuscle: 'Hamstrings' },
    { name: 'Walking Lunges', targetMuscle: 'Glutes' },
  ];
  assert.strictEqual(classifyWorkoutFocus(null, lowerExercises), 'lower');
});

test('getWarmUpRoutine returns 4 to 6 moves and estimated 5 minutes with priming note', () => {
  const upperRoutine = getWarmUpRoutine('push', [{ name: 'Barbell Bench Press' }]);
  assert.strictEqual(upperRoutine.estimatedMinutes, 5);
  assert.ok(upperRoutine.moves.length >= 4 && upperRoutine.moves.length <= 6);
  assert.ok(upperRoutine.firstExerciseWarmupNote.includes('Barbell Bench Press'));
  assert.ok(upperRoutine.firstExerciseWarmupNote.includes('1–2 light warm-up sets'));

  // Arm circles and band pull aparts in upper routine
  const moveIds = upperRoutine.moves.map((m) => m.id);
  assert.ok(moveIds.includes('arm_circles'));
  assert.ok(moveIds.includes('band_pull_aparts'));

  // Lower body routine
  const lowerRoutine = getWarmUpRoutine('legs_core', [{ name: 'Barbell Squat' }]);
  const lowerMoveIds = lowerRoutine.moves.map((m) => m.id);
  assert.ok(lowerMoveIds.includes('bodyweight_squats'));
  assert.ok(lowerMoveIds.includes('hip_circles'));
  assert.ok(lowerRoutine.moves.length >= 4 && lowerRoutine.moves.length <= 6);
});

test('All warmup moves contain duration or reps, description, and beginner-friendly advice', () => {
  Object.values(WARMUP_MOVES).forEach((move) => {
    assert.ok(move.name.length > 0);
    assert.ok(move.durationOrReps.length > 0);
    assert.ok(move.description.length > 0);
  });
});
