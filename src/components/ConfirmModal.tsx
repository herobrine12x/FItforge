import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  requireMatchText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Delete',
  isDestructive = true,
  requireMatchText,
}: ConfirmModalProps) {
  const [matchInput, setMatchInput] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setMatchInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatchValid = !requireMatchText || matchInput.trim().toLowerCase() === requireMatchText.toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#0B0B0F]/85 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isDestructive
                  ? 'bg-rose-100 border-rose-300 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800/80 dark:text-rose-400'
                  : 'bg-amber-100 border-amber-300 text-amber-600 dark:bg-yellow-950/40 dark:border-yellow-800/80 dark:text-yellow-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="confirm-modal-title" className="text-base font-bold text-slate-900 dark:text-[#F4F4F6]">
                {title}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-[#A1A1AA]">Irreversible Action</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] hover:bg-slate-100 dark:hover:bg-[#24242E] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-[#A1A1AA] leading-relaxed">
          {description}
        </p>

        {requireMatchText && (
          <div className="space-y-1.5 pt-1">
            <label htmlFor="confirm-match-input" className="text-[11px] text-slate-600 dark:text-[#A1A1AA]">
              Type <strong className="text-rose-600 dark:text-rose-400 font-mono">{requireMatchText}</strong> to confirm:
            </label>
            <input
              id="confirm-match-input"
              type="text"
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              placeholder={requireMatchText}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] focus:border-rose-500 text-sm text-slate-900 dark:text-[#F4F4F6] font-mono outline-none transition-colors"
            />
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-[#24242E]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#24242E] hover:bg-slate-300 dark:hover:bg-[#2E2E3C] text-slate-800 dark:text-[#F4F4F6] text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isMatchValid}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
