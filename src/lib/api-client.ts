import { ApiResponse } from "../../shared/types"
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('bb_token');
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  console.log(`API call to ${path} with token: ${token ? token.slice(0,10)+'...' : 'NO'}`);
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    console.log('API 401 detected, clearing session and redirecting');
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || !json.success || json.data === undefined) throw new Error(json.error || 'Request failed')
  return json.data
}