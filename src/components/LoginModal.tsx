import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Lock, LogIn, UserPlus, X } from 'lucide-react';
import { AuthManager } from '../models/AuthManager';
import { User } from '../models/User';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  authManager: AuthManager;
  onAuthSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  authManager,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('kentmalo');
  const [password, setPassword] = useState('password123');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(72);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const allUsers = authManager.getAllUsers();

  const handleQuickSwitch = (userId: string) => {
    setError(null);
    if (authManager.switchUser(userId)) {
      const user = authManager.getCurrentUser();
      if (user) {
        setSuccess(`Switched to user ${user.username}`);
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 300);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'login') {
      const result = authManager.login(username, password);
      if (result.success && result.user) {
        setSuccess(result.message);
        setTimeout(() => {
          onAuthSuccess(result.user!);
          onClose();
        }, 300);
      } else {
        setError(result.message);
      }
    } else {
      const result = authManager.register(
        username,
        email,
        fullName,
        gender,
        Number(heightCm),
        Number(weightKg)
      );
      if (result.success && result.user) {
        setSuccess(result.message);
        setTimeout(() => {
          onAuthSuccess(result.user!);
          onClose();
        }, 400);
      } else {
        setError(result.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-950/40">
          <div>
            <h3 className="text-sm font-bold text-white">
              {mode === 'login' ? 'User Authentication' : 'Create Member Account'}
            </h3>
            <p className="text-[11px] font-mono text-gray-400">Class: AuthManager</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Demo Switchers */}
        <div className="px-5 pt-3 pb-2 border-b border-gray-800 bg-gray-950/20">
          <div className="text-[10px] font-mono uppercase text-gray-400 mb-1.5">
            Quick Switch Active Account:
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {allUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickSwitch(u.id)}
                className="px-2.5 py-1.5 text-left rounded border border-gray-800 bg-gray-950 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div className="text-xs font-medium text-white truncate">
                  {u.username === 'kentmalo' ? 'Kent S. Malo' : u.username === 'prof_jessa' ? 'Jessa Evangelista' : u.username}
                </div>
                <div className="text-[10px] font-mono text-gray-400 capitalize">{u.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && (
            <div className="p-2.5 rounded border border-red-800/80 bg-red-950/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g. kentmalo"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Kent S. Malo"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="kentmalo@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-400 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="50"
                    max="250"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-400 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min="20"
                    max="300"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" /> Register Account
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-xs text-emerald-400 hover:underline cursor-pointer"
            >
              {mode === 'login'
                ? "Don't have an account? Register"
                : 'Already have an account? Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
