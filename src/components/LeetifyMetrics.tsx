import type { LeetifyMatch, LeetifyProfile } from "@/lib/leetify";
import { gaugeColor, type Direction } from "@/lib/gauge";
import { compareToFaceitLevel10, FACEIT_LEVEL_10_BENCHMARK, type BenchmarkComparison } from "@/lib/proBenchmarks";

function Gauge({ value, min, max, direction }: { value: number; min: number; max: number; direction: Direction }) {
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const color = gaugeColor(ratio, direction);
  return (
    <div className="flex h-8 w-full items-end">
      <div className="h-1 w-full bg-border">
        <div className="h-full" style={{ width: `${ratio * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ChartTile({
  label,
  value,
  gauge,
  benchmark,
  color: forcedColor,
}: {
  label: string;
  value: string;
  gauge?: { value: number; min: number; max: number; direction: Direction };
  benchmark?: BenchmarkComparison | null;
  color?: string;
}) {
  const color =
    forcedColor ??
    (gauge
      ? gaugeColor(Math.min(1, Math.max(0, (gauge.value - gauge.min) / (gauge.max - gauge.min))), gauge.direction)
      : undefined);
  return (
    <div className="flex flex-col gap-2 bg-background p-5">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-2xl font-semibold tracking-tight" style={{ color }}>
        {value}
      </span>
      {gauge ? <Gauge {...gauge} /> : <div className="h-8" />}
      {benchmark && (
        <span className="text-[11px] font-medium" style={{ color: benchmark.color }}>
          {benchmark.label}
        </span>
      )}
      {benchmark?.unusual && (
        <span className="text-[11px] font-medium" style={{ color: "var(--warn)" }}>
          ⚠ Valor atípico frente al resto de los jugadores
        </span>
      )}
    </div>
  );
}

const fmt = (n: number | null, decimals = 1) => (n === null ? "—" : n.toFixed(decimals));

const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

/** Serie cronológica (más vieja a más nueva) de una métrica por partida, para el jugador consultado. */
function matchSeries(
  matches: LeetifyMatch[],
  steamid64: string,
  pick: (stats: LeetifyMatch["stats"][number]) => number | null,
): number[] {
  return matches
    .slice()
    .reverse()
    .map((m) => m.stats.find((s) => s.steam64_id === steamid64))
    .map((s) => (s ? pick(s) : null))
    .filter((v): v is number => v !== null);
}

export function LeetifyMetrics({
  profile,
  matches,
  steamid64,
}: {
  profile: LeetifyProfile | null;
  matches: LeetifyMatch[];
  steamid64: string;
}) {
  const kdSeries = matchSeries(matches, steamid64, (s) => s.kd_ratio);
  const adrSeries = matchSeries(matches, steamid64, (s) =>
    s.total_damage !== null && s.rounds_count ? s.total_damage / s.rounds_count : null,
  );

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Rendimiento</h2>
        <a
          href="https://leetify.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-[#F84982] underline"
        >
          Data Provided by Leetify
        </a>
      </div>

      {!profile ? (
        <p className="text-sm text-muted">
          Sin datos públicos de Leetify para este perfil todavía.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
            <ChartTile
              label="Leetify Rating"
              value={fmt(profile.ranks.leetify, 2)}
              gauge={
                profile.ranks.leetify !== null
                  ? { value: profile.ranks.leetify, min: -1, max: 3, direction: "higher-better" }
                  : undefined
              }
            />
            <ChartTile
              label="Win Rate"
              value={profile.winrate !== null ? `${(profile.winrate * 100).toFixed(1)}%` : "—"}
              gauge={
                profile.winrate !== null
                  ? { value: profile.winrate * 100, min: 30, max: 70, direction: "higher-better" }
                  : undefined
              }
            />
            <ChartTile
              label="Aim"
              value={fmt(profile.rating.aim)}
              gauge={
                profile.rating.aim !== null
                  ? { value: profile.rating.aim, min: 0, max: 100, direction: "higher-better" }
                  : undefined
              }
            />
            <ChartTile
              label="Positioning"
              value={fmt(profile.rating.positioning)}
              gauge={
                profile.rating.positioning !== null
                  ? { value: profile.rating.positioning, min: 0, max: 100, direction: "higher-better" }
                  : undefined
              }
            />
            <ChartTile
              label="Utility"
              value={fmt(profile.rating.utility)}
              gauge={
                profile.rating.utility !== null
                  ? { value: profile.rating.utility, min: 0, max: 100, direction: "higher-better" }
                  : undefined
              }
            />
            <ChartTile
              label="Spray Accuracy"
              value={profile.stats.spray_accuracy !== null ? `${fmt(profile.stats.spray_accuracy)}%` : "—"}
              gauge={
                profile.stats.spray_accuracy !== null
                  ? { value: profile.stats.spray_accuracy, min: 0, max: 60, direction: "higher-better" }
                  : undefined
              }
            />
            <ChartTile
              label="Counter-Strafing"
              value={
                profile.stats.counter_strafing_good_shots_ratio !== null
                  ? `${fmt(profile.stats.counter_strafing_good_shots_ratio)}%`
                  : "—"
              }
              gauge={
                profile.stats.counter_strafing_good_shots_ratio !== null
                  ? { value: profile.stats.counter_strafing_good_shots_ratio, min: 0, max: 100, direction: "higher-better" }
                  : undefined
              }
            />
            <ChartTile
              label="Trade Kills Success"
              value={
                profile.stats.trade_kills_success_percentage !== null
                  ? `${fmt(profile.stats.trade_kills_success_percentage)}%`
                  : "—"
              }
              gauge={
                profile.stats.trade_kills_success_percentage !== null
                  ? { value: profile.stats.trade_kills_success_percentage, min: 0, max: 100, direction: "higher-better" }
                  : undefined
              }
            />
            <ChartTile
              label="Traded Deaths Success"
              value={
                profile.stats.traded_deaths_success_percentage !== null
                  ? `${fmt(profile.stats.traded_deaths_success_percentage)}%`
                  : "—"
              }
              gauge={
                profile.stats.traded_deaths_success_percentage !== null
                  ? { value: profile.stats.traded_deaths_success_percentage, min: 0, max: 100, direction: "higher-better" }
                  : undefined
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
            <ChartTile
              label="Time to Damage"
              value={profile.stats.reaction_time_ms !== null ? `${fmt(profile.stats.reaction_time_ms, 0)}ms` : "—"}
              gauge={
                profile.stats.reaction_time_ms !== null
                  ? { value: profile.stats.reaction_time_ms, min: 200, max: 900, direction: "lower-better" }
                  : undefined
              }
              benchmark={compareToFaceitLevel10(
                profile.stats.reaction_time_ms,
                FACEIT_LEVEL_10_BENCHMARK.timeToDamageMs,
                "lower-better",
              )}
            />
            <ChartTile
              label="Preaim"
              value={profile.stats.preaim !== null ? `${fmt(profile.stats.preaim)}°` : "—"}
              gauge={
                profile.stats.preaim !== null
                  ? { value: profile.stats.preaim, min: 3, max: 20, direction: "lower-better" }
                  : undefined
              }
              benchmark={compareToFaceitLevel10(
                profile.stats.preaim,
                FACEIT_LEVEL_10_BENCHMARK.preaimDeg,
                "lower-better",
              )}
            />
            <ChartTile
              label="Accuracy Head"
              value={profile.stats.accuracy_head !== null ? `${fmt(profile.stats.accuracy_head)}%` : "—"}
              gauge={
                profile.stats.accuracy_head !== null
                  ? { value: profile.stats.accuracy_head, min: 0, max: 50, direction: "higher-better" }
                  : undefined
              }
              benchmark={compareToFaceitLevel10(
                profile.stats.accuracy_head,
                FACEIT_LEVEL_10_BENCHMARK.accuracyHeadPct,
                "higher-better",
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
            <ChartTile
              label="K/D Ratio (promedio)"
              value={fmt(average(kdSeries), 2)}
              gauge={
                kdSeries.length
                  ? { value: average(kdSeries)!, min: 0, max: 2, direction: "higher-better" }
                  : undefined
              }
            />
            <ChartTile
              label="ADR (promedio)"
              value={fmt(average(adrSeries), 0)}
              gauge={
                adrSeries.length
                  ? { value: average(adrSeries)!, min: 0, max: 120, direction: "higher-better" }
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}
