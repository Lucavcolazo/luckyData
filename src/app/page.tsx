"use client";

import { useEffect, useRef, useState } from "react";
import { ProfileSearchForm } from "@/components/ProfileSearchForm";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { PlayerSkeleton } from "@/components/PlayerSkeleton";
import { PlayerResults } from "@/components/PlayerResults";
import { ComparisonSkeleton, ComparisonView } from "@/components/ComparisonView";
import type { PlayerData } from "@/lib/playerData";

type SearchStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [data, setData] = useState<PlayerData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [vsQuery, setVsQuery] = useState<string | null>(null);
  const [rival, setRival] = useState<PlayerData | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // A shared link (?q=...) runs the search straight away.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) handleSearch(q, params.get("vs") ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function newSearch() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.getElementById("profile-search")?.focus({ preventScroll: true });
  }

  function scrollToResults(attempt = 0) {
    const el = resultsRef.current;
    // The results section mounts on the render after the search starts; wait a few frames for it.
    if (!el) {
      if (attempt < 10) requestAnimationFrame(() => scrollToResults(attempt + 1));
      return;
    }
    const to = el.getBoundingClientRect().top + window.scrollY - 24;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, to);
      return;
    }
    // Slower than native smooth scroll so the backdrop blur eases in on the way down.
    const from = window.scrollY;
    const duration = 1400;
    const start = performance.now();
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  async function fetchPlayer(q: string): Promise<{ ok: true; data: PlayerData } | { ok: false; error: string }> {
    try {
      const res = await fetch(`/api/player?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) return { ok: false, error: json?.error ?? "Algo salió mal. Probá de nuevo." };
      return { ok: true, data: json as PlayerData };
    } catch {
      return { ok: false, error: "No pudimos conectar con el servidor. Probá de nuevo en un momento." };
    }
  }

  async function handleSearch(query: string, vs?: string) {
    setQuery(query);
    setVsQuery(vs ?? null);
    const url = new URL(window.location.href);
    url.searchParams.set("q", query);
    if (vs) url.searchParams.set("vs", vs);
    else url.searchParams.delete("vs");
    window.history.replaceState(null, "", url);
    setStatus("loading");
    setErrorMessage(null);
    // Scrolling down to the results is what blurs the backdrop.
    requestAnimationFrame(() => scrollToResults());

    const [first, second] = await Promise.all([fetchPlayer(query), vs ? fetchPlayer(vs) : Promise.resolve(null)]);

    if (!first.ok || (second && !second.ok)) {
      const parts: string[] = [];
      if (!first.ok) parts.push(vs ? `Primer perfil: ${first.error}` : first.error);
      if (second && !second.ok) parts.push(`Segundo perfil: ${second.error}`);
      setErrorMessage(parts.join(" "));
      setStatus("error");
      return;
    }

    setData(first.data);
    setRival(second?.ok ? second.data : null);
    setStatus("success");
  }

  function openProfile(player: PlayerData) {
    handleSearch(player.summary.profileurl);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-6 font-label text-sm tracking-[0.14em] uppercase sm:px-10">
        <span className="flex items-center gap-2.5 font-bold text-foreground">
          <span className="size-2 bg-paint" aria-hidden />
          LuckyData
        </span>
        <span className="font-semibold text-sand/70">by Lucky7</span>
      </header>

      <HeroBackdrop targetRef={resultsRef} />

      <section className="relative flex min-h-svh flex-col items-center justify-center px-6 pt-28 pb-20 sm:px-10">
        {/* Pools shade behind the copy so it reads over the bright window. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_52%,rgba(0,0,0,0.5),transparent)]"
          aria-hidden
        />

        <div className="relative flex w-full max-w-2xl flex-col items-center text-center">
          <h1 className="animate-focus-in font-display text-[clamp(4.75rem,19vw,12.5rem)] leading-[0.8] font-black tracking-[-0.01em] uppercase [text-shadow:0_6px_40px_rgba(0,0,0,0.45)]">
            Lucky<span className="text-paint">Data</span>
          </h1>

          <ProfileSearchForm
            onSearch={handleSearch}
            pending={status === "loading"}
            initialValue={query}
            initialVs={vsQuery}
          />
        </div>
      </section>

      {status !== "idle" && (
        <section ref={resultsRef} className="min-h-svh px-4 py-10 sm:px-10 lg:px-16">
          {/* Solid panel on purpose: a backdrop-filter on a box this tall renders black on mobile GPUs. */}
          <div className="mx-auto w-full max-w-[1400px] bg-panel/[0.94] px-5 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:px-10 sm:py-12">
            <div className="mb-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={newSearch}
                className="flex shrink-0 items-center gap-2 font-label text-sm font-bold tracking-[0.12em] whitespace-nowrap text-ink-muted uppercase transition-colors hover:text-sand"
              >
                <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" strokeLinecap="square" />
                </svg>
                Nueva búsqueda
              </button>
              {query && (
                <span className="truncate text-xs text-ink-muted">
                  {query}
                  {vsQuery && ` vs ${vsQuery}`}
                </span>
              )}
            </div>

            {status === "loading" && (vsQuery ? <ComparisonSkeleton /> : <PlayerSkeleton />)}
            {status === "success" && data && rival && vsQuery && (
              <ComparisonView a={data} b={rival} onOpenProfile={openProfile} />
            )}
            {status === "success" && data && !vsQuery && <PlayerResults data={data} />}
            {status === "error" && errorMessage && (
              <div className="animate-fade-up flex flex-col items-center gap-5 py-16 text-center" role="alert">
                <p className="font-display text-4xl font-extrabold text-sand uppercase">{vsQuery ? "No pudimos cargar la comparación" : "No pudimos cargar el perfil"}</p>
                <p className="max-w-md text-sm text-ink-muted">{errorMessage}</p>
                <div className="flex gap-3">
                  {query && (
                    <button
                      type="button"
                      onClick={() => handleSearch(query, vsQuery ?? undefined)}
                      className="h-10 bg-paint px-5 font-label text-sm font-bold tracking-[0.14em] text-white uppercase transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.97]"
                    >
                      Reintentar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={newSearch}
                    className="h-10 border border-line px-5 font-label text-sm font-bold tracking-[0.14em] text-sand uppercase transition-[background-color,color,transform] duration-150 hover:bg-sand hover:text-panel active:scale-[0.97]"
                  >
                    Buscar otro
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
