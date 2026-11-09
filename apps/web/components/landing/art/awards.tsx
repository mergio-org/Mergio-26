import type { ReactNode } from "react";
import { pine } from "./drift";

// Winter "display windows" for the three Prizes cards: a night sky (a day sky in light mode)
// with pines and the award standing on a snowdrift. Each is drawn in a 330×210 box anchored to
// the bottom (xMidYMax slice), so the snow line stays put while the sky crops to fit the window.
// Colours come from classes in globals.css; ids are prefixed per scene to stay unique.

// Six-armed snowflake engraved on the trophy, medal and seal.
function Engraving({
  cx,
  cy,
  r,
  className = "aw-engrave",
}: {
  cx: number;
  cy: number;
  r: number;
  className?: string;
}) {
  const b = r * 0.32;
  return (
    <g className={className}>
      {[0, 60, 120].map((a) => (
        <path
          key={a}
          transform={`rotate(${a} ${cx} ${cy})`}
          d={`M${cx} ${cy - r}V${cy + r}M${cx - b} ${cy - r + b}l${b} ${b} ${b}-${b}M${cx - b} ${cy + r - b}l${b}-${b} ${b} ${b}`}
        />
      ))}
    </g>
  );
}

// [x, y, radius]; kept away from the top centre where the awards sit.
const stars = [
  [30, 30, 1.2],
  [72, 58, 0.9],
  [112, 20, 1.1],
  [222, 38, 1],
  [262, 16, 1.3],
  [302, 54, 0.9],
  [46, 100, 0.8],
  [288, 98, 0.8],
];

const trees = [
  [26, 194, 54],
  [54, 194, 36],
  [304, 194, 54],
  [276, 194, 36],
].map(([x = 0, base = 0, h = 0]) => pine(x, base, h));

// Sky stars, a far hill and pines on both sides; drawn first, behind the award.
function Backdrop() {
  return (
    <>
      {stars.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} className="aw-star" cx={x} cy={y} r={r} />
      ))}
      <path
        className="aw-far"
        d="M0 176C60 162 110 168 165 164S270 160 330 170V210H0Z"
      />
      <path className="s-pine" d={trees.map((t) => t.body).join("")} />
      <path className="s-cap" d={trees.map((t) => t.caps).join("")} />
    </>
  );
}

// The snowdrift in front, covering tree trunks and the foot of the podium.
function FrontDrift() {
  return (
    <path
      className="aw-snow"
      d="M0 192C60 182 120 187 165 186S280 182 330 192V210H0Z"
    />
  );
}

function Art({ children }: { children: ReactNode }) {
  return (
    <svg
      className="award-art"
      viewBox="0 0 330 210"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// Four-point sparkle.
const spark = (x: number, y: number, s: number) =>
  `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`;

// Podium blocks (2nd, 1st, 3rd) standing on the snow at y = 192, 48 wide.
const blocks = [
  { n: 2, x: 89, top: 146, size: 17 },
  { n: 1, x: 141, top: 128, size: 20 },
  { n: 3, x: 193, top: 158, size: 15 },
];
const snowCap = (x: number, t: number) =>
  `M${x} ${t}h48v6c-5 0-7 5-12 5s-7-4-12-4-7 5-12 5-7-6-12-6Z`;

// Top contributors: a frosted ice podium with a gold trophy under a beam of light.
export function ContributorsScene() {
  return (
    <Art>
      <defs>
        <linearGradient id="aw-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFEDB8" />
          <stop offset=".5" stopColor="#F2C66D" />
          <stop offset="1" stopColor="#C38A33" />
        </linearGradient>
        <linearGradient id="aw-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".26" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".04" />
        </linearGradient>
        <linearGradient id="aw-block" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".5" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".14" />
        </linearGradient>
        <radialGradient id="aw-trophy-glow">
          <stop offset="0" stopColor="#F2C66D" stopOpacity=".45" />
          <stop offset="1" stopColor="#F2C66D" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Backdrop />
      <path fill="url(#aw-beam)" d="M153 0H177L205 132H125Z" />
      {blocks.map((b) => (
        <g key={b.n}>
          <rect
            className="aw-block"
            fill="url(#aw-block)"
            x={b.x}
            y={b.top}
            width="48"
            height={200 - b.top}
            rx="3"
          />
          <path className="aw-cap" d={snowCap(b.x, b.top)} />
          <text
            className={`aw-num n${b.n}`}
            x={b.x + 24}
            y={b.top + (186 - b.top) / 2 + b.size / 3}
            fontSize={b.size}
          >
            {b.n}
          </text>
        </g>
      ))}
      <FrontDrift />
      <g className="bob">
        <circle cx="165" cy="102" r="32" fill="url(#aw-trophy-glow)" />
        <path
          fill="none"
          stroke="#E2AE52"
          strokeWidth="2.4"
          strokeLinecap="round"
          d="M151 92H145C145 100 148 104 153 105M179 92H185C185 100 182 104 177 105"
        />
        <path
          fill="url(#aw-gold)"
          d="M151 88H179V98C179 107 173 113 165 113C157 113 151 107 151 98ZM162 113H168V119H162ZM155 119H175L177 126H153ZM151 126H179V128H151Z"
        />
        <Engraving cx={165} cy={99} r={6} className="aw-engrave gold" />
      </g>
      <path className="aw-spark" d={spark(137, 84, 5)} />
      <path
        className="aw-spark"
        style={{ animationDelay: "1.2s" }}
        d={spark(195, 74, 4)}
      />
      <path
        className="aw-spark"
        style={{ animationDelay: "2.1s" }}
        d={spark(189, 110, 3)}
      />
      <path
        className="aw-spark"
        style={{ animationDelay: ".6s" }}
        d={spark(141, 114, 3.2)}
      />
    </Art>
  );
}

// Maintainers: an ice medal hanging on crossed ribbons, swinging gently.
export function MaintainersScene() {
  return (
    <Art>
      <defs>
        <linearGradient id="aw-medal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".45" stopColor="#D4ECFF" />
          <stop offset="1" stopColor="#5A9FDB" />
        </linearGradient>
        <radialGradient id="aw-medal-glow">
          <stop offset="0" stopColor="#8CCBFF" stopOpacity=".45" />
          <stop offset="1" stopColor="#8CCBFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Backdrop />
      <ellipse className="aw-shadow" cx="165" cy="190" rx="24" ry="3.5" />
      <FrontDrift />
      <g className="swing">
        <path className="aw-ribbon-b" d="M204 0H180L154 96H178Z" />
        <path className="aw-ribbon-a" d="M126 0H150L176 96H152Z" />
        <circle cx="165" cy="118" r="46" fill="url(#aw-medal-glow)" />
        <circle cx="165" cy="118" r="30" fill="url(#aw-medal)" />
        <circle className="aw-ring" cx="165" cy="118" r="23" />
        <Engraving cx={165} cy={118} r={12} />
      </g>
    </Art>
  );
}

// Every participant: a fanned stack of certificates with a snowflake wax seal, floating gently.
export function EveryoneScene() {
  return (
    <Art>
      <defs>
        <linearGradient id="aw-seal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E0F1FF" />
          <stop offset=".5" stopColor="#8CCBFF" />
          <stop offset="1" stopColor="#4D93D6" />
        </linearGradient>
      </defs>
      <Backdrop />
      <ellipse className="aw-shadow" cx="165" cy="191" rx="36" ry="4" />
      <FrontDrift />
      <g className="bob">
        <rect
          className="aw-paper p3"
          x="110"
          y="72"
          width="110"
          height="76"
          rx="4"
          transform="rotate(-13 165 110)"
        />
        <rect
          className="aw-paper p2"
          x="110"
          y="72"
          width="110"
          height="76"
          rx="4"
          transform="rotate(8 165 110)"
        />
        <g transform="rotate(-3 165 115)">
          <rect
            className="aw-paper p1"
            x="106"
            y="74"
            width="118"
            height="82"
            rx="4"
          />
          <path className="aw-line title" d="M126 93H182" />
          <path className="aw-line" d="M126 106H204M126 116H196M126 126H170" />
          <path
            className="aw-ribbon-a"
            d="M196 148 191 163 197 159 201 164 203 150ZM206 150 208 164 212 159 218 162 211 148Z"
          />
          <circle cx="203" cy="142" r="12.5" fill="url(#aw-seal)" />
          <Engraving cx={203} cy={142} r={6.5} />
        </g>
      </g>
    </Art>
  );
}
