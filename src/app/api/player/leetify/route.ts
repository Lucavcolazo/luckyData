import type { NextRequest } from "next/server";
import { getLeetifyMatches, getLeetifyProfile } from "@/lib/leetify";
import { badSteamId, jsonWithTimings, readSteamId, timed } from "@/lib/serverTiming";
import type { PlayerParts } from "@/lib/playerData";

export async function GET(request: NextRequest) {
  const steamid = readSteamId(request.nextUrl);
  if (!steamid) return badSteamId();

  const timings: string[] = [];
  const [{ profile, status }, leetifyMatches] = await Promise.all([
    timed(timings, "leetify", getLeetifyProfile(steamid)),
    timed(timings, "leetifyMatches", getLeetifyMatches(steamid)),
  ]);
  // A private profile keeps its matches private too.
  const data: PlayerParts["leetify"] = {
    leetify: profile,
    leetifyMatches: status === "private" ? [] : leetifyMatches,
    leetifyStatus: status,
  };
  return jsonWithTimings(data, timings);
}
