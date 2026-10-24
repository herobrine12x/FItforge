import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthManager, DEMO_PASSWORD, DEMO_USERNAME } from '../models/AuthManager';
import { MemberProfile } from '../models/MemberProfile';
import { RecordManager } from '../models/RecordManager';
import { StorageLayer, STORAGE_KEYS } from '../models/storage';
import { ExperienceLevel, IMemberProfileData } from '../models/types';
import { User } from '../models/User';

export interface UserPreferences {
  units: 'metric' | 'imperial';
  soundEnabled: boolean;
}

interface AuthContextValue {
  currentUser: User | null;
  currentProfile: MemberProfile | null;
  userPreferences: UserPreferences;
  isLoading: boolean;
  isNewUserOnboarding: boolean;
  login: (username: string, password: string) => { success: boolean; message: string; user?: User };
  loginDemo: () => { success: boolean; message: string; user?: User };
  register: (username: string, password: string) => { success: boolean; message: string; user?: User };
  completeOnboarding: (data: {
    name: string;
    gender: string;
    age: number;
    heightCm: number;
    weightKg: number;
    experienceLevel: ExperienceLevel;
    weeklyGoal: number;
  }) => { success: boolean; message: string };
  updateProfile: (data: Partial<IMemberProfileData>) => { success: boolean; message: string };
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  changePassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  deleteAccount: () => { success: boolean; message: string };
  clearAllWorkoutHistory: () => { success: boolean; message: string; deletedCount: number };
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ONBOARDING_KEY = 'fitforge_pending_onboarding_uid';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authManager] = useState(() => new AuthManager());
  const [recordManager] = useState(() => new RecordManager());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<MemberProfile | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    units: 'metric',
    soundEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUserOnboarding, setIsNewUserOnboarding] = useState(false);

  const refreshAuth = useCallback(() => {
    try {
      const user = authManager.getCurrentUser();
      const profile = authManager.getCurrentProfile();
      setCurrentUser(user);
      setCurrentProfile(profile);

      if (user) {
        const prefs = authManager.getUserPreferences(user.id);
        setUserPreferences(prefs);
      } else {
        setUserPreferences({ units: 'metric', soundEnabled: true });
      }

      const pendingUid = localStorage.getItem(ONBOARDING_KEY);
      if (user && pendingUid === user.id) {
        setIsNewUserOnboarding(true);
      } else {
        setIsNewUserOnboarding(false);
      }
    } catch (err) {
      console.warn('[AuthProvider] refreshAuth error:', err);
      setCurrentUser(null);
      setCurrentProfile(null);
      setIsNewUserOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  }, [authManager]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(
    (username: string, password: string) => {
      const res = authManager.login(username, password);
      if (res.success) {
        localStorage.removeItem(ONBOARDING_KEY);
        refreshAuth();
      }
      return res;
    },
    [authManager, refreshAuth]
  );

  const loginDemo = useCallback(() => {
    const res = authManager.login(DEMO_USERNAME, DEMO_PASSWORD);
    if (res.success) {
      localStorage.removeItem(ONBOARDING_KEY);
      refreshAuth();
    }
    return res;
  }, [authManager, refreshAuth]);

  const register = useCallback(
    (username: string, password: string) => {
      const res = authManager.register(username, password);
      if (res.success && res.user) {
        try {
          localStorage.setItem(ONBOARDING_KEY, res.user.id);
        } catch {
          // Ignore storage quota
        }
        setIsNewUserOnboarding(true);
        refreshAuth();
      }
      return res;
    },
    [authManager, refreshAuth]
  );

  const completeOnboarding = useCallback(
    (data: {
      name: string;
      gender: string;
      age: number;
      heightCm: number;
      weightKg: number;
      experienceLevel: ExperienceLevel;
      weeklyGoal: number;
    }) => {
      try {
        const user = authManager.getCurrentUser();
        if (!user) {
          return { success: false, message: 'No active session found.' };
        }

        const profiles = StorageLayer.getTable<IMemberProfileData>(STORAGE_KEYS.PROFILES);
        const existingIdx = profiles.findIndex((p) => p.userId === user.id);

        const newProfile = new MemberProfile({
          id: existingIdx !== -1 ? profiles[existingIdx].id : `prof_${Date.now()}`,
          userId: user.id,
          name: data.name,
          gender: data.gender,
          age: data.age,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          experienceLevel: data.experienceLevel,
          weeklyGoal: data.weeklyGoal,
        });

        if (existingIdx !== -1) {
          profiles[existingIdx] = newProfile.toJSON();
        } else {
          profiles.push(newProfile.toJSON());
        }
        StorageLayer.saveTable(STORAGE_KEYS.PROFILES, profiles);

        localStorage.removeItem(ONBOARDING_KEY);
        setIsNewUserOnboarding(false);
        refreshAuth();

        return { success: true, message: 'Profile successfully configured!' };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save profile.';
        return { success: false, message: msg };
      }
    },
    [authManager, refreshAuth]
  );

  const updateProfile = useCallback(
    (updates: Partial<IMemberProfileData>) => {
      try {
        const user = authManager.getCurrentUser();
        if (!user) {
          return { success: false, message: 'No active session found.' };
        }

        const current = authManager.getCurrentProfile();
        if (!current) {
          return { success: false, message: 'Profile not found.' };
        }

        // Apply updates through MemberProfile getters and setters to enforce validation
        if (updates.name !== undefined) current.name = updates.name;
        if (updates.age !== undefined) current.age = updates.age;
        if (updates.gender !== undefined) current.gender = updates.gender;
        if (updates.heightCm !== undefined) current.heightCm = updates.heightCm;
        if (updates.weightKg !== undefined) current.weightKg = updates.weightKg;
        if (updates.experienceLevel !== undefined) current.experienceLevel = updates.experienceLevel;
        if (updates.weeklyGoal !== undefined) current.weeklyGoal = updates.weeklyGoal;

        const profiles = StorageLayer.getTable<IMemberProfileData>(STORAGE_KEYS.PROFILES);
        const idx = profiles.findIndex((p) => p.userId === user.id);
        if (idx !== -1) {
          profiles[idx] = current.toJSON();
        } else {
          profiles.push(current.toJSON());
        }
        StorageLayer.saveTable(STORAGE_KEYS.PROFILES, profiles);

        refreshAuth();
        return { success: true, message: 'Profile updated successfully!' };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update profile.';
        return { success: false, message: msg };
      }
    },
    [authManager, refreshAuth]
  );

  const updatePreferences = useCallback(
    (prefs: Partial<UserPreferences>) => {
      const user = authManager.getCurrentUser();
      if (!user) return;
      const updated = authManager.saveUserPreferences(user.id, prefs);
      setUserPreferences(updated);
    },
    [authManager]
  );

  const changePassword = useCallback(
    (currentPass: string, newPass: string) => {
      const user = authManager.getCurrentUser();
      if (!user) {
        return { success: false, message: 'No active session found.' };
      }
      return authManager.changePassword(user.id, currentPass, newPass);
    },
    [authManager]
  );

  const deleteAccount = useCallback(() => {
    const user = authManager.getCurrentUser();
    if (!user) {
      return { success: false, message: 'No active session found.' };
    }
    const res = authManager.deleteAccount(user.id);
    if (res.success) {
      localStorage.removeItem(ONBOARDING_KEY);
      refreshAuth();
    }
    return res;
  }, [authManager, refreshAuth]);

  const clearAllWorkoutHistory = useCallback(() => {
    const user = authManager.getCurrentUser();
    if (!user) {
      return { success: false, message: 'No active session found.', deletedCount: 0 };
    }
    const count = recordManager.clearRecordsByUserId(user.id);
    refreshAuth();
    return {
      success: true,
      message: `Cleared ${count} workout ${count === 1 ? 'record' : 'records'}.`,
      deletedCount: count,
    };
  }, [authManager, recordManager, refreshAuth]);

  const logout = useCallback(() => {
    authManager.logout();
    localStorage.removeItem(ONBOARDING_KEY);
    setIsNewUserOnboarding(false);
    refreshAuth();
  }, [authManager, refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentProfile,
        userPreferences,
        isLoading,
        isNewUserOnboarding,
        login,
        loginDemo,
        register,
        completeOnboarding,
        updateProfile,
        updatePreferences,
        changePassword,
        deleteAccount,
        clearAllWorkoutHistory,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
