import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { WorkoutRecord } from '../models/WorkoutRecord';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: WorkoutRecord | null;
  onConfirm: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  record,
  onConfirm,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-sm shadow-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-red-950/40 border border-red-800/80 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Delete Workout Record</h3>
            <p className="text-[11px] font-mono text-gray-400">RecordManager.deleteRecord()</p>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          Are you sure you want to delete <strong className="text-white">"{record.title}"</strong> ({new Date(record.date).toLocaleDateString()})? This action removes the session permanently.
        </p>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(record.id);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
