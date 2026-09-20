import "server-only";

const BASE = "https://open.faceit.com/data/v4";

export interface FaceitPlayer {
  nickname: string;
  country: string;
  faceitUrl: string;
  skillLevel: number | null;
  elo: number | null;
  game: "cs2" | "csgo";
}

function headers() {
  const key = process.env.FACEIT_API_KEY;
  if (!key) return null;
  return { Authorization: `Bearer ${key}` };
}

async function fetchPlayerForGame(
  steamid64: string,
  game: "cs2" | "csgo",
  auth: Record<string, string>,
): Promise<FaceitPlayer | null> {
  const url = new URL(`${BASE}/players`);
  url.searchParams.set("game", game);
  url.searchParams.set("game_player_id", steamid64);

  const res = await fetch(url, { headers: auth, cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`FACEIT API respondió ${res.status}`);

  const data = await res.json();
  const gameStats = data?.games?.[game];

  return {
    nickname: data.nickname,
    country: data.country,
    faceitUrl: `https://www.faceit.com/en/players/${data.nickname}`,
    skillLevel: gameStats?.skill_level ?? null,
    elo: gameStats?.faceit_elo ?? null,
    game,
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
