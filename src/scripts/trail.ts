import { prefersReducedMotion } from "./motion";
import { createInk } from "./trail-variants/ink";
import { createKatana } from "./trail-variants/katana";
import { createLine } from "./trail-variants/line";
import { createShuriken } from "./trail-variants/shuriken";
import type { Point, TrailVariant } from "./trail-variants/types";

const SMOOTHING = 0.1;
/** How far down the viewport the head of the trail sits. */
const HEAD_OFFSET = 0.75;

/**
 * Prototypes, reachable with `?trail=katana` and friends. The line is the one
 * that ships; the rest are here to be compared against it and then deleted.
 */
const VARIANTS: Record<string, () => TrailVariant> = {
  line: createLine,
  ink: createInk,
  katana: createKatana,
  shuriken: createShuriken,
};

function chooseVariant(): TrailVariant {
  const requested = new URLSearchParams(window.location.search).get("trail") ?? "";
  return (VARIANTS[requested] ?? createLine)();
}

/**
 * Marks a path down the page as you scroll, lighting a marker at each section
 * it passes. Owns the geometry, the scroll position and the frame loop; how
 * any of it is drawn belongs to the variant.
 */
export function initTrail(): void {
  const found = document.querySelector<SVGSVGElement>("#trail-svg");
  if (!found) return;
  // Rebound so the nested declarations below see a non-nullable type:
  // narrowing does not survive into hoisted function declarations.
  const svg = found;

  const root = document.documentElement;
  const variant = chooseVariant();
  let progress = 0;
  let ready = false;

  function waypoints(width: number): Point[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[data-trail]"), (el) => {
      const rect = el.getBoundingClientRect();
      return {
        x: width * Number.parseFloat(el.dataset.trailX ?? "0.5"),
        y: rect.top + window.scrollY + rect.height * Number.parseFloat(el.dataset.trail ?? "0.5"),
      };
    });
  }

  function update(instant: boolean): void {
    if (!ready) return;
    const reduced = prefersReducedMotion();

    const reach = (window.scrollY + window.innerHeight * HEAD_OFFSET) / root.scrollHeight;
    const target = reduced ? 1 : Math.min(Math.max(reach, 0.04), 1);
    progress = instant || reduced ? target : progress + (target - progress) * SMOOTHING;

    variant.update(progress);
  }

  function build(): void {
    const width = root.clientWidth;
    const height = root.scrollHeight;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));

    const marks = waypoints(width);
    if (marks.length < 2) return;

    variant.destroy();
    variant.build({
      svg,
      marks,
      // Synthetic endpoints so the trail enters at the top and exits at the bottom.
      points: [{ x: width * 0.62, y: 0 }, ...marks, { x: width * 0.5, y: height }],
      width,
      height,
      reduced: prefersReducedMotion(),
    });
    ready = true;

    update(true);
  }

  build();

  if (!prefersReducedMotion()) {
    const loop = (): void => {
      update(false);
      requestAnimationFrame(loop);
    };
    loop();
  }

  let rebuildTimer: number | undefined;
  function scheduleRebuild(): void {
    window.clearTimeout(rebuildTimer);
    rebuildTimer = window.setTimeout(build, 200);
  }

  window.addEventListener("resize", scheduleRebuild, { passive: true });
  window.addEventListener("load", build);
  // Late layout shifts (font swap, image decode) change the document height.
  if ("ResizeObserver" in window) new ResizeObserver(scheduleRebuild).observe(document.body);
}
