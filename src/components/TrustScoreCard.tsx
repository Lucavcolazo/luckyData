import type { TrustScoreResult } from "@/lib/trustScore";
import { trustScoreColor } from "@/lib/rankColors";
import { Label } from "@/components/Dossier";

export function TrustScoreCard({ result }: { result: TrustScoreResult }) {
  return (
    <div className="flex flex-col gap-2" title="Estimación de LuckyData según bans, antigüedad y nivel de Steam">
      <Label>Trust Score</Label>
      <span className="font-label text-5xl leading-[0.85] font-bold tabular-nums">
        {result.score}
        <span className="text-2xl text-ink-muted">%</span>
      </span>
      <span
        className="font-label text-sm font-bold tracking-[0.1em] uppercase"
        style={{ color: trustScoreColor(result.score) }}
      >
        {result.tier}
      </span>
    </div>
  );
}
