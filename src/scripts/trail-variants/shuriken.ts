import { fractionsAlong, svgEl, toArcPath } from "./geometry";
import { createNodes, type NodeSet } from "./nodes";
import type { TrailVariant } from "./types";

/** The crest shuriken, in its own 400-unit box centred on 200,200. */
const CREST = "M200 74 L222 178 L326 200 L222 222 L200 326 L178 222 L74 200 L178 178 Z";
const BLADE_SCALE = 0.1;

/** Blade sunk in a waypoint: a hard stop, then the shaft rings itself out. */
const RECOIL: Keyframe[] = [
  { transform: "rotate(0deg) scale(1)" },
  { transform: "rotate(-13deg) scale(1.22)", offset: 0.18 },
  { transform: "rotate(9deg) scale(0.94)", offset: 0.45 },
  { transform: "rotate(-4deg) scale(1.05)", offset: 0.72 },
  { transform: "rotate(0deg) scale(1)" },
];

/**
 * The line is not there until something puts it there: a shuriken travels the
 * page and the trail is what it leaves behind.
 *
 * The waypoints are joined by arcs bowed out sideways rather than the
 * baseline's vertical-tangent curves, because a thrown blade overshoots and
 * comes back rather than easing from one point to the next.
 */
export function createShuriken(): TrailVariant {
  let group: SVGGElement | null = null;
  let path: SVGPathElement | null = null;
  let blade: SVGGElement | null = null;
  let recoil: SVGGElement | null = null;
  let nodes: NodeSet | null = null;
  let at: number[] = [];
  let struck: boolean[] = [];
  let length = 0;
  let reduced = false;

  return {
    build(ctx) {
      const g = svgEl("g", { class: "trail-variant trail-variant-shuriken" });
      const d = toArcPath(ctx.points, 0.14);

      g.appendChild(svgEl("path", { d, class: "trail-ghost" }));
      path = svgEl("path", { d, class: "trail-stroke" });
      g.appendChild(path);
      ctx.svg.appendChild(g);
      group = g;

      length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      at = fractionsAlong(path, ctx.marks);
      struck = ctx.marks.map(() => false);
      nodes = createNodes(g, ctx.marks, at);

      // Three nested groups because three transforms have to compose without
      // overwriting each other: the position is set per frame as an attribute,
      // the recoil is a one-shot, and the spin runs off in CSS.
      blade = svgEl("g", { class: "trail-blade", transform: "translate(-99 -99)" });
      recoil = svgEl("g", { class: "trail-blade-recoil" });
      const spin = svgEl("g", { class: "trail-blade-spin" });
      const art = svgEl("g", { transform: `scale(${BLADE_SCALE}) translate(-200 -200)` });
      art.appendChild(svgEl("path", { d: CREST, class: "blade-star" }));
      art.appendChild(svgEl("circle", { cx: "200", cy: "200", r: "13", class: "blade-hub" }));
      spin.appendChild(art);
      recoil.appendChild(spin);
      blade.appendChild(recoil);
      g.appendChild(blade);

      reduced = ctx.reduced;
      if (reduced) blade.style.display = "none";
    },

    update(progress) {
      if (!path || length === 0) return;
      path.style.strokeDashoffset = String(length * (1 - progress));
      nodes?.update(progress);

      for (let i = 0; i < at.length; i++) {
        const hit = progress >= (at[i] ?? 1);
        if (hit === struck[i]) continue;
        struck[i] = hit;
        nodes?.elements[i]?.classList.toggle("struck", hit);
        // Only on the way down: scrolling back up un-lights nodes, and having
        // the blade flinch in reverse would look like a glitch. The Web
        // Animations API sits outside the CSS reduced-motion kill switch, so
        // this one has to opt out by hand.
        if (hit && !reduced) recoil?.animate(RECOIL, { duration: 420, easing: "ease-out" });
      }

      if (blade) {
        const tip = path.getPointAtLength(length * progress);
        blade.setAttribute("transform", `translate(${tip.x} ${tip.y})`);
        blade.style.opacity = progress > 0.995 ? "0" : "1";
      }
    },

    destroy() {
      group?.remove();
      group = null;
      path = null;
      blade = null;
      recoil = null;
      nodes = null;
      at = [];
      struck = [];
      length = 0;
    },
  };
}
