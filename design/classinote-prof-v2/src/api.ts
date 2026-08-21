const API_BASE = '/api/v1';

let lastActivityTime = Date.now();

export function getUser(): any {
  const user = localStorage.getItem('classinote_prof_user');
  return user ? JSON.parse(user) : null;
}

export function setAuthData(user: any): void {
  localStorage.setItem('classinote_prof_user', JSON.stringify(user));
}

export function clearAuthData(): void {
  localStorage.removeItem('classinote_prof_user');
}

export function recordActivity(): void {
  lastActivityTime = Date.now();
  localStorage.setItem('classinote_prof_last_activity', String(Date.now()));
}

export function getLastActivityTime(): number {
  const stored = localStorage.getItem('classinote_prof_last_activity');
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) { lastActivityTime = parsed; return parsed; }
  }
  return lastActivityTime;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    clearAuthData();
    window.location.reload();
  }
  recordActivity();
  return res;
}

export async function verifyCode(code: string) {
  const res = await fetch(`${API_BASE}/auth/code/verify`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ code }),
  });
  return res.json();
}

export async function setupPin(code: string, pin: string, type: string) {
  const res = await fetch(`${API_BASE}/auth/pin/setup`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ code, pin: String(pin), type }),
  });
  return res.json();
}

export async function loginPin(pin: string) {
  const res = await fetch(`${API_BASE}/auth/pin/login`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ pin: String(pin), type: 'prof' }),
  });
  return res.json();
}

export async function unlock(pin: string) {
  const res = await apiFetch('/auth/unlock', {
    method: 'POST', body: JSON.stringify({ pin }),
  });
  return res.json();
}

export async function changeMyPin(currentPin: string, newPin: string) {
  const res = await apiFetch('/auth/pin/change', {
    method: 'POST',
    body: JSON.stringify({ current_pin: currentPin, new_pin: newPin, type: 'prof' }),
  });
  return res.json();
}

export async function magicActivate(token: string) {
  const res = await fetch(`${API_BASE}/auth/magic/activate`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

export async function deviceRegister(code: string, telephone: string, pin: string) {
  const res = await fetch(`${API_BASE}/auth/device/register`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ code, telephone, pin }),
  });
  return res.json();
}

export async function deviceVerify(code: string, telephone: string) {
  const res = await fetch(`${API_BASE}/auth/device/verify`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ code, telephone }),
  });
  return res.json();
}

export async function deviceLogin(telephone: string, pin: string, type: string) {
  const res = await fetch(`${API_BASE}/auth/device/login`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ telephone, pin, type }),
  });
  return res.json();
}

export async function checkDevice() {
  const res = await fetch(`${API_BASE}/auth/device/check`, {
    method: 'GET', credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
}

export async function fetchNotifications() {
  const res = await apiFetch('/teacher/notifications');
  return res.json();
}

export async function markNotificationAsRead(id: number) {
  const res = await apiFetch(`/teacher/notifications/${id}/read`, { method: 'POST' });
  return res.json();
}

export async function markAllNotificationsAsRead() {
  const res = await apiFetch('/teacher/notifications/read-all', { method: 'POST' });
  return res.json();
}

export async function testPushNotification() {
  const res = await apiFetch('/teacher/test-notification', { method: 'POST' });
  return res.json();
}
