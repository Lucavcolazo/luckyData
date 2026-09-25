import {
  PART_FALLBACKS,
  PART_NAMES,
  type PartName,
  type PlayerCore,
  type PlayerData,
  type PlayerParts,
} from "@/lib/playerData";

export type FetchResult<T> = { ok: true; data: T } | { ok: false; error: string };

const NETWORK_ERROR = "No pudimos conectar con el servidor. Probá de nuevo en un momento.";

/** Resolves the search and loads the Steam side of the player. */
export async function fetchCore(query: string): Promise<FetchResult<PlayerCore>> {
  try {
    const res = await fetch(`/api/player?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json?.error ?? "Algo salió mal. Probá de nuevo." };
    return { ok: true, data: json as PlayerCore };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

/** Loads one slow source. A failure falls back to "no data" instead of failing the whole page. */
export async function fetchPart<K extends PartName>(name: K, steamid: string): Promise<PlayerParts[K]> {
  try {
    const res = await fetch(`/api/player/${name}?steamid=${steamid}`);
    if (!res.ok) return PART_FALLBACKS[name];
    return (await res.json()) as PlayerParts[K];
  } catch {
    return PART_FALLBACKS[name];
  }
}

/** Everything about a player at once, for views that need it all (the comparison). */
export async function fetchFullPlayer(query: string): Promise<FetchResult<PlayerData>> {
  const core = await fetchCore(query);
  if (!core.ok) return core;
  const [leetify, faceit, inventory] = await Promise.all(PART_NAMES.map((name) => fetchPart(name, core.data.steamid)));
  return {
    ok: true,
    data: {
      ...core.data,
      ...(leetify as PlayerParts["leetify"]),
      ...(faceit as PlayerParts["faceit"]),
      ...(inventory as PlayerParts["inventory"]),
    },
  };
}
