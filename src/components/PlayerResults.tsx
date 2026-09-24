"use client";

import { useState } from "react";
import type { PlayerData } from "@/lib/playerData";
import { AccountOverviewCard } from "@/components/AccountOverviewCard";
import { PremierTrend } from "@/components/PremierTrend";
import { LeetifyMetrics } from "@/components/LeetifyMetrics";
import { LeetifyMatchHistory } from "@/components/LeetifyMatchHistory";
import { FaceitSection } from "@/components/FaceitSection";
import { SteamIcon } from "@/components/icons/SteamIcon";
import { FaceitIcon } from "@/components/icons/FaceitIcon";

type Source = "cs2" | "faceit";

const TABS: { id: Source; label: string; source: string }[] = [
  { id: "cs2", label: "CS2", source: "Matchmaking y Premier · Leetify" },
  { id: "faceit", label: "FACEIT", source: "Perfil y partidas de FACEIT" },
];

export function PlayerResults({ data }: { data: PlayerData }) {
  const [source, setSource] = useState<Source>("cs2");

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

      <div className="animate-fade-up mt-16 flex flex-col gap-3" style={{ animationDelay: "60ms" }}>
        <div role="tablist" aria-label="Estadísticas a mostrar" className="grid grid-cols-2 border border-line sm:w-[28rem]">
          {TABS.map((tab) => {
            const active = source === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setSource(tab.id)}
                className={`flex items-center justify-center gap-2.5 px-4 py-3 font-display text-2xl leading-none font-extrabold uppercase transition-[background-color,color] duration-200 ${
                  active ? "bg-sand text-panel" : "text-ink-muted hover:bg-sand/[0.06] hover:text-sand"
                }`}
              >
                {tab.id === "cs2" ? <SteamIcon className="size-4" /> : <FaceitIcon className="size-4" />}
                {tab.label}
              </button>
            );
          })}
        </div>
        <span className="text-[13px] text-ink-muted">{TABS.find((t) => t.id === source)?.source}</span>
      </div>

      <div
        role="tabpanel"
        id={`panel-${source}`}
        aria-labelledby={`tab-${source}`}
        key={source}
        className="animate-fade-up mt-10"
      >
        {source === "cs2" ? (
          <>
            <PremierTrend
              recentMatches={data.leetify?.recent_matches ?? []}
              currentRating={data.leetify?.ranks.premier ?? null}
            />
            <LeetifyMetrics profile={data.leetify} matches={data.leetifyMatches} steamid64={data.steamid} />
            <LeetifyMatchHistory matches={data.leetifyMatches} steamid64={data.steamid} />
          </>
        ) : (
          <FaceitSection faceit={data.faceit} />
        )}
      </div>
    </div>
  );
}
