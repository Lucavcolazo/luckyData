"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { PlatformGap, SuspicionLevel, SuspicionReport } from "@/lib/suspicion";

export const COPY: Record<SuspicionLevel, { title: string; body: string }> = {
  unknown: { title: "Sin datos", body: "No hay estadísticas suficientes para opinar sobre este perfil." },
  clean: { title: "Nada fuera de lo común", body: "Ninguna métrica pasa los umbrales de sospecha." },
  watch: { title: "Mmm… mirá esto", body: "Hay números por encima de lo normal:" },
  alert: { title: "¡Ojo con este perfil!", body: "Varias métricas están muy fuera de lo común:" },
};

/** Rounded triangle body on a 100x100 grid. */
const BODY = "M43 15Q50 5 57 15L90 72Q96 86 80 86H20Q4 86 10 72Z";

/** A verdict, or "analyzing" while Leetify and FACEIT are still on their way. */
export type BlobMood = SuspicionLevel | "analyzing";

/** Eye shape per mood. `tilt` is the left eye's rotation in degrees; the right eye mirrors it. */
const EYES: Record<BlobMood, { w: number; h: number; tilt: number }> = {
  clean: { w: 10, h: 12, tilt: 0 },
  analyzing: { w: 12, h: 3.2, tilt: 0 },
  watch: { w: 13, h: 3, tilt: 10 },
  alert: { w: 8, h: 8, tilt: 0 },
  unknown: { w: 12, h: 1.6, tilt: 0 },
};

/** How far the eyes may travel when they follow the pointer, in grid units. */
const GAZE = { x: 4, y: 2.5 };

function usePointerGaze(enabled: boolean, target: RefObject<SVGSVGElement | null>) {
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    function onMove(e: PointerEvent) {
      const box = target.current?.getBoundingClientRect();
      if (!box) return;
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      // Ease toward the edge of the socket as the pointer gets further away.
      const reach = Math.min(1, dist / 300);
      setGaze({ x: (dx / dist) * GAZE.x * reach, y: (dy / dist) * GAZE.y * reach });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, target]);
  return enabled ? gaze : { x: 0, y: 0 };
}

function Eye({ cx, w, h, tilt }: { cx: number; w: number; h: number; tilt: number }) {
  return (
    <rect
      x={cx - w / 2}
      y={58 - h / 2}
      width={w}
      height={h}
      rx={Math.min(w, h) / 2}
      fill="var(--panel)"
      transform={`rotate(${tilt} ${cx} 58)`}
    />
  );
}

const EYE_MOTION: Record<BlobMood, string> = {
  clean: "blob-blink",
  analyzing: "blob-scan",
  watch: "blob-shifty",
  alert: "blob-blink",
  unknown: "",
};

/**
 * Our own blob: a sand triangle with pill eyes. While the numbers load it squints and scans them;
 * with nothing odd it opens its eyes wide and follows the pointer, "watch" squints and glances side
 * to side, "alert" keeps turning into a red "!", and no data sleeps.
 */
export function Blob({ level }: { level: BlobMood }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gaze = usePointerGaze(level === "clean", svgRef);
  const eye = EYES[level];
  const bodyMotion = level === "alert" ? "blob-morph-body" : level === "unknown" ? "blob-breathe" : "blob-bob";

  return (
    <svg ref={svgRef} viewBox="0 0 100 100" className="size-full overflow-visible" aria-hidden>
      <g className={bodyMotion}>
        <path d={BODY} fill="var(--sand)" />
        <g style={{ transform: `translate(${gaze.x}px, ${gaze.y}px)`, transition: "transform 180ms ease-out" }}>
          {/* Clean opens from the analyzing squint, so the verdict lands as "done looking". */}
          <g className={level === "clean" ? "blob-eyes-open" : undefined}>
            <g className={EYE_MOTION[level]}>
              <Eye cx={39} w={eye.w} h={eye.h} tilt={eye.tilt} />
              <Eye cx={61} w={eye.w} h={eye.h} tilt={-eye.tilt} />
            </g>
          </g>
        </g>
      </g>
      {level === "alert" && (
        <g className="blob-morph-bang" fill="var(--paint)">
          <path d="M44 14Q50 8 56 14L54 62Q50 67 46 62Z" />
          <circle cx="50" cy="79" r="7" />
        </g>
      )}
    </svg>
  );
}

/** What only the mascot tells: the player's fine stats drop on FACEIT compared with Premier/MM. */
function GapNote({ gap, standalone }: { gap: PlatformGap; standalone: boolean }) {
  return (
    <div className={standalone ? "mt-3" : "mt-3 border-t border-line pt-3"}>
      <p className="font-label text-sm font-bold tracking-[0.1em] text-warn uppercase">Rinde peor en FACEIT</p>
      <p className="mt-1 text-xs text-ink-muted">
        Donde el anticheat es más estricto, sus números bajan. Premier/MM → FACEIT:
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {gap.rows.map((r) => (
          <li key={r.key} className="flex items-baseline justify-between gap-3 text-sm">
            <span>{r.label}</span>
            <span className="font-label text-lg leading-none font-bold whitespace-nowrap tabular-nums">
              <span className="text-ink-muted">{r.valve}</span> → <span className="text-warn">{r.faceit}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs text-ink-muted tabular-nums">
        Mediana de {gap.valveMatches} partidas en Premier/MM y {gap.faceitMatches} en FACEIT.
      </p>
    </div>
  );
}

/**
 * Floating mascot in the bottom-right corner while the stats are on screen. When something looks
 * off it wears a "!" badge; hovering (or focusing) shows the breakdown, and a tap pins it open.
 * It also knows one thing the verdict strip doesn't say: a FACEIT drop (`gap`), which alone makes
 * a clean profile read as "watch" here.
 */
export function StatsMascot({
  report,
  gap,
  watchRef,
  hideWhileVisibleRef,
}: {
  report: SuspicionReport;
  gap?: PlatformGap | null;
  /** Only shows while this element (the results) is in view. */
  watchRef: RefObject<HTMLElement | null>;
  /** Stays hidden while this element (the verdict strip, which already says it all) is on screen. */
  hideWhileVisibleRef?: RefObject<HTMLElement | null>;
}) {
  const [inView, setInView] = useState(false);
  const [stripVisible, setStripVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || focused || pinned;

  useEffect(() => {
    const el = watchRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [watchRef]);

  useEffect(() => {
    const el = hideWhileVisibleRef?.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setStripVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [hideWhileVisibleRef]);

  if (!inView || stripVisible) return null;

  const level: SuspicionLevel = gap && (report.level === "clean" || report.level === "unknown") ? "watch" : report.level;
  const copy = COPY[level];
  const body = gap && report.flags.length === 0 ? "Ninguna métrica pasa los umbrales, pero hay algo:" : copy.body;
  const flagged = level === "watch" || level === "alert";
  const tone = level === "alert" ? "border-paint/70" : level === "watch" ? "border-warn/60" : "border-line";

  return (
    <div
      className="fixed right-4 bottom-4 z-30 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6"
      // The wrapper is the hover area, so moving from the mascot up to the bubble keeps it open.
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
    >
      {open && (
        <div
          role="status"
          className={`animate-fade-up relative w-72 max-w-[calc(100vw-2rem)] border bg-panel p-4 shadow-[0_12px_32px_rgba(0,0,0,0.55)] ${tone}`}
        >
          {pinned && (
            <button
              type="button"
              onClick={() => {
                setPinned(false);
                setHovered(false);
              }}
              className="absolute top-2 right-2 flex size-7 items-center justify-center text-ink-muted transition-colors hover:text-sand"
              aria-label="Cerrar mensaje"
            >
              <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" strokeLinecap="square" />
              </svg>
            </button>
          )}
          <p
            className={`pr-6 font-display text-2xl leading-none font-extrabold uppercase ${
              level === "alert" ? "text-paint" : level === "watch" ? "text-warn" : "text-sand"
            }`}
          >
            {copy.title}
          </p>
          <p className="mt-2 text-[13px] text-ink-muted">{body}</p>
          {report.flags.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {report.flags.map((f) => (
                <li key={f.label} className="flex flex-col">
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span>{f.label}</span>
                    <span className={`font-label text-lg leading-none font-bold tabular-nums ${f.strong ? "text-paint" : ""}`}>
                      {f.value}
                    </span>
                  </span>
                  <span className="text-xs text-ink-muted">{f.reason}</span>
                </li>
              ))}
            </ul>
          )}
          {gap && <GapNote gap={gap} standalone={report.flags.length === 0} />}
          {(report.flags.length > 0 || gap) && (
            <p className="mt-3 border-t border-line pt-2 text-xs text-ink-muted">
              Números fuera de lo común no son prueba de trampa.
            </p>
          )}
          {/* tail pointing at the mascot */}
          <span
            className={`absolute -bottom-[7px] right-9 size-3 rotate-45 border-r border-b bg-panel ${tone}`}
            aria-hidden
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        // Keyboard focus only: a mouse click also focuses the button and would keep the bubble stuck open.
        onFocus={(e) => setFocused(e.currentTarget.matches(":focus-visible"))}
        onBlur={() => setFocused(false)}
        className="relative size-16 p-1 transition-transform duration-150 active:scale-[0.94] sm:size-20"
        aria-label={`Mascota: ${copy.title}. ${pinned ? "Ocultar" : "Ver"} detalle`}
        aria-expanded={open}
      >
        <Blob level={level} />
        {flagged && !open && (
          <span className="absolute -top-1 -right-1 flex size-6" aria-hidden>
            <span
              className={`absolute inset-0 animate-ping opacity-60 motion-reduce:animate-none ${
                level === "alert" ? "bg-paint" : "bg-warn"
              }`}
            />
            <span
              className={`animate-focus-in relative flex size-6 items-center justify-center font-display text-base leading-none font-black ${
                level === "alert" ? "bg-paint text-white" : "bg-warn text-panel"
              }`}
            >
              !
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
