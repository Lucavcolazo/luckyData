import Image from "next/image";

export interface MapGridItem {
  name: string;
  image: string | null;
  matches: number;
  winRate: number | null;
  kd: number | null;
  adr: number | null;
}

/** A map needs this many matches before it can be called the best or worst one. */
const MIN_MAP_MATCHES = 5;

/**
 * Map art from FACEIT's CDN (the same images its own stats pages use), keyed by map name. Used
 * where the data source has no art of its own, like Leetify.
 */
export const MAP_IMAGES: Record<string, string> = {
  de_ancient: "https://distribution.faceit-cdn.net/images/6f72ffec-7607-44cf-9c31-09a865fa92f5.jpeg",
  de_anubis: "https://distribution.faceit-cdn.net/images/1c2412c7-ae0c-4fa1-ad86-82a3287cb479.jpeg",
  de_cache: "https://distribution.faceit-cdn.net/images/275a4b5d-bb14-4a3c-89aa-a3fad7a69888.png",
  de_dust2: "https://distribution.faceit-cdn.net/images/4eafa800-b504-4dd2-afd0-90882c729140.jpeg",
  de_inferno: "https://distribution.faceit-cdn.net/images/d71cae42-b38c-470d-a548-0c59d6c71fbe.jpeg",
  de_mirage: "https://distribution.faceit-cdn.net/images/c47710c4-4407-4dbd-ac89-2ef3b20a262e.jpeg",
  de_nuke: "https://distribution.faceit-cdn.net/images/faa7775b-f42b-4627-891a-21ee7cc13637.jpeg",
  de_overpass: "https://distribution.faceit-cdn.net/images/8ba6f730-fa31-4dd7-9b41-4cff81d79fef.jpeg",
  de_train: "https://distribution.faceit-cdn.net/images/9e2d5b60-e16e-4309-8e77-8d4427938095.jpeg",
  de_vertigo: "https://distribution.faceit-cdn.net/images/a8d0572f-8a89-474a-babc-c2009cdc42f7.jpeg",
};

const fmt = (n: number | null, decimals = 0) =>
  n === null
    ? "—"
    : n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Map tiles with the map art behind the numbers; flags the best and worst map by win rate. */
export function MapGrid({ maps }: { maps: MapGridItem[] }) {
  const ranked = maps.filter((m) => m.matches >= MIN_MAP_MATCHES && m.winRate !== null);
  const best = ranked.length > 1 ? ranked.reduce((a, b) => (b.winRate! > a.winRate! ? b : a)) : null;
  const worst = ranked.length > 1 ? ranked.reduce((a, b) => (b.winRate! < a.winRate! ? b : a)) : null;

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {maps.map((m) => (
        <li key={m.name} className="relative isolate flex h-40 flex-col justify-end overflow-hidden bg-sand/[0.04] p-4">
          {m.image && (
            <Image src={m.image} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="-z-20 object-cover" unoptimized />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-panel via-panel/80 to-panel/30" aria-hidden />
          {(m === best || m === worst) && (
            <span
              className={`absolute top-3 left-3 px-2 py-0.5 font-label text-xs font-bold tracking-[0.12em] uppercase ${
                m === best ? "bg-good text-panel" : "bg-paint text-white"
              }`}
            >
              {m === best ? "Mejor mapa" : "Peor mapa"}
            </span>
          )}
          <span className="font-display text-3xl leading-none font-black text-foreground uppercase">{m.name}</span>
          <span className="mt-2 flex flex-wrap gap-x-3 text-[13px] text-sand tabular-nums">
            <span>
              {fmt(m.matches)} {m.matches === 1 ? "partida" : "partidas"}
            </span>
            <span>{fmt(m.winRate)}% victorias</span>
            <span>K/D {fmt(m.kd, 2)}</span>
            <span>ADR {fmt(m.adr)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
