"use client";

import { useEffect, useState } from "react";

/**
 * A translucent scrim pinned to the foot of the viewport. It softens the lower
 * edge of the page while there is more to scroll, then fades fully out as the
 * visitor reaches the end - there is nothing below the footer to hint at, so
 * the strip gets out of the way.
 */
export function BottomFade() {
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    // Distance from the absolute bottom (px) at which the strip is fully gone.
    const FADE_ZONE = 220;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const doc = document.documentElement;
      const remaining = doc.scrollHeight - (window.scrollY + window.innerHeight);
      setAtEnd(remaining <= FADE_ZONE);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      data-at-end={atEnd || undefined}
      className="bottom-fade pointer-events-none fixed inset-x-0 bottom-0 z-30 h-24 transition-opacity duration-500 ease-out md:h-28"
    />
  );
}
