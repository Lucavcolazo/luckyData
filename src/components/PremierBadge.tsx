export function PremierBadge({ rating, color }: { rating: number | null; color: string }) {
  if (rating === null) {
    return <span className="text-2xl font-semibold tracking-tight text-muted">—</span>;
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 py-1.5 pl-2 pr-3"
      style={{
        backgroundColor: `${color}26`,
        border: `1px solid ${color}`,
        transform: "skewX(-10deg)",
      }}
    >
      <span className="flex gap-[3px]" style={{ transform: "skewX(10deg)" }}>
        <span className="h-4 w-[3px]" style={{ backgroundColor: color }} />
        <span className="h-4 w-[3px]" style={{ backgroundColor: color, opacity: 0.5 }} />
      </span>
      <span
        className="text-lg font-bold tracking-tight"
        style={{ color, transform: "skewX(10deg)" }}
      >
        {rating.toLocaleString("es-AR")}
      </span>
    </span>
  );
}
