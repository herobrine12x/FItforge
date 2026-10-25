import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLocalDateString,
  getTodayDateString,
  ScheduledWorkout,
} from './ScheduledWorkout';
import {
  checkBackToBackDays,
  buildWeeklyScheduleFromDays,
  ScheduleManager,
} from './ScheduleManager';
import { WeekdayKey } from './types';
import { StorageLayer } from './storage';

test('ScheduledWorkout rejects new workouts with dates in the past', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const pastDateStr = formatLocalDateString(yesterday);

  assert.throws(
    () => {
      ScheduledWorkout.createNew('user_test', 'push', pastDateStr);
    },
    { message: /past/i }
  );

  // Today and future dates succeed
  const today = getTodayDateString();
  const valid = ScheduledWorkout.createNew('user_test', 'push', today);
  assert.equal(valid.date, today);
  assert.equal(valid.status, 'planned');
});

test('ScheduledWorkout encapsulates attributes, status transitions, and rescheduling', () => {
  const today = getTodayDateString();
  const workout = ScheduledWorkout.createNew(
    'user_test_1',
    'pull',
    today,
    '09:30',
    'weekly',
    {
      routineName: 'Pull Split Heavy',
      targetMuscle: 'Back & Biceps',
      notes: 'Focus on deadlifts',
    }
  );

  assert.equal(workout.routineName, 'Pull Split Heavy');
  assert.equal(workout.repeat, 'weekly');
  assert.equal(workout.status, 'planned');

  workout.markDone();
  assert.equal(workout.status, 'done');

  workout.markMissed();
  assert.equal(workout.status, 'missed');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatLocalDateString(tomorrow);

  workout.reschedule(tomorrowStr, '10:00');
  assert.equal(workout.date, tomorrowStr);
  assert.equal(workout.time, '10:00');
  assert.equal(workout.status, 'planned');
});

test('checkBackToBackDays detects streaks of > 3 consecutive days and warns', () => {
  // 3 days spaced out
  const threeDays: WeekdayKey[] = ['mon', 'wed', 'fri'];
  const res3 = checkBackToBackDays(threeDays);
  assert.equal(res3.hasWarning, false);

  // 4 consecutive days: mon, tue, wed, thu
  const fourConsecutive: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu'];
  const res4 = checkBackToBackDays(fourConsecutive);
  assert.equal(res4.hasWarning, true);
  assert.equal(res4.maxConsecutive, 4);
  assert.match(res4.warningMessage, /consecutive training days/i);

  // Circular wrap: Fri, Sat, Sun, Mon (4 days)
  const wrapDays: WeekdayKey[] = ['fri', 'sat', 'sun', 'mon'];
  const resWrap = checkBackToBackDays(wrapDays);
  assert.equal(resWrap.hasWarning, true);
  assert.equal(resWrap.maxConsecutive, 4);
});

test('buildWeeklyScheduleFromDays reassigns focus across chosen days', () => {
  const schedule3 = buildWeeklyScheduleFromDays('user_x', ['mon', 'wed', 'fri']);
  assert.equal(schedule3.selectedDays.length, 3);
  assert.equal(schedule3.days.mon.isTrainingDay, true);
  assert.equal(schedule3.days.mon.routineId, 'push');
  assert.equal(schedule3.days.tue.isTrainingDay, false);
  assert.equal(schedule3.days.wed.routineId, 'pull');
  assert.equal(schedule3.days.fri.routineId, 'legs_core');

  // Change to 5 days
  const schedule5 = buildWeeklyScheduleFromDays('user_x', ['mon', 'tue', 'wed', 'thu', 'fri']);
  assert.equal(schedule5.selectedDays.length, 5);
  assert.equal(schedule5.days.thu.routineId, 'upper_body');
  assert.equal(schedule5.days.fri.routineId, 'cardio_hiit');
});

test('ScheduleManager moves workouts and swaps two workout days', () => {
  StorageLayer.clearAll();
  const manager = new ScheduleManager();
  const userId = 'user_swap_test';

  manager.updateSelectedWeekdays(userId, ['mon', 'wed']);
  const initial = manager.getWeeklySchedule(userId);
  assert.equal(initial.days.mon.routineId, 'upper_body');
  assert.equal(initial.days.wed.routineId, 'legs_core');

  // Move mon (upper_body) onto wed (legs_core) -> swaps the two!
  const swapped = manager.moveOrSwapDay(userId, 'mon', 'wed');
  assert.equal(swapped.days.mon.routineId, 'legs_core');
  assert.equal(swapped.days.wed.routineId, 'upper_body');

  // Move wed (upper_body) onto fri (rest day) -> moves upper_body to fri, wed becomes rest
  const movedToRest = manager.moveOrSwapDay(userId, 'wed', 'fri');
  assert.equal(movedToRest.days.fri.routineId, 'upper_body');
  assert.equal(movedToRest.days.fri.isTrainingDay, true);
  assert.equal(movedToRest.days.wed.isTrainingDay, false);
});

test('ScheduleManager marks past unperformed workouts as missed and allows rescheduling', () => {
  StorageLayer.clearAll();
  const manager = new ScheduleManager();
  const userId = 'user_missed_test';

  // Seed a planned workout with a past date directly via storage
  const pastDate = '2026-10-01';
  const table = [
    {
      id: 'sched_past_1',
      userId,
      routineId: 'push',
      routineName: 'Push Split',
      targetMuscle: 'Chest & Shoulders',
      date: pastDate,
      time: '08:00',
      repeat: 'never' as const,
      status: 'planned' as const,
      notes: '',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
  ];
  StorageLayer.saveTable('scheduled_workouts', table);

  // Check missed without matching record
  const result = manager.checkAndUpdateMissedWorkouts(userId, []);
  assert.equal(result.length, 1);
  assert.equal(result[0].status, 'missed');

  // Reschedule to next available day
  const rescheduleRes = manager.rescheduleToNextAvailableDay('sched_past_1', userId);
  assert.equal(rescheduleRes.success, true);
  assert.ok(rescheduleRes.newDate);
  assert.ok(rescheduleRes.newDate > getTodayDateString());

  const refreshed = manager.getScheduledWorkouts(userId);
  assert.equal(refreshed[0].status, 'planned');
  assert.equal(refreshed[0].date, rescheduleRes.newDate);
});
