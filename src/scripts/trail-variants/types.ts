export interface Point {
  x: number;
  y: number;
}

/** Everything a variant needs to draw itself. Rebuilt whenever the layout moves. */
export interface TrailContext {
  /** The layer's own SVG, sized to the document. Variants own its children. */
  svg: SVGSVGElement;
  /** One point per [data-trail] section, in document order. */
  marks: readonly Point[];
  /** `marks` plus the synthetic entry and exit points, so the line spans the page. */
  points: readonly Point[];
  width: number;
  height: number;
  /** Read at build time; a variant must render a static end state when true. */
  reduced: boolean;
}

export interface TrailVariant {
  /** Draw into `ctx.svg`. Called once per build, always after a `destroy()`. */
  build(ctx: TrailContext): void;
  /** Scrub to `progress`, 0–1. Called from the shared rAF loop — no layout reads. */
  update(progress: number): void;
  /** Remove everything `build` added. Must be safe to call before any build. */
  destroy(): void;
}
