import type { TrustScoreResult } from "@/lib/trustScore";
import { trustScoreColor } from "@/lib/rankColors";
import { TrustGauge } from "@/components/TrustGauge";

export function TrustScoreCard({ result }: { result: TrustScoreResult }) {
  const color = trustScoreColor(result.score);

  return (
    <div className="flex items-center gap-4 border-l border-border pl-5">
      <TrustGauge score={result.score} color={color} />

      <div className="flex flex-col gap-2">
        <div>
          <span className="text-xs uppercase tracking-wide text-muted">Trust Score</span>
          <div className="text-sm font-semibold tracking-tight" style={{ color }}>
            {result.tier}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {result.breakdown.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-[11px] text-muted">{item.label}</span>
              <span className="h-1 w-16 bg-border">
                <span
                  className="block h-full"
                  style={{ width: `${item.score}%`, backgroundColor: trustScoreColor(item.score) }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
