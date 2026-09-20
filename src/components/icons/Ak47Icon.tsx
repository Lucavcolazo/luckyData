/** Silueta propia y genérica, no un asset del juego. */
export function Ak47Icon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 16.5h5.5l2-3h4.5l1.5-2h6l1-2.5h6.5l1.5-2h9.5l3 3.5-2 1.5-2-1h-3l-1.5 4h-3l1-3.5h-4l-2 5h-3.5l1.5-5h-3l-3 4.5h-4l1.5-3h-3l-2.5 3.5H10l-1.5 2H3z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M6 16.5v4.5l3-1.5v-3" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}
