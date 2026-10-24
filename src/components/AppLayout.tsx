import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Dumbbell,
  History,
  LayoutDashboard,
  LogOut,
  PlayCircle,
  Settings,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ErrorBoundary } from './ErrorBoundary';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Recommender', path: '/recommender', icon: Dumbbell },
  { name: 'Workout', path: '/workout', icon: PlayCircle },
  { name: 'History', path: '/history', icon: History },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function AppLayout() {
  const { currentUser, currentProfile, logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    info('You have been logged out.');
    navigate('/login');
  };

  const username = currentUser?.username || 'Member';
  const displayName = currentProfile?.name || username;
  const level = currentProfile?.experienceLevel || 'Intermediate';

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F4F4F6] flex flex-col md:flex-row antialiased selection:bg-[#C6FF3D] selection:text-[#0B0B0F]">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#16161D] border-r border-[#24242E] fixed top-0 bottom-0 left-0 z-30 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#24242E]">
          <div className="flex flex-col gap-2">
            <img
              src="/assets/aistudio/fitforge-logo_28ede239.svg"
              alt="FitForge"
              className="h-10 w-auto object-contain object-left"
            />
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#A1A1AA] leading-tight">
              Workout Recommender and Progress Tracker
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA]">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#C6FF3D] text-[#0B0B0F] shadow-md shadow-[#C6FF3D]/15'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#24242E]/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-[#0B0B0F] stroke-[2.5]' : 'text-[#A1A1AA] group-hover:text-[#F4F4F6]'
                      }`}
                    />
                    <span className="tracking-wide">{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Log Out */}
        <div className="p-4 border-t border-[#24242E] bg-[#16161D]">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0B0B0F] border border-[#24242E] mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D] font-bold font-heading text-lg shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#F4F4F6] truncate">
                {displayName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono uppercase text-[#C6FF3D] bg-[#C6FF3D]/10 px-1.5 py-0.5 rounded-md">
                  {level}
                </span>
                <span className="text-[11px] text-[#A1A1AA] truncate">@{username}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[#24242E] text-rose-400 hover:text-white hover:bg-rose-950/40 hover:border-rose-500/40 transition-colors text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE TOP HEADER ================= */}
      <header className="md:hidden sticky top-0 z-30 bg-[#16161D]/95 backdrop-blur-md border-b border-[#24242E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/assets/aistudio/fitforge-logo_28ede239.svg"
            alt="FitForge"
            className="h-7 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0B0B0F] border border-[#24242E] text-xs font-medium text-[#F4F4F6]">
            <UserIcon className="w-3.5 h-3.5 text-[#C6FF3D]" />
            <span className="max-w-[90px] truncate">{username}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="p-2 rounded-xl border border-[#24242E] text-[#A1A1AA] hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <main className="flex-1 md:ml-64 lg:ml-72 flex flex-col min-h-screen">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-28 md:pb-12">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>

        {/* Footer Disclaimer on every page */}
        <footer className="mt-auto border-t border-[#24242E] bg-[#0B0B0F] px-4 py-4 md:py-6 text-center text-xs text-[#A1A1AA]">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-[#C6FF3D] shrink-0" />
            <span>
              These routines are general guides for healthy individuals and do not replace professional medical advice.
            </span>
          </div>
        </footer>
      </main>

      {/* ================= MOBILE BOTTOM TAB BAR ================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#16161D]/95 backdrop-blur-lg border-t border-[#24242E] px-2 py-2 flex items-center justify-around"
        aria-label="Mobile Navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[52px] ${
                  isActive
                    ? 'text-[#C6FF3D]'
                    : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'stroke-[2.5] scale-110' : 'stroke-[1.8]'
                    }`}
                  />
                  <span className={`text-[10px] tracking-tight mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
