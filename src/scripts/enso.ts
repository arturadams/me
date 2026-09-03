import { prefersReducedMotion } from "./motion";

const RADIUS = 158;
/** The enso stays open — a closed circle is a different symbol. */
const CLOSURE = 0.93;

/** Draws the brushed circle of the hero crest on first paint. */
export function initEnso(): void {
  const ring = document.querySelector<SVGCircleElement>("#enso-ring");
  if (!ring) return;

  const circumference = 2 * Math.PI * RADIUS;
  const visible = circumference * CLOSURE;
  ring.style.strokeDasharray = `${visible} ${circumference}`;

  if (prefersReducedMotion()) {
    ring.style.strokeDashoffset = "0";
    return;
  }

  ring.style.strokeDashoffset = String(visible);
  ring.style.transition = "stroke-dashoffset 2s cubic-bezier(0.5, 0, 0.2, 1) 0.3s";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ring.style.strokeDashoffset = "0";
    });
  });
}
