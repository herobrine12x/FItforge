import React from 'react';
import {
  Activity,
  Calendar,
  Code2,
  Dumbbell,
  FileSpreadsheet,
  Play,
  RotateCcw,
  User as UserIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MemberProfile } from '../models/MemberProfile';
import { User } from '../models/User';
import { sounds } from '../utils/audio';

export type NavTab = 'dashboard' | 'recommender' | 'live' | 'records' | 'reports' | 'oop_docs';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentUser: User | null;
  currentProfile: MemberProfile | null;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  isLiveActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  currentProfile,
  onOpenLogin,
  onOpenProfile,
  isLiveActive,
}) => {
  const [muted, setMuted] = React.useState(sounds.muted);

  const toggleSound = () => {
    const isNowMuted = sounds.toggleMute();
    setMuted(isNowMuted);
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; liveDot?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard & BMI', icon: <Activity className="w-4 h-4" /> },
    { id: 'recommender', label: 'Workout Recommender', icon: <Dumbbell className="w-4 h-4" /> },
    {
      id: 'live',
      label: 'Live Session',
      icon: <Play className="w-4 h-4" />,
      liveDot: isLiveActive,
    },
    { id: 'records', label: 'Records CRUD', icon: <Calendar className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Export', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'oop_docs', label: 'OOP Architecture', icon: <Code2 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
      {/* Precision Academic Meta Line */}
      <div className="border-b border-gray-800/80 bg-gray-950 px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-gray-400 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="font-semibold text-gray-200">SDF04 Object-Oriented Programming</span>
          <span className="text-gray-700">/</span>
          <span className="hidden sm:inline text-gray-400">Malo, Kent S. (BSCS / LFCA311M111)</span>
          <span className="hidden md:inline text-gray-700">/</span>
          <span className="hidden md:inline text-gray-400">Instructor: Jessa Evangelista</span>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-xs">
          <button
            onClick={toggleSound}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            title={muted ? 'Enable sound effects' : 'Mute sound effects'}
            aria-label={muted ? 'Enable sound effects' : 'Mute sound effects'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline font-mono text-[11px]">{muted ? 'Muted' : 'Audio On'}</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
              aria-label="FitForge Home"
            >
              <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-gray-950 font-bold">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-base text-white tracking-tight">FitForge</span>
                <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest hidden sm:inline">
                  OOP Core
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'text-emerald-400 font-semibold'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.liveDot && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile / Switcher */}
          <div className="flex items-center gap-2">
            {currentUser && currentProfile && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-gray-900 border border-gray-800 text-left transition-colors cursor-pointer"
                  title="View / Edit Biometrics Profile"
                  aria-label="User Profile"
                >
                  <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    {currentProfile.fullName.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-medium text-gray-200 leading-tight">
                      {currentProfile.fullName}
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 tabular-nums">
                      {currentProfile.heightCm}cm · {currentProfile.weightKg}kg
                    </div>
                  </div>
                </button>

                <button
                  onClick={onOpenLogin}
                  className="px-2.5 py-1.5 rounded-md hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                  title="Switch user account"
                  aria-label="Switch User"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Switch</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-gray-800/80 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer rounded-md ${
                  isActive
                    ? 'bg-gray-900 text-emerald-400 border border-gray-800'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.liveDot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
