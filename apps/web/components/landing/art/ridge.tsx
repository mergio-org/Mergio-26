// Snow-capped mountain ridge under the Scoring section.
// Colours come from the --scene-* tokens in globals.css (s-* classes), so both themes work without overrides.
export function Ridge() {
  return (
    <svg
      className="scene ridge"
      viewBox="0 0 1440 220"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <path
        className="s-far"
        d="M0 150 L120 100 L230 135 L360 60 L470 120 L590 80 L700 130 L820 55 L940 115 L1060 70 L1180 125 L1300 85 L1440 120 V220 H0Z"
      />
      <path
        className="s-snow"
        d="M360 60 L384 78 L372 76 L362 84 L349 75 L337 80Z M820 55 L846 74 L833 72 L822 80 L810 71 L797 75Z M1060 70 L1083 87 L1071 85 L1061 92 L1050 84 L1038 88Z M590 80 L609 94 L599 93 L591 99 L582 92 L573 95Z"
      />
      <path
        className="s-base"
        d="M0 200 C240 188 480 206 720 196 S1200 188 1440 200 V220 H0Z"
      />
    </svg>
  );
}
