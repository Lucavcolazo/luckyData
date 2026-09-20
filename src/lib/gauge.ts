export type Direction = "higher-better" | "lower-better";

export function gaugeColor(ratio: number, direction: Direction): string {
  const r = direction === "higher-better" ? ratio : 1 - ratio;
  if (r >= 0.66) return "var(--good)";
  if (r >= 0.33) return "var(--warn)";
  return "var(--bad)";
}
