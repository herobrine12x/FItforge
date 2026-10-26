import React from 'react';
import { Dumbbell, Home, Lock, Sparkles, Wrench } from 'lucide-react';
import { EquipmentType } from '../models/types';
import {
  ALL_EQUIPMENT_OPTIONS,
  EQUIPMENT_PRESETS,
  EquipmentPreset,
  getActivePreset,
} from '../utils/equipment';

interface EquipmentSelectorProps {
  selectedEquipment: EquipmentType[];
  onChange: (newEquipment: EquipmentType[]) => void;
  className?: string;
  compact?: boolean;
}

export const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  selectedEquipment,
  onChange,
  className = '',
  compact = false,
}) => {
  const activePreset = getActivePreset(selectedEquipment);

  const handleApplyPreset = (preset: EquipmentPreset) => {
    onChange([...preset.equipment]);
  };

  const handleToggleOption = (option: EquipmentType) => {
    if (option === 'Bodyweight') {
      // Bodyweight cannot be turned off
      return;
    }

    if (selectedEquipment.includes(option)) {
      const filtered = selectedEquipment.filter((item) => item !== option);
      // Ensure Bodyweight remains
      if (!filtered.includes('Bodyweight')) {
        filtered.unshift('Bodyweight');
      }
      onChange(filtered);
    } else {
      onChange([...selectedEquipment, option]);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 3 Quick Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C6FF3D]" />
            Quick Presets
          </span>
          <span className="text-[11px] font-mono text-[#71717A]">
            One-tap setup
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {EQUIPMENT_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between group ${
                  isActive
                    ? 'bg-[#C6FF3D]/10 border-[#C6FF3D] text-[#F4F4F6] shadow-sm shadow-[#C6FF3D]/10'
                    : 'bg-[#0B0B0F] border-[#24242E] hover:border-[#383848] text-[#A1A1AA] hover:text-[#F4F4F6]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {preset.id === 'full_gym' && <Dumbbell className={`w-3.5 h-3.5 ${isActive ? 'text-[#C6FF3D]' : 'text-[#71717A]'}`} />}
                    {preset.id === 'home_dumbbells' && <Home className={`w-3.5 h-3.5 ${isActive ? 'text-[#C6FF3D]' : 'text-[#71717A]'}`} />}
                    {preset.id === 'no_equipment' && <Wrench className={`w-3.5 h-3.5 ${isActive ? 'text-[#C6FF3D]' : 'text-[#71717A]'}`} />}
                    <span className={`text-xs font-heading font-black uppercase tracking-wider ${isActive ? 'text-[#C6FF3D]' : ''}`}>
                      {preset.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#A1A1AA] line-clamp-1">
                    {preset.description}
                  </p>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                    isActive
                      ? 'border-[#C6FF3D] bg-[#C6FF3D]'
                      : 'border-[#383848] bg-transparent'
                  }`}
                >
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Checkboxes for Individual Equipment */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-1 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
            Available Equipment Checklist
          </span>
          <span className="text-[10px] font-mono text-[#A1A1AA]">
            Bodyweight is always included
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {ALL_EQUIPMENT_OPTIONS.map((option) => {
            const isChecked = selectedEquipment.includes(option);
            const isLocked = option === 'Bodyweight';

            return (
              <label
                key={option}
                className={`relative inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all select-none shrink-0 whitespace-nowrap ${
                  isLocked
                    ? 'bg-[#16161D] border-[#24242E] text-[#F4F4F6] cursor-not-allowed opacity-90'
                    : isChecked
                    ? 'bg-[#C6FF3D]/10 border-[#C6FF3D]/60 text-[#F4F4F6] cursor-pointer'
                    : 'bg-[#0B0B0F] border-[#24242E] text-[#A1A1AA] hover:border-[#383848] hover:text-[#F4F4F6] cursor-pointer'
                }`}
                title={isLocked ? 'Bodyweight is always included and cannot be disabled' : undefined}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isLocked}
                  onChange={() => handleToggleOption(option)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                    isChecked
                      ? 'bg-[#C6FF3D] border-[#C6FF3D] text-[#0B0B0F]'
                      : 'border-[#383848] bg-[#0B0B0F]'
                  }`}
                >
                  {isChecked && (
                    <svg className="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className={isChecked ? 'text-[#F4F4F6]' : 'text-[#A1A1AA]'}>
                  {option}
                </span>

                {isLocked && (
                  <span title="Locked: always active" className="inline-flex items-center shrink-0 ml-0.5">
                    <Lock className="w-3 h-3 text-[#A1A1AA] shrink-0" />
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
