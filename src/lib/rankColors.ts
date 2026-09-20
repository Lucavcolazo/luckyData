export function trustScoreColor(score: number): string {
  if (score >= 85) return "var(--good)";
  if (score >= 65) return "var(--warn)";
  if (score >= 40) return "#f2872f";
  return "var(--bad)";
}

/** Bandas de color de Premier por umbral de puntos (referencia visual del juego). */
export function premierRankColor(rating: number | null): string {
  if (rating === null) return "var(--muted)";
  if (rating >= 30000) return "#e8b923";
  if (rating >= 25000) return "#e0433f";
  if (rating >= 20000) return "#e23fc4";
  if (rating >= 15000) return "#9b3ff2";
  if (rating >= 10000) return "#3f66f2";
  if (rating >= 5000) return "#4f6fb0";
  return "#9aa0a6";
}

export const FACEIT_LEVEL_COLORS: Record<number, string> = {
  1: "#EEEEEE",
  2: "#9CD323",
  3: "#9CD323",
  4: "#FFC010",
  5: "#FFC010",
  6: "#FFC010",
  7: "#FF6D10",
  8: "#FF6D10",
  9: "#FF4433",
  10: "#FF4433",
};

export const FACEIT_ORANGE = "#FF5500";
