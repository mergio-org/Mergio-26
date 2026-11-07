import type { CSSProperties } from "react";
import { timeline } from "@/lib/content";
import { SectionHead } from "./section-head";

// The program as one lunar cycle: each stage is a moon on the moon's path across the sky,
// waxing from a new moon (first stage) to a full moon (results).

// Lit part of a waxing moon of radius r centred on (0, 0); k is the lit fraction (0 new, 1 full).
// The right half is lit; the terminator is half an ellipse that bulges right for a crescent and
// left for a gibbous moon.
function litPath(k: number, r: number) {
  const rx = (Math.abs(1 - 2 * k) * r).toFixed(2);
  const sweep = k > 0.5 ? 1 : 0;
  return `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx} ${r} 0 0 ${sweep} 0 ${-r}Z`;
}

function MoonPhase({ phase }: { phase: number }) {
  return (
    <svg className="moon-phase" viewBox="-22 -22 44 44" aria-hidden="true">
      <circle className="moon-dark" r="20" />
      {phase > 0 && <path className="moon-lit" d={litPath(phase, 20)} />}
    </svg>
  );
}

// The arc lives in a 1000×120 box stretched to the list width: a quadratic curve whose ends sit
// on the first and last column centres, so each stage's x is its column centre and its y (px)
// comes from the same curve.
const n = timeline.length;
const x0 = 500 / n;
const x1 = 1000 - x0;
const low = 100;
const peak = -60;
const curveY = (t: number) => low - 2 * (low - peak) * t * (1 - t);
const arc = `M${x0} ${low}Q500 ${peak} ${x1} ${low}`;

// The arc from the first moon up to t, via de Casteljau: the first half of the split curve.
function arcTo(t: number) {
  const qx = x0 + (500 - x0) * t;
  const qy = low + (peak - low) * t;
  const bx = qx + (500 + (x1 - 500) * t - qx) * t;
  return `M${x0} ${low}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${bx.toFixed(1)} ${curveY(t).toFixed(1)}`;
}

// A few stars around the arc: [x, y, radius, twinkle delay in s].
const stars = [
  [150, 30, 1.4, 0],
  [270, 74, 1, 1.2],
  [360, 8, 1.6, 2.4],
  [455, 58, 1, 0.6],
  [560, 18, 1.3, 3],
  [660, 70, 1, 1.8],
  [735, 26, 1.5, 0.9],
  [880, 52, 1.1, 2.1],
  [60, 56, 1, 3.4],
];

export function Timeline() {
  const current = timeline.findIndex((stage) => stage.active);

  return (
    <section className="section" id="timeline">
      <div className="wrap">
        <SectionHead
          eyebrow="Timeline"
          title="How the program"
          accent="runs."
          center
        >
          One month, one lunar cycle. Exact dates will be announced soon.
        </SectionHead>
        <div className="moonpath reveal" style={{ "--n": n } as CSSProperties}>
          <svg
            className="moonpath-arc"
            viewBox="0 0 1000 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {stars.map(([x, y, r, delay]) => (
              <circle
                key={`${x}-${y}`}
                className="twinkle"
                cx={x}
                cy={y}
                r={r}
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
            <path className="arc" d={arc} />
            {current > 0 && (
              <path className="arc done" d={arcTo(current / (n - 1))} />
            )}
          </svg>
          <ol className="timeline">
            {timeline.map((stage, i) => {
              const t = n > 1 ? i / (n - 1) : 0;
              const state =
                i === current ? "active" : i < current ? "done" : undefined;
              return (
                <li
                  key={stage.title}
                  className={state}
                  aria-current={state === "active" ? "step" : undefined}
                  style={{ "--y": `${curveY(t)}px` } as CSSProperties}
                >
                  <MoonPhase phase={t} />
                  <span className="when">
                    {stage.when ?? `Stage ${String(i + 1).padStart(2, "0")}`}
                  </span>
                  {state === "active" && <span className="now">Now</span>}
                  <h3>{stage.title}</h3>
                  <p>{stage.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
