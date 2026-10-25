export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'beginner' | 'intermediate' | 'advanced';

export type SplitType = 'push' | 'pull' | 'legs_core' | 'full_body' | 'walk';

export type ExtendedSplitType =
  | SplitType
  | 'Push'
  | 'Pull'
  | 'Legs & Core'
  | 'Full Body'
  | 'Upper Body'
  | 'Home Bodyweight'
  | 'Cardio HIIT'
  | 'Walk'
  | 'upper_body'
  | 'home_bodyweight'
  | 'cardio_hiit'
  | 'walk';

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

export type ScheduleRepeat = 'never' | 'weekly' | 'biweekly';
export type ScheduleStatus = 'planned' | 'done' | 'skipped' | 'missed';

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface IScheduledWorkoutData {
  id: string;
  userId: string;
  routineId: string;
  routineName?: string;
  targetMuscle?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  repeat: ScheduleRepeat;
  status: ScheduleStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICustomRoutineData {
  id: string;
  userId: string;
  name: string;
  targetMuscle: string;
  splitType?: string;
  exercises: ExerciseItem[];
  notes?: string;
  createdAt?: string;
}

export interface IWeeklyDaySchedule {
  day: WeekdayKey;
  isTrainingDay: boolean;
  routineId: string; // split key or custom routine id or 'rest'
  routineName: string;
  targetMuscle: string;
  estimatedMinutes?: number;
}

export interface IWeeklyScheduleData {
  userId: string;
  selectedDays: WeekdayKey[];
  days: Record<WeekdayKey, IWeeklyDaySchedule>;
  updatedAt?: string;
}

export interface IBadgeData {
  id: string;
  userId: string;
  unlockedAt: string;
}

export interface IBadgeDefinition {
  id: string;
  title: string;
  description: string;
  iconName: string;
  requirement: string;
}

export interface IWeeklySummaryMetrics {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  workoutsDone: number;
  totalMinutes: number;
  totalCalories: number;
  currentStreak: number;
  bestStreak: number;
  weeklyGoal: number;
  goalProgressPercent: number;
  bestDay: {
    date: string;
    dayName: string;
    caloriesBurned: number;
    durationMinutes: number;
    splitName: string;
  } | null;
  whatToAimForNextWeek: string;
}

export interface ISetLogData {
  id: string;
  userId: string;
  recordId: string;
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  targetReps?: number;
  targetWeightKg?: number;
  date?: string;
  createdAt?: string;
}

export interface IBodyWeightEntry {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
  notes?: string;
  createdAt?: string;
}

export interface IPersonalRecordData {
  exerciseName: string;
  bestWeightKg: number;
  bestWeightReps: number;
  bestWeightDate: string;
  bestEstimatedOneRepMaxKg: number;
  bestEstimated1RMReps: number;
  bestEstimated1RMWeightKg: number;
  bestEstimated1RMDate: string;
  totalSetsCompleted?: number;
  lastLoggedDate?: string;
}

export interface IProgressiveOverloadHint {
  exerciseName: string;
  hasHistory: boolean;
  lastWeightKg?: number;
  lastReps?: number;
  lastTargetReps?: number;
  allTargetRepsHit?: boolean;
  suggestedWeightKg?: number;
  suggestedReps?: number;
  message: string;
  badgeText?: string;
}

