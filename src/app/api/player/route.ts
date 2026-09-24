import { NextRequest, NextResponse } from "next/server";
import { parseSteamInput } from "@/lib/parseSteamInput";
import { getPlayerBans, getPlayerSummary, getSteamLevel, resolveVanityUrl } from "@/lib/steam";
import { getFaceitPlayerBySteamId } from "@/lib/faceit";
import { getInventoryValue } from "@/lib/inventory";
import { getLeetifyMatches, getLeetifyProfile } from "@/lib/leetify";
import { computeTrustScore } from "@/lib/trustScore";
import type { PlayerData } from "@/lib/playerData";

export async function GET(request: NextRequest) {
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
      steamid = await resolveVanityUrl(parsed.value);
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

  let summary, bans, level, faceit, inventory, leetify, leetifyMatches;
  try {
    [summary, bans, level, faceit, inventory, leetify, leetifyMatches] = await Promise.all([
      getPlayerSummary(steamid),
      getPlayerBans(steamid),
      getSteamLevel(steamid),
      getFaceitPlayerBySteamId(steamid),
      getInventoryValue(steamid),
      getLeetifyProfile(steamid),
      getLeetifyMatches(steamid),
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

  const data: PlayerData = {
    steamid,
    summary,
    bans,
    level,
    faceit,
    inventory,
    leetify,
    leetifyMatches,
    isPublic,
    steamDbUrl,
    trust,
  };

  return NextResponse.json(data);
}
