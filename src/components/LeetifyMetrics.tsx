import type { LeetifyMatch, LeetifyProfile, LeetifyStatus } from "@/lib/leetify";
import { gaugeRatio, type Direction } from "@/lib/gauge";
import { compareToFaceitLevel10, FACEIT_LEVEL_10_BENCHMARK } from "@/lib/proBenchmarks";
import { Label, Meter, SandLink, SectionHeading, STAT_CELL, StatGrid } from "@/components/Dossier";

type GaugeSpec = { value: number; min: number; max: number; direction: Direction };

function Tile({
  label,
  value,
  unit,
  gauge,
  benchmark,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  gauge?: GaugeSpec;
  /** Reference value drawn as a tick on the meter, in the gauge's units. */
  benchmark?: { value: number; direction: Direction } | null;
  note?: React.ReactNode;
}) {
  const comparison =
    gauge && benchmark ? compareToFaceitLevel10(gauge.value, benchmark.value, benchmark.direction) : null;

  return (
    <div className={STAT_CELL}>
      <Label>{label}</Label>
      <span className="font-label text-4xl leading-none font-bold tabular-nums">
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
        <span className="text-xs" style={{ color: comparison.color }}>
          {comparison.label}
        </span>
      )}
      {comparison?.unusual && (
        <span className="text-xs text-paint">Valor atípico frente al resto</span>
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
      <SectionHeading
        aside={
          <span className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-0.5 bg-foreground" aria-hidden /> promedio Nivel 10 de FACEIT
            </span>
            <SandLink href="https://leetify.com/">Data Provided by Leetify</SandLink>
          </span>
        }
      >
        Rendimiento
      </SectionHeading>

      {!profile ? (
        <p className="text-sm text-ink-muted">Sin datos públicos de Leetify para este perfil todavía.</p>
      ) : (
        // Ordered like a scout reads it: the numbers that give away something odd come first.
        <StatGrid>
          <Tile
            label="Tiempo al daño"
            value={fmt(profile.stats.reaction_time_ms, 0)}
            unit="ms"
            gauge={gauge(profile.stats.reaction_time_ms, 200, 900, "lower-better")}
            benchmark={{ value: FACEIT_LEVEL_10_BENCHMARK.timeToDamageMs, direction: "lower-better" }}
          />
          <Tile
            label="Preaim"
            value={fmt(profile.stats.preaim)}
            unit="°"
            gauge={gauge(profile.stats.preaim, 3, 20, "lower-better")}
            benchmark={{ value: FACEIT_LEVEL_10_BENCHMARK.preaimDeg, direction: "lower-better" }}
          />
          <Tile
            label="Precisión a la cabeza"
            value={fmt(profile.stats.accuracy_head)}
            unit="%"
            gauge={gauge(profile.stats.accuracy_head, 0, 50)}
            benchmark={{ value: FACEIT_LEVEL_10_BENCHMARK.accuracyHeadPct, direction: "higher-better" }}
          />
          <Tile label="Puntería" value={fmt(profile.rating.aim)} gauge={gauge(profile.rating.aim, 0, 100)} />
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
          <Tile label="Leetify Rating" value={signed(profile.ranks.leetify)} gauge={gauge(profile.ranks.leetify, -1, 3)} />
          <Tile
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
            label="Posicionamiento"
            value={fmt(profile.rating.positioning)}
            gauge={gauge(profile.rating.positioning, 0, 100)}
          />
          <Tile label="Utilidad" value={fmt(profile.rating.utility)} gauge={gauge(profile.rating.utility, 0, 100)} />
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
        </StatGrid>
      )}
    </section>
  );
}

const EMPTY_COPY: Record<Exclude<LeetifyStatus, "ok">, { title: string; body: string }> = {
  not_found: {
    title: "Sin cuenta en Leetify",
    body: "Este Steam no está registrado en Leetify, así que no hay estadísticas de CS2 para mostrar. El jugador tiene que entrar a leetify.com con su Steam.",
  },
  private: {
    title: "Perfil privado en Leetify",
    body: "El jugador tiene su perfil de Leetify en privado. Mientras siga así, Leetify no comparte sus estadísticas.",
  },
  unavailable: {
    title: "Leetify no respondió",
    body: "No pudimos traer los datos de Leetify en este momento (puede estar lento o limitando consultas).",
  },
};

/** Replaces the whole CS2 tab when Leetify has nothing to give, saying why. */
export function LeetifyEmpty({ status, onRetry }: { status: Exclude<LeetifyStatus, "ok">; onRetry?: () => void }) {
  const copy = EMPTY_COPY[status];
  return (
    <section className="flex flex-col items-center gap-4 border border-line px-6 py-14 text-center">
      <p className="font-display text-3xl leading-none font-extrabold text-sand uppercase">{copy.title}</p>
      <p className="max-w-md text-sm text-ink-muted">{copy.body}</p>
      {status === "unavailable" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-10 bg-paint px-5 font-label text-sm font-bold tracking-[0.14em] text-white uppercase transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.97]"
        >
          Reintentar
        </button>
      )}
      {status === "not_found" && (
        <SandLink href="https://leetify.com/">Ir a Leetify</SandLink>
      )}
    </section>
  );
}
