import type { PlayerBans, PlayerSummary } from "@/lib/steam";
import type { FaceitPlayer } from "@/lib/faceit";
import type { InventoryValueResult } from "@/lib/inventory";
import type { LeetifyMatch, LeetifyProfile, LeetifyStatus } from "@/lib/leetify";
import type { TrustScoreResult } from "@/lib/trustScore";

/** The Steam side of a player: fast, and enough to draw the account block. */
export interface PlayerCore {
  steamid: string;
  summary: PlayerSummary;
  bans: PlayerBans | null;
  level: number | null;
  isPublic: boolean;
  steamDbUrl: string;
  trust: TrustScoreResult;
}

/** The slower sources, each fetched on its own so none of them holds up the others. */
export interface PlayerParts {
  leetify: { leetify: LeetifyProfile | null; leetifyMatches: LeetifyMatch[]; leetifyStatus: LeetifyStatus };
  faceit: { faceit: FaceitPlayer | null };
  inventory: { inventory: InventoryValueResult };
}

export type PartName = keyof PlayerParts;

export const PART_NAMES: PartName[] = ["leetify", "faceit", "inventory"];

export type PlayerData = PlayerCore &
  PlayerParts["leetify"] &
  PlayerParts["faceit"] &
  PlayerParts["inventory"];

/** What a part falls back to when its request fails, so the rest of the page still renders. */
export const PART_FALLBACKS: PlayerParts = {
  leetify: { leetify: null, leetifyMatches: [], leetifyStatus: "unavailable" },
  faceit: { faceit: null },
  inventory: { inventory: { status: "error" } },
};
