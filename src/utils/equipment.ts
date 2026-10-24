import { EquipmentType } from '../models/types';

export const ALL_EQUIPMENT_OPTIONS: EquipmentType[] = [
  'Bodyweight',
  'Dumbbell',
  'Barbell',
  'Machine',
  'Cable',
];

export interface EquipmentPreset {
  id: 'full_gym' | 'home_dumbbells' | 'no_equipment';
  label: string;
  description: string;
  equipment: EquipmentType[];
}

export const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  {
    id: 'full_gym',
    label: 'Full gym',
    description: 'All equipment (Gym setup)',
    equipment: ['Bodyweight', 'Dumbbell', 'Barbell', 'Machine', 'Cable'],
  },
  {
    id: 'home_dumbbells',
    label: 'Home with dumbbells',
    description: 'Bodyweight + Dumbbells',
    equipment: ['Bodyweight', 'Dumbbell'],
  },
  {
    id: 'no_equipment',
    label: 'No equipment',
    description: 'Bodyweight only',
    equipment: ['Bodyweight'],
  },
];

export function getActivePreset(
  equipment: EquipmentType[]
): 'full_gym' | 'home_dumbbells' | 'no_equipment' | 'custom' {
  const set = new Set(equipment);
  if (set.size === 5) return 'full_gym';
  if (set.size === 2 && set.has('Bodyweight') && set.has('Dumbbell')) return 'home_dumbbells';
  if (set.size === 1 && set.has('Bodyweight')) return 'no_equipment';
  return 'custom';
}
