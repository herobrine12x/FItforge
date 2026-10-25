import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldAlert, Sparkles, X, Zap } from 'lucide-react';
import { DeloadManager } from '../models/DeloadManager';
import { useToast } from '../context/ToastContext';

interface DeloadBannerProps {
  consecutiveWeeks: number;
  onDeloadModeToggled?: (active: boolean) => void;
}

export const DeloadBanner: React.FC<DeloadBannerProps> = ({
  consecutiveWeeks,
  onDeloadModeToggled,
}) => {
  const { success: showToastSuccess, info: showToastInfo } = useToast();
  const [isDismissed, setIsDismissed] = useState(() => DeloadManager.isDismissed());
  const [isDeloadActive, setIsDeloadActive] = useState(() => DeloadManager.isDeloadModeActive());

  if (isDismissed) return null;

  const handleDismiss = () => {
    DeloadManager.dismiss();
    setIsDismissed(true);
    showToastInfo('Deload banner dismissed for this week.');
  };

  const handleToggleDeload = () => {
    const nextState = !isDeloadActive;
    DeloadManager.setDeloadModeActive(nextState);
    setIsDeloadActive(nextState);
    if (onDeloadModeToggled) {
      onDeloadModeToggled(nextState);
    }

    if (nextState) {
      showToastSuccess('🛡️ Deload Mode Activated: All guided workouts will prescribe 2 sets and lighter recovery weights.');
    } else {
      showToastInfo('Standard training volume restored.');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#16161D] to-[#16161D] border border-amber-500/30 p-5 shadow-lg shadow-amber-950/20 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Icon & Description */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading text-lg font-bold text-amber-300 tracking-wide uppercase">
                Deload Week Recommended
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {consecutiveWeeks} Consecutive Weeks Trained
              </span>
              {isDeloadActive && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#C6FF3D]/20 text-[#C6FF3D] border border-[#C6FF3D]/40">
                  Deload Active (2 Sets)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
              You have trained hard for 4 consecutive weeks! Strategic deloading reduces central nervous system fatigue and prevents connective tissue injuries. We suggest an easier week: <strong className="text-[#F4F4F6]">2 sets per exercise</strong> with <strong className="text-[#F4F4F6]">50-60% normal working weights</strong>.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center w-full sm:w-auto justify-end">
          <button
            onClick={handleToggleDeload}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isDeloadActive
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-[#C6FF3D] hover:bg-[#b8f52e] text-[#0B0B0F] shadow-sm shadow-[#C6FF3D]/20'
            }`}
          >
            {isDeloadActive ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Deload Plan Active</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Activate Deload Plan (2 Sets)</span>
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#24242E] transition-colors cursor-pointer"
            title="Dismiss suggestion for this week"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
