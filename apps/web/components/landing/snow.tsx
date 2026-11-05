"use client";

import { useEffect, useRef } from "react";

type Flake = {
  x: number;
  y: number;
  r: number;
  vy: number;
  a: number;
  p: number;
  s: number;
};

type Range = readonly [number, number];

type SnowConfig = {
  /** One flake per this many pixels of canvas width, capped at `max`. */
  spacing: number;
  max: number;
  /** Radius in px, fall speed in px per frame, and opacity. */
  size: Range;
  speed: Range;
  alpha: Range;
  /** Fade flakes in over this many px at the top and out at the bottom. */
  fadeTop: number;
  fadeBottom: number;
  /** Spawn most flakes near the left and right edges (around the hero trees). */
  edges?: boolean;
};

const HERO: SnowConfig = {
  spacing: 11,
  max: 130,
  size: [0.6, 2.4],
  speed: [0.25, 0.7],
  alpha: [0.25, 0.7],
  fadeTop: 0,
  fadeBottom: 160,
  edges: true,
};

// Sparser, smaller and fainter than the hero, so it never competes with section text.
const NIGHT: SnowConfig = {
  spacing: 22,
  max: 70,
  size: [0.5, 1.8],
  speed: [0.2, 0.55],
  alpha: [0.15, 0.5],
  fadeTop: 120,
  fadeBottom: 120,
};

const between = ([lo, hi]: Range) => lo + Math.random() * (hi - lo);

function SnowCanvas({ config, id }: { config: SnowConfig; id?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];
    let frame = 0;
    let running = false;

    const spawnX = () => {
      if (!config.edges) return Math.random() * w;
      const side = Math.random();
      if (side < 0.42) return Math.random() * w * 0.3;
      if (side < 0.84) return w - Math.random() * w * 0.3;
      return Math.random() * w;
    };

    const make = (y: number): Flake => ({
      x: spawnX(),
      y,
      r: between(config.size),
      vy: between(config.speed),
      a: between(config.alpha),
      p: Math.random() * 6.28,
      s: Math.random() * 0.4 + 0.15,
    });

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(config.max, Math.round(w / config.spacing));
      flakes = Array.from({ length: count }, () => make(Math.random() * h));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const color =
        document.documentElement.getAttribute("data-theme") === "light"
          ? "rgba(120, 150, 190,"
          : "rgba(232, 243, 255,";
      for (const f of flakes) {
        f.p += 0.01;
        f.y += f.vy;
        f.x += Math.sin(f.p) * f.s;
        if (f.y > h) Object.assign(f, make(-4));
        let fade = 1;
        if (config.fadeBottom)
          fade = Math.min(fade, (h - f.y) / config.fadeBottom);
        if (config.fadeTop) fade = Math.min(fade, f.y / config.fadeTop);
        if (fade <= 0) continue;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 6.28);
        ctx.fillStyle = `${color}${f.a * fade})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    // Animate only while the canvas is on screen, and re-measure only when its own size changes
    // (a window resize listener would also fire when a mobile URL bar slides away).
    const visibility = new IntersectionObserver(([entry]) =>
      entry?.isIntersecting ? start() : stop(),
    );
    const sizing = new ResizeObserver(resize);
    resize();
    sizing.observe(canvas);
    visibility.observe(canvas);
    return () => {
      stop();
      visibility.disconnect();
      sizing.disconnect();
    };
  }, [config]);

  return <canvas id={id} ref={canvasRef} aria-hidden="true" />;
}

// Gentle snowfall around the hero trees. A CSS mask keeps it away from the centre text.
export function HeroSnow() {
  return <SnowCanvas config={HERO} id="heroSnow" />;
}

// Light snowfall behind every section below the hero. The canvas is sticky inside a wrapper
// that spans the whole night background, so it stays in view without ever covering the hero.
export function NightSnow() {
  return (
    <div className="night-snow" aria-hidden="true">
      <SnowCanvas config={NIGHT} />
    </div>
  );
}
