"use client";

import Image from "next/image";
import { useState } from "react";
import type { PlayerBans, PlayerSummary } from "@/lib/steam";
import type { InventoryValueResult } from "@/lib/inventory";
import type { TrustScoreResult } from "@/lib/trustScore";
import { TrustScoreCard } from "@/components/TrustScoreCard";
import { SteamIcon } from "@/components/icons/SteamIcon";
import { SteamDbIcon } from "@/components/icons/SteamDbIcon";
import { ExternalIcon, Label } from "@/components/Dossier";
import { CountryFlag } from "@/components/CountryFlag";

const usdFmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD" });

function BanBadge({ label, flagged }: { label: string; flagged: boolean }) {
  return (
    <span
      className={`flex items-center gap-2 border px-2 py-0.5 text-[13px] ${
        flagged ? "border-paint/60 text-paint" : "border-line text-foreground"
      }`}
    >
      <span className={`size-1.5 ${flagged ? "bg-paint" : "bg-good"}`} aria-hidden />
      {label}
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="text-[13px] text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-sand active:scale-[0.97]"
    >
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

const linkClass =
  "flex items-center gap-2 border border-line px-2.5 py-1 text-[13px] transition-[background-color,color,transform] duration-150 hover:bg-sand hover:text-panel active:scale-[0.97]";

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
  /** null while the inventory request is still running. */
  inventory: InventoryValueResult | null;
  trust: TrustScoreResult;
}) {
  const country = summary.loccountrycode;
  const meta = [
    level !== null ? `Nivel ${level} de Steam` : null,
    summary.timecreated
      ? `Cuenta desde ${new Date(summary.timecreated * 1000).toLocaleDateString("es-AR", {
          year: "numeric",
          month: "short",
        })}`
      : null,
    `Perfil ${isPublic ? "público" : "privado"}`,
  ].filter(Boolean);

  return (
    // Everything about the Steam account in one compact block, so the stats start above the fold.
    <section className="animate-fade-up border border-line bg-sand/[0.025] p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-5">
          <Image
            src={summary.avatarfull}
            alt=""
            width={88}
            height={88}
            className="size-16 shrink-0 outline outline-1 -outline-offset-1 outline-white/10 sm:size-[88px]"
            unoptimized
          />
          <div className="flex min-w-0 flex-col gap-2.5">
            <h2 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.85] font-black break-words text-foreground">
              {summary.personaname}
            </h2>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
              {country && <CountryFlag code={country} />}
              {meta.map((item) => (
                <span key={item} className="before:mr-2 before:content-['·'] first:before:hidden">
                  {item}
                </span>
              ))}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {bans ? (
                <>
                  <BanBadge
                    label={bans.VACBanned ? `${bans.NumberOfVACBans} VAC ban` : "Sin VAC ban"}
                    flagged={bans.VACBanned}
                  />
                  <BanBadge
                    label={bans.NumberOfGameBans > 0 ? `${bans.NumberOfGameBans} game ban` : "Sin game ban"}
                    flagged={bans.NumberOfGameBans > 0}
                  />
                  <BanBadge
                    label={bans.CommunityBanned ? "Baneado en la comunidad" : "Sin ban de comunidad"}
                    flagged={bans.CommunityBanned}
                  />
                  {(bans.VACBanned || bans.NumberOfGameBans > 0) && (
                    <span className="text-[13px] text-ink-muted">hace {bans.DaysSinceLastBan} días</span>
                  )}
                </>
              ) : (
                <span className="text-[13px] text-ink-muted">No pudimos consultar las sanciones.</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
              <span className="text-ink-muted tabular-nums">{steamid}</span>
              <CopyButton value={steamid} />
              <a href={summary.profileurl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <SteamIcon className="size-3.5" />
                Steam
                <ExternalIcon />
              </a>
              <a href={steamDbUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <SteamDbIcon className="size-3.5" />
                SteamDB
                <ExternalIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-6 border-t border-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <TrustScoreCard result={trust} />
          <div className="flex flex-col gap-2">
            <Label>Inventario CS2</Label>
            {inventory === null ? (
              <span className="skeleton mt-1 h-10 w-36" role="status" aria-label="Calculando inventario…" />
            ) : inventory.status === "ok" ? (
              <span className="font-label text-5xl leading-[0.85] font-bold tabular-nums">
                {usdFmt.format(inventory.totalValueUsd)}
              </span>
            ) : (
              <span className="max-w-40 text-[13px] text-ink-muted">
                {inventory.status === "private_or_empty" && "Inventario privado o vacío."}
                {inventory.status === "rate_limited" && "Steam limitó las consultas — probá de nuevo en un rato."}
                {inventory.status === "error" && "No pudimos calcular el inventario."}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
