"use client";

import { useState } from "react";
import type { PlayerData } from "@/lib/playerData";
import { AccountOverviewCard } from "@/components/AccountOverviewCard";
import { PremierTrend } from "@/components/PremierTrend";
import { LeetifyMetrics } from "@/components/LeetifyMetrics";
import { LeetifyMatchHistory } from "@/components/LeetifyMatchHistory";
import { LeetifyMaps } from "@/components/LeetifyMaps";
import { FaceitSection } from "@/components/FaceitSection";
import { StatsSwitch, type StatsSource } from "@/components/StatsSwitch";

export function PlayerResults({ data }: { data: PlayerData }) {
  const [source, setSource] = useState<StatsSource>("cs2");

  return (
    <div className="flex flex-col">
      <AccountOverviewCard
        summary={data.summary}
        level={data.level}
        bans={data.bans}
        isPublic={data.isPublic}
        steamid={data.steamid}
        steamDbUrl={data.steamDbUrl}
        inventory={data.inventory}
        trust={data.trust}
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
          <>
            {/* Performance first: it's what tells you at a glance whether a profile looks off. */}
            <LeetifyMetrics profile={data.leetify} matches={data.leetifyMatches} steamid64={data.steamid} />
            <PremierTrend
              recentMatches={data.leetify?.recent_matches ?? []}
              currentRating={data.leetify?.ranks.premier ?? null}
            />
            <LeetifyMaps matches={data.leetifyMatches} steamid64={data.steamid} />
            <LeetifyMatchHistory matches={data.leetifyMatches} steamid64={data.steamid} />
          </>
        ) : (
          <FaceitSection faceit={data.faceit} />
        )}
      </div>
    </div>
  );
}
