"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";

export function TrustGauge({ score, color, size = 92 }: { score: number; color: string; size?: number }) {
  const data = [{ value: score, fill: color }];

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        data={data}
        innerRadius="76%"
        outerRadius="100%"
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
        <RadialBar
          dataKey="value"
          background={{ fill: "var(--border)" }}
          cornerRadius={99}
          isAnimationActive={false}
        />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-semibold tracking-tight" style={{ color }}>
          {score}%
        </span>
      </div>
    </div>
  );
}
