import "server-only";

const CS2_APP_ID = 730;
const CONTEXT_ID = 2;
const CURRENCY_USD = 1;
const INVENTORY_COUNT = 100;
const MAX_PRICED_ITEMS = 25;
const PRICE_CACHE_TTL_MS = 60 * 60 * 1000;
const INVENTORY_CACHE_TTL_MS = 10 * 60 * 1000;

interface InventoryAsset {
  classid: string;
  instanceid: string;
}

interface InventoryDescription {
  classid: string;
  instanceid: string;
  market_hash_name: string;
  marketable: number;
  tradable: number;
  icon_url: string;
}

interface SteamInventoryResponse {
  assets?: InventoryAsset[];
  descriptions?: InventoryDescription[];
  success: number;
}

export type InventoryValueResult =
  | { status: "ok"; totalValueUsd: number; itemCount: number; uniqueItems: number; pricedItems: number }
  | { status: "private_or_empty" }
  | { status: "rate_limited" }
  | { status: "error" };

const priceCache = new Map<string, { price: number; expiresAt: number }>();
const inventoryCache = new Map<string, { data: SteamInventoryResponse; expiresAt: number }>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPriceUsd(marketHashName: string): Promise<number | null> {
  const cached = priceCache.get(marketHashName);
  if (cached && cached.expiresAt > Date.now()) return cached.price;

  const url = new URL("https://steamcommunity.com/market/priceoverview/");
  url.searchParams.set("appid", String(CS2_APP_ID));
  url.searchParams.set("currency", String(CURRENCY_USD));
  url.searchParams.set("market_hash_name", marketHashName);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  const raw: string | undefined = data?.lowest_price ?? data?.median_price;
  if (!raw) return null;

  const price = Number(raw.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(price)) return null;

  priceCache.set(marketHashName, { price, expiresAt: Date.now() + PRICE_CACHE_TTL_MS });
  return price;
}

async function fetchInventory(steamid64: string): Promise<{ ok: true; data: SteamInventoryResponse } | { ok: false; rateLimited: boolean }> {
  const cached = inventoryCache.get(steamid64);
  if (cached && cached.expiresAt > Date.now()) return { ok: true, data: cached.data };

  const url = `https://steamcommunity.com/inventory/${steamid64}/${CS2_APP_ID}/${CONTEXT_ID}?l=english&count=${INVENTORY_COUNT}`;
  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 429) return { ok: false, rateLimited: true };
  if (!res.ok) return { ok: false, rateLimited: false };

  const data: SteamInventoryResponse = await res.json();
  inventoryCache.set(steamid64, { data, expiresAt: Date.now() + INVENTORY_CACHE_TTL_MS });
  return { ok: true, data };
}

export async function getInventoryValue(steamid64: string): Promise<InventoryValueResult> {
  try {
    return await computeInventoryValue(steamid64);
  } catch {
    return { status: "error" };
  }
}

async function computeInventoryValue(steamid64: string): Promise<InventoryValueResult> {
  const inventory = await fetchInventory(steamid64);
  if (!inventory.ok) return { status: inventory.rateLimited ? "rate_limited" : "error" };

  const { data } = inventory;
  if (!data.success || !data.assets || !data.descriptions) return { status: "private_or_empty" };

  const descByKey = new Map(data.descriptions.map((d) => [`${d.classid}_${d.instanceid}`, d]));

  const counts = new Map<string, number>();
  for (const asset of data.assets) {
    const key = `${asset.classid}_${asset.instanceid}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const marketable = [...counts.entries()]
    .map(([key, count]) => ({ desc: descByKey.get(key), count }))
    .filter((row) => row.desc?.marketable === 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_PRICED_ITEMS);

  let totalValueUsd = 0;
  let pricedItems = 0;

  for (const row of marketable) {
    const price = await fetchPriceUsd(row.desc!.market_hash_name);
    if (price !== null) {
      totalValueUsd += price * row.count;
      pricedItems += 1;
    }
    await sleep(150);
  }

  return {
    status: "ok",
    totalValueUsd,
    itemCount: data.assets.length,
    uniqueItems: counts.size,
    pricedItems,
  };
}
