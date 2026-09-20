import type { PlayerBans, PlayerSummary } from "@/lib/steam";
import type { FaceitPlayer } from "@/lib/faceit";
import type { InventoryValueResult } from "@/lib/inventory";
import type { LeetifyMatch, LeetifyProfile } from "@/lib/leetify";
import type { TrustScoreResult } from "@/lib/trustScore";

export interface PlayerData {
  steamid: string;
  summary: PlayerSummary;
  bans: PlayerBans | null;
  level: number | null;
  faceit: FaceitPlayer | null;
  inventory: InventoryValueResult;
  leetify: LeetifyProfile | null;
  leetifyMatches: LeetifyMatch[];
  isPublic: boolean;
  steamDbUrl: string;
  trust: TrustScoreResult;
}
