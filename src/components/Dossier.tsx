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
