"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LoungeCard from "./LoungeCard";
import { Lounge } from "@/data/lounges";

interface LoungeListProps {
  lounges: Lounge[];
  /** Identifies the search/filter that produced `lounges`. */
  stateKey: string;
}

const PAGE_SIZE = 24;

/**
 * How far the last list was paged, kept outside React so it outlives the
 * component. Coming back from a lounge remounts this list; if it restarted at
 * one page it would be shorter than it was, and the browser could not put the
 * traveller back on the card they left — it would clamp to the new bottom.
 */
let remembered: { key: string; visible: number } | null = null;

export default function LoungeList({ lounges, stateKey }: LoungeListProps) {
  const [visible, setVisible] = useState(() =>
    remembered?.key === stateKey ? remembered.visible : PAGE_SIZE
  );
  const [renderedFor, setRenderedFor] = useState(lounges);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // A new result set is a new list — start from the top again. Adjusting
  // during render (rather than in an effect) avoids painting the stale page
  // count for a frame first.
  if (renderedFor !== lounges) {
    setRenderedFor(lounges);
    setVisible(PAGE_SIZE);
  }

  useEffect(() => {
    remembered = { key: stateKey, visible };
  }, [stateKey, visible]);

  const shown = useMemo(() => lounges.slice(0, visible), [lounges, visible]);
  const hasMore = visible < lounges.length;

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((n) => n + PAGE_SIZE);
        }
      },
      // Start fetching the next page before the user reaches the bottom.
      { rootMargin: "600px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, shown.length]);

  if (lounges.length === 0) {
    return (
      <div className="rounded-[18px] bg-surface px-6 py-24 text-center ring-1 ring-hairline">
        <h3 className="text-title mb-2 text-[22px] text-ink">No lounges found</h3>
        <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-ink-secondary">
          Try a different airport code, city, or lounge name.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((lounge, i) => (
          <LoungeCard key={lounge.id} lounge={lounge} eager={i < 3} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-12" aria-hidden="true">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-tertiary" />
        </div>
      )}
    </>
  );
}
