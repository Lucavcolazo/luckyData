"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import type { PlayerData } from "@/lib/playerData";
import {
  COMPARE_SOURCES,
  SUSPECT_METRIC,
  relativeRatios,
  winnerOf,
  type CompareMetric,
  type Winner,
} from "@/lib/compareMetrics";
import { CountryFlag } from "@/components/CountryFlag";
import { FaceitLevelBadge } from "@/components/FaceitLevelBadge";
import { PremierBadge } from "@/components/PremierBadge";
import { SandLink, SectionHeading } from "@/components/Dossier";
import { StatsSwitch, type StatsSource } from "@/components/StatsSwitch";
import { Blob } from "@/components/StatsMascot";
import { analyzeSuspicion, flagFor, type SuspicionReport } from "@/lib/suspicion";

type Side = "a" | "b";

const SIDE = {
  a: { text: "text-sand", bg: "bg-sand" },
  b: { text: "text-rival", bg: "bg-rival" },
} as const;

function Caret({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 8" className={className} aria-hidden>
      <path d="M5 0l5 8H0z" fill="currentColor" />
    </svg>
  );
}

type ValueRenderer = (v: { value: number; text: string; player: PlayerData; dim: boolean }) => ReactNode;

/** Rank rows show the real emblem next to (or instead of) the number; the losing side's emblem is dimmed, not recoloured (the Premier badge only fades its plate, since it carries the number). */
const RENDER_VALUE: Partial<Record<string, ValueRenderer>> = {
  premier: ({ value, dim }) => (
    <span className="flex">
      <PremierBadge rating={value} size="md" dim={dim} />
    </span>
  ),
  // Side "a" reverses the row, so the level icon always lands on the outer side of the ELO.
  faceit: ({ text, player, dim }) => (
    <>
      {text}
      {player.faceit?.skillLevel != null && (
        <span className={`flex ${dim ? "opacity-50" : ""}`}>
          <FaceitLevelBadge level={player.faceit.skillLevel} size={28} />
        </span>
      )}
    </>
  ),
};

const VERDICT_CHIP = {
  alert: { text: "¡Ojo con este perfil!", className: "border-paint/70 text-paint" },
  watch: { text: "Números para mirar", className: "border-warn/55 text-warn" },
  clean: { text: "Nada fuera de lo común", className: "border-line text-sand" },
  unknown: { text: "Sin métricas finas", className: "border-line text-ink-muted" },
} as const;

/** Suspicion verdict and bans for one side: the comparison answers "is either of them off?" first. */
function PlayerVerdict({ player, report, alignEnd }: { player: PlayerData; report: SuspicionReport; alignEnd: boolean }) {
  const chip = VERDICT_CHIP[report.level];
  const bans = player.bans;
  const banCount = bans ? bans.NumberOfVACBans + bans.NumberOfGameBans : 0;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${alignEnd ? "justify-end" : ""}`}>
      <span className={`flex items-center gap-2 border px-2.5 py-1 text-[13px] ${chip.className}`}>
        <span className="size-5 shrink-0" aria-hidden>
          <Blob level={report.level} />
        </span>
        {chip.text}
        {report.flags.length > 0 && (
          <span className="tabular-nums">
            · {report.flags.length} {report.flags.length === 1 ? "métrica" : "métricas"}
          </span>
        )}
      </span>
      {banCount > 0 && (
        <span className="border border-paint/70 px-2.5 py-1 text-[13px] text-paint">
          {banCount} {banCount === 1 ? "ban" : "bans"} en Steam
        </span>
      )}
    </div>
  );
}

function PlayerHeader({
  player,
  report,
  side,
  onOpen,
}: {
  player: PlayerData;
  report: SuspicionReport;
  side: Side;
  onOpen: () => void;
}) {
  const alignEnd = side === "b";
  return (
    <div className={`flex min-w-0 flex-col gap-3 ${alignEnd ? "items-end text-right" : "items-start"}`}>
      <div
        className={`flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 ${
          alignEnd ? "items-end sm:flex-row-reverse" : "items-start"
        }`}
      >
        <Image
          src={player.summary.avatarfull}
          alt=""
          width={96}
          height={96}
          className="size-14 shrink-0 outline outline-1 -outline-offset-1 outline-white/10 sm:size-24"
          unoptimized
        />
        <h2 className="min-w-0 font-display text-[clamp(1.75rem,5vw,3.75rem)] leading-[0.85] font-black break-words">
          {player.summary.personaname}
        </h2>
      </div>
      <span className={`h-1 w-16 ${SIDE[side].bg}`} aria-hidden />
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted ${alignEnd ? "justify-end" : ""}`}>
        {player.summary.loccountrycode && <CountryFlag code={player.summary.loccountrycode} />}
        <button
          type="button"
          onClick={onOpen}
          className="min-h-8 text-[13px] underline decoration-line underline-offset-4 transition-colors hover:text-sand"
        >
          Ver perfil completo
        </button>
      </div>
      <PlayerVerdict player={player} report={report} alignEnd={alignEnd} />
    </div>
  );
}

function SideValue({
  metric,
  player,
  value,
  ratio,
  side,
  winner,
  report,
}: {
  metric: CompareMetric;
  player: PlayerData;
  value: number | null;
  ratio: number;
  side: Side;
  winner: Winner;
  report: SuspicionReport;
}) {
  const suspect = SUSPECT_METRIC[metric.key];
  const flag = suspect ? flagFor(report, suspect) : undefined;
  // An atypical number isn't "better": it gets the flag instead of the winner's caret.
  const wins = winner === side && !flag;
  const loses = winner !== null && winner !== "tie" && !wins;
  const alignEnd = side === "a";
  const render = RENDER_VALUE[metric.key];
  const text = value === null ? "—" : metric.format(value);
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${alignEnd ? "items-end" : "items-start"}`}>
      <span
        className={`flex items-center gap-2 font-label text-2xl leading-none font-bold tabular-nums sm:text-3xl ${
          alignEnd ? "flex-row-reverse" : ""
        } ${flag ? (flag.strong ? "text-paint" : "text-warn") : loses ? "text-ink-muted" : "text-foreground"} ${
          value === null ? "text-ink-muted" : ""
        }`}
      >
        <span className="sr-only">{player.summary.personaname}: </span>
        {value !== null && render ? render({ value, text, player, dim: loses }) : text}
        {wins && (
          <>
            <Caret className={`size-2.5 ${SIDE[side].text}`} />
            <span className="sr-only">(mejor)</span>
          </>
        )}
        {flag && (
          <span
            className={`border px-1.5 py-0.5 font-label text-xs font-bold tracking-[0.1em] uppercase ${
              flag.strong ? "border-paint/70 text-paint" : "border-warn/55 text-warn"
            }`}
            title={flag.reason}
          >
            Atípico
          </span>
        )}
      </span>
      <div className={`flex h-1.5 w-full bg-sand/[0.06] ${alignEnd ? "justify-end" : ""}`} aria-hidden>
        <div
          className={`h-full ${SIDE[side].bg} ${wins ? "opacity-90" : "opacity-35"}`}
          style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
        />
      </div>
    </div>
  );
}

function MetricRow({
  metric,
  a,
  b,
  reports,
}: {
  metric: CompareMetric;
  a: PlayerData;
  b: PlayerData;
  reports: { a: SuspicionReport; b: SuspicionReport };
}) {
  const va = metric.get(a);
  const vb = metric.get(b);
  const winner = winnerOf(metric, va, vb);
  const [ra, rb] = relativeRatios(metric, va, vb);
  const label = (
    <span className="flex flex-col items-center gap-0.5 text-center">
      <span className="font-label text-sm font-semibold tracking-[0.1em] text-ink-muted uppercase">{metric.label}</span>
      {metric.direction === "lower-better" && <span className="text-xs text-ink-muted/80">Menos es mejor</span>}
      {metric.note && <span className="text-xs text-ink-muted/80">{metric.note}</span>}
      {winner === "tie" && <span className="text-xs text-sand">Empate</span>}
    </span>
  );

  return (
    <div className="border-b border-line py-4">
      <div className="mb-3 sm:hidden">{label}</div>
      <div className="grid grid-cols-2 items-center gap-x-6 sm:grid-cols-[1fr_13rem_1fr]">
        <SideValue metric={metric} player={a} value={va} ratio={ra} side="a" winner={winner} report={reports.a} />
        <div className="hidden sm:block">{label}</div>
        <SideValue metric={metric} player={b} value={vb} ratio={rb} side="b" winner={winner} report={reports.b} />
      </div>
    </div>
  );
}

export function ComparisonView({
  a,
  b,
  onOpenProfile,
}: {
  a: PlayerData;
  b: PlayerData;
  onOpenProfile: (player: PlayerData) => void;
}) {
  const [source, setSource] = useState<StatsSource>("cs2");
  const reports = useMemo(() => ({ a: analyzeSuspicion(a), b: analyzeSuspicion(b) }), [a, b]);
  const sections = COMPARE_SOURCES[source];
  const tally = { a: 0, b: 0, tie: 0, atypical: 0 };
  for (const section of sections) {
    for (const metric of section.metrics) {
      const w = winnerOf(metric, metric.get(a), metric.get(b));
      const suspect = SUSPECT_METRIC[metric.key];
      // A win built on an atypical number doesn't count as playing better.
      if ((w === "a" || w === "b") && suspect && flagFor(reports[w], suspect)) tally.atypical++;
      else if (w) tally[w]++;
    }
  }
  const missingFaceit = [a, b].filter((p) => !p.faceit);
  const leader = tally.a === tally.b ? null : tally.a > tally.b ? a : b;

  return (
    <div className="flex flex-col">
      <section className="animate-fade-up grid grid-cols-[1fr_auto_1fr] items-start gap-4 sm:gap-8">
        <PlayerHeader player={a} report={reports.a} side="a" onOpen={() => onOpenProfile(a)} />
        <span className="pt-3 font-display text-4xl leading-none font-black text-paint sm:pt-6 sm:text-6xl">VS</span>
        <PlayerHeader player={b} report={reports.b} side="b" onOpen={() => onOpenProfile(b)} />
      </section>

      <div className="animate-fade-up mt-12 flex justify-center" style={{ animationDelay: "60ms" }}>
        <StatsSwitch value={source} onChange={setSource} idPrefix="compare" />
      </div>

      <div
        role="tabpanel"
        id="compare-panel"
        aria-labelledby={`compare-tab-${source}`}
        key={source}
        className="animate-fade-up flex flex-col"
      >
        {/* Keeps both names on screen once the headers scroll away, so every row stays attributable. */}
        <div className="sticky top-0 z-20 -mx-5 mt-8 flex items-center justify-between gap-4 border-b border-line bg-panel px-5 py-3 sm:-mx-10 sm:px-10">
          <span className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 bg-sand" aria-hidden />
            <span className="truncate font-display text-xl leading-none font-extrabold">{a.summary.personaname}</span>
          </span>
          <span className="font-display text-lg leading-none font-black text-paint">VS</span>
          <span className="flex min-w-0 items-center justify-end gap-2">
            <span className="truncate font-display text-xl leading-none font-extrabold">{b.summary.personaname}</span>
            <span className="size-2.5 shrink-0 bg-rival" aria-hidden />
          </span>
        </div>

        {source === "faceit" && missingFaceit.length > 0 && (
          <p className="mt-8 text-center text-sm text-ink-muted">
            {missingFaceit.map((p) => p.summary.personaname).join(" y ")}{" "}
            {missingFaceit.length === 1 ? "no tiene" : "no tienen"} cuenta de FACEIT vinculada: esas filas quedan sin datos y
            no suman al marcador.
          </p>
        )}

        <section className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
          <span className="font-label text-sm font-semibold tracking-[0.1em] text-ink-muted uppercase">Mejores números</span>
          <span className="flex items-baseline gap-3 font-label text-4xl leading-none font-bold tabular-nums">
            <span className="text-sand">{tally.a}</span>
            <span className="text-xl text-ink-muted">–</span>
            <span className="text-rival">{tally.b}</span>
          </span>
          <span className="text-sm text-ink-muted">
            {leader ? (
              <>
                <span className="text-foreground">{leader.summary.personaname}</span> rinde mejor en más aspectos
              </>
            ) : (
              "Parejos"
            )}
            {tally.tie > 0 && ` · ${tally.tie} ${tally.tie === 1 ? "empate" : "empates"}`}
            {tally.atypical > 0 &&
              ` · ${tally.atypical} ${tally.atypical === 1 ? "ventaja atípica no cuenta" : "ventajas atípicas no cuentan"}`}
          </span>
        </section>

        {sections.map((section, i) => (
          <section key={section.title} className="animate-fade-up mt-16" style={{ animationDelay: `${120 + i * 60}ms` }}>
            <SectionHeading
              aside={
                source === "cs2" && section.title === "Rendimiento" ? (
                  <SandLink href="https://leetify.com/">Data Provided by Leetify</SandLink>
                ) : undefined
              }
            >
              {section.title}
            </SectionHeading>
            <div className="border-t border-line">
              {section.metrics.map((metric) => (
                <MetricRow key={metric.key} metric={metric} a={a} b={b} reports={reports} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Bone({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function ComparisonSkeleton() {
  return (
    <div className="flex flex-col" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando comparación…</span>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 sm:gap-8">
        <div className="flex items-center gap-4">
          <Bone className="size-14 sm:size-24" />
          <Bone className="h-10 w-full max-w-48" />
        </div>
        <Bone className="mt-6 h-10 w-12" />
        <div className="flex flex-row-reverse items-center gap-4">
          <Bone className="size-14 sm:size-24" />
          <Bone className="h-10 w-full max-w-48" />
        </div>
      </div>
      <div className="mt-12 flex justify-center border-y border-line py-8">
        <Bone className="h-20 w-48" />
      </div>
      <div className="mt-16">
        <Bone className="mb-5 h-8 w-40" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-6 border-b border-line py-4 sm:grid-cols-[1fr_13rem_1fr]">
            <div className="flex flex-col items-end gap-2">
              <Bone className="h-7 w-20" />
              <Bone className="h-1.5 w-full" />
            </div>
            <Bone className="hidden h-4 w-28 justify-self-center sm:block" />
            <div className="flex flex-col gap-2">
              <Bone className="h-7 w-20" />
              <Bone className="h-1.5 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
