import type { FaceitPlayer } from "@/lib/faceit";
import type { LeetifyRanks } from "@/lib/leetify";
import { FACEIT_ORANGE } from "@/lib/rankColors";
import { FaceitIcon } from "@/components/icons/FaceitIcon";
import { SteamIcon } from "@/components/icons/SteamIcon";
import { PremierBadge } from "@/components/PremierBadge";
import { FaceitLevelBadge } from "@/components/FaceitLevelBadge";
import { Label, SectionHeading } from "@/components/Dossier";

export function RanksSection({
  ranks,
  faceit,
}: {
  ranks: LeetifyRanks | null;
  faceit: FaceitPlayer | null;
}) {
  return (
    <section className="mt-16">
      <SectionHeading aside={<span className="text-[13px] text-ink-muted">Gamers Club: próximamente</span>}>
        Rangos
      </SectionHeading>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex flex-col items-start gap-3">
          <span className="flex items-center gap-2 text-ink-muted">
            <SteamIcon className="size-3.5" />
            <Label>Premier</Label>
          </span>
          <PremierBadge rating={ranks?.premier ?? null} />
        </div>

        <div className="flex flex-col items-start gap-3">
          <span className="flex items-center gap-2" style={{ color: FACEIT_ORANGE }}>
            <FaceitIcon className="size-3.5" />
            <Label>FACEIT</Label>
          </span>
          {faceit ? (
            <div className="flex items-center gap-3">
              {faceit.skillLevel !== null && <FaceitLevelBadge level={faceit.skillLevel} size={44} />}
              <div className="flex flex-col">
                <span className="font-label text-3xl leading-none font-bold tabular-nums">
                  {faceit.elo ?? "—"}
                  <span className="ml-1.5 text-base text-ink-muted">ELO</span>
                </span>
                <span className="text-[13px] text-ink-muted">{faceit.nickname}</span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-ink-muted">Sin cuenta de FACEIT vinculada.</span>
          )}
        </div>
      </div>
    </section>
  );
}
