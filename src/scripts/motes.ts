import { prefersReducedMotion } from "./motion";

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  gold: boolean;
}

const MAX_MOTES = 70;
const PX_PER_MOTE = 18;
const GOLD_SHARE = 0.35;

interface Surface {
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  ctx: CanvasRenderingContext2D;
}

function querySurface(): Surface | null {
  const canvas = document.querySelector<HTMLCanvasElement>("#motes");
  const host = canvas?.parentElement;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !host || !ctx) return null;
  return { canvas, host, ctx };
}

/** Dust drifting through moonlight, behind the hero. Purely decorative. */
export function initMotes(): void {
  if (prefersReducedMotion()) return;

  const surface = querySurface();
  if (!surface) return;
  // Destructured so the nested declarations below see non-nullable types.
  const { canvas, host, ctx } = surface;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let motes: Mote[] = [];
  let running = false;

  function resize(): void {
    width = host.offsetWidth;
    height = host.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(MAX_MOTES, Math.floor(width / PX_PER_MOTE));
    motes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.4 + Math.random() * 1.3,
      vx: (Math.random() - 0.5) * 0.1,
      vy: -(0.06 + Math.random() * 0.24),
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.018,
      gold: Math.random() < GOLD_SHARE,
    }));
  }

  function draw(): void {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);

    for (const mote of motes) {
      mote.y += mote.vy;
      mote.x += mote.vx;
      mote.phase += mote.speed;

      if (mote.y < -4) {
        mote.y = height + 4;
        mote.x = Math.random() * width;
      }
      if (mote.x < -4) mote.x = width + 4;
      else if (mote.x > width + 4) mote.x = -4;

      const alpha = (0.18 + 0.45 * (0.5 + 0.5 * Math.sin(mote.phase))).toFixed(3);
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
      ctx.fillStyle = mote.gold ? `rgba(216,179,106,${alpha})` : `rgba(198,214,230,${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  // Don't burn frames on a hero that has scrolled out of view.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      const visible = entries[0]?.isIntersecting ?? false;
      if (visible && !running) {
        running = true;
        draw();
      } else if (!visible) {
        running = false;
      }
    }).observe(host);
  } else {
    running = true;
    draw();
  }
}
