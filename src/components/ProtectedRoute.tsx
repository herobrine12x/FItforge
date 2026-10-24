import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading, isNewUserOnboarding } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#24242E] border-t-[#C6FF3D] rounded-full animate-spin" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#A1A1AA]">
            Loading FitForge...
          </span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If newly registered user hasn't completed onboarding and isn't already on /onboarding
  if (isNewUserOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
