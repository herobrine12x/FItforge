import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock,
  Dumbbell,
  Flame,
  LayoutDashboard,
  PlayCircle,
  PlusCircle,
  Scale,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { BmiGauge } from '../components/BmiGauge';
import { CalorieBarChart } from '../components/CalorieBarChart';
import { WeeklyGoalRing } from '../components/WeeklyGoalRing';
import { useAuth } from '../context/AuthContext';
import { BMICalculator } from '../models/BMICalculator';
import { RecordManager } from '../models/RecordManager';
import { WorkoutRecord } from '../models/WorkoutRecord';
import { formatDisplayDate, formatWeight, getWeekDates } from '../utils/units';

export function DashboardPage() {
  const { currentUser, currentProfile, userPreferences } = useAuth();
  const navigate = useNavigate();
  const [recordManager] = useState(() => new RecordManager());

  // Load current athlete records
  const userRecords = useMemo(() => {
    if (!currentUser) return [];
    return recordManager.readAll(currentUser.id);
  }, [currentUser, recordManager]);

  // Biometrics & calculations
  const weightKg = currentProfile?.weightKg || 70;
  const heightCm = currentProfile?.heightCm || 175;
  const weeklyGoal = currentProfile?.weeklyGoal || 3;
  const athleteName = currentProfile?.name || currentUser?.username || 'Athlete';

  // Calculate BMI safely
  const bmiScore = useMemo(() => {
    try {
      return BMICalculator.calculate(weightKg, heightCm);
    } catch {
      return 22.5;
    }
  }, [weightKg, heightCm]);

  const bmiCategory = useMemo(() => {
    try {
      return BMICalculator.classify(bmiScore);
    } catch {
      return 'Normal';
    }
  }, [bmiScore]);

  // Aggregate stats
  const totalWorkouts = userRecords.length;
  const totalCaloriesBurned = userRecords.reduce((sum, r) => sum + (r.caloriesBurned || 0), 0);

  // Workouts completed this week (Monday to Sunday)
  const workoutsThisWeek = useMemo(() => {
    const { startOfWeek, endOfWeek } = getWeekDates(new Date());
    return userRecords.filter((r) => {
      const d = new Date(r.date);
      return d >= startOfWeek && d <= endOfWeek;
    }).length;
  }, [userRecords]);

  // Formatted date string
  const todayFormatted = formatDisplayDate(new Date());

  const hasNoWorkouts = totalWorkouts === 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ================= HERO GREETING & START WORKOUT CTA ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#16161D] via-[#16161D] to-[#24242E]/70 rounded-3xl border border-[#24242E] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
              <Calendar className="w-3.5 h-3.5 text-[#C6FF3D]" />
              <span>{todayFormatted}</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#F4F4F6]">
              Welcome back, <span className="text-[#C6FF3D]">{athleteName}</span>
            </h1>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Track your biometrics, monitor weekly targets, and elevate your fitness progression with intelligent splits.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              to="/recommender"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-sm transition-all duration-200 shadow-lg shadow-[#C6FF3D]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <PlayCircle className="w-5 h-5 stroke-[2.5]" />
              <span>Start Workout</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 4 STAT CARDS ================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Key Athlete Statistics">
        {/* Card 1: Current Weight */}
        <div className="p-5 rounded-3xl bg-[#16161D] border border-[#24242E] flex flex-col justify-between hover:border-[#C6FF3D]/30 transition-colors">
          <div className="flex items-center justify-between text-[#A1A1AA] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Current Weight</span>
            <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#F4F4F6]">
              {formatWeight(weightKg, userPreferences.units)}
            </div>
            <div className="text-[11px] text-[#A1A1AA] mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-mono text-[10px]">Active</span>
              <span>· Profile biometrics</span>
            </div>
          </div>
        </div>

        {/* Card 2: BMI Score */}
        <div className="p-5 rounded-3xl bg-[#16161D] border border-[#24242E] flex flex-col justify-between hover:border-[#C6FF3D]/30 transition-colors">
          <div className="flex items-center justify-between text-[#A1A1AA] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">BMI Index</span>
            <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#F4F4F6]">
              {bmiScore.toFixed(1)}
            </div>
            <div className="text-[11px] mt-1 flex items-center gap-1.5 font-medium">
              <span
                className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md ${
                  bmiCategory === 'Normal'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : bmiCategory === 'Obese'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {bmiCategory}
              </span>
              <span className="text-[#A1A1AA] text-[10px]">Diagnostic</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Workouts */}
        <div className="p-5 rounded-3xl bg-[#16161D] border border-[#24242E] flex flex-col justify-between hover:border-[#C6FF3D]/30 transition-colors">
          <div className="flex items-center justify-between text-[#A1A1AA] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Workouts</span>
            <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#F4F4F6]">
              {totalWorkouts}
            </div>
            <div className="text-[11px] text-[#A1A1AA] mt-1">
              {totalWorkouts === 1 ? '1 session logged' : `${totalWorkouts} sessions logged`}
            </div>
          </div>
        </div>

        {/* Card 4: Total Calories Burned */}
        <div className="p-5 rounded-3xl bg-[#16161D] border border-[#24242E] flex flex-col justify-between hover:border-[#C6FF3D]/30 transition-colors">
          <div className="flex items-center justify-between text-[#A1A1AA] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Calories Burned</span>
            <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#F4F4F6]">
              {totalCaloriesBurned.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#A1A1AA] mt-1 font-mono">
              kcal total energy
            </div>
          </div>
        </div>
      </section>

      {/* ================= CHARTS & GAUGES SECTION ================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Semicircle BMI Gauge Card */}
        <BmiGauge bmi={bmiScore} category={bmiCategory} />

        {/* Weekly Goal Progress Ring Card */}
        <WeeklyGoalRing completedThisWeek={workoutsThisWeek} weeklyGoal={weeklyGoal} />

        {/* 7-Day Calories Bar Chart Card */}
        <div className="md:col-span-2 lg:col-span-1">
          <CalorieBarChart records={userRecords} />
        </div>
      </section>

      {/* ================= WORKOUT HISTORY OR EMPTY STATE ================= */}
      {hasNoWorkouts ? (
        /* Polished Empty State when there are no workouts yet */
        <section className="p-8 sm:p-12 bg-[#16161D] rounded-3xl border border-[#24242E] text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D] mx-auto shadow-lg shadow-[#C6FF3D]/5">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#F4F4F6]">
              No workouts recorded yet
            </h3>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              Kickstart your training journey! Choose a routine customized to your experience level, record your completed sets, and watch your progress stats populate.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/recommender')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs transition-all shadow-md shadow-[#C6FF3D]/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Start Workout Now</span>
            </button>
          </div>
        </section>
      ) : (
        /* Recent Activity Summary */
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C6FF3D]" />
              <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-[#F4F4F6]">
                Recent Sessions
              </h2>
            </div>
            <Link
              to="/history"
              className="text-xs font-mono text-[#C6FF3D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {userRecords.slice(0, 3).map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-2xl bg-[#16161D] border border-[#24242E] hover:border-[#2E2E3C] transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#F4F4F6] truncate">{record.splitName}</h3>
                    <p className="text-[11px] font-mono text-[#A1A1AA]">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#C6FF3D]/10 text-[#C6FF3D] px-2 py-0.5 rounded-md font-bold">
                    {record.caloriesBurned} kcal
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#A1A1AA] pt-1 border-t border-[#24242E]/60">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    {record.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Dumbbell className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    {record.exercisesCompleted}/{record.totalExercises} exercises
                  </span>
                </div>

                {record.notes && (
                  <p className="text-[11px] text-[#71717A] italic truncate">
                    "{record.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
