import { fractionsAlong, svgEl, toSmoothPath } from "./geometry";
import { createNodes, type NodeSet } from "./nodes";
import type { TrailVariant } from "./types";

/**
 * The baseline: one gold line drawn down the whole document, a dashed ghost
 * showing where it will go, and a steel glint riding its head.
 */
export function createLine(): TrailVariant {
  let group: SVGGElement | null = null;
  let path: SVGPathElement | null = null;
  let head: SVGCircleElement | null = null;
  let nodes: NodeSet | null = null;
  let length = 0;

  return {
    build(ctx) {
      const g = svgEl("g", { class: "trail-variant trail-variant-line" });
      const d = toSmoothPath(ctx.points);

      g.appendChild(svgEl("path", { d, class: "trail-ghost" }));
      path = svgEl("path", { d, class: "trail-stroke" });
      g.appendChild(path);
      ctx.svg.appendChild(g);
      group = g;

      length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      nodes = createNodes(g, ctx.marks, fractionsAlong(path, ctx.marks));

      head = svgEl("circle", { class: "trail-head", r: "3.4", cx: "-99", cy: "-99" });
      g.appendChild(head);
    },

    update(progress) {
      if (!path || length === 0) return;
      path.style.strokeDashoffset = String(length * (1 - progress));
      nodes?.update(progress);

      if (head) {
        const tip = path.getPointAtLength(length * progress);
        head.setAttribute("cx", String(tip.x));
        head.setAttribute("cy", String(tip.y));
        head.style.opacity = progress > 0.995 ? "0" : "1";
      }
    },

    destroy() {
      group?.remove();
      group = null;
      path = null;
      head = null;
      nodes = null;
      length = 0;
    },
  };
}
