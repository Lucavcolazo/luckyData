import type { Direction } from "@/lib/gauge";

/**
 * Promedios reales del bucket Nivel 10 de FACEIT — el tier competitivo más alto que Leetify
 * mide y publica (no hay un bucket "pro" verificado, pero es la referencia pública más cercana
 * a nivel profesional). Fuente: Leetify Performance Metric Tool, datos de ago. 2026 sobre
 * 3.4M+ jugadores: https://leetify.com/data-library/counter-strike/performance-metric-tool
 */
export const FACEIT_LEVEL_10_BENCHMARK = {
  timeToDamageMs: 528.8,
  preaimDeg: 8.92,
  accuracyHeadPct: 21.89,
};

export interface BenchmarkComparison {
  label: string;
  color: string;
  /** Mejora tan grande sobre Nivel 10 FACEIT que vale la pena marcarla como atípica (no es una acusación). */
  unusual: boolean;
}

/** Umbral a partir del cual una mejora sobre Nivel 10 FACEIT se marca como estadísticamente atípica. */
const UNUSUAL_BETTER_THRESHOLD_PCT = 40;

/** Compara un valor del jugador contra el promedio de Nivel 10 FACEIT (ver benchmark arriba). */
export function compareToFaceitLevel10(
  value: number | null,
  benchmark: number,
  direction: Direction,
): BenchmarkComparison | null {
  if (value === null || benchmark === 0) return null;

  const diffPct =
    direction === "higher-better"
      ? ((value - benchmark) / benchmark) * 100
      : ((benchmark - value) / benchmark) * 100;

  const rounded = Math.round(Math.abs(diffPct));
  const better = diffPct >= 0;

  return {
    color: better ? "var(--good)" : "var(--ink-muted)",
    label:
      rounded === 0
        ? "Igual al Nivel 10 de FACEIT"
        : `${rounded}% ${better ? "mejor" : "peor"} que Nivel 10 FACEIT`,
    unusual: better && rounded >= UNUSUAL_BETTER_THRESHOLD_PCT,
  };
}
