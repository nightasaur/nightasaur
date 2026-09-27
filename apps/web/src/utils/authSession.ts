export const SESSION_EXPIRED = 'nightasaur:session-expired';

// An older request must never clear credentials created by a newer sign-in.
export function clearRejectedSession(requestAuthorization: unknown) {
  const current = localStorage.getItem('nightasaur_token');
  if (!current || requestAuthorization !== `Bearer ${current}`) return false;
  localStorage.removeItem('nightasaur_token');
  window.dispatchEvent(new Event(SESSION_EXPIRED));
  return true;
}
