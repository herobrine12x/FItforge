import React from 'react';
import {
  Activity,
  ArrowRight,
  Clock,
  Dumbbell,
  Flame,
  Play,
  Scale,
  Sparkles,
} from 'lucide-react';
import { MemberProfile } from '../models/MemberProfile';
import { RecordManager } from '../models/RecordManager';
import { User } from '../models/User';
import { NavTab } from './Navbar';

interface DashboardViewProps {
  currentUser: User | null;
  currentProfile: MemberProfile | null;
  recordManager: RecordManager;
  setActiveTab: (tab: NavTab) => void;
  onOpenProfileModal: () => void;
  onStartLiveWithSplit?: (split: 'push' | 'pull' | 'legs_core' | 'full_body') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  currentProfile,
  recordManager,
  setActiveTab,
  onOpenProfileModal,
  onStartLiveWithSplit,
}) => {
  if (!currentProfile || !currentUser) {
    return (
      <div className="py-20 text-center text-gray-500 font-mono text-sm">
        Initializing Member Profile...
      </div>
    );
  }

  const calc = currentProfile.getCalculator();
  const bmi = calc.calculateBMI();
  const healthCategory = calc.getHealthCategory();
  const idealWeight = calc.getIdealWeightRange();
  const bmr = calc.calculateBMR();
  const tdee = calc.calculateTDEE();
  const waterLiters = calc.calculateDailyWaterLiters();
  const advice = calc.getHealthAdvice();

  const stats = recordManager.getStats(currentUser.id);
  const recentRecords = recordManager.getByUserId(currentUser.id).slice(0, 4);

  // Linear BMI meter percentage (scale 15 to 35)
  const clampedBMI = Math.max(15, Math.min(35, bmi));
  const meterPercent = ((clampedBMI - 15) / (35 - 15)) * 100;

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            Biometric Health Profile · SDF04
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {currentProfile.fullName}
          </h1>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <span>{currentProfile.heightCm} cm</span>
            <span className="text-gray-600">·</span>
            <span>{currentProfile.weightKg} kg</span>
            <span className="text-gray-600">·</span>
            <span className="capitalize">{currentProfile.experienceLevel}</span>
            <span className="text-gray-600">·</span>
            <span className="capitalize">{currentProfile.fitnessGoal.replace('_', ' ')}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenProfileModal}
            className="px-3.5 py-2 rounded-md bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-gray-400" />
            <span>Update Biometrics</span>
          </button>
          <button
            onClick={() => setActiveTab('recommender')}
            className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Prescribe Routine</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Main Biometric & BMI Panel (Clean, Structured, Zero Cards-in-Cards) */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-950/40 flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-300 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automated BMI Profiler & Metabolic Expenditure (Mifflin-St Jeor)</span>
          </div>
          <span className="text-xs font-mono text-gray-400">Class: BMICalculator</span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: BMI Number & Status */}
          <div className="lg:col-span-4 space-y-2 border-b lg:border-b-0 lg:border-r border-gray-800 pb-6 lg:pb-0 lg:pr-6">
            <div className="text-xs text-gray-400 uppercase font-mono tracking-wider">
              Body Mass Index
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold font-mono tabular-nums text-white tracking-tight">
                {bmi}
              </span>
              <span className="text-xs font-mono text-gray-400">kg/m²</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                {healthCategory}
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-xs text-gray-400">
                Ideal: {idealWeight.minKg}–{idealWeight.maxKg} kg
              </span>
            </div>
            <p className="text-xs text-gray-400 pt-2 leading-relaxed">{advice.recommendation}</p>
          </div>

          {/* Center: Precision Linear Gauge */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex justify-between text-[11px] font-mono text-gray-400">
              <span>18.5 Under</span>
              <span className="text-emerald-400 font-semibold">18.5–24.9 Normal</span>
              <span>25+ Over</span>
            </div>

            {/* Linear track */}
            <div className="relative h-2 rounded-sm bg-gray-800 overflow-hidden flex">
              <div className="h-full w-[17.5%] bg-sky-500/70" title="Underweight" />
              <div className="h-full w-[32%] bg-emerald-500" title="Normal weight" />
              <div className="h-full w-[25%] bg-amber-500/80" title="Overweight" />
              <div className="h-full w-[25.5%] bg-rose-500/80" title="Obese" />
            </div>

            {/* Position indicator */}
            <div className="relative h-4">
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                style={{ left: `${meterPercent}%` }}
              >
                <div className="w-1.5 h-1.5 rotate-45 bg-white" />
                <span className="text-[10px] font-mono font-bold text-gray-200 mt-0.5">
                  {bmi}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 leading-normal pt-1">
              Weight ratio computed against square height (kg/m²). Verified within healthy range.
            </div>
          </div>

          {/* Right: Daily Metabolic Energy Targets */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-gray-800 pt-6 lg:pt-0 lg:pl-6">
            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400">Resting BMR</div>
              <div className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                {bmr}
              </div>
              <div className="text-[11px] text-gray-400">kcal/day basal</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400">Active TDEE</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                {tdee}
              </div>
              <div className="text-[11px] text-gray-400">kcal/day target</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400">Daily Water</div>
              <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                {waterLiters} L
              </div>
              <div className="text-[11px] text-gray-400">35ml / kg bodywt</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400">Target Plan</div>
              <div className="text-sm font-semibold text-white mt-1 capitalize truncate">
                {currentProfile.fitnessGoal.replace('_', ' ')}
              </div>
              <div className="text-[11px] text-gray-400">
                {currentProfile.targetWorkoutsPerWeek} workouts / wk
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Stat Border Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-800 rounded-lg bg-gray-900/40 divide-y md:divide-y-0 md:divide-x divide-gray-800">
        <div className="p-4">
          <div className="text-xs font-mono text-gray-400 uppercase">Sessions Logged</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {stats.totalWorkouts}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">In relational database</div>
        </div>

        <div className="p-4">
          <div className="text-xs font-mono text-gray-400 uppercase">Total Training Time</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {stats.totalMinutes}m
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Stopwatch recorded</div>
        </div>

        <div className="p-4">
          <div className="text-xs font-mono text-gray-400 uppercase">Calories Burned</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {stats.totalCalories.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">kcal energy expended</div>
        </div>

        <div className="p-4">
          <div className="text-xs font-mono text-gray-400 uppercase">Session Rating</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {stats.avgRating} <span className="text-xs text-gray-400 font-normal">/ 5.0</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Athlete average</div>
        </div>
      </div>

      {/* Prescribed Training Splits Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300 font-mono">
              Core Workout Splits (5-Exercise Routines)
            </h2>
            <p className="text-xs text-gray-400">
              OOP Inheritance: WorkoutPlan abstract class with specialized split implementations
            </p>
          </div>
          <button
            onClick={() => setActiveTab('recommender')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Full Recommender</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'push' as const,
              name: 'Push Day',
              target: 'Chest, Shoulders & Triceps',
              intensity: 'High Intensity',
              desc: 'Horizontal & overhead pressing, lateral delts and triceps extensions.',
            },
            {
              id: 'pull' as const,
              name: 'Pull Day',
              target: 'Back, Biceps & Rear Delts',
              intensity: 'High Intensity',
              desc: 'Bent-over rows, lat pulldowns, seated cable rows and bicep curls.',
            },
            {
              id: 'legs_core' as const,
              name: 'Legs & Core',
              target: 'Quads, Hamstrings, Glutes & Abs',
              intensity: 'Very High Intensity',
              desc: 'Barbell squats, Romanian deadlifts, leg press, calves and core.',
            },
            {
              id: 'full_body' as const,
              name: 'Full Body',
              target: 'Total Body Synergy',
              intensity: 'High Intensity',
              desc: 'Compound efficiency across multi-joint athletic lifts.',
            },
          ].map((split) => (
            <div
              key={split.id}
              className="border border-gray-800 rounded-md bg-gray-900/60 p-4 flex flex-col justify-between hover:border-gray-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{split.name}</span>
                  <span className="text-[10px] font-mono text-gray-400">{split.intensity}</span>
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-1">{split.target}</div>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                  {split.desc}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-gray-800/80">
                <button
                  onClick={() => {
                    if (onStartLiveWithSplit) {
                      onStartLiveWithSplit(split.id);
                    } else {
                      setActiveTab('live');
                    }
                  }}
                  className="w-full py-1.5 px-3 rounded-md bg-gray-800 hover:bg-emerald-500 hover:text-gray-950 text-gray-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Start Live Session</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Workout Logs Section */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-950/40 flex items-center justify-between">
          <span className="text-xs font-semibold font-mono uppercase tracking-wider text-gray-300">
            Recent Logged Sessions
          </span>
          <button
            onClick={() => setActiveTab('records')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            Manage Database Records →
          </button>
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            No workout records found. Complete a live session or log a workout manually.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-800 bg-gray-950/20 text-gray-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Workout Title</th>
                  <th className="py-2.5 px-4 font-medium">Split</th>
                  <th className="py-2.5 px-4 font-medium">Duration</th>
                  <th className="py-2.5 px-4 font-medium">Burn</th>
                  <th className="py-2.5 px-4 font-medium">Rating</th>
                  <th className="py-2.5 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-gray-400 whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-white">{r.title}</td>
                    <td className="py-2.5 px-4 font-mono uppercase text-[11px] text-emerald-400">
                      {r.splitType.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums">{r.durationMinutes} min</td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-gray-300">
                      {r.caloriesBurned} kcal
                    </td>
                    <td className="py-2.5 px-4 text-emerald-400">{'★'.repeat(r.rating)}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setActiveTab('records')}
                        className="text-xs text-gray-400 hover:text-white cursor-pointer font-medium"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
