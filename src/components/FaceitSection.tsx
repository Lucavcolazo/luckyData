"use client";

import Image from "next/image";
import { useState } from "react";
import type { FaceitPlayer } from "@/lib/faceit";
import { FACEIT_LEVEL_COLORS, FACEIT_LEVEL_RANGES } from "@/lib/rankColors";
import { FaceitLevelBadge } from "@/components/FaceitLevelBadge";
import { CountryFlag } from "@/components/CountryFlag";
import { MapIcon } from "@/components/MapIcon";
import { MapGrid } from "@/components/MapGrid";
import { mapDisplayName, ResultMark } from "@/components/LeetifyMatchHistory";
import { Label, SandLink, SectionHeading, StatGrid, StatTile } from "@/components/Dossier";

const PAGE_SIZE = 10;

const REGION_NAMES: Record<string, string> = {
  SA: "Sudamérica",
  NA: "Norteamérica",
  EU: "Europa",
  OCE: "Oceanía",
  SEA: "Sudeste asiático",
};

const fmt = (n: number | null, decimals = 0) =>
  n === null
    ? "—"
    : n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ratio = (v: number | null, max: number) => (v === null ? null : clamp01(v / max));

function VerifiedIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-5 text-foreground" role="img" aria-label="Cuenta verificada">
      <path
        fill="currentColor"
        d="M8 .8l1.9 1.4 2.3-.1.7 2.2 1.9 1.4-.8 2.2.8 2.2-1.9 1.4-.7 2.2-2.3-.1L8 15.2l-1.9-1.4-2.3.1-.7-2.2-1.9-1.4.8-2.2-.8-2.2 1.9-1.4.7-2.2 2.3.1z"
      />
      <path d="M5 8.2l2 2 4-4.2" fill="none" stroke="var(--panel)" strokeWidth={1.6} strokeLinecap="square" />
    </svg>
  );
}

/** One-line FACEIT identity: who, level and ELO, recent form. The detail lives further down. */
function ProfileHeader({ faceit }: { faceit: FaceitPlayer }) {
  const region = faceit.region ? (REGION_NAMES[faceit.region] ?? faceit.region) : null;
  const since = faceit.memberSince
    ? new Date(faceit.memberSince).toLocaleDateString("es-AR", { month: "short", year: "numeric" })
    : null;
  const recent = faceit.lifetime?.recentResults ?? [];

  return (
    <section className="animate-fade-up flex flex-col gap-5 border border-line bg-sand/[0.025] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {faceit.avatar ? (
          <Image
            src={faceit.avatar}
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 object-cover outline outline-1 -outline-offset-1 outline-white/10"
            unoptimized
          />
        ) : (
          <span className="size-14 shrink-0 bg-sand/10" aria-hidden />
        )}
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-4xl leading-[0.85] font-black break-all">{faceit.nickname}</h3>
            {faceit.verified && <VerifiedIcon />}
            {faceit.country && <CountryFlag code={faceit.country} showName={false} />}
            {faceit.premium && (
              <span className="border border-sand/40 px-2 py-0.5 font-label text-xs font-bold tracking-[0.12em] text-sand uppercase">
                Premium
              </span>
            )}
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
            {since && <span>En FACEIT desde {since}</span>}
            <SandLink href={faceit.faceitUrl}>Ver perfil en FACEIT</SandLink>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex items-center gap-3">
          {faceit.skillLevel !== null && <FaceitLevelBadge level={faceit.skillLevel} size={52} />}
          <div className="flex flex-col gap-1">
            <span className="font-label text-5xl leading-[0.8] font-bold tabular-nums">
              {fmt(faceit.elo)}
              <span className="ml-1.5 text-xl text-ink-muted">ELO</span>
            </span>
            {faceit.regionRank !== null && (
              <span className="text-[13px] text-ink-muted tabular-nums">
                #{fmt(faceit.regionRank)} en {region ?? "su región"}
              </span>
            )}
          </div>
        </div>
        {recent.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>Recientes</Label>
            <span className="flex gap-1.5">
              {recent.map((r, i) => (
                <ResultMark key={i} outcome={r} score="" />
              ))}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

/** Where the ELO sits on FACEIT's 10-level ladder: one track, a segment per level in its own colour. */
function LevelSection({ faceit }: { faceit: FaceitPlayer }) {
  const level = faceit.skillLevel;
  const elo = faceit.elo;
  const range = FACEIT_LEVEL_RANGES.find((r) => r.level === level) ?? null;
  if (!range || elo === null) return null;

  const next = FACEIT_LEVEL_RANGES.find((r) => r.level === range.level + 1) ?? null;
  const progress = range.max === null ? 1 : clamp01((elo - range.min) / (range.max + 1 - range.min));
  const toNext = next ? next.min - elo : null;

  return (
    <section className="animate-fade-up mt-16" style={{ animationDelay: "60ms" }}>
      <SectionHeading>Nivel</SectionHeading>

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex items-center gap-4">
          <FaceitLevelBadge level={range.level} size={40} />
          <div className="flex flex-col gap-1.5">
            <Label>Nivel {range.level}</Label>
            <span className="font-label text-3xl leading-[0.8] font-bold tabular-nums">
              {fmt(elo)}
              <span className="ml-1 text-base text-ink-muted">ELO</span>
            </span>
          </div>
        </div>
        {next && toNext !== null ? (
          <div className="flex items-center gap-3 text-right">
            <div className="flex flex-col gap-1.5">
              <Label>Próximo nivel</Label>
              <span className="font-label text-3xl leading-[0.8] font-bold tabular-nums">
                {fmt(toNext)}
                <span className="ml-1 text-base text-ink-muted">ELO más</span>
              </span>
            </div>
            <FaceitLevelBadge level={next.level} size={40} />
          </div>
        ) : (
          <span className="font-label text-lg font-bold tracking-[0.1em] text-sand uppercase">Nivel máximo</span>
        )}
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-10 gap-1" aria-hidden>
          {FACEIT_LEVEL_RANGES.map((r) => {
            const color = FACEIT_LEVEL_COLORS[r.level];
            const fill = r.level < range.level ? 1 : r.level === range.level ? progress : 0;
            return (
              <div key={r.level} className="relative h-2.5">
                <div className="absolute inset-0 opacity-20" style={{ backgroundColor: color }} />
                <div className="absolute inset-y-0 left-0" style={{ width: `${fill * 100}%`, backgroundColor: color }} />
                {r.level === range.level && (
                  <span
                    className="absolute -top-1.5 h-5.5 w-1 -translate-x-1/2 bg-foreground shadow-[0_0_0_2px_var(--panel)]"
                    style={{ left: `${progress * 100}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <ol className="mt-3 grid grid-cols-10 gap-1">
          {FACEIT_LEVEL_RANGES.map((r) => {
            const current = r.level === range.level;
            return (
              <li
                key={r.level}
                className={`flex flex-col items-center gap-1.5 ${r.level > range.level ? "opacity-40" : ""}`}
                aria-current={current ? "step" : undefined}
              >
                <FaceitLevelBadge level={r.level} size={current ? 32 : 26} />
                <span
                  className={`hidden text-center text-xs tabular-nums sm:block ${current ? "text-foreground" : "text-ink-muted"}`}
                >
                  {r.max === null ? `${fmt(r.min)}+` : `${fmt(r.min)}–${fmt(r.max)}`}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function PerformanceSection({ faceit }: { faceit: FaceitPlayer }) {
  const life = faceit.lifetime;
  return (
    <section className="animate-fade-up mt-10" style={{ animationDelay: "120ms" }}>
      <SectionHeading
        aside={
          life?.matches != null ? (
            <span className="text-[13px] text-ink-muted">{fmt(life.matches)} partidas en FACEIT</span>
          ) : undefined
        }
      >
        Rendimiento
      </SectionHeading>

      {!life ? (
        <p className="text-sm text-ink-muted">FACEIT no devolvió estadísticas para esta cuenta.</p>
      ) : (
        <StatGrid>
          <StatTile label="K/D promedio" value={fmt(life.kd, 2)} ratio={ratio(life.kd, 2)} />
          <StatTile label="ADR" value={fmt(life.adr, 1)} ratio={ratio(life.adr, 120)} />
          <StatTile label="Headshots" value={fmt(life.hsPct)} unit="%" ratio={ratio(life.hsPct, 100)} />
          <StatTile label="Victorias" value={fmt(life.winRate)} unit="%" ratio={ratio(life.winRate, 100)} />
          <StatTile
            label="Entradas"
            value={fmt(life.entryRate)}
            unit="%"
            ratio={ratio(life.entryRate, 50)}
            note="Rondas en las que abrió el duelo"
          />
          <StatTile
            label="Entradas ganadas"
            value={fmt(life.entrySuccess)}
            unit="%"
            ratio={ratio(life.entrySuccess, 100)}
          />
          <StatTile
            label="Clutch 1v1"
            value={fmt(life.clutch1v1Rate)}
            unit="%"
            ratio={ratio(life.clutch1v1Rate, 100)}
            note={life.clutch1v1Count !== null ? `${fmt(life.clutch1v1Wins)} de ${fmt(life.clutch1v1Count)}` : undefined}
          />
          <StatTile
            label="Clutch 1v2"
            value={fmt(life.clutch1v2Rate)}
            unit="%"
            ratio={ratio(life.clutch1v2Rate, 100)}
            note={life.clutch1v2Count !== null ? `${fmt(life.clutch1v2Wins)} de ${fmt(life.clutch1v2Count)}` : undefined}
          />
          <StatTile
            label="Daño de utilidad"
            value={fmt(life.utilityDamagePerRound, 1)}
            ratio={ratio(life.utilityDamagePerRound, 20)}
            note="Por ronda"
          />
          <StatTile label="Flashes efectivas" value={fmt(life.flashSuccess)} unit="%" ratio={ratio(life.flashSuccess, 100)} />
          <StatTile
            label="Utilidad efectiva"
            value={fmt(life.utilitySuccess)}
            unit="%"
            ratio={ratio(life.utilitySuccess, 100)}
          />
          <StatTile
            label="Kills con AWP"
            value={fmt(life.sniperKillsPerRound, 2)}
            ratio={ratio(life.sniperKillsPerRound, 0.3)}
            note="Por ronda"
          />
          <StatTile
            label="Racha actual"
            value={fmt(life.currentStreak)}
            note={life.longestStreak !== null ? `Mejor racha: ${fmt(life.longestStreak)}` : undefined}
          />
        </StatGrid>
      )}
    </section>
  );
}

function MapsSection({ faceit }: { faceit: FaceitPlayer }) {
  if (faceit.maps.length === 0) return null;
  return (
    <section className="animate-fade-up mt-16" style={{ animationDelay: "180ms" }}>
      <SectionHeading aside={<span className="text-[13px] text-ink-muted">Ordenados por partidas jugadas</span>}>
        Mapas
      </SectionHeading>
      <MapGrid maps={faceit.maps} />
    </section>
  );
}

function MatchesSection({ faceit }: { faceit: FaceitPlayer }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const rows = faceit.recentMatches;
  const shown = rows.slice(0, visible);

  return (
    <section className="animate-fade-up mt-16" style={{ animationDelay: "240ms" }}>
      <SectionHeading aside={<SandLink href={`${faceit.faceitUrl}/stats/${faceit.game}`}>Ver todas en FACEIT</SandLink>}>
        Últimas partidas
      </SectionHeading>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin partidas recientes en FACEIT.</p>
      ) : (
        <>
          <table className="hidden w-full text-sm md:table">
            <caption className="sr-only">Últimas partidas de FACEIT</caption>
            <thead>
              <tr className="border-b border-line text-left font-label text-sm tracking-[0.1em] text-ink-muted uppercase">
                <th scope="col" className="py-3 pr-4 font-semibold">Mapa</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Resultado</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Fecha</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">K – M</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">K/D</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">ADR</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">HS</th>
                <th scope="col" className="py-3 text-right font-semibold">MVP</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr key={m.id} className="border-b border-line transition-colors hover:bg-sand/[0.04]">
                  <th scope="row" className="py-3 pr-4 text-left font-normal">
                    <span className="flex items-center gap-3">
                      <MapIcon mapName={m.map} />
                      {mapDisplayName(m.map)}
                    </span>
                  </th>
                  <td className="py-3 pr-4">
                    <ResultMark outcome={m.won === null ? null : m.won ? "win" : "loss"} score={m.score} />
                  </td>
                  <td className="py-3 pr-4 text-ink-muted tabular-nums">
                    {m.finishedAt ? new Date(m.finishedAt).toLocaleDateString("es-AR") : "—"}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {fmt(m.kills)} – {fmt(m.deaths)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">{fmt(m.kd, 2)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{fmt(m.adr)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{fmt(m.hsPct)}%</td>
                  <td className="py-3 text-right tabular-nums">{fmt(m.mvps)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="md:hidden">
            {shown.map((m) => (
              <li key={m.id} className="flex items-center gap-3 border-b border-line py-3">
                <MapIcon mapName={m.map} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <ResultMark outcome={m.won === null ? null : m.won ? "win" : "loss"} score={m.score} />
                  <span className="truncate text-xs text-ink-muted">
                    {mapDisplayName(m.map)}
                    {m.finishedAt
                      ? ` · ${new Date(m.finishedAt).toLocaleDateString("es-AR", { day: "numeric", month: "numeric" })}`
                      : ""}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-sm tabular-nums">
                  <span>K/D {fmt(m.kd, 2)}</span>
                  <span className="text-xs text-ink-muted">
                    {fmt(m.kills)}–{fmt(m.deaths)} · {fmt(m.adr)} ADR
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-muted">
            <span className="tabular-nums">
              {shown.length} de {rows.length} partidas · K – M: kills y muertes
            </span>
            {visible < rows.length && (
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="border border-line px-4 py-2 font-label text-sm font-bold tracking-[0.12em] text-sand uppercase transition-[background-color,color,transform] duration-150 hover:bg-sand hover:text-panel active:scale-[0.97]"
              >
                Mostrar {Math.min(PAGE_SIZE, rows.length - visible)} más
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function FaceitSection({ faceit }: { faceit: FaceitPlayer | null }) {
  if (!faceit) {
    return (
      <section className="py-12 text-center">
        <p className="font-display text-3xl font-extrabold text-sand uppercase">Sin cuenta de FACEIT</p>
        <p className="mt-3 text-sm text-ink-muted">Este Steam no tiene una cuenta de FACEIT vinculada.</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col">
      <ProfileHeader faceit={faceit} />
      {/* Performance right under the header, the rank detail after it. */}
      <PerformanceSection faceit={faceit} />
      <LevelSection faceit={faceit} />
      <MapsSection faceit={faceit} />
      <MatchesSection faceit={faceit} />
    </div>
  );
}
