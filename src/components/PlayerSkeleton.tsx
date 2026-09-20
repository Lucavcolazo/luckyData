function Bone({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function PlayerSkeleton() {
  return (
    <div className="flex flex-col" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando perfil…</span>

      <div className="border border-border bg-surface p-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <Bone className="h-[88px] w-[88px]" />
            <div className="flex flex-col gap-2">
              <Bone className="h-3 w-28" />
              <Bone className="h-7 w-44" />
              <Bone className="h-3 w-36" />
            </div>
          </div>
          <Bone className="h-16 w-40" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Bone className="h-3 w-32" />
            <div className="flex flex-wrap gap-2">
              <Bone className="h-6 w-24" />
              <Bone className="h-6 w-24" />
              <Bone className="h-6 w-28" />
            </div>
            <Bone className="h-3 w-48" />
          </div>
          <div className="flex flex-col gap-3 sm:border-l sm:border-border sm:pl-6">
            <Bone className="h-3 w-24" />
            <Bone className="h-8 w-32" />
          </div>
        </div>
      </div>

      <section className="mt-4">
        <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-3 bg-background p-5">
              <Bone className="h-3 w-20" />
              <Bone className="h-7 w-24" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <Bone className="mb-3 h-3 w-40" />
        <div className="border border-border bg-surface p-6">
          <Bone className="h-48 w-full" />
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Bone className="h-3 w-16" />
                <Bone className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <Bone className="mb-3 h-3 w-32" />
        <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 bg-background p-5">
              <Bone className="h-3 w-20" />
              <Bone className="h-6 w-16" />
              <Bone className="h-8 w-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <Bone className="mb-3 h-3 w-28" />
        <div className="border border-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <Bone className="h-4 w-20" />
              <Bone className="h-4 w-16" />
              <Bone className="h-4 w-12" />
              <Bone className="ml-auto h-4 w-12" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
