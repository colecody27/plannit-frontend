import { browser } from '$app/environment';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

const BACKEND_BASE_URL = (PUBLIC_API_BASE_URL || 'http://127.0.0.1:5001').replace(/\/+$/, '');

export const getLoginUrl = (redirectTo?: string) => {
  if (browser) {
    const token = localStorage.getItem('plannit-token');
    if (token) {
      return '/dashboard';
    }
  }
  const url = new URL('/auth/login', BACKEND_BASE_URL);
  if (redirectTo && browser) {
    url.searchParams.set('redirect_to', redirectTo);
  }
  return url.toString();
};
