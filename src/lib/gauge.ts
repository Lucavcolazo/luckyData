export type Direction = "higher-better" | "lower-better";

/** Where `value` sits in [min, max], flipped for lower-better metrics so 1 is always the good end. */
export function gaugeRatio(value: number, min: number, max: number, direction: Direction): number {
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return direction === "higher-better" ? ratio : 1 - ratio;
}
