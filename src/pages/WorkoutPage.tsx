import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { LiveTrackerView } from '../components/LiveTrackerView';
import { useAuth } from '../context/AuthContext';
import { RecordManager } from '../models/RecordManager';
import { SplitType } from '../models/types';

export function WorkoutPage() {
  const { currentUser, currentProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [recordManager] = useState(() => new RecordManager());

  // Determine split passed from Recommender or localStorage (null if none chosen)
  const activeSplit = useMemo<SplitType | null>(() => {
    const stateSplit = location.state?.splitType;
    if (stateSplit) return stateSplit as SplitType;

    const storedSplit = localStorage.getItem('fitforge_active_split');
    if (storedSplit) return storedSplit as SplitType;

    return null;
  }, [location.state]);

  const customExercises = useMemo(() => {
    if (location.state?.customExercises) {
      return location.state.customExercises;
    }
    try {
      const stored = localStorage.getItem('fitforge_active_exercises');
      if (stored) return JSON.parse(stored);
    } catch {
      // safe
    }
    return null;
  }, [location.state]);

  const handleWorkoutSaved = () => {
    localStorage.removeItem('fitforge_active_split');
    localStorage.removeItem('fitforge_active_exercises');
    localStorage.removeItem('fitforge_active_level');
    navigate('/history');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Live Tracker Container */}
      <LiveTrackerView
        currentUser={currentUser}
        currentProfile={currentProfile}
        recordManager={recordManager}
        initialSplit={activeSplit}
        initialExercises={customExercises}
        onWorkoutSaved={handleWorkoutSaved}
      />
    </div>
  );
}
