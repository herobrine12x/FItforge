/**
 * OOP Principle: Single Responsibility & Abstraction
 * BMICalculator abstracts biometric health formulas into a single cohesive utility.
 * Calculates Body Mass Index (BMI = kg / m^2) and classifies individuals according
 * to standard health categories:
 * - Underweight: < 18.5
 * - Normal: 18.5 - 24.9
 * - Overweight: 25.0 - 29.9
 * - Obese: >= 30.0
 */
export class BMICalculator {
  /**
   * Calculates BMI value rounded to 1 decimal place.
   * Throws Error if inputs are non-positive.
   */
  public static calculate(weightKg: number, heightCm: number): number {
    if (typeof weightKg !== 'number' || isNaN(weightKg) || weightKg <= 0) {
      throw new Error('Weight must be a positive number.');
    }
    if (typeof heightCm !== 'number' || isNaN(heightCm) || heightCm <= 0) {
      throw new Error('Height must be a positive number.');
    }

    const heightMeters = heightCm / 100;
    const bmi = weightKg / (heightMeters * heightMeters);
    return Math.round(bmi * 10) / 10;
  }

  /**
   * Classifies a BMI score into its diagnostic health category.
   */
  public static classify(bmi: number): 'Underweight' | 'Normal' | 'Overweight' | 'Obese' {
    if (typeof bmi !== 'number' || isNaN(bmi) || bmi <= 0) {
      throw new Error('BMI value must be a positive number.');
    }

    if (bmi < 18.5) {
      return 'Underweight';
    }
    if (bmi <= 24.9) {
      return 'Normal';
    }
    if (bmi <= 29.9) {
      return 'Overweight';
    }
    return 'Obese';
  }

  /**
   * Helper: Calculates ideal weight range (kg) for normal BMI (18.5 - 24.9).
   */
  public static getIdealWeightRange(heightCm: number): { minKg: number; maxKg: number } {
    if (heightCm <= 0) throw new Error('Height must be a positive number.');
    const heightMeters = heightCm / 100;
    const minKg = 18.5 * (heightMeters * heightMeters);
    const maxKg = 24.9 * (heightMeters * heightMeters);
    return {
      minKg: Math.round(minKg * 10) / 10,
      maxKg: Math.round(maxKg * 10) / 10,
    };
  }

  // Instance method wrappers for convenience
  public calculate(weightKg: number, heightCm: number): number {
    return BMICalculator.calculate(weightKg, heightCm);
  }

  public classify(bmi: number): 'Underweight' | 'Normal' | 'Overweight' | 'Obese' {
    return BMICalculator.classify(bmi);
  }
}
