import type { LeetifyMatch } from "@/lib/leetify";
import { MAP_IMAGES, MapGrid, type MapGridItem } from "@/components/MapGrid";
import { mapDisplayName } from "@/components/LeetifyMatchHistory";
import { SectionHeading } from "@/components/Dossier";

/** Only Valve 5v5 matches: FACEIT has its own tab and Wingman maps are a different game. */
const SOURCES = new Set(["matchmaking", "matchmaking_competitive", "premier"]);

const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

/** Per-map record built from the player's recent Leetify matches. */
export function LeetifyMaps({ matches, steamid64 }: { matches: LeetifyMatch[]; steamid64: string }) {
  const byMap = new Map<string, { wins: number; decided: number; kd: number[]; adr: number[]; total: number }>();
  for (const match of matches) {
    if (!SOURCES.has(match.data_source)) continue;
    const me = match.stats.find((s) => s.steam64_id === steamid64);
    if (!me) continue;
    const mine = match.team_scores.find((t) => t.team_number === me.initial_team_number);
    const other = match.team_scores.find((t) => t.team_number !== me.initial_team_number);

    const entry = byMap.get(match.map_name) ?? { wins: 0, decided: 0, kd: [], adr: [], total: 0 };
    entry.total++;
    if (mine && other && mine.score !== other.score) {
      entry.decided++;
      if (mine.score > other.score) entry.wins++;
    }
    if (me.kd_ratio !== null) entry.kd.push(me.kd_ratio);
    if (me.total_damage !== null && me.rounds_count) entry.adr.push(me.total_damage / me.rounds_count);
    byMap.set(match.map_name, entry);
  }

  const maps: MapGridItem[] = [...byMap.entries()]
    .map(([name, e]) => ({
      name: mapDisplayName(name),
      image: MAP_IMAGES[name] ?? null,
      matches: e.total,
      winRate: e.decided ? (e.wins / e.decided) * 100 : null,
      kd: average(e.kd),
      adr: average(e.adr),
    }))
    .sort((a, b) => b.matches - a.matches);

  if (maps.length === 0) return null;
  const total = maps.reduce((sum, m) => sum + m.matches, 0);

  return (
    <section className="mt-16">
      <SectionHeading
        aside={<span className="text-[13px] text-ink-muted">Premier y MM · últimas {total} partidas</span>}
      >
        Mapas
      </SectionHeading>
      <MapGrid maps={maps} />
    </section>
  );
}
