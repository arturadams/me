const SETTLE_MS = 80;
/** Reveal anyway if `load` never fires — a stalled asset must not hide the page. */
const SAFETY_MS = 2500;

/** Flags the document as painted, releasing the hero entrance animation. */
export function initLoaded(): void {
  const mark = (): void => document.documentElement.classList.add("loaded");
  window.addEventListener("load", () => window.setTimeout(mark, SETTLE_MS));
  window.setTimeout(mark, SAFETY_MS);
}
