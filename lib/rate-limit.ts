import "server-only";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

// In-memory, per-process attempt counter (failed logins, reset requests). Good enough for a single
// server; swap for a shared store (e.g. Redis) if the app is scaled out.
const failures = new Map<string, { count: number; resetAt: number }>();

export function isLockedOut(key: string) {
  const entry = failures.get(key);
  if (!entry) return false;
  if (entry.resetAt < Date.now()) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailure(key: string) {
  const entry = failures.get(key);
  if (!entry || entry.resetAt < Date.now()) {
    failures.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
  } else {
    entry.count++;
  }
}

export function clearFailures(key: string) {
  failures.delete(key);
}
