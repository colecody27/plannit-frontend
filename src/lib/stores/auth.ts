import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const token = writable<string | null>(null);

export const initAuth = () => {
  if (!browser) {
    return;
  }

  const stored = localStorage.getItem('access_token_cookie');
  token.set(stored ?? null);

  token.subscribe((value) => {
    if (value) {
      localStorage.setItem('access_token_cookie', value);
    } else {
      localStorage.removeItem('access_token_cookie');
    }
  });
};
