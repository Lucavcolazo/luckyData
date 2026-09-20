const MAP_META: Record<string, { label: string; color: string }> = {
  de_mirage: { label: "MIR", color: "#e0a458" },
  de_dust2: { label: "DST", color: "#d9c08c" },
  de_inferno: { label: "INF", color: "#e0655a" },
  de_nuke: { label: "NUK", color: "#7fb3d5" },
  de_ancient: { label: "ANC", color: "#8fbf8f" },
  de_cache: { label: "CAC", color: "#a3d977" },
  de_anubis: { label: "ANB", color: "#c9a866" },
  de_overpass: { label: "OVP", color: "#79c9c0" },
  de_vertigo: { label: "VTG", color: "#9aa5b1" },
  de_train: { label: "TRN", color: "#b0a0d0" },
};

function meta(mapName: string) {
  if (MAP_META[mapName]) return MAP_META[mapName];
  const clean = mapName.replace(/^de_|^cs_/, "");
  return { label: clean.slice(0, 3).toUpperCase(), color: "var(--muted)" };
}

/** Glifo propio (no el arte real del mapa) — monograma minimal con color distintivo. */
export function MapIcon({ mapName }: { mapName: string }) {
  const { label, color } = meta(mapName);
  return (
    <span
      className="flex h-6 w-9 shrink-0 items-center justify-center border text-[10px] font-semibold tracking-wide"
      style={{ borderColor: color, color }}
    >
      {label}
    </span>
  );
}
