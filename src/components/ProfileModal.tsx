import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Save, X } from 'lucide-react';
import { MemberProfile } from '../models/MemberProfile';
import { ActivityLevel, ExperienceLevel, FitnessGoal, Gender } from '../models/types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MemberProfile | null;
  onSave: (updatedData: {
    fullName: string;
    age: number;
    gender: Gender;
    heightCm: number;
    weightKg: number;
    experienceLevel: ExperienceLevel;
    fitnessGoal: FitnessGoal;
    activityLevel: ActivityLevel;
    targetWorkoutsPerWeek: number;
  }) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  if (!isOpen || !profile) return null;

  const [fullName, setFullName] = useState(profile.fullName);
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [weightKg, setWeightKg] = useState(profile.weightKg);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile.experienceLevel);
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(profile.fitnessGoal);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [targetWorkoutsPerWeek, setTargetWorkoutsPerWeek] = useState(profile.targetWorkoutsPerWeek);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(heightCm) || heightCm <= 0 || heightCm > 300) {
      setError('Height must be a positive number between 1 and 300 cm.');
      return;
    }
    if (isNaN(weightKg) || weightKg <= 0 || weightKg > 500) {
      setError('Weight must be a positive number between 1 and 500 kg.');
      return;
    }
    if (isNaN(age) || age < 10 || age > 120) {
      setError('Age must be between 10 and 120 years.');
      return;
    }

    try {
      onSave({
        fullName,
        age: Number(age),
        gender,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        experienceLevel,
        fitnessGoal,
        activityLevel,
        targetWorkoutsPerWeek: Number(targetWorkoutsPerWeek),
      });
      setSuccess('Biometrics updated successfully!');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation error occurred';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-950/40">
          <div>
            <h3 className="text-sm font-bold text-white">Member Biometrics</h3>
            <p className="text-[11px] font-mono text-gray-400">Class: MemberProfile</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded border border-red-800/80 bg-red-950/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                step="0.5"
                min="50"
                max="250"
                required
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">Age</label>
              <input
                type="number"
                min="10"
                max="120"
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Gender (BMR Formula)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="male">Male (Mifflin +5)</option>
                <option value="female">Female (Mifflin -161)</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Experience Tier
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="beginner">Beginner (3 sets)</option>
                <option value="intermediate">Intermediate (4 sets)</option>
                <option value="advanced">Advanced (5 sets)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Fitness Goal
              </label>
              <select
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value as FitnessGoal)}
                className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="muscle_gain">Muscle Hypertrophy</option>
                <option value="strength">Strength & Power</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="endurance">Endurance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="sedentary">Sedentary</option>
                <option value="light">Light Activity</option>
                <option value="moderate">Moderate Activity</option>
                <option value="very_active">Very Active</option>
                <option value="extra_active">Extra Active</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Target Workouts/Wk
              </label>
              <input
                type="number"
                min="1"
                max="7"
                required
                value={targetWorkoutsPerWeek}
                onChange={(e) => setTargetWorkoutsPerWeek(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Biometrics</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
