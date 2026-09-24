import "server-only";

const BASE = "https://open.faceit.com/data/v4";
const MATCH_LIMIT = 20;
const HISTORY_LIMIT = 100;

export interface FaceitLifetime {
  matches: number | null;
  winRate: number | null;
  kd: number | null;
  hsPct: number | null;
  adr: number | null;
  currentStreak: number | null;
  longestStreak: number | null;
  /** Last five results, in the order FACEIT's own profile card shows them. */
  recentResults: ("win" | "loss")[];
  /** Share of rounds where the player took the opening duel (0-100). */
  entryRate: number | null;
  entrySuccess: number | null;
  clutch1v1Rate: number | null;
  clutch1v1Wins: number | null;
  clutch1v1Count: number | null;
  clutch1v2Rate: number | null;
  clutch1v2Wins: number | null;
  clutch1v2Count: number | null;
  utilityDamagePerRound: number | null;
  flashSuccess: number | null;
  utilitySuccess: number | null;
  sniperKillsPerRound: number | null;
}

export interface FaceitMapStats {
  name: string;
  image: string | null;
  matches: number;
  winRate: number | null;
  kd: number | null;
  adr: number | null;
  hsPct: number | null;
}

export interface FaceitMatchStats {
  id: string;
  map: string;
  finishedAt: number;
  won: boolean | null;
  score: string;
  kills: number | null;
  deaths: number | null;
  kd: number | null;
  adr: number | null;
  hsPct: number | null;
  mvps: number | null;
}

export interface FaceitPlayer {
  nickname: string;
  country: string;
  faceitUrl: string;
  skillLevel: number | null;
  elo: number | null;
  game: "cs2" | "csgo";
  avatar: string | null;
  verified: boolean;
  premium: boolean;
  memberSince: string | null;
  region: string | null;
  /** Position in the player's region ladder. */
  regionRank: number | null;
  lifetime: FaceitLifetime | null;
  maps: FaceitMapStats[];
  recentMatches: FaceitMatchStats[];
  /** Skill level the player had in each recent match, oldest to newest. */
  levelHistory: { finishedAt: number; level: number }[];
}

type Auth = Record<string, string>;
type Raw = Record<string, unknown>;

function headers(): Auth | null {
  const key = process.env.FACEIT_API_KEY;
  if (!key) return null;
  return { Authorization: `Bearer ${key}` };
}

async function getJson(path: string, auth: Auth): Promise<Raw | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: auth, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Raw;
  } catch {
    return null;
  }
}

/** FACEIT sends every stat as a string. */
const num = (v: unknown): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
/** Rates that come as a 0-1 fraction, turned into a percentage. */
const pct = (v: unknown): number | null => {
  const n = num(v);
  return n === null ? null : n * 100;
};

function parseLifetime(raw: Raw): FaceitLifetime {
  // Careful: "K/D Ratio" and "Total Headshots %" are running sums, the averages are the "Average ..." keys.
  const recent = Array.isArray(raw["Recent Results"]) ? (raw["Recent Results"] as unknown[]) : [];
  return {
    matches: num(raw["Matches"]),
    winRate: num(raw["Win Rate %"]),
    kd: num(raw["Average K/D Ratio"]),
    hsPct: num(raw["Average Headshots %"]),
    adr: num(raw["ADR"]),
    currentStreak: num(raw["Current Win Streak"]),
    longestStreak: num(raw["Longest Win Streak"]),
    recentResults: recent.map((r) => (String(r) === "1" ? "win" : "loss")),
    entryRate: pct(raw["Entry Rate"]),
    entrySuccess: pct(raw["Entry Success Rate"]),
    clutch1v1Rate: pct(raw["1v1 Win Rate"]),
    clutch1v1Wins: num(raw["Total 1v1 Wins"]),
    clutch1v1Count: num(raw["Total 1v1 Count"]),
    clutch1v2Rate: pct(raw["1v2 Win Rate"]),
    clutch1v2Wins: num(raw["Total 1v2 Wins"]),
    clutch1v2Count: num(raw["Total 1v2 Count"]),
    utilityDamagePerRound: num(raw["Utility Damage per Round"]),
    flashSuccess: pct(raw["Flash Success Rate"]),
    utilitySuccess: pct(raw["Utility Success Rate"]),
    sniperKillsPerRound: num(raw["Sniper Kill Rate per Round"]),
  };
}

function parseMaps(segments: unknown): FaceitMapStats[] {
  if (!Array.isArray(segments)) return [];
  return (segments as Raw[])
    .filter((s) => s.type === "Map" && s.mode === "5v5")
    .map((s) => {
      const stats = (s.stats ?? {}) as Raw;
      return {
        name: String(s.label ?? ""),
        image: typeof s.img_regular === "string" ? s.img_regular : null,
        matches: num(stats["Matches"]) ?? 0,
        winRate: num(stats["Win Rate %"]),
        kd: num(stats["Average K/D Ratio"]),
        adr: num(stats["ADR"]),
        hsPct: num(stats["Average Headshots %"]),
      };
    })
    .filter((m) => m.matches > 0)
    .sort((a, b) => b.matches - a.matches);
}

function parseMatches(items: unknown): FaceitMatchStats[] {
  if (!Array.isArray(items)) return [];
  return (items as Raw[]).map((item) => {
    const s = (item.stats ?? {}) as Raw;
    const result = num(s["Result"]);
    // "Score" lists both teams in a fixed order; "Final Score" is the player's side.
    const sides = String(s["Score"] ?? "").split("/").map((v) => v.trim());
    const mine = String(s["Final Score"] ?? sides[0] ?? "");
    const other = sides.length === 2 ? (sides[0] === mine ? sides[1] : sides[0]) : "";
    return {
      id: String(s["Match Id"] ?? ""),
      map: String(s["Map"] ?? ""),
      finishedAt: num(s["Match Finished At"]) ?? 0,
      won: result === null ? null : result === 1,
      score: other ? `${mine}:${other}` : mine,
      kills: num(s["Kills"]),
      deaths: num(s["Deaths"]),
      kd: num(s["K/D Ratio"]),
      adr: num(s["ADR"]),
      hsPct: num(s["Headshots %"]),
      mvps: num(s["MVPs"]),
    };
  });
}

function parseLevelHistory(items: unknown, playerId: string): FaceitPlayer["levelHistory"] {
  if (!Array.isArray(items)) return [];
  const points: FaceitPlayer["levelHistory"] = [];
  for (const match of items as Raw[]) {
    const teams = Object.values((match.teams ?? {}) as Record<string, Raw>);
    const me = teams
      .flatMap((t) => (Array.isArray(t.players) ? (t.players as Raw[]) : []))
      .find((p) => p.player_id === playerId);
    const level = num(me?.skill_level);
    const finishedAt = num(match.finished_at);
    // Level 0 shows up for matches played before the account was ranked.
    if (level !== null && level >= 1 && finishedAt !== null) points.push({ finishedAt: finishedAt * 1000, level });
  }
  return points.sort((a, b) => a.finishedAt - b.finishedAt);
}

async function fetchPlayerForGame(steamid64: string, game: "cs2" | "csgo", auth: Auth): Promise<FaceitPlayer | null> {
  const url = new URL(`${BASE}/players`);
  url.searchParams.set("game", game);
  url.searchParams.set("game_player_id", steamid64);

  const res = await fetch(url, { headers: auth, cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`FACEIT API respondió ${res.status}`);

  const data = (await res.json()) as Raw;
  const gameStats = ((data.games ?? {}) as Record<string, Raw>)[game];
  if (!gameStats) return null;

  const playerId = String(data.player_id);
  const region = typeof gameStats.region === "string" ? gameStats.region : null;

  // Everything past the profile is optional: a failed call just leaves that block empty.
  const [stats, matches, history, ranking] = await Promise.all([
    getJson(`/players/${playerId}/stats/${game}`, auth),
    getJson(`/players/${playerId}/games/${game}/stats?limit=${MATCH_LIMIT}`, auth),
    getJson(`/players/${playerId}/history?game=${game}&limit=${HISTORY_LIMIT}`, auth),
    region ? getJson(`/rankings/games/${game}/regions/${region}/players/${playerId}?limit=1`, auth) : null,
  ]);

  const memberships = Array.isArray(data.memberships) ? (data.memberships as string[]) : [];

  return {
    nickname: String(data.nickname),
    country: String(data.country ?? ""),
    faceitUrl: `https://www.faceit.com/es/players/${data.nickname}`,
    skillLevel: num(gameStats.skill_level),
    elo: num(gameStats.faceit_elo),
    game,
    avatar: typeof data.avatar === "string" && data.avatar ? data.avatar : null,
    verified: data.verified === true,
    premium: memberships.includes("premium"),
    memberSince: typeof data.activated_at === "string" ? data.activated_at : null,
    region,
    regionRank: num(ranking?.position),
    lifetime: stats?.lifetime ? parseLifetime(stats.lifetime as Raw) : null,
    maps: parseMaps(stats?.segments),
    recentMatches: parseMatches(matches?.items),
    levelHistory: parseLevelHistory(history?.items, playerId),
  };
}

export async function getFaceitPlayerBySteamId(steamid64: string): Promise<FaceitPlayer | null> {
  const auth = headers();
  if (!auth) return null;

  try {
    const cs2 = await fetchPlayerForGame(steamid64, "cs2", auth);
    if (cs2) return cs2;
    return await fetchPlayerForGame(steamid64, "csgo", auth);
  } catch {
    return null;
  }
}
