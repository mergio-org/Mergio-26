// Rolling snowdrifts with pine clusters at both ends, used as a scene divider under Prizes.
// Colours come from the --scene-* tokens in globals.css (s-* classes), so both themes work without overrides.

const f = (n: number) => n.toFixed(1);

// A three-tier pine standing on `base`, `h` px tall, plus the snow caps on each tier.
// Proportions match the pines elsewhere on the page. Also used by summit.tsx.
export function pine(cx: number, base: number, h: number) {
  const s = h / 170;
  const top = base - h;
  const tiers = [
    [0, 69.6, 29.2],
    [31.6, 110.7, 42.6],
    [63.2, 158.1, 56.1],
  ] as const;
  let body = "";
  let caps = "";
  for (const [apex, foot, halfWidth] of tiers) {
    const ay = top + apex * s;
    const by = top + foot * s;
    const w = halfWidth * s;
    const th = (foot - apex) * s;
    body += `M${f(cx)} ${f(ay)}L${f(cx + w)} ${f(by)}L${f(cx - w)} ${f(by)}Z`;
    caps += `M${f(cx)} ${f(ay)}L${f(cx + w * 0.28)} ${f(ay + th * 0.28)}Q${f(cx)} ${f(ay + th * 0.2)} ${f(cx - w * 0.28)} ${f(ay + th * 0.28)}Z`;
  }
  body += `M${f(cx - 3.75 * s)} ${f(top + 158.1 * s)}h${f(7.5 * s)}v${f(11.9 * s)}h${f(-7.5 * s)}Z`;
  return { body, caps };
}

// [x, height]; far pines are smaller and drawn first, behind the tall ones.
const farPines = [
  [28, 92],
  [196, 84],
  [1244, 82],
  [1412, 96],
];
const nearPines = [
  [86, 150],
  [146, 112],
  [1300, 116],
  [1362, 148],
];

const build = (list: number[][]) => {
  const parts = list.map(([x = 0, h = 0]) => pine(x, 176, h));
  return {
    body: parts.map((p) => p.body).join(""),
    caps: parts.map((p) => p.caps).join(""),
  };
};

const far = build(farPines);
const near = build(nearPines);

const driftTop =
  "M0 178 C180 160 360 172 540 170 C720 168 900 182 1080 174 C1260 166 1350 168 1440 176";

export function Drift() {
  return (
    <svg
      className="scene drift"
      viewBox="0 0 1440 220"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <path
        className="s-far"
        d="M0 130 C120 104 240 96 360 112 C480 128 600 140 720 134 C840 128 960 122 1080 116 C1200 110 1320 100 1440 120 V220 H0Z"
      />
      <path className="s-pine-far" d={far.body} />
      <path className="s-cap" d={far.caps} />
      <path className="s-pine" d={near.body} />
      <path className="s-cap" d={near.caps} />
      <path className="s-near" d={`${driftTop} V220 H0Z`} />
      <path className="s-rim" d={driftTop} />
    </svg>
  );
}
