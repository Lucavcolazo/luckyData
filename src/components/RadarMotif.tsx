export function RadarMotif() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[18%] opacity-[0.35]"
      style={{
        width: 560,
        height: 560,
        maskImage: "radial-gradient(circle, black 45%, transparent 75%)",
      }}
    >
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground/40" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground/30" />
        <circle cx="100" cy="100" r="34" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground/20" />
        <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.4" className="text-foreground/15" />
        <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="0.4" className="text-foreground/15" />

        <g className="origin-center animate-radar-sweep">
          <path
            d="M100,100 L100,10 A90,90 0 0,1 163.6,36.4 Z"
            fill="currentColor"
            className="text-foreground/10"
          />
          <line x1="100" y1="100" x2="100" y2="10" stroke="currentColor" strokeWidth="0.8" className="text-foreground/50" />
        </g>

        <circle cx="132" cy="58" r="2" fill="currentColor" className="text-foreground/70 animate-radar-blip" />
        <circle cx="66" cy="128" r="1.6" fill="currentColor" className="text-foreground/50 animate-radar-blip" style={{ animationDelay: "1.1s" }} />
        <circle cx="140" cy="132" r="1.6" fill="currentColor" className="text-foreground/50 animate-radar-blip" style={{ animationDelay: "2.3s" }} />
      </svg>
    </div>
  );
}
