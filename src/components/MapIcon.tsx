const MAP_LABELS: Record<string, string> = {
  de_mirage: "MIR",
  de_dust2: "DST",
  de_inferno: "INF",
  de_nuke: "NUK",
  de_ancient: "ANC",
  de_cache: "CAC",
  de_anubis: "ANB",
  de_overpass: "OVP",
  de_vertigo: "VTG",
  de_train: "TRN",
};

/** Glifo propio (no el arte real del mapa): monograma stencil en tinta arena. */
export function MapIcon({ mapName }: { mapName: string }) {
  const label = MAP_LABELS[mapName] ?? mapName.replace(/^de_|^cs_/, "").slice(0, 3).toUpperCase();
  return (
    <span
      className="flex h-7 w-11 shrink-0 items-center justify-center border border-line font-label text-sm font-bold tracking-[0.08em] text-sand"
      aria-hidden
    >
      {label}
    </span>
  );
}
