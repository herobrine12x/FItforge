import React, { useState } from 'react';
import { Calendar, Check, Scale, X } from 'lucide-react';
import { BMICalculator } from '../models/BMICalculator';
import { BodyWeightManager } from '../models/BodyWeightManager';

interface BodyWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentWeightKg: number;
  heightCm: number;
  onWeightLogged: (newWeightKg: number) => void;
}

export const BodyWeightModal: React.FC<BodyWeightModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentWeightKg,
  heightCm,
  onWeightLogged,
}) => {
  const [weightInput, setWeightInput] = useState<string>(
    currentWeightKg > 0 ? currentWeightKg.toString() : '70'
  );
  const [dateInput, setDateInput] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notesInput, setNotesInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleWeightChange = (val: string) => {
    setWeightInput(val);
    const result = BodyWeightManager.validate(val);
    if (!result.isValid) {
      setValidationError(result.error || 'Invalid weight.');
    } else {
      setValidationError(null);
    }
  };

  const handleAdjustWeight = (delta: number) => {
    const current = Number(weightInput) || currentWeightKg || 70;
    const next = Math.max(1, Math.min(500, Math.round((current + delta) * 10) / 10));
    setWeightInput(next.toString());
    setValidationError(null);
  };

  const candidateWeight = Number(weightInput) || currentWeightKg;
  let previewBmi = 22;
  let previewCategory = 'Normal';
  try {
    if (candidateWeight > 0 && heightCm > 0) {
      previewBmi = BMICalculator.calculate(candidateWeight, heightCm);
      previewCategory = BMICalculator.classify(previewBmi);
    }
  } catch {
    // safe
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = BodyWeightManager.validate(weightInput);
    if (!result.isValid) {
      setValidationError(result.error || 'Weight must be between 0 and 500 kg.');
      return;
    }

    try {
      const manager = new BodyWeightManager();
      manager.addEntry(userId, result.sanitized, dateInput, notesInput);
      onWeightLogged(result.sanitized);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save weight.';
      setValidationError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] rounded-3xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#24242E]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-[#C6FF3D]/10 dark:text-[#C6FF3D] dark:border-[#C6FF3D]/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-slate-900 dark:text-[#F4F4F6]">
                Log Body Weight
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#A1A1AA]">
                Records to body_weight table & recalculates BMI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F6] dark:hover:bg-[#24242E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Weight Input with Quick Adjusters */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-700 dark:text-[#A1A1AA] mb-1.5">
              Weight (kg) <span className="text-emerald-600 dark:text-[#C6FF3D]">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjustWeight(-1.0)}
                className="px-3 py-3 rounded-xl bg-slate-100 text-sm font-bold text-slate-800 hover:bg-slate-200 dark:bg-[#24242E] dark:text-[#F4F4F6] dark:hover:bg-[#2e2e3a] transition-colors cursor-pointer"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleAdjustWeight(-0.5)}
                className="px-3 py-3 rounded-xl bg-slate-100 text-sm font-bold text-slate-800 hover:bg-slate-200 dark:bg-[#24242E] dark:text-[#F4F4F6] dark:hover:bg-[#2e2e3a] transition-colors cursor-pointer"
              >
                -0.5
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="500"
                  value={weightInput}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  placeholder="e.g. 74.5"
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-[#0B0B0F] border rounded-xl font-mono text-lg font-bold text-slate-900 dark:text-[#F4F4F6] text-center focus:outline-none transition-colors ${
                    validationError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-[#24242E] focus:border-slate-500 dark:focus:border-[#C6FF3D]'
                  }`}
                  autoFocus
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-mono text-slate-500 dark:text-[#A1A1AA] pointer-events-none">
                  kg
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAdjustWeight(0.5)}
                className="px-3 py-3 rounded-xl bg-slate-100 text-sm font-bold text-slate-800 hover:bg-slate-200 dark:bg-[#24242E] dark:text-[#F4F4F6] dark:hover:bg-[#2e2e3a] transition-colors cursor-pointer"
              >
                +0.5
              </button>
              <button
                type="button"
                onClick={() => handleAdjustWeight(1.0)}
                className="px-3 py-3 rounded-xl bg-slate-100 text-sm font-bold text-slate-800 hover:bg-slate-200 dark:bg-[#24242E] dark:text-[#F4F4F6] dark:hover:bg-[#2e2e3a] transition-colors cursor-pointer"
              >
                +1
              </button>
            </div>
            {validationError && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium">{validationError}</p>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-700 dark:text-[#A1A1AA] mb-1.5">
              Log Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0B0B0F] border border-slate-300 dark:border-[#24242E] rounded-xl font-mono text-sm text-slate-900 dark:text-[#F4F4F6] focus:outline-none focus:border-slate-500 dark:focus:border-[#C6FF3D]"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-700 dark:text-[#A1A1AA] mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. Morning fasted weigh-in"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0B0B0F] border border-slate-300 dark:border-[#24242E] rounded-xl text-sm text-slate-900 dark:text-[#F4F4F6] focus:outline-none focus:border-slate-500 dark:focus:border-[#C6FF3D]"
            />
          </div>

          {/* Live BMI Preview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-600 dark:text-[#A1A1AA]">
                Projected BMI ({heightCm} cm)
              </div>
              <div className="text-sm text-slate-900 dark:text-[#F4F4F6] font-medium mt-0.5">
                Category: <span className="text-emerald-700 dark:text-[#C6FF3D] font-bold">{previewCategory}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-black text-slate-900 dark:text-[#C6FF3D]">
                {previewBmi.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:bg-[#24242E] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F6] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!validationError}
              className={`w-2/3 py-3 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                validationError
                  ? 'bg-slate-300 dark:bg-gray-800 text-slate-500 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52e] dark:text-[#0B0B0F] shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Save & Update Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
