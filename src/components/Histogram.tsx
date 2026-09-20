"use client";

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";
import { gaugeColor, type Direction } from "@/lib/gauge";

const BINS = 12;

function HistogramTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { rangeLabel: string; count: number } }[];
}) {
  if (!active || !payload?.length || payload[0].payload.count === 0) return null;
  const { rangeLabel, count } = payload[0].payload;
  return (
    <div className="border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg">
      <div className="font-semibold text-foreground">
        {count} {count === 1 ? "partida" : "partidas"}
      </div>
      <div className="text-muted">{rangeLabel}</div>
    </div>
  );
}

export function Histogram({
  values,
  markValue,
  direction,
}: {
  values: number[];
  markValue: number | null;
  direction: Direction;
}) {
  if (values.length < 3) return <div className="h-8 w-full" />;

  const allValues = markValue !== null ? [...values, markValue] : values;
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const counts = new Array(BINS).fill(0);
  for (const v of values) {
    const idx = Math.min(BINS - 1, Math.floor(((v - min) / range) * BINS));
    counts[idx]++;
  }

  const data = counts.map((count, i) => {
    const binMin = min + (i / BINS) * range;
    const binMax = min + ((i + 1) / BINS) * range;
    const binMid = (binMin + binMax) / 2;
    const ratio = (binMid - min) / range;
    return {
      bin: i,
      count,
      fill: gaugeColor(ratio, direction),
      rangeLabel: `${binMin.toFixed(1)} – ${binMax.toFixed(1)}`,
    };
  });

  const markBin =
    markValue !== null ? Math.min(BINS - 1, Math.floor(((markValue - min) / range) * BINS)) : null;

  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Tooltip content={<HistogramTooltip />} cursor={false} />
          <Bar dataKey="count" isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} opacity={0.85} />
            ))}
          </Bar>
          {markBin !== null && (
            <ReferenceLine x={markBin} stroke="var(--foreground)" strokeWidth={1} strokeDasharray="2 2" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
