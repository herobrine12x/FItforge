import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthManager, DEMO_PASSWORD, DEMO_USERNAME, simpleHash } from './AuthManager';
import { BMICalculator } from './BMICalculator';
import { CardioHIITSplit } from './CardioHIITSplit';
import { Exercise, nameToKebabCase } from './Exercise';
import { ExerciseLibrary } from './ExerciseLibrary';
import { FullBodySplit } from './FullBodySplit';
import { HomeBodyweightSplit } from './HomeBodyweightSplit';
import { LegsCoreSplit } from './LegsCoreSplit';
import { MemberProfile } from './MemberProfile';
import { PullSplit } from './PullSplit';
import { PushSplit } from './PushSplit';
import { RecordManager } from './RecordManager';
import { ReportGenerator } from './ReportGenerator';
import { StorageLayer } from './storage';
import { UpperBodySplit } from './UpperBodySplit';
import { User } from './User';
import { WorkoutPlanFactory } from './WorkoutPlanFactory';
import { WorkoutRecord } from './WorkoutRecord';

test('Exercise class encapsulates domain attributes and formats kebab-case imageUrl', () => {
  const ex = new Exercise(
    'bench_01',
    'Barbell Flat Bench Press',
    'Chest',
    'Barbell',
    'Intermediate',
    'Keep shoulder blades retracted and elbows tucked.'
  );

  assert.equal(ex.id, 'bench_01');
  assert.equal(ex.name, 'Barbell Flat Bench Press');
  assert.equal(ex.targetMuscle, 'Chest');
  assert.equal(ex.equipment, 'Barbell');
  assert.equal(ex.difficulty, 'Intermediate');
  assert.equal(ex.imageUrl, '/exercises/barbell-flat-bench-press.jpg');
  assert.equal(ex.formTip, 'Keep shoulder blades retracted and elbows tucked.');

  // Test nameToKebabCase
  assert.equal(nameToKebabCase('45-Degree Leg Press (Sled)'), '45-degree-leg-press-sled');
  assert.equal(nameToKebabCase('High Knees Sprint in Place'), 'high-knees-sprint-in-place');

  // Test prescription cloning
  const prescribed = ex.prescribe(4, 10, 75);
  assert.equal(prescribed.sets, 4);
  assert.equal(prescribed.reps, 10);
  assert.equal(prescribed.restSeconds, 75);
  assert.equal(prescribed.name, 'Barbell Flat Bench Press');
});

test('ExerciseLibrary encapsulates pools with 10-12 exercises across all 7 splits', () => {
  const library = ExerciseLibrary.getInstance();

  const pools = [
    { name: 'push', min: 10, max: 12 },
    { name: 'pull', min: 10, max: 12 },
    { name: 'legs_core', min: 10, max: 12 },
    { name: 'full_body', min: 10, max: 12 },
    { name: 'upper_body', min: 10, max: 12 },
    { name: 'home_bodyweight', min: 10, max: 12 },
    { name: 'cardio_hiit', min: 10, max: 12 },
  ];

  for (const p of pools) {
    const list = library.getPool(p.name);
    assert.ok(
      list.length >= p.min && list.length <= p.max,
      `Pool "${p.name}" has ${list.length} exercises, expected between ${p.min} and ${p.max}`
    );

    // Each pool must include exercises of multiple difficulties
    const difficulties = new Set(list.map((e) => e.difficulty));
    assert.ok(difficulties.size >= 2, `Pool "${p.name}" must cover multiple difficulty levels`);

    // Verify valid imageUrl
    list.forEach((e) => {
      assert.ok(e.imageUrl.startsWith('/exercises/'));
      assert.ok(e.imageUrl.endsWith('.jpg'));
      assert.ok(e.formTip.length > 0);
    });
  }

  const all = library.getAllExercises();
  assert.ok(all.length >= 60, `Catalog should hold 60+ unique exercises, got ${all.length}`);
});

test('All 7 WorkoutPlan subclasses exhibit polymorphism, distinct MET values, and valid 5-exercise selections', () => {
  const push = new PushSplit();
  const pull = new PullSplit();
  const legs = new LegsCoreSplit();
  const fullBody = new FullBodySplit();
  const upper = new UpperBodySplit();
  const home = new HomeBodyweightSplit();
  const hiit = new CardioHIITSplit();

  const allPlans = [push, pull, legs, fullBody, upper, home, hiit];

  // MET values: HIIT highest (8.5), Home Bodyweight lowest (5.0)
  assert.equal(hiit.getMETValue(), 8.5);
  assert.equal(home.getMETValue(), 5.0);
  assert.equal(legs.getMETValue(), 7.5);
  assert.equal(fullBody.getMETValue(), 7.0);
  assert.equal(upper.getMETValue(), 6.8);
  assert.equal(pull.getMETValue(), 6.5);
  assert.equal(push.getMETValue(), 6.0);

  // Check HIIT is strictly the highest MET
  for (const plan of allPlans) {
    if (plan !== hiit) {
      assert.ok(hiit.getMETValue() > plan.getMETValue(), 'HIIT must have the highest MET');
    }
    if (plan !== home) {
      assert.ok(home.getMETValue() < plan.getMETValue(), 'Home Bodyweight must have the lowest MET');
    }
  }

  // Calorie calculation test: MET x weightKg x (minutes / 60)
  // Weight: 70kg, 60 mins -> HIIT = 8.5 * 70 = 595, Home = 5.0 * 70 = 350
  assert.equal(hiit.calculateCalories(70, 60), 595);
  assert.equal(home.calculateCalories(70, 60), 350);

  // Verify routine rules across all 7 splits and all 3 difficulty levels:
  // 1. Exactly 5 exercises
  // 2. No duplicates within the 5
  // 3. Mix of at least 2 distinct target muscles
  for (const plan of allPlans) {
    for (const level of ['Beginner', 'Intermediate', 'Advanced'] as const) {
      const routine = plan.getExercises(level);

      assert.equal(
        routine.length,
        5,
        `Plan ${plan.name} at level ${level} must prescribe exactly 5 exercises, got ${routine.length}`
      );

      // No duplicates within the 5
      const ids = new Set(routine.map((e) => e.id));
      assert.equal(
        ids.size,
        5,
        `Plan ${plan.name} at level ${level} must have 5 unique exercises without duplicates`
      );

      // At least 2 distinct target muscles
      const muscles = new Set(routine.map((e) => e.targetMuscle));
      assert.ok(
        muscles.size >= 2,
        `Plan ${plan.name} at level ${level} must include at least 2 target muscles, got ${muscles.size}`
      );

      // Progression checks
      if (plan instanceof CardioHIITSplit) {
        assert.ok(typeof routine[0].reps === 'string' && routine[0].reps.includes('work'));
      } else {
        if (level === 'Beginner') {
          assert.equal(routine[0].sets, 3);
          assert.ok(routine[0].restSeconds >= 75);
        } else if (level === 'Advanced') {
          assert.equal(routine[0].sets, 5);
          assert.ok(routine[0].restSeconds <= 60);
        }
      }
    }
  }
});

test('shuffle(seed) generates alternate valid 5-exercise selections while default remains deterministic', () => {
  const plan = new PushSplit();

  // Default is deterministic
  const defaultA = plan.getExercises('Intermediate').map((e) => e.id);
  const defaultB = plan.getExercises('Intermediate').map((e) => e.id);
  assert.deepEqual(defaultA, defaultB);

  // Shuffled with seed
  plan.shuffle(42);
  const shuffledA = plan.getExercises('Intermediate').map((e) => e.id);

  plan.shuffle(99);
  const shuffledB = plan.getExercises('Intermediate').map((e) => e.id);

  // Verifies that shuffling produces valid sets
  assert.equal(shuffledA.length, 5);
  assert.equal(new Set(shuffledA).size, 5);

  // Different seeds should produce variations from the pool
  const hasVariation = shuffledA.some((id, idx) => id !== shuffledB[idx]) || shuffledA.some((id, idx) => id !== defaultA[idx]);
  assert.ok(hasVariation, 'Shuffle option must provide alternate valid selections');
});

test('WorkoutPlanFactory instantiates all 7 split subclasses', () => {
  assert.ok(WorkoutPlanFactory.create('Push') instanceof PushSplit);
  assert.ok(WorkoutPlanFactory.create('Pull') instanceof PullSplit);
  assert.ok(WorkoutPlanFactory.create('Legs & Core') instanceof LegsCoreSplit);
  assert.ok(WorkoutPlanFactory.create('Full Body') instanceof FullBodySplit);
  assert.ok(WorkoutPlanFactory.create('Upper Body') instanceof UpperBodySplit);
  assert.ok(WorkoutPlanFactory.create('Home Bodyweight') instanceof HomeBodyweightSplit);
  assert.ok(WorkoutPlanFactory.create('Cardio HIIT') instanceof CardioHIITSplit);

  const all = WorkoutPlanFactory.getAllSplits();
  assert.equal(all.length, 7);
});

test('User, AuthManager, MemberProfile, BMICalculator, and RecordManager continue passing core invariants', () => {
  StorageLayer.clearAll();
  const auth = new AuthManager();

  // Demo login
  const login = auth.login(DEMO_USERNAME, DEMO_PASSWORD);
  assert.equal(login.success, true);
  assert.equal(auth.getCurrentUser()?.username, 'demo');

  // BMICalculator
  assert.equal(BMICalculator.calculate(72, 175), 23.5);
  assert.equal(BMICalculator.classify(23.5), 'Normal');
  assert.equal(BMICalculator.classify(31.2), 'Obese');

  // Profile encapsulation
  const profile = auth.getCurrentProfile();
  assert.ok(profile);
  assert.throws(() => { profile.heightCm = -5; }, /positive number/);
  assert.throws(() => { profile.weightKg = 400; }, /between 20 and 300 kg/);

  // RecordManager
  const manager = new RecordManager();
  const created = manager.create({
    userId: 'user_demo_01',
    splitName: 'Cardio HIIT',
    date: new Date().toISOString(),
    durationMinutes: 30,
    caloriesBurned: 320,
    exercisesCompleted: 5,
    totalExercises: 5,
    notes: 'HIIT session completed',
  });
  assert.ok(created.id);
  assert.equal(created.splitName, 'Cardio HIIT');

  // ReportGenerator
  const reporter = new ReportGenerator(manager);
  const sum = reporter.summary('user_demo_01');
  assert.ok(sum.totalWorkouts >= 1);
});
