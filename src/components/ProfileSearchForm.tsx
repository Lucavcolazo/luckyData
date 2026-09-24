"use client";

import { useState } from "react";

const rowClass =
  "flex h-14 items-center gap-2 border border-sand/20 bg-black/60 pr-2 pl-5 backdrop-blur-md transition-colors duration-200 focus-within:border-sand/60";
const inputClass =
  "min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-sand/50";

export function ProfileSearchForm({
  onSearch,
  pending,
  initialValue,
  initialVs,
}: {
  onSearch: (value: string, vs?: string) => void;
  pending: boolean;
  initialValue?: string | null;
  initialVs?: string | null;
}) {
  const [value, setValue] = useState("");
  const [vs, setVs] = useState("");
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the fields in sync when a search starts from a shared link or a retry.
  const [synced, setSynced] = useState<[string | null | undefined, string | null | undefined]>([
    initialValue,
    initialVs,
  ]);
  if (initialValue !== synced[0] || initialVs !== synced[1]) {
    setSynced([initialValue, initialVs]);
    if (initialValue) setValue(initialValue);
    setVs(initialVs ?? "");
    setComparing(Boolean(initialVs));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const a = value.trim();
    const b = vs.trim();
    if (!a) {
      setError("Pegá un perfil de Steam para buscar.");
      return;
    }
    if (comparing && !b) {
      setError("Pegá el segundo perfil para comparar, o quitá la comparación.");
      return;
    }
    setError(null);
    onSearch(a, comparing ? b : undefined);
  }

  return (
    <div className="animate-fade-up mt-10 w-full max-w-xl" style={{ animationDelay: "220ms" }}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className={rowClass}>
          <input
            id="profile-search"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="steamcommunity.com/id/tu-perfil"
            className={inputClass}
            aria-label={comparing ? "Primer perfil (URL o SteamID)" : "URL o SteamID de perfil"}
          />
          <button
            type="submit"
            disabled={pending}
            className="h-10 shrink-0 bg-paint px-5 font-label text-sm font-bold tracking-[0.14em] text-white uppercase transition-[filter,transform] duration-150 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? "Buscando…" : comparing ? "Comparar" : "Buscar"}
          </button>
        </div>

        {comparing && (
          <div className={`${rowClass} animate-fade-up`}>
            <span className="font-display text-xl leading-none font-black text-rival uppercase" aria-hidden>
              VS
            </span>
            <input
              type="text"
              value={vs}
              onChange={(e) => setVs(e.target.value)}
              placeholder="steamcommunity.com/id/otro-perfil"
              className={inputClass}
              aria-label="Segundo perfil (URL o SteamID)"
              autoFocus={!initialVs}
            />
            <button
              type="button"
              onClick={() => {
                setComparing(false);
                setVs("");
                setError(null);
              }}
              className="flex size-10 shrink-0 items-center justify-center text-sand/60 transition-colors hover:text-sand"
              aria-label="Quitar comparación"
            >
              <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" strokeLinecap="square" />
              </svg>
            </button>
          </div>
        )}
      </form>

      <div className="mt-3 flex items-start justify-between gap-4">
        {error ? <p className="text-left text-sm text-sand/80">{error}</p> : <span />}
        {!comparing && (
          <button
            type="button"
            onClick={() => setComparing(true)}
            className="flex shrink-0 items-center gap-2 font-label text-sm font-bold tracking-[0.12em] text-sand/80 uppercase transition-colors hover:text-sand"
          >
            <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path d="M6 1.5v9M1.5 6h9" strokeLinecap="square" />
            </svg>
            Comparar con otro perfil
          </button>
        )}
      </div>
    </div>
  );
}
