import { browser } from '$app/environment';

export const getLoginUrl = () => {
  if (browser) {
    const token = localStorage.getItem('plannit-token');
    if (token) {
      return '/dashboard';
    }
  }
  return '/api/auth/login';
};
