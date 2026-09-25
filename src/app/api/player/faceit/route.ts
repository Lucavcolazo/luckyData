import type { NextRequest } from "next/server";
import { getFaceitPlayerBySteamId } from "@/lib/faceit";
import { badSteamId, jsonWithTimings, readSteamId, timed } from "@/lib/serverTiming";
import type { PlayerParts } from "@/lib/playerData";

export async function GET(request: NextRequest) {
  const steamid = readSteamId(request.nextUrl);
  if (!steamid) return badSteamId();

  const timings: string[] = [];
  const data: PlayerParts["faceit"] = { faceit: await timed(timings, "faceit", getFaceitPlayerBySteamId(steamid)) };
  return jsonWithTimings(data, timings);
}
