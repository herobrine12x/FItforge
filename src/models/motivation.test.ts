import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Achievement,
  AchievementManager,
  calculateStreak,
  checkHasMetWeeklyGoal,
  isWalkRecord,
} from './Achievement';
import { StorageLayer, STORAGE_KEYS } from './storage';
import { WorkoutRecord } from './WorkoutRecord';

test('isWalkRecord correctly detects walk sessions across name, title, split, and notes', () => {
  const walkRecord1 = new WorkoutRecord({
    userId: 'user_1',
    splitName: 'Morning Walk',
    durationMinutes: 30,
    caloriesBurned: 120,
    date: '2026-10-20T08:00:00Z',
  });
  assert.equal(isWalkRecord(walkRecord1), true);

  const walkRecord2 = new WorkoutRecord({
    userId: 'user_1',
    splitName: 'Cardio',
    splitType: 'walk',
    durationMinutes: 25,
    caloriesBurned: 110,
    date: '2026-10-21T08:00:00Z',
  });
  assert.equal(isWalkRecord(walkRecord2), true);

  const regularWorkout = new WorkoutRecord({
    userId: 'user_1',
    splitName: 'Push Split',
    durationMinutes: 45,
    caloriesBurned: 320,
    date: '2026-10-22T08:00:00Z',
  });
  assert.equal(isWalkRecord(regularWorkout), false);
});

test('calculateStreak: consecutive days increment streak', () => {
  const refDate = new Date(2026, 9, 23, 12, 0, 0); // Oct 23, 2026
  const records = [
    new WorkoutRecord({ userId: 'u1', splitName: 'Push', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-21T10:00:00' }),
    new WorkoutRecord({ userId: 'u1', splitName: 'Pull', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-22T10:00:00' }),
    new WorkoutRecord({ userId: 'u1', splitName: 'Legs', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-23T10:00:00' }),
  ];

  const { currentStreak, bestStreak } = calculateStreak(records, refDate);
  assert.equal(currentStreak, 3);
  assert.equal(bestStreak, 3);
});

test('calculateStreak: grace rule allows 1 rest day without breaking streak', () => {
  // Trained Mon (Oct 19), Wed (Oct 21), Fri (Oct 23)
  // Gaps are 2 days (Tue was rest, Thu was rest)
  const refDate = new Date(2026, 9, 23, 12, 0, 0); // Friday Oct 23
  const records = [
    new WorkoutRecord({ userId: 'u1', splitName: 'Push', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-19T10:00:00' }),
    new WorkoutRecord({ userId: 'u1', splitName: 'Pull', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-21T10:00:00' }),
    new WorkoutRecord({ userId: 'u1', splitName: 'Legs', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-23T10:00:00' }),
  ];

  const { currentStreak, bestStreak } = calculateStreak(records, refDate);
  assert.equal(currentStreak, 3);
  assert.equal(bestStreak, 3);
});

test('calculateStreak: 2 rest days break the streak', () => {
  // Trained Mon (Oct 19), then Thu (Oct 22). Gap is 3 days (Tue and Wed rested).
  const refDate = new Date(2026, 9, 22, 12, 0, 0);
  const records = [
    new WorkoutRecord({ userId: 'u1', splitName: 'Push', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-19T10:00:00' }),
    new WorkoutRecord({ userId: 'u1', splitName: 'Pull', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-22T10:00:00' }),
  ];

  const { currentStreak, bestStreak } = calculateStreak(records, refDate);
  assert.equal(currentStreak, 1);
  assert.equal(bestStreak, 1);
});

test('calculateStreak: returns 0 when user has not worked out for more than 2 days', () => {
  // Trained on Monday Oct 19, reference date is Friday Oct 23 (4 days later)
  const refDate = new Date(2026, 9, 23, 12, 0, 0);
  const records = [
    new WorkoutRecord({ userId: 'u1', splitName: 'Push', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-19T10:00:00' }),
  ];

  const { currentStreak, bestStreak } = calculateStreak(records, refDate);
  assert.equal(currentStreak, 0);
  assert.equal(bestStreak, 1);
});

test('checkHasMetWeeklyGoal returns true when goal is reached in Monday-Sunday week', () => {
  const records = [
    new WorkoutRecord({ userId: 'u1', splitName: 'Push', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-19T10:00:00' }), // Mon
    new WorkoutRecord({ userId: 'u1', splitName: 'Pull', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-21T10:00:00' }), // Wed
    new WorkoutRecord({ userId: 'u1', splitName: 'Legs', durationMinutes: 30, caloriesBurned: 200, date: '2026-10-23T10:00:00' }), // Fri
  ];

  assert.equal(checkHasMetWeeklyGoal(records, 3), true);
  assert.equal(checkHasMetWeeklyGoal(records, 4), false);
});

test('AchievementManager unlocks badges correctly and prevents duplicates', () => {
  const userId = 'badge_test_user';
  StorageLayer.saveTable(STORAGE_KEYS.BADGES, []);

  const mgr = new AchievementManager();

  // Initially all locked
  const initialBadges = mgr.getBadges(userId);
  assert.equal(initialBadges.length, 8);
  assert.equal(initialBadges.every((b) => !b.isUnlocked), true);

  // Add records that unlock first_workout, first_walk, session_30_min, streak_3, first_full_week
  const records = [
    new WorkoutRecord({ userId, splitName: 'Push', durationMinutes: 35, caloriesBurned: 250, date: '2026-10-19T10:00:00' }),
    new WorkoutRecord({ userId, splitName: 'Morning Walk', durationMinutes: 30, caloriesBurned: 130, date: '2026-10-20T10:00:00' }),
    new WorkoutRecord({ userId, splitName: 'Legs', durationMinutes: 40, caloriesBurned: 300, date: '2026-10-21T10:00:00' }),
  ];

  const { allBadges, newlyUnlocked } = mgr.checkAndUnlockBadges(userId, records, 3);

  const unlockedIds = newlyUnlocked.map((b) => b.id);
  assert.ok(unlockedIds.includes('first_workout'));
  assert.ok(unlockedIds.includes('first_walk'));
  assert.ok(unlockedIds.includes('session_30_min'));
  assert.ok(unlockedIds.includes('streak_3'));
  assert.ok(unlockedIds.includes('first_full_week'));

  // Checking again should return 0 newly unlocked
  const secondCheck = mgr.checkAndUnlockBadges(userId, records, 3);
  assert.equal(secondCheck.newlyUnlocked.length, 0);
  assert.ok(secondCheck.allBadges.find((b) => b.id === 'first_workout')?.isUnlocked);
});
