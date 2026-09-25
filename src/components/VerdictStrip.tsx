"use client";

import { forwardRef } from "react";
import type { SuspectMetric, SuspicionReport } from "@/lib/suspicion";
import { Blob, COPY } from "@/components/StatsMascot";

/** "a, b y c", with labels lower-cased for mid-sentence use (acronyms like FACEIT stay as they are). */
function listOf(labels: string[]) {
  const words = labels.map((l) => l.charAt(0).toLowerCase() + l.slice(1));
  return words.length > 1 ? `${words.slice(0, -1).join(", ")} y ${words[words.length - 1]}` : (words[0] ?? "");
}

const TONE = {
  alert: { border: "border-paint/70", bg: "bg-paint/[0.06]", title: "text-paint" },
  watch: { border: "border-warn/55", bg: "bg-warn/[0.04]", title: "text-warn" },
  clean: { border: "border-line", bg: "bg-sand/[0.025]", title: "text-sand" },
  unknown: { border: "border-line", bg: "bg-sand/[0.025]", title: "text-sand" },
} as const;

/**
 * The answer to "is this player off?", right under the account block. Each flagged metric is a chip
 * that jumps to its tile. `report` is null while Leetify and FACEIT are still loading.
 */
export const VerdictStrip = forwardRef<
  HTMLElement,
  { report: SuspicionReport | null; onJump: (key: SuspectMetric) => void }
>(function VerdictStrip({ report, onJump }, ref) {
  if (!report) {
    return (
      <section
        ref={ref}
        className="animate-fade-up mt-6 flex items-center gap-5 border border-line p-5 sm:p-6"
        role="status"
        aria-live="polite"
      >
        <div className="size-14 shrink-0 opacity-60 sm:size-16">
          <Blob level="unknown" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-display text-2xl leading-none font-extrabold text-sand uppercase sm:text-3xl">
            Analizando métricas…
          </p>
          <span className="text-[13px] text-ink-muted">Esperando a Leetify y FACEIT.</span>
        </div>
      </section>
    );
  }

  const tone = TONE[report.level];
  const copy = COPY[report.level];
  const flagged = report.flags.length > 0;

  return (
    <section
      ref={ref}
      className={`animate-fade-up relative mt-6 flex flex-col gap-5 overflow-hidden border p-5 sm:flex-row sm:items-center sm:p-6 ${tone.border} ${tone.bg}`}
      aria-labelledby="verdict-title"
    >
      <div className="flex items-center gap-5 sm:contents">
        <div className="size-14 shrink-0 sm:size-20">
          <Blob level={report.level} />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 sm:hidden">
          <p className={`font-display text-2xl leading-none font-extrabold uppercase ${tone.title}`}>{copy.title}</p>
        </div>
      </div>

      <div className={`flex min-w-0 flex-1 flex-col gap-3 ${report.level === "alert" ? "sm:pr-44" : ""}`}>
        <p
          id="verdict-title"
          className={`hidden font-display text-3xl leading-none font-extrabold uppercase sm:block sm:text-4xl ${tone.title}`}
        >
          {copy.title}
        </p>

        {flagged ? (
          <>
            <ul className="flex flex-wrap gap-2" aria-label="Métricas fuera de lo común">
              {report.flags.map((f) => (
                <li key={f.key}>
                  <button
                    type="button"
                    onClick={() => onJump(f.key)}
                    className={`flex min-h-10 items-baseline gap-2 border px-3 py-2 text-left transition-[background-color,transform] duration-150 active:scale-[0.97] ${
                      f.strong
                        ? "border-paint/70 hover:bg-paint/15"
                        : "border-warn/55 hover:bg-warn/10"
                    }`}
                    title={f.reason}
                  >
                    <span className="text-[13px]">{f.label}</span>
                    <span
                      className={`font-label text-xl leading-none font-bold tabular-nums ${f.strong ? "text-paint" : "text-warn"}`}
                    >
                      {f.value}
                    </span>
                    <span className="sr-only">: {f.reason}. Ir a la métrica.</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-muted">
              Números fuera de lo común no son prueba de trampa. Tocá una métrica para verla.
            </p>
          </>
        ) : (
          <p className="text-[13px] text-ink-muted">
            {report.level === "unknown"
              ? "Ni Leetify ni FACEIT tienen métricas finas de este jugador."
              : `Revisamos ${listOf(report.checked)}: todo dentro de lo normal.`}
          </p>
        )}
      </div>

      {report.level === "alert" && (
        // Rubber stamp across the corner: the one moment the dossier itself changes.
        <span
          className="pointer-events-none absolute top-5 right-6 hidden rotate-[-8deg] border-4 border-paint px-3 py-1 font-display text-4xl leading-none font-black text-paint uppercase opacity-80 select-none sm:block"
          aria-hidden
        >
          Revisar
        </span>
      )}
    </section>
  );
});
