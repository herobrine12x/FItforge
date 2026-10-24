import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthManager, DEMO_PASSWORD, DEMO_USERNAME, DEMO_USER_ID, simpleHash } from './AuthManager';
import { BMICalculator } from './BMICalculator';
import { MemberProfile } from './MemberProfile';
import { StorageLayer, STORAGE_KEYS } from './storage';
import { IUserData, IMemberProfileData } from './types';
import { User } from './User';

test('AuthManager enforces validation rules and rejects invalid credentials', () => {
  const auth = new AuthManager();

  // Test empty username rejection
  const resEmptyUser = auth.register('', 'password123');
  assert.equal(resEmptyUser.success, false);
  assert.match(resEmptyUser.message, /empty/i);

  // Test short password rejection
  const resShortPass = auth.register('testuser1', '123');
  assert.equal(resShortPass.success, false);
  assert.match(resShortPass.message, /at least 4 characters/i);

  // Test duplicate username rejection against demo account
  const resDuplicate = auth.register(DEMO_USERNAME, 'newpassword123');
  assert.equal(resDuplicate.success, false);
  assert.match(resDuplicate.message, /already taken/i);

  // Test valid registration
  const uniqueName = `tester_${Date.now()}`;
  const resValid = auth.register(uniqueName, 'secure123');
  assert.equal(resValid.success, true);
  assert.ok(resValid.user);
  assert.equal(resValid.user.username, uniqueName);

  // Verify simpleHash works and doesn't store plaintext
  assert.notEqual(resValid.user.passwordHash, 'secure123');
  assert.ok(resValid.user.verifyPassword(simpleHash('secure123')));
  assert.equal(resValid.user.verifyPassword(simpleHash('wrongpassword')), false);
});

test('MemberProfile strictly enforces physiological ranges for 3-step onboarding', () => {
  // Test invalid age (< 10 or > 100)
  assert.throws(() => {
    new MemberProfile({
      id: 'prof_t1',
      userId: 'test_u',
      name: 'Tester',
      age: 9,
      gender: 'Male',
      heightCm: 175,
      weightKg: 70,
      experienceLevel: 'Intermediate',
      weeklyGoal: 3,
    });
  }, /Age must be between 10 and 100/);

  assert.throws(() => {
    new MemberProfile({
      id: 'prof_t2',
      userId: 'test_u',
      name: 'Tester',
      age: 105,
      gender: 'Male',
      heightCm: 175,
      weightKg: 70,
      experienceLevel: 'Intermediate',
      weeklyGoal: 3,
    });
  }, /Age must be between 10 and 100/);

  // Test invalid height (< 50 or > 250)
  assert.throws(() => {
    new MemberProfile({
      id: 'prof_t3',
      userId: 'test_u',
      name: 'Tester',
      age: 25,
      gender: 'Male',
      heightCm: 45,
      weightKg: 70,
      experienceLevel: 'Intermediate',
      weeklyGoal: 3,
    });
  }, /Height must be between 50 and 250/);

  // Test invalid weight (< 20 or > 300)
  assert.throws(() => {
    new MemberProfile({
      id: 'prof_t4',
      userId: 'test_u',
      name: 'Tester',
      age: 25,
      gender: 'Male',
      heightCm: 175,
      weightKg: 15,
      experienceLevel: 'Intermediate',
      weeklyGoal: 3,
    });
  }, /Weight must be between 20 and 300/);

  // Test valid profile creation and BMI calculation
  const validProfile = new MemberProfile({
    id: 'prof_t5',
    userId: 'test_u',
    name: 'Valid Athlete',
    age: 26,
    gender: 'Female',
    heightCm: 170,
    weightKg: 65,
    experienceLevel: 'Advanced',
    weeklyGoal: 5,
  });

  assert.equal(validProfile.name, 'Valid Athlete');
  assert.equal(validProfile.experienceLevel, 'Advanced');
  assert.equal(validProfile.weeklyGoal, 5);

  const bmi = BMICalculator.calculate(validProfile.weightKg, validProfile.heightCm);
  assert.equal(bmi, 22.5);
  assert.equal(BMICalculator.classify(bmi), 'Normal');
});

test('Demo account authentication succeeds and restores session', () => {
  const auth = new AuthManager();
  const res = auth.login(DEMO_USERNAME, DEMO_PASSWORD);
  assert.equal(res.success, true);
  assert.ok(res.user);
  assert.equal(res.user.id, DEMO_USER_ID);

  const current = auth.getCurrentUser();
  assert.ok(current);
  assert.equal(current.username, DEMO_USERNAME);

  // Test logout
  auth.logout();
  const afterLogout = auth.getCurrentUser();
  assert.equal(afterLogout, null);
});
