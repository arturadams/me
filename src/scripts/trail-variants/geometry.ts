import type { Point } from "./types";

export const SVG_NS = "http://www.w3.org/2000/svg";

/** How many points to walk a path at when locating the waypoints along it. */
const SAMPLES = 260;

export function svgEl<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

/** Vertical-tangent cubics: the line leaves and enters each waypoint straight down. */
export function toSmoothPath(points: readonly Point[]): string {
  const first = points[0];
  if (!first) return "";

  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    if (!from || !to) continue;
    const mid = (from.y + to.y) / 2;
    d += ` C ${from.x} ${mid}, ${to.x} ${mid}, ${to.x} ${to.y}`;
  }
  return d;
}

/**
 * Quadratics bowed perpendicular to each chord, so the line overshoots
 * sideways between waypoints rather than easing between them. Reads as
 * something thrown rather than drawn.
 */
export function toArcPath(points: readonly Point[], bow = 0.16): string {
  const first = points[0];
  if (!first) return "";

  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    if (!from || !to) continue;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const span = Math.hypot(dx, dy) || 1;
    // Perpendicular, signed so the bulge leads the horizontal direction of travel.
    const lift = bow * span * (dx >= 0 ? 1 : -1);
    const cx = (from.x + to.x) / 2 - (dy / span) * lift;
    const cy = (from.y + to.y) / 2 + (dx / span) * lift;
    d += ` Q ${cx} ${cy}, ${to.x} ${to.y}`;
  }
  return d;
}

/**
 * Where each waypoint falls along a path, as a fraction 0–1. Walks the path
 * once and keeps the nearest sample per waypoint — the waypoints are on the
 * path by construction, so nearest is exact enough.
 */
export function fractionsAlong(path: SVGPathElement, marks: readonly Point[]): number[] {
  const length = path.getTotalLength();
  const sampled: DOMPoint[] = [];
  for (let i = 0; i <= SAMPLES; i++) sampled.push(path.getPointAtLength((length * i) / SAMPLES));

  return marks.map((target) => {
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < sampled.length; i++) {
      const point = sampled[i];
      if (!point) continue;
      const dx = point.x - target.x;
      const dy = point.y - target.y;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    return best / SAMPLES;
  });
}

/** Points per side when tracing the outline of a slash. */
const SLASH_STEPS = 26;

/**
 * A closed lens shape running along +x from the origin: zero width at both
 * tips, fattest in the middle, bowed off the axis. SVG strokes are uniform
 * width, so a slash that tapers has to be a fill.
 */
export function taperedSlash(length: number, halfWidth: number, bow: number): string {
  const spine = (t: number): number => -bow * Math.sin(Math.PI * t);
  // Weighted toward the tips, which keeps the belly broad and the points fine.
  const width = (t: number): number => halfWidth * Math.sin(Math.PI * t) ** 0.62;

  let top = "";
  let bottom = "";
  for (let i = 0; i <= SLASH_STEPS; i++) {
    const t = i / SLASH_STEPS;
    const x = (t * length).toFixed(2);
    const y = spine(t);
    const w = width(t);
    top += `${i === 0 ? "M" : "L"}${x} ${(y - w).toFixed(2)}`;
    // Walked back to front, so appending it closes the outline.
    const j = SLASH_STEPS - i;
    const u = j / SLASH_STEPS;
    bottom += `L${(u * length).toFixed(2)} ${(spine(u) + width(u)).toFixed(2)}`;
  }
  return `${top}${bottom}Z`;
}
