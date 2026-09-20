import "server-only";

const CS2_APP_ID = 730;
const BASE = "https://api.steampowered.com";

function apiKey(): string {
  const key = process.env.STEAM_API_KEY;
  if (!key) throw new Error("STEAM_API_KEY no está configurada en .env.local");
  return key;
}

export class SteamApiError extends Error {}

export interface PlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
  timecreated?: number;
  loccountrycode?: string;
}

export interface PlayerBans {
  VACBanned: boolean;
  NumberOfVACBans: number;
  NumberOfGameBans: number;
  DaysSinceLastBan: number;
  CommunityBanned: boolean;
  EconomyBan: string;
}

export interface Cs2Stats {
  totalKills: number;
  totalDeaths: number;
  totalHeadshots: number;
  totalWins: number;
  totalRoundsPlayed: number;
  totalMvps: number;
  totalTimePlayedSeconds: number;
  totalPlantedBombs: number;
  totalDefusedBombs: number;
  totalDamageDone: number;
  kd: number;
  headshotPct: number;
  winPct: number;
  hoursPlayed: number;
  adr: number;
}

async function steamFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("key", apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new SteamApiError(`Steam API respondió ${res.status} en ${path}`);
  }
  return res.json();
}

export async function resolveVanityUrl(vanity: string): Promise<string | null> {
  const data = await steamFetch("/ISteamUser/ResolveVanityURL/v1/", {
    vanityurl: vanity,
  });
  const result = data?.response;
  if (result?.success === 1 && result.steamid) return result.steamid as string;
  return null;
}

export async function getPlayerSummary(steamid: string): Promise<PlayerSummary | null> {
  const data = await steamFetch("/ISteamUser/GetPlayerSummaries/v2/", {
    steamids: steamid,
  });
  const player = data?.response?.players?.[0];
  return player ?? null;
}

export async function getPlayerBans(steamid: string): Promise<PlayerBans | null> {
  const data = await steamFetch("/ISteamUser/GetPlayerBans/v1/", {
    steamids: steamid,
  });
  const player = data?.players?.[0];
  return player ?? null;
}

export async function getSteamLevel(steamid: string): Promise<number | null> {
  try {
    const data = await steamFetch("/IPlayerService/GetSteamLevel/v1/", {
      steamid,
    });
    return data?.response?.player_level ?? null;
  } catch {
    return null;
  }
}

export async function getCs2Stats(steamid: string): Promise<Cs2Stats | null> {
  const data = await steamFetch("/ISteamUserStats/GetUserStatsForGame/v2/", {
    steamid,
    appid: String(CS2_APP_ID),
  });

  const rows: { name: string; value: number }[] = data?.playerstats?.stats;
  if (!rows) return null;

  const stat = (name: string) => rows.find((r) => r.name === name)?.value ?? 0;

  const totalKills = stat("total_kills");
  const totalDeaths = stat("total_deaths");
  const totalHeadshots = stat("total_kills_headshot");
  const totalWins = stat("total_wins");
  const totalRoundsPlayed = stat("total_rounds_played");
  const totalMvps = stat("total_mvps");
  const totalTimePlayedSeconds = stat("total_time_played");
  const totalPlantedBombs = stat("total_planted_bombs");
  const totalDefusedBombs = stat("total_defused_bombs");
  const totalDamageDone = stat("total_damage_done");

  return {
    totalKills,
    totalDeaths,
    totalHeadshots,
    totalWins,
    totalRoundsPlayed,
    totalMvps,
    totalTimePlayedSeconds,
    totalPlantedBombs,
    totalDefusedBombs,
    totalDamageDone,
    kd: totalDeaths > 0 ? totalKills / totalDeaths : totalKills,
    headshotPct: totalKills > 0 ? (totalHeadshots / totalKills) * 100 : 0,
    winPct: totalRoundsPlayed > 0 ? (totalWins / totalRoundsPlayed) * 100 : 0,
    hoursPlayed: totalTimePlayedSeconds / 3600,
    adr: totalRoundsPlayed > 0 ? totalDamageDone / totalRoundsPlayed : 0,
  };
}
