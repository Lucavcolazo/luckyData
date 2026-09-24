function Bone({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** Mirrors the real dossier layout so nothing jumps when the data lands. */
function SectionBone() {
  return (
    <div className="mb-5 border-b border-line pb-3">
      <Bone className="h-8 w-48" />
    </div>
  );
}

function TileBone({ featured = false }: { featured?: boolean }) {
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <Bone className="h-3.5 w-24" />
      <Bone className={featured ? "h-16 w-32" : "h-9 w-20"} />
      <Bone className="h-1.5 w-full" />
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="flex flex-col" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando perfil…</span>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-5 sm:gap-6">
          <Bone className="size-20 sm:size-28" />
          <div className="flex flex-col gap-3">
            <Bone className="h-14 w-56 sm:w-72" />
            <Bone className="h-3.5 w-48" />
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-80">
          <Bone className="h-12 w-full" />
          <Bone className="h-1.5 w-full" />
          <Bone className="h-1.5 w-full" />
          <Bone className="h-1.5 w-full" />
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 border-t border-line pt-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <Bone className="h-3.5 w-24" />
            <Bone className="h-8 w-40" />
          </div>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-2 border border-line sm:w-[28rem]">
        <Bone className="m-1 h-10" />
        <Bone className="m-1 h-10 opacity-50" />
      </div>

      <section className="mt-16">
        <SectionBone />
        <Bone className="h-56 w-full" />
      </section>

      <section className="mt-16">
        <SectionBone />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <TileBone key={i} featured />
          ))}
        </div>
        <div className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TileBone key={i} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <SectionBone />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line py-3">
            <Bone className="h-7 w-11" />
            <Bone className="h-4 w-20" />
            <Bone className="ml-auto h-4 w-12" />
          </div>
        ))}
      </section>
    </div>
  );
}
