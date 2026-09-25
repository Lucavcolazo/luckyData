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

/**
 * How a value sits against the FACEIT level 10 average, as a plain label. Deliberately neutral:
 * whether a number is suspicious is decided in one place, src/lib/suspicion.ts.
 */
export function compareToFaceitLevel10(value: number | null, benchmark: number, direction: Direction): string | null {
  if (value === null || benchmark === 0) return null;

  const diffPct =
    direction === "higher-better"
      ? ((value - benchmark) / benchmark) * 100
      : ((benchmark - value) / benchmark) * 100;

  const rounded = Math.round(Math.abs(diffPct));
  if (rounded === 0) return "Igual al Nivel 10 de FACEIT";
  return `${rounded}% ${diffPct >= 0 ? "mejor" : "peor"} que Nivel 10 FACEIT`;
}
