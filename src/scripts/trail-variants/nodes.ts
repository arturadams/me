import { svgEl } from "./geometry";
import type { Point } from "./types";

const NODE_RADIUS = 4.5;

export interface NodeSet {
  /** One diamond per waypoint, in document order. */
  readonly elements: readonly SVGPathElement[];
  update(progress: number): void;
}

/**
 * The diamond markers that light as the trail passes them. Deliberately
 * identical across every variant, so a comparison isolates the line itself.
 *
 * `at` holds the progress each diamond lights at, which each variant derives
 * its own way — along the path, or straight down the document.
 */
export function createNodes(
  parent: SVGElement,
  marks: readonly Point[],
  at: readonly number[],
): NodeSet {
  const group = svgEl("g", { class: "trail-nodes" });
  const elements = marks.map(({ x, y }) => {
    const r = NODE_RADIUS;
    const el = svgEl("path", {
      d: `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`,
      class: "trail-node",
    });
    group.appendChild(el);
    return el;
  });
  parent.appendChild(group);

  return {
    elements,
    update(progress) {
      for (let i = 0; i < elements.length; i++) {
        elements[i]?.classList.toggle("lit", progress >= (at[i] ?? 1));
      }
    },
  };
}
