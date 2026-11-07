// Snow piled along the top edge of a card, with icicles hanging from it. Used on the About
// card and the Scoring leaderboard. `id` keeps each instance's gradient id unique on the page.

// Icicles: [x, length] in the 1000×40 viewBox.
const icicles = [
  [42, 14],
  [78, 22],
  [104, 10],
  [170, 18],
  [236, 12],
  [262, 21],
  [330, 9],
  [392, 17],
  [418, 11],
  [486, 20],
  [548, 13],
  [574, 19],
  [640, 10],
  [702, 22],
  [730, 12],
  [796, 16],
  [858, 21],
  [884, 9],
  [944, 15],
]
  .map(([x = 0, len = 0], i) => {
    const w = 3 + (i % 3);
    return `M${x - w} 16L${x} ${16 + len}L${x + w} 16Z`;
  })
  .join("");

export function SnowLedge({ id }: { id: string }) {
  const gradient = `icicle-${id}`;
  return (
    <svg
      className="ledge"
      viewBox="0 0 1000 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".7" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path fill={`url(#${gradient})`} d={icicles} />
      <path
        className="snow"
        d="M0 16C30 6 60 4 100 8 140 12 170 3 220 5 270 7 300 2 350 6 400 10 440 3 490 4 540 5 580 9 620 6 660 3 700 2 750 6 800 10 840 4 890 5 940 6 970 9 1000 14V18C980 18 975 22 965 22 955 22 950 18 930 18H700C690 18 686 23 676 23 666 23 662 18 652 18H400C390 18 386 22 377 22 368 22 365 18 355 18H120C110 18 106 23 97 23 88 23 85 18 75 18H0Z"
      />
    </svg>
  );
}
