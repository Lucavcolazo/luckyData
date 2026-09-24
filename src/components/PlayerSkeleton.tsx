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

function TileBone() {
  return (
    <div className="flex flex-col gap-2.5 border-r border-b border-line p-4">
      <Bone className="h-3.5 w-24" />
      <Bone className="h-9 w-20" />
      <Bone className="h-1.5 w-full" />
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="flex flex-col" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando perfil…</span>

      <div className="flex flex-col gap-6 border border-line p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <Bone className="size-16 shrink-0 sm:size-[88px]" />
          <div className="flex flex-col gap-3">
            <Bone className="h-10 w-56 sm:w-72" />
            <Bone className="h-3.5 w-64" />
            <Bone className="h-6 w-80 max-w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Bone className="h-16 w-28" />
          <Bone className="h-16 w-36" />
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 border border-line sm:w-[28rem]">
        <Bone className="m-1 h-10" />
        <Bone className="m-1 h-10 opacity-50" />
      </div>

      <section className="mt-8">
        <SectionBone />
        <div className="grid grid-cols-2 border-t border-l border-line lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <TileBone key={i} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <SectionBone />
        <Bone className="h-56 w-full" />
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
