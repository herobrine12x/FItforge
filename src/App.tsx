import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { WeeklyGuideView } from './components/WeeklyGuideView';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { RecommenderPage } from './pages/RecommenderPage';
import { RecordsPage } from './pages/RecordsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Stage1TestPage } from './pages/Stage1TestPage';
import { SummaryPage } from './pages/SummaryPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { BeginnerBasicsPage } from './pages/BeginnerBasicsPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            {/* Test Harness Routes */}
            <Route path="/test" element={<Stage1TestPage />} />
            <Route path="/stage1" element={<Stage1TestPage />} />

            {/* Protected Onboarding for Newly Registered Athletes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Protected App Shell with Responsive Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/summary" element={<SummaryPage />} />
              <Route path="/recommender" element={<RecommenderPage />} />
              <Route path="/schedule" element={<WeeklyGuideView />} />
              <Route path="/workout" element={<WorkoutPage />} />
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/basics" element={<BeginnerBasicsPage />} />
              <Route path="/beginner-basics" element={<Navigate to="/basics" replace />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
