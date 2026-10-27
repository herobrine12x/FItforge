import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  Lock,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function AuthPage() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, loginDemo } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const handleToggleMode = (mode: boolean) => {
    setIsRegisterMode(mode);
    setFieldErrors({});
  };

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    const trimmedUser = username.trim();

    if (!trimmedUser) {
      errors.username = 'Username is required.';
    } else if (trimmedUser.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters long.';
    }

    if (isRegisterMode) {
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password.';
      } else if (confirmPassword !== password) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      if (isRegisterMode) {
        const res = register(username.trim(), password);
        if (res.success) {
          success(res.message || 'Account created! Complete your fitness profile.');
          // Redirect to 3-step onboarding
          navigate('/onboarding');
        } else {
          error(res.message || 'Registration failed.');
          setFieldErrors({ general: res.message });
        }
      } else {
        const res = login(username.trim(), password);
        if (res.success) {
          success(res.message || 'Welcome back!');
          navigate('/dashboard');
        } else {
          error(res.message || 'Login failed.');
          setFieldErrors({ general: res.message });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      error(msg);
      setFieldErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = () => {
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      const res = loginDemo();
      if (res.success) {
        success('Logged in with demo athlete account!');
        navigate('/dashboard');
      } else {
        error(res.message || 'Failed to sign in as demo.');
      }
    } catch (err) {
      error('Demo sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0B0B0F] text-slate-900 dark:text-[#F4F4F6] flex flex-col justify-between selection:bg-lime-400 dark:selection:bg-[#C6FF3D] selection:text-slate-900 dark:selection:text-[#0B0B0F]">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl bg-white dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-black/80 grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* ================= LEFT COLUMN: FORM SIDE ================= */}
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              {/* Brand Header */}
              <div className="flex flex-col gap-2 mb-8">
                <img
                  src="/assets/aistudio/fitforge-logo_28ede239.svg"
                  alt="FitForge"
                  className="h-10 w-auto object-contain object-left"
                />
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-[#A1A1AA]">
                  Workout Recommender and Progress Tracker
                </div>
              </div>

              {/* Mode Toggle Switcher */}
              <div className="bg-slate-100 dark:bg-[#0B0B0F] p-1.5 rounded-2xl border border-slate-200 dark:border-[#24242E] flex items-center gap-1 mb-8">
                <button
                  type="button"
                  onClick={() => handleToggleMode(false)}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    !isRegisterMode
                      ? 'bg-[#cbd5e1] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:text-[#0B0B0F] shadow-sm'
                      : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode(true)}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    isRegisterMode
                      ? 'bg-[#cbd5e1] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:text-[#0B0B0F] shadow-sm'
                      : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Title & Prompt */}
              <div className="mb-6">
                <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-[#F4F4F6] uppercase">
                  {isRegisterMode ? 'Join FitForge' : 'Welcome to FitForge'}
                </h1>
                <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-1.5">
                  {isRegisterMode
                    ? 'Create your credentials to configure personalized body metrics and training splits.'
                    : 'Sign in to access your customized 5-exercise routines and workout logs.'}
                </p>
              </div>

              {/* General Form Error Banner */}
              {fieldErrors.general && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/50 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                  <span>{fieldErrors.general}</span>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Username Field */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#A1A1AA]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. iron_lifter"
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#0B0B0F] border rounded-2xl text-sm text-slate-900 dark:text-[#F4F4F6] placeholder-slate-400 dark:placeholder-[#A1A1AA]/50 focus:outline-none transition-colors ${
                        fieldErrors.username
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-slate-300 dark:border-[#24242E] focus:border-slate-500 dark:focus:border-[#C6FF3D]'
                      }`}
                    />
                  </div>
                  {fieldErrors.username && (
                    <p className="text-rose-500 dark:text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.username}</span>
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#A1A1AA]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-[#0B0B0F] border rounded-2xl text-sm text-slate-900 dark:text-[#F4F4F6] placeholder-slate-400 dark:placeholder-[#A1A1AA]/50 focus:outline-none transition-colors ${
                        fieldErrors.password
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-slate-300 dark:border-[#24242E] focus:border-slate-500 dark:focus:border-[#C6FF3D]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F6] transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-rose-500 dark:text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.password}</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password (Register mode only) */}
                {isRegisterMode && (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#A1A1AA]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#0B0B0F] border rounded-2xl text-sm text-slate-900 dark:text-[#F4F4F6] placeholder-slate-400 dark:placeholder-[#A1A1AA]/50 focus:outline-none transition-colors ${
                          fieldErrors.confirmPassword
                            ? 'border-rose-500 focus:border-rose-500'
                            : 'border-slate-300 dark:border-[#24242E] focus:border-slate-500 dark:focus:border-[#C6FF3D]'
                        }`}
                      />
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-rose-500 dark:text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.confirmPassword}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52b] dark:text-[#0B0B0F] font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/15 active:scale-[0.99] disabled:opacity-50"
                >
                  <span>{isRegisterMode ? 'Continue to Onboarding' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-[#24242E]" />
                </div>
                <span className="relative bg-white dark:bg-[#16161D] px-3 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">
                  Quick Exploration
                </span>
              </div>

              {/* Use Demo Account Button */}
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 dark:border-[#24242E] hover:border-slate-400 dark:hover:border-[#C6FF3D]/60 hover:bg-slate-100 dark:hover:bg-[#24242E]/40 text-slate-800 dark:text-[#F4F4F6] text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-[#C6FF3D]" />
                <span>Use demo account (demo / demo123)</span>
              </button>
            </div>

            {/* Bottom hint */}
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-[#24242E]/60 text-center">
              <span className="text-xs text-slate-600 dark:text-[#A1A1AA]">
                {isRegisterMode ? 'Already have an account?' : 'Need a new account?'}{' '}
                <button
                  type="button"
                  onClick={() => handleToggleMode(!isRegisterMode)}
                  className="text-emerald-700 hover:text-emerald-800 dark:text-[#C6FF3D] dark:hover:underline font-semibold cursor-pointer ml-1"
                >
                  {isRegisterMode ? 'Sign in here' : 'Register now'}
                </button>
              </span>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: MOTIVATIONAL GRADIENT ================= */}
          <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-[#1A1F14] dark:via-[#16161D] dark:to-[#0B0B0F] border-l border-slate-200 dark:border-[#24242E] p-10 lg:p-12 flex-col justify-between relative overflow-hidden">
            {/* Subtle radial ambient lime glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#C6FF3D]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#C6FF3D]/5 blur-3xl pointer-events-none" />

            {/* Top Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#C6FF3D]/10 border border-emerald-300 dark:border-[#C6FF3D]/30 text-emerald-800 dark:text-[#C6FF3D] font-mono text-[10px] uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                <span>FitForge OOP Architecture</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-[#A1A1AA]">v2.0 Shell</span>
            </div>

            {/* Main Motivational Typography */}
            <div className="relative z-10 my-auto py-8">
              <div className="text-xs font-mono uppercase tracking-widest text-emerald-700 dark:text-[#C6FF3D] mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4" />
                <span>Workout Recommender and Progress Tracker</span>
              </div>
              <h2 className="font-heading text-4xl xl:text-5xl font-black text-slate-900 dark:text-[#F4F4F6] leading-[0.95] tracking-wide uppercase">
                FORGE YOUR PHYSIQUE.
                <br />
                <span className="text-emerald-600 dark:text-[#C6FF3D]">EVERY REP MATTERS.</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A1A1AA] mt-4 leading-relaxed max-w-md">
                Experience structured resistance splits, intelligent interval countdowns, and automated MET calorie accounting backed by strict object-oriented modeling.
              </p>

              {/* 3 Value Pillars */}
              <div className="mt-8 space-y-3.5">
                {[
                  {
                    title: '7 Polymorphic Split Routines',
                    desc: 'Push, Pull, Legs, Full Body, Upper Body, Home Bodyweight & HIIT.',
                  },
                  {
                    title: 'Enforced Physiological Constraints',
                    desc: 'Encapsulated BMI profiling with strict age, height, and weight validation.',
                  },
                  {
                    title: 'Complete Relational Persistence',
                    desc: 'Foreign-key linked records stored safely in structured database tables.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 dark:bg-[#0B0B0F]/60 border border-slate-200 dark:border-[#24242E] shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-[#C6FF3D]/10 text-emerald-800 dark:text-[#C6FF3D] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-[#F4F4F6]">{item.title}</div>
                      <div className="text-[11px] text-slate-600 dark:text-[#A1A1AA] leading-snug">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Proof Metric */}
            <div className="relative z-10 pt-6 border-t border-slate-200 dark:border-[#24242E]/80 flex items-center justify-between text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
              <span>8 Pre-Loaded Seed Sessions</span>
              <span className="text-emerald-700 dark:text-[#C6FF3D] font-bold">100% Client-Side Storage</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
