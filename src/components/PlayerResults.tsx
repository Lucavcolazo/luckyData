import type { PlayerData } from "@/lib/playerData";
import { AccountOverviewCard } from "@/components/AccountOverviewCard";
import { RanksSection } from "@/components/RanksSection";
import { PremierTrend } from "@/components/PremierTrend";
import { LeetifyMetrics } from "@/components/LeetifyMetrics";
import { LeetifyMatchHistory } from "@/components/LeetifyMatchHistory";

export function PlayerResults({ data }: { data: PlayerData }) {
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

      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <RanksSection ranks={data.leetify?.ranks ?? null} faceit={data.faceit} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
        <PremierTrend recentMatches={data.leetify?.recent_matches ?? []} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
        <LeetifyMetrics profile={data.leetify} matches={data.leetifyMatches} steamid64={data.steamid} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
        <LeetifyMatchHistory matches={data.leetifyMatches} steamid64={data.steamid} />
      </div>
    </div>
  );
}
