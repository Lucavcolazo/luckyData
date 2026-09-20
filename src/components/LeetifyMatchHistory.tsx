import type { LeetifyMatch } from "@/lib/leetify";
import { MapIcon } from "@/components/MapIcon";

const MAX_MATCHES = 10;

function mapDisplayName(mapName: string) {
  return mapName.replace(/^de_|^cs_/, "");
}

export function LeetifyMatchHistory({
  matches,
  steamid64,
}: {
  matches: LeetifyMatch[];
  steamid64: string;
}) {
  const rows = matches.slice(0, MAX_MATCHES).map((match) => {
    const me = match.stats.find((s) => s.steam64_id === steamid64);
    if (!me) return null;

    const myTeam = match.team_scores.find((t) => t.team_number === me.initial_team_number);
    const otherTeam = match.team_scores.find((t) => t.team_number !== me.initial_team_number);
    const adr =
      me.total_damage !== null && me.rounds_count
        ? me.total_damage / me.rounds_count
        : null;

    return { match, me, myTeam, otherTeam, adr };
  });

  const visibleRows = rows.filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Últimas partidas
        </h2>
        <a
          href={`https://leetify.com/public/profile/${steamid64}/matches`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-[#F84982] underline"
        >
          View on Leetify
        </a>
      </div>

      {visibleRows.length === 0 ? (
        <p className="text-sm text-muted">Sin partidas recientes públicas en Leetify.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Mapa</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Fuente</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Leetify Rating</th>
                <th className="px-4 py-3 font-medium">K/D</th>
                <th className="px-4 py-3 font-medium">ADR</th>
                <th className="px-4 py-3 font-medium">HS Kills</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ match, me, myTeam, otherTeam, adr }) => {
                const won = myTeam && otherTeam ? myTeam.score > otherTeam.score : null;
                const resultColor = won === null ? undefined : won ? "var(--good)" : "var(--bad)";
                const ratingColor =
                  me.leetify_rating === null
                    ? undefined
                    : me.leetify_rating >= 0
                      ? "var(--good)"
                      : "var(--bad)";

                return (
                  <tr key={match.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 capitalize">
                        <MapIcon mapName={match.map_name} />
                        {mapDisplayName(match.map_name)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(match.finished_at).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-muted capitalize">{match.data_source}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: resultColor }}>
                      {myTeam?.score ?? "—"}:{otherTeam?.score ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: ratingColor }}>
                      {me.leetify_rating?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {me.total_kills ?? "—"}/{me.total_deaths ?? "—"} (
                      {me.kd_ratio?.toFixed(2) ?? "—"})
                    </td>
                    <td className="px-4 py-3">{adr !== null ? adr.toFixed(0) : "—"}</td>
                    <td className="px-4 py-3">{me.total_hs_kills ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
