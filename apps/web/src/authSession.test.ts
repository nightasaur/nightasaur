import { afterEach, expect, it, vi } from 'vitest';
import { clearRejectedSession, SESSION_EXPIRED } from './utils/authSession';

afterEach(() => localStorage.clear());

it('preserves a newer sign-in when an old request returns 401', () => {
  localStorage.setItem('nightasaur_token', 'new-fixture');
  expect(clearRejectedSession('Bearer old-fixture')).toBe(false);
  expect(localStorage.getItem('nightasaur_token')).toBe('new-fixture');
});

it('expires the matching session and notifies mounted routes', () => {
  localStorage.setItem('nightasaur_token', 'current-fixture');
  const expired = vi.fn();
  window.addEventListener(SESSION_EXPIRED, expired);
  try {
    expect(clearRejectedSession('Bearer current-fixture')).toBe(true);
    expect(localStorage.getItem('nightasaur_token')).toBeNull();
    expect(expired).toHaveBeenCalledOnce();
  } finally {
    window.removeEventListener(SESSION_EXPIRED, expired);
  }
});
