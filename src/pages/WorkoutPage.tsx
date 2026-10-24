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

  // Determine split passed from Recommender or localStorage
  const activeSplit = useMemo<SplitType>(() => {
    const stateSplit = location.state?.splitType;
    if (stateSplit) return stateSplit as SplitType;

    const storedSplit = localStorage.getItem('fitforge_active_split');
    if (storedSplit) return storedSplit as SplitType;

    return 'push';
  }, [location.state]);

  const handleWorkoutSaved = () => {
    localStorage.removeItem('fitforge_active_split');
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
        onWorkoutSaved={handleWorkoutSaved}
      />
    </div>
  );
}
