import { prefersReducedMotion } from "./motion";

/** Fades elements marked `.reveal` in as they enter the viewport. */
export function initReveal(): void {
  const items = document.querySelectorAll<HTMLElement>(".reveal");
  if (items.length === 0) return;

  const showAll = () => {
    for (const el of items) el.classList.add("in");
  };

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
  );

  for (const el of items) observer.observe(el);
}
