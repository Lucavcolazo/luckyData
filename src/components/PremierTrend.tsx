"use client";

import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RecentMatchRank } from "@/lib/leetify";
import { premierRankColor } from "@/lib/rankColors";
import { PremierBadge } from "@/components/PremierBadge";
import { SteamIcon } from "@/components/icons/SteamIcon";
import { Label, SectionHeading } from "@/components/Dossier";

const PREMIER_RANK_TYPE = 11;
/** Premier colour bands change every 5.000 points. */
const BAND_STEP = 5000;
/** A drop this big between two consecutive matches gets called out on the chart. */
const CLIFF_THRESHOLD = 2500;

/** Marcas parejas en números redondos que cubren [min, max], al estilo de un eje auto-generado. */
function niceTicks(min: number, max: number, count = 4): number[] {
  const range = max - min || 1;
  const rawStep = range / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let step: number;
  if (residual > 5) step = 10 * magnitude;
  else if (residual > 2) step = 5 * magnitude;
  else if (residual > 1) step = 2 * magnitude;
  else step = magnitude;

  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Math.round(v));
  return ticks;
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { rank: number; date: string; outcome: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const outcome = point.outcome === "win" ? "Victoria" : point.outcome === "loss" ? "Derrota" : "Empate";
  return (
    <div className="border border-line bg-panel px-3 py-2 text-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      <div className="font-label text-lg leading-tight font-bold tabular-nums">{point.rank.toLocaleString("es-AR")}</div>
      <div className="text-ink-muted">
        {point.date} · {outcome}
      </div>
    </div>
  );
}

function Stat({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="font-label text-3xl leading-none font-bold tabular-nums">{children}</div>
      {note && <span className="text-xs text-ink-muted">{note}</span>}
    </div>
  );
}

function CurrentRank({ rating }: { rating: number | null }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="flex items-center gap-2 text-ink-muted">
        <SteamIcon className="size-3.5" />
        <Label>Rango actual</Label>
      </span>
      <PremierBadge rating={rating} />
    </div>
  );
}

/** Current Premier rank, its recent history and the record over those matches. */
export function PremierTrend({
  recentMatches,
  currentRating,
}: {
  recentMatches: RecentMatchRank[];
  /** Leetify's current Premier rating; falls back to the last match in the history. */
  currentRating: number | null;
}) {
  const series = recentMatches
    .filter((m) => m.rank_type === PREMIER_RANK_TYPE && m.rank !== null && m.rank > 0)
    .slice()
    .reverse();

  if (series.length < 5) {
    return (
      <section>
        <SectionHeading>Premier</SectionHeading>
        <CurrentRank rating={currentRating ?? series[series.length - 1]?.rank ?? null} />
        <p className="mt-6 text-sm text-ink-muted">
          No hay suficientes partidas de Premier recientes para armar una tendencia.
        </p>
      </section>
    );
  }

  const ranks = series.map((m) => m.rank as number);
  const min = Math.min(...ranks);
  const max = Math.max(...ranks);
  const current = ranks[ranks.length - 1];
  const wins = series.filter((m) => m.outcome === "win").length;
  const losses = series.filter((m) => m.outcome === "loss").length;

  const data = series.map((m, i) => ({
    idx: i,
    rank: m.rank as number,
    outcome: m.outcome,
    date: new Date(m.finished_at).toLocaleDateString("es-AR"),
  }));

  const color = premierRankColor(current);
  const axisTicks = niceTicks(min, max);
  const domainMin = axisTicks[0];
  const domainMax = axisTicks[axisTicks.length - 1];

  const bands: number[] = [];
  for (let v = Math.ceil(domainMin / BAND_STEP) * BAND_STEP; v <= domainMax; v += BAND_STEP) {
    if (v > domainMin && v < domainMax) bands.push(v);
  }

  let cliff: { idx: number; drop: number } | null = null;
  for (let i = 1; i < ranks.length; i++) {
    const drop = ranks[i - 1] - ranks[i];
    if (drop >= CLIFF_THRESHOLD && (!cliff || drop > cliff.drop)) cliff = { idx: i, drop };
  }

  return (
    <section>
      <SectionHeading>Premier</SectionHeading>

      <div className="mb-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <CurrentRank rating={currentRating ?? current} />
        </div>
        <Stat label="Más alto">{max.toLocaleString("es-AR")}</Stat>
        <Stat label="Más bajo">{min.toLocaleString("es-AR")}</Stat>
        <Stat label="Récord" note={`Últimas ${series.length} de Premier`}>
          {wins}
          <span className="text-lg text-ink-muted"> G</span> · {losses}
          <span className="text-lg text-ink-muted"> P</span>
        </Stat>
      </div>

      <div className="h-56 w-full tabular-nums">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 0, bottom: 10, left: 0 }}>
            <XAxis dataKey="idx" hide />
            <YAxis
              domain={[domainMin, domainMax]}
              ticks={axisTicks}
              interval={0}
              orientation="right"
              axisLine={false}
              tickLine={false}
              width={52}
              tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
              tickFormatter={(v: number) => v.toLocaleString("es-AR")}
            />
            {axisTicks.map((t) => (
              <ReferenceLine key={t} y={t} stroke="var(--line)" />
            ))}
            {bands.map((b) => (
              <ReferenceLine key={`band-${b}`} y={b} stroke={premierRankColor(b)} strokeOpacity={0.5} strokeDasharray="3 4" />
            ))}
            {cliff && (
              <ReferenceLine
                x={cliff.idx}
                stroke="var(--ink-muted)"
                strokeDasharray="2 3"
                label={{
                  value: `−${cliff.drop.toLocaleString("es-AR")}`,
                  position: "insideTopLeft",
                  fill: "var(--ink-muted)",
                  fontSize: 12,
                }}
              />
            )}
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--line)", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="rank"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: "var(--panel)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-between pr-[52px] text-xs text-ink-muted tabular-nums">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>

    </section>
  );
}
