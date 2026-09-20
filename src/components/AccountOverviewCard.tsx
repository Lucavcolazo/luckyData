import Image from "next/image";
import type { PlayerBans, PlayerSummary } from "@/lib/steam";
import type { InventoryValueResult } from "@/lib/inventory";
import type { TrustScoreResult } from "@/lib/trustScore";
import { TrustScoreCard } from "@/components/TrustScoreCard";
import { SteamIcon } from "@/components/icons/SteamIcon";
import { SteamDbIcon } from "@/components/icons/SteamDbIcon";

const usdFmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD" });

function BanBadge({ label, flagged }: { label: string; flagged: boolean }) {
  const color = flagged ? "var(--bad)" : "var(--good)";
  return (
    <span
      className="flex items-center gap-1.5 border border-border px-2.5 py-1 text-xs font-medium"
      style={{ color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function AccountOverviewCard({
  summary,
  level,
  bans,
  isPublic,
  steamid,
  steamDbUrl,
  inventory,
  trust,
}: {
  summary: PlayerSummary;
  level: number | null;
  bans: PlayerBans | null;
  isPublic: boolean;
  steamid: string;
  steamDbUrl: string;
  inventory: InventoryValueResult;
  trust: TrustScoreResult;
}) {
  return (
    <div className="animate-fade-up border border-border bg-surface p-6">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <Image
            src={summary.avatarfull}
            alt={summary.personaname}
            width={88}
            height={88}
            className="h-[88px] w-[88px] border border-border"
            unoptimized
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted">Datos de la cuenta</span>
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{summary.personaname}</h1>
              {level !== null && <span className="text-sm text-muted">Nivel {level}</span>}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              {summary.loccountrycode && <span>{summary.loccountrycode}</span>}
              {summary.timecreated && (
                <span>
                  Cuenta desde{" "}
                  {new Date(summary.timecreated * 1000).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <TrustScoreCard result={trust} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-wide text-muted">Detalles de la cuenta</span>

          {bans && (
            <div className="flex flex-wrap gap-2">
              <BanBadge
                label={bans.VACBanned ? `${bans.NumberOfVACBans} VAC ban` : "Sin VAC ban"}
                flagged={bans.VACBanned}
              />
              <BanBadge
                label={
                  bans.NumberOfGameBans > 0
                    ? `${bans.NumberOfGameBans} game ban`
                    : "Sin game ban"
                }
                flagged={bans.NumberOfGameBans > 0}
              />
              <BanBadge
                label={bans.CommunityBanned ? "Community ban" : "Community OK"}
                flagged={bans.CommunityBanned}
              />
              {(bans.VACBanned || bans.NumberOfGameBans > 0) && (
                <span className="flex items-center px-1 text-xs text-muted">
                  hace {bans.DaysSinceLastBan} días
                </span>
              )}
            </div>
          )}

          <div className="text-xs text-muted">
            SteamID64: {steamid} · Visibilidad: {isPublic ? "Pública" : "Privada"}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={summary.profileurl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-medium tracking-tight transition-colors hover:bg-foreground hover:text-background"
            >
              <SteamIcon className="h-3.5 w-3.5" />
              Steam ↗
            </a>
            <a
              href={steamDbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-medium tracking-tight transition-colors hover:bg-foreground hover:text-background"
            >
              <SteamDbIcon className="h-3.5 w-3.5" />
              SteamDB ↗
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:border-l sm:border-border sm:pl-6">
          <span className="text-xs uppercase tracking-wide text-muted">Inventario CS2</span>
          {inventory.status === "ok" ? (
            <span className="text-2xl font-semibold tracking-tight">
              {usdFmt.format(inventory.totalValueUsd)}
            </span>
          ) : (
            <span className="text-sm text-muted">
              {inventory.status === "private_or_empty" && "Inventario privado o vacío."}
              {inventory.status === "rate_limited" &&
                "Steam limitó las consultas — probá de nuevo en un rato."}
              {inventory.status === "error" && "No pudimos calcular el inventario."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
