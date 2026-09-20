import "server-only";

const BASE = "https://api-public.cs-prod.leetify.com";

export interface LeetifyRanks {
  leetify: number | null;
  premier: number | null;
  faceit_elo: number | null;
  wingman: number | null;
  renown: number | null;
  competitive: { map_name: string; rank: number | null }[];
}

export interface LeetifyRating {
  aim: number | null;
  positioning: number | null;
  utility: number | null;
  clutch: number | null;
  opening: number | null;
  ct_leetify: number | null;
  t_leetify: number | null;
}

export interface LeetifyStats {
  accuracy_enemy_spotted: number | null;
  accuracy_head: number | null;
  counter_strafing_good_shots_ratio: number | null;
  he_foes_damage_avg: number | null;
  he_friends_damage_avg: number | null;
  preaim: number | null;
  reaction_time_ms: number | null;
  spray_accuracy: number | null;
  trade_kills_success_percentage: number | null;
  traded_deaths_success_percentage: number | null;
}

/** rank_type: 11 = Premier, 12 = Competitive, 7 = Wingman (verificado con datos reales). */
export interface RecentMatchRank {
  finished_at: string;
  data_source: string;
  outcome: "win" | "loss" | "tie" | string;
  rank: number | null;
  rank_type: number | null;
}

export interface LeetifyProfile {
  privacy_mode: "public" | "private" | string;
  name: string;
  winrate: number | null;
  total_matches: number | null;
  first_match_date: string | null;
  ranks: LeetifyRanks;
  rating: LeetifyRating;
  stats: LeetifyStats;
  recent_matches: RecentMatchRank[];
}

export interface LeetifyMatchPlayerStats {
  steam64_id: string;
  name: string;
  initial_team_number: number;
  total_kills: number | null;
  total_deaths: number | null;
  total_assists: number | null;
  total_damage: number | null;
  kd_ratio: number | null;
  leetify_rating: number | null;
  total_hs_kills: number | null;
  rounds_count: number | null;
  /** Segundos, no ms — convertir con *1000 para comparar con reaction_time_ms del perfil. */
  reaction_time: number | null;
  preaim: number | null;
  /** Fracción 0-1, no porcentaje. */
  accuracy_head: number | null;
}

export interface LeetifyMatch {
  id: string;
  finished_at: string;
  data_source: string;
  map_name: string;
  team_scores: { team_number: number; score: number }[];
  stats: LeetifyMatchPlayerStats[];
}

function authHeaders(): Record<string, string> {
  const key = process.env.LEETIFY_API_KEY;
  if (!key) throw new Error("LEETIFY_API_KEY no está configurada en .env");
  return { _leetify_key: key };
}

/** Regla de Leetify: nunca cachear/guardar sus datos, siempre pedir en vivo. */
export async function getLeetifyProfile(steamid64: string): Promise<LeetifyProfile | null> {
  try {
    const url = new URL(`${BASE}/v3/profile`);
    url.searchParams.set("steam64_id", steamid64);

    const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) return null;

    const data: LeetifyProfile = await res.json();
    if (data.privacy_mode !== "public") return null;
    return data;
  } catch {
    return null;
  }
}

/** Regla de Leetify: nunca cachear/guardar sus datos, siempre pedir en vivo. */
export async function getLeetifyMatches(steamid64: string): Promise<LeetifyMatch[]> {
  try {
    const url = new URL(`${BASE}/v3/profile/matches`);
    url.searchParams.set("steam64_id", steamid64);

    const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) return [];

    const data: LeetifyMatch[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
