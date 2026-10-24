export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'beginner' | 'intermediate' | 'advanced';

export type SplitType = 'push' | 'pull' | 'legs_core' | 'full_body';

export type ExtendedSplitType =
  | SplitType
  | 'Push'
  | 'Pull'
  | 'Legs & Core'
  | 'Full Body'
  | 'Upper Body'
  | 'Home Bodyweight'
  | 'Cardio HIIT'
  | 'upper_body'
  | 'home_bodyweight'
  | 'cardio_hiit';

export type EquipmentType = 'Bodyweight' | 'Dumbbell' | 'Barbell' | 'Machine' | 'Cable';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type Gender = 'male' | 'female' | 'other' | 'Male' | 'Female' | 'Other';

export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';

export interface ExerciseData {
  id: string;
  name: string;
  targetMuscle: string;
  equipment: EquipmentType;
  difficulty: DifficultyLevel;
  imageUrl: string;
  formTip: string;
  sets?: number;
  reps?: number | string;
  restSeconds?: number;
}

export interface ExerciseItem {
  id: string;
  name: string;
  targetMuscle: string;
  sets: number;
  reps: number | string;
  restSeconds: number;
  equipment: EquipmentType | string;
  difficulty?: DifficultyLevel;
  imageUrl?: string;
  formTip?: string;
  secondaryMuscles?: string[];
  defaultSets?: number;
  defaultReps?: number;
  suggestedRestSeconds?: number;
  instructions?: string[];
  tip?: string;
}

export interface ExerciseSet {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  targetWeightKg: number;
  actualWeightKg: number;
  completed: boolean;
}

export interface WorkoutExerciseLog {
  exercise: ExerciseItem;
  sets: ExerciseSet[];
  notes?: string;
}

export interface IUserData {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  email?: string;
  role?: string;
}

export interface IMemberProfileData {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  experienceLevel: ExperienceLevel;
  weeklyGoal: number;
  availableEquipment?: EquipmentType[];
  updatedAt?: string;
  fullName?: string;
  fitnessGoal?: FitnessGoal;
  activityLevel?: ActivityLevel;
  targetWorkoutsPerWeek?: number;
}

export type IUserProfileData = IMemberProfileData;

export interface IWorkoutRecordData {
  id?: string;
  userId: string;
  splitName?: string;
  date: string;
  durationMinutes: number;
  caloriesBurned: number;
  exercisesCompleted?: number;
  totalExercises?: number;
  notes?: string;
  title?: string;
  splitType?: string;
  rating?: number;
  exercises?: WorkoutExerciseLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IReportSummary {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  averageDuration: number;
  mostUsedSplit: string;
  profileName?: string;
  bmi: number;
  healthCategory: string;
  idealWeight: { minKg: number; maxKg: number };
  bmr: number;
  tdee: number;
  dailyWaterLiters: number;
  avgRating: number;
  splitCounts: Record<string, number>;
  totalTonnageKg: number;
  completedSets: number;
  recordsCount: number;
  generatedAt: string;
}

export interface IAppSettings {
  currentUserId: string | null;
  theme: 'dark';
  lastActiveTab?: string;
}
