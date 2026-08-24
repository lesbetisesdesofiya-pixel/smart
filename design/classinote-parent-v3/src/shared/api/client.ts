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
    window.location.href = '/app/parentV3/';
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
      if (data.authenticated && data.type === 'parent') {
        return { type: 'parent' as const, id: data.user.id };
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
  const res = await apiFetch('/parent/dashboard');
  if (!res.ok) throw new Error('Failed to load dashboard');
  return res.json();
}

export async function fetchGrades(eleveId?: number) {
  const qs = eleveId ? `?eleve_id=${eleveId}` : '';
  const res = await apiFetch(`/parent/notes${qs}`);
  if (!res.ok) throw new Error('Failed to load grades');
  return res.json();
}
