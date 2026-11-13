"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { LoungeMapProps } from "./LoungeMap";

// MapLibre is a few hundred kilobytes and needs WebGL, so it stays out of the
// page bundle and never runs during the static export.
const LoungeMap = dynamic(() => import("./LoungeMap"), {
  ssr: false,
  loading: () => <Placeholder />,
});

function Placeholder() {
  return <div className="h-full min-h-[340px] w-full animate-pulse bg-surface-sunken" aria-label="Loading map" />;
}

/**
 * Mounts the map only once it is about to scroll into view. On the lounge page
 * the map sits below the fold, and most visits never reach it — those should
 * not download the library or request a single tile.
 */
export default function LoungeMapLazy(props: LoungeMapProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(holder);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={holderRef} className={props.variant === "full" ? "h-full w-full" : undefined}>
      {visible ? (
        <LoungeMap {...props} />
      ) : (
        <div className={props.variant === "full" ? "h-full" : "overflow-hidden rounded-[14px] ring-1 ring-hairline"}>
          <Placeholder />
        </div>
      )}
    </div>
  );
}
