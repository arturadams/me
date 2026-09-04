import { svgEl, taperedSlash } from "./geometry";
import { createNodes, type NodeSet } from "./nodes";
import type { Point, TrailVariant } from "./types";

/** Steeper than this and a slash stops reading as a cut and starts reading as a line. */
const MAX_SLOPE = Math.tan((62 * Math.PI) / 180);

/**
 * The direction of the cut through a waypoint: the chord the trail arrives on,
 * flattened so it never stands up too near vertical.
 *
 * Arrival, not the span from the previous waypoint to the next — the waypoints
 * zig-zag, so at every second one the previous and next sit at nearly the same
 * x and their chord is vertical. Arrival alternates cleanly left and right.
 */
function angleAt(from: Point, to: Point): number {
  const dx = to.x - from.x || 0.001;
  const dy = to.y - from.y;
  const flattened = Math.sign(dy) * Math.min(Math.abs(dy), Math.abs(dx) * MAX_SLOPE);
  return (Math.atan2(flattened, dx) * 180) / Math.PI;
}

interface Slash {
  group: SVGGElement;
  /** Progress at which this cut lands. */
  at: number;
}

/**
 * Discrete cuts instead of one line: a slash through each section, landing
 * fast and fading slowly, like marks left in the page.
 *
 * Each slash is a filled closed path, not a stroke — a stroke is uniform width
 * and would read as a stick. The outline is a centreline with a half-width that
 * falls to zero at both tips, so the shape has a belly and points.
 */
export function createKatana(): TrailVariant {
  let group: SVGGElement | null = null;
  let slashes: Slash[] = [];
  let nodes: NodeSet | null = null;

  return {
    build(ctx) {
      const g = svgEl("g", { class: "trail-variant trail-variant-katana" });
      const length = Math.min(ctx.width * 0.78, 620);
      const d = taperedSlash(length, length * 0.01, length * 0.045);

      slashes = ctx.marks.map((mark, i) => {
        // marks[i] is points[i + 1], so points[i] is what the trail arrives from.
        const from = ctx.points[i] ?? mark;
        const slash = svgEl("g", {
          class: "katana-slash",
          // Placed on the waypoint, turned along the cut, then pulled back so
          // the waypoint sits mid-blade rather than at the entry tip.
          transform: `translate(${mark.x} ${mark.y}) rotate(${angleAt(from, mark).toFixed(2)}) translate(${(-length / 2).toFixed(1)} 0)`,
        });
        slash.appendChild(svgEl("path", { d, class: "katana-cut" }));
        // The edge itself, following the same spine: a flash that outlives
        // nothing. Steel is the only place the blade colour earns its keep.
        slash.appendChild(
          svgEl("path", {
            d: `M0 0 Q ${(length / 2).toFixed(1)} ${(-length * 0.09).toFixed(1)}, ${length.toFixed(1)} 0`,
            class: "katana-edge",
          }),
        );
        g.appendChild(slash);
        return { group: slash, at: mark.y / ctx.height };
      });

      ctx.svg.appendChild(g);
      group = g;
      nodes = createNodes(
        g,
        ctx.marks,
        slashes.map((s) => s.at),
      );
    },

    update(progress) {
      for (const slash of slashes) slash.group.classList.toggle("cut", progress >= slash.at);
      nodes?.update(progress);
    },

    destroy() {
      group?.remove();
      group = null;
      slashes = [];
      nodes = null;
    },
  };
}
