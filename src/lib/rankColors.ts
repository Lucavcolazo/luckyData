export interface PremierTier {
  /** Tier colour: the two stripes and the speed lines. */
  color: string;
  /** Dark body of the badge (the tier colour at 35% over black). */
  fill: string;
  /** Number colour, lightened from the tier colour until it clears 4.5:1 on the badge and the speed lines under it. */
  text: string;
}

/** CS2 Premier tiers, one per 5.000 points, with the colours from the game's rating_emblem.css. */
const PREMIER_TIERS: PremierTier[] = [
  { color: "#b0c3d9", fill: "#3e444c", text: "#cfe5ff" },
  { color: "#8cc6ff", fill: "#314559", text: "#a0d0ff" },
  { color: "#6a7dff", fill: "#252c59", text: "#93a2ff" },
  { color: "#c166ff", fill: "#442459", text: "#d291ff" },
  { color: "#f03cff", fill: "#541559", text: "#f57dff" },
  { color: "#eb4b4b", fill: "#521a1a", text: "#ff7b7b" },
  { color: "#ffd700", fill: "#594b00", text: "#ffda12" },
];

export function premierTier(rating: number): PremierTier {
  const tier = Math.floor((Number.isFinite(rating) ? rating : 0) / 5000);
  return PREMIER_TIERS[Math.min(6, Math.max(0, tier))];
}

/** Colour of the Premier band a rating falls in. */
export function premierRankColor(rating: number | null): string {
  if (rating === null) return "var(--muted)";
  return premierTier(rating).color;
}

/** FACEIT skill level colours, as in FACEIT's own level icons. */
export const FACEIT_LEVEL_COLORS: Record<number, string> = {
  1: "#EEEEEE",
  2: "#1CE400",
  3: "#1CE400",
  4: "#FFC800",
  5: "#FFC800",
  6: "#FFC800",
  7: "#FFC800",
  8: "#FF6309",
  9: "#FF6309",
  10: "#FE1F00",
};

export const FACEIT_ORANGE = "#FF5500";

/** FACEIT CS2 ELO range of each skill level (FACEIT help center, "CS2 Elo and skill levels"). */
export const FACEIT_LEVEL_RANGES: { level: number; min: number; max: number | null }[] = [
  { level: 1, min: 100, max: 500 },
  { level: 2, min: 501, max: 750 },
  { level: 3, min: 751, max: 900 },
  { level: 4, min: 901, max: 1050 },
  { level: 5, min: 1051, max: 1200 },
  { level: 6, min: 1201, max: 1350 },
  { level: 7, min: 1351, max: 1530 },
  { level: 8, min: 1531, max: 1750 },
  { level: 9, min: 1751, max: 2000 },
  { level: 10, min: 2001, max: null },
];
