const API = '/api';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}

export async function getObservations() {
  return request('/observations');
}

export async function getStats() {
  return request('/stats');
}

export async function submitObservation(obs) {
  return request('/observations', { method: 'POST', body: JSON.stringify(obs) });
}

export async function syncObservations(observations) {
  return request('/sync', { method: 'POST', body: JSON.stringify({ observations }) });
}

export async function verifyParentPassword(password) {
  const { valid } = await request('/auth/parent', { method: 'POST', body: JSON.stringify({ password }) });
  return valid;
}

const PENDING_KEY = 'suivi-auguste-pending';

export function getPendingObservations() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingObservations(list) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

export function addPendingObservation(obs) {
  const list = getPendingObservations();
  list.push(obs);
  savePendingObservations(list);
  return list;
}

export function clearPendingObservations() {
  localStorage.removeItem(PENDING_KEY);
}

export function setPendingObservations(list) {
  if (list.length) savePendingObservations(list);
  else clearPendingObservations();
}
