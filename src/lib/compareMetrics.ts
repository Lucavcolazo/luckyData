import type { Direction } from "@/lib/gauge";
import type { PlayerData } from "@/lib/playerData";
import type { StatsSource } from "@/components/StatsSwitch";
import type { SuspectMetric } from "@/lib/suspicion";

const PREMIER_RANK_TYPE = 11;

export interface CompareMetric {
  key: string;
  label: string;
  direction: Direction;
  get: (p: PlayerData) => number | null;
  format: (n: number) => string;
  note?: string;
}

export interface CompareSection {
  title: string;
  metrics: CompareMetric[];
}

const num = (decimals: number) => (n: number) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const pct = (decimals = 1) => (n: number) => `${num(decimals)(n)}%`;
const signed = (n: number) => `${n > 0 ? "+" : ""}${num(2)(n)}`;

const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

function myMatchStats(p: PlayerData) {
  return p.leetifyMatches
    .map((m) => m.stats.find((s) => s.steam64_id === p.steamid))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);
}

function premierWinRate(p: PlayerData): number | null {
  const premier = (p.leetify?.recent_matches ?? []).filter((m) => m.rank_type === PREMIER_RANK_TYPE);
  const decided = premier.filter((m) => m.outcome === "win" || m.outcome === "loss");
  if (decided.length === 0) return null;
  return (decided.filter((m) => m.outcome === "win").length / decided.length) * 100;
}

const CS2_SECTIONS: CompareSection[] = [
  {
    title: "Rango",
    metrics: [
      { key: "premier", label: "Premier", direction: "higher-better", get: (p) => p.leetify?.ranks.premier ?? null, format: num(0) },
    ],
  },
  {
    title: "Rendimiento",
    metrics: [
      { key: "rating", label: "Leetify Rating", direction: "higher-better", get: (p) => p.leetify?.ranks.leetify ?? null, format: signed },
      {
        key: "winrate",
        label: "Victorias",
        direction: "higher-better",
        get: (p) => (p.leetify?.winrate != null ? p.leetify.winrate * 100 : null),
        format: pct(),
      },
      {
        key: "premierWr",
        label: "Victorias en Premier",
        direction: "higher-better",
        get: premierWinRate,
        format: pct(0),
        note: "Últimas partidas de Premier",
      },
      { key: "aim", label: "Puntería", direction: "higher-better", get: (p) => p.leetify?.rating.aim ?? null, format: num(1) },
      { key: "positioning", label: "Posicionamiento", direction: "higher-better", get: (p) => p.leetify?.rating.positioning ?? null, format: num(1) },
      { key: "utility", label: "Utilidad", direction: "higher-better", get: (p) => p.leetify?.rating.utility ?? null, format: num(1) },
      { key: "spray", label: "Precisión de spray", direction: "higher-better", get: (p) => p.leetify?.stats.spray_accuracy ?? null, format: pct() },
      {
        key: "strafe",
        label: "Counter-strafe",
        direction: "higher-better",
        get: (p) => p.leetify?.stats.counter_strafing_good_shots_ratio ?? null,
        format: pct(),
      },
      {
        key: "trades",
        label: "Trades logrados",
        direction: "higher-better",
        get: (p) => p.leetify?.stats.trade_kills_success_percentage ?? null,
        format: pct(),
      },
      {
        key: "traded",
        label: "Muertes tradeadas",
        direction: "higher-better",
        get: (p) => p.leetify?.stats.traded_deaths_success_percentage ?? null,
        format: pct(),
      },
      {
        key: "ttd",
        label: "Tiempo al daño",
        direction: "lower-better",
        get: (p) => p.leetify?.stats.reaction_time_ms ?? null,
        format: (n) => `${num(0)(n)} ms`,
      },
      { key: "preaim", label: "Preaim", direction: "lower-better", get: (p) => p.leetify?.stats.preaim ?? null, format: (n) => `${num(1)(n)}°` },
      { key: "hs", label: "Precisión a la cabeza", direction: "higher-better", get: (p) => p.leetify?.stats.accuracy_head ?? null, format: pct() },
      {
        key: "kd",
        label: "K/D promedio",
        direction: "higher-better",
        get: (p) => average(myMatchStats(p).map((s) => s.kd_ratio).filter((v): v is number => v !== null)),
        format: num(2),
      },
      {
        key: "adr",
        label: "ADR promedio",
        direction: "higher-better",
        get: (p) =>
          average(
            myMatchStats(p)
              .map((s) => (s.total_damage !== null && s.rounds_count ? s.total_damage / s.rounds_count : null))
              .filter((v): v is number => v !== null),
          ),
        format: num(0),
      },
    ],
  },
];

const life = (p: PlayerData) => p.faceit?.lifetime ?? null;

const FACEIT_SECTIONS: CompareSection[] = [
  {
    title: "Rango",
    metrics: [
      { key: "faceit", label: "FACEIT ELO", direction: "higher-better", get: (p) => p.faceit?.elo ?? null, format: num(0) },
    ],
  },
  {
    title: "Rendimiento",
    metrics: [
      { key: "fWinrate", label: "Victorias", direction: "higher-better", get: (p) => life(p)?.winRate ?? null, format: pct(0) },
      { key: "fKd", label: "K/D promedio", direction: "higher-better", get: (p) => life(p)?.kd ?? null, format: num(2) },
      { key: "fAdr", label: "ADR", direction: "higher-better", get: (p) => life(p)?.adr ?? null, format: num(1) },
      { key: "fHs", label: "Headshots", direction: "higher-better", get: (p) => life(p)?.hsPct ?? null, format: pct(0) },
      {
        key: "fEntry",
        label: "Entradas ganadas",
        direction: "higher-better",
        get: (p) => life(p)?.entrySuccess ?? null,
        format: pct(0),
      },
      { key: "f1v1", label: "Clutch 1v1", direction: "higher-better", get: (p) => life(p)?.clutch1v1Rate ?? null, format: pct(0) },
      { key: "f1v2", label: "Clutch 1v2", direction: "higher-better", get: (p) => life(p)?.clutch1v2Rate ?? null, format: pct(0) },
      {
        key: "fUtilDmg",
        label: "Daño de utilidad",
        direction: "higher-better",
        get: (p) => life(p)?.utilityDamagePerRound ?? null,
        format: num(1),
        note: "Por ronda",
      },
      {
        key: "fFlash",
        label: "Flashes efectivas",
        direction: "higher-better",
        get: (p) => life(p)?.flashSuccess ?? null,
        format: pct(0),
      },
      {
        key: "fUtil",
        label: "Utilidad efectiva",
        direction: "higher-better",
        get: (p) => life(p)?.utilitySuccess ?? null,
        format: pct(0),
      },
      {
        key: "fStreak",
        label: "Mejor racha",
        direction: "higher-better",
        get: (p) => life(p)?.longestStreak ?? null,
        format: num(0),
        note: "Victorias seguidas",
      },
    ],
  },
];

export const COMPARE_SOURCES: Record<StatsSource, CompareSection[]> = {
  cs2: CS2_SECTIONS,
  faceit: FACEIT_SECTIONS,
};

/** Compare rows that the suspicion analysis also judges, and the metric they map to there. */
export const SUSPECT_METRIC: Partial<Record<string, SuspectMetric>> = {
  aim: "aim",
  ttd: "ttd",
  preaim: "preaim",
  hs: "hs",
  fHs: "faceitHs",
};

export type Winner = "a" | "b" | "tie" | null;

/** Which side wins a metric. Values are compared after formatting so a visible tie reads as a tie. */
export function winnerOf(metric: CompareMetric, a: number | null, b: number | null): Winner {
  if (a === null || b === null) return null;
  if (metric.format(a) === metric.format(b)) return "tie";
  const aBetter = metric.direction === "higher-better" ? a > b : a < b;
  return aBetter ? "a" : "b";
}

/** Bar length for each side, relative to the better of the two (the winner fills its half). */
export function relativeRatios(metric: CompareMetric, a: number | null, b: number | null): [number, number] {
  if (a === null || b === null) return [a === null ? 0 : 1, b === null ? 0 : 1];
  if (metric.direction === "higher-better") {
    const lo = Math.min(a, b, 0);
    const top = Math.max(a, b) - lo || 1;
    return [(a - lo) / top, (b - lo) / top];
  }
  // Lower is better: invert so the smaller value gets the longer bar.
  const best = Math.min(a, b);
  if (best <= 0) return [a === best ? 1 : 0.15, b === best ? 1 : 0.15];
  return [best / a, best / b];
}
