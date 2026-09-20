import type { TrustScoreResult } from "@/lib/trustScore";
import { trustScoreColor } from "@/lib/rankColors";

export function TrustScoreCard({ result }: { result: TrustScoreResult }) {
  const color = trustScoreColor(result.score);
  return (
    <div className="flex flex-col items-end gap-1 border-l border-border pl-5">
      <span className="text-xs uppercase tracking-wide text-muted">Trust Score</span>
      <span className="text-4xl font-semibold tracking-tight" style={{ color }}>
        {result.score}%
      </span>
      <span className="text-xs font-medium" style={{ color }}>
        {result.tier}
      </span>
    </div>
  );
}
