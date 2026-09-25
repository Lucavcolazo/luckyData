import { NextRequest, NextResponse } from "next/server";
import { parseSteamInput } from "@/lib/parseSteamInput";
import { getPlayerBans, getPlayerSummary, getSteamLevel, resolveVanityUrl } from "@/lib/steam";
import { computeTrustScore } from "@/lib/trustScore";
import type { PlayerCore } from "@/lib/playerData";
import { jsonWithTimings, timed } from "@/lib/serverTiming";

/**
 * The Steam side of a player (profile, bans, level, trust). Leetify, FACEIT and the inventory have
 * their own routes under /api/player/* so the page can show each one as soon as it lands.
 */
export async function GET(request: NextRequest) {
  const timings: string[] = [];
  const raw = request.nextUrl.searchParams.get("q");
  if (!raw) {
    return NextResponse.json({ error: "Falta el perfil a buscar." }, { status: 400 });
  }

  const parsed = parseSteamInput(raw);
  if (parsed.type === "invalid") {
    return NextResponse.json(
      {
        error:
          "No pudimos reconocer esa URL, vanity o SteamID64. Probá pegando el link completo de tu perfil de Steam.",
      },
      { status: 400 },
    );
  }

  let steamid = parsed.type === "steamid64" ? parsed.value : null;

  try {
    if (parsed.type === "vanity") {
      steamid = await timed(timings, "vanity", resolveVanityUrl(parsed.value));
    }
  } catch {
    return NextResponse.json(
      { error: "" },
      { status: 502 },
    );
  }

  if (!steamid) {
    return NextResponse.json(
      { error: "No encontramos ningún perfil de Steam con esa URL." },
      { status: 404 },
    );
  }

  let summary, bans, level;
  try {
    [summary, bans, level] = await Promise.all([
      timed(timings, "summary", getPlayerSummary(steamid)),
      timed(timings, "bans", getPlayerBans(steamid)),
      timed(timings, "level", getSteamLevel(steamid)),
    ]);
  } catch {
    return NextResponse.json(
      { error: "Probá de nuevo en un momento." },
      { status: 502 },
    );
  }

  if (!summary) {
    return NextResponse.json(
      { error: "No encontramos ningún perfil de Steam con esa URL." },
      { status: 404 },
    );
  }

  const isPublic = summary.communityvisibilitystate === 3;
  const trust = computeTrustScore(bans, level, summary.timecreated);
  const steamDbUrl = `https://steamdb.info/calculator/${steamid}/`;

  const data: PlayerCore = {
    steamid,
    summary,
    bans,
    level,
    isPublic,
    steamDbUrl,
    trust,
  };

  return jsonWithTimings(data, timings);
}
