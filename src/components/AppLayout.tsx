import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Calendar,
  Dumbbell,
  History,
  LayoutDashboard,
  LogOut,
  Maximize2,
  Menu,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  Settings,
  ShieldAlert,
  Trophy,
  User as UserIcon,
  X,
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
  { name: 'Summary', path: '/summary', icon: Award },
  { name: 'Recommender', path: '/recommender', icon: Dumbbell },
  { name: 'Weekly Guide', path: '/schedule', icon: Calendar },
  { name: 'Workout', path: '/workout', icon: PlayCircle },
  { name: 'Records', path: '/records', icon: Trophy },
  { name: 'History', path: '/history', icon: History },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const SIDEBAR_COLLAPSED_KEY = 'fitforge_sidebar_collapsed';

export function AppLayout() {
  const { currentUser, currentProfile, logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsed sidebar state with localStorage persistence (default: expanded / false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Mobile overlay slide-in drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Focus mode for guided workout (hides sidebar completely for maximum screen space)
  const isWorkoutRoute = location.pathname.startsWith('/workout');
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Toggle collapse state and persist
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // safe
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileOpen) {
          setIsMobileOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Automatically reset focus mode when leaving workout page
  useEffect(() => {
    if (!isWorkoutRoute && isFocusMode) {
      setIsFocusMode(false);
    }
  }, [isWorkoutRoute, isFocusMode]);

  const handleLogout = () => {
    logout();
    info('You have been logged out.');
    navigate('/login');
  };

  const username = currentUser?.username || 'Member';
  const displayName = currentProfile?.name || username;
  const level = currentProfile?.experienceLevel || 'Intermediate';

  // Desktop sidebar visibility & width calculation
  const isDesktopSidebarHidden = isWorkoutRoute && isFocusMode;
  const desktopSidebarWidthClass = isDesktopSidebarHidden
    ? '-translate-x-full opacity-0 pointer-events-none w-0'
    : isCollapsed
    ? 'w-[72px]'
    : 'w-64 lg:w-72';

  // Main container left margin on desktop to prevent gaps and horizontal overflow
  const mainMarginClass = isDesktopSidebarHidden
    ? 'md:ml-0'
    : isCollapsed
    ? 'md:ml-[72px]'
    : 'md:ml-64 lg:ml-72';

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F4F4F6] flex flex-col md:flex-row antialiased selection:bg-[#C6FF3D] selection:text-[#0B0B0F]">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className={`hidden md:flex flex-col bg-[#16161D] border-r border-[#24242E] fixed top-0 bottom-0 left-0 z-30 select-none transition-all duration-200 ease-in-out ${desktopSidebarWidthClass}`}
        aria-label="Desktop Sidebar"
      >
        {/* Brand / Toggle Header */}
        <div className={`border-b border-[#24242E] ${isCollapsed ? 'p-3.5' : 'p-5'}`}>
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <img
                  src="/assets/aistudio/fitforge-logo_28ede239.svg"
                  alt="FitForge"
                  className="h-9 w-auto object-contain object-left"
                />
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#A1A1AA] leading-tight truncate">
                  Recommender & Tracker
                </div>
              </div>
              <button
                type="button"
                onClick={toggleCollapse}
                title="Collapse sidebar (Ctrl+B)"
                aria-label="Collapse sidebar"
                aria-expanded="true"
                className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#24242E] border border-[#24242E] transition-colors cursor-pointer shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D] shrink-0">
                <Dumbbell className="w-5 h-5 text-[#C6FF3D]" />
              </div>
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={toggleCollapse}
                  title="Expand sidebar (Ctrl+B)"
                  aria-label="Expand sidebar"
                  aria-expanded="false"
                  className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#24242E] border border-[#24242E] transition-colors cursor-pointer"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                {/* Tooltip for Collapse/Expand toggle */}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-[#16161D] border border-[#24242E] text-xs font-semibold text-[#F4F4F6] rounded-xl shadow-xl whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-150 z-50 pointer-events-none"
                >
                  Expand sidebar (Ctrl+B)
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#16161D] border-l border-b border-[#24242E] rotate-45" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 ${
            isCollapsed ? 'p-2' : 'p-3.5'
          }`}
          aria-label="Main Navigation"
        >
          {!isCollapsed && (
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA]">
              Navigation
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.path} className="relative group flex items-center justify-center">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center transition-all duration-200 group rounded-2xl text-sm font-semibold ${
                      isCollapsed
                        ? 'w-11 h-11 justify-center'
                        : 'w-full gap-3 px-3.5 py-2.5'
                    } ${
                      isActive
                        ? 'bg-[#C6FF3D] text-[#0B0B0F] shadow-md shadow-[#C6FF3D]/15'
                        : 'text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#24242E]/50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                          isActive
                            ? 'text-[#0B0B0F] stroke-[2.5]'
                            : 'text-[#A1A1AA] group-hover:text-[#F4F4F6]'
                        }`}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="tracking-wide truncate">{item.name}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>

                {/* Tooltip on Hover or Keyboard Focus when Collapsed */}
                {isCollapsed && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-[#16161D] border border-[#24242E] text-xs font-semibold text-[#F4F4F6] rounded-xl shadow-xl whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-150 z-50 pointer-events-none"
                  >
                    {item.name}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#16161D] border-l border-b border-[#24242E] rotate-45" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Guided Workout Focus Mode Button (Requirement 7) */}
          {isWorkoutRoute && (
            <div className={`pt-3 border-t border-[#24242E] ${isCollapsed ? 'px-0' : 'px-1'}`}>
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsFocusMode(true)}
                  className={`flex items-center gap-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border border-[#C6FF3D]/30 text-[#C6FF3D] bg-[#C6FF3D]/10 hover:bg-[#C6FF3D]/20 ${
                    isCollapsed
                      ? 'w-11 h-11 justify-center'
                      : 'w-full px-3.5 py-2.5'
                  }`}
                  aria-label="Enter Focus Mode"
                >
                  <Maximize2 className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">Focus Mode</span>}
                </button>

                {isCollapsed && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-[#16161D] border border-[#24242E] text-xs font-semibold text-[#C6FF3D] rounded-xl shadow-xl whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-150 z-50 pointer-events-none"
                  >
                    Focus Mode (Hide Sidebar)
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#16161D] border-l border-b border-[#24242E] rotate-45" />
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* User Card & Log Out */}
        <div className={`border-t border-[#24242E] bg-[#16161D] ${isCollapsed ? 'p-2.5' : 'p-4'}`}>
          {!isCollapsed ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* User Avatar Initial with Tooltip */}
              <div className="relative group flex items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-[#24242E] flex items-center justify-center text-[#C6FF3D] font-bold font-heading text-base shrink-0 border border-[#24242E]">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-[#16161D] border border-[#24242E] text-xs font-semibold text-[#F4F4F6] rounded-xl shadow-xl whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 pointer-events-none"
                >
                  <div className="font-bold text-[#F4F4F6]">{displayName}</div>
                  <div className="text-[10px] text-[#A1A1AA]">@{username} · {level}</div>
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#16161D] border-l border-b border-[#24242E] rotate-45" />
                </div>
              </div>

              {/* Log Out Icon Button with Tooltip */}
              <div className="relative group flex items-center justify-center w-full">
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Log out"
                  aria-label="Log out"
                  className="w-10 h-10 rounded-xl border border-[#24242E] text-rose-400 hover:text-white hover:bg-rose-950/40 hover:border-rose-500/40 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-[#16161D] border border-[#24242E] text-xs font-semibold text-rose-400 rounded-xl shadow-xl whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-150 z-50 pointer-events-none"
                >
                  Log out
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#16161D] border-l border-b border-[#24242E] rotate-45" />
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ================= FOCUS MODE EXIT BUTTON (Requirement 7) ================= */}
      {isDesktopSidebarHidden && (
        <button
          type="button"
          onClick={() => setIsFocusMode(false)}
          className="hidden md:flex fixed top-4 left-4 z-40 items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#16161D]/90 backdrop-blur-md border border-[#C6FF3D]/40 text-[#C6FF3D] hover:bg-[#24242E] text-xs font-bold font-mono shadow-2xl transition-all cursor-pointer hover:scale-105"
          title="Exit Focus Mode (Show Sidebar)"
          aria-label="Exit Focus Mode (Show Sidebar)"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Focus Mode</span>
        </button>
      )}

      {/* ================= MOBILE OVERLAY BACKDROP & DRAWER (Requirement 6) ================= */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-[#16161D] border-r border-[#24242E] z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile Navigation Drawer"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#24242E] flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <img
              src="/assets/aistudio/fitforge-logo_28ede239.svg"
              alt="FitForge"
              className="h-7 w-auto object-contain object-left"
            />
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#A1A1AA]">
              Workout Recommender
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation menu"
            className="p-2 rounded-xl border border-[#24242E] text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#24242E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto" aria-label="Mobile Drawer Navigation">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA]">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#C6FF3D] text-[#0B0B0F] shadow-md shadow-[#C6FF3D]/15'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#24242E]/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-[#0B0B0F] stroke-[2.5]' : 'text-[#A1A1AA]'
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

        {/* Drawer User Card & Logout */}
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
            onClick={() => {
              setIsMobileOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[#24242E] text-rose-400 hover:text-white hover:bg-rose-950/40 hover:border-rose-500/40 transition-colors text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE TOP HEADER (Requirement 6) ================= */}
      <header className="md:hidden sticky top-0 z-30 bg-[#16161D]/95 backdrop-blur-md border-b border-[#24242E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Menu button to slide in sidebar overlay */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 rounded-xl border border-[#24242E] text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#24242E]/50 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
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
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ease-in-out w-full min-w-0 overflow-x-hidden ${mainMarginClass}`}
      >
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
                  <span
                    className={`text-[10px] tracking-tight mt-1 font-medium ${
                      isActive ? 'font-bold' : ''
                    }`}
                  >
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
