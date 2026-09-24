"use client";

import Image from "next/image";
import { useEffect, useRef, type RefObject } from "react";

const MAX_BLUR = 16;

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Fixed full-screen background. Scrolling from the top of the page down to
 * `targetRef` blurs and darkens the image: sharp at the top, fully blurred
 * once the target reaches the top of the viewport.
 */
export function HeroBackdrop({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) {
  const imageRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    function apply() {
      raf = 0;
      const el = targetRef.current;
      const distance = el ? el.getBoundingClientRect().top + window.scrollY - 24 : 0;
      const p = distance > 0 ? clamp(window.scrollY / distance) : 0;
      if (imageRef.current) imageRef.current.style.filter = `blur(${p * MAX_BLUR}px)`;
      if (shadeRef.current) shadeRef.current.style.opacity = String(0.45 + p * 0.3);
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(apply);
    }

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetRef]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background" aria-hidden>
      {/* Slightly oversized so the blur doesn't pull in soft edges. */}
      <div ref={imageRef} className="absolute -inset-8 will-change-[filter]">
        <Image src="/hero/dust2.jpg" alt="" fill preload sizes="100vw" className="object-cover" />
      </div>
      {/* Darkening filter; heavier as the stats come in over the image. */}
      <div ref={shadeRef} className="absolute inset-0 bg-black opacity-45" />
    </div>
  );
}
