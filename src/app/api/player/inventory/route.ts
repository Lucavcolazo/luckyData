import type { NextRequest } from "next/server";
import { getInventoryValue } from "@/lib/inventory";
import { badSteamId, jsonWithTimings, readSteamId, timed } from "@/lib/serverTiming";
import type { PlayerParts } from "@/lib/playerData";

export async function GET(request: NextRequest) {
  const steamid = readSteamId(request.nextUrl);
  if (!steamid) return badSteamId();

  const timings: string[] = [];
  const data: PlayerParts["inventory"] = { inventory: await timed(timings, "inventory", getInventoryValue(steamid)) };
  return jsonWithTimings(data, timings);
}
