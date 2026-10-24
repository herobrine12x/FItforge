import test from 'node:test';
import assert from 'node:assert/strict';
import { MemberProfile } from './MemberProfile';
import { WorkoutPlanFactory } from './WorkoutPlanFactory';
import { ExerciseLibrary } from './ExerciseLibrary';
import { EQUIPMENT_PRESETS, getActivePreset } from '../utils/equipment';
import { EquipmentType } from './types';

test('Equipment Availability: MemberProfile encapsulates availableEquipment with invariants and Bodyweight locking', () => {
  const profile = new MemberProfile({
    id: 'p1',
    userId: 'u1',
    name: 'Athlete',
    age: 25,
    gender: 'Male',
    heightCm: 180,
    weightKg: 75,
    experienceLevel: 'Intermediate',
    weeklyGoal: 4,
  });

  // Default: all 5 options
  const defaultEquip = profile.availableEquipment;
  assert.equal(defaultEquip.length, 5);
  assert.ok(defaultEquip.includes('Bodyweight'));
  assert.ok(defaultEquip.includes('Dumbbell'));
  assert.ok(defaultEquip.includes('Barbell'));
  assert.ok(defaultEquip.includes('Machine'));
  assert.ok(defaultEquip.includes('Cable'));

  // Setting empty array or non-array resets to all options
  profile.availableEquipment = [];
  assert.equal(profile.availableEquipment.length, 5);

  // Bodyweight cannot be removed even if omitted from array
  profile.availableEquipment = ['Dumbbell', 'Barbell'] as EquipmentType[];
  assert.ok(profile.availableEquipment.includes('Bodyweight'));
  assert.ok(profile.availableEquipment.includes('Dumbbell'));
  assert.ok(profile.availableEquipment.includes('Barbell'));

  // "No equipment" preset sets Bodyweight only
  profile.availableEquipment = ['Bodyweight'];
  assert.deepEqual(profile.availableEquipment, ['Bodyweight']);

  // toJSON serialization preserves availableEquipment
  const json = profile.toJSON();
  assert.deepEqual(json.availableEquipment, ['Bodyweight']);
});

test('Equipment Availability: 3 quick presets map to correct configurations', () => {
  const fullGym = EQUIPMENT_PRESETS.find((p) => p.id === 'full_gym')!;
  assert.equal(fullGym.equipment.length, 5);
  assert.equal(getActivePreset(fullGym.equipment), 'full_gym');

  const homeDumbbells = EQUIPMENT_PRESETS.find((p) => p.id === 'home_dumbbells')!;
  assert.deepEqual(homeDumbbells.equipment, ['Bodyweight', 'Dumbbell']);
  assert.equal(getActivePreset(homeDumbbells.equipment), 'home_dumbbells');

  const noEquipment = EQUIPMENT_PRESETS.find((p) => p.id === 'no_equipment')!;
  assert.deepEqual(noEquipment.equipment, ['Bodyweight']);
  assert.equal(getActivePreset(noEquipment.equipment), 'no_equipment');
});

test('Equipment Availability: WorkoutPlan subclasses filter by equipment polymorphically in base class', () => {
  // Push split with only Dumbbell + Bodyweight
  const pushPlan = WorkoutPlanFactory.create('push');
  const routine = pushPlan.getExercises('Intermediate', ['Bodyweight', 'Dumbbell']);

  assert.equal(routine.length, 5, 'Must return exactly 5 exercises');
  for (const ex of routine) {
    assert.ok(
      ex.equipment === 'Bodyweight' || ex.equipment === 'Dumbbell',
      `Exercise ${ex.name} (${ex.equipment}) must match available equipment`
    );
  }
});

test('Equipment Availability: Swaps missing equipment with bodyweight alternatives and sets note flag', () => {
  const pushPlan = WorkoutPlanFactory.create('push');
  // In push split, with 'Bodyweight' only, pool only has 1 bodyweight exercise (push_05)
  const routine = pushPlan.getExercises('Intermediate', ['Bodyweight']);

  assert.equal(routine.length, 5, 'Never returns fewer than 5 exercises');
  assert.equal(pushPlan.hasEquipmentSwaps, true, 'Flags that exercises were swapped for bodyweight alternatives');

  for (const ex of routine) {
    assert.equal(ex.equipment, 'Bodyweight', 'All returned exercises must be Bodyweight');
  }
});

test('Equipment Availability: If no exercises match a split (Pull with no equipment), returns empty array without crashing', () => {
  const pullPlan = WorkoutPlanFactory.create('pull');
  const routine = pullPlan.getExercises('Intermediate', ['Bodyweight']);

  assert.equal(routine.length, 0, 'Pull with no equipment has 0 matching exercises');
  assert.equal(pullPlan.hasMatchingExercises(['Bodyweight']), false);

  // Pull with Dumbbell matches
  const dbRoutine = pullPlan.getExercises('Intermediate', ['Bodyweight', 'Dumbbell']);
  assert.equal(dbRoutine.length, 5, 'Pull with dumbbells succeeds');
});
