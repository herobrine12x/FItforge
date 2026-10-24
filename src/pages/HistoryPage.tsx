import React from 'react';
import { History } from 'lucide-react';

export function HistoryPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 pb-4 border-b border-[#24242E]">
        <div className="w-10 h-10 rounded-2xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D]">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#F4F4F6]">
            History
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Relational workout session logs and record management.
          </p>
        </div>
      </div>
    </div>
  );
}
