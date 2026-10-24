import React from 'react';
import { Dumbbell, X } from 'lucide-react';
import { WorkoutRecord } from '../models/WorkoutRecord';

interface RecordDetailModalProps {
  record: WorkoutRecord | null;
  onClose: () => void;
  onEdit: (record: WorkoutRecord) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onEdit,
}) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-950/40">
          <div>
            <div className="text-[11px] font-mono text-emerald-400 uppercase">
              [{record.splitType.replace('_', ' ').toUpperCase()}] · {new Date(record.date).toLocaleDateString()}
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">{record.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-4 gap-2 text-center border border-gray-800 p-2.5 rounded bg-gray-950/50 font-mono">
            <div>
              <span className="text-[10px] text-gray-400 uppercase block">Duration</span>
              <span className="text-xs font-bold text-white">{record.durationMinutes}m</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase block">Calories</span>
              <span className="text-xs font-bold text-white">{record.caloriesBurned}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase block">Tonnage</span>
              <span className="text-xs font-bold text-emerald-400">
                {Math.round(record.totalTonnageKg)}kg
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase block">Rating</span>
              <span className="text-xs font-bold text-amber-400">{'★'.repeat(record.rating)}</span>
            </div>
          </div>

          {record.notes && (
            <div className="p-3 rounded border border-gray-800 bg-gray-950/30 text-xs">
              <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
                Athlete Notes:
              </span>
              <p className="text-gray-300 leading-relaxed">{record.notes}</p>
            </div>
          )}

          <div>
            <div className="text-[10px] font-mono uppercase text-gray-400 mb-2">
              Logged Exercise Sets ({record.exercises.length})
            </div>

            {record.exercises.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No exercise sets logged.</p>
            ) : (
              <div className="space-y-2">
                {record.exercises.map((exLog, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded border border-gray-800 bg-gray-950/40 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {idx + 1}. {exLog.exercise.name}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400">
                        {exLog.exercise.targetMuscle}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[11px]">
                      {exLog.sets.map((set) => (
                        <div
                          key={set.setNumber}
                          className={`p-1.5 rounded border ${
                            set.completed
                              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                              : 'border-gray-800 bg-gray-900 text-gray-400'
                          }`}
                        >
                          <div className="text-[10px] text-gray-400">Set {set.setNumber}</div>
                          <div>
                            {set.actualWeightKg}kg × {set.actualReps}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between bg-gray-950/40">
          <span className="text-[10px] font-mono text-gray-500">ID: {record.id}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
