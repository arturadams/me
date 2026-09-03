import { prefersReducedMotion } from "./motion";

const WORD = "ninja";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable;
}

interface Egg {
  panel: HTMLElement;
  close: HTMLButtonElement;
  smoke: HTMLElement;
}

function queryEgg(): Egg | null {
  const panel = document.querySelector<HTMLElement>("#scroll-panel");
  const close = document.querySelector<HTMLButtonElement>("#scroll-close");
  const smoke = document.querySelector<HTMLElement>("#smoke");
  if (!panel || !close || !smoke) return null;
  return { panel, close, smoke };
}

/** Type the domain and a hidden panel appears. Keyboard-only by design. */
export function initEasterEgg(): void {
  const egg = queryEgg();
  if (!egg) return;
  // Destructured so the nested declarations below see non-nullable types.
  const { panel, close, smoke } = egg;

  let typed = "";
  let lastFocused: HTMLElement | null = null;

  function open(): void {
    if (!panel.hidden) return;

    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!prefersReducedMotion()) {
      smoke.classList.remove("puff");
      void smoke.offsetWidth; // reflow, so the animation restarts
      smoke.classList.add("puff");
    }

    panel.hidden = false;
    close.focus();
  }

  function dismiss(): void {
    if (panel.hidden) return;
    panel.hidden = true;
    lastFocused?.focus();
  }

  close.addEventListener("click", dismiss);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      dismiss();
      return;
    }
    if (isTyping(event.target)) return;
    if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;

    typed = (typed + event.key.toLowerCase()).slice(-WORD.length);
    if (typed === WORD) {
      typed = "";
      open();
    }
  });
}
