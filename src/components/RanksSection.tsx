import type { FaceitPlayer } from "@/lib/faceit";
import type { LeetifyRanks } from "@/lib/leetify";
import { FACEIT_LEVEL_COLORS, FACEIT_ORANGE, premierRankColor } from "@/lib/rankColors";
import { FaceitIcon } from "@/components/icons/FaceitIcon";
import { SteamIcon } from "@/components/icons/SteamIcon";
import { PremierBadge } from "@/components/PremierBadge";

function Tile({
  label,
  labelColor,
  icon,
  children,
}: {
  label: string;
  labelColor?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 bg-background p-5">
      <span
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
        style={{ color: labelColor ?? "var(--muted)" }}
      >
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

function FaceitLevelBadge({ level }: { level: number }) {
  const color = FACEIT_LEVEL_COLORS[level] ?? "#EEEEEE";
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold"
      style={{ borderColor: color, color }}
    >
      {level}
    </span>
  );
}

export function RanksSection({
  ranks,
  faceit,
}: {
  ranks: LeetifyRanks | null;
  faceit: FaceitPlayer | null;
}) {
  const premierColor = premierRankColor(ranks?.premier ?? null);

  return (
    <section className="mt-4">
      <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
        <Tile label="Premier" labelColor={premierColor} icon={<SteamIcon className="h-3.5 w-3.5" />}>
          <PremierBadge rating={ranks?.premier ?? null} color={premierColor} />
        </Tile>

        <Tile
          label="FACEIT"
          labelColor={FACEIT_ORANGE}
          icon={<FaceitIcon className="h-3.5 w-3.5" />}
        >
          {faceit ? (
            <div className="flex items-center gap-2">
              {faceit.skillLevel !== null && <FaceitLevelBadge level={faceit.skillLevel} />}
              <div className="flex flex-col">
                <span
                  className="text-lg font-semibold tracking-tight"
                  style={{ color: faceit.skillLevel ? FACEIT_LEVEL_COLORS[faceit.skillLevel] : undefined }}
                >
                  {faceit.elo ?? "—"}
                </span>
                <span className="text-xs text-muted">{faceit.nickname}</span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted">Sin cuenta vinculada</span>
          )}
        </Tile>

        <Tile label="Gamers Club">
          <span className="text-sm text-muted">Todavía no integrado</span>
        </Tile>
      </div>
    </section>
  );
}
