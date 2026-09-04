import { svgEl, toSmoothPath } from "./geometry";
import { createNodes, type NodeSet } from "./nodes";
import type { TrailVariant } from "./types";

/**
 * Brush pressure across the stroke: loaded at the top, drying downward, with a
 * slow breathe so no two segments carry the same weight. 0–1.1.
 */
function pressure(i: number, count: number): number {
  const t = count > 1 ? i / (count - 1) : 0;
  return Math.min(1.1, Math.max(0.18, 1 - 0.55 * t + 0.22 * Math.sin(i * 2.1)));
}

interface Segment {
  el: SVGPathElement;
  /** Distance from the start of the whole trail to this segment's first point. */
  start: number;
  length: number;
  offset: number;
}

/**
 * The same geometry as the baseline, painted as a sumi-e stroke: the existing
 * `url(#brush)` displacement filter, over a stroke whose weight varies from
 * segment to segment as if the brush were drying.
 *
 * Drawn as one path per segment rather than one path for the trail. A filtered
 * element re-runs its filter whenever it changes, and re-displacing a stroke
 * the height of the whole document every frame is not affordable — this way
 * only the segment under the head is ever dirty, and the completed and pending
 * ones stay cached.
 */
export function createInk(): TrailVariant {
  let group: SVGGElement | null = null;
  let segments: Segment[] = [];
  let head: SVGCircleElement | null = null;
  let nodes: NodeSet | null = null;
  let total = 0;

  return {
    build(ctx) {
      const g = svgEl("g", { class: "trail-variant trail-variant-ink" });

      // The paper stain: where the stroke will go, laid down once and never
      // touched again, so its filter result stays cached.
      g.appendChild(svgEl("path", { d: toSmoothPath(ctx.points), class: "ink-wash" }));

      const count = ctx.points.length - 1;
      const reach: number[] = [0];
      segments = [];

      for (let i = 0; i < count; i++) {
        const from = ctx.points[i];
        const to = ctx.points[i + 1];
        if (!from || !to) continue;

        const p = pressure(i, count);
        const el = svgEl("path", {
          d: toSmoothPath([from, to]),
          class: "ink-stroke",
          "stroke-width": (1.0 + 2.6 * p).toFixed(2),
          opacity: (0.45 + 0.42 * p).toFixed(2),
        });
        g.appendChild(el);

        const length = el.getTotalLength();
        el.style.strokeDasharray = String(length);
        el.style.strokeDashoffset = String(length);
        segments.push({ el, start: total, length, offset: length });
        total += length;
        reach.push(total);
      }

      ctx.svg.appendChild(g);
      group = g;
      if (total === 0) return;

      // Waypoint k is points[k + 1], so its distance along the trail is
      // already known — no need to walk the path looking for it.
      nodes = createNodes(
        g,
        ctx.marks,
        ctx.marks.map((_, k) => (reach[k + 1] ?? total) / total),
      );

      head = svgEl("circle", { class: "trail-head ink-tip", r: "5.2", cx: "-99", cy: "-99" });
      g.appendChild(head);
    },

    update(progress) {
      if (total === 0) return;
      const walked = total * progress;

      for (const segment of segments) {
        const local = Math.min(Math.max((walked - segment.start) / segment.length, 0), 1);
        const offset = segment.length * (1 - local);
        // Writing an unchanged offset would dirty a segment whose filter is
        // already cached, which is the cost this variant exists to avoid.
        if (Math.abs(offset - segment.offset) < 0.01) continue;
        segment.offset = offset;
        segment.el.style.strokeDashoffset = String(offset);
      }

      nodes?.update(progress);

      if (head) {
        const active = segments.find((s) => walked < s.start + s.length) ?? segments.at(-1);
        if (active) {
          const tip = active.el.getPointAtLength(
            Math.min(Math.max(walked - active.start, 0), active.length),
          );
          head.setAttribute("cx", String(tip.x));
          head.setAttribute("cy", String(tip.y));
        }
        head.style.opacity = progress > 0.995 ? "0" : "1";
      }
    },

    destroy() {
      group?.remove();
      group = null;
      segments = [];
      head = null;
      nodes = null;
      total = 0;
    },
  };
}
