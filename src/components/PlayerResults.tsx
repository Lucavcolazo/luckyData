"use client";

import { useMemo, useRef, useState } from "react";
import type { PartName, PlayerCore, PlayerData, PlayerParts } from "@/lib/playerData";
import { StatsPanelSkeleton } from "@/components/PlayerSkeleton";
import { AccountOverviewCard } from "@/components/AccountOverviewCard";
import { PremierTrend } from "@/components/PremierTrend";
import { LeetifyEmpty, LeetifyMetrics } from "@/components/LeetifyMetrics";
import { LeetifyMatchHistory } from "@/components/LeetifyMatchHistory";
import { LeetifyMaps } from "@/components/LeetifyMaps";
import { FaceitSection } from "@/components/FaceitSection";
import { StatsSwitch, type StatsSource } from "@/components/StatsSwitch";
import { StatsMascot } from "@/components/StatsMascot";
import { analyzeSuspicion } from "@/lib/suspicion";

/**
 * One player's page. The Steam side (`core`) is there from the start; each of `parts` shows up
 * when its own request lands, and the sections that need it show a skeleton until then.
 */
export function PlayerResults({
  core,
  parts,
  onRetryPart,
}: {
  core: PlayerCore;
  parts: Partial<PlayerParts>;
  onRetryPart?: (name: PartName) => void;
}) {
  const [source, setSource] = useState<StatsSource>("cs2");
  const rootRef = useRef<HTMLDivElement>(null);
  const leetify = parts.leetify;
  const faceit = parts.faceit;

  // The mascot judges Leetify and FACEIT numbers together, so it waits for both.
  const suspicion = useMemo(() => {
    if (!leetify || !faceit) return null;
    const player: PlayerData = { ...core, ...leetify, ...faceit, inventory: { status: "error" } };
    return analyzeSuspicion(player);
  }, [core, leetify, faceit]);

  return (
    <div ref={rootRef} className="flex flex-col">
      {suspicion && <StatsMascot report={suspicion} watchRef={rootRef} />}

      <AccountOverviewCard
        summary={core.summary}
        level={core.level}
        bans={core.bans}
        isPublic={core.isPublic}
        steamid={core.steamid}
        steamDbUrl={core.steamDbUrl}
        inventory={parts.inventory?.inventory ?? null}
        trust={core.trust}
      />

      <div className="animate-fade-up mt-10" style={{ animationDelay: "60ms" }}>
        <StatsSwitch value={source} onChange={setSource} idPrefix="player" />
      </div>

      <div
        role="tabpanel"
        id="player-panel"
        aria-labelledby={`player-tab-${source}`}
        key={source}
        className="animate-fade-up mt-8 [&>section:first-child]:mt-0"
      >
        {source === "cs2" ? (
          !leetify ? (
            <StatsPanelSkeleton label="Cargando estadísticas de Leetify…" />
          ) : leetify.leetifyStatus !== "ok" ? (
            <LeetifyEmpty status={leetify.leetifyStatus} onRetry={onRetryPart && (() => onRetryPart("leetify"))} />
          ) : (
            <>
              {/* Performance first: it's what tells you at a glance whether a profile looks off. */}
              <LeetifyMetrics profile={leetify.leetify} matches={leetify.leetifyMatches} steamid64={core.steamid} />
              <PremierTrend
                recentMatches={leetify.leetify?.recent_matches ?? []}
                currentRating={leetify.leetify?.ranks.premier ?? null}
              />
              <LeetifyMaps matches={leetify.leetifyMatches} steamid64={core.steamid} />
              <LeetifyMatchHistory matches={leetify.leetifyMatches} steamid64={core.steamid} />
            </>
          )
        ) : faceit ? (
          <FaceitSection faceit={faceit.faceit} />
        ) : (
          <StatsPanelSkeleton label="Cargando datos de FACEIT…" />
        )}
      </div>
    </div>
  );
}
