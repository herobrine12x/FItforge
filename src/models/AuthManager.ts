import { MemberProfile } from './MemberProfile';
import { StorageLayer, STORAGE_KEYS } from './storage';
import { IMemberProfileData, IUserData, IWorkoutRecordData } from './types';
import { User } from './User';

/**
 * Simple deterministic hashing function.
 * Avoids storing plaintext passwords in localStorage while remaining lightweight and pure.
 */
export function simpleHash(password: string): string {
  if (!password) return '';
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}_${password.length * 37}`;
}

export const DEMO_USER_ID = 'user_demo_01';
export const DEMO_USERNAME = 'demo';
export const DEMO_PASSWORD = 'demo123';

const DEMO_SEED_USER: IUserData = {
  id: DEMO_USER_ID,
  username: DEMO_USERNAME,
  passwordHash: simpleHash(DEMO_PASSWORD),
  createdAt: '2026-10-10T08:00:00.000Z',
};

const DEMO_SEED_PROFILE: IMemberProfileData = {
  id: 'prof_demo_01',
  userId: DEMO_USER_ID,
  name: 'Kent Malo',
  age: 24,
  gender: 'Male',
  heightCm: 175,
  weightKg: 72,
  experienceLevel: 'Intermediate',
  weeklyGoal: 4,
  updatedAt: '2026-10-23T12:00:00.000Z',
};

const DEMO_SEED_RECORDS: IWorkoutRecordData[] = [
  {
    id: 'rec_seed_01',
    userId: DEMO_USER_ID,
    splitName: 'Push',
    date: '2026-10-24T09:30:00.000Z',
    durationMinutes: 52,
    caloriesBurned: 420,
    exercisesCompleted: 5,
    totalExercises: 5,
    notes: 'Bench press felt explosive. Pushed 75kg for 4 sets of 10. Triceps pumped.',
    createdAt: '2026-10-24T10:30:00.000Z',
    updatedAt: '2026-10-24T10:30:00.000Z',
  },
  {
    id: 'rec_seed_02',
    userId: DEMO_USER_ID,
    splitName: 'Pull',
    date: '2026-10-23T17:15:00.000Z',
    durationMinutes: 48,
    caloriesBurned: 380,
    exercisesCompleted: 5,
    totalExercises: 5,
    notes: 'Focused on bent-over rows and lat squeeze. Good mind-muscle connection.',
    createdAt: '2026-10-23T18:10:00.000Z',
    updatedAt: '2026-10-23T18:10:00.000Z',
  },
  {
    id: 'rec_seed_03',
    userId: DEMO_USER_ID,
    splitName: 'Legs & Core',
    date: '2026-10-21T18:00:00.000Z',
    durationMinutes: 58,
    caloriesBurned: 520,
    exercisesCompleted: 5,
    totalExercises: 5,
    notes: 'Heavy squat session. Hit 95kg for reps. Finished with hanging leg raises.',
    createdAt: '2026-10-21T19:05:00.000Z',
    updatedAt: '2026-10-21T19:05:00.000Z',
  },
  {
    id: 'rec_seed_04',
    userId: DEMO_USER_ID,
    splitName: 'Push',
    date: '2026-10-19T16:45:00.000Z',
    durationMinutes: 45,
    caloriesBurned: 360,
    exercisesCompleted: 4,
    totalExercises: 5,
    notes: 'Incline dumbbell presses went up smoothly. Skipped lateral raises due to time.',
    createdAt: '2026-10-19T17:35:00.000Z',
    updatedAt: '2026-10-19T17:35:00.000Z',
  },
  {
    id: 'rec_seed_05',
    userId: DEMO_USER_ID,
    splitName: 'Pull',
    date: '2026-10-17T10:00:00.000Z',
    durationMinutes: 50,
    caloriesBurned: 400,
    exercisesCompleted: 5,
    totalExercises: 5,
    notes: 'Lat pulldowns and heavy barbell curls. Rest intervals timed strictly to 75s.',
    createdAt: '2026-10-17T11:00:00.000Z',
    updatedAt: '2026-10-17T11:00:00.000Z',
  },
  {
    id: 'rec_seed_06',
    userId: DEMO_USER_ID,
    splitName: 'Full Body',
    date: '2026-10-15T18:30:00.000Z',
    durationMinutes: 55,
    caloriesBurned: 460,
    exercisesCompleted: 5,
    totalExercises: 5,
    notes: 'Full body circuit. High heart rate throughout, squats into bench into rows.',
    createdAt: '2026-10-15T19:30:00.000Z',
    updatedAt: '2026-10-15T19:30:00.000Z',
  },
  {
    id: 'rec_seed_07',
    userId: DEMO_USER_ID,
    splitName: 'Legs & Core',
    date: '2026-10-13T17:00:00.000Z',
    durationMinutes: 54,
    caloriesBurned: 480,
    exercisesCompleted: 5,
    totalExercises: 5,
    notes: 'Romanian deadlifts stretched hamstrings well. Form felt solid.',
    createdAt: '2026-10-13T18:00:00.000Z',
    updatedAt: '2026-10-13T18:00:00.000Z',
  },
  {
    id: 'rec_seed_08',
    userId: DEMO_USER_ID,
    splitName: 'Push',
    date: '2026-10-11T09:00:00.000Z',
    durationMinutes: 44,
    caloriesBurned: 350,
    exercisesCompleted: 5,
    totalExercises: 5,
    notes: 'Deload week start. Controlled eccentric tempo on overhead press.',
    createdAt: '2026-10-11T09:50:00.000Z',
    updatedAt: '2026-10-11T09:50:00.000Z',
  },
];

/**
 * OOP Principle: Encapsulation & Separation of Concerns
 * AuthManager coordinates authentication, credential hashing, and user profile
 * management while delegating persistent table storage to StorageLayer.
 */
export class AuthManager {
  constructor() {
    this.ensureSeedData();
  }

  /**
   * Automatically seeds demo account (demo / demo123) and sample records
   * if not already initialized.
   */
  public ensureSeedData(force: boolean = false): void {
    try {
      const users = StorageLayer.getTable<IUserData>(STORAGE_KEYS.USERS);
      const profiles = StorageLayer.getTable<IMemberProfileData>(STORAGE_KEYS.PROFILES);
      const records = StorageLayer.getTable<IWorkoutRecordData>(STORAGE_KEYS.WORKOUT_RECORDS);

      const hasDemoUser = users.some((u) => u.username.toLowerCase() === DEMO_USERNAME);

      if (force || !hasDemoUser) {
        const filteredUsers = users.filter((u) => u.id !== DEMO_USER_ID);
        filteredUsers.push(DEMO_SEED_USER);
        StorageLayer.saveTable(STORAGE_KEYS.USERS, filteredUsers);

        const filteredProfiles = profiles.filter((p) => p.userId !== DEMO_USER_ID);
        filteredProfiles.push(DEMO_SEED_PROFILE);
        StorageLayer.saveTable(STORAGE_KEYS.PROFILES, filteredProfiles);

        const otherRecords = records.filter((r) => r.userId !== DEMO_USER_ID);
        const combinedRecords = [...DEMO_SEED_RECORDS, ...otherRecords];
        StorageLayer.saveTable(STORAGE_KEYS.WORKOUT_RECORDS, combinedRecords);

        // Default session points to demo user
        const settings = StorageLayer.getSettings({ currentUserId: DEMO_USER_ID, theme: 'dark' as const });
        if (!settings.currentUserId) {
          settings.currentUserId = DEMO_USER_ID;
          StorageLayer.saveSettings(settings);
        }
      }
    } catch (error) {
      console.warn('[AuthManager] ensureSeedData failed:', error);
    }
  }

  /**
   * Registers a new user. Rejects empty fields and duplicate usernames.
   */
  public register(
    username: string,
    password: string,
    name?: string,
    gender: string = 'Male',
    heightCm: number = 175,
    weightKg: number = 70,
    experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner',
    weeklyGoal: number = 3
  ): { success: boolean; message: string; user?: User; profile?: MemberProfile } {
    try {
      const cleanUsername = (username || '').trim();
      const cleanPassword = (password || '').trim();

      if (!cleanUsername) {
        return { success: false, message: 'Username cannot be empty.' };
      }
      if (!cleanPassword) {
        return { success: false, message: 'Password cannot be empty.' };
      }
      if (cleanPassword.length < 4) {
        return { success: false, message: 'Password must be at least 4 characters long.' };
      }

      const users = StorageLayer.getTable<IUserData>(STORAGE_KEYS.USERS);
      const duplicate = users.some(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
      );

      if (duplicate) {
        return { success: false, message: `Username "${cleanUsername}" is already taken.` };
      }

      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newUser = new User(newUserId, cleanUsername, simpleHash(cleanPassword));

      const newProfile = new MemberProfile({
        id: `prof_${Date.now()}`,
        userId: newUserId,
        name: (name || cleanUsername).trim(),
        age: 22,
        gender,
        heightCm,
        weightKg,
        experienceLevel,
        weeklyGoal,
      });

      // Persist to users table
      users.push(newUser.toJSON());
      StorageLayer.saveTable(STORAGE_KEYS.USERS, users);

      // Persist to profiles table
      const profiles = StorageLayer.getTable<IMemberProfileData>(STORAGE_KEYS.PROFILES);
      profiles.push(newProfile.toJSON());
      StorageLayer.saveTable(STORAGE_KEYS.PROFILES, profiles);

      // Set as active session
      StorageLayer.saveSettings({ currentUserId: newUserId, theme: 'dark' as const });

      return {
        success: true,
        message: 'Account created successfully!',
        user: newUser,
        profile: newProfile,
      };
    } catch (error) {
      console.error('[AuthManager] register error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed unexpectedly.',
      };
    }
  }

  /**
   * Logs in a user. Rejects empty fields and bad credentials.
   */
  public login(
    username: string,
    password: string
  ): { success: boolean; message: string; user?: User; profile?: MemberProfile } {
    try {
      const cleanUsername = (username || '').trim();
      const cleanPassword = (password || '').trim();

      if (!cleanUsername) {
        return { success: false, message: 'Please enter your username.' };
      }
      if (!cleanPassword) {
        return { success: false, message: 'Please enter your password.' };
      }

      const users = StorageLayer.getTable<IUserData>(STORAGE_KEYS.USERS);
      const matched = users.find(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
      );

      if (!matched) {
        return { success: false, message: 'Invalid credentials. User does not exist.' };
      }

      const targetUser = User.fromJSON(matched);
      const candidateHash = simpleHash(cleanPassword);

      if (!targetUser.verifyPassword(candidateHash)) {
        return { success: false, message: 'Incorrect password.' };
      }

      // Update current session pointer
      StorageLayer.saveSettings({ currentUserId: targetUser.id, theme: 'dark' as const });

      return {
        success: true,
        message: `Welcome back, ${targetUser.username}!`,
        user: targetUser,
        profile: this.getCurrentProfile() || undefined,
      };
    } catch (error) {
      console.error('[AuthManager] login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed unexpectedly.',
      };
    }
  }

  /**
   * Logs out the current user by clearing currentUserId in settings.
   */
  public logout(): void {
    try {
      StorageLayer.saveSettings({ currentUserId: null, theme: 'dark' as const });
    } catch (error) {
      console.warn('[AuthManager] logout failed:', error);
    }
  }

  public getAllUsers(): User[] {
    try {
      const users = StorageLayer.getTable<IUserData>(STORAGE_KEYS.USERS);
      return users.map((u) => User.fromJSON(u));
    } catch {
      return [];
    }
  }

  public switchUser(userId: string): boolean {
    try {
      const users = StorageLayer.getTable<IUserData>(STORAGE_KEYS.USERS);
      const exists = users.some((u) => u.id === userId);
      if (exists) {
        StorageLayer.saveSettings({ currentUserId: userId, theme: 'dark' as const });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Returns the currently active User instance or null.
   */
  public getCurrentUser(): User | null {
    try {
      const settings = StorageLayer.getSettings({ currentUserId: null });
      if (!settings.currentUserId) return null;

      const users = StorageLayer.getTable<IUserData>(STORAGE_KEYS.USERS);
      const matched = users.find((u) => u.id === settings.currentUserId);
      return matched ? User.fromJSON(matched) : null;
    } catch (error) {
      console.warn('[AuthManager] getCurrentUser failed:', error);
      return null;
    }
  }

  /**
   * Returns the MemberProfile for the currently active user or null.
   */
  public getCurrentProfile(): MemberProfile | null {
    try {
      const settings = StorageLayer.getSettings({ currentUserId: null });
      if (!settings.currentUserId) return null;

      const profiles = StorageLayer.getTable<IMemberProfileData>(STORAGE_KEYS.PROFILES);
      const matched = profiles.find((p) => p.userId === settings.currentUserId);
      return matched ? MemberProfile.fromJSON(matched) : null;
    } catch (error) {
      console.warn('[AuthManager] getCurrentProfile failed:', error);
      return null;
    }
  }

  /**
   * Updates current user's profile in the profiles table.
   */
  public updateCurrentProfile(updates: Partial<IMemberProfileData>): MemberProfile {
    try {
      const current = this.getCurrentProfile();
      if (!current) throw new Error('No active user logged in.');

      if (updates.name !== undefined) current.name = updates.name;
      if (updates.age !== undefined) current.age = updates.age;
      if (updates.gender !== undefined) current.gender = updates.gender;
      if (updates.heightCm !== undefined) current.heightCm = updates.heightCm;
      if (updates.weightKg !== undefined) current.weightKg = updates.weightKg;
      if (updates.experienceLevel !== undefined) current.experienceLevel = updates.experienceLevel;
      if (updates.weeklyGoal !== undefined) current.weeklyGoal = updates.weeklyGoal;

      const profiles = StorageLayer.getTable<IMemberProfileData>(STORAGE_KEYS.PROFILES);
      const index = profiles.findIndex((p) => p.userId === current.userId);
      if (index !== -1) {
        profiles[index] = current.toJSON();
        StorageLayer.saveTable(STORAGE_KEYS.PROFILES, profiles);
      }

      return current;
    } catch (error) {
      console.error('[AuthManager] updateCurrentProfile error:', error);
      throw error;
    }
  }

  /**
   * Changes the password for a user.
   * Validates old password, ensures new password meets length requirement (>= 4),
   * and saves the updated hash.
   */
  public changePassword(
    userId: string,
    currentPasswordPlain: string,
    newPasswordPlain: string
  ): { success: boolean; message: string } {
    try {
      const cleanCurrent = (currentPasswordPlain || '').trim();
      const cleanNew = (newPasswordPlain || '').trim();

      if (!cleanCurrent) {
        return { success: false, message: 'Please enter your current password.' };
      }
      if (!cleanNew) {
        return { success: false, message: 'Please enter a new password.' };
      }
      if (cleanNew.length < 4) {
        return { success: false, message: 'New password must be at least 4 characters.' };
      }

      const users = StorageLayer.getTable<IUserData>(STORAGE_KEYS.USERS);
      const userIndex = users.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
      }

      const user = User.fromJSON(users[userIndex]);
      const currentHash = simpleHash(cleanCurrent);
      if (!user.verifyPassword(currentHash)) {
        return { success: false, message: 'Current password is incorrect.' };
      }

      user.passwordHash = simpleHash(cleanNew);
      users[userIndex] = user.toJSON();
      StorageLayer.saveTable(STORAGE_KEYS.USERS, users);

      return { success: true, message: 'Password changed successfully.' };
    } catch (error) {
      console.error('[AuthManager] changePassword error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to change password.',
      };
    }
  }

  /**
   * Deletes an account and cascades deletions to profile and workout records.
   */
  public deleteAccount(userId: string): { success: boolean; message: string } {
    try {
      // 1. Remove user
      const users = StorageLayer.getTable<IUserData>(STORAGE_KEYS.USERS);
      const filteredUsers = users.filter((u) => u.id !== userId);
      StorageLayer.saveTable(STORAGE_KEYS.USERS, filteredUsers);

      // 2. Remove profile
      const profiles = StorageLayer.getTable<IMemberProfileData>(STORAGE_KEYS.PROFILES);
      const filteredProfiles = profiles.filter((p) => p.userId !== userId);
      StorageLayer.saveTable(STORAGE_KEYS.PROFILES, filteredProfiles);

      // 3. Remove workout records
      const records = StorageLayer.getTable<IWorkoutRecordData>(STORAGE_KEYS.WORKOUT_RECORDS);
      const filteredRecords = records.filter((r) => r.userId !== userId);
      StorageLayer.saveTable(STORAGE_KEYS.WORKOUT_RECORDS, filteredRecords);

      // 4. Clear current session if matching
      const settings = StorageLayer.getSettings({ currentUserId: null });
      if (settings.currentUserId === userId) {
        StorageLayer.saveSettings({ currentUserId: null, theme: 'dark' as const });
      }

      return { success: true, message: 'Account and associated records deleted permanently.' };
    } catch (error) {
      console.error('[AuthManager] deleteAccount error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete account.',
      };
    }
  }

  /**
   * Retrieves user preferences (units, rest-timer sound)
   */
  public getUserPreferences(userId: string): { units: 'metric' | 'imperial'; soundEnabled: boolean } {
    try {
      const key = `fitforge_prefs_${userId}`;
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
    return { units: 'metric', soundEnabled: true };
  }

  /**
   * Saves user preferences (units, rest-timer sound)
   */
  public saveUserPreferences(
    userId: string,
    prefs: Partial<{ units: 'metric' | 'imperial'; soundEnabled: boolean }>
  ): { units: 'metric' | 'imperial'; soundEnabled: boolean } {
    const current = this.getUserPreferences(userId);
    const updated = { ...current, ...prefs };
    try {
      const key = `fitforge_prefs_${userId}`;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(updated));
      }
    } catch {
      // Ignore quota
    }
    return updated;
  }
}
