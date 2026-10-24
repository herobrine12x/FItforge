import { ExperienceLevel, FitnessGoal, ActivityLevel, IMemberProfileData, EquipmentType } from './types';

/**
 * OOP Principle: Encapsulation
 * MemberProfile encapsulates personal biometrics and fitness targets using private fields.
 * Getters and setters strictly enforce domain boundaries, rejecting non-positive numbers
 * and out-of-range physiological values (height 50-250 cm, weight 20-300 kg, age 10-100).
 */
export class MemberProfile {
  private _id: string;
  private _userId: string;
  private _name!: string;
  private _age!: number;
  private _gender!: string;
  private _heightCm!: number;
  private _weightKg!: number;
  private _experienceLevel!: ExperienceLevel;
  private _weeklyGoal!: number;
  private _availableEquipment!: EquipmentType[];
  private _updatedAt: string;

  constructor(data: IMemberProfileData) {
    this._id = data.id || `prof_${Date.now()}`;
    this._userId = data.userId;
    this._updatedAt = data.updatedAt || new Date().toISOString();

    // Use setters to guarantee invariant checks
    this.name = data.name || data.fullName || 'Member';
    this.age = data.age;
    this.gender = data.gender;
    this.heightCm = data.heightCm;
    this.weightKg = data.weightKg;
    this.experienceLevel = data.experienceLevel;
    this.weeklyGoal = data.weeklyGoal || data.targetWorkoutsPerWeek || 3;
    this.availableEquipment = data.availableEquipment || [
      'Bodyweight',
      'Dumbbell',
      'Barbell',
      'Machine',
      'Cable',
    ];
  }

  // ID and foreign key userId
  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get updatedAt(): string {
    return this._updatedAt;
  }

  // Name: non-empty string
  public get name(): string {
    return this._name;
  }

  public set name(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Name cannot be empty.');
    }
    this._name = value.trim();
    this.touch();
  }

  // Compatibility alias for existing components
  public get fullName(): string {
    return this._name;
  }

  public set fullName(value: string) {
    this.name = value;
  }

  // Age: non-positive rejected, range 10-100
  public get age(): number {
    return this._age;
  }

  public set age(value: number) {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      throw new Error('Age must be a positive number.');
    }
    if (value < 10 || value > 100) {
      throw new Error('Age must be between 10 and 100 years.');
    }
    this._age = Math.round(value);
    this.touch();
  }

  // Gender: string
  public get gender(): any {
    return this._gender;
  }

  public set gender(value: any) {
    if (!value || String(value).trim().length === 0) {
      throw new Error('Gender cannot be empty.');
    }
    this._gender = String(value).trim();
    this.touch();
  }

  // Height (cm): non-positive rejected, range 50-250
  public get heightCm(): number {
    return this._heightCm;
  }

  public set heightCm(value: number) {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      throw new Error('Height must be a positive number.');
    }
    if (value < 50 || value > 250) {
      throw new Error('Height must be between 50 and 250 cm.');
    }
    this._heightCm = Math.round(value * 10) / 10;
    this.touch();
  }

  // Weight (kg): non-positive rejected, range 20-300
  public get weightKg(): number {
    return this._weightKg;
  }

  public set weightKg(value: number) {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      throw new Error('Weight must be a positive number.');
    }
    if (value < 20 || value > 300) {
      throw new Error('Weight must be between 20 and 300 kg.');
    }
    this._weightKg = Math.round(value * 10) / 10;
    this.touch();
  }

  // Experience level: Beginner, Intermediate, Advanced
  public get experienceLevel(): any {
    return this._experienceLevel;
  }

  public set experienceLevel(value: any) {
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    const match = validLevels.find((lvl) => lvl.toLowerCase() === String(value).toLowerCase());
    if (!match) {
      throw new Error('Experience level must be Beginner, Intermediate, or Advanced.');
    }
    this._experienceLevel = match as ExperienceLevel;
    this.touch();
  }

  // Weekly Goal: positive number (e.g. 1-7 workouts/week)
  public get weeklyGoal(): number {
    return this._weeklyGoal;
  }

  public set weeklyGoal(value: number) {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      throw new Error('Weekly goal must be a positive number.');
    }
    if (value < 1 || value > 14) {
      throw new Error('Weekly goal must be between 1 and 14 workouts.');
    }
    this._weeklyGoal = Math.round(value);
    this.touch();
  }

  // Available Equipment: encapsulated getter and setter
  // Options: Bodyweight, Dumbbell, Barbell, Machine, Cable. Bodyweight cannot be turned off. Default: all options.
  public get availableEquipment(): EquipmentType[] {
    return this._availableEquipment;
  }

  public set availableEquipment(value: EquipmentType[] | undefined | null) {
    const ALL_EQUIPMENT: EquipmentType[] = ['Bodyweight', 'Dumbbell', 'Barbell', 'Machine', 'Cable'];
    if (!Array.isArray(value) || value.length === 0) {
      this._availableEquipment = [...ALL_EQUIPMENT];
      this.touch();
      return;
    }
    const filtered = value.filter((eq) => ALL_EQUIPMENT.includes(eq as EquipmentType));
    // Bodyweight is always included and cannot be turned off
    if (!filtered.includes('Bodyweight')) {
      filtered.unshift('Bodyweight');
    }
    const unique = Array.from(new Set(filtered));
    this._availableEquipment = unique.length > 0 ? unique : [...ALL_EQUIPMENT];
    this.touch();
  }

  public getCalculator(): {
    calculateBMI: () => number;
    getHealthCategory: () => string;
    getIdealWeightRange: () => { minKg: number; maxKg: number };
    calculateBMR: () => number;
    calculateTDEE: () => number;
    calculateDailyWaterLiters: () => number;
    getHealthAdvice: () => { tone: 'emerald' | 'amber' | 'rose' | 'blue'; summary: string; recommendation: string };
  } {
    const h = this._heightCm;
    const w = this._weightKg;
    const heightM = h / 100;
    const bmiVal = Math.round((w / (heightM * heightM)) * 10) / 10;
    return {
      calculateBMI: () => bmiVal,
      getHealthCategory: () => (bmiVal < 18.5 ? 'Underweight' : bmiVal <= 24.9 ? 'Normal weight' : bmiVal <= 29.9 ? 'Overweight' : 'Obese'),
      getIdealWeightRange: () => ({ minKg: Math.round(18.5 * heightM * heightM * 10) / 10, maxKg: Math.round(24.9 * heightM * heightM * 10) / 10 }),
      calculateBMR: () => Math.round(10 * w + 6.25 * h - 5 * this._age + 5),
      calculateTDEE: () => Math.round((10 * w + 6.25 * h - 5 * this._age + 5) * 1.55),
      calculateDailyWaterLiters: () => Math.round(((w * 35) / 1000) * 10) / 10,
      getHealthAdvice: () => ({
        tone: bmiVal < 18.5 ? 'blue' : bmiVal <= 24.9 ? 'emerald' : bmiVal <= 29.9 ? 'amber' : 'rose',
        summary: 'Biometrics recorded successfully.',
        recommendation: 'Maintain consistent progression and balanced nutrition.',
      }),
    };
  }

  // Compatibility aliases
  public get targetWorkoutsPerWeek(): number {
    return this._weeklyGoal;
  }

  public set targetWorkoutsPerWeek(val: number) {
    this.weeklyGoal = val;
  }

  public get fitnessGoal(): FitnessGoal {
    return 'muscle_gain';
  }

  public get activityLevel(): ActivityLevel {
    return 'moderate';
  }

  private touch(): void {
    this._updatedAt = new Date().toISOString();
  }

  public toJSON(): IMemberProfileData {
    return {
      id: this._id,
      userId: this._userId,
      name: this._name,
      fullName: this._name,
      age: this._age,
      gender: this._gender,
      heightCm: this._heightCm,
      weightKg: this._weightKg,
      experienceLevel: this._experienceLevel,
      weeklyGoal: this._weeklyGoal,
      targetWorkoutsPerWeek: this._weeklyGoal,
      availableEquipment: this.availableEquipment,
      fitnessGoal: 'muscle_gain',
      activityLevel: 'moderate',
      updatedAt: this._updatedAt,
    };
  }

  public static fromJSON(data: IMemberProfileData): MemberProfile {
    return new MemberProfile(data);
  }
}
