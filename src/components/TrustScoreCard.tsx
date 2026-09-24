import type { TrustScoreResult } from "@/lib/trustScore";
import { trustScoreColor } from "@/lib/rankColors";
import { Label, Meter } from "@/components/Dossier";

export function TrustScoreCard({ result }: { result: TrustScoreResult }) {
  return (
    <div className="flex w-full flex-col gap-3 sm:w-80 lg:shrink-0">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Label>Trust Score</Label>
          <span className="font-label text-sm font-bold tracking-[0.1em] uppercase" style={{ color: trustScoreColor(result.score) }}>
            {result.tier}
          </span>
        </div>
        <span className="font-label text-6xl leading-[0.8] font-bold tabular-nums">
          {result.score}
          <span className="text-3xl text-ink-muted">%</span>
        </span>
      </div>

      <dl className="flex flex-col gap-2">
        {result.breakdown.map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <dt className="text-[13px] text-ink-muted">{item.label}</dt>
            <dd className="text-[13px] tabular-nums">{item.score}</dd>
            <div className="col-span-2">
              <Meter ratio={item.score / 100} />
            </div>
          </div>
        ))}
      </dl>
      <p className="text-xs text-ink-muted">Estimación de LuckyData según bans, antigüedad y nivel de Steam.</p>
    </div>
  );
}
