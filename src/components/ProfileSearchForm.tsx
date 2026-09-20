"use client";

import { useState } from "react";

export function ProfileSearchForm({
  onSearch,
  pending,
}: {
  onSearch: (value: string) => void;
  pending: boolean;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Pegá un perfil de Steam para buscar.");
      return;
    }
    setError(null);
    onSearch(trimmed);
  }

  return (
    <div className="animate-fade-up mt-10" style={{ animationDelay: "80ms" }}>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border border-border bg-surface px-4 py-3 transition-colors focus-within:border-foreground/40"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="steamcommunity.com/id/tu-perfil"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          aria-label="URL o SteamID de perfil"
        />
        <button
          type="submit"
          disabled={pending}
          className="border border-border px-4 py-1.5 text-xs font-medium tracking-tight transition-[background-color,color,transform] duration-150 hover:bg-foreground hover:text-background active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Buscando…" : "Buscar"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-muted">{error}</p>}
    </div>
  );
}
