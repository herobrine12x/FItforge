import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthManager, DEMO_PASSWORD, DEMO_USER_ID, DEMO_USERNAME } from './AuthManager';
import { BMICalculator } from './BMICalculator';
import { MemberProfile } from './MemberProfile';
import { RecordManager } from './RecordManager';
import { StorageLayer, STORAGE_KEYS } from './storage';
import { User } from './User';
import {
  cmToFtIn,
  formatHeight,
  formatWeight,
  ftInToCm,
  getWeekDates,
  kgToLb,
  lbToKg,
} from '../utils/units';

test('Stage 3: Pure unit conversions and date utilities calculate accurately', () => {
  // Weight conversions
  const kgVal = 70;
  const lbVal = kgToLb(kgVal);
  assert.equal(lbVal, 154.3);
  assert.equal(lbToKg(lbVal), 70);

  // Height conversions
  const cmVal = 175;
  const { feet, inches } = cmToFtIn(cmVal);
  assert.equal(feet, 5);
  assert.equal(inches, 9);
  assert.equal(ftInToCm(5, 9), 175.3);

  // Formatting helpers
  assert.equal(formatWeight(75, 'metric'), '75 kg');
  assert.equal(formatWeight(75, 'imperial'), '165.3 lb');
  assert.equal(formatHeight(180, 'metric'), '180 cm');
  assert.equal(formatHeight(180, 'imperial'), '5 ft 11 in');

  // Week boundary helper (Monday to Sunday)
  const refDate = new Date('2026-10-24T12:00:00.000Z'); // Saturday
  const { startOfWeek, endOfWeek } = getWeekDates(refDate);
  // Monday should be Oct 19, 2026
  assert.equal(startOfWeek.getDay(), 1); // 1 = Monday
  // Sunday should be Oct 25, 2026
  assert.equal(endOfWeek.getDay(), 0); // 0 = Sunday
});

test('Stage 3: BMICalculator classifies diagnostic categories and boundaries correctly', () => {
  // Underweight (< 18.5)
  const underBmi = BMICalculator.calculate(45, 175); // 14.7
  assert.equal(underBmi, 14.7);
  assert.equal(BMICalculator.classify(underBmi), 'Underweight');

  // Normal (18.5 - 24.9)
  const normBmi = BMICalculator.calculate(70, 175); // 22.9
  assert.equal(normBmi, 22.9);
  assert.equal(BMICalculator.classify(normBmi), 'Normal');

  // Overweight (25.0 - 29.9)
  const overBmi = BMICalculator.calculate(82, 175); // 26.8
  assert.equal(overBmi, 26.8);
  assert.equal(BMICalculator.classify(overBmi), 'Overweight');

  // Obese (>= 30.0)
  const obeseBmi = BMICalculator.calculate(105, 175); // 34.3
  assert.equal(obeseBmi, 34.3);
  assert.equal(BMICalculator.classify(obeseBmi), 'Obese');
});

test('Stage 3: Profile updating recalculates BMI immediately and enforces bounds', () => {
  const profile = new MemberProfile({
    id: 'prof_test_01',
    userId: 'user_test_01',
    name: 'Kent Malo',
    age: 24,
    gender: 'Male',
    heightCm: 180,
    weightKg: 75,
    experienceLevel: 'Intermediate',
    weeklyGoal: 4,
  });

  const initialBmi = BMICalculator.calculate(profile.weightKg, profile.heightCm);
  assert.equal(initialBmi, 23.1);

  // Update weight -> BMI immediately recalculates
  profile.weightKg = 85;
  const updatedBmi = BMICalculator.calculate(profile.weightKg, profile.heightCm);
  assert.equal(updatedBmi, 26.2);
  assert.equal(BMICalculator.classify(updatedBmi), 'Overweight');

  // Negative or out of bounds updates are rejected
  assert.throws(() => {
    profile.weightKg = -10;
  });
  assert.throws(() => {
    profile.heightCm = 40; // min 50 cm
  });
  assert.throws(() => {
    profile.age = 150; // max 100
  });
});

test('Stage 3: RecordManager.clearRecordsByUserId wipes history for user only', () => {
  const recordMgr = new RecordManager();
  const testUserId = `user_history_test_${Date.now()}`;
  const otherUserId = `user_other_${Date.now()}`;

  // Create records for both users
  recordMgr.create({
    userId: testUserId,
    splitName: 'Push',
    date: '2026-10-24T10:00:00.000Z',
    durationMinutes: 45,
    caloriesBurned: 350,
  });
  recordMgr.create({
    userId: testUserId,
    splitName: 'Pull',
    date: '2026-10-23T10:00:00.000Z',
    durationMinutes: 50,
    caloriesBurned: 400,
  });
  recordMgr.create({
    userId: otherUserId,
    splitName: 'Legs & Core',
    date: '2026-10-22T10:00:00.000Z',
    durationMinutes: 55,
    caloriesBurned: 450,
  });

  assert.equal(recordMgr.readAll(testUserId).length, 2);
  assert.equal(recordMgr.readAll(otherUserId).length, 1);

  // Clear history for testUserId
  const deletedCount = recordMgr.clearRecordsByUserId(testUserId);
  assert.equal(deletedCount, 2);
  assert.equal(recordMgr.readAll(testUserId).length, 0);

  // Other user's records remain intact
  assert.equal(recordMgr.readAll(otherUserId).length, 1);
});

test('Stage 3: AuthManager changePassword and deleteAccount flows work end-to-end', () => {
  const authMgr = new AuthManager();
  const testUsername = `user_acc_${Date.now()}`;
  const regResult = authMgr.register(testUsername, 'secret123');
  assert.equal(regResult.success, true);
  const user = regResult.user!;

  // 1. Password change validation: wrong old password
  const failOld = authMgr.changePassword(user.id, 'wrongpassword', 'newsecret456');
  assert.equal(failOld.success, false);
  assert.equal(failOld.message, 'Current password is incorrect.');

  // 2. Password change validation: too short new password
  const failShort = authMgr.changePassword(user.id, 'secret123', 'ab');
  assert.equal(failShort.success, false);

  // 3. Password change success
  const passSuccess = authMgr.changePassword(user.id, 'secret123', 'newsecret456');
  assert.equal(passSuccess.success, true);

  // Verify login with new password succeeds and old fails
  assert.equal(authMgr.login(testUsername, 'secret123').success, false);
  assert.equal(authMgr.login(testUsername, 'newsecret456').success, true);

  // 4. Delete account permanently
  const deleteRes = authMgr.deleteAccount(user.id);
  assert.equal(deleteRes.success, true);

  // Verify user is gone from storage
  const users = StorageLayer.getTable<any>(STORAGE_KEYS.USERS);
  assert.equal(users.some((u) => u.id === user.id), false);
});
