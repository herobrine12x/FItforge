import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Eye,
  EyeOff,
  Flame,
  Key,
  Lock,
  LogOut,
  Save,
  Scale,
  Settings,
  Shield,
  Sliders,
  Trash2,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BMICalculator } from '../models/BMICalculator';
import { RecordManager } from '../models/RecordManager';
import { ReportGenerator } from '../models/ReportGenerator';
import { ExperienceLevel } from '../models/types';
import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from '../utils/units';

export function SettingsPage() {
  const {
    currentUser,
    currentProfile,
    userPreferences,
    updateProfile,
    updatePreferences,
    changePassword,
    deleteAccount,
    clearAllWorkoutHistory,
    logout,
  } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // ================= 1. PROFILE STATE & VALIDATION =================
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(24);
  const [gender, setGender] = useState('Male');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Intermediate');

  // Metric fields
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(72);

  // Imperial fields
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(9);
  const [weightLbs, setWeightLbs] = useState<number>(158.7);

  // Profile inline validation errors
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Initialize from currentProfile
  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.name || '');
      setAge(currentProfile.age || 24);
      setGender(currentProfile.gender || 'Male');
      setExperienceLevel(currentProfile.experienceLevel || 'Intermediate');

      const cm = currentProfile.heightCm || 175;
      const kg = currentProfile.weightKg || 72;
      setHeightCm(cm);
      setWeightKg(kg);

      const { feet, inches } = cmToFtIn(cm);
      setHeightFeet(feet);
      setHeightInches(inches);
      setWeightLbs(kgToLb(kg));
    }
  }, [currentProfile]);

  // When units switch, sync local input values
  const handleUnitChange = (newUnit: 'metric' | 'imperial') => {
    updatePreferences({ units: newUnit });
    if (newUnit === 'imperial') {
      const { feet, inches } = cmToFtIn(heightCm);
      setHeightFeet(feet);
      setHeightInches(inches);
      setWeightLbs(kgToLb(weightKg));
    } else {
      const cm = ftInToCm(heightFeet, heightInches);
      const kg = lbToKg(weightLbs);
      setHeightCm(cm);
      setWeightKg(kg);
    }
  };

  // Real-time calculated candidate BMI
  const candidateBmi = React.useMemo(() => {
    try {
      const targetKg = userPreferences.units === 'imperial' ? lbToKg(weightLbs) : weightKg;
      const targetCm = userPreferences.units === 'imperial' ? ftInToCm(heightFeet, heightInches) : heightCm;
      if (targetKg > 0 && targetCm > 0) {
        const score = BMICalculator.calculate(targetKg, targetCm);
        const category = BMICalculator.classify(score);
        return { score, category };
      }
    } catch {
      // Ignored during typing
    }
    return { score: 22.0, category: 'Normal' };
  }, [userPreferences.units, weightKg, heightCm, weightLbs, heightFeet, heightInches]);

  // Validate profile inputs
  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!age || age < 10 || age > 100) {
      errors.age = 'Age must be between 10 and 100 years.';
    }

    if (!gender.trim()) {
      errors.gender = 'Gender is required.';
    }

    if (userPreferences.units === 'metric') {
      if (!heightCm || heightCm < 50 || heightCm > 250) {
        errors.height = 'Height must be between 50 and 250 cm.';
      }
      if (!weightKg || weightKg < 20 || weightKg > 300) {
        errors.weight = 'Weight must be between 20 and 300 kg.';
      }
    } else {
      const cm = ftInToCm(heightFeet, heightInches);
      const kg = lbToKg(weightLbs);
      if (cm < 50 || cm > 250) {
        errors.height = 'Height must be between 1 ft 8 in and 8 ft 2 in.';
      }
      if (kg < 20 || kg > 300) {
        errors.weight = 'Weight must be between 44 and 660 lbs.';
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) {
      error('Please fix the validation errors before saving.');
      return;
    }

    setIsSavingProfile(true);

    const targetHeightCm = userPreferences.units === 'imperial' ? ftInToCm(heightFeet, heightInches) : heightCm;
    const targetWeightKg = userPreferences.units === 'imperial' ? lbToKg(weightLbs) : weightKg;

    const res = updateProfile({
      name: name.trim(),
      age: Number(age),
      gender: gender.trim(),
      heightCm: targetHeightCm,
      weightKg: targetWeightKg,
      experienceLevel,
    });

    setIsSavingProfile(false);

    if (res.success) {
      const newBmi = BMICalculator.calculate(targetWeightKg, targetHeightCm);
      const newCat = BMICalculator.classify(newBmi);
      success(`Profile saved! Updated BMI: ${newBmi} (${newCat})`);
    } else {
      error(res.message);
    }
  };

  // ================= 2. PREFERENCES (WEEKLY GOAL, SOUND, UNITS) =================
  const [weeklyGoal, setWeeklyGoal] = useState<number>(currentProfile?.weeklyGoal || 3);

  useEffect(() => {
    if (currentProfile?.weeklyGoal) {
      setWeeklyGoal(currentProfile.weeklyGoal);
    }
  }, [currentProfile?.weeklyGoal]);

  const handleWeeklyGoalChange = (newGoal: number) => {
    setWeeklyGoal(newGoal);
    updateProfile({ weeklyGoal: newGoal });
    success(`Weekly workout goal updated to ${newGoal} sessions.`);
  };

  const handleSoundToggle = () => {
    const nextVal = !userPreferences.soundEnabled;
    updatePreferences({ soundEnabled: nextVal });
    if (nextVal) {
      success('Rest-timer audio enabled.');
    } else {
      info('Rest-timer audio muted.');
    }
  };

  // ================= 3. DATA MANAGEMENT (CSV EXPORT & CLEAR HISTORY) =================
  const [isDeleteHistoryModalOpen, setIsDeleteHistoryModalOpen] = useState(false);

  const handleExportCSV = () => {
    if (!currentUser) return;
    try {
      const recordMgr = new RecordManager();
      const reportGen = new ReportGenerator(recordMgr);
      reportGen.exportCSV(currentUser.id, 'FitForge_Workout_Report');
      success('CSV export generated and downloaded successfully.');
    } catch (err) {
      error('Failed to export CSV report.');
    }
  };

  const handleConfirmDeleteHistory = () => {
    const res = clearAllWorkoutHistory();
    if (res.success) {
      success(res.message || 'All workout records removed.');
    } else {
      error(res.message);
    }
  };

  // ================= 4. ACCOUNT MANAGEMENT (PASSWORD CHANGE & LOGOUT) =================
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.current = 'Current password is required.';
    }
    if (!newPassword) {
      errors.new = 'New password is required.';
    } else if (newPassword.length < 4) {
      errors.new = 'New password must be at least 4 characters long.';
    }
    if (newPassword !== confirmPassword) {
      errors.confirm = 'New passwords do not match.';
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsChangingPass(true);
    const res = changePassword(currentPassword, newPassword);
    setIsChangingPass(false);

    if (res.success) {
      success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } else {
      error(res.message);
      setPasswordErrors({ current: res.message });
    }
  };

  const handleLogout = () => {
    logout();
    info('You have logged out of FitForge.');
    navigate('/login');
  };

  // ================= 5. DANGER ZONE (DELETE ACCOUNT) =================
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  const handleConfirmDeleteAccount = () => {
    const res = deleteAccount();
    if (res.success) {
      info('Your FitForge account and all associated data have been permanently removed.');
      navigate('/login');
    } else {
      error(res.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#24242E]">
        <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D]">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#F4F4F6]">
            Settings
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Manage biometrics, training goals, unit system, and account maintenance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* ================= CARD 1: PROFILE ================= */}
        <div className="bg-[#16161D] rounded-3xl border border-[#24242E] p-6 sm:p-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#24242E]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                    Athlete Profile
                  </h2>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Personal biometrics and training experience.
                  </p>
                </div>
              </div>

              {/* Real-time BMI live badge */}
              <div className="text-right">
                <div className="text-[10px] font-mono text-[#A1A1AA] uppercase">Live BMI Preview</div>
                <div className="text-sm font-bold text-[#C6FF3D] font-mono">
                  {candidateBmi.score} · {candidateBmi.category}
                </div>
              </div>
            </div>

            <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="settings-name" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                  Full Name
                </label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (profileErrors.name) setProfileErrors((p) => ({ ...p, name: '' }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border text-sm text-[#F4F4F6] outline-none transition-colors ${
                    profileErrors.name ? 'border-rose-500 bg-rose-950/10' : 'border-[#24242E] focus:border-[#C6FF3D]'
                  }`}
                  placeholder="e.g. Kent Malo"
                />
                {profileErrors.name && (
                  <p className="text-rose-400 text-[11px] mt-1 font-medium">{profileErrors.name}</p>
                )}
              </div>

              {/* Age and Gender Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="settings-age" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    id="settings-age"
                    type="number"
                    min="10"
                    max="100"
                    value={age || ''}
                    onChange={(e) => {
                      setAge(Number(e.target.value));
                      if (profileErrors.age) setProfileErrors((p) => ({ ...p, age: '' }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border text-sm text-[#F4F4F6] outline-none transition-colors ${
                      profileErrors.age ? 'border-rose-500 bg-rose-950/10' : 'border-[#24242E] focus:border-[#C6FF3D]'
                    }`}
                  />
                  {profileErrors.age && (
                    <p className="text-rose-400 text-[11px] mt-1 font-medium">{profileErrors.age}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="settings-gender" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                    Gender
                  </label>
                  <select
                    id="settings-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] focus:border-[#C6FF3D] text-sm text-[#F4F4F6] outline-none transition-colors cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Height & Weight Inputs (Responsive to Unit Preference) */}
              {userPreferences.units === 'metric' ? (
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="settings-height-cm" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                      Height (cm)
                    </label>
                    <input
                      id="settings-height-cm"
                      type="number"
                      step="0.5"
                      min="50"
                      max="250"
                      value={heightCm || ''}
                      onChange={(e) => {
                        setHeightCm(Number(e.target.value));
                        if (profileErrors.height) setProfileErrors((p) => ({ ...p, height: '' }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border text-sm text-[#F4F4F6] outline-none transition-colors ${
                        profileErrors.height ? 'border-rose-500 bg-rose-950/10' : 'border-[#24242E] focus:border-[#C6FF3D]'
                      }`}
                    />
                    {profileErrors.height && (
                      <p className="text-rose-400 text-[11px] mt-1 font-medium">{profileErrors.height}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="settings-weight-kg" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                      Weight (kg)
                    </label>
                    <input
                      id="settings-weight-kg"
                      type="number"
                      step="0.1"
                      min="20"
                      max="300"
                      value={weightKg || ''}
                      onChange={(e) => {
                        setWeightKg(Number(e.target.value));
                        if (profileErrors.weight) setProfileErrors((p) => ({ ...p, weight: '' }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border text-sm text-[#F4F4F6] outline-none transition-colors ${
                        profileErrors.weight ? 'border-rose-500 bg-rose-950/10' : 'border-[#24242E] focus:border-[#C6FF3D]'
                      }`}
                    />
                    {profileErrors.weight && (
                      <p className="text-rose-400 text-[11px] mt-1 font-medium">{profileErrors.weight}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                      Height (ft & in)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="2"
                        max="8"
                        value={heightFeet || ''}
                        onChange={(e) => setHeightFeet(Number(e.target.value))}
                        placeholder="ft"
                        aria-label="Height in feet"
                        className="w-full px-3 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] focus:border-[#C6FF3D] text-sm text-[#F4F4F6] outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={heightInches || ''}
                        onChange={(e) => setHeightInches(Number(e.target.value))}
                        placeholder="in"
                        aria-label="Height in inches"
                        className="w-full px-3 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] focus:border-[#C6FF3D] text-sm text-[#F4F4F6] outline-none"
                      />
                    </div>
                    {profileErrors.height && (
                      <p className="text-rose-400 text-[11px] mt-1 font-medium">{profileErrors.height}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="settings-weight-lb" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                      Weight (lb)
                    </label>
                    <input
                      id="settings-weight-lb"
                      type="number"
                      step="0.5"
                      min="44"
                      max="660"
                      value={weightLbs || ''}
                      onChange={(e) => setWeightLbs(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] focus:border-[#C6FF3D] text-sm text-[#F4F4F6] outline-none"
                    />
                    {profileErrors.weight && (
                      <p className="text-rose-400 text-[11px] mt-1 font-medium">{profileErrors.weight}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Experience Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                  Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Beginner', 'Intermediate', 'Advanced'] as ExperienceLevel[]).map((level) => {
                    const isSelected = experienceLevel.toLowerCase() === level.toLowerCase();
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setExperienceLevel(level)}
                        className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#C6FF3D] text-[#0B0B0F] border-[#C6FF3D] shadow-sm'
                            : 'bg-[#0B0B0F] text-[#A1A1AA] border-[#24242E] hover:text-[#F4F4F6] hover:bg-[#24242E]'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-[#24242E]">
            <button
              form="profile-form"
              type="submit"
              disabled={isSavingProfile}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase tracking-wider text-xs transition-all shadow-md shadow-[#C6FF3D]/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>

        {/* ================= CARD 2: PREFERENCES ================= */}
        <div className="bg-[#16161D] rounded-3xl border border-[#24242E] p-6 sm:p-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#24242E]">
              <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                  App Preferences
                </h2>
                <p className="text-[11px] text-[#A1A1AA]">
                  Units, rest-timer audio cues, and workout frequency targets.
                </p>
              </div>
            </div>

            {/* Units Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-[#F4F4F6]">Unit System</span>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Metric (kg / cm) or Imperial (lb / ft).
                  </p>
                </div>
                <div className="inline-flex p-1 rounded-2xl bg-[#0B0B0F] border border-[#24242E]">
                  <button
                    type="button"
                    onClick={() => handleUnitChange('metric')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      userPreferences.units === 'metric'
                        ? 'bg-[#C6FF3D] text-[#0B0B0F]'
                        : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                    }`}
                  >
                    kg / cm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitChange('imperial')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      userPreferences.units === 'imperial'
                        ? 'bg-[#C6FF3D] text-[#0B0B0F]'
                        : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                    }`}
                  >
                    lb / ft
                  </button>
                </div>
              </div>
            </div>

            {/* Rest-Timer Sound Toggle */}
            <div className="space-y-2 pt-2 border-t border-[#24242E]">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#F4F4F6]">Rest-Timer Sound</span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        userPreferences.soundEnabled
                          ? 'bg-[#C6FF3D]/15 text-[#C6FF3D]'
                          : 'bg-[#24242E] text-[#A1A1AA]'
                      }`}
                    >
                      {userPreferences.soundEnabled ? 'Enabled' : 'Muted'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Play audio beeps when rest periods reach zero during workouts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSoundToggle}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    userPreferences.soundEnabled
                      ? 'bg-[#C6FF3D]/15 border-[#C6FF3D]/50 text-[#C6FF3D]'
                      : 'bg-[#0B0B0F] border-[#24242E] text-[#A1A1AA] hover:text-[#F4F4F6]'
                  }`}
                  aria-label={userPreferences.soundEnabled ? 'Mute rest timer sound' : 'Enable rest timer sound'}
                >
                  {userPreferences.soundEnabled ? (
                    <Volume2 className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <VolumeX className="w-5 h-5 stroke-[2]" />
                  )}
                </button>
              </div>
            </div>

            {/* Weekly Workout Goal Selector */}
            <div className="space-y-2.5 pt-2 border-t border-[#24242E]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F4F4F6]">Weekly Workout Goal</span>
                  <span className="text-xs font-mono font-bold text-[#C6FF3D]">
                    {weeklyGoal} days / week
                  </span>
                </div>
                <p className="text-[11px] text-[#A1A1AA]">
                  Your target number of training sessions per calendar week.
                </p>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const isSelected = weeklyGoal === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleWeeklyGoalChange(num)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#C6FF3D] text-[#0B0B0F] border-[#C6FF3D] shadow-sm'
                          : 'bg-[#0B0B0F] text-[#A1A1AA] border-[#24242E] hover:text-[#F4F4F6] hover:bg-[#24242E]'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#24242E] text-[11px] font-mono text-[#A1A1AA] flex items-center justify-between">
            <span>Preferences saved automatically</span>
            <span className="text-[#C6FF3D]">Sync: Local</span>
          </div>
        </div>

        {/* ================= CARD 3: DATA MANAGEMENT ================= */}
        <div className="bg-[#16161D] rounded-3xl border border-[#24242E] p-6 sm:p-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#24242E]">
              <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                  Data Management
                </h2>
                <p className="text-[11px] text-[#A1A1AA]">
                  Export training data as CSV or reset workout history.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Export CSV Option */}
              <div className="p-4 rounded-2xl bg-[#0B0B0F] border border-[#24242E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-[#F4F4F6]">Export My Data as CSV</div>
                  <p className="text-xs text-[#A1A1AA]">
                    Download a full spreadsheet containing every recorded session, calories, and duration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#24242E] hover:bg-[#2E2E3C] text-[#F4F4F6] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#C6FF3D]" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Delete All History Option */}
              <div className="p-4 rounded-2xl bg-[#0B0B0F] border border-[#24242E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-rose-300">Delete All Workout History</div>
                  <p className="text-xs text-[#A1A1AA]">
                    Permanently delete all workout session logs while preserving your profile and account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteHistoryModalOpen(true)}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-800/60 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete History</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#24242E] text-[11px] text-[#A1A1AA]">
            Workout history logs conform to FitForge schema specifications.
          </div>
        </div>

        {/* ================= CARD 4: ACCOUNT ================= */}
        <div className="bg-[#16161D] rounded-3xl border border-[#24242E] p-6 sm:p-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#24242E]">
              <div className="w-8 h-8 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D]">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                  Account Credentials
                </h2>
                <p className="text-[11px] text-[#A1A1AA]">
                  Update your account password or sign out of your session.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {/* Current Password */}
              <div>
                <label htmlFor="settings-current-pass" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="settings-current-pass"
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordErrors.current) setPasswordErrors((p) => ({ ...p, current: '' }));
                    }}
                    placeholder="Enter current password"
                    className={`w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border text-sm text-[#F4F4F6] outline-none pr-10 ${
                      passwordErrors.current
                        ? 'border-rose-500 bg-rose-950/10'
                        : 'border-[#24242E] focus:border-[#C6FF3D]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#F4F4F6] cursor-pointer"
                    aria-label={showCurrentPass ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.current && (
                  <p className="text-rose-400 text-[11px] mt-1 font-medium">{passwordErrors.current}</p>
                )}
              </div>

              {/* New Password and Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="settings-new-pass" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="settings-new-pass"
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordErrors.new) setPasswordErrors((p) => ({ ...p, new: '' }));
                      }}
                      placeholder="Min 4 characters"
                      className={`w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border text-sm text-[#F4F4F6] outline-none pr-10 ${
                        passwordErrors.new
                          ? 'border-rose-500 bg-rose-950/10'
                          : 'border-[#24242E] focus:border-[#C6FF3D]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#F4F4F6] cursor-pointer"
                      aria-label={showNewPass ? 'Hide password' : 'Show password'}
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.new && (
                    <p className="text-rose-400 text-[11px] mt-1 font-medium">{passwordErrors.new}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="settings-confirm-pass" className="block text-xs font-semibold text-[#F4F4F6] mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    id="settings-confirm-pass"
                    type={showNewPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordErrors.confirm) setPasswordErrors((p) => ({ ...p, confirm: '' }));
                    }}
                    placeholder="Repeat new password"
                    className={`w-full px-4 py-2.5 rounded-2xl bg-[#0B0B0F] border text-sm text-[#F4F4F6] outline-none ${
                      passwordErrors.confirm
                        ? 'border-rose-500 bg-rose-950/10'
                        : 'border-[#24242E] focus:border-[#C6FF3D]'
                    }`}
                  />
                  {passwordErrors.confirm && (
                    <p className="text-rose-400 text-[11px] mt-1 font-medium">{passwordErrors.confirm}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#24242E] hover:bg-[#2E2E3C] text-[#F4F4F6] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-[#C6FF3D]" />
                  <span>{isChangingPass ? 'Updating...' : 'Change Password'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#24242E] hover:border-rose-500/40 text-[#A1A1AA] hover:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-[#24242E] text-[11px] font-mono text-[#A1A1AA] flex items-center justify-between">
            <span>Signed in as @{currentUser?.username || 'member'}</span>
            <span className="text-emerald-400">Session Secure</span>
          </div>
        </div>

        {/* ================= CARD 5: DANGER ZONE ================= */}
        <div className="lg:col-span-2 bg-[#16161D] rounded-3xl border border-rose-900/50 p-6 sm:p-7 space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-400 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-bold text-rose-400 uppercase tracking-wide">
                    Danger Zone
                  </h2>
                  <span className="text-[10px] font-mono uppercase bg-rose-950/60 border border-rose-800/60 text-rose-300 px-2 py-0.5 rounded-md">
                    Destructive
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] max-w-xl">
                  Permanently delete your FitForge account, profile settings, and all logged workout records. Once confirmed, this action cannot be undone.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteAccountModalOpen(true)}
              className="w-full sm:w-auto shrink-0 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-heading font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-rose-900/30 cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Deleting History */}
      <ConfirmModal
        isOpen={isDeleteHistoryModalOpen}
        onClose={() => setIsDeleteHistoryModalOpen(false)}
        onConfirm={handleConfirmDeleteHistory}
        title="Delete Workout History?"
        description="Are you sure you want to permanently delete all your recorded workouts? This removes all session logs and resets your total workouts and calories burned to zero. Your profile biometrics and account credentials will remain intact."
        confirmLabel="Yes, Delete All History"
        isDestructive={true}
      />

      {/* Confirmation Modal for Deleting Account */}
      <ConfirmModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirm={handleConfirmDeleteAccount}
        title="Permanently Delete FitForge Account?"
        description="This action is permanent and completely irrecoverable. Your user credentials, athlete biometrics profile, preferences, and all historical workout sessions will be erased immediately."
        confirmLabel="Permanently Delete Account"
        isDestructive={true}
        requireMatchText={currentUser?.username || 'delete'}
      />
    </div>
  );
}
