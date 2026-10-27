import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
} from 'lucide-react';
import LoginBackground from '../components/LoginBackground';
import { submitPasswordReset } from '../services/passwordResetApi';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract token from query params (supporting both standard and HashRouter formats)
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let resolvedToken = searchParams.get('token') || '';

    if (!resolvedToken && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      resolvedToken = urlParams.get('token') || '';

      if (!resolvedToken && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          resolvedToken = hashParams.get('token') || '';
        }
      }
    }

    setToken(resolvedToken);
    if (!resolvedToken) {
      setErrorMessage('Missing password reset token. Please request a new reset link.');
    }
  }, [searchParams]);

  const validate = (): boolean => {
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Invalid or expired link. Please request a new reset link.');
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await submitPasswordReset(token, password);

      if (response.success) {
        setSuccessMessage('Password successfully updated! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/login');
        }, 2200);
      } else {
        setErrorMessage(response.message || 'Invalid or expired link.');
      }
    } catch {
      setErrorMessage('Invalid or expired link. Please request a new reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen text-slate-900 dark:text-[#F4F4F6] flex flex-col justify-between selection:bg-lime-400 dark:selection:bg-[#C6FF3D] selection:text-slate-900 dark:selection:text-[#0B0B0F]">
      <LoginBackground />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-lg bg-white dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-black/80 p-6 sm:p-10">
          {/* Brand Header */}
          <div className="flex flex-col gap-2 mb-8">
            <Link to="/login" className="inline-block">
              <img
                src="/assets/aistudio/fitforge-logo_28ede239.svg"
                alt="FitForge"
                className="h-9 w-auto object-contain object-left"
              />
            </Link>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-[#A1A1AA]">
              Security & Credentials
            </div>
          </div>

          {/* Title & Description */}
          <div className="mb-6">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-[#F4F4F6] uppercase">
              Set New Password
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-1.5 leading-relaxed">
              Create a strong password with at least 8 characters for your FitForge account.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-semibold block">{errorMessage}</span>
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center gap-1 font-bold text-rose-800 dark:text-rose-200 underline hover:no-underline"
                >
                  Request a new reset link
                </Link>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-[#C6FF3D] mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F4F4F6]">
                    Success!
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-[#A1A1AA] leading-relaxed">
                    {successMessage}
                  </p>
                </div>
              </div>

              <Link
                to="/login"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52b] dark:text-[#0B0B0F] font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center"
              >
                <span>Sign In Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* New Password */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5"
                >
                  New Password (8+ characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#A1A1AA]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    placeholder="••••••••"
                    disabled={isSubmitting || !token}
                    className={`w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-[#0B0B0F] border rounded-2xl text-sm text-slate-900 dark:text-[#F4F4F6] placeholder-slate-400 dark:placeholder-[#A1A1AA]/50 focus:outline-none transition-colors ${
                      fieldErrors.password
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-300 dark:border-[#24242E] focus:border-slate-500 dark:focus:border-[#C6FF3D]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F6] transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-rose-500 dark:text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-new-password"
                  className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#A1A1AA]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    placeholder="••••••••"
                    disabled={isSubmitting || !token}
                    className={`w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-[#0B0B0F] border rounded-2xl text-sm text-slate-900 dark:text-[#F4F4F6] placeholder-slate-400 dark:placeholder-[#A1A1AA]/50 focus:outline-none transition-colors ${
                      fieldErrors.confirmPassword
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-300 dark:border-[#24242E] focus:border-slate-500 dark:focus:border-[#C6FF3D]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F6] transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-rose-500 dark:text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52b] dark:text-[#0B0B0F] font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/15 active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-[#24242E]/60 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 dark:text-[#C6FF3D] dark:hover:underline font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
