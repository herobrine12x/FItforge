import React, { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Edit2,
  Filter,
  Flame,
  History as HistoryIcon,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RecordManager } from '../models/RecordManager';
import { WorkoutPlanFactory } from '../models/WorkoutPlanFactory';
import { WorkoutRecord } from '../models/WorkoutRecord';

interface FormErrors {
  duration?: string;
  date?: string;
  exercisesCompleted?: string;
}

const SPLIT_OPTIONS = [
  { id: 'Push', label: 'Push (Chest, Shoulders, Triceps)' },
  { id: 'Pull', label: 'Pull (Back, Biceps, Rear Delts)' },
  { id: 'Legs & Core', label: 'Legs & Core (Quads, Hamstrings, Abs)' },
  { id: 'Full Body', label: 'Full Body (Total-Body Compounds)' },
  { id: 'Upper Body', label: 'Upper Body (Torso Hypertrophy)' },
  { id: 'Home Bodyweight', label: 'Home Bodyweight (Zero Equipment)' },
  { id: 'Cardio HIIT', label: 'Cardio HIIT (Conditioning Intervals)' },
  { id: 'Walk', label: 'Walk (Active Recovery / Cardio)' },
];

export function HistoryPage() {
  const navigate = useNavigate();
  const { currentUser, currentProfile } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [recordManager] = useState(() => new RecordManager());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [splitFilter, setSplitFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WorkoutRecord | null>(null);

  // Form Fields
  const [formSplit, setFormSplit] = useState('Push');
  const [formDate, setFormDate] = useState(() => getTodayString());
  const [formDuration, setFormDuration] = useState<number | string>(45);
  const [formExercisesCompleted, setFormExercisesCompleted] = useState<number>(5);
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Delete Confirmation State
  const [recordToDelete, setRecordToDelete] = useState<WorkoutRecord | null>(null);

  // Helper: Today's date string YYYY-MM-DD
  function getTodayString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Load user records
  const allUserRecords = useMemo(() => {
    if (!currentUser) return [];
    // refreshTrigger forces re-calculation when records are mutated
    void refreshTrigger;
    return recordManager.readAll(currentUser.id);
  }, [currentUser, recordManager, refreshTrigger]);

  // Compute stats
  const totalStats = useMemo(() => {
    const count = allUserRecords.length;
    const minutes = allUserRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
    const calories = allUserRecords.reduce((acc, r) => acc + (r.caloriesBurned || 0), 0);
    const avgDuration = count > 0 ? Math.round(minutes / count) : 0;
    return { count, minutes, calories, avgDuration };
  }, [allUserRecords]);

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    let result = [...allUserRecords];

    // Filter by split
    if (splitFilter !== 'all') {
      const filterLower = splitFilter.toLowerCase();
      result = result.filter(
        (r) =>
          r.splitName.toLowerCase().includes(filterLower) ||
          r.splitType?.toLowerCase().includes(filterLower)
      );
    }

    // Search query in notes, split name, or title
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.notes.toLowerCase().includes(q) ||
          r.splitName.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q)
      );
    }

    // Sort by date
    result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [allUserRecords, splitFilter, searchQuery, sortOrder]);

  // Auto-calculate calories based on split, weight, and duration
  const autoCalculatedCalories = useMemo(() => {
    const mins = Number(formDuration);
    if (!mins || mins <= 0 || isNaN(mins)) return 0;
    try {
      const plan = WorkoutPlanFactory.create(formSplit);
      const weight = currentProfile?.weightKg || 70;
      return plan.calculateCalories(weight, mins);
    } catch {
      return Math.round(mins * 7);
    }
  }, [formSplit, formDuration, currentProfile]);

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormSplit('Push');
    setFormDate(getTodayString());
    setFormDuration(45);
    setFormExercisesCompleted(5);
    setFormNotes('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (record: WorkoutRecord) => {
    setEditingRecord(record);
    setFormSplit(record.splitName || record.splitType || 'Push');

    // Extract YYYY-MM-DD from record.date
    let dateStr = getTodayString();
    try {
      dateStr = new Date(record.date).toISOString().split('T')[0];
    } catch {
      dateStr = record.date ? record.date.substring(0, 10) : getTodayString();
    }
    setFormDate(dateStr);
    setFormDuration(record.durationMinutes || 45);
    setFormExercisesCompleted(record.exercisesCompleted ?? 5);
    setFormNotes(record.notes || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const today = getTodayString();

    // Duration validation: must be a positive number
    const durationNum = Number(formDuration);
    if (formDuration === '' || isNaN(durationNum) || durationNum <= 0) {
      errors.duration = 'Duration must be a positive number greater than 0.';
    }

    // Date validation: cannot be in the future
    if (!formDate) {
      errors.date = 'Date cannot be empty.';
    } else if (formDate > today) {
      errors.date = 'Date cannot be in the future.';
    }

    // Exercises completed validation
    if (formExercisesCompleted < 0 || formExercisesCompleted > 5) {
      errors.exercisesCompleted = 'Completed exercises must be between 0 and 5.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Modal (Add / Edit)
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!validateForm()) {
      return;
    }

    const durationMinutes = Math.round(Number(formDuration));
    const caloriesBurned = autoCalculatedCalories;
    const dateIso = new Date(`${formDate}T12:00:00.000Z`).toISOString();

    try {
      if (editingRecord) {
        // UPDATE existing record
        recordManager.update(editingRecord.id, {
          splitName: formSplit,
          splitType: formSplit,
          title: `${formSplit} Session`,
          date: dateIso,
          durationMinutes,
          caloriesBurned,
          exercisesCompleted: formExercisesCompleted,
          totalExercises: 5,
          notes: formNotes.trim(),
        });
        toastSuccess('Workout record updated successfully!');
      } else {
        // CREATE new record
        recordManager.create({
          userId: currentUser.id,
          splitName: formSplit,
          splitType: formSplit,
          title: `${formSplit} Session`,
          date: dateIso,
          durationMinutes,
          caloriesBurned,
          exercisesCompleted: formExercisesCompleted,
          totalExercises: 5,
          notes: formNotes.trim(),
        });
        toastSuccess('Workout record added successfully!');
      }

      setIsModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save workout record.';
      toastError(msg);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    try {
      recordManager.delete(recordToDelete.id);
      toastSuccess('Workout record deleted.');
      setRecordToDelete(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete record.';
      toastError(msg);
    }
  };

  // Format date for table/card display
  const formatDateDisplay = (dateString: string): string => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ================= PAGE HEADER & PRIMARY ACTION ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#24242E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D] shrink-0">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#F4F4F6]">
              Workout History
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Comprehensive workout session logs and performance metrics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-2xl bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0B0B0F] font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF3D]/15 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Record</span>
        </button>
      </div>

      {/* ================= STATS SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
            <Dumbbell className="w-4 h-4 text-[#C6FF3D]" />
            <span>Workouts</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#F4F4F6] tabular-nums">
            {totalStats.count}
          </div>
          <div className="text-[11px] text-[#A1A1AA]">Total sessions logged</div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Total Time</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#F4F4F6] tabular-nums">
            {totalStats.minutes} <span className="text-sm font-sans text-[#A1A1AA]">min</span>
          </div>
          <div className="text-[11px] text-[#A1A1AA]">
            {Math.round(totalStats.minutes / 60)} hours trained
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Calories</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#F4F4F6] tabular-nums">
            {totalStats.calories}{' '}
            <span className="text-sm font-sans text-[#A1A1AA]">kcal</span>
          </div>
          <div className="text-[11px] text-[#A1A1AA]">Total energy burned</div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Avg Session</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#F4F4F6] tabular-nums">
            {totalStats.avgDuration}{' '}
            <span className="text-sm font-sans text-[#A1A1AA]">min</span>
          </div>
          <div className="text-[11px] text-[#A1A1AA]">Average duration</div>
        </div>
      </div>

      {/* ================= CONTROLS: FILTER, SORT & SEARCH ================= */}
      <div className="p-3 sm:p-4 rounded-3xl bg-[#16161D] border border-[#24242E] grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search Input (5 cols) */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes or workout split..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs text-[#F4F4F6] placeholder:text-[#A1A1AA] focus:border-[#C6FF3D] outline-none transition-colors"
          />
        </div>

        {/* Filter by Split (4 cols) */}
        <div className="md:col-span-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#A1A1AA] shrink-0 hidden sm:block" />
          <select
            value={splitFilter}
            onChange={(e) => setSplitFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs text-[#F4F4F6] focus:border-[#C6FF3D] outline-none transition-colors cursor-pointer"
          >
            <option value="all">All Training Splits</option>
            <option value="Push">Push Split</option>
            <option value="Pull">Pull Split</option>
            <option value="Legs">Legs & Core</option>
            <option value="Full Body">Full Body</option>
            <option value="Upper Body">Upper Body</option>
            <option value="Home Bodyweight">Home Bodyweight</option>
            <option value="Cardio HIIT">Cardio HIIT</option>
          </select>
        </div>

        {/* Sort by Date (3 cols) */}
        <div className="md:col-span-3 flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-[#A1A1AA] shrink-0 hidden sm:block" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="w-full px-3 py-2 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs text-[#F4F4F6] focus:border-[#C6FF3D] outline-none transition-colors cursor-pointer"
          >
            <option value="newest">Date: Newest First</option>
            <option value="oldest">Date: Oldest First</option>
          </select>
        </div>
      </div>

      {/* ================= CONTENT: RECORDS TABLE / CARDS / EMPTY STATE ================= */}
      {allUserRecords.length === 0 ? (
        /* Empty State: Zero records in database */
        <div className="p-8 sm:p-12 rounded-3xl bg-[#16161D] border border-[#24242E] text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-[#0B0B0F] border border-[#24242E] text-[#C6FF3D] flex items-center justify-center mx-auto shadow-inner">
            <Dumbbell className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-heading text-2xl font-bold uppercase tracking-wider text-[#F4F4F6]">
              No Workout Records Found
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              You haven't logged any workouts yet. Start your first workout in the Recommender or manually log a past training session.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/recommender')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0B0B0F] font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C6FF3D]/15"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start your first workout</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#24242E] hover:bg-[#2E2E3C] text-[#F4F4F6] font-semibold text-xs transition-colors cursor-pointer"
            >
              + Log Past Session
            </button>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        /* Empty State: Active filters match 0 records */
        <div className="p-8 rounded-3xl bg-[#16161D] border border-[#24242E] text-center space-y-4">
          <p className="text-sm text-[#A1A1AA]">
            No workout records match your current search and filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSplitFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#24242E] hover:bg-[#2E2E3C] text-[#F4F4F6] text-xs font-semibold cursor-pointer transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* ================= DESKTOP TABLE VIEW (hidden md:block) ================= */}
          <div className="hidden md:block rounded-3xl border border-[#24242E] bg-[#16161D] overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#24242E] bg-[#0B0B0F]/60 text-[#A1A1AA] font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5 font-semibold">Date</th>
                  <th className="py-3.5 px-5 font-semibold">Split</th>
                  <th className="py-3.5 px-5 font-semibold">Duration</th>
                  <th className="py-3.5 px-5 font-semibold">Calories</th>
                  <th className="py-3.5 px-5 font-semibold">Completion</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24242E]/60 text-[#F4F4F6]">
                {filteredRecords.map((record) => {
                  const totalEx = record.totalExercises || 5;
                  const completedEx = record.exercisesCompleted ?? 5;
                  const percent = Math.min(100, Math.round((completedEx / totalEx) * 100));

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-[#1a1a24] transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-4 px-5 font-mono text-[#A1A1AA] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#C6FF3D]" />
                          <span>{formatDateDisplay(record.date)}</span>
                        </div>
                      </td>

                      {/* Split Name & Notes Preview */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[#F4F4F6]">{record.splitName}</span>
                          {record.notes && (
                            <span className="text-[11px] text-[#A1A1AA] truncate max-w-xs italic">
                              "{record.notes}"
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-5 font-mono tabular-nums whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{record.durationMinutes} min</span>
                        </div>
                      </td>

                      {/* Calories */}
                      <td className="py-4 px-5 font-mono tabular-nums whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span>{record.caloriesBurned} kcal</span>
                        </div>
                      </td>

                      {/* Completion Percent */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-[#0B0B0F] h-2 rounded-full overflow-hidden border border-[#24242E]">
                            <div
                              className="bg-[#C6FF3D] h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[#A1A1AA]">
                            {percent}% ({completedEx}/{totalEx})
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(record)}
                            className="p-1.5 rounded-xl text-[#A1A1AA] hover:text-[#C6FF3D] hover:bg-[#24242E] transition-colors cursor-pointer"
                            title="Edit Record"
                            aria-label={`Edit ${record.splitName} record`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(record)}
                            className="p-1.5 rounded-xl text-[#A1A1AA] hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Record"
                            aria-label={`Delete ${record.splitName} record`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ================= MOBILE CARD VIEW (md:hidden) ================= */}
          <div className="md:hidden space-y-3">
            {filteredRecords.map((record) => {
              const totalEx = record.totalExercises || 5;
              const completedEx = record.exercisesCompleted ?? 5;
              const percent = Math.min(100, Math.round((completedEx / totalEx) * 100));

              return (
                <div
                  key={record.id}
                  className="p-4 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-3 shadow-lg"
                >
                  {/* Top: Split Pill & Date */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 text-[#C6FF3D] font-mono text-xs font-bold uppercase">
                      {record.splitName}
                    </span>
                    <span className="text-xs font-mono text-[#A1A1AA]">
                      {formatDateDisplay(record.date)}
                    </span>
                  </div>

                  {/* Middle Stats Row */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{record.durationMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>{record.caloriesBurned} kcal</span>
                    </div>
                  </div>

                  {/* Completion Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
                      <span>Completion: {completedEx} of {totalEx} exercises</span>
                      <span className="text-[#C6FF3D] font-bold">{percent}%</span>
                    </div>
                    <div className="w-full bg-[#0B0B0F] h-2 rounded-full overflow-hidden border border-[#24242E]">
                      <div
                        className="bg-[#C6FF3D] h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Notes snippet */}
                  {record.notes && (
                    <div className="text-xs text-[#A1A1AA] italic bg-[#0B0B0F]/40 p-2 rounded-xl border border-[#24242E]/40">
                      "{record.notes}"
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="pt-2 border-t border-[#24242E] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(record)}
                      className="px-3 py-1.5 rounded-xl bg-[#24242E] hover:bg-[#2E2E3C] text-[#F4F4F6] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordToDelete(record)}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ================= ADD / EDIT RECORD MODAL ================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0F]/85 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#16161D] border border-[#24242E] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden space-y-5 p-6 sm:p-7">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#24242E] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D] shrink-0">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-bold uppercase tracking-wider text-[#F4F4F6]">
                    {editingRecord ? 'Edit Workout Record' : 'Add Workout Record'}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    {editingRecord
                      ? 'Update session details and performance metrics.'
                      : 'Log past workout session with automatic calorie calculation.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F6] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRecord} className="space-y-4">
              {/* Split Dropdown */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                  Workout Split
                </label>
                <select
                  value={formSplit}
                  onChange={(e) => setFormSplit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs text-[#F4F4F6] focus:border-[#C6FF3D] outline-none transition-colors cursor-pointer"
                >
                  {SPLIT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Input with Inline Error */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                  Workout Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  max={getTodayString()}
                  onChange={(e) => {
                    setFormDate(e.target.value);
                    if (formErrors.date) {
                      setFormErrors((prev) => ({ ...prev, date: undefined }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-2xl bg-[#0B0B0F] border text-xs text-[#F4F4F6] font-mono outline-none transition-colors ${
                    formErrors.date
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-[#24242E] focus:border-[#C6FF3D]'
                  }`}
                />
                {formErrors.date && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{formErrors.date}</span>
                  </div>
                )}
              </div>

              {/* Duration and Exercises Completed Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Duration in Minutes with Inline Error */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formDuration}
                    onChange={(e) => {
                      setFormDuration(e.target.value);
                      if (formErrors.duration) {
                        setFormErrors((prev) => ({ ...prev, duration: undefined }));
                      }
                    }}
                    placeholder="e.g. 45"
                    className={`w-full px-3.5 py-2.5 rounded-2xl bg-[#0B0B0F] border text-xs text-[#F4F4F6] font-mono outline-none transition-colors ${
                      formErrors.duration
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-[#24242E] focus:border-[#C6FF3D]'
                    }`}
                  />
                  {formErrors.duration && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formErrors.duration}</span>
                    </div>
                  )}
                </div>

                {/* Exercises Completed with Inline Error */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                    Exercises (0 - 5)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="1"
                    value={formExercisesCompleted}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setFormExercisesCompleted(isNaN(val) ? 0 : Math.min(5, Math.max(0, val)));
                      if (formErrors.exercisesCompleted) {
                        setFormErrors((prev) => ({ ...prev, exercisesCompleted: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-2xl bg-[#0B0B0F] border text-xs text-[#F4F4F6] font-mono outline-none transition-colors ${
                      formErrors.exercisesCompleted
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-[#24242E] focus:border-[#C6FF3D]'
                    }`}
                  />
                  {formErrors.exercisesCompleted && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formErrors.exercisesCompleted}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Automatic Calorie Preview Card */}
              <div className="p-3.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-[#A1A1AA]">
                    Auto-Calculated Calories ({currentProfile?.weightKg || 70}kg athlete)
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-[#C6FF3D]">
                  {autoCalculatedCalories} kcal
                </span>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase text-[#A1A1AA]">
                  Workout Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Reflections, weights lifted, physical feedback..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs text-[#F4F4F6] focus:border-[#C6FF3D] outline-none transition-colors resize-none placeholder:text-[#A1A1AA]/50"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-[#24242E] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#24242E] hover:bg-[#2E2E3C] text-[#F4F4F6] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0B0B0F] text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-[#C6FF3D]/15"
                >
                  {editingRecord ? 'Update Record' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      <ConfirmModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Workout Record?"
        description={`Are you sure you want to delete this ${recordToDelete?.splitName} session from ${
          recordToDelete ? formatDateDisplay(recordToDelete.date) : ''
        }? This action will permanently remove the record from your history.`}
        confirmLabel="Delete Record"
        isDestructive={true}
      />
    </div>
  );
}
