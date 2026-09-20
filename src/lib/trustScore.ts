import type { PlayerBans } from "@/lib/steam";

export interface TrustScoreBreakdownItem {
  label: string;
  score: number;
}

export interface TrustScoreResult {
  score: number;
  tier: "Excelente" | "Buena" | "Regular" | "Baja";
  breakdown: TrustScoreBreakdownItem[];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Heurística propia, no es el Trust Factor de Valve/FACEIT. Combina señales
 * públicas de Steam (bans, antigüedad, nivel). Cuando tengamos parseo de
 * demos se puede sumar un componente de "señales de partida" real.
 */
export function computeTrustScore(
  bans: PlayerBans | null,
  level: number | null,
  timecreated: number | undefined,
): TrustScoreResult {
  let banScore = 100;
  if (bans) {
    if (bans.VACBanned) banScore -= 100;
    banScore -= bans.NumberOfGameBans * 30;
    if (bans.CommunityBanned) banScore -= 30;
    if (bans.EconomyBan && bans.EconomyBan !== "none") banScore -= 20;
  }
  banScore = clamp(banScore, 0, 100);

  let ageScore = 40;
  if (timecreated) {
    const years = (Date.now() / 1000 - timecreated) / (365.25 * 24 * 3600);
    ageScore = clamp(years * 14, 0, 100);
  }

  const levelScore = clamp((level ?? 0) * 2.5, 0, 100);

  const score = Math.round(banScore * 0.6 + ageScore * 0.25 + levelScore * 0.15);

  const tier: TrustScoreResult["tier"] =
    score >= 85 ? "Excelente" : score >= 65 ? "Buena" : score >= 40 ? "Regular" : "Baja";

  return {
    score,
    tier,
    breakdown: [
      { label: "Historial de bans", score: Math.round(banScore) },
      { label: "Antigüedad de cuenta", score: Math.round(ageScore) },
      { label: "Nivel de Steam", score: Math.round(levelScore) },
    ],
  };
}
