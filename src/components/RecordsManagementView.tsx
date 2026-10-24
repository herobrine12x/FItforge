import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Database,
  Edit2,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { RecordManager } from '../models/RecordManager';
import { SplitType, WorkoutExerciseLog } from '../models/types';
import { User } from '../models/User';
import { WorkoutRecord } from '../models/WorkoutRecord';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { RecordDetailModal } from './RecordDetailModal';
import { RecordModal } from './RecordModal';

interface RecordsManagementViewProps {
  currentUser: User | null;
  recordManager: RecordManager;
  onRefresh: () => void;
}

export const RecordsManagementView: React.FC<RecordsManagementViewProps> = ({
  currentUser,
  recordManager,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [splitFilter, setSplitFilter] = useState<SplitType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'calories_desc' | 'duration_desc'>('date_desc');

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WorkoutRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<WorkoutRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<WorkoutRecord | null>(null);

  if (!currentUser) return null;

  let records = recordManager.searchAndFilter(currentUser.id, searchQuery, splitFilter);

  records.sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'calories_desc':
        return b.caloriesBurned - a.caloriesBurned;
      case 'duration_desc':
        return b.durationMinutes - a.durationMinutes;
      case 'date_desc':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const handleSaveRecord = (data: {
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
  }) => {
    if (data.id) {
      recordManager.updateRecord(data.id, data);
    } else {
      recordManager.addRecord(data);
    }
    onRefresh();
  };

  const handleDeleteRecord = (id: string) => {
    recordManager.deleteRecord(id);
    onRefresh();
  };

  const stats = recordManager.getStats(currentUser.id);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            Relational Persistence · RecordManager Module
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Workout Records (CRUD)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Direct Create, Read, Update, and Delete operations on member fitness session histories.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setIsRecordModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Workout (Create)</span>
        </button>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-gray-800 rounded-lg bg-gray-900/40 p-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, exercise, or notes..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <select
            value={splitFilter}
            onChange={(e) => setSplitFilter(e.target.value as SplitType | 'all')}
            className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Training Splits</option>
            <option value="push">Push Split Only</option>
            <option value="pull">Pull Split Only</option>
            <option value="legs_core">Legs & Core Only</option>
            <option value="full_body">Full Body Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400 shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as
                  | 'date_desc'
                  | 'date_asc'
                  | 'calories_desc'
                  | 'duration_desc'
              )
            }
            className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="date_desc">Date (Newest First)</option>
            <option value="date_asc">Date (Oldest First)</option>
            <option value="calories_desc">Highest Calories Burned</option>
            <option value="duration_desc">Longest Duration</option>
          </select>
        </div>
      </div>

      {/* Relational Table */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-950/60 flex items-center justify-between text-xs">
          <span className="font-mono font-semibold uppercase tracking-wider text-gray-300">
            Database Session Records ({records.length})
          </span>
          <span className="font-mono text-gray-400">
            Total Logged: <strong className="text-white">{stats.totalWorkouts} sessions</strong>
          </span>
        </div>

        {records.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500 space-y-2">
            <div>No matching workout records in database.</div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSplitFilter('all');
              }}
              className="px-2.5 py-1 rounded bg-gray-800 text-gray-300 text-xs hover:text-white cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-800 bg-gray-950/40 text-gray-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Session Title</th>
                  <th className="py-2.5 px-4 font-medium">Split</th>
                  <th className="py-2.5 px-4 font-medium">Duration</th>
                  <th className="py-2.5 px-4 font-medium">Calories</th>
                  <th className="py-2.5 px-4 font-medium">Volume / Sets</th>
                  <th className="py-2.5 px-4 font-medium">Rating</th>
                  <th className="py-2.5 px-4 font-medium text-right">CRUD Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-gray-300">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-400 whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{r.title}</div>
                      {r.notes && (
                        <div className="text-[11px] text-gray-400 truncate max-w-xs">{r.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-[11px] text-emerald-400 whitespace-nowrap">
                      [{r.splitType.replace('_', ' ')}]
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                      {r.durationMinutes} min
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap text-gray-200">
                      {r.caloriesBurned} kcal
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-white">{r.completedSetsCount} sets</span>
                      {r.totalTonnageKg > 0 && (
                        <span className="text-[10px] font-mono text-gray-400 block">
                          {Math.round(r.totalTonnageKg)} kg tonnage
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 whitespace-nowrap">
                      {'★'.repeat(r.rating)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setViewingRecord(r)}
                          className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                          title="View exercise sets"
                          aria-label="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRecord(r);
                            setIsRecordModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Edit session (Update)"
                          aria-label="Edit Session"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingRecord(r)}
                          className="p-1 rounded hover:bg-red-950/60 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete session (Delete)"
                          aria-label="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
        }}
        recordToEdit={editingRecord}
        userId={currentUser.id}
        onSave={handleSaveRecord}
      />

      <RecordDetailModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
        onEdit={(rec) => {
          setEditingRecord(rec);
          setIsRecordModalOpen(true);
        }}
      />

      <DeleteConfirmModal
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        record={deletingRecord}
        onConfirm={handleDeleteRecord}
      />
    </div>
  );
};
