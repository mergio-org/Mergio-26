import { pine } from "./drift";

// Mountain, winding trail and a light climbing it, behind the How it works steps.
// The 1000×480 box is stretched to the steps' width (preserveAspectRatio="none"), so x maps to
// the column centres (125, 375, 625, 875) and y stays in px. The trail passes through the node
// centres, which globals.css places with --rise: 260, 196, 132 and 68px from the top.
const trail =
  "M0 300C50 292 92 270 125 260S290 204 375 196S560 142 625 132S812 76 875 68";

// A few pines standing on the slope, smaller toward the summit: [x, base y, height].
const pines = [
  [48, 308, 46],
  [230, 245, 38],
  [500, 187, 32],
  [745, 110, 28],
].map(([x = 0, base = 0, h = 0]) => pine(x, base, h));

// Ridge lines of the two ranges; each fill closes its ridge down to the bottom of the box.
const backRidge =
  "M0 250C80 226 150 214 230 228C300 240 350 220 420 200C480 184 530 196 590 182C650 168 700 148 760 156C840 166 920 190 1000 170";
const frontRidge =
  "M0 314C50 306 92 284 125 274C210 248 300 218 375 210C460 202 560 156 625 146C700 134 800 86 875 60C920 76 960 100 1000 110";

export function Summit() {
  return (
    <svg
      className="summit"
      viewBox="0 0 1000 480"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Moonlit ice: the fills fade from a faint ice tint at the ridge to nothing below. */}
      <defs>
        <linearGradient id="summit-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".16" />
          <stop offset=".75" stopColor="currentColor" stopOpacity=".02" />
        </linearGradient>
        <linearGradient id="summit-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".08" />
          <stop offset=".7" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path fill="url(#summit-back)" d={`${backRidge}V480H0Z`} />
      <path className="summit-rim back" d={backRidge} />
      <path fill="url(#summit-front)" d={`${frontRidge}V480H0Z`} />
      <path className="summit-rim" d={frontRidge} />
      <path
        className="summit-snow"
        d="M875 60C850 69 830 78 812 86L826 88 836 98 848 90 860 102 872 92 884 104 896 94 908 102 918 92 932 96 944 90C925 84 900 70 875 60Z"
      />
      <path className="s-pine" d={pines.map((p) => p.body).join("")} />
      <path className="s-cap" d={pines.map((p) => p.caps).join("")} />
      <path className="summit-trail" d={trail} />
      <path className="summit-glow" d={trail} pathLength={1} />
    </svg>
  );
}
