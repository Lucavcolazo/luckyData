import type { TrustScoreResult } from "@/lib/trustScore";
import { Label } from "@/components/Dossier";

/**
 * Account history score (bans, age, Steam level). Deliberately quiet: it says nothing about how the
 * player plays, so it must not read as the verdict. Only a poor history gets colour, as a warning.
 */
export function TrustScoreCard({ result }: { result: TrustScoreResult }) {
  const warn = result.score < 40 ? "text-paint" : result.score < 65 ? "text-warn" : "text-ink-muted";
  return (
    <div className="flex min-w-0 flex-col gap-2" title="Estimación de LuckyData según bans, antigüedad y nivel de Steam. No mide cómo juega.">
      <Label>Historial de cuenta</Label>
      <span className="font-label text-4xl leading-[0.85] font-bold tabular-nums sm:text-5xl">
        {result.score}
        <span className="text-xl text-ink-muted sm:text-2xl">%</span>
      </span>
      <span className={`font-label text-sm font-bold tracking-[0.1em] uppercase ${warn}`}>{result.tier}</span>
    </div>
  );
}
