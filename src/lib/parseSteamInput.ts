const STEAMID64_RE = /^7656\d{13}$/;

export type ParsedSteamInput =
  | { type: "steamid64"; value: string }
  | { type: "vanity"; value: string }
  | { type: "invalid" };

/** Accepts a full Steam profile URL, a bare vanity name, or a SteamID64. */
export function parseSteamInput(raw: string): ParsedSteamInput {
  const input = raw.trim();
  if (!input) return { type: "invalid" };

  let candidate = input;

  try {
    const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const url = new URL(withProtocol);
    if (/steamcommunity\.com$/i.test(url.hostname)) {
      const parts = url.pathname.split("/").filter(Boolean);
      const [kind, id] = parts;
      if (kind === "profiles" && id) candidate = id;
      else if (kind === "id" && id) candidate = id;
      else return { type: "invalid" };
    }
  } catch {
    // not a URL, fall through and treat the raw input as a vanity/id
  }

  if (STEAMID64_RE.test(candidate)) return { type: "steamid64", value: candidate };
  if (/^[a-zA-Z0-9_-]{2,32}$/.test(candidate)) return { type: "vanity", value: candidate };
  return { type: "invalid" };
}
