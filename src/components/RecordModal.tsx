import React, { useState } from 'react';
import { AlertCircle, Save, X } from 'lucide-react';
import { SplitType, WorkoutExerciseLog } from '../models/types';
import { WorkoutRecord } from '../models/WorkoutRecord';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit?: WorkoutRecord | null;
  userId: string;
  onSave: (data: {
    id?: string;
    userId: string;
    title: string;
    splitType: SplitType;
    durationMinutes: number;
    caloriesBurned: number;
    rating: number;
    notes: string;
    date: string;
    exercises: WorkoutExerciseLog[];
  }) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
  userId,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEditing = !!recordToEdit;

  const [title, setTitle] = useState(
    recordToEdit?.title || 'FitForge Workout Session'
  );
  const [splitType, setSplitType] = useState<SplitType>(
    recordToEdit?.splitType || 'push'
  );
  const [durationMinutes, setDurationMinutes] = useState(
    recordToEdit?.durationMinutes || 45
  );
  const [caloriesBurned, setCaloriesBurned] = useState(
    recordToEdit?.caloriesBurned || 300
  );
  const [rating, setRating] = useState(recordToEdit?.rating || 5);
  const [notes, setNotes] = useState(recordToEdit?.notes || '');
  const [date, setDate] = useState(
    recordToEdit?.date
      ? new Date(recordToEdit.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Workout title is required.');
      return;
    }
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      setError('Duration must be greater than 0 minutes.');
      return;
    }
    if (isNaN(caloriesBurned) || caloriesBurned < 0) {
      setError('Calories burned cannot be negative.');
      return;
    }

    try {
      onSave({
        id: recordToEdit?.id,
        userId,
        title: title.trim(),
        splitType,
        durationMinutes: Number(durationMinutes),
        caloriesBurned: Number(caloriesBurned),
        rating: Number(rating),
        notes: notes.trim(),
        date: new Date(date).toISOString(),
        exercises: recordToEdit?.exercises || [],
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving record';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-950/40">
          <div>
            <h3 className="text-sm font-bold text-white">
              {isEditing ? 'Edit Workout Record' : 'Log New Workout (Create)'}
            </h3>
            <p className="text-[11px] font-mono text-gray-400">Class: WorkoutRecord</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded border border-red-800/80 bg-red-950/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
              Workout Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Push Day - Chest & Triceps"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Training Split
              </label>
              <select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as SplitType)}
                className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="push">Push</option>
                <option value="pull">Pull</option>
                <option value="legs_core">Legs & Core</option>
                <option value="full_body">Full Body</option>
                <option value="walk">Walk / Cardio Stroll</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                min="1"
                max="360"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                min="0"
                max="2500"
                required
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
              Athlete Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-lg cursor-pointer ${
                    star <= rating ? 'text-amber-400' : 'text-gray-700'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="text-xs font-mono text-gray-400 ml-2">({rating}/5)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
              Athlete Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="Reflections, weights lifted, performance feedback..."
            />
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
              <span>{isEditing ? 'Save Changes' : 'Create Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
