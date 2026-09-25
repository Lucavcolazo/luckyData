import type { PlayerData } from "@/lib/playerData";
import { FACEIT_LEVEL_10_BENCHMARK } from "@/lib/proBenchmarks";
import { median, playerMatchStats, present, type MatchFineStats } from "@/lib/matchMetrics";

export type SuspicionLevel = "unknown" | "clean" | "watch" | "alert";

/** Metrics the analysis looks at. The same keys tag the stat tiles, so a flag can point at its tile. */
export type SuspectMetric = "aim" | "ttd" | "preaim" | "hs" | "faceitHs" | "matches";

export interface SuspicionFlag {
  key: SuspectMetric;
  label: string;
  value: string;
  /** Why it stands out, in plain words. */
  reason: string;
  strong: boolean;
}

/** A single match whose own numbers cross the per-match lines, with the numbers that did. */
export interface AtypicalMatch {
  id: string;
  hits: { key: FineMetric; value: string }[];
}

export interface SuspicionReport {
  level: SuspicionLevel;
  flags: SuspicionFlag[];
  /** Labels of every metric that had data and was checked, flagged or not. */
  checked: string[];
  /** Matches flagged one by one, keyed by Leetify match id. */
  atypicalMatches: AtypicalMatch[];
}

/** Which stats tab each metric lives in, so a flag can switch to the right one. */
export const METRIC_TAB: Record<SuspectMetric, "cs2" | "faceit"> = {
  aim: "cs2",
  ttd: "cs2",
  preaim: "cs2",
  hs: "cs2",
  faceitHs: "faceit",
  matches: "cs2",
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

const beyond = (direction: "higher" | "lower", value: number, limit: number) =>
  direction === "higher" ? value >= limit : value <= limit;

const past = (rule: Rule, value: number, limit: number) => beyond(rule.direction, value, limit);

export type FineMetric = "ttd" | "preaim" | "hs";

interface FineRule {
  key: FineMetric;
  label: string;
  direction: "higher" | "lower";
  format: (v: number) => string;
  read: (m: MatchFineStats) => number | null;
  /** One match past `watch` alone is noise: it takes two metrics there at once, or one past `extreme`. */
  watch: number;
  extreme: number;
}

/**
 * Per-match lines sit well past the profile ones: a single match swings a lot (a legit player's
 * last 100 crossed the profile lines in 1 of every 4 matches), so only near-impossible games count.
 */
const MATCH_RULES: FineRule[] = [
  {
    key: "ttd",
    label: "Tiempo al daño",
    direction: "lower",
    format: (v) => `${fmt(v)} ms`,
    read: (m) => m.ttdMs,
    watch: 300,
    extreme: 250,
  },
  {
    key: "preaim",
    label: "Preaim",
    direction: "lower",
    format: (v) => `${fmt(v, 1)}°`,
    read: (m) => m.preaimDeg,
    watch: 3,
    extreme: 2,
  },
  {
    key: "hs",
    label: "Precisión a la cabeza",
    direction: "higher",
    format: (v) => `${fmt(v)}%`,
    read: (m) => m.headPct,
    watch: 45,
    extreme: 55,
  },
];

/** Shorter matches don't have enough duels for their averages to mean anything. */
const MIN_MATCH_ROUNDS = 13;
/** Under this many matches with data there's nothing to scan one by one. */
const MIN_SCANNED_MATCHES = 5;
/** From this many flagged matches the pattern counts as strong. */
const STRONG_MATCH_COUNT = 3;

function scanMatches(player: PlayerData): { scanned: number; atypical: AtypicalMatch[] } {
  const matches = playerMatchStats(player.leetifyMatches, player.steamid).filter(
    (m) => (m.rounds ?? 0) >= MIN_MATCH_ROUNDS,
  );
  let scanned = 0;
  const atypical: AtypicalMatch[] = [];

  for (const match of matches) {
    const values = MATCH_RULES.map((rule) => ({ rule, value: rule.read(match) }));
    if (values.every((v) => v.value === null)) continue;
    scanned++;

    const hits = values.filter(
      (v): v is { rule: FineRule; value: number } => v.value !== null && beyond(v.rule.direction, v.value, v.rule.watch),
    );
    const extreme = hits.some((h) => beyond(h.rule.direction, h.value, h.rule.extreme));
    if (hits.length >= 2 || extreme) {
      atypical.push({ id: match.id, hits: hits.map((h) => ({ key: h.rule.key, value: h.rule.format(h.value) })) });
    }
  }
  return { scanned, atypical };
}

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

  const { scanned, atypical } = scanMatches(player);
  if (scanned >= MIN_SCANNED_MATCHES) {
    checked.push("Partidas una por una");
    if (atypical.length > 0) {
      flags.push({
        key: "matches",
        label: "Partidas atípicas",
        value: `${atypical.length} de ${scanned}`,
        reason: "Partidas con tiempo al daño, preaim o precisión a la cabeza casi imposibles",
        strong: atypical.length >= STRONG_MATCH_COUNT,
      });
    }
  }
  const atypicalMatches = scanned >= MIN_SCANNED_MATCHES ? atypical : [];

  if (checked.length === 0) return { level: "unknown", flags, checked, atypicalMatches };
  const score = flags.reduce((sum, f) => sum + (f.strong ? 2 : 1), 0);
  const level: SuspicionLevel = score >= 4 ? "alert" : score >= 1 ? "watch" : "clean";
  return { level, flags, checked, atypicalMatches };
}

/** Leetify's `data_source` values that are Valve servers (VAC). Wingman is left out: 2v2 plays differently. */
const VALVE_SOURCES = new Set(["matchmaking", "matchmaking_competitive", "premier"]);
const GAP_MIN_FACEIT = 5;
const GAP_MIN_VALVE = 10;
/** How much worse, relative to their Valve median, a metric has to be on FACEIT to count. */
const GAP_RATIO = 0.2;
/** It takes this many metrics dropping together; one alone is just a bad week. */
const GAP_MIN_METRICS = 2;

export interface PlatformGap {
  rows: { key: FineMetric; label: string; valve: string; faceit: string }[];
  valveMatches: number;
  faceitMatches: number;
}

/**
 * Whether the player's fine stats drop on FACEIT, where the anticheat is stricter, compared with
 * Premier/MM. Only the mascot tells this one: it's a hint for whoever digs deeper, not a verdict.
 */
export function analyzePlatformGap(player: PlayerData): PlatformGap | null {
  const matches = playerMatchStats(player.leetifyMatches, player.steamid).filter(
    (m) => (m.rounds ?? 0) >= MIN_MATCH_ROUNDS,
  );
  const faceit = matches.filter((m) => m.dataSource === "faceit");
  const valve = matches.filter((m) => VALVE_SOURCES.has(m.dataSource));

  const rows: PlatformGap["rows"] = [];
  let faceitMatches = 0;
  let valveMatches = 0;
  for (const rule of MATCH_RULES) {
    const f = present(faceit.map(rule.read));
    const v = present(valve.map(rule.read));
    if (f.length < GAP_MIN_FACEIT || v.length < GAP_MIN_VALVE) continue;
    faceitMatches = Math.max(faceitMatches, f.length);
    valveMatches = Math.max(valveMatches, v.length);

    const fm = median(f) as number;
    const vm = median(v) as number;
    const worse = rule.direction === "lower" ? (fm - vm) / vm : (vm - fm) / vm;
    if (worse >= GAP_RATIO) rows.push({ key: rule.key, label: rule.label, valve: rule.format(vm), faceit: rule.format(fm) });
  }

  return rows.length >= GAP_MIN_METRICS ? { rows, valveMatches, faceitMatches } : null;
}

/** The flag for one metric, if the report has it: how tiles and comparison cells find their state. */
export function flagFor(report: SuspicionReport | null | undefined, key: SuspectMetric): SuspicionFlag | undefined {
  return report?.flags.find((f) => f.key === key);
}
