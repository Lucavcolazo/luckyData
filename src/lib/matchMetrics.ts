import type { LeetifyMatch } from "@/lib/leetify";

/** One match's fine-grained numbers for the player looked up, in the same units as the profile. */
export interface MatchFineStats {
  id: string;
  dataSource: string;
  rounds: number | null;
  ttdMs: number | null;
  preaimDeg: number | null;
  /** 0-100, like the profile's `accuracy_head`. */
  headPct: number | null;
}

/** Per-match fine stats for `steamid64`, newest first (the order Leetify returns them). */
export function playerMatchStats(matches: LeetifyMatch[], steamid64: string): MatchFineStats[] {
  return matches.flatMap((m) => {
    const s = m.stats.find((p) => p.steam64_id === steamid64);
    if (!s) return [];
    return [
      {
        id: m.id,
        dataSource: m.data_source,
        rounds: s.rounds_count,
        ttdMs: s.reaction_time !== null ? s.reaction_time * 1000 : null,
        preaimDeg: s.preaim,
        headPct: s.accuracy_head !== null ? s.accuracy_head * 100 : null,
      },
    ];
  });
}

export const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export const present = (values: (number | null)[]) => values.filter((v): v is number => v !== null);
