import { prefersReducedMotion } from "./motion";

const DURATION_MS = 1600;

function read(el: HTMLElement): { target: number; decimals: number } {
  return {
    target: Number.parseFloat(el.dataset.count ?? "0"),
    decimals: Number.parseInt(el.dataset.decimals ?? "0", 10),
  };
}

function countUp(el: HTMLElement): void {
  const { target, decimals } = read(el);
  const start = performance.now();

  const tick = (now: number): void => {
    const progress = Math.min((now - start) / DURATION_MS, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = (target * eased).toFixed(decimals);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target.toFixed(decimals);
  };

  requestAnimationFrame(tick);
}

/** Counts `[data-count]` elements up from zero the first time they are seen. */
export function initCounters(): void {
  const counters = document.querySelectorAll<HTMLElement>("[data-count]");
  if (counters.length === 0) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    for (const el of counters) {
      const { target, decimals } = read(el);
      el.textContent = target.toFixed(decimals);
    }
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        countUp(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.5 },
  );

  for (const el of counters) observer.observe(el);
}
