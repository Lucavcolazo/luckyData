"use client";

import Image from "next/image";
import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FaceitPlayer } from "@/lib/faceit";
import { FACEIT_LEVEL_COLORS, FACEIT_LEVEL_RANGES } from "@/lib/rankColors";
import { FaceitLevelBadge } from "@/components/FaceitLevelBadge";
import { CountryFlag } from "@/components/CountryFlag";
import { MapIcon } from "@/components/MapIcon";
import { mapDisplayName, ResultMark } from "@/components/LeetifyMatchHistory";
import { Label, Meter, SandLink, SectionHeading, StatTile } from "@/components/Dossier";

const PAGE_SIZE = 10;
/** A map needs this many matches before it can be called the best or worst one. */
const MIN_MAP_MATCHES = 5;

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

function ProfileHeader({ faceit }: { faceit: FaceitPlayer }) {
  const region = faceit.region ? (REGION_NAMES[faceit.region] ?? faceit.region) : null;
  const since = faceit.memberSince
    ? new Date(faceit.memberSince).toLocaleDateString("es-AR", { month: "short", year: "numeric" })
    : null;
  const life = faceit.lifetime;

  return (
    <section className="animate-fade-up">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-5">
          {faceit.avatar ? (
            <Image
              src={faceit.avatar}
              alt=""
              width={96}
              height={96}
              className="size-20 shrink-0 object-cover outline outline-1 -outline-offset-1 outline-white/10 sm:size-24"
              unoptimized
            />
          ) : (
            <span className="size-20 shrink-0 bg-sand/10 sm:size-24" aria-hidden />
          )}
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.85] font-black break-all">
                {faceit.nickname}
              </h3>
              {faceit.verified && <VerifiedIcon />}
              {faceit.country && <CountryFlag code={faceit.country} showName={false} />}
              {faceit.premium && (
                <span className="border border-sand/40 px-2 py-0.5 font-label text-xs font-bold tracking-[0.12em] text-sand uppercase">
                  Premium
                </span>
              )}
            </div>
            <p className="text-sm text-ink-muted">
              {[since && `En FACEIT desde ${since}`, region && `Región ${region}`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {faceit.skillLevel !== null && <FaceitLevelBadge level={faceit.skillLevel} size={64} />}
          <div className="flex flex-col gap-1">
            <span className="font-label text-6xl leading-[0.8] font-bold tabular-nums">
              {fmt(faceit.elo)}
              <span className="ml-1.5 text-2xl text-ink-muted">ELO</span>
            </span>
            {faceit.regionRank !== null && (
              <span className="text-sm text-ink-muted tabular-nums">
                #{fmt(faceit.regionRank)} en {region ?? "su región"}
              </span>
            )}
          </div>
        </div>
      </div>

      {life && (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-y border-line py-5 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>Partidas</Label>
            <span className="font-label text-4xl leading-none font-bold tabular-nums">{fmt(life.matches)}</span>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Victorias</Label>
            <span className="font-label text-4xl leading-none font-bold tabular-nums">
              {fmt(life.winRate)}
              <span className="text-xl text-ink-muted">%</span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Racha</Label>
            <span className="font-label text-4xl leading-none font-bold tabular-nums">
              {fmt(life.currentStreak)}
              <span className="ml-1.5 text-base text-ink-muted">mejor: {fmt(life.longestStreak)}</span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Resultados recientes</Label>
            <span className="flex gap-1.5 pt-1">
              {life.recentResults.length === 0 && <span className="text-sm text-ink-muted">Sin partidas</span>}
              {life.recentResults.map((r, i) => (
                <ResultMark key={i} outcome={r} score="" />
              ))}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <SandLink href={faceit.faceitUrl}>Ver perfil en FACEIT</SandLink>
      </div>
    </section>
  );
}

function LevelSection({ faceit }: { faceit: FaceitPlayer }) {
  const level = faceit.skillLevel;
  const range = FACEIT_LEVEL_RANGES.find((r) => r.level === level) ?? null;
  const history = faceit.levelHistory;
  const visited = [...new Set(history.map((h) => h.level))].sort((a, b) => a - b);
  const color = level !== null ? (FACEIT_LEVEL_COLORS[level] ?? "var(--sand)") : "var(--sand)";

  let progress: { ratio: number; text: string } | null = null;
  if (range && faceit.elo !== null) {
    progress =
      range.max === null
        ? { ratio: 1, text: "Nivel máximo" }
        : {
            ratio: clamp01((faceit.elo - range.min) / (range.max + 1 - range.min)),
            text: `Faltan ${fmt(range.max + 1 - faceit.elo)} ELO para el nivel ${range.level + 1}`,
          };
  }

  return (
    <section className="animate-fade-up mt-16" style={{ animationDelay: "60ms" }}>
      <SectionHeading>Nivel</SectionHeading>

      <ol className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {FACEIT_LEVEL_RANGES.map((r) => {
          const current = r.level === level;
          const reached = level !== null && r.level <= level;
          return (
            <li
              key={r.level}
              className={`flex flex-col items-center gap-2 border px-1 py-3 ${
                current ? "border-sand/60 bg-sand/[0.06]" : "border-transparent"
              } ${reached ? "" : "opacity-40"}`}
              aria-current={current ? "step" : undefined}
            >
              <FaceitLevelBadge level={r.level} size={36} />
              <span className="text-center text-xs text-ink-muted tabular-nums">
                {r.max === null ? `${fmt(r.min)}+` : `${fmt(r.min)}–${fmt(r.max)}`}
              </span>
            </li>
          );
        })}
      </ol>

      {progress && (
        <div className="mt-6 flex flex-col gap-2 sm:max-w-md">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="tabular-nums">{fmt(faceit.elo)} ELO</span>
            <span className="text-ink-muted">{progress.text}</span>
          </div>
          <Meter ratio={progress.ratio} />
        </div>
      )}

      {history.length >= 2 && (
        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Label>Niveles en las últimas {history.length} partidas</Label>
            <span className="flex items-center gap-2 text-[13px] text-ink-muted">
              Pasó por
              {visited.map((l) => (
                <FaceitLevelBadge key={l} level={l} size={24} />
              ))}
            </span>
          </div>
          <div className="h-40 w-full tabular-nums">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="finishedAt" hide />
                <YAxis
                  domain={[1, 10]}
                  ticks={[1, 4, 8, 10]}
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ stroke: "var(--line)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as { finishedAt: number; level: number };
                    return (
                      <div className="border border-line bg-panel px-3 py-2 text-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                        <div className="font-label text-lg leading-tight font-bold">Nivel {p.level}</div>
                        <div className="text-ink-muted">{new Date(p.finishedAt).toLocaleDateString("es-AR")}</div>
                      </div>
                    );
                  }}
                />
                <Line
                  type="stepAfter"
                  dataKey="level"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: "var(--panel)", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-between pr-7 text-xs text-ink-muted tabular-nums">
            <span>{new Date(history[0].finishedAt).toLocaleDateString("es-AR")}</span>
            <span>{new Date(history[history.length - 1].finishedAt).toLocaleDateString("es-AR")}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function PerformanceSection({ faceit }: { faceit: FaceitPlayer }) {
  const life = faceit.lifetime;
  return (
    <section className="animate-fade-up mt-16" style={{ animationDelay: "120ms" }}>
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
        <div className="flex flex-col gap-12">
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-3">
            <StatTile featured label="K/D promedio" value={fmt(life.kd, 2)} ratio={ratio(life.kd, 2)} />
            <StatTile featured label="ADR" value={fmt(life.adr, 1)} ratio={ratio(life.adr, 120)} />
            <StatTile featured label="Headshots" value={fmt(life.hsPct)} unit="%" ratio={ratio(life.hsPct, 100)} />
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
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
          </div>
        </div>
      )}
    </section>
  );
}

function MapsSection({ faceit }: { faceit: FaceitPlayer }) {
  if (faceit.maps.length === 0) return null;
  const ranked = faceit.maps.filter((m) => m.matches >= MIN_MAP_MATCHES && m.winRate !== null);
  const best = ranked.length > 1 ? ranked.reduce((a, b) => (b.winRate! > a.winRate! ? b : a)) : null;
  const worst = ranked.length > 1 ? ranked.reduce((a, b) => (b.winRate! < a.winRate! ? b : a)) : null;

  return (
    <section className="animate-fade-up mt-16" style={{ animationDelay: "180ms" }}>
      <SectionHeading aside={<span className="text-[13px] text-ink-muted">Ordenados por partidas jugadas</span>}>
        Mapas
      </SectionHeading>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {faceit.maps.map((m) => (
          <li key={m.name} className="relative isolate flex h-40 flex-col justify-end overflow-hidden p-4">
            {m.image && (
              <Image src={m.image} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="-z-20 object-cover" unoptimized />
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-panel via-panel/80 to-panel/30" aria-hidden />
            {(m === best || m === worst) && (
              <span
                className={`absolute top-3 left-3 px-2 py-0.5 font-label text-xs font-bold tracking-[0.12em] uppercase ${
                  m === best ? "bg-good text-panel" : "bg-paint text-white"
                }`}
              >
                {m === best ? "Mejor mapa" : "Peor mapa"}
              </span>
            )}
            <span className="font-display text-3xl leading-none font-black text-foreground uppercase">{m.name}</span>
            <span className="mt-2 flex flex-wrap gap-x-3 text-[13px] text-sand tabular-nums">
              <span>{fmt(m.matches)} partidas</span>
              <span>{fmt(m.winRate)}% victorias</span>
              <span>K/D {fmt(m.kd, 2)}</span>
              <span>ADR {fmt(m.adr)}</span>
            </span>
          </li>
        ))}
      </ul>
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
      <LevelSection faceit={faceit} />
      <PerformanceSection faceit={faceit} />
      <MapsSection faceit={faceit} />
      <MatchesSection faceit={faceit} />
    </div>
  );
}
