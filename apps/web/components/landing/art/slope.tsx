import { pine } from "./drift";

// A snowy ski slope along the bottom of each Scoring card; it gets steeper with the level.
// Drawn in a 300×110 box stretched to the card width. Each run has a ridge line, a dashed ski
// track carving down from the top, and a few pines ([x, base y, height]).
type Run = { ridge: string; track: string; cap?: string; pines: number[][] };
export type Level = 1 | 2 | 3;

const runs: Record<Level, Run> = {
  1: {
    ridge: "M0 74C70 70 150 62 220 56C250 54 280 52 300 50",
    track: "M270 62C230 70 200 66 170 74S110 84 80 82S30 92 10 96",
    pines: [
      [40, 76, 20],
      [252, 58, 16],
    ],
  },
  2: {
    ridge: "M0 92C60 86 120 70 180 52C230 37 270 30 300 28",
    track: "M280 38C240 50 230 56 200 62S150 78 120 82S60 96 20 102",
    pines: [
      [30, 94, 22],
      [92, 82, 18],
    ],
  },
  3: {
    ridge:
      "M0 100C60 96 120 84 170 60C200 44 220 22 238 10L248 6L260 14C275 26 288 36 300 40",
    track:
      "M244 16C228 30 236 36 214 44S196 60 176 66S150 82 120 86S60 98 24 104",
    cap: "M226 22 238 10 248 6 260 14 268 22 260 20 254 25 247 19 240 25 233 20Z",
    pines: [
      [40, 101, 18],
      [100, 93, 22],
      [142, 80, 18],
    ],
  },
};

export function Slope({ level }: { level: Level }) {
  const run = runs[level];
  const fill = `slope-fill-${level}`;
  const trees = run.pines.map(([x = 0, base = 0, h = 0]) => pine(x, base, h));
  return (
    <svg
      className="slope"
      viewBox="0 0 300 110"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".18" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".03" />
        </linearGradient>
      </defs>
      <path fill={`url(#${fill})`} d={`${run.ridge}V110H0Z`} />
      <path className="slope-rim" d={run.ridge} />
      {run.cap && <path className="slope-cap" d={run.cap} />}
      <path className="s-pine" d={trees.map((t) => t.body).join("")} />
      <path className="s-cap" d={trees.map((t) => t.caps).join("")} />
      <path className="slope-track" d={run.track} />
    </svg>
  );
}
