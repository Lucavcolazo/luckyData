import type { PlayerData } from "@/lib/playerData";
import { FACEIT_LEVEL_10_BENCHMARK } from "@/lib/proBenchmarks";

export type SuspicionLevel = "unknown" | "clean" | "watch" | "alert";

/** Metrics the analysis looks at. The same keys tag the stat tiles, so a flag can point at its tile. */
export type SuspectMetric = "aim" | "ttd" | "preaim" | "hs" | "faceitHs";

export interface SuspicionFlag {
  key: SuspectMetric;
  label: string;
  value: string;
  /** Why it stands out, in plain words. */
  reason: string;
  strong: boolean;
}

export interface SuspicionReport {
  level: SuspicionLevel;
  flags: SuspicionFlag[];
  /** Labels of every metric that had data and was checked, flagged or not. */
  checked: string[];
}

/** Which stats tab each metric lives in, so a flag can switch to the right one. */
export const METRIC_TAB: Record<SuspectMetric, "cs2" | "faceit"> = {
  aim: "cs2",
  ttd: "cs2",
  preaim: "cs2",
  hs: "cs2",
  faceitHs: "faceit",
};

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** FACEIT headshot % only means something over a decent sample. */
const MIN_FACEIT_MATCHES = 20;

interface Rule {
  key: SuspectMetric;
  label: string;
  /** Past `watch` it gets flagged, past `strong` it's rare even for pros. */
  watch: number;
  strong: number;
  direction: "higher" | "lower";
  format: (v: number) => string;
  reason: string;
  read: (p: PlayerData) => number | null;
}

/**
 * The single source of "atypical". Heuristic on purpose: it points at numbers worth a closer look,
 * it never says someone cheats. "watch" sits well past the FACEIT level 10 average.
 */
const RULES: Rule[] = [
  {
    key: "aim",
    label: "Puntería",
    watch: 90,
    strong: 95,
    direction: "higher",
    format: (v) => fmt(v, 1),
    reason: "Rating de aim de Leetify por encima de 90",
    read: (p) => p.leetify?.rating.aim ?? null,
  },
  {
    key: "ttd",
    label: "Tiempo al daño",
    watch: 400,
    strong: 350,
    direction: "lower",
    format: (v) => `${fmt(v)} ms`,
    reason: `El Nivel 10 de FACEIT promedia ${fmt(FACEIT_LEVEL_10_BENCHMARK.timeToDamageMs)} ms`,
    read: (p) => p.leetify?.stats.reaction_time_ms ?? null,
  },
  {
    key: "preaim",
    label: "Preaim",
    watch: 5,
    strong: 4,
    direction: "lower",
    format: (v) => `${fmt(v, 1)}°`,
    reason: `El Nivel 10 de FACEIT promedia ${fmt(FACEIT_LEVEL_10_BENCHMARK.preaimDeg, 1)}°`,
    read: (p) => p.leetify?.stats.preaim ?? null,
  },
  {
    key: "hs",
    label: "Precisión a la cabeza",
    watch: 35,
    strong: 40,
    direction: "higher",
    format: (v) => `${fmt(v, 1)}%`,
    reason: `El Nivel 10 de FACEIT promedia ${fmt(FACEIT_LEVEL_10_BENCHMARK.accuracyHeadPct, 1)}%`,
    read: (p) => p.leetify?.stats.accuracy_head ?? null,
  },
  {
    key: "faceitHs",
    label: "Headshots en FACEIT",
    watch: 65,
    strong: 75,
    direction: "higher",
    format: (v) => `${fmt(v)}%`,
    reason: "Más de 2 de cada 3 kills a la cabeza",
    read: (p) => {
      const life = p.faceit?.lifetime;
      return life && (life.matches ?? 0) >= MIN_FACEIT_MATCHES ? life.hsPct : null;
    },
  },
];

const past = (rule: Rule, value: number, limit: number) =>
  rule.direction === "higher" ? value >= limit : value <= limit;

export function analyzeSuspicion(player: PlayerData): SuspicionReport {
  const flags: SuspicionFlag[] = [];
  const checked: string[] = [];

  for (const rule of RULES) {
    const value = rule.read(player);
    if (value === null) continue;
    checked.push(rule.label);
    if (!past(rule, value, rule.watch)) continue;
    flags.push({
      key: rule.key,
      label: rule.label,
      value: rule.format(value),
      reason: rule.reason,
      strong: past(rule, value, rule.strong),
    });
  }

  if (checked.length === 0) return { level: "unknown", flags, checked };
  const score = flags.reduce((sum, f) => sum + (f.strong ? 2 : 1), 0);
  const level: SuspicionLevel = score >= 4 ? "alert" : score >= 1 ? "watch" : "clean";
  return { level, flags, checked };
}

/** The flag for one metric, if the report has it: how tiles and comparison cells find their state. */
export function flagFor(report: SuspicionReport | null | undefined, key: SuspectMetric): SuspicionFlag | undefined {
  return report?.flags.find((f) => f.key === key);
}
