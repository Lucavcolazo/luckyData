"use client";

import { useRef, useState } from "react";
import { ProfileSearchForm } from "@/components/ProfileSearchForm";
import { RadarMotif } from "@/components/RadarMotif";
import { Ak47Icon } from "@/components/icons/Ak47Icon";
import { PlayerSkeleton } from "@/components/PlayerSkeleton";
import { PlayerResults } from "@/components/PlayerResults";
import type { PlayerData } from "@/lib/playerData";

type SearchStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [data, setData] = useState<PlayerData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  function scrollToResults() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  async function handleSearch(query: string) {
    setStatus("loading");
    setErrorMessage(null);
    requestAnimationFrame(scrollToResults);

    try {
      const res = await fetch(`/api/player?q=${encodeURIComponent(query)}`);
      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json?.error ?? "Algo salió mal. Probá de nuevo.");
        setStatus("error");
        return;
      }

      setData(json as PlayerData);
      setStatus("success");
    } catch {
      setErrorMessage("No pudimos conectar con el servidor. Probá de nuevo en un momento.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <Ak47Icon className="h-4 w-14 text-muted" />
          <span className="text-sm font-medium tracking-tight">LuckyData</span>
        </div>
        <span className="text-xs text-muted">by Lucky7</span>
      </header>

      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-24 sm:px-10">
        <RadarMotif />

        <div className="relative w-full max-w-xl">
          <div className="animate-fade-up text-center">
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Tus stats de CS2.
              <br />
              Sin ruido.
            </h1>
          </div>

          <ProfileSearchForm onSearch={handleSearch} pending={status === "loading"} />
        </div>
      </section>

      {status !== "idle" && (
        <section ref={resultsRef} className="scroll-mt-6 px-6 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-[1400px]">
            {status === "loading" && <PlayerSkeleton />}
            {status === "success" && data && <PlayerResults data={data} />}
            {status === "error" && errorMessage && (
              <div className="animate-fade-up border border-border bg-surface px-6 py-16 text-center">
                <p className="text-sm text-muted">{errorMessage}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
