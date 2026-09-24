import type { LeetifyMatch, LeetifyProfile } from "@/lib/leetify";
import { gaugeRatio, type Direction } from "@/lib/gauge";
import { compareToFaceitLevel10, FACEIT_LEVEL_10_BENCHMARK } from "@/lib/proBenchmarks";
import { Label, Meter, SandLink, SectionHeading } from "@/components/Dossier";

type GaugeSpec = { value: number; min: number; max: number; direction: Direction };

function Tile({
  label,
  value,
  unit,
  gauge,
  benchmark,
  note,
  featured = false,
}: {
  label: string;
  value: string;
  unit?: string;
  gauge?: GaugeSpec;
  /** Reference value drawn as a tick on the meter, in the gauge's units. */
  benchmark?: { value: number; direction: Direction } | null;
  note?: React.ReactNode;
  featured?: boolean;
}) {
  const comparison =
    gauge && benchmark ? compareToFaceitLevel10(gauge.value, benchmark.value, benchmark.direction) : null;

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <Label>{label}</Label>
      <span
        className={`font-label leading-none font-bold tabular-nums ${featured ? "text-6xl sm:text-7xl" : "text-4xl"}`}
      >
        {value}
        {unit && value !== "—" && <span className="ml-0.5 text-[0.5em] text-ink-muted">{unit}</span>}
      </span>
      {gauge && (
        <Meter
          ratio={gaugeRatio(gauge.value, gauge.min, gauge.max, gauge.direction)}
          mark={benchmark ? gaugeRatio(benchmark.value, gauge.min, gauge.max, gauge.direction) : undefined}
        />
      )}
      {comparison && (
        <span className="text-[13px]" style={{ color: comparison.color }}>
          {comparison.label}
        </span>
      )}
      {comparison?.unusual && (
        <span className="text-[13px] text-paint">Valor atípico frente al resto de los jugadores</span>
      )}
      {note && <span className="text-xs text-ink-muted">{note}</span>}
    </div>
  );
}

const fmt = (n: number | null, decimals = 1) =>
  n === null
    ? "—"
    : n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const signed = (n: number | null, decimals = 2) => (n === null ? "—" : `${n > 0 ? "+" : ""}${fmt(n, decimals)}`);

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

const gauge = (value: number | null, min: number, max: number, direction: Direction = "higher-better") =>
  value !== null ? { value, min, max, direction } : undefined;

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
  const kd = average(kdSeries);
  const adr = average(adrSeries);

  return (
    <section className="mt-16">
      <SectionHeading aside={<SandLink href="https://leetify.com/">Data Provided by Leetify</SandLink>}>
        Rendimiento
      </SectionHeading>

      {!profile ? (
        <p className="text-sm text-ink-muted">Sin datos públicos de Leetify para este perfil todavía.</p>
      ) : (
        <div className="flex flex-col gap-12">
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-3">
            <Tile
              featured
              label="Leetify Rating"
              value={signed(profile.ranks.leetify)}
              gauge={gauge(profile.ranks.leetify, -1, 3)}
            />
            <Tile
              featured
              label="Victorias"
              value={profile.winrate !== null ? fmt(profile.winrate * 100) : "—"}
              unit="%"
              gauge={gauge(profile.winrate !== null ? profile.winrate * 100 : null, 30, 70)}
              note={
                profile.total_matches !== null
                  ? `${profile.total_matches.toLocaleString("es-AR")} partidas en Leetify`
                  : undefined
              }
            />
            <Tile featured label="Puntería" value={fmt(profile.rating.aim)} gauge={gauge(profile.rating.aim, 0, 100)} />
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-3">
            <Tile
              label="Posicionamiento"
              value={fmt(profile.rating.positioning)}
              gauge={gauge(profile.rating.positioning, 0, 100)}
            />
            <Tile label="Utilidad" value={fmt(profile.rating.utility)} gauge={gauge(profile.rating.utility, 0, 100)} />
            <Tile
              label="Precisión de spray"
              value={fmt(profile.stats.spray_accuracy)}
              unit="%"
              gauge={gauge(profile.stats.spray_accuracy, 0, 60)}
            />
            <Tile
              label="Counter-strafe"
              value={fmt(profile.stats.counter_strafing_good_shots_ratio)}
              unit="%"
              gauge={gauge(profile.stats.counter_strafing_good_shots_ratio, 0, 100)}
            />
            <Tile
              label="Trades logrados"
              value={fmt(profile.stats.trade_kills_success_percentage)}
              unit="%"
              gauge={gauge(profile.stats.trade_kills_success_percentage, 0, 100)}
            />
            <Tile
              label="Muertes tradeadas"
              value={fmt(profile.stats.traded_deaths_success_percentage)}
              unit="%"
              gauge={gauge(profile.stats.traded_deaths_success_percentage, 0, 100)}
            />
          </div>

          <div>
            <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
              <span className="font-label text-lg font-bold tracking-[0.08em] text-sand uppercase">
                Contra Nivel 10 de FACEIT
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-0.5 bg-foreground" aria-hidden /> promedio del Nivel 10
              </span>
            </p>
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-3">
              <Tile
                label="Tiempo al daño"
                value={fmt(profile.stats.reaction_time_ms, 0)}
                unit="ms"
                gauge={gauge(profile.stats.reaction_time_ms, 200, 900, "lower-better")}
                benchmark={{ value: FACEIT_LEVEL_10_BENCHMARK.timeToDamageMs, direction: "lower-better" }}
                note="Menos es mejor"
              />
              <Tile
                label="Preaim"
                value={fmt(profile.stats.preaim)}
                unit="°"
                gauge={gauge(profile.stats.preaim, 3, 20, "lower-better")}
                benchmark={{ value: FACEIT_LEVEL_10_BENCHMARK.preaimDeg, direction: "lower-better" }}
                note="Menos es mejor"
              />
              <Tile
                label="Precisión a la cabeza"
                value={fmt(profile.stats.accuracy_head)}
                unit="%"
                gauge={gauge(profile.stats.accuracy_head, 0, 50)}
                benchmark={{ value: FACEIT_LEVEL_10_BENCHMARK.accuracyHeadPct, direction: "higher-better" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-8">
            <Tile
              label="K/D promedio"
              value={fmt(kd, 2)}
              gauge={gauge(kd, 0, 2)}
              note={kdSeries.length ? `Últimas ${kdSeries.length} partidas` : undefined}
            />
            <Tile
              label="ADR promedio"
              value={fmt(adr, 0)}
              gauge={gauge(adr, 0, 120)}
              note={adrSeries.length ? `Últimas ${adrSeries.length} partidas` : undefined}
            />
          </div>
        </div>
      )}
    </section>
  );
}
