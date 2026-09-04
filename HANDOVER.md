# Handover — trail variants

**Branch:** `trail-variants` (cut from `main` at the Astro port commit)
**Goal:** prototype 2–4 alternative treatments of the scroll-drawn line, so Artur can compare them side by side and pick one. Nothing else about the design changes.

Read `PLAN.md` for how the project got here and `README.md` for conventions. This file covers only the trail.

---

## What the trail is today

A single gold line drawn down the whole document as you scroll, with a diamond marker lighting at each section it passes and a pale steel glint travelling at its head. Metaphor: one continuous line of responsibility — it's the site's signature element and the hero CTA ("Follow the trail") refers to it.

Three files:

| File | Role |
|---|---|
| `src/components/TrailLayer.astro` | The SVG layer + its global CSS. Lives in `Base.astro`, so it spans the document. |
| `src/scripts/trail.ts` | All the geometry and the scroll loop. 188 lines. |
| `src/components/Section.astro` | Passes `trail` / `trailX` props through as `data-*` attributes. |

**How it builds.** `trail.ts` collects every `[data-trail]` element, reads `data-trail` (fraction down that element, 0–1) and `data-trail-x` (fraction across the viewport, 0–1), and produces a point per element. It prepends `{x: 62% , y: 0}` and appends `{x: 50%, y: docHeight}` so the line enters at the top and exits at the bottom, then joins them with vertical-tangent cubic béziers.

**How it animates.** `strokeDasharray` is the full path length; `strokeDashoffset` is scrubbed from scroll position, eased toward the target at `SMOOTHING = 0.1` in a `requestAnimationFrame` loop. The head glint is positioned with `getPointAtLength(len * progress)`. Nodes are pre-sampled (260 points) to find each waypoint's fraction along the path, then get `.lit` when progress passes them.

**The seven waypoints** (in document order):

```
Hero      0.15 / 0.80      Kit       0.50 / 0.08
Craft     0.40 / 0.10      Way       0.50 / 0.88
Work      0.50 / 0.90      Quote     0.50 / 0.50
                           Contact   0.55 / 0.14
```

They zig-zag deliberately — left, right, left, right — so the line crosses the page rather than running straight down.

---

## What to try

Build these as *alternatives*, not replacements. Keep the current one as the baseline to compare against.

**1. Katana slashes.** Discrete diagonal strokes instead of one continuous line — one per section, each appearing fast and fading slowly, like cuts left in the page.

The hard part is taper: SVG strokes are uniform width, so a convincing slash needs a **filled closed path** built from a centreline with a varying half-width (fat in the middle, zero at both tips), not `stroke`. Compute offset points either side of the centreline and close the shape. Alternatively stack 3–4 strokes of decreasing width and length with a mask, which is cheaper but reads flatter.

Note the copy implication: discrete slashes break the "one continuous line" metaphor. If this wins, the hero CTA "Follow the trail" and possibly the Craft section's "one continuous line of responsibility" need rewording. Flag it rather than silently changing the copy.

**2. Shuriken trajectory.** A shuriken glyph travels the path and *leaves* the line behind it, rather than a glint riding a line that's already there. Spin it with a CSS animation on a `<g>`; use the existing crest shuriken path from `src/components/Crest.astro` as the shape. Consider arcs between waypoints instead of the current vertical-tangent béziers — a thrown blade travels ballistically, not in smooth S-curves. Optional flourish: it "sticks" at each waypoint with a short wobble before continuing.

**3. Ink brush stroke.** Apply the existing `url(#brush)` displacement filter (already defined in `src/components/SvgDefs.astro`, used by the enso) to the trail so it reads as a sumi-e stroke rather than a drafting line. Cheapest of the three to try — largely a CSS/filter change plus stroke-width variation. Worth doing first as a warm-up.

**4. Free slot.** Grappling line (taut straight segments with anchor points), chain/kusarigama links, or a trail that dissolves behind the head instead of persisting. Artur's call — don't build all of these.

---

## Suggested approach: make it pluggable

Rather than four branches, refactor `trail.ts` so the geometry and the render are separable, and select a variant at runtime:

```ts
export interface TrailVariant {
  name: string;
  build(points: Point[], svg: SVGSVGElement): void;
  update(progress: number): void;   // progress 0–1
  destroy(): void;
}
```

Keep the existing waypoint collection, path sampling and scroll loop as shared machinery — that code is sound and worth preserving. Then `?trail=katana` in the URL (falling back to the default) lets Artur flip between them on one deploy without rebuilding. That is the fastest path to a decision, and the switch is trivial to delete afterwards.

If that refactor looks like it'll cost more than the prototypes themselves, don't force it — three throwaway modules and a hardcoded import is fine for a comparison.

---

## Constraints — all of these are non-negotiable

- **`prefers-reduced-motion`.** Every variant needs a static end state and must not start a `rAF` loop. `prefersReducedMotion()` is in `src/scripts/motion.ts`. Check it at call time, not module load.
- **Purely decorative.** The layer is `aria-hidden="true"` and must stay that way. It carries no information a screen reader needs.
- **`pointer-events: none`** on the whole layer. It sits behind content (`#trail-wrap` is `z-index: 0`, `main` is `z-index: 1`) and must never intercept a click.
- **No new dependencies.** No animation libraries. This is hand-written SVG and rAF, and that's part of the point.
- **Survive layout changes.** Document height shifts after fonts load and on resize. `trail.ts` already handles this with a debounced rebuild on `resize`, `load`, and a `ResizeObserver` on `document.body`. Keep it.
- **One rAF loop.** Don't add a second. Don't read layout inside it (`getBoundingClientRect` in the loop will thrash).
- **Palette discipline.** Gold `--color-gold` is the single accent; steel `--color-blade` is used sparingly for edges only. A slash is *not* an excuse for red.

---

## Working notes

```bash
npm run dev        # localhost:4321
npm run build && npm run preview
npm run check      # astro check — must be 0 errors
npm run lint       # biome ci . — must be clean
```

Gotchas already paid for, don't rediscover them:

- **Never open `dist/index.html` from disk.** Assets are referenced absolutely (`/_astro/…`), so `file://` gives you an unstyled page. Always serve it.
- **A class crossing a component boundary must be global.** Astro tags elements with the hash of the component that *renders* them, so a parent styling a child's root element silently fails to match. Cost us a broken `.fade-up` once. `TrailLayer.astro` already uses `<style is:global>` because the nodes are script-created and scoping hashes can't reach them.
- **`typescript` is pinned to `^6`.** TS 7's native compiler dropped the API `astro check` needs. Don't "helpfully" upgrade it.
- **Biome only parses `.astro` frontmatter**, so its unused-import rules are off for those files. `astro check` is the real check.
- **Verify file encoding before committing.** The editor integration silently re-encoded `README.md` to UTF-16 once. `python3 -c "print(b'\x00' in open('FILE','rb').read())"` should print `False`.

---

## Done looks like

- 2–3 variants working on this branch, each reachable without a rebuild.
- `npm run check` and `npm run lint` clean; `npm run build` succeeds.
- Each variant verified at desktop and mobile widths, and with reduced-motion on.
- A short section appended to this file: what each variant feels like, what it cost in JS bytes, and a recommendation. Screenshots if you can produce them.
- **Nothing merged.** Artur picks. Leave `main` untouched.

## Out of scope

The placeholder content — Ledgerline / Sawmill / Marchetaria and the invented "Marina Duarte" testimonial — is a known launch blocker tracked in `PLAN.md`. Don't fix it here, and don't build a variant that depends on the number of sections staying at seven.
