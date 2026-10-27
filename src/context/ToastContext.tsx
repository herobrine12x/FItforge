import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', durationMs: number = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      if (durationMs > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, durationMs?: number) => showToast(message, 'success', durationMs),
    [showToast]
  );

  const error = useCallback(
    (message: string, durationMs?: number) => showToast(message, 'error', durationMs),
    [showToast]
  );

  const info = useCallback(
    (message: string, durationMs?: number) => showToast(message, 'info', durationMs),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, dismissToast }}>
      {children}
      {/* Toast container floating viewport bottom-right on desktop, top-center on mobile */}
      <div
        className="fixed z-50 pointer-events-none flex flex-col gap-2.5 max-w-sm w-full p-4 
                   bottom-4 right-4 sm:bottom-6 sm:right-6"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
                isSuccess
                  ? 'bg-[#16161D] border-[#C6FF3D]/50 text-[#F4F4F6] shadow-[#C6FF3D]/10'
                  : isError
                  ? 'bg-[#16161D] border-rose-500/60 text-[#F4F4F6] shadow-rose-900/20'
                  : 'bg-[#16161D] border-[#24242E] text-[#F4F4F6]'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#C6FF3D]" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-cyan-400" />}
              </div>

              <div className="flex-1 text-sm font-medium leading-snug break-words">
                {toast.message}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-slate-700 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F6] transition-colors rounded-lg cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
