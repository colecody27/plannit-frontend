import { browser } from '$app/environment';

const BASE_URL = '/api';

const getToken = () => {
  if (!browser) {
    return null;
  }
  return localStorage.getItem('plannit-token');
};

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers = new Headers(options.headers ?? {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    const requestError = new Error(error.message ?? 'Request failed');
    (requestError as Error & { status?: number }).status = response.status;
    throw requestError;
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return (text as unknown) as T;
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }
  return JSON.parse(text) as T;
};
