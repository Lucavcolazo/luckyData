import "server-only";
import { NextResponse } from "next/server";

/** Times an upstream call for the Server-Timing header (visible in the browser's network tab). */
export function timed<T>(timings: string[], name: string, promise: Promise<T>): Promise<T> {
  const start = performance.now();
  return promise.finally(() => timings.push(`${name};dur=${Math.round(performance.now() - start)}`));
}

export function jsonWithTimings(data: unknown, timings: string[]) {
  return NextResponse.json(data, { headers: { "Server-Timing": timings.join(", ") } });
}

/** Part routes take a resolved SteamID64, never raw user input. */
export function readSteamId(url: URL): string | null {
  const id = url.searchParams.get("steamid");
  return id && /^\d{17}$/.test(id) ? id : null;
}

export function badSteamId() {
  return NextResponse.json({ error: "SteamID64 inválido." }, { status: 400 });
}
