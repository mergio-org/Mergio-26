// Six-armed ice crystal, used as a slowly turning background decoration (About, Maintainers).
// Size, position and opacity come from the className in globals.css.
export function Crystal({ className }: { className: string }) {
  return (
    <svg
      className={`crystal ${className}`}
      viewBox="-100 -100 200 200"
      aria-hidden="true"
    >
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <path
          key={angle}
          transform={`rotate(${angle})`}
          d="M0 -14V-94M0 -34 -17 -51M0 -34 17 -51M0 -58 -13 -71M0 -58 13 -71M0 -80 -7 -87M0 -80 7 -87"
        />
      ))}
      <path d="M0 -14 12.1 -7 12.1 7 0 14 -12.1 7 -12.1 -7Z" />
    </svg>
  );
}
