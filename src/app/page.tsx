const PREVIEW_STATS = [
  { label: "K/D Ratio", value: "1.24", trend: [8, 10, 9, 12, 11, 14, 13] },
  { label: "HLTV Rating 2.0", value: "1.15", trend: [6, 7, 9, 8, 10, 10, 12] },
  { label: "Preaim", value: "7.8°", trend: [14, 12, 13, 10, 9, 8, 7] },
];

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (points.length - 1);

  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full overflow-visible">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/70"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-10">
        <span className="text-sm font-medium tracking-tight">LuckyData</span>
        <span className="text-xs text-muted">by Lucky7</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:px-10">
        <div className="w-full max-w-xl">
          <div className="animate-fade-up text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Tus stats de CS2.
              <br />
              Sin ruido.
            </h1>
            <p className="mt-3 text-sm text-muted">
              Pegá tu perfil de Steam o FACEIT y mirá qué hay detrás del número.
            </p>
          </div>

          <form
            className="animate-fade-up mt-10 flex items-center gap-2 border border-border bg-surface px-4 py-3"
            style={{ animationDelay: "80ms" }}
          >
            <input
              type="text"
              placeholder="steamcommunity.com/id/tu-perfil"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="border border-border px-4 py-1.5 text-xs font-medium tracking-tight transition-colors hover:bg-foreground hover:text-background"
            >
              Buscar
            </button>
          </form>

          <div
            className="animate-fade-up mt-14 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3"
            style={{ animationDelay: "160ms" }}
          >
            {PREVIEW_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-3 bg-background p-5">
                <span className="text-xs text-muted">{stat.label}</span>
                <span className="text-2xl font-semibold tracking-tight">{stat.value}</span>
                <Sparkline points={stat.trend} />
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted sm:px-10">
        Datos públicos de Steam y demos de partidas. No afiliado a Valve.
      </footer>
    </div>
  );
}
