/** Shared pieces of the results "dossier": stencil section titles, sand links and neutral meters. */

export function SectionHeading({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line pb-3">
      <h2 className="font-display text-3xl leading-none font-extrabold tracking-[0.02em] text-sand uppercase sm:text-4xl">
        {children}
      </h2>
      {aside}
    </div>
  );
}

export function SandLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-sand hover:decoration-sand"
    >
      {children}
      <ExternalIcon />
    </a>
  );
}

export function ExternalIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path d="M4.5 2.5h5v5M9.5 2.5l-7 7" strokeLinecap="square" />
    </svg>
  );
}

/** Small uppercase label used above every value. */
export function Label({ children }: { children: React.ReactNode }) {
  return <span className="font-label text-sm font-semibold tracking-[0.1em] text-ink-muted uppercase">{children}</span>;
}

/**
 * Neutral fill meter. `ratio` is already oriented so a fuller bar is always better;
 * `mark` (0-1) draws a tick for a reference value such as the FACEIT level 10 average.
 */
export function Meter({ ratio, mark }: { ratio: number; mark?: number }) {
  const r = Math.min(1, Math.max(0, ratio));
  return (
    <div className="relative h-1.5 w-full bg-sand/10" aria-hidden>
      <div className="h-full bg-sand/75" style={{ width: `${r * 100}%` }} />
      {mark !== undefined && (
        <span
          className="absolute -top-1 h-3.5 w-0.5 bg-foreground"
          style={{ left: `calc(${Math.min(1, Math.max(0, mark)) * 100}% - 1px)` }}
        />
      )}
    </div>
  );
}

/**
 * Dense 4-up grid of stat cells, hairline-ruled like a scouting sheet. Borders live on the cells
 * (right + bottom) so an incomplete last row just ends instead of showing filler.
 */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 border-t border-l border-line lg:grid-cols-4">{children}</div>;
}

export const STAT_CELL = "flex min-w-0 flex-col gap-2.5 border-r border-b border-line p-4";

/** Label, number and a neutral meter: one cell of a StatGrid. */
export function StatTile({
  label,
  value,
  unit,
  ratio,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  /** 0-1, already oriented so fuller is better. Omit for no meter. */
  ratio?: number | null;
  note?: React.ReactNode;
}) {
  return (
    <div className={STAT_CELL}>
      <Label>{label}</Label>
      <span className="font-label text-4xl leading-none font-bold tabular-nums">
        {value}
        {unit && value !== "—" && <span className="ml-0.5 text-[0.5em] text-ink-muted">{unit}</span>}
      </span>
      {ratio !== undefined && ratio !== null && <Meter ratio={ratio} />}
      {note && <span className="text-xs text-ink-muted">{note}</span>}
    </div>
  );
}
