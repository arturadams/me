import { prefersReducedMotion } from "./motion";

interface Point {
  x: number;
  y: number;
}

interface TrailNode {
  el: SVGPathElement;
  /** Fraction along the path, 0–1, at which this node lights up. */
  at: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const SAMPLES = 260;
const SMOOTHING = 0.1;
const NODE_RADIUS = 4.5;
/** How far down the viewport the head of the trail sits. */
const HEAD_OFFSET = 0.75;

function toPathData(points: readonly Point[]): string {
  const first = points[0];
  if (!first) return "";

  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    if (!from || !to) continue;
    // Vertical-tangent cubic: the line leaves and enters each waypoint straight down.
    const mid = (from.y + to.y) / 2;
    d += ` C ${from.x} ${mid}, ${to.x} ${mid}, ${to.x} ${to.y}`;
  }
  return d;
}

function diamond(at: Point, r: number): SVGPathElement {
  const el = document.createElementNS(SVG_NS, "path");
  el.setAttribute(
    "d",
    `M${at.x} ${at.y - r}L${at.x + r} ${at.y}L${at.x} ${at.y + r}L${at.x - r} ${at.y}Z`,
  );
  el.setAttribute("class", "trail-node");
  return el;
}

function nearestFraction(sampled: readonly DOMPoint[], target: Point): number {
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

  return best / (sampled.length - 1);
}

interface TrailElements {
  svg: SVGSVGElement;
  path: SVGPathElement;
  ghost: SVGPathElement;
  group: SVGGElement;
  head: SVGCircleElement;
}

/** Returns null unless the whole layer is present, so callers guard once. */
function queryElements(): TrailElements | null {
  const svg = document.querySelector<SVGSVGElement>("#trail-svg");
  const path = document.querySelector<SVGPathElement>("#trail-path");
  const ghost = document.querySelector<SVGPathElement>("#trail-ghost");
  const group = document.querySelector<SVGGElement>("#trail-nodes");
  const head = document.querySelector<SVGCircleElement>("#trail-head");
  if (!svg || !path || !ghost || !group || !head) return null;
  return { svg, path, ghost, group, head };
}

/**
 * Draws a line down the page as you scroll, lighting a marker at each
 * section it passes and trailing a glint at its head.
 */
export function initTrail(): void {
  const found = queryElements();
  if (!found) return;
  // Destructured so the nested declarations below see non-nullable types:
  // narrowing does not survive into hoisted function declarations.
  const { svg, path, ghost, group, head } = found;

  const root = document.documentElement;
  let pathLength = 0;
  let nodes: TrailNode[] = [];
  let progress = 0;

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
    if (pathLength === 0) return;
    const reduced = prefersReducedMotion();

    const reach = (window.scrollY + window.innerHeight * HEAD_OFFSET) / root.scrollHeight;
    const target = reduced ? 1 : Math.min(Math.max(reach, 0.04), 1);
    progress = instant || reduced ? target : progress + (target - progress) * SMOOTHING;

    path.style.strokeDashoffset = String(pathLength * (1 - progress));
    for (const node of nodes) node.el.classList.toggle("lit", progress >= node.at);

    if (!reduced) {
      const tip = path.getPointAtLength(pathLength * progress);
      head.setAttribute("cx", String(tip.x));
      head.setAttribute("cy", String(tip.y));
      head.style.opacity = progress > 0.995 ? "0" : "1";
    }
  }

  function build(): void {
    const width = root.clientWidth;
    const docHeight = root.scrollHeight;

    svg.setAttribute("viewBox", `0 0 ${width} ${docHeight}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(docHeight));

    const marks = waypoints(width);
    if (marks.length < 2) return;

    // Synthetic endpoints so the line enters at the top and exits at the bottom.
    const points: Point[] = [{ x: width * 0.62, y: 0 }, ...marks, { x: width * 0.5, y: docHeight }];

    const d = toPathData(points);
    path.setAttribute("d", d);
    ghost.setAttribute("d", d);
    pathLength = path.getTotalLength();
    path.style.strokeDasharray = String(pathLength);

    const sampled: DOMPoint[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      sampled.push(path.getPointAtLength((pathLength * i) / SAMPLES));
    }

    group.textContent = "";
    nodes = marks.map((mark) => {
      const el = diamond(mark, NODE_RADIUS);
      group.appendChild(el);
      return { el, at: nearestFraction(sampled, mark) };
    });

    update(true);
  }

  build();

  if (prefersReducedMotion()) {
    path.style.strokeDashoffset = "0";
    for (const node of nodes) node.el.classList.add("lit");
  } else {
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
