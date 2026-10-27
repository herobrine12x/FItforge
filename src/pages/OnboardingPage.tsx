import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Dumbbell,
  Flame,
  Heart,
  Scale,
  Sparkles,
  Target,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BMICalculator } from '../models/BMICalculator';
import { ExperienceLevel } from '../models/types';

export function OnboardingPage() {
  const { currentUser, completeOnboarding } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Body Stats
  const [name, setName] = useState(currentUser?.username || '');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState<number>(24);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(72);

  // Step 2: Experience Level
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Intermediate');

  // Step 3: Weekly Goal & Focus
  const [weeklyGoal, setWeeklyGoal] = useState<number>(4);
  const [fitnessGoal, setFitnessGoal] = useState<'muscle_gain' | 'strength' | 'fat_loss' | 'endurance'>('muscle_gain');

  // Inline Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic BMI Calculation
  const bmiCalculation = useMemo(() => {
    if (weightKg >= 20 && weightKg <= 300 && heightCm >= 50 && heightCm <= 250) {
      const score = BMICalculator.calculate(weightKg, heightCm);
      const category = BMICalculator.classify(score);
      return { score, category };
    }
    return null;
  }, [weightKg, heightCm]);

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name or athlete alias is required.';
    if (!age || isNaN(age) || age < 10 || age > 100) {
      errs.age = 'Age must be between 10 and 100 years.';
    }
    if (!heightCm || isNaN(heightCm) || heightCm < 50 || heightCm > 250) {
      errs.heightCm = 'Height must be between 50 and 250 cm.';
    }
    if (!weightKg || isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
      errs.weightKg = 'Weight must be between 20 and 300 kg.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2);
    }
  };

  const handleFinishOnboarding = () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const res = completeOnboarding({
        name: name.trim(),
        gender,
        age: Number(age),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        experienceLevel,
        weeklyGoal: Number(weeklyGoal),
      });

      if (res.success) {
        success('Athlete profile saved! Welcome to your FitForge Dashboard.');
        navigate('/dashboard');
      } else {
        error(res.message);
        setErrors({ submit: res.message });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize profile setup.';
      error(msg);
      setErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0B0F] text-slate-900 dark:text-[#F4F4F6] flex flex-col justify-between p-4 sm:p-6 lg:p-12 selection:bg-[#C6FF3D] selection:text-[#0B0B0F]">
      <div className="max-w-3xl w-full mx-auto my-auto">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-1.5">
            <img
              src="/assets/aistudio/fitforge-logo_28ede239.svg"
              alt="FitForge"
              className="h-9 w-auto object-contain object-left"
            />
            <span className="text-[10px] font-mono text-[#A1A1AA] block uppercase tracking-widest">
              Workout Recommender and Progress Tracker · Athlete Onboarding
            </span>
          </div>
          <div className="text-xs font-mono text-[#A1A1AA]">
            Step <span className="text-[#C6FF3D] font-bold">{step}</span> of 3
          </div>
        </div>

        {/* Step Progress Tracker Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
          {[
            { num: 1, label: 'Body Metrics' },
            { num: 2, label: 'Experience Tier' },
            { num: 3, label: 'Weekly Target' },
          ].map((item) => {
            const isCompleted = step > item.num;
            const isCurrent = step === item.num;
            return (
              <div key={item.num} className="space-y-1.5">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#C6FF3D]'
                      : isCurrent
                      ? 'bg-[#C6FF3D] shadow-md shadow-[#C6FF3D]/30'
                      : 'bg-[#24242E]'
                  }`}
                />
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span
                    className={`${
                      isCurrent
                        ? 'text-[#F4F4F6] font-bold'
                        : isCompleted
                        ? 'text-[#C6FF3D]'
                        : 'text-[#A1A1AA]'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#C6FF3D]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Onboarding Main Card */}
        <div className="bg-white dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] rounded-3xl shadow-sm dark:shadow-none p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Background */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#C6FF3D]/5 blur-3xl pointer-events-none" />

          {/* ================= STEP 1: BODY STATS ================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-[#F4F4F6] uppercase">
                  Biometrics & Physiological Profile
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A1A1AA] mt-1">
                  These metrics calibrate your daily caloric burn calculations and safe workout loads.
                </p>
              </div>

              {errors.submit && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5">
                    Athlete Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full px-4 py-3 bg-[#0B0B0F] border rounded-2xl text-sm text-[#F4F4F6] focus:outline-none transition-colors ${
                      errors.name ? 'border-rose-500' : 'border-[#24242E] focus:border-[#C6FF3D]'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5">
                    Biological Gender
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`py-2.5 px-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                          gender === g
                            ? 'bg-[#C6FF3D] text-[#0B0B0F] border-[#C6FF3D]'
                            : 'bg-[#0B0B0F] text-[#A1A1AA] border-[#24242E] hover:text-[#F4F4F6]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5">
                    Age (Years · 10-100)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={age || ''}
                    onChange={(e) => setAge(parseInt(e.target.value, 10))}
                    className={`w-full px-4 py-3 bg-[#0B0B0F] border rounded-2xl text-sm text-[#F4F4F6] focus:outline-none transition-colors ${
                      errors.age ? 'border-rose-500' : 'border-[#24242E] focus:border-[#C6FF3D]'
                    }`}
                  />
                  {errors.age && (
                    <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.age}</span>
                    </p>
                  )}
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5">
                    Height (cm · 50-250)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={250}
                    value={heightCm || ''}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value))}
                    className={`w-full px-4 py-3 bg-[#0B0B0F] border rounded-2xl text-sm text-[#F4F4F6] focus:outline-none transition-colors ${
                      errors.heightCm ? 'border-rose-500' : 'border-[#24242E] focus:border-[#C6FF3D]'
                    }`}
                  />
                  {errors.heightCm && (
                    <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.heightCm}</span>
                    </p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5">
                    Body Weight (kg · 20-300)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={weightKg || ''}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                    className={`w-full px-4 py-3 bg-[#0B0B0F] border rounded-2xl text-sm text-[#F4F4F6] focus:outline-none transition-colors ${
                      errors.weightKg ? 'border-rose-500' : 'border-[#24242E] focus:border-[#C6FF3D]'
                    }`}
                  />
                  {errors.weightKg && (
                    <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.weightKg}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Real-time Dynamic BMI Banner */}
              {bmiCalculation && (
                <div className="p-4 rounded-2xl bg-[#0B0B0F] border border-[#24242E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">
                        Estimated Body Mass Index (BMI)
                      </div>
                      <div className="text-xl font-heading font-black text-[#F4F4F6]">
                        {bmiCalculation.score}{' '}
                        <span className="text-xs font-sans font-medium text-[#C6FF3D] ml-2">
                          {bmiCalculation.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-[#A1A1AA] text-right">
                    Target Healthy Band: 18.5 – 24.9
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: EXPERIENCE LEVEL ================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-[#F4F4F6] uppercase">
                  Select Training Experience
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A1A1AA] mt-1">
                  Workout splits automatically prescribe sets, rep ranges, and rest intervals calibrated to your tier.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {[
                  {
                    level: 'Beginner' as ExperienceLevel,
                    tag: 'Entry Tier',
                    setsDesc: '3 Sets · 10-12 Reps · 75-90s Rest',
                    desc: 'Focuses on foundational dumbbell and machine movements. Extended rest periods allow full neurological recovery between sets.',
                  },
                  {
                    level: 'Intermediate' as ExperienceLevel,
                    tag: 'Balanced Volume',
                    setsDesc: '4 Sets · 8-12 Reps · 60-75s Rest',
                    desc: 'Classic compound barbell and cable sequences. Designed for progressive overload and balanced hypertrophic stimulus.',
                  },
                  {
                    level: 'Advanced' as ExperienceLevel,
                    tag: 'High Intensity',
                    setsDesc: '5 Sets · 6-10 Reps · 45-60s Rest',
                    desc: 'Demanding compound variations with shortened rest countdowns to maximize training density and metabolic stress.',
                  },
                ].map((tier) => {
                  const isSelected = experienceLevel === tier.level;
                  return (
                    <div
                      key={tier.level}
                      onClick={() => setExperienceLevel(tier.level)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-[#1A2214] border-[#C6FF3D] shadow-lg shadow-[#C6FF3D]/10'
                          : 'bg-[#0B0B0F] border-[#24242E] hover:border-[#383847]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-2xl font-bold uppercase tracking-wide text-[#F4F4F6]">
                            {tier.level}
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-[#C6FF3D] text-[#0B0B0F] font-bold'
                                : 'bg-[#24242E] text-[#A1A1AA]'
                            }`}
                          >
                            {tier.tag}
                          </span>
                        </div>
                        <div className="text-xs font-mono font-semibold text-[#C6FF3D]">
                          {tier.setsDesc}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#A1A1AA] max-w-xl leading-relaxed">
                          {tier.desc}
                        </p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 self-start sm:self-center ${
                          isSelected
                            ? 'border-[#C6FF3D] bg-[#C6FF3D] text-[#0B0B0F]'
                            : 'border-[#383847] bg-[#16161D]'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 3: WEEKLY GOAL ================= */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-[#F4F4F6] uppercase">
                  Commit to Your Weekly Target
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A1A1AA] mt-1">
                  How many workout sessions do you aim to complete each week?
                </p>
              </div>

              {/* Weekly Workouts Stepper */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-2">
                  Target Workouts per Week
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {[2, 3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setWeeklyGoal(days)}
                      className={`py-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        weeklyGoal === days
                          ? 'bg-[#C6FF3D] text-[#0B0B0F] border-[#C6FF3D] shadow-md shadow-[#C6FF3D]/20 font-black'
                          : 'bg-[#0B0B0F] text-[#A1A1AA] border-[#24242E] hover:border-[#383847] hover:text-[#F4F4F6]'
                      }`}
                    >
                      <div className="font-heading text-3xl">{days}</div>
                      <div className="text-[10px] font-mono uppercase tracking-tight">Days / Wk</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Fitness Focus */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-2">
                  Primary Fitness Focus
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'muscle_gain' as const, label: 'Hypertrophy', desc: 'Muscle Growth' },
                    { id: 'strength' as const, label: 'Strength', desc: 'Heavy Loads' },
                    { id: 'fat_loss' as const, label: 'Fat Loss', desc: 'High Calorie Burn' },
                    { id: 'endurance' as const, label: 'Conditioning', desc: 'High Stamina' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFitnessGoal(f.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        fitnessGoal === f.id
                          ? 'bg-[#0B0B0F] border-[#C6FF3D] text-[#F4F4F6]'
                          : 'bg-[#0B0B0F] border-[#24242E] text-[#A1A1AA] hover:text-[#F4F4F6]'
                      }`}
                    >
                      <div className="text-xs font-bold">{f.label}</div>
                      <div className="text-[10px] text-[#A1A1AA]">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-[#0B0B0F] border border-[#24242E] space-y-2">
                <div className="text-xs font-mono uppercase text-[#A1A1AA] tracking-wider">
                  Athlete Profile Summary
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[#A1A1AA] block text-[10px]">Name:</span>
                    <span className="font-semibold text-[#F4F4F6]">{name}</span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block text-[10px]">Tier:</span>
                    <span className="font-semibold text-[#C6FF3D]">{experienceLevel}</span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block text-[10px]">Weekly Commitment:</span>
                    <span className="font-semibold text-[#F4F4F6]">{weeklyGoal} Days / Week</span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] block text-[10px]">BMI Index:</span>
                    <span className="font-semibold text-[#C6FF3D]">
                      {bmiCalculation ? `${bmiCalculation.score} (${bmiCalculation.category})` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP ACTION BUTTONS ================= */}
          <div className="mt-8 pt-6 border-t border-[#24242E] flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-3 px-5 rounded-2xl border border-[#24242E] hover:border-[#383847] text-[#A1A1AA] hover:text-[#F4F4F6] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="py-3.5 px-7 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52b] dark:text-[#0B0B0F] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF3D]/15 active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={isSubmitting}
                className="py-3.5 px-8 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52b] dark:text-[#0B0B0F] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF3D]/15 active:scale-[0.99] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Launch Dashboard</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
