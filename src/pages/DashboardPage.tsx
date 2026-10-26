import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  LayoutDashboard,
  Lock,
  Play,
  PlayCircle,
  Plus,
  PlusCircle,
  Scale,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { BmiGauge } from '../components/BmiGauge';
import { BodyWeightChart } from '../components/BodyWeightChart';
import { BodyWeightModal } from '../components/BodyWeightModal';
import { CalorieBarChart } from '../components/CalorieBarChart';
import { DeloadBanner } from '../components/DeloadBanner';
import { WeeklyGoalRing } from '../components/WeeklyGoalRing';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DeloadManager } from '../models/DeloadManager';
import {
  Achievement,
  AchievementManager,
  calculateStreak,
} from '../models/Achievement';
import { BMICalculator } from '../models/BMICalculator';
import { RecordManager } from '../models/RecordManager';
import {
  ALL_WEEKDAYS,
  ScheduleManager,
  WEEKDAY_FULL_NAMES,
} from '../models/ScheduleManager';
import {
  formatLocalDateString,
  getTodayDateString,
  ScheduledWorkout,
} from '../models/ScheduledWorkout';
import { WeekdayKey } from '../models/types';
import { WorkoutRecord } from '../models/WorkoutRecord';
import { formatDisplayDate, formatWeight, getWeekDates } from '../utils/units';

export function DashboardPage() {
  const { currentUser, currentProfile, userPreferences, updateProfile } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();
  const navigate = useNavigate();
  const [recordManager] = useState(() => new RecordManager());
  const [scheduleManager] = useState(() => new ScheduleManager());
  const [achievementManager] = useState(() => new AchievementManager());

  const [refreshKey, setRefreshKey] = useState(0);
  const userId = currentUser?.id || 'demo_user';
  const todayDateStr = getTodayDateString();

  // Load current athlete records
  const userRecords = useMemo(() => {
    if (!currentUser) return [];
    return recordManager.readAll(currentUser.id);
  }, [currentUser, recordManager, refreshKey]);

  // Load scheduled workouts and weekly schedule
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState(() =>
    scheduleManager.getWeeklySchedule(userId)
  );

  // Motivation: Badges state
  const [badges, setBadges] = useState<Achievement[]>([]);

  // Motivation: Streak calculation with 1-day rest grace rule
  const { currentStreak, bestStreak } = useMemo(() => {
    return calculateStreak(userRecords);
  }, [userRecords]);

  // Deload Week Detection (triggers after 4 consecutive weeks of training)
  const deloadStatus = useMemo(() => {
    return DeloadManager.calculateConsecutiveTrainingWeeks(userRecords);
  }, [userRecords]);

  // Body Weight Modal state
  const [isLogWeightModalOpen, setIsLogWeightModalOpen] = useState(false);

  // Quick Walk Modal state
  const [isLogWalkModalOpen, setIsLogWalkModalOpen] = useState(false);
  const [walkDuration, setWalkDuration] = useState(30);
  const [walkNotes, setWalkNotes] = useState('Brisk outdoor walk');

  // Beginner Basics first-visit banner state (dismissible and remembered)
  const [isBasicsBannerDismissed, setIsBasicsBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fitforge_dismissed_beginner_banner') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissBasicsBanner = () => {
    setIsBasicsBannerDismissed(true);
    try {
      localStorage.setItem('fitforge_dismissed_beginner_banner', 'true');
    } catch {
      // safe
    }
  };

  // Check and unlock badges on records update
  useEffect(() => {
    if (currentUser) {
      const { allBadges, newlyUnlocked } = achievementManager.checkAndUnlockBadges(
        currentUser.id,
        userRecords,
        currentProfile?.weeklyGoal || 3
      );
      setBadges(allBadges);

      if (newlyUnlocked.length > 0) {
        try {
          confetti({
            particleCount: 85,
            spread: 65,
            origin: { y: 0.6 },
            colors: ['#C6FF3D', '#FFFFFF', '#FFD700', '#00E5FF'],
          });
        } catch {
          // confetti safe
        }
        for (const b of newlyUnlocked) {
          showToastSuccess(`🏆 Badge Unlocked: ${b.title}!`);
        }
      }
    }
  }, [currentUser, userRecords, currentProfile?.weeklyGoal]);

  useEffect(() => {
    if (currentUser) {
      const updated = scheduleManager.checkAndUpdateMissedWorkouts(currentUser.id, userRecords);
      setScheduledWorkouts(updated);
      setWeeklySchedule(scheduleManager.getWeeklySchedule(currentUser.id));
    }
  }, [currentUser, userRecords]);

  // Biometrics & calculations
  const weightKg = currentProfile?.weightKg || 70;
  const heightCm = currentProfile?.heightCm || 175;
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

  // ================= REQUIREMENT 6 & 7: TODAY'S SCHEDULED WORKOUT & REMINDER =================
  // Determine day of the week for today: 'mon', 'tue', etc.
  const todayWeekday = useMemo<WeekdayKey>(() => {
    const dayIdx = new Date().getDay(); // 0 is Sun, 1 is Mon...
    const map: WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return map[dayIdx];
  }, []);

  // Check if today's workout was completed today in user records
  const isTodayWorkoutDone = useMemo(() => {
    return userRecords.some((rec) => {
      const recDateStr = formatLocalDateString(new Date(rec.date));
      return recDateStr === todayDateStr;
    });
  }, [userRecords, todayDateStr]);

  // Today's planned workout: specific scheduled date takes precedence over recurring weekday schedule
  const todayPlannedWorkout = useMemo(() => {
    // 1. Check if a specific ScheduledWorkout exists for today
    const specificToday = scheduledWorkouts.find((item) => item.date === todayDateStr);
    if (specificToday) {
      return {
        routineId: specificToday.routineId,
        routineName: specificToday.routineName,
        targetMuscle: specificToday.targetMuscle,
        time: specificToday.time,
        isSpecific: true,
        status: isTodayWorkoutDone ? 'done' : specificToday.status,
      };
    }

    // 2. Check weekly schedule for today's weekday
    const daySched = weeklySchedule.days[todayWeekday];
    if (daySched && daySched.isTrainingDay && daySched.routineId !== 'rest') {
      return {
        routineId: daySched.routineId,
        routineName: daySched.routineName,
        targetMuscle: daySched.targetMuscle,
        time: '',
        isSpecific: false,
        status: isTodayWorkoutDone ? 'done' : 'planned',
      };
    }

    // Rest day
    return null;
  }, [scheduledWorkouts, weeklySchedule, todayWeekday, todayDateStr, isTodayWorkoutDone]);

  // Requirement 7: The weekly progress ring counts ONLY the days the user actually scheduled
  const scheduledDaysTargetThisWeek = useMemo(() => {
    const scheduledWeekdaysCount = weeklySchedule.selectedDays?.length || 0;
    if (scheduledWeekdaysCount > 0) {
      return scheduledWeekdaysCount;
    }
    // Fall back to profile goal if user has not customized days
    return currentProfile?.weeklyGoal || 3;
  }, [weeklySchedule.selectedDays, currentProfile?.weeklyGoal]);

  const handleStartTodayWorkout = () => {
    const splitId = todayPlannedWorkout?.routineId || 'push';
    try {
      localStorage.setItem('fitforge_active_split', splitId);
    } catch {
      // safe
    }
    navigate('/workout', {
      state: { splitType: splitId },
    });
  };

  // Requirement 6: Trigger browser notification for today's pending workout (if enabled & granted)
  useEffect(() => {
    if (
      userPreferences.reminderEnabled &&
      todayPlannedWorkout &&
      todayPlannedWorkout.status !== 'done' &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      const sessionKey = `fitforge_notified_${todayDateStr}`;
      if (!sessionStorage.getItem(sessionKey)) {
        try {
          const notification = new Notification('FitForge Workout Reminder', {
            body: `Today's Workout: ${todayPlannedWorkout.routineName} is waiting for you!`,
            icon: '/assets/aistudio/fitforge-logo_28ede239.svg',
          });
          notification.onclick = () => {
            window.focus();
            handleStartTodayWorkout();
          };
          sessionStorage.setItem(sessionKey, 'true');
        } catch {
          // Notification safe fallback
        }
      }
    }
  }, [userPreferences.reminderEnabled, todayPlannedWorkout, todayDateStr]);

  // Quick Walk Logging (counts toward streaks, weekly goal, and first_walk badge)
  const handleSaveWalk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const userWeight = currentProfile?.weightKg || 70;
      // Walking MET ~3.8. Calories = 3.8 * weightKg * (durationMinutes / 60)
      const calories = Math.max(1, Math.round(3.8 * userWeight * (walkDuration / 60)));

      recordManager.createRecord({
        userId: currentUser.id,
        splitName: 'Outdoor Walk',
        splitType: 'walk',
        durationMinutes: walkDuration,
        caloriesBurned: calories,
        exercisesCompleted: 1,
        totalExercises: 1,
        notes: walkNotes.trim() || 'Active recovery walk',
        date: new Date().toISOString(),
      });

      setIsLogWalkModalOpen(false);
      setWalkDuration(30);
      setWalkNotes('Brisk outdoor walk');
      setRefreshKey((k) => k + 1);
      showToastSuccess(`Walk session saved! +${calories} kcal recorded.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log walk';
      showToastError(msg);
    }
  };

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-5 h-5 stroke-[2.2]" />;
      case 'Zap': return <Zap className="w-5 h-5 stroke-[2.2]" />;
      case 'Trophy': return <Trophy className="w-5 h-5 stroke-[2.2]" />;
      case 'Award': return <Award className="w-5 h-5 stroke-[2.2]" />;
      case 'Footprints': return <Footprints className="w-5 h-5 stroke-[2.2]" />;
      case 'Clock': return <Clock className="w-5 h-5 stroke-[2.2]" />;
      case 'Target': return <Target className="w-5 h-5 stroke-[2.2]" />;
      default: return <Play className="w-5 h-5 stroke-[2.2]" />;
    }
  };

  const hasNoWorkouts = totalWorkouts === 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ================= FIRST-VISIT BEGINNER BASICS BANNER ================= */}
      {!isBasicsBannerDismissed && (
        <section
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#16161D] via-[#1c1c28] to-[#16161D] border border-[#C6FF3D]/30 text-[#F4F4F6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-[#C6FF3D]/5 animate-in slide-in-from-top-3 duration-300 relative overflow-hidden"
          role="region"
          aria-label="Beginner basics introduction"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#C6FF3D] font-bold">
                  New to Training?
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#24242E] text-[#A1A1AA]">
                  Beginner Guide
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#F4F4F6]">
                Learn what sets, reps, and rest mean, how to pick your starting weights, and how to train safely.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Link
              to="/basics"
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs transition-all shadow-md shadow-[#C6FF3D]/15 cursor-pointer"
            >
              <span>Read Beginner Basics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleDismissBasicsBanner}
              className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#24242E] transition-colors cursor-pointer"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ================= DELOAD WEEK RECOMMENDATION BANNER (Requirement 5) ================= */}
      {deloadStatus.isDeloadRecommended && (
        <DeloadBanner
          consecutiveWeeks={deloadStatus.consecutiveWeeks}
          onDeloadModeToggled={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {/* ================= REQUIREMENT 6: REMINDER BANNER IF TODAY'S WORKOUT NOT DONE ================= */}
      {todayPlannedWorkout && todayPlannedWorkout.status !== 'done' && (
        <section
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#16161D] to-amber-950/30 border border-amber-500/50 text-[#F4F4F6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-amber-950/15 animate-in slide-in-from-top-3 duration-300"
          role="alert"
          aria-label="Pending workout reminder"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                  Today's Workout Pending
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  {WEEKDAY_FULL_NAMES[todayWeekday]}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#F4F4F6]">
                You have <strong className="text-white">{todayPlannedWorkout.routineName}</strong> planned for today
                {todayPlannedWorkout.time && ` at ${todayPlannedWorkout.time}`}. Ready to get after it?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartTodayWorkout}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs transition-all shadow-md shadow-[#C6FF3D]/20 cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Now</span>
          </button>
        </section>
      )}

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
              Track your biometrics, customize weekly training schedules, and elevate your fitness progression with intelligent splits.
            </p>

            {/* Small Equipment Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              <span className="text-[11px] font-mono text-[#A1A1AA] uppercase tracking-wider mr-1">
                Equipment:
              </span>
              {(currentProfile?.availableEquipment || [
                'Bodyweight',
                'Dumbbell',
                'Barbell',
                'Machine',
                'Cable',
              ]).map((eq) => (
                <span
                  key={eq}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#0B0B0F]/80 text-[#C6FF3D] border border-[#C6FF3D]/30 shadow-sm"
                >
                  {eq}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsLogWeightModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D]/40 text-[#F4F4F6] text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-[#C6FF3D]" />
              <span>Log Weight</span>
            </button>

            <Link
              to="/records"
              className="px-4 py-3 rounded-2xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D]/40 text-[#F4F4F6] text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-[#C6FF3D]" />
              <span>Records</span>
            </Link>

            <Link
              to="/summary"
              className="px-4 py-3 rounded-2xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D]/40 text-[#F4F4F6] text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#C6FF3D]" />
              <span>Summary</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsLogWalkModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D]/40 text-[#F4F4F6] text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Footprints className="w-4 h-4 text-[#C6FF3D]" />
              <span>Log Walk</span>
            </button>

            <Link
              to="/schedule"
              className="px-4 py-3 rounded-2xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D]/40 text-[#F4F4F6] text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#C6FF3D]" />
              <span>Weekly Guide</span>
            </Link>

            <button
              type="button"
              onClick={handleStartTodayWorkout}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-[#C6FF3D]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <PlayCircle className="w-5 h-5 stroke-[2.5]" />
              <span>Start Workout</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= REQUIREMENT 6: TODAY'S PLANNED WORKOUT CARD ================= */}
      <section className="p-6 rounded-3xl bg-[#16161D] border border-[#24242E] shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#24242E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                Today's Workout Plan
              </h2>
              <p className="text-[11px] text-[#A1A1AA]">
                {WEEKDAY_FULL_NAMES[todayWeekday]} commitment based on your custom weekly guide.
              </p>
            </div>
          </div>

          <Link
            to="/schedule"
            className="text-xs font-mono text-[#C6FF3D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Customize Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayPlannedWorkout ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0B0B0F] border border-[#24242E]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl font-bold uppercase tracking-wide text-[#F4F4F6]">
                  {todayPlannedWorkout.routineName}
                </span>
                {todayPlannedWorkout.status === 'done' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/30 text-[10px] font-mono font-bold uppercase">
                    Planned
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A1A1AA]">
                Focus: <strong className="text-zinc-300">{todayPlannedWorkout.targetMuscle}</strong>
                {todayPlannedWorkout.time && ` · Planned for ${todayPlannedWorkout.time}`}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {todayPlannedWorkout.status === 'done' ? (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-4 py-2.5 rounded-xl border border-emerald-500/40">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Session Logged Today</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartTodayWorkout}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs transition-all shadow-md shadow-[#C6FF3D]/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Today's Workout</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="font-heading text-lg font-bold uppercase text-[#F4F4F6]">
                Rest & Recovery Day
              </h4>
              <p className="text-xs text-[#A1A1AA]">
                No intense workout scheduled for today. Focus on hydration, stretching, and mobility.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/recommender"
                className="px-4 py-2 rounded-xl bg-[#24242E] hover:bg-[#2E2E3C] text-xs font-semibold text-[#F4F4F6] transition-colors"
              >
                Pick a Routine
              </Link>
              <Link
                to="/schedule"
                className="px-4 py-2 rounded-xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] text-xs font-mono text-[#C6FF3D] transition-colors"
              >
                + Schedule Workout
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ================= 5 STAT CARDS (INCLUDING MOTIVATION STREAK) ================= */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4" aria-label="Key Athlete Statistics">
        {/* Card 1: Streak Counter (Requirement 2) */}
        <div className="p-5 rounded-3xl bg-[#16161D] border border-[#24242E] hover:border-[#C6FF3D]/40 flex flex-col justify-between transition-all group">
          <div className="flex items-center justify-between text-[#A1A1AA] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Streak</span>
            <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D] group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4 fill-[#C6FF3D]" />
            </div>
          </div>
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#C6FF3D] flex items-center gap-1">
              <span>{currentStreak}</span>
              <span className="text-sm font-bold text-[#F4F4F6]">{currentStreak === 1 ? 'Day' : 'Days'}</span>
            </div>
            <div className="text-[11px] text-[#A1A1AA] mt-1 font-mono">
              Best: <strong className="text-white">{bestStreak}d</strong> · 1-day grace
            </div>
          </div>
        </div>

        {/* Card 2: Current Weight */}
        <div className="p-5 rounded-3xl bg-[#16161D] border border-[#24242E] flex flex-col justify-between hover:border-[#C6FF3D]/30 transition-colors">
          <div className="flex items-center justify-between text-[#A1A1AA] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Current Weight</span>
            <button
              type="button"
              onClick={() => setIsLogWeightModalOpen(true)}
              className="w-8 h-8 rounded-xl bg-[#24242E] hover:bg-[#2e2e3a] flex items-center justify-center text-[#C6FF3D] transition-colors cursor-pointer"
              title="Log new weight"
            >
              <Scale className="w-4 h-4" />
            </button>
          </div>
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#F4F4F6]">
              {formatWeight(weightKg, userPreferences.units)}
            </div>
            <div className="text-[11px] text-[#A1A1AA] mt-1 flex items-center justify-between">
              <span className="text-emerald-400 font-mono text-[10px]">Active Profile</span>
              <button
                type="button"
                onClick={() => setIsLogWeightModalOpen(true)}
                className="text-[10px] font-mono text-[#C6FF3D] hover:underline cursor-pointer"
              >
                + Log Weight
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: BMI Score */}
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

        {/* Card 4: Total Workouts & Walks */}
        <div className="p-5 rounded-3xl bg-[#16161D] border border-[#24242E] flex flex-col justify-between hover:border-[#C6FF3D]/30 transition-colors">
          <div className="flex items-center justify-between text-[#A1A1AA] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Sessions</span>
            <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#F4F4F6]">
              {totalWorkouts}
            </div>
            <div className="text-[11px] text-[#A1A1AA] mt-1 font-mono">
              {totalWorkouts === 1 ? '1 session logged' : `${totalWorkouts} sessions logged`}
            </div>
          </div>
        </div>

        {/* Card 5: Total Calories Burned */}
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
              kcal energy output
            </div>
          </div>
        </div>
      </section>

      {/* ================= CHARTS & GAUGES SECTION ================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Semicircle BMI Gauge Card */}
        <BmiGauge bmi={bmiScore} category={bmiCategory} />

        {/* Requirement 1: Weekly Goal Progress Ring Card (1 to 7 target from Settings, Monday to Sunday) */}
        <WeeklyGoalRing
          completedThisWeek={workoutsThisWeek}
          weeklyGoal={currentProfile?.weeklyGoal || 3}
        />

        {/* 7-Day Calories Bar Chart Card */}
        <div className="md:col-span-2 lg:col-span-1">
          <CalorieBarChart records={userRecords} />
        </div>
      </section>

      {/* ================= BODY WEIGHT TRAJECTORY CHART (Requirement 3) ================= */}
      <section aria-label="Body Weight Trajectory and Progression">
        <BodyWeightChart
          userId={userId}
          currentWeightKg={weightKg}
          onOpenLogModal={() => setIsLogWeightModalOpen(true)}
          onWeightChanged={(newW) => {
            updateProfile({ weightKg: newW });
            setRefreshKey((k) => k + 1);
          }}
          refreshKey={refreshKey}
        />
      </section>

      {/* ================= REQUIREMENT 3: BADGES SECTION ================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#24242E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-[#F4F4F6]">
                  Discipline Badges
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/30 font-bold">
                  {badges.filter((b) => b.isUnlocked).length} / {badges.length} Unlocked
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA]">
                Permanent milestone achievements tracked automatically across your training history.
              </p>
            </div>
          </div>

          <Link
            to="/summary"
            className="text-xs font-mono text-[#C6FF3D] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View Full Summary</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {badges.map((badge) => {
            const isUnlocked = badge.isUnlocked;

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-3 group ${
                  isUnlocked
                    ? 'bg-[#16161D] border-[#C6FF3D]/50 shadow-md shadow-[#C6FF3D]/10 hover:border-[#C6FF3D]'
                    : 'bg-[#121217]/60 border-[#24242E]/70 opacity-45 hover:opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isUnlocked
                        ? 'bg-[#C6FF3D]/15 text-[#C6FF3D] border border-[#C6FF3D]/30 shadow-sm'
                        : 'bg-[#1C1C24] text-[#71717A] border border-[#2A2A36]'
                    }`}
                  >
                    {renderBadgeIcon(badge.iconName)}
                  </div>

                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#71717A] bg-[#16161D] px-2 py-0.5 rounded-full border border-[#24242E]">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3
                    className={`font-heading text-sm font-bold uppercase tracking-wide transition-colors ${
                      isUnlocked ? 'text-[#F4F4F6] group-hover:text-[#C6FF3D]' : 'text-[#71717A]'
                    }`}
                  >
                    {badge.title}
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA] line-clamp-2 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#24242E]/60 text-[10px] font-mono">
                  {isUnlocked && badge.unlockedAt ? (
                    <span className="text-[#C6FF3D] font-medium">
                      Unlocked {new Date(badge.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-[#71717A]">{badge.requirement}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= WORKOUT HISTORY OR EMPTY STATE ================= */}
      {hasNoWorkouts ? (
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

      {/* ================= QUICK LOG WALK MODAL ================= */}
      {isLogWalkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#16161D] border border-[#24242E] rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#24242E]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D]">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold uppercase text-[#F4F4F6]">
                    Log a Walk Session
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Active recovery walks count toward streaks and weekly targets!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogWalkModalOpen(false)}
                className="p-1.5 rounded-xl border border-[#24242E] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWalk} className="space-y-4">
              <div>
                <label htmlFor="walk-duration" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                  Walk Duration (Minutes)
                </label>
                <input
                  id="walk-duration"
                  type="number"
                  min="5"
                  max="300"
                  required
                  value={walkDuration}
                  onChange={(e) => setWalkDuration(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] focus:border-[#C6FF3D] text-sm text-[#F4F4F6] font-mono outline-none"
                />
                <span className="text-[11px] text-[#A1A1AA] mt-1 block">
                  Estimated burn: ~{Math.max(1, Math.round(3.8 * (currentProfile?.weightKg || 70) * (walkDuration / 60)))} kcal
                </span>
              </div>

              <div>
                <label htmlFor="walk-notes" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                  Activity Notes (Optional)
                </label>
                <input
                  id="walk-notes"
                  type="text"
                  value={walkNotes}
                  onChange={(e) => setWalkNotes(e.target.value)}
                  placeholder="e.g. Brisk outdoor park stroll"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] focus:border-[#C6FF3D] text-sm text-[#F4F4F6] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#24242E] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLogWalkModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#24242E] hover:bg-[#24242E] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs transition-all shadow-md shadow-[#C6FF3D]/20 cursor-pointer"
                >
                  <Footprints className="w-4 h-4" />
                  <span>Save Walk Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BODY WEIGHT LOGGING MODAL (Requirement 3) ================= */}
      <BodyWeightModal
        isOpen={isLogWeightModalOpen}
        onClose={() => setIsLogWeightModalOpen(false)}
        userId={userId}
        currentWeightKg={weightKg}
        heightCm={heightCm}
        onWeightLogged={(newW) => {
          updateProfile({ weightKg: newW });
          setRefreshKey((k) => k + 1);
          showToastSuccess(`Weight logged: ${newW} kg. Profile and BMI updated!`);
        }}
      />
    </div>
  );
}
