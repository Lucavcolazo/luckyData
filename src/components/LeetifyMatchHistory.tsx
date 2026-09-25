"use client";

import { useState } from "react";
import type { LeetifyMatch } from "@/lib/leetify";
import { MapIcon } from "@/components/MapIcon";
import { metricAnchor, SandLink, SectionHeading } from "@/components/Dossier";
import type { AtypicalMatch } from "@/lib/suspicion";

const PAGE_SIZE = 10;

/** Leetify only says "matchmaking" for Premier; plain Competitive comes as "matchmaking_competitive". */
const SOURCE_LABELS: Record<string, string> = {
  faceit: "FACEIT",
  matchmaking: "Premier",
  premier: "Premier",
  matchmaking_competitive: "MM",
  matchmaking_wingman: "Wingman",
};

function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? source.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function mapDisplayName(mapName: string) {
  const clean = mapName.replace(/^de_|^cs_/, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

const fmt = (n: number, decimals: number) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export type Outcome = "win" | "loss" | "tie" | null;

export function ResultMark({ outcome, score }: { outcome: Outcome; score: string }) {
  const letter = outcome === "win" ? "G" : outcome === "loss" ? "P" : outcome === "tie" ? "E" : "–";
  const label = outcome === "win" ? "Victoria" : outcome === "loss" ? "Derrota" : outcome === "tie" ? "Empate" : "";
  const tone =
    outcome === "win" ? "bg-good text-panel" : outcome === "loss" ? "bg-paint text-white" : "bg-sand/20 text-sand";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`flex size-5 items-center justify-center font-label text-xs font-bold ${tone}`}
        aria-label={label}
        title={label}
      >
        {letter}
      </span>
      <span className="tabular-nums">{score}</span>
    </span>
  );
}

/** "Atípica · 290 ms · 2,8°": the numbers that got a match flagged, under its map. */
function AtypicalNote({ match }: { match: AtypicalMatch }) {
  return (
    <span className="text-xs text-warn">
      <span className="font-label font-bold tracking-[0.1em] uppercase">Atípica</span>
      {match.hits.map((h) => ` · ${h.value}`).join("")}
    </span>
  );
}

export function LeetifyMatchHistory({
  matches,
  steamid64,
  atypical = [],
  onlyAtypical = false,
  onOnlyAtypicalChange,
}: {
  matches: LeetifyMatch[];
  steamid64: string;
  /** Matches the suspicion analysis flagged one by one. */
  atypical?: AtypicalMatch[];
  /** Lifted so the verdict strip can open the list already filtered. */
  onlyAtypical?: boolean;
  onOnlyAtypicalChange?: (only: boolean) => void;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const atypicalById = new Map(atypical.map((a) => [a.id, a]));
  const filtering = onlyAtypical && atypical.length > 0;

  const rows = matches
    .map((match) => {
      const me = match.stats.find((s) => s.steam64_id === steamid64);
      if (!me) return null;
      const myTeam = match.team_scores.find((t) => t.team_number === me.initial_team_number);
      const otherTeam = match.team_scores.find((t) => t.team_number !== me.initial_team_number);
      const outcome: Outcome =
        myTeam && otherTeam
          ? myTeam.score > otherTeam.score
            ? "win"
            : myTeam.score < otherTeam.score
              ? "loss"
              : "tie"
          : null;
      return {
        id: match.id,
        map: match.map_name,
        date: new Date(match.finished_at).toLocaleDateString("es-AR"),
        dateShort: new Date(match.finished_at).toLocaleDateString("es-AR", { day: "numeric", month: "numeric" }),
        source: sourceLabel(match.data_source),
        outcome,
        score: `${myTeam?.score ?? "—"}:${otherTeam?.score ?? "—"}`,
        rating:
          me.leetify_rating === null ? "—" : `${me.leetify_rating > 0 ? "+" : ""}${fmt(me.leetify_rating, 2)}`,
        kills: me.total_kills ?? "—",
        deaths: me.total_deaths ?? "—",
        kd: me.kd_ratio !== null ? fmt(me.kd_ratio, 2) : "—",
        adr: me.total_damage !== null && me.rounds_count ? fmt(me.total_damage / me.rounds_count, 0) : "—",
        hs: me.total_hs_kills ?? "—",
        atypical: atypicalById.get(match.id),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .filter((r) => !filtering || r.atypical);

  const shown = rows.slice(0, visible);

  return (
    <section id={metricAnchor("matches")} className="mt-16 scroll-mt-8">
      <SectionHeading
        aside={
          <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {atypical.length > 0 && onOnlyAtypicalChange && (
              <button
                type="button"
                onClick={() => onOnlyAtypicalChange(!onlyAtypical)}
                aria-pressed={filtering}
                className={`border px-3 py-1.5 font-label text-sm font-bold tracking-[0.12em] uppercase transition-[background-color,color,transform] duration-150 active:scale-[0.97] ${
                  filtering ? "border-warn bg-warn text-panel" : "border-warn/55 text-warn hover:bg-warn/10"
                }`}
              >
                Solo atípicas · {atypical.length}
              </button>
            )}
            <SandLink href={`https://leetify.com/public/profile/${steamid64}/matches`}>Ver todas en Leetify</SandLink>
          </span>
        }
      >
        Últimas partidas
      </SectionHeading>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin partidas recientes públicas en Leetify.</p>
      ) : (
        <>
          {/* Desktop / tablet: full table. */}
          <table className="hidden w-full text-sm md:table">
            <caption className="sr-only">Últimas partidas del jugador</caption>
            <thead>
              <tr className="border-b border-line text-left font-label text-sm tracking-[0.1em] text-ink-muted uppercase">
                <th scope="col" className="py-3 pr-4 font-semibold">Mapa</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Resultado</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Modo</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Fecha</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">Rating</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">K – M</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">K/D</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">ADR</th>
                <th scope="col" className="py-3 text-right font-semibold">HS</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr
                  key={r.id}
                  className={`border-b border-line transition-colors ${
                    r.atypical ? "bg-warn/[0.05] hover:bg-warn/[0.09]" : "hover:bg-sand/[0.04]"
                  }`}
                >
                  <th scope="row" className="py-3 pr-4 text-left font-normal">
                    <span className="flex items-center gap-3">
                      <MapIcon mapName={r.map} />
                      <span className="flex flex-col gap-0.5">
                        {mapDisplayName(r.map)}
                        {r.atypical && <AtypicalNote match={r.atypical} />}
                      </span>
                    </span>
                  </th>
                  <td className="py-3 pr-4">
                    <ResultMark outcome={r.outcome} score={r.score} />
                  </td>
                  <td className="py-3 pr-4 text-ink-muted">{r.source}</td>
                  <td className="py-3 pr-4 text-ink-muted tabular-nums">{r.date}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{r.rating}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {r.kills} – {r.deaths}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">{r.kd}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{r.adr}</td>
                  <td className="py-3 text-right tabular-nums">{r.hs}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: one row per match, result first. */}
          <ul className="md:hidden">
            {shown.map((r) => (
              <li
                key={r.id}
                className={`flex items-center gap-3 border-b border-line py-3 ${r.atypical ? "bg-warn/[0.05]" : ""}`}
              >
                <MapIcon mapName={r.map} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <ResultMark outcome={r.outcome} score={r.score} />
                  <span className="truncate text-xs text-ink-muted">
                    {mapDisplayName(r.map)} · {r.source} · {r.dateShort}
                  </span>
                  {r.atypical && <AtypicalNote match={r.atypical} />}
                </div>
                <div className="flex flex-col items-end gap-0.5 text-sm tabular-nums">
                  <span>{r.rating}</span>
                  <span className="text-xs text-ink-muted">
                    {r.kills}–{r.deaths} · {r.adr} ADR
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-muted">
            <span className="tabular-nums">
              {shown.length} de {rows.length} {filtering ? "atípicas" : "partidas"} · K – M: kills y muertes
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
