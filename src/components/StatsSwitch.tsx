import { SteamIcon } from "@/components/icons/SteamIcon";
import { FaceitIcon } from "@/components/icons/FaceitIcon";

export type StatsSource = "cs2" | "faceit";

const TABS: { id: StatsSource; label: string; source: string }[] = [
  { id: "cs2", label: "CS2", source: "Matchmaking y Premier · Leetify" },
  { id: "faceit", label: "FACEIT", source: "Perfil y partidas de FACEIT" },
];

/** CS2 / FACEIT segmented switch. The matching panel should use `id={`${idPrefix}-panel`}`. */
export function StatsSwitch({
  value,
  onChange,
  idPrefix,
}: {
  value: StatsSource;
  onChange: (source: StatsSource) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Estadísticas a mostrar" className="grid grid-cols-2 border border-line sm:w-[28rem]">
        {TABS.map((tab) => {
          const active = value === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`${idPrefix}-panel`}
              onClick={() => onChange(tab.id)}
              className={`flex items-center justify-center gap-2.5 px-4 py-3 font-display text-2xl leading-none font-extrabold uppercase transition-[background-color,color] duration-200 ${
                active ? "bg-sand text-panel" : "text-ink-muted hover:bg-sand/[0.06] hover:text-sand"
              }`}
            >
              {tab.id === "cs2" ? <SteamIcon className="size-4" /> : <FaceitIcon className="size-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>
      <span className="text-[13px] text-ink-muted">{TABS.find((t) => t.id === value)?.source}</span>
    </div>
  );
}
