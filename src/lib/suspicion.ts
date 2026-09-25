import type { PlayerData } from "@/lib/playerData";
import { FACEIT_LEVEL_10_BENCHMARK } from "@/lib/proBenchmarks";

export type SuspicionLevel = "unknown" | "clean" | "watch" | "alert";

export interface SuspicionFlag {
  label: string;
  value: string;
  /** Why it stands out, in plain words. */
  reason: string;
  strong: boolean;
}

export interface SuspicionReport {
  level: SuspicionLevel;
  flags: SuspicionFlag[];
}

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** FACEIT headshot % only means something over a decent sample. */
const MIN_FACEIT_MATCHES = 20;

/**
 * Flags metrics far outside what even FACEIT level 10 players post. Heuristic on purpose: it
 * points at numbers worth a closer look, it never says someone cheats.
 * Thresholds: "watch" ones sit well past the level 10 average, "strong" ones are rare even for pros.
 */
export function analyzeSuspicion(player: PlayerData): SuspicionReport {
  const stats = player.leetify?.stats;
  const aim = player.leetify?.rating.aim ?? null;
  const faceitLife = player.faceit?.lifetime ?? null;
  const flags: SuspicionFlag[] = [];

  if (aim !== null && aim >= 90) {
    flags.push({
      label: "Puntería",
      value: fmt(aim, 1),
      reason: "Rating de aim de Leetify por encima de 90",
      strong: aim >= 95,
    });
  }

  const ttd = stats?.reaction_time_ms ?? null;
  if (ttd !== null && ttd <= 400) {
    flags.push({
      label: "Tiempo al daño",
      value: `${fmt(ttd)} ms`,
      reason: `El Nivel 10 de FACEIT promedia ${fmt(FACEIT_LEVEL_10_BENCHMARK.timeToDamageMs)} ms`,
      strong: ttd <= 350,
    });
  }

  const preaim = stats?.preaim ?? null;
  if (preaim !== null && preaim <= 5) {
    flags.push({
      label: "Preaim",
      value: `${fmt(preaim, 1)}°`,
      reason: `El Nivel 10 de FACEIT promedia ${fmt(FACEIT_LEVEL_10_BENCHMARK.preaimDeg, 1)}°`,
      strong: preaim <= 4,
    });
  }

  const head = stats?.accuracy_head ?? null;
  if (head !== null && head >= 35) {
    flags.push({
      label: "Precisión a la cabeza",
      value: `${fmt(head, 1)}%`,
      reason: `El Nivel 10 de FACEIT promedia ${fmt(FACEIT_LEVEL_10_BENCHMARK.accuracyHeadPct, 1)}%`,
      strong: head >= 40,
    });
  }

  const faceitHs = faceitLife?.hsPct ?? null;
  if (faceitHs !== null && (faceitLife?.matches ?? 0) >= MIN_FACEIT_MATCHES && faceitHs >= 65) {
    flags.push({
      label: "Headshots en FACEIT",
      value: `${fmt(faceitHs)}%`,
      reason: "Más de 2 de cada 3 kills a la cabeza",
      strong: faceitHs >= 75,
    });
  }

  const hasData = aim !== null || ttd !== null || preaim !== null || head !== null || faceitHs !== null;
  if (!hasData) return { level: "unknown", flags };

  const score = flags.reduce((sum, f) => sum + (f.strong ? 2 : 1), 0);
  const level: SuspicionLevel = score >= 4 ? "alert" : score >= 1 ? "watch" : "clean";
  return { level, flags };
}
