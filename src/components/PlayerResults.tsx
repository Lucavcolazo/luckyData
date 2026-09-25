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
import { analyzePlatformGap, analyzeSuspicion, METRIC_TAB, type SuspectMetric } from "@/lib/suspicion";
import { VerdictStrip } from "@/components/VerdictStrip";
import { metricAnchor } from "@/components/Dossier";

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
  const [onlyAtypical, setOnlyAtypical] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const verdictRef = useRef<HTMLElement>(null);
  const leetify = parts.leetify;
  const faceit = parts.faceit;

  // The mascot judges Leetify and FACEIT numbers together, so it waits for both.
  const { suspicion, platformGap } = useMemo(() => {
    if (!leetify || !faceit) return { suspicion: null, platformGap: null };
    const player: PlayerData = { ...core, ...leetify, ...faceit, inventory: { status: "error" } };
    return { suspicion: analyzeSuspicion(player), platformGap: analyzePlatformGap(player) };
  }, [core, leetify, faceit]);

  /** From a verdict chip to its tile: switch to the tile's tab, scroll there and flash it. */
  function jumpToMetric(key: SuspectMetric) {
    setSource(METRIC_TAB[key]);
    if (key === "matches") setOnlyAtypical(true);
    // Two frames: one for the tab panel to remount, one for layout.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(metricAnchor(key));
        if (!el) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // The match list is taller than the screen: land on its heading instead of its middle.
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: key === "matches" ? "start" : "center" });
        el.classList.remove("metric-flash");
        void el.offsetWidth; // restart the animation if it's already running
        el.classList.add("metric-flash");
      }),
    );
  }

  return (
    <div ref={rootRef} className="flex flex-col">
      {suspicion && (
        <StatsMascot report={suspicion} gap={platformGap} watchRef={rootRef} hideWhileVisibleRef={verdictRef} />
      )}

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

      <VerdictStrip ref={verdictRef} report={suspicion} onJump={jumpToMetric} />

      <div className="animate-fade-up mt-8" style={{ animationDelay: "60ms" }}>
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
              <LeetifyMetrics
                profile={leetify.leetify}
                matches={leetify.leetifyMatches}
                steamid64={core.steamid}
                suspicion={suspicion}
              />
              <PremierTrend
                recentMatches={leetify.leetify?.recent_matches ?? []}
                currentRating={leetify.leetify?.ranks.premier ?? null}
              />
              <LeetifyMaps matches={leetify.leetifyMatches} steamid64={core.steamid} />
              <LeetifyMatchHistory
                matches={leetify.leetifyMatches}
                steamid64={core.steamid}
                atypical={suspicion?.atypicalMatches}
                onlyAtypical={onlyAtypical}
                onOnlyAtypicalChange={setOnlyAtypical}
              />
            </>
          )
        ) : faceit ? (
          <FaceitSection faceit={faceit.faceit} suspicion={suspicion} />
        ) : (
          <StatsPanelSkeleton label="Cargando datos de FACEIT…" />
        )}
      </div>
    </div>
  );
}
