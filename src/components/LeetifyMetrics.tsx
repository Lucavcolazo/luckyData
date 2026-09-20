import type { LeetifyMatch, LeetifyProfile } from "@/lib/leetify";
import { gaugeColor, type Direction } from "@/lib/gauge";
import { Histogram } from "@/components/Histogram";

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
  history,
  color: forcedColor,
}: {
  label: string;
  value: string;
  gauge?: { value: number; min: number; max: number; direction: Direction };
  history?: { values: number[]; markValue: number | null; direction: Direction };
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
      {history && history.values.length >= 3 ? <Histogram {...history} /> : gauge ? <Gauge {...gauge} /> : <div className="h-8" />}
    </div>
  );
}

function PlainTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 bg-background p-4">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-lg font-semibold tracking-tight">{value}</span>
    </div>
  );
}

const fmt = (n: number | null, decimals = 1) => (n === null ? "—" : n.toFixed(decimals));

const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

/** Serie (sin orden particular) de una métrica por partida, para el jugador consultado. */
function matchSeries(
  matches: LeetifyMatch[],
  steamid64: string,
  pick: (stats: LeetifyMatch["stats"][number]) => number | null,
): number[] {
  return matches
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
  const timeToDamageSeries = matchSeries(matches, steamid64, (s) =>
    s.reaction_time !== null ? s.reaction_time * 1000 : null,
  );
  const preaimSeries = matchSeries(matches, steamid64, (s) => s.preaim);
  const kdSeries = matchSeries(matches, steamid64, (s) => s.kd_ratio);
  const adrSeries = matchSeries(matches, steamid64, (s) =>
    s.total_damage !== null && s.rounds_count ? s.total_damage / s.rounds_count : null,
  );
  const accuracyHeadSeries = matchSeries(matches, steamid64, (s) =>
    s.accuracy_head !== null ? s.accuracy_head * 100 : null,
  );
  const ratingSeries = matchSeries(matches, steamid64, (s) => s.leetify_rating);

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
          <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
            <ChartTile
              label="Leetify Rating"
              value={fmt(profile.ranks.leetify, 2)}
              history={{ values: ratingSeries, markValue: profile.ranks.leetify, direction: "higher-better" }}
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
              label="Time to Damage"
              value={profile.stats.reaction_time_ms !== null ? `${fmt(profile.stats.reaction_time_ms, 0)}ms` : "—"}
              history={{
                values: timeToDamageSeries,
                markValue: profile.stats.reaction_time_ms,
                direction: "lower-better",
              }}
            />
            <ChartTile
              label="Preaim"
              value={profile.stats.preaim !== null ? `${fmt(profile.stats.preaim)}°` : "—"}
              history={{ values: preaimSeries, markValue: profile.stats.preaim, direction: "lower-better" }}
            />
            <ChartTile
              label="Accuracy Head"
              value={profile.stats.accuracy_head !== null ? `${fmt(profile.stats.accuracy_head)}%` : "—"}
              history={{
                values: accuracyHeadSeries,
                markValue: profile.stats.accuracy_head,
                direction: "higher-better",
              }}
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

          <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
            <ChartTile
              label="K/D Ratio (promedio)"
              value={fmt(average(kdSeries), 2)}
              history={
                kdSeries.length
                  ? { values: kdSeries, markValue: average(kdSeries), direction: "higher-better" }
                  : undefined
              }
            />
            <ChartTile
              label="ADR (promedio)"
              value={fmt(average(adrSeries), 0)}
              history={
                adrSeries.length
                  ? { values: adrSeries, markValue: average(adrSeries), direction: "higher-better" }
                  : undefined
              }
            />
          </div>

          <div>
            <h3 className="mb-2 text-xs text-muted">Otros datos</h3>
            <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
              <PlainTile label="Total Matches" value={profile.total_matches?.toLocaleString("es-AR") ?? "—"} />
              <PlainTile label="Clutch" value={fmt(profile.rating.clutch)} />
              <PlainTile label="Opening" value={fmt(profile.rating.opening)} />
              <PlainTile
                label="Avg HE Dmg"
                value={
                  profile.stats.he_foes_damage_avg !== null
                    ? `${fmt(profile.stats.he_foes_damage_avg)} / ${fmt(profile.stats.he_friends_damage_avg ?? 0)}`
                    : "—"
                }
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
