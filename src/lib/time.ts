/**
 * Clock access lives here so server components can stay free of direct
 * `Date.now()` / `new Date()` calls, which React's purity rules flag in render.
 */
export function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function currentHour() {
  return new Date().getHours();
}
