import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
// `z` re-exported from astro:content is deprecated; astro/zod is the path the
// generated collection types resolve against, so schemas stay in sync.
import { z } from "astro/zod";

/**
 * Projects are the only content that changes often, so they are the only
 * thing that gets a file-per-entry collection. A typo in the frontmatter
 * fails the build instead of the page.
 */
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string().min(1),
    /** Kanji numeral used as the oversized watermark on hover. */
    numeral: z.string().length(1),
    year: z.number().int().gte(2000).lte(2100),
    /** Ascending display order. Lower comes first. */
    order: z.number().int().nonnegative(),
    outcome: z.object({
      value: z.string().min(1),
      label: z.string().min(1),
    }),
    tags: z.array(z.string().min(1)).min(1).max(6),
  }),
});

export const collections = { projects };
