"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import type { RecentMatchRank } from "@/lib/leetify";
import { premierRankColor } from "@/lib/rankColors";
import { PremierBadge } from "@/components/PremierBadge";

const PREMIER_RANK_TYPE = 11;

/** Marcas parejas en números redondos que cubren [min, max], al estilo de un eje auto-generado. */
function niceTicks(min: number, max: number, count = 7): number[] {
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

function PremierAxisTick({
  x,
  y,
  payload,
}: {
  x: string | number;
  y: string | number;
  payload: { value: number };
}) {
  const value = payload.value;
  const color = premierRankColor(value);
  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={4} y={-9} width={76} height={18} style={{ overflow: "visible" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "2px 6px",
            backgroundColor: `${color}26`,
            border: `1px solid ${color}`,
            transform: "skewX(-10deg)",
            fontSize: 10,
            fontWeight: 700,
            color,
            whiteSpace: "nowrap",
          }}
        >
          {value.toLocaleString("es-AR")}
        </div>
      </foreignObject>
    </g>
  );
}

function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumXX = points.reduce((a, p) => a + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { rank: number; date: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-foreground">{point.rank.toLocaleString("es-AR")}</div>
      <div className="text-muted">{point.date}</div>
    </div>
  );
}

export function PremierTrend({ recentMatches }: { recentMatches: RecentMatchRank[] }) {
  const series = recentMatches
    .filter((m) => m.rank_type === PREMIER_RANK_TYPE && m.rank !== null && m.rank > 0)
    .slice()
    .reverse();

  if (series.length < 5) {
    return (
      <section className="mt-10">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Historial de Premier
        </h2>
        <p className="text-sm text-muted">
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

  const { slope, intercept } = linearRegression(ranks.map((r, i) => ({ x: i, y: r })));

  const data = series.map((m, i) => ({
    idx: i,
    rank: m.rank as number,
    trend: Math.round(slope * i + intercept),
    date: new Date(m.finished_at).toLocaleDateString("es-AR"),
  }));

  const color = premierRankColor(current);

  const axisTicks = niceTicks(min, max, 7);
  const domainMin = axisTicks[0];
  const domainMax = axisTicks[axisTicks.length - 1];

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
        Historial de Premier
      </h2>

      <div className="border border-border bg-surface p-6">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 8 }}>
              <YAxis
                domain={[domainMin, domainMax]}
                ticks={axisTicks}
                interval={0}
                orientation="right"
                axisLine={false}
                tickLine={false}
                width={84}
                tick={(props) => (
                  <PremierAxisTick
                    x={props.x}
                    y={props.y}
                    payload={props.payload as { value: number }}
                  />
                )}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="var(--muted)"
                strokeWidth={1}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="rank"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Actual</span>
            <PremierBadge rating={current} color={color} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Más alto (ventana)</span>
            <span className="text-lg font-semibold" style={{ color: premierRankColor(max) }}>
              {max.toLocaleString("es-AR")}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Más bajo (ventana)</span>
            <span className="text-lg font-semibold" style={{ color: premierRankColor(min) }}>
              {min.toLocaleString("es-AR")}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Record</span>
            <span className="text-lg font-semibold">
              <span style={{ color: "var(--good)" }}>{wins}W</span> /{" "}
              <span style={{ color: "var(--bad)" }}>{losses}L</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
