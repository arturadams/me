/** Evaluated at call time — the user can change the OS setting mid-session. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
