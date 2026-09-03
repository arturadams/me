# Plan — artur.ninja portfolio

Working document. Decisions, tradeoffs, and reasoning. Delete or gitignore before the repo goes public if you'd rather not ship the scaffolding.

> **Status: decided and built.** Astro + Tailwind + GitHub Actions, per the answers below.
> D2 went to Tailwind rather than the dependency-free recommendation — see the note in that section.
> What actually got built is described in `README.md`; what is still outstanding is at the bottom of this file.

## Where we are

- `v5-kage-shinobi.html` — 1,074 lines, 50 KB, one file, zero external requests. Design is done and I think it's good. Structure is not.
- Deploy today: GitHub Pages, `gh-pages` branch, `CNAME` → `www.artur.ninja`.
- The page is ~95% static content with exactly two interactive pieces: the scroll-drawn trail (SVG) and the drifting motes (Canvas).

The problem you named: as a *dev* portfolio, the repo is read as evidence. One giant HTML file says "can't be bothered" even when the output is strong.

---

## D1 — Framework

| Option | Cost | What a reviewer reads |
|---|---|---|
| **Astro** | New-ish tool to you; `.astro` templating to learn | "Picked the tool that matches the problem. Ships no JS it doesn't need." |
| Next.js + `output: 'export'` | Ships a React runtime for a page that needs none of it; export mode disables half of what Next is for | "Reached for the default." Defensible, not impressive |
| Vite + TS, no framework | No component model for markup — you hand-roll partials or add a template lib | "Knows bundlers." Doesn't demonstrate architecture |
| 11ty | Fewer people will recognise the choice | Fine, quieter signal |

**Recommendation: Astro.**

Reasoning: this page is the exact shape Astro's islands model was built for — static shell, two hydrated bits. It gives a real component boundary, TypeScript out of the box, and static output that drops onto Pages unchanged. The judgment itself is the signal: choosing *less* framework than you could is a stronger flex than choosing more.

Note on your stack keywords (React/Next/Tailwind): Astro renders React islands natively. If you want React visible in the source, we author the trail/motes islands as `.tsx` and get both signals — "knows React" and "knows when not to ship it." I'd still keep them as vanilla TS modules, since neither needs a component tree.

## D2 — Styling

| Option | Cost | Notes |
|---|---|---|
| **Astro scoped styles + token layer** | None — built in, zero deps | Component `<style>` blocks are scoped automatically; tokens and resets in `@layer` |
| Tailwind v4 | Extra dep; the interesting 40% still lands in a raw CSS layer | Matches your CV keywords; noisier markup |
| CSS Modules | Extra config in Astro for no gain over its native scoping | Redundant here |

**Recommendation: Astro scoped styles + a `tokens.css` / `base.css` global layer.**

Reasoning: the design is carried by things utilities don't express — `background-clip: text` sheen, the SVG brush/turbulence filters, `mask-image` on the creed lattice, the enso dash-offset draw, canvas. Under Tailwind those all stay hand-written anyway, so you'd pay a dependency to utility-ify the easy half. Adding zero dependencies to a design this custom is the defensible call.

**Decided: Tailwind v4.** How it actually shook out, so the split is intentional rather than accidental:

- `@theme` in `src/styles/global.css` is the single source of truth for palette, type and motion. Tokens become both utilities (`text-gold`, `font-jp`, `animate-sheen`) and plain CSS variables, so scoped component CSS reads `var(--color-gold)` and can never drift from the utility classes.
- Utilities carry structure in markup: grids, flex, spacing, z-index, the skip link.
- Component-scoped `<style>` carries the effects — pseudo-elements, `-webkit-text-stroke`, `mask-image`, the flex `order` trick in `Eyebrow`, hover choreography. Written as plain CSS against the theme variables, deliberately **not** `@apply`: under Tailwind v4 each scoped block would need a `@reference` import to resolve `@apply`, which buys nothing here.
- Two things are global rather than scoped (`gilt`, `wrap` as `@utility`; `.reveal` / `.fade-up` in `@layer base`) because they cross component boundaries. That is a real constraint, not a style preference — see the note in D6.

Cost paid: ~31 KB of uncompressed CSS where hand-rolled would have been ~12 KB. Gzipped the gap is small, and it buys the token system and the utility vocabulary.

## D3 — Content as data

Right now every project, tenet, kit item and process step is hardcoded markup. That's the actual architectural weakness — worse than the file length.

**Recommendation:** Astro **content collections** with `zod` schemas for `projects`, plus typed data modules for the smaller lists (tenets, kit, process).

Reasoning: adding a project becomes a validated data edit, not a markup edit. Typos fail the build instead of the page. This is the part of the restructure that actually reads as engineering, and it costs about 40 lines.

## D4 — Deployment

**Recommendation:** GitHub Actions builds from `main`, publishes via `actions/deploy-pages`. Retire the `gh-pages` branch. `CNAME` moves to `public/CNAME` so the build preserves it.

Reasoning: a build step means the current "commit the artifact to a branch" flow stops working. One workflow file, and `main` becomes the only source of truth.

## D5 — Quality gates

Proportionality matters here — the same instinct that killed the colophon applies. A landing page with a twelve-job CI matrix is trying too hard.

**Recommendation:** TypeScript `strict`, **Biome** (one dep, replaces ESLint + Prettier), and a single CI job running `biome ci` + `astro check` + `astro build`.

Optional, your call: a Lighthouse CI budget asserting 100/100/100/100. Tempting because this page will actually hit it — but it's also the kind of thing that looks like point-scoring. Lean no.

## D6 — Interactive code

**Recommendation:** three small typed modules — `trail.ts`, `motes.ts`, `reveal.ts` (reveals + counters + easter egg) — each exporting an `init()` that no-ops under `prefers-reduced-motion`, loaded with `<script>` in the components that own them so Astro bundles them per-island.

Reasoning: the current IIFE does six unrelated jobs in one closure. Splitting it is the cheapest legibility win in the whole restructure.

**Built as seven, not three.** Bundling reveals + counters + the easter egg into one `reveal.ts` would have reproduced the original problem at smaller scale — three unrelated jobs sharing a closure. Final set: `motion` (the shared reduced-motion predicate), `loaded`, `reveal`, `counters`, `enso`, `motes`, `trail`, `easter-egg`. Total shipped JS is 6.4 KB across 7 chunks, because each component imports only what it needs.

Two things worth knowing for future edits:

1. **Scope boundaries are a real constraint.** A parent applying a class to a child component's root element hits the child's scope hash, not its own, so the parent's scoped rule silently never matches. This bit `.fade-up` (applied by `Hero` to `Eyebrow`) — the hero eyebrow rendered without its entrance animation until it was moved to the global layer. If a class crosses a component boundary, it must be global.
2. **`astro check` needs TypeScript 6.x.** TS 7's native compiler dropped the programmatic API the Astro language server uses, so `typescript` is pinned to `^6` in devDependencies. Revisit when [withastro/roadmap#1321](https://github.com/withastro/roadmap/discussions/1321) lands.

---

## Rejected

**On-page colophon / ADR files — dropped.** Your reasoning, and I agree: documenting the architecture of a simple landing page has the opposite of the intended effect. It over-explains something that should be self-evidently easy, and invites the reader to scrutinise decisions that carry no weight. The build quality should be inferred from the repo, not narrated on the page. (This file is a working doc, not that.)

---

## Structure as built

```
astro.config.mjs           # Tailwind as a Vite plugin; site URL for canonical
biome.json                 # + override: Biome only parses .astro frontmatter,
tsconfig.json              #   so its unused-import rules are off for .astro
public/CNAME
src/
  content.config.ts        # zod schema for projects
  content/projects/*.md    # one file per project
  data/{site,tenets,kit,process,stats}.ts
  layouts/Base.astro       # head, meta, JSON-LD, skip link, svg defs, trail layer
  components/
    SiteHeader  Hero  Crest  Eyebrow  Section  SectionTitle  Lattice
    Craft  Creed  Work  ProjectRow  Kit  Way  Quote  Contact
    SvgDefs  TrailLayer  EasterEgg
  scripts/{motion,loaded,reveal,counters,enso,motes,trail,easter-egg}.ts
  styles/global.css        # @theme tokens + base layer + cross-boundary utilities
  pages/index.astro        # 26 lines
.github/workflows/deploy.yml
```

`Section` and `SectionTitle` were not in the original sketch; they absorb the repeated
`section.block` shell (trail waypoint attributes, `wrap`, ghost-kanji watermark, sibling
border) that would otherwise have been copy-pasted five times.

## Steps

1. ~~Scaffold Astro + TS strict + Biome; `public/CNAME`.~~ Done.
2. ~~Port CSS to the Tailwind theme + component-scoped styles.~~ Done.
3. ~~Split markup into components; `index.astro` becomes a readable outline.~~ Done — it is 26 lines.
4. ~~Extract content to collections + data modules.~~ Done.
5. ~~Split the IIFE into typed modules.~~ Done — seven, see D6.
6. ~~Actions workflow; verify build output matches the current page.~~ Done. **Retiring `gh-pages` is not done** — see below.
7. Delete `v5-kage-shinobi.html` and `v4-kin-night-lacquer.html` once parity is confirmed. **Not done** — see below.

Nothing about the design changes. This was a move, not a redesign.

Parity verified against the single-file original: same 7 trail waypoints, same 23 `lang="ja"` spans, all element ids and `url(#…)` references resolve, one `h1`, skip link, JSON-LD and canonical intact, `CNAME` lands in `dist/`, zero external resource requests.

---

## Still outstanding

**1. `gh-pages` is still the live branch.** The workflow is committed but nothing has run. Switching over needs, in order: push to `main`, set Pages source to "GitHub Actions" in repo settings, confirm the deploy is green, then delete the `gh-pages` branch. Until that happens the live site is unchanged. This is a hands-on-the-repo step, deliberately not automated here.

**2. The legacy HTML files are still in place** — `index.html` (the old artur.cool contact page, tracked in git) and `v4-kin-night-lacquer.html` / `v5-kage-shinobi.html` (both **untracked**, so deleting them is unrecoverable). Astro ignores all three; they only affect tidiness. They are excluded in `biome.json` so CI passes — remove those exclusions when the files go.

**3. Placeholder content — the real blocker.** The page ships invented work: **Ledgerline / Sawmill / Marchetaria**, their metrics, and a testimonial attributed to **"Marina Duarte, CTO, Ledgerline"**, a person who does not exist. Fine as layout filler; a liability on a live site under your name and real email. Replace with real work before anything points at `www.artur.ninja`. Projects now live in `src/content/projects/*.md` — one file each, schema-validated, so this is a content edit rather than a markup edit.

## Answered

1. **D1 Astro** — chosen.
2. **D2 Tailwind** — chosen over the dependency-free recommendation; the split that resulted is documented in D2.
3. **D4 Actions** — chosen, workflow written, cutover still manual (see above).
