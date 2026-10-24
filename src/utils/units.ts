/**
 * FitForge Unit Conversion and Date Utilities
 */

export const KG_TO_LBS = 2.20462262185;
export const CM_TO_INCH = 0.393700787;

/**
 * Converts kilograms to pounds, rounded to 1 decimal place.
 */
export function kgToLb(kg: number): number {
  if (kg <= 0) return 0;
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

/**
 * Converts pounds to kilograms, rounded to 1 decimal place.
 */
export function lbToKg(lb: number): number {
  if (lb <= 0) return 0;
  return Math.round((lb / KG_TO_LBS) * 10) / 10;
}

/**
 * Converts centimeters to feet and inches.
 */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  if (cm <= 0) return { feet: 0, inches: 0 };
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  // Handle case where inches round to 12
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

/**
 * Converts feet and inches to centimeters, rounded to 1 decimal place.
 */
export function ftInToCm(feet: number, inches: number): number {
  const totalInches = (feet || 0) * 12 + (inches || 0);
  return Math.round(totalInches * 2.54 * 10) / 10;
}

/**
 * Formats weight string based on unit preference.
 */
export function formatWeight(kg: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    return `${kgToLb(kg)} lb`;
  }
  return `${kg} kg`;
}

/**
 * Formats height string based on unit preference.
 */
export function formatHeight(cm: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const { feet, inches } = cmToFtIn(cm);
    return `${feet} ft ${inches} in`;
  }
  return `${cm} cm`;
}

/**
 * Returns the start (Monday 00:00:00) and end (Sunday 23:59:59) of the current week.
 */
export function getWeekDates(referenceDate: Date = new Date()): { startOfWeek: Date; endOfWeek: Date } {
  const date = new Date(referenceDate);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday
  // Distance to Monday: if Sunday (0), Monday was 6 days ago (-6), otherwise 1 - day
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
}

/**
 * Formats full current date nicely (e.g., "Saturday, October 24, 2026").
 */
export function formatDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
