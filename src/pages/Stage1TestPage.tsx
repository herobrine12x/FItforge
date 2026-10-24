import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  Dumbbell,
  FileSpreadsheet,
  Flame,
  Layers,
  Lock,
  LogOut,
  Plus,
  Printer,
  RefreshCw,
  Scale,
  Shuffle,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-react';
import { AuthManager, DEMO_PASSWORD, DEMO_USERNAME, simpleHash } from '../models/AuthManager';
import { BMICalculator } from '../models/BMICalculator';
import { MemberProfile } from '../models/MemberProfile';
import { RecordManager } from '../models/RecordManager';
import { ReportGenerator } from '../models/ReportGenerator';
import { StorageLayer, STORAGE_KEYS } from '../models/storage';
import { ExperienceLevel, IWorkoutRecordData } from '../models/types';
import { User } from '../models/User';
import { WorkoutPlanFactory } from '../models/WorkoutPlanFactory';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function Stage1TestPage() {
  // OOP Manager Singletons
  const authManager = useMemo(() => new AuthManager(), []);
  const recordManager = useMemo(() => new RecordManager(), []);
  const reportGenerator = useMemo(() => new ReportGenerator(recordManager), [recordManager]);

  // App Navigation & Session State
  const [activeTab, setActiveTab] = useState<'all' | 'auth' | 'profile' | 'bmi' | 'splits' | 'records' | 'reports' | 'db'>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(() => authManager.getCurrentUser());
  const [currentProfile, setCurrentProfile] = useState<MemberProfile | null>(() => authManager.getCurrentProfile());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setCurrentUser(authManager.getCurrentUser());
    setCurrentProfile(authManager.getCurrentProfile());
    setRefreshKey((k) => k + 1);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // --- Auth Section State ---
  const [loginUsername, setLoginUsername] = useState('demo');
  const [loginPassword, setLoginPassword] = useState('demo123');
  const [loginError, setLoginError] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regError, setRegError] = useState('');

  // --- Profile Section State ---
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState<string>('');
  const [editGender, setEditGender] = useState('Male');
  const [editHeight, setEditHeight] = useState<string>('');
  const [editWeight, setEditWeight] = useState<string>('');
  const [editLevel, setEditLevel] = useState<ExperienceLevel>('Intermediate');
  const [editGoal, setEditGoal] = useState<string>('4');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentProfile) {
      setEditName(currentProfile.name);
      setEditAge(String(currentProfile.age));
      setEditGender(currentProfile.gender);
      setEditHeight(String(currentProfile.heightCm));
      setEditWeight(String(currentProfile.weightKg));
      setEditLevel(currentProfile.experienceLevel);
      setEditGoal(String(currentProfile.weeklyGoal));
    }
  }, [currentProfile]);

  // --- BMI Calculator Section State ---
  const [bmiHeight, setBmiHeight] = useState<number>(175);
  const [bmiWeight, setBmiWeight] = useState<number>(72);
  const [bmiError, setBmiError] = useState('');

  // --- Workout Plan Section State ---
  type SplitChoice = 'Push' | 'Pull' | 'Legs & Core' | 'Full Body' | 'Upper Body' | 'Home Bodyweight' | 'Cardio HIIT';
  const [selectedSplitName, setSelectedSplitName] = useState<SplitChoice>('Push');
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>('Intermediate');
  const [calDuration, setCalDuration] = useState<number>(45);
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);

  // --- Record Manager CRUD State ---
  const [newSplitName, setNewSplitName] = useState<'Push' | 'Pull' | 'Legs & Core' | 'Full Body'>('Push');
  const [newDuration, setNewDuration] = useState<number>(45);
  const [newCalories, setNewCalories] = useState<number>(380);
  const [newNotes, setNewNotes] = useState('Focused on progressive overload and solid tempo.');
  const [recordFormError, setRecordFormError] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editRecordNotes, setEditRecordNotes] = useState('');

  // Load active user's records
  const userRecords = useMemo(() => {
    if (!currentUser) return [];
    return recordManager.readAll(currentUser.id);
  }, [currentUser, recordManager, toasts]);

  // Calculate summary metrics
  const reportSummary = useMemo(() => {
    if (!currentUser) return null;
    return reportGenerator.summary(currentUser.id);
  }, [currentUser, reportGenerator, userRecords]);

  // Handlers
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    const res = authManager.login(loginUsername, loginPassword);
    if (res.success && res.user) {
      triggerRefresh();
      showToast(res.message, 'success');
    } else {
      setLoginError(res.message);
      showToast(res.message, 'error');
    }
  };

  const handleQuickDemoLogin = () => {
    setLoginUsername(DEMO_USERNAME);
    setLoginPassword(DEMO_PASSWORD);
    const res = authManager.login(DEMO_USERNAME, DEMO_PASSWORD);
    if (res.success) {
      triggerRefresh();
      showToast('Logged in as demo user (Kent Malo)', 'success');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    const res = authManager.register(regUsername, regPassword, regName);
    if (res.success && res.user) {
      triggerRefresh();
      setRegUsername('');
      setRegPassword('');
      setRegName('');
      showToast(res.message, 'success');
    } else {
      setRegError(res.message);
      showToast(res.message, 'error');
    }
  };

  const handleLogout = () => {
    authManager.logout();
    triggerRefresh();
    showToast('Logged out of session', 'info');
  };

  const handleResetSeedData = () => {
    StorageLayer.clearAll();
    authManager.ensureSeedData(true);
    triggerRefresh();
    showToast('Demo data re-seeded to initial specifications', 'success');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    const errors: Record<string, string> = {};

    // Validate fields using MemberProfile validation rules
    if (!editName.trim()) {
      errors.name = 'Name cannot be empty.';
    }

    const numAge = Number(editAge);
    if (isNaN(numAge) || numAge <= 0) {
      errors.age = 'Age must be a positive number.';
    } else if (numAge < 10 || numAge > 100) {
      errors.age = 'Age must be between 10 and 100 years.';
    }

    const numHeight = Number(editHeight);
    if (isNaN(numHeight) || numHeight <= 0) {
      errors.height = 'Height must be a positive number.';
    } else if (numHeight < 50 || numHeight > 250) {
      errors.height = 'Height must be between 50 and 250 cm.';
    }

    const numWeight = Number(editWeight);
    if (isNaN(numWeight) || numWeight <= 0) {
      errors.weight = 'Weight must be a positive number.';
    } else if (numWeight < 20 || numWeight > 300) {
      errors.weight = 'Weight must be between 20 and 300 kg.';
    }

    const numGoal = Number(editGoal);
    if (isNaN(numGoal) || numGoal <= 0 || numGoal > 14) {
      errors.goal = 'Weekly goal must be between 1 and 14 sessions.';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      showToast('Validation failed. Please correct highlighted fields.', 'error');
      return;
    }

    try {
      authManager.updateCurrentProfile({
        name: editName.trim(),
        age: numAge,
        gender: editGender,
        heightCm: numHeight,
        weightKg: numWeight,
        experienceLevel: editLevel,
        weeklyGoal: numGoal,
      });
      triggerRefresh();
      showToast('Member profile updated successfully!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      showToast(msg, 'error');
    }
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setRecordFormError('');

    if (!currentUser) {
      setRecordFormError('Please log in first.');
      showToast('You must be logged in to create a workout record.', 'error');
      return;
    }

    if (newDuration <= 0) {
      setRecordFormError('Duration must be greater than 0 minutes.');
      return;
    }

    if (newCalories < 0) {
      setRecordFormError('Calories cannot be negative.');
      return;
    }

    try {
      recordManager.create({
        userId: currentUser.id,
        splitName: newSplitName,
        date: new Date().toISOString(),
        durationMinutes: newDuration,
        caloriesBurned: newCalories,
        exercisesCompleted: 5,
        totalExercises: 5,
        notes: newNotes.trim(),
      });
      triggerRefresh();
      showToast(`Logged new ${newSplitName} workout (${newDuration} mins)!`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create record.';
      setRecordFormError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDeleteRecord = (id: string) => {
    const success = recordManager.delete(id);
    if (success) {
      triggerRefresh();
      showToast('Workout record deleted.', 'info');
    } else {
      showToast('Failed to delete record.', 'error');
    }
  };

  const handleUpdateRecordNotes = (id: string) => {
    try {
      recordManager.update(id, { notes: editRecordNotes });
      setEditingRecordId(null);
      triggerRefresh();
      showToast('Record notes updated.', 'success');
    } catch (err) {
      showToast('Error updating record', 'error');
    }
  };

  // BMI calculations
  let calculatedBMI = 0;
  let bmiCategory: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' = 'Normal';
  try {
    calculatedBMI = BMICalculator.calculate(bmiWeight, bmiHeight);
    bmiCategory = BMICalculator.classify(calculatedBMI);
  } catch (err) {
    // handled gracefully
  }

  // Active Split calculation
  const activeWorkoutPlan = useMemo(() => {
    const plan = WorkoutPlanFactory.create(selectedSplitName);
    if (shuffleSeed !== 0) {
      plan.shuffle(shuffleSeed);
    }
    return plan;
  }, [selectedSplitName, shuffleSeed]);

  const activePool = useMemo(() => {
    return activeWorkoutPlan.getPool();
  }, [activeWorkoutPlan]);

  const activeExercises = useMemo(() => {
    return activeWorkoutPlan.getExercises(selectedLevel);
  }, [activeWorkoutPlan, selectedLevel, shuffleSeed]);

  const calculatedCaloriesForSplit = useMemo(() => {
    const userWeight = currentProfile ? currentProfile.weightKg : 72;
    return activeWorkoutPlan.calculateCalories(userWeight, calDuration);
  }, [activeWorkoutPlan, currentProfile, calDuration]);

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F4F4F6] flex flex-col font-sans selection:bg-[#C6FF3D] selection:text-[#0B0B0F]">
      {/* Toast Overlay */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border text-sm flex items-center gap-3 backdrop-blur-md transition-all ${
              t.type === 'success'
                ? 'bg-[#16161D]/95 border-[#C6FF3D]/40 text-[#C6FF3D]'
                : t.type === 'error'
                ? 'bg-[#16161D]/95 border-rose-500/50 text-rose-400'
                : 'bg-[#16161D]/95 border-[#24242E] text-[#F4F4F6]'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C6FF3D]" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <Activity className="w-4 h-4 shrink-0 text-sky-400" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar on Desktop */}
        <aside className="hidden md:flex flex-col w-64 border-r border-[#24242E] bg-[#0B0B0F] p-6 shrink-0 justify-between">
          <div>
            {/* Brand Logo */}
            <div className="mb-8">
              <img
                src="/assets/aistudio/fitforge-logo_28ede239.svg"
                alt="FitForge"
                className="h-10 w-auto object-contain object-left mb-2"
              />
              <p className="text-xs uppercase tracking-widest text-[#A1A1AA] font-mono">
                Workout Recommender and Progress Tracker
              </p>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1.5" aria-label="Sidebar Navigation">
              {[
                { id: 'all', label: 'Complete Test Suite', icon: Layers },
                { id: 'auth', label: 'Auth & Storage', icon: Users },
                { id: 'profile', label: 'Member Profile', icon: UserCheck },
                { id: 'bmi', label: 'BMI Calculator', icon: Scale },
                { id: 'splits', label: 'Workout Splits', icon: Dumbbell },
                { id: 'records', label: 'Record Manager', icon: TrendingUp },
                { id: 'reports', label: 'Report Generator', icon: Award },
                { id: 'db', label: 'Storage Tables', icon: Database },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#16161D] text-[#C6FF3D] border border-[#24242E] shadow-sm'
                        : 'text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#16161D]/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#C6FF3D]' : 'text-[#A1A1AA]'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Session status at bottom */}
          <div className="pt-6 border-t border-[#24242E] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A1A1AA]">Session:</span>
              <span className="font-mono text-[#C6FF3D]">
                {currentUser ? currentUser.username : 'Signed Out'}
              </span>
            </div>
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-3 rounded-xl bg-[#16161D] hover:bg-[#24242E] border border-[#24242E] text-xs font-semibold text-[#A1A1AA] hover:text-[#F4F4F6] flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            ) : (
              <button
                onClick={handleQuickDemoLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-[#C6FF3D] hover:bg-[#b8f52e] text-[#0B0B0F] text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <span>Quick Login Demo</span>
              </button>
            )}
            <button
              onClick={handleResetSeedData}
              className="w-full py-2 px-3 rounded-xl text-xs text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#16161D] flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Seed Tables</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full pb-24 md:pb-12">
          {/* Header Banner */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#24242E] pb-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#A1A1AA]">
                OOP Verification & Test Harness
              </p>
              <h2 className="text-4xl sm:text-5xl font-black uppercase text-[#F4F4F6] font-heading tracking-tight mt-1">
                {currentUser ? `WELCOME BACK, ${currentProfile ? currentProfile.name.split(' ')[0] : currentUser.username}` : 'FITFORGE ENGINE'}
              </h2>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {!currentUser && (
                <button
                  onClick={handleQuickDemoLogin}
                  className="px-5 py-2.5 rounded-xl bg-[#C6FF3D] text-[#0B0B0F] font-bold text-sm hover:bg-[#b5f32b] transition shadow-lg shadow-[#C6FF3D]/10"
                >
                  Sign in as Demo
                </button>
              )}
              {currentUser && (
                <div className="bg-[#16161D] border border-[#24242E] px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C6FF3D] animate-pulse"></span>
                  <span className="text-[#A1A1AA]">User:</span>
                  <span className="font-mono text-[#F4F4F6] font-bold">{currentUser.username}</span>
                </div>
              )}
            </div>
          </header>

          <div className="space-y-8">
            {/* 1. AUTH & STORAGE SECTION */}
            {(activeTab === 'all' || activeTab === 'auth') && (
              <section className="bg-[#16161D] border border-[#24242E] rounded-2xl p-6 sm:p-8 relative">
                <div className="flex items-center justify-between mb-6 border-b border-[#24242E] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 flex items-center justify-center text-[#C6FF3D]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold uppercase font-heading text-[#F4F4F6]">
                        1. AuthManager & User Models
                      </h3>
                      <p className="text-xs text-[#A1A1AA]">
                        OOP Principle: Encapsulation & Separation of Concerns · Hashed passwords, duplicate rejection, session storage
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 bg-[#0B0B0F] border border-[#24242E] rounded-lg text-[#C6FF3D]">
                    TABLES: users, settings
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Login Form Card */}
                  <div className="bg-[#0B0B0F] border border-[#24242E] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold uppercase font-heading text-[#F4F4F6]">
                        Sign In Existing User
                      </h4>
                      <button
                        onClick={handleQuickDemoLogin}
                        className="text-xs text-[#C6FF3D] hover:underline font-mono"
                      >
                        Auto-fill demo
                      </button>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                          Username
                        </label>
                        <input
                          type="text"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          placeholder="e.g. demo"
                          className="w-full bg-[#16161D] border border-[#24242E] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                          Password
                        </label>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="e.g. demo123"
                          className="w-full bg-[#16161D] border border-[#24242E] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                        />
                      </div>
                      {loginError && (
                        <p className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{loginError}</span>
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-3 rounded-xl bg-[#C6FF3D] hover:bg-[#bbf52f] text-[#0B0B0F] font-bold text-sm transition"
                        >
                          Log In
                        </button>
                        {currentUser && (
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="px-4 py-3 rounded-xl bg-[#16161D] border border-[#24242E] text-[#A1A1AA] hover:text-[#F4F4F6] text-sm font-semibold transition"
                          >
                            Sign Out
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Register Form Card */}
                  <div className="bg-[#0B0B0F] border border-[#24242E] rounded-2xl p-5">
                    <h4 className="text-lg font-bold uppercase font-heading text-[#F4F4F6] mb-4 flex items-center justify-between">
                      <span>Register New User</span>
                      <span className="text-xs font-mono text-[#A1A1AA] font-normal lowercase">rejects empty / duplicates</span>
                    </h4>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                          Username (Unique)
                        </label>
                        <input
                          type="text"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="e.g. athlete_john"
                          className="w-full bg-[#16161D] border border-[#24242E] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-[#16161D] border border-[#24242E] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                            Password
                          </label>
                          <input
                            type="password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Min 4 chars"
                            className="w-full bg-[#16161D] border border-[#24242E] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                          />
                        </div>
                      </div>
                      {regError && (
                        <p className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{regError}</span>
                        </p>
                      )}
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-[#16161D] hover:bg-[#24242E] border border-[#24242E] text-[#C6FF3D] font-bold text-sm flex items-center justify-center gap-2 transition"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Active Session Inspector */}
                <div className="mt-6 p-4 rounded-xl bg-[#0B0B0F]/80 border border-[#24242E] text-xs font-mono flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[#A1A1AA]">Current User:</span>
                    <span className="text-[#C6FF3D] font-bold">
                      {currentUser ? `${currentUser.username} (ID: ${currentUser.id})` : 'None (Logged Out)'}
                    </span>
                  </div>
                  {currentUser && (
                    <div className="text-[#A1A1AA] truncate max-w-md">
                      Hash: <span className="text-[#F4F4F6]">{currentUser.passwordHash}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 2. MEMBER PROFILE SECTION */}
            {(activeTab === 'all' || activeTab === 'profile') && (
              <section className="bg-[#16161D] border border-[#24242E] rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-[#24242E] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 flex items-center justify-center text-[#C6FF3D]">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold uppercase font-heading text-[#F4F4F6]">
                        2. MemberProfile (Encapsulation)
                      </h3>
                      <p className="text-xs text-[#A1A1AA]">
                        OOP Principle: Encapsulation · Private fields with strict setters rejecting non-positive and out-of-range inputs
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 bg-[#0B0B0F] border border-[#24242E] rounded-lg text-[#C6FF3D]">
                    TABLE: profiles
                  </span>
                </div>

                {currentProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {/* Name */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                          Member Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-[#0B0B0F] border border-[#24242E] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                        />
                        {profileErrors.name && (
                          <p className="text-xs text-rose-400 mt-1">{profileErrors.name}</p>
                        )}
                      </div>

                      {/* Age (10-100) */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">
                            Age (10 - 100)
                          </label>
                        </div>
                        <input
                          type="number"
                          value={editAge}
                          onChange={(e) => setEditAge(e.target.value)}
                          className={`w-full bg-[#0B0B0F] border ${
                            profileErrors.age ? 'border-rose-500' : 'border-[#24242E]'
                          } rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]`}
                        />
                        {profileErrors.age && (
                          <p className="text-xs text-rose-400 mt-1">{profileErrors.age}</p>
                        )}
                      </div>

                      {/* Height (50-250) */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                          Height (50 - 250 cm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editHeight}
                          onChange={(e) => setEditHeight(e.target.value)}
                          className={`w-full bg-[#0B0B0F] border ${
                            profileErrors.height ? 'border-rose-500' : 'border-[#24242E]'
                          } rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]`}
                        />
                        {profileErrors.height && (
                          <p className="text-xs text-rose-400 mt-1">{profileErrors.height}</p>
                        )}
                      </div>

                      {/* Weight (20-300) */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                          Weight (20 - 300 kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className={`w-full bg-[#0B0B0F] border ${
                            profileErrors.weight ? 'border-rose-500' : 'border-[#24242E]'
                          } rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]`}
                        />
                        {profileErrors.weight && (
                          <p className="text-xs text-rose-400 mt-1">{profileErrors.weight}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {/* Gender */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                          Gender
                        </label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                          className="w-full bg-[#0B0B0F] border border-[#24242E] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Experience Level */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                          Experience Level
                        </label>
                        <select
                          value={editLevel}
                          onChange={(e) => setEditLevel(e.target.value as ExperienceLevel)}
                          className="w-full bg-[#0B0B0F] border border-[#24242E] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>

                      {/* Weekly Goal */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                          Weekly Goal (Sessions)
                        </label>
                        <input
                          type="number"
                          value={editGoal}
                          onChange={(e) => setEditGoal(e.target.value)}
                          className="w-full bg-[#0B0B0F] border border-[#24242E] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                        />
                        {profileErrors.goal && (
                          <p className="text-xs text-rose-400 mt-1">{profileErrors.goal}</p>
                        )}
                      </div>
                    </div>

                    {/* Test Out-of-Range Rejection buttons */}
                    <div className="bg-[#0B0B0F] p-4 rounded-xl border border-[#24242E] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <span>Try Out-Of-Range Injections:</span>
                        <button
                          type="button"
                          onClick={() => setEditHeight('350')}
                          className="px-2 py-1 bg-[#16161D] rounded border border-[#24242E] hover:border-rose-500 text-rose-300"
                        >
                          Height: 350cm
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditWeight('-10')}
                          className="px-2 py-1 bg-[#16161D] rounded border border-[#24242E] hover:border-rose-500 text-rose-300"
                        >
                          Weight: -10kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditAge('140')}
                          className="px-2 py-1 bg-[#16161D] rounded border border-[#24242E] hover:border-rose-500 text-rose-300"
                        >
                          Age: 140yr
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-[#C6FF3D] hover:bg-[#b8f52e] text-[#0B0B0F] font-bold text-sm transition"
                      >
                        Save & Test Encapsulation
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8 text-[#A1A1AA]">
                    <p>No active profile loaded. Please sign in or use the demo login above.</p>
                  </div>
                )}
              </section>
            )}

            {/* 3. BMI CALCULATOR SECTION */}
            {(activeTab === 'all' || activeTab === 'bmi') && (
              <section className="bg-[#16161D] border border-[#24242E] rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-[#24242E] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 flex items-center justify-center text-[#C6FF3D]">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold uppercase font-heading text-[#F4F4F6]">
                        3. BMICalculator (Single Responsibility & Math)
                      </h3>
                      <p className="text-xs text-[#A1A1AA]">
                        calculate(weightKg, heightCm) & classify(bmi): Underweight &lt;18.5 · Normal 18.5-24.9 · Overweight 25-29.9 · Obese 30+
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  {/* Controls */}
                  <div className="lg:col-span-2 space-y-5 bg-[#0B0B0F] p-5 rounded-2xl border border-[#24242E]">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                        <span className="text-[#A1A1AA]">Height (cm)</span>
                        <span className="text-[#C6FF3D] font-bold">{bmiHeight} cm</span>
                      </div>
                      <input
                        type="range"
                        min="120"
                        max="220"
                        value={bmiHeight}
                        onChange={(e) => setBmiHeight(Number(e.target.value))}
                        className="w-full accent-[#C6FF3D] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                        <span className="text-[#A1A1AA]">Weight (kg)</span>
                        <span className="text-[#C6FF3D] font-bold">{bmiWeight} kg</span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="160"
                        value={bmiWeight}
                        onChange={(e) => setBmiWeight(Number(e.target.value))}
                        className="w-full accent-[#C6FF3D] cursor-pointer"
                      />
                    </div>

                    {/* Quick test buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#24242E] text-xs">
                      <span className="text-[#A1A1AA] self-center">Test classifications:</span>
                      <button
                        onClick={() => { setBmiHeight(175); setBmiWeight(50); }}
                        className="px-2.5 py-1 bg-[#16161D] rounded-lg border border-[#24242E] hover:border-[#C6FF3D] text-[#A1A1AA] hover:text-[#F4F4F6]"
                      >
                        Underweight (50kg)
                      </button>
                      <button
                        onClick={() => { setBmiHeight(175); setBmiWeight(72); }}
                        className="px-2.5 py-1 bg-[#16161D] rounded-lg border border-[#24242E] hover:border-[#C6FF3D] text-[#A1A1AA] hover:text-[#F4F4F6]"
                      >
                        Normal (72kg)
                      </button>
                      <button
                        onClick={() => { setBmiHeight(175); setBmiWeight(82); }}
                        className="px-2.5 py-1 bg-[#16161D] rounded-lg border border-[#24242E] hover:border-[#C6FF3D] text-[#A1A1AA] hover:text-[#F4F4F6]"
                      >
                        Overweight (82kg)
                      </button>
                      <button
                        onClick={() => { setBmiHeight(175); setBmiWeight(105); }}
                        className="px-2.5 py-1 bg-[#16161D] rounded-lg border border-[#24242E] hover:border-[#C6FF3D] text-[#A1A1AA] hover:text-[#F4F4F6]"
                      >
                        Obese (105kg)
                      </button>
                    </div>
                  </div>

                  {/* Visual Output Card */}
                  <div className="bg-[#0B0B0F] border border-[#24242E] rounded-2xl p-6 text-center flex flex-col justify-center items-center">
                    <p className="text-xs uppercase tracking-widest text-[#A1A1AA] font-mono mb-1">
                      Computed Score
                    </p>
                    <div className="text-6xl font-black font-heading text-[#F4F4F6] tracking-tight">
                      {calculatedBMI}
                    </div>

                    <div className="mt-3">
                      <span
                        className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          bmiCategory === 'Normal'
                            ? 'bg-[#C6FF3D] text-[#0B0B0F]'
                            : bmiCategory === 'Underweight'
                            ? 'bg-sky-400 text-[#0B0B0F]'
                            : bmiCategory === 'Overweight'
                            ? 'bg-amber-400 text-[#0B0B0F]'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {bmiCategory}
                      </span>
                    </div>

                    <p className="text-xs text-[#A1A1AA] mt-3">
                      Healthy range: 18.5 – 24.9
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 4. WORKOUT PLANS & POLYMORPHISM SECTION */}
            {(activeTab === 'all' || activeTab === 'splits') && (
              <section className="bg-[#16161D] border border-[#24242E] rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-[#24242E] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 flex items-center justify-center text-[#C6FF3D]">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold uppercase font-heading text-[#F4F4F6]">
                        4. WorkoutPlan Hierarchy (All 7 Splits & Exercise Library)
                      </h3>
                      <p className="text-xs text-[#A1A1AA]">
                        Push, Pull, Legs &amp; Core, Full Body, Upper Body, Home Bodyweight, Cardio HIIT · Polymorphic METs &amp; 5-exercise pick
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-3 py-1.5 bg-[#0B0B0F] border border-[#24242E] rounded-xl text-[#C6FF3D] font-bold">
                      Pool: {activePool.length} exercises
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextSeed = shuffleSeed + 1;
                        setShuffleSeed(nextSeed);
                        showToast(`Shuffled ${selectedSplitName} selection (Seed #${nextSeed})`, 'info');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0B0B0F] hover:bg-[#24242E] border border-[#24242E] hover:border-[#C6FF3D] text-[#C6FF3D] text-xs font-bold flex items-center gap-1.5 transition"
                      title="Shuffle pool for a different valid 5-exercise selection"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Shuffle {shuffleSeed > 0 ? `(#${shuffleSeed})` : ''}</span>
                    </button>
                  </div>
                </div>

                {/* Select All 7 Splits & Experience Level */}
                <div className="space-y-4 mb-6">
                  {/* All 7 Split Tabs */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-2">
                      Select Training Split (7 Available)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        'Push',
                        'Pull',
                        'Legs & Core',
                        'Full Body',
                        'Upper Body',
                        'Home Bodyweight',
                        'Cardio HIIT',
                      ] as const).map((split) => {
                        const isSelected = selectedSplitName === split;
                        return (
                          <button
                            key={split}
                            type="button"
                            onClick={() => {
                              setSelectedSplitName(split);
                              setShuffleSeed(0);
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                              isSelected
                                ? 'bg-[#C6FF3D] text-[#0B0B0F] shadow-md shadow-[#C6FF3D]/10'
                                : 'bg-[#0B0B0F] border border-[#24242E] text-[#A1A1AA] hover:text-[#F4F4F6] hover:border-[#C6FF3D]/40'
                            }`}
                          >
                            {split}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Level Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Tier:</span>
                      <div className="bg-[#0B0B0F] p-1 rounded-xl border border-[#24242E] flex">
                        {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => {
                          const isSelected = selectedLevel === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setSelectedLevel(lvl)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                isSelected
                                  ? 'bg-[#16161D] text-[#C6FF3D] font-bold shadow-sm'
                                  : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                              }`}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <span className="text-xs text-[#A1A1AA] font-mono">
                      Rules: 5 unique exercises · &ge;2 target muscles · level-specific sets &amp; rest
                    </span>
                  </div>
                </div>

                {/* Split Metrics Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#0B0B0F] p-4 rounded-xl border border-[#24242E]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Polymorphic MET</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        activeWorkoutPlan.getMETValue() >= 8.0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : activeWorkoutPlan.getMETValue() <= 5.5
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20'
                      }`}>
                        {activeWorkoutPlan.getMETValue() >= 8.0 ? 'Highest MET' : activeWorkoutPlan.getMETValue() <= 5.5 ? 'Lowest MET' : 'Standard'}
                      </span>
                    </div>
                    <div className="text-2xl font-black font-heading text-[#C6FF3D] mt-1">
                      {activeWorkoutPlan.getMETValue().toFixed(1)} METs
                    </div>
                  </div>

                  <div className="bg-[#0B0B0F] p-4 rounded-xl border border-[#24242E]">
                    <div className="flex justify-between items-center text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">
                      <span>Duration</span>
                      <span className="text-[#C6FF3D]">{calDuration} mins</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="5"
                      value={calDuration}
                      onChange={(e) => setCalDuration(Number(e.target.value))}
                      className="w-full accent-[#C6FF3D] mt-2 cursor-pointer"
                    />
                  </div>

                  <div className="bg-[#0B0B0F] p-4 rounded-xl border border-[#24242E]">
                    <span className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">
                      Calculated Calories ({activeWorkoutPlan.getMETValue()} &times; {currentProfile?.weightKg || 72}kg &times; {calDuration}/60)
                    </span>
                    <div className="text-2xl font-black font-heading text-[#C6FF3D] mt-1 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span>{calculatedCaloriesForSplit} kcal</span>
                    </div>
                  </div>
                </div>

                {/* Exactly 5 Prescribed Exercises from Pool */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
                      Selected 5 Exercises for {selectedSplitName} ({selectedLevel})
                    </h4>
                    <span className="text-xs font-mono text-[#A1A1AA]">
                      {shuffleSeed > 0 ? `Seeded Permutation #${shuffleSeed}` : 'Default Deterministic'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeExercises.map((ex, idx) => (
                      <div
                        key={ex.id || idx}
                        className="bg-[#0B0B0F] border border-[#24242E] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#C6FF3D]/40 transition"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-8 h-8 rounded-lg bg-[#16161D] border border-[#24242E] flex items-center justify-center font-mono text-xs text-[#C6FF3D] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="font-bold text-sm text-[#F4F4F6]">{ex.name}</h5>

                              {/* Equipment Badge */}
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#16161D] border border-[#24242E] text-[#A1A1AA]">
                                {ex.equipment}
                              </span>

                              {/* Difficulty Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  ex.difficulty === 'Beginner'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : ex.difficulty === 'Intermediate'
                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                }`}
                              >
                                {ex.difficulty}
                              </span>
                            </div>

                            <p className="text-xs text-[#A1A1AA] mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-[#F4F4F6] font-medium">{ex.targetMuscle}</span>
                              <span>&middot;</span>
                              <span className="italic text-[#A1A1AA]/90">&ldquo;{ex.formTip || ex.tip}&rdquo;</span>
                            </p>

                            <p className="text-[10px] font-mono text-[#A1A1AA]/60 mt-1">
                              Asset: {ex.imageUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center self-end md:self-center gap-3 shrink-0">
                          {/* Labeled Rest Chip */}
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#16161D] border border-[#24242E] text-[#C6FF3D] font-semibold">
                            Rest {ex.restSeconds}s
                          </span>

                          {/* Sets & Reps */}
                          <div className="min-w-[65px] text-right">
                            <span className="font-mono text-base font-black text-[#C6FF3D]">
                              {ex.sets}&times;{ex.reps}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 5. RECORD MANAGER CRUD SECTION */}
            {(activeTab === 'all' || activeTab === 'records') && (
              <section className="bg-[#16161D] border border-[#24242E] rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-[#24242E] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 flex items-center justify-center text-[#C6FF3D]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold uppercase font-heading text-[#F4F4F6]">
                        5. RecordManager (CRUD Lifecycle)
                      </h3>
                      <p className="text-xs text-[#A1A1AA]">
                        create(), readAll(userId), update(), delete() on workout_records table
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 bg-[#0B0B0F] border border-[#24242E] rounded-lg text-[#C6FF3D]">
                    {userRecords.length} records found
                  </span>
                </div>

                {/* Create Workout Record Form */}
                <form onSubmit={handleCreateRecord} className="bg-[#0B0B0F] p-5 rounded-2xl border border-[#24242E] mb-6">
                  <h4 className="text-base font-bold uppercase font-heading text-[#F4F4F6] mb-4">
                    Create New Workout Record
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                        Split Name
                      </label>
                      <select
                        value={newSplitName}
                        onChange={(e) => setNewSplitName(e.target.value as any)}
                        className="w-full bg-[#16161D] border border-[#24242E] rounded-xl px-3.5 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                      >
                        <option value="Push">Push</option>
                        <option value="Pull">Pull</option>
                        <option value="Legs & Core">Legs & Core</option>
                        <option value="Full Body">Full Body</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                        Duration (Mins)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newDuration}
                        onChange={(e) => setNewDuration(Number(e.target.value))}
                        className="w-full bg-[#16161D] border border-[#24242E] rounded-xl px-3.5 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                        Calories Burned
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newCalories}
                        onChange={(e) => setNewCalories(Number(e.target.value))}
                        className="w-full bg-[#16161D] border border-[#24242E] rounded-xl px-3.5 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                        Action
                      </label>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#C6FF3D] hover:bg-[#b8f52e] text-[#0B0B0F] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Record</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A1A1AA] mb-1 font-mono">
                      Workout Notes
                    </label>
                    <input
                      type="text"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="e.g. Felt strong on bench press today"
                      className="w-full bg-[#16161D] border border-[#24242E] rounded-xl px-3.5 py-2 text-sm text-[#F4F4F6] focus:outline-none focus:border-[#C6FF3D]"
                    />
                  </div>
                  {recordFormError && (
                    <p className="text-xs text-rose-400 mt-2">{recordFormError}</p>
                  )}
                </form>

                {/* Table of User's Workout Records */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#24242E] text-[#A1A1AA] uppercase tracking-wider font-mono">
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Split</th>
                        <th className="py-3 px-3">Duration</th>
                        <th className="py-3 px-3">Calories</th>
                        <th className="py-3 px-3">Exercises</th>
                        <th className="py-3 px-3">Notes</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24242E]">
                      {userRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-[#0B0B0F]/50 transition">
                          <td className="py-3 px-3 font-mono text-[#A1A1AA]">
                            {new Date(r.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#F4F4F6]">{r.splitName}</td>
                          <td className="py-3 px-3 font-mono">{r.durationMinutes}m</td>
                          <td className="py-3 px-3 font-mono text-[#C6FF3D] font-bold">{r.caloriesBurned} kcal</td>
                          <td className="py-3 px-3 font-mono">{r.exercisesCompleted}/{r.totalExercises}</td>
                          <td className="py-3 px-3 text-[#A1A1AA] max-w-xs truncate">
                            {editingRecordId === r.id ? (
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={editRecordNotes}
                                  onChange={(e) => setEditRecordNotes(e.target.value)}
                                  className="bg-[#0B0B0F] border border-[#C6FF3D] rounded px-2 py-1 text-xs text-[#F4F4F6]"
                                />
                                <button
                                  onClick={() => handleUpdateRecordNotes(r.id)}
                                  className="px-2 py-1 bg-[#C6FF3D] text-[#0B0B0F] rounded font-bold text-xs"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <span>{r.notes || '—'}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingRecordId(r.id);
                                setEditRecordNotes(r.notes);
                              }}
                              className="text-xs text-[#A1A1AA] hover:text-[#C6FF3D] underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(r.id)}
                              className="text-xs text-rose-400 hover:text-rose-300 ml-2"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {userRecords.length === 0 && (
                    <div className="text-center py-8 text-[#A1A1AA]">
                      No workout records found for this user. Click &quot;Add Record&quot; above to create one.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 6. REPORT GENERATOR SECTION */}
            {(activeTab === 'all' || activeTab === 'reports') && (
              <section className="bg-[#16161D] border border-[#24242E] rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-[#24242E] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 flex items-center justify-center text-[#C6FF3D]">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold uppercase font-heading text-[#F4F4F6]">
                        6. ReportGenerator (Analytical Summaries & Export)
                      </h3>
                      <p className="text-xs text-[#A1A1AA]">
                        summary() · exportCSV() · exportPDF()
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (currentUser) {
                          reportGenerator.exportCSV(currentUser.id, `FitForge_${currentUser.username}`);
                          showToast('CSV export generated and downloaded!', 'success');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0B0B0F] border border-[#24242E] hover:border-[#C6FF3D] text-[#C6FF3D] text-xs font-bold flex items-center gap-2 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        if (currentUser) {
                          reportGenerator.exportPDF(currentUser.id);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0B0B0F] border border-[#24242E] hover:border-[#C6FF3D] text-[#F4F4F6] text-xs font-bold flex items-center gap-2 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Export PDF</span>
                    </button>
                  </div>
                </div>

                {reportSummary ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="bg-[#0B0B0F] p-4 rounded-xl border border-[#24242E]">
                      <span className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Total Workouts</span>
                      <div className="text-3xl font-black font-heading text-[#F4F4F6] mt-1">
                        {reportSummary.totalWorkouts}
                      </div>
                    </div>
                    <div className="bg-[#0B0B0F] p-4 rounded-xl border border-[#24242E]">
                      <span className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Total Minutes</span>
                      <div className="text-3xl font-black font-heading text-[#F4F4F6] mt-1">
                        {reportSummary.totalMinutes}m
                      </div>
                    </div>
                    <div className="bg-[#0B0B0F] p-4 rounded-xl border border-[#24242E]">
                      <span className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Calories Burned</span>
                      <div className="text-3xl font-black font-heading text-[#C6FF3D] mt-1">
                        {reportSummary.totalCalories}
                      </div>
                    </div>
                    <div className="bg-[#0B0B0F] p-4 rounded-xl border border-[#24242E]">
                      <span className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Average Duration</span>
                      <div className="text-3xl font-black font-heading text-[#F4F4F6] mt-1">
                        {reportSummary.averageDuration}m
                      </div>
                    </div>
                    <div className="bg-[#0B0B0F] p-4 rounded-xl border border-[#24242E] col-span-2 sm:col-span-1">
                      <span className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Most-Used Split</span>
                      <div className="text-2xl font-black font-heading text-[#C6FF3D] mt-1 truncate">
                        {reportSummary.mostUsedSplit}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#A1A1AA]">Sign in to generate analytical metrics.</p>
                )}
              </section>
            )}

            {/* 7. DATABASE TABLES INSPECTOR */}
            {(activeTab === 'all' || activeTab === 'db') && (
              <section className="bg-[#16161D] border border-[#24242E] rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-[#24242E] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 flex items-center justify-center text-[#C6FF3D]">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold uppercase font-heading text-[#F4F4F6]">
                        7. Relational Database Tables in LocalStorage
                      </h3>
                      <p className="text-xs text-[#A1A1AA]">
                        Keys: users · profiles (FK: userId) · workout_records (FK: userId) · settings
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: STORAGE_KEYS.USERS, label: 'users table' },
                    { key: STORAGE_KEYS.PROFILES, label: 'profiles table (FK: userId)' },
                    { key: STORAGE_KEYS.WORKOUT_RECORDS, label: 'workout_records table (FK: userId)' },
                    { key: STORAGE_KEYS.SETTINGS, label: 'settings table' },
                  ].map((table) => {
                    const data = table.key === STORAGE_KEYS.SETTINGS
                      ? StorageLayer.getSettings({})
                      : StorageLayer.getTable(table.key);

                    return (
                      <div key={table.key} className="bg-[#0B0B0F] p-4 rounded-xl border border-[#24242E]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-[#C6FF3D] uppercase">
                            {table.label}
                          </span>
                          <span className="text-xs font-mono text-[#A1A1AA]">
                            {Array.isArray(data) ? `${data.length} rows` : '1 row'}
                          </span>
                        </div>
                        <pre className="text-[11px] font-mono text-[#A1A1AA] bg-[#16161D] p-3 rounded-lg overflow-x-auto max-h-40">
                          {JSON.stringify(data, null, 2)}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Footer Disclaimer on every page */}
          <footer className="mt-16 pt-8 border-t border-[#24242E] text-center text-xs text-[#A1A1AA] font-mono">
            <p>
              These routines are general guides for healthy individuals and do not replace professional medical advice.
            </p>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B0B0F]/95 backdrop-blur-md border-t border-[#24242E] px-2 py-2 flex items-center justify-around z-40">
        {[
          { id: 'all', label: 'Suite', icon: Layers },
          { id: 'auth', label: 'Auth', icon: Users },
          { id: 'profile', label: 'Profile', icon: UserCheck },
          { id: 'bmi', label: 'BMI', icon: Scale },
          { id: 'splits', label: 'Splits', icon: Dumbbell },
          { id: 'records', label: 'Records', icon: TrendingUp },
          { id: 'reports', label: 'Reports', icon: Award },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition ${
                isActive ? 'text-[#C6FF3D]' : 'text-[#A1A1AA]'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
