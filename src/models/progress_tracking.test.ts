import test from 'node:test';
import assert from 'node:assert/strict';
import { PersonalRecord, PersonalRecordManager } from './PersonalRecord';
import { SetLogManager } from './SetLogManager';
import { BodyWeightManager } from './BodyWeightManager';
import { DeloadManager, getISOWeekKey } from './DeloadManager';
import { StorageLayer, STORAGE_KEYS } from './storage';
import { WorkoutRecord } from './WorkoutRecord';

test('PersonalRecord calculates Epley 1RM accurately and detects new PRs', () => {
  // Test 1RM calculation: 100 kg for 1 rep = 100 kg
  assert.equal(PersonalRecord.calculate1RM(100, 1), 100);

  // 100 kg for 10 reps = 100 * (1 + 10/30) = 133.3 kg
  assert.equal(PersonalRecord.calculate1RM(100, 10), 133.3);

  // 60 kg for 5 reps = 60 * (1 + 5/30) = 70 kg
  assert.equal(PersonalRecord.calculate1RM(60, 5), 70);

  // Zero and negative edge cases
  assert.equal(PersonalRecord.calculate1RM(0, 10), 0);
  assert.equal(PersonalRecord.calculate1RM(-20, 5), 0);
  assert.equal(PersonalRecord.calculate1RM(50, 0), 0);

  // PR tracking lifecycle
  const pr = new PersonalRecord({ exerciseName: 'Barbell Flat Bench Press' });
  assert.equal(pr.bestWeightKg, 0);
  assert.equal(pr.bestEstimatedOneRepMaxKg, 0);

  // First set: 80 kg for 8 reps (1RM = 80 * (1 + 8/30) = 101.3)
  const res1 = pr.recordSet(80, 8, '2026-10-01T10:00:00Z');
  assert.equal(res1.isNewWeightPR, true);
  assert.equal(res1.isNew1RMPR, true);
  assert.equal(pr.bestWeightKg, 80);
  assert.equal(pr.bestEstimatedOneRepMaxKg, 101.3);

  // Second set: 85 kg for 5 reps (1RM = 85 * (1 + 5/30) = 99.2)
  // Higher weight (85 > 80) -> weight PR = true, but 1RM (99.2 < 101.3) -> 1RM PR = false
  const res2 = pr.recordSet(85, 5, '2026-10-05T10:00:00Z');
  assert.equal(res2.isNewWeightPR, true);
  assert.equal(res2.isNew1RMPR, false);
  assert.equal(pr.bestWeightKg, 85);
  assert.equal(pr.bestEstimatedOneRepMaxKg, 101.3);

  // Third set: 85 kg for 10 reps (1RM = 85 * (1 + 10/30) = 113.3) -> 1RM PR = true
  const res3 = pr.recordSet(85, 10, '2026-10-10T10:00:00Z');
  assert.equal(res3.isNewWeightPR, false);
  assert.equal(res3.isNew1RMPR, true);
  assert.equal(pr.bestEstimatedOneRepMaxKg, 113.3);
});

test('SetLogManager validates bounds strictly and enforces weight (0-500) and reps (1-100)', () => {
  // Valid bounds
  const valid1 = SetLogManager.validate(50, 10);
  assert.equal(valid1.isValid, true);
  assert.equal(valid1.sanitizedWeight, 50);
  assert.equal(valid1.sanitizedReps, 10);

  // Bodyweight (0 kg) is valid
  const valid2 = SetLogManager.validate(0, 15);
  assert.equal(valid2.isValid, true);
  assert.equal(valid2.sanitizedWeight, 0);

  // Invalid: negative weight
  const invalidWeight1 = SetLogManager.validate(-5, 10);
  assert.equal(invalidWeight1.isValid, false);
  assert.match(invalidWeight1.weightError || '', /0 and 500/);

  // Invalid: excessive weight > 500 kg
  const invalidWeight2 = SetLogManager.validate(550, 10);
  assert.equal(invalidWeight2.isValid, false);
  assert.match(invalidWeight2.weightError || '', /0 and 500/);

  // Invalid: reps < 1
  const invalidReps1 = SetLogManager.validate(50, 0);
  assert.equal(invalidReps1.isValid, false);
  assert.match(invalidReps1.repsError || '', /1 and 100/);

  // Invalid: reps > 100
  const invalidReps2 = SetLogManager.validate(50, 150);
  assert.equal(invalidReps2.isValid, false);
  assert.match(invalidReps2.repsError || '', /1 and 100/);

  // Invalid: non-numeric string
  const nanRes = SetLogManager.validate('heavy', 'five');
  assert.equal(nanRes.isValid, false);
});

test('Progressive Overload Hint strictly enforces maximum 5% increase and target rep attainment', () => {
  const setLogManager = new SetLogManager();
  const testUserId = `test_po_user_${Date.now()}`;
  const exerciseName = 'Dumbbell Shoulder Press';

  // 1. Empty history test
  const emptyHint = setLogManager.generateProgressiveOverloadHint(testUserId, exerciseName, 10, 20);
  assert.equal(emptyHint.hasHistory, false);
  assert.match(emptyHint.message, /First time logging/);

  // 2. Session where user FAILED to hit all target reps (target 10, got 8)
  const failRecordId = `rec_fail_${Date.now()}`;
  setLogManager.createBatch([
    {
      userId: testUserId,
      recordId: failRecordId,
      exerciseName,
      setNumber: 1,
      weightKg: 20,
      reps: 10,
      targetReps: 10,
      date: '2026-10-01T10:00:00Z',
    },
    {
      userId: testUserId,
      recordId: failRecordId,
      exerciseName,
      setNumber: 2,
      weightKg: 20,
      reps: 8, // Missed target
      targetReps: 10,
      date: '2026-10-01T10:05:00Z',
    },
  ]);

  const consolidationHint = setLogManager.generateProgressiveOverloadHint(testUserId, exerciseName, 10, 20);
  assert.equal(consolidationHint.hasHistory, true);
  assert.equal(consolidationHint.allTargetRepsHit, false);
  // Suggests repeating weight, NOT increasing
  assert.equal(consolidationHint.suggestedWeightKg, 20);
  assert.match(consolidationHint.message, /Consolidate/);

  // 3. Session where user HIT ALL target reps (e.g. 20 kg x 10, target 10)
  const successRecordId = `rec_succ_${Date.now()}`;
  setLogManager.createBatch([
    {
      userId: testUserId,
      recordId: successRecordId,
      exerciseName,
      setNumber: 1,
      weightKg: 20,
      reps: 10,
      targetReps: 10,
      date: '2026-10-05T10:00:00Z',
    },
    {
      userId: testUserId,
      recordId: successRecordId,
      exerciseName,
      setNumber: 2,
      weightKg: 20,
      reps: 10,
      targetReps: 10,
      date: '2026-10-05T10:05:00Z',
    },
  ]);

  const overloadHint = setLogManager.generateProgressiveOverloadHint(testUserId, exerciseName, 10, 20);
  assert.equal(overloadHint.hasHistory, true);
  assert.equal(overloadHint.allTargetRepsHit, true);

  // Verify weight increase is strictly <= 5% (5% of 20 kg is 1.0 kg -> suggested <= 21 kg)
  assert.ok(overloadHint.suggestedWeightKg !== undefined);
  const weightIncreasePercent = ((overloadHint.suggestedWeightKg - 20) / 20) * 100;
  assert.ok(weightIncreasePercent <= 5.001, `Weight increase ${weightIncreasePercent}% exceeds 5%`);
  assert.equal(overloadHint.suggestedReps, 11);
  assert.match(overloadHint.message, /Try 21 kg or 11 reps/);
});

test('BodyWeightManager persists entries, computes stats, and synchronizes profile weight', () => {
  const bwManager = new BodyWeightManager();
  const testUserId = `test_bw_user_${Date.now()}`;

  // Seed profile
  StorageLayer.saveTable(STORAGE_KEYS.PROFILES, [
    {
      id: `prof_${testUserId}`,
      userId: testUserId,
      name: 'Weight Test Athlete',
      age: 28,
      gender: 'male',
      heightCm: 180,
      weightKg: 78.0,
      experienceLevel: 'intermediate',
      weeklyGoal: 4,
    },
  ]);

  // Empty history stats
  const emptyStats = bwManager.getWeightStats(testUserId);
  assert.equal(emptyStats.count, 0);
  assert.equal(emptyStats.current, null);

  // Validation rules
  assert.equal(BodyWeightManager.validate(0).isValid, false);
  assert.equal(BodyWeightManager.validate(-10).isValid, false);
  assert.equal(BodyWeightManager.validate(550).isValid, false);
  assert.equal(BodyWeightManager.validate(75.5).isValid, true);

  // Add 3 progressive entries
  bwManager.addEntry(testUserId, 80.0, '2026-10-01');
  bwManager.addEntry(testUserId, 79.2, '2026-10-08');
  bwManager.addEntry(testUserId, 78.5, '2026-10-15');

  const stats = bwManager.getWeightStats(testUserId);
  assert.equal(stats.count, 3);
  assert.equal(stats.starting, 80.0);
  assert.equal(stats.current, 78.5);
  assert.equal(stats.change, -1.5);
  assert.equal(stats.min, 78.5);
  assert.equal(stats.max, 80.0);

  // Verify profile table was updated with the latest weight (78.5)
  const profiles = StorageLayer.getTable<any>(STORAGE_KEYS.PROFILES);
  const updatedProfile = profiles.find((p) => p.userId === testUserId);
  assert.equal(updatedProfile?.weightKg, 78.5);
});

test('DeloadManager suggests deload after 4 consecutive weeks of training', () => {
  // Test ISO week key generation
  const weekKey = getISOWeekKey('2026-10-25');
  assert.match(weekKey, /^2026-W\d{2}$/);

  // Zero records -> no deload
  const res0 = DeloadManager.calculateConsecutiveTrainingWeeks([]);
  assert.equal(res0.isDeloadRecommended, false);
  assert.equal(res0.consecutiveWeeks, 0);

  // Create 4 consecutive weekly workouts
  const now = new Date();
  const records: WorkoutRecord[] = [];

  for (let week = 0; week < 4; week++) {
    const d = new Date(now.getTime() - week * 7 * 24 * 60 * 60 * 1000);
    records.push(
      new WorkoutRecord({
        id: `rec_w_${week}`,
        userId: 'test_deload_user',
        splitName: 'Push Split',
        durationMinutes: 45,
        caloriesBurned: 300,
        date: d.toISOString(),
      })
    );
  }

  const res4 = DeloadManager.calculateConsecutiveTrainingWeeks(records);
  assert.ok(res4.consecutiveWeeks >= 4);
  assert.equal(res4.isDeloadRecommended, true);

  // Test deload mode toggling
  DeloadManager.setDeloadModeActive(true);
  assert.equal(DeloadManager.isDeloadModeActive(), true);
  DeloadManager.setDeloadModeActive(false);
  assert.equal(DeloadManager.isDeloadModeActive(), false);
});
