const API_BASE = '/api/v1';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    window.location.href = '/app/profV3/';
  }
  return res;
}

export async function getSessionUser() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.type === 'prof') {
        return { type: 'prof' as const, id: data.user.id, nom_complet: data.user.nom_complet };
      }
    }
  } catch {}
  return null;
}

export async function consumeMagicLink(token: string) {
  const res = await fetch(`${API_BASE}/magic/consume`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

export async function fetchDashboard() {
  const res = await apiFetch('/teacher/dashboard');
  if (!res.ok) throw new Error('Failed to load dashboard');
  return res.json();
}

export async function fetchSchools() {
  const res = await apiFetch('/teacher/schools');
  if (!res.ok) return { schools: [] };
  return res.json();
}

export async function unlock(pin: string) {
  const res = await apiFetch('/auth/unlock', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
  return res.json();
}

export async function checkDevice(): Promise<{ trusted: boolean; user_type?: string; user_id?: number }> {
  try {
    const res = await fetch('/api/v1/auth/device/check', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) return res.json();
  } catch {}
  return { trusted: false };
}

export async function pinLogin(pin: string) {
  const res = await fetch('/api/v1/auth/device/pin-login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ pin }),
  });
  return res.json();
}
