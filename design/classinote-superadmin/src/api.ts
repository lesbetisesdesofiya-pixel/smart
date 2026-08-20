import { AdminRole } from './types';

const API_BASE = '/smart/public/api/v1';

let lastActivityTime = Date.now();

export function getUser(): any {
  const user = localStorage.getItem('classinote_superadmin_user');
  return user ? JSON.parse(user) : null;
}

export function getUserRole(): AdminRole | null {
  const user = getUser();
  return user?.role || null;
}

export function isSuperadmin(): boolean {
  return getUserRole() === 'superadmin';
}

export function setAuthData(user: any): void {
  localStorage.setItem('classinote_superadmin_user', JSON.stringify(user));
}

export function clearAuthData(): void {
  localStorage.removeItem('classinote_superadmin_user');
}

export function recordActivity(): void {
  lastActivityTime = Date.now();
  localStorage.setItem('classinote_superadmin_last_activity', String(Date.now()));
}

export function getLastActivityTime(): number {
  const stored = localStorage.getItem('classinote_superadmin_last_activity');
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) {
      lastActivityTime = parsed;
      return parsed;
    }
  }
  return lastActivityTime;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    'Accept': 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (res.status === 401) {
    clearAuthData();
    window.location.reload();
  }
  recordActivity();
  return res;
}

// Auth API
export async function loginAdmin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/superadmin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function loginAdminPin(email: string, pin: string) {
  const res = await fetch(`${API_BASE}/auth/admin/pin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, pin }),
  });
  return res.json();
}

export async function unlock(pin: string) {
  console.log('[UNLOCK] pin:', pin, 'type:', typeof pin, 'length:', pin.length);
  const body = JSON.stringify({ pin });
  console.log('[UNLOCK] body:', body);
  const res = await apiFetch('/auth/unlock', {
    method: 'POST',
    body,
  });
  console.log('[UNLOCK] status:', res.status);
  const data = await res.json();
  console.log('[UNLOCK] response:', data);
  return data;
}

export async function setupAdminPin(email: string, password: string, pin: string) {
  const res = await fetch(`${API_BASE}/auth/admin/pin/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, pin }),
  });
  return res.json();
}

export async function generateAdminLink(adminId: number, pin: string) {
  const res = await apiFetch(`/superadmin/admins/${adminId}/generate-link`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
  return res.json();
}

export async function changeAdminPin(currentPin: string, newPin: string) {
  const res = await apiFetch('/auth/admin/pin/change', {
    method: 'POST',
    body: JSON.stringify({ current_pin: currentPin, new_pin: newPin }),
  });
  return res.json();
}

export async function forcePasswordReset(password: string, passwordConfirmation: string) {
  const res = await apiFetch('/auth/force-password-reset', {
    method: 'POST',
    body: JSON.stringify({ password, password_confirmation: passwordConfirmation }),
  });
  return res.json();
}

export async function changeMyPin(currentPin: string, newPin: string) {
  const res = await apiFetch('/auth/admin/pin/change', {
    method: 'POST',
    body: JSON.stringify({ current_pin: currentPin, new_pin: newPin }),
  });
  return res.json();
}

export async function changeMyPassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  const res = await apiFetch('/auth/force-password-reset', {
    method: 'POST',
    body: JSON.stringify({
      password: newPassword,
      password_confirmation: confirmPassword,
      current_password: currentPassword,
    }),
  });
  return res.json();
}

export async function getSettings() {
  const res = await apiFetch('/superadmin/settings');
  return res.json();
}

export async function updateZernioPublicUrl(url: string) {
  const res = await apiFetch('/superadmin/settings/zernio-public-url', {
    method: 'PUT',
    body: JSON.stringify({ url }),
  });
  return res.json();
}
