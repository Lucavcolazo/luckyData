import { premierTier } from "@/lib/rankColors";

/** The badge art lives on a 178x64 grid; every edge leans right at the top, like the in-game emblem. */
const LEAN = 12 / 64;

/** Parallelogram whose left edge crosses mid-height at `x`, `w` wide, spanning `top` to `bottom`. */
function slab(x: number, w: number, top = 0, bottom = 64): string {
  const left = (y: number) => x + LEAN * (32 - y);
  return [
    [left(top), top],
    [left(top) + w, top],
    [left(bottom) + w, bottom],
    [left(bottom), bottom],
  ]
    .map((p) => p.join(","))
    .join(" ");
}

const BODY = slab(15, 157);
const STRIPE_GAP = slab(15, 4);
const STRIPES = [slab(6, 9), slab(19, 8)];
/** Speed lines inside the body: the tier colour at low opacity, brightest next to the stripes. */
const BANDS: [points: string, opacity: number][] = [
  [slab(29, 6, 4, 60), 0.31],
  [slab(40, 6, 4, 60), 0.19],
  [slab(50.5, 14.5, 4, 60), 0.14],
  [slab(69.5, 33, 4, 60), 0.11],
];

/** Heights follow the game (32px on the player card); every digit is the same size, only the tick is smaller. */
const SIZES = {
  lg: { height: 44, digits: 28, tick: 18 },
  md: { height: 32, digits: 21, tick: 14 },
};

const TRIM = "[text-box:trim-both_cap_alphabetic]";

/** Split the thousands from the last three digits; the badge prints a raised tick between them (30’000). */
function splitRating(rating: number): [thousands: string, rest: string] {
  const thousands = Math.floor(rating / 1000);
  const rest = String(rating % 1000);
  return thousands > 0 ? [String(thousands), rest.padStart(3, "0")] : ["", rest];
}

/** `dim` fades only the plate, so the number keeps its contrast (the comparison's losing side). */
export function PremierBadge({
  rating,
  size = "lg",
  dim = false,
}: {
  rating: number | null;
  size?: "lg" | "md";
  dim?: boolean;
}) {
  const value = rating === null || !Number.isFinite(rating) ? 0 : Math.round(rating);
  if (value <= 0) {
    return <span className="font-label text-3xl leading-none font-bold text-ink-muted">Sin rango</span>;
  }

  const tier = premierTier(value);
  const { height, digits, tick } = SIZES[size];
  const [thousands, rest] = splitRating(value);

  return (
    <span
      role="img"
      aria-label={`Premier ${value.toLocaleString("es-AR")}`}
      className="relative inline-block shrink-0 self-start"
      style={{ width: (height * 178) / 64, height }}
    >
      <svg viewBox="0 0 178 64" className="absolute inset-0 size-full" style={{ opacity: dim ? 0.5 : 1 }} aria-hidden>
        <polygon points={BODY} fill={tier.fill} />
        <polygon points={STRIPE_GAP} fill={tier.color} fillOpacity={0.45} />
        {STRIPES.map((points) => (
          <polygon key={points} points={points} fill={tier.color} />
        ))}
        {BANDS.map(([points, opacity]) => (
          <polygon key={points} points={points} fill={tier.color} fillOpacity={opacity} />
        ))}
      </svg>
      {/* Big Shoulders has no italic, so the number takes the badge's lean instead. */}
      <span
        className="absolute inset-0 flex items-center justify-center pr-[3%] pl-[15%] font-label leading-none font-bold tabular-nums"
        style={{ color: tier.text, transform: "skewX(-10.6deg)", textShadow: "1px 1px 1px #000" }}
        aria-hidden
      >
        <span className="flex items-baseline" style={{ fontSize: digits }}>
          {thousands && (
            <>
              <span className={TRIM}>{thousands}</span>
              {/* Pinned to the cap line so it reads as a tick, not a comma hanging off the baseline. */}
              <span className={`${TRIM} self-start`} style={{ fontSize: tick }}>
                {"\u2019"}
              </span>
            </>
          )}
          <span className={TRIM}>{rest}</span>
        </span>
      </span>
    </span>
  );
}
