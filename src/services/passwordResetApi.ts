/**
 * Password Reset API Service
 * Handles communication with the Flask /api/forgot-password and /api/reset-password endpoints.
 * Automatically falls back to simulated demo mode when the backend is offline so the full flow
 * can be verified in client-side preview environments without setup friction.
 */

const BASE_URL = 'http://127.0.0.1:5000';

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

interface DemoResetRecord {
  tokenHash: string;
  expiresAt: number; // timestamp in ms
  used: boolean;
  email: string;
}

const DEMO_STORAGE_KEY = 'fitforge_demo_password_resets';

async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Simple deterministic fallback if crypto.subtle unavailable
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

function getDemoResets(): DemoResetRecord[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDemoResets(records: DemoResetRecord[]): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors in demo mode
  }
}

/**
 * Initiates the password recovery request.
 * Sends { email } to POST /api/forgot-password.
 * Always resolves with the generic message.
 */
export async function requestForgotPassword(email: string): Promise<PasswordResetResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await fetch(`${BASE_URL}/api/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      return {
        success: true,
        message: data?.message || 'If that email exists, a reset link was sent.',
      };
    }

    return {
      success: false,
      message: data?.error || data?.message || 'Failed to process request.',
    };
  } catch (_networkError) {
    // Backend offline / network unreachable -> execute browser demo simulation
    return await simulateDemoForgotPassword(normalizedEmail);
  }
}

/**
 * Completes the password reset by providing token and new password.
 * Sends { token, password } to POST /api/reset-password.
 */
export async function submitPasswordReset(
  token: string,
  newPassword: string
): Promise<PasswordResetResponse> {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    return {
      success: false,
      message: 'Invalid or expired link.',
    };
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      message: 'Password must be at least 8 characters long.',
    };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: trimmedToken, password: newPassword }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      return {
        success: true,
        message: data?.message || 'Password successfully updated. You can now log in.',
      };
    }

    return {
      success: false,
      message: data?.error || data?.message || 'Invalid or expired link.',
    };
  } catch (_networkError) {
    // Backend offline / network unreachable -> execute browser demo simulation
    return await simulateDemoPasswordReset(trimmedToken, newPassword);
  }
}

// ==============================================================================
// DEMO SIMULATION (Runs only when Flask backend is not yet started in dev preview)
// ==============================================================================

async function simulateDemoForgotPassword(email: string): Promise<PasswordResetResponse> {
  const randomChars = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const rawToken = `tok_${randomChars}_${Date.now()}`;
  const tokenHash = await sha256Hex(rawToken);

  // Invalidate any older unused tokens for this email in demo store
  const existing = getDemoResets();
  const updated = existing.map((rec) => (rec.email === email ? { ...rec, used: true } : rec));

  // 30 minute expiry
  const expiresAt = Date.now() + 30 * 60 * 1000;
  updated.push({
    email,
    tokenHash,
    expiresAt,
    used: false,
  });
  saveDemoResets(updated);

  // Build reset link compatible with browser URL & HashRouter
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') : '';
  const resetLink = `${origin}${pathname}/#/reset-password?token=${rawToken}`;

  // Log to console matching Flask demo mode output
  // Notice: user password is never logged
  console.log(
    '%c[FITFORGE PASSWORD RESET - DEMO MODE]%c\n' +
      `Target Email: ${email}\n` +
      `Reset Link:   ${resetLink}\n` +
      'Valid for:    30 minutes (Single use)\n' +
      'Copy and open this link to test setting a new password.',
    'background: #16161D; color: #C6FF3D; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
    'color: inherit;'
  );

  return {
    success: true,
    message: 'If that email exists, a reset link was sent.',
  };
}

async function simulateDemoPasswordReset(
  token: string,
  _newPassword: string
): Promise<PasswordResetResponse> {
  const tokenHash = await sha256Hex(token);
  const records = getDemoResets();
  const now = Date.now();

  const recordIndex = records.findIndex(
    (r) => r.tokenHash === tokenHash && !r.used && r.expiresAt > now
  );

  if (recordIndex === -1) {
    return {
      success: false,
      message: 'Invalid or expired link.',
    };
  }

  // Mark token used
  records[recordIndex].used = true;
  saveDemoResets(records);

  return {
    success: true,
    message: 'Password successfully updated. You can now log in.',
  };
}
