import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Inbox,
  Loader2,
  Mail,
} from 'lucide-react';
import LoginBackground from '../components/LoginBackground';
import { requestForgotPassword } from '../services/passwordResetApi';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setFieldError('Email address is required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError('Please enter a valid email address.');
      return;
    }

    setFieldError(null);
    setIsSubmitting(true);

    try {
      const response = await requestForgotPassword(trimmed);
      // Always show generic message as requested
      setSubmittedMessage(response.message || 'If that email exists, a reset link was sent.');
    } catch {
      setSubmittedMessage('If that email exists, a reset link was sent.');
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
              Account Recovery
            </div>
          </div>

          {/* Title & Description */}
          <div className="mb-6">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-[#F4F4F6] uppercase">
              Forgot Password
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-1.5 leading-relaxed">
              Enter your account email below. If an associated account is found, we will deliver a single-use password reset link.
            </p>
          </div>

          {/* Success Callout after submission */}
          {submittedMessage ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-[#C6FF3D] mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F4F4F6]">
                    Request Processed
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-[#A1A1AA] leading-relaxed">
                    {submittedMessage}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] flex items-center gap-2.5 text-xs text-slate-600 dark:text-[#A1A1AA]">
                <Inbox className="w-4 h-4 text-emerald-600 dark:text-[#C6FF3D] shrink-0" />
                <span>
                  Be sure to check your inbox or spam folder. If running in local demo mode, check the developer console for the link.
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedMessage(null);
                    setEmail('');
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#24242E] dark:hover:bg-[#2e2e3b] text-slate-900 dark:text-[#F4F4F6] font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Send another request
                </button>
                <Link
                  to="/login"
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52b] dark:text-[#0B0B0F] font-bold text-xs transition-all flex items-center justify-center gap-1.5 text-center shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Email Request Form */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#A1A1AA]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldError) setFieldError(null);
                    }}
                    placeholder="name@example.com"
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#0B0B0F] border rounded-2xl text-sm text-slate-900 dark:text-[#F4F4F6] placeholder-slate-400 dark:placeholder-[#A1A1AA]/50 focus:outline-none transition-colors ${
                      fieldError
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-300 dark:border-[#24242E] focus:border-slate-500 dark:focus:border-[#C6FF3D]'
                    }`}
                  />
                </div>
                {fieldError && (
                  <p className="text-rose-500 dark:text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52b] dark:text-[#0B0B0F] font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/15 active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
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
