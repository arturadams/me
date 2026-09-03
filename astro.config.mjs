// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.artur.ninja",
  // Tailwind v4 is a Vite plugin — there is no Astro integration to add.
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    // one page, one stylesheet: no point splitting it across route chunks
    inlineStylesheets: "auto",
  },
});
