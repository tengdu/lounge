"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cameFromList, listHref, listLabel, useListState } from "@/lib/list-state";

/**
 * The way back from a lounge to the list it was opened from.
 *
 * It used to be a fixed link to `/`, which dropped whatever had been searched
 * for. Now it carries the last search with it — and when the list is the page
 * directly behind this one, it simply goes back, so the traveller lands on the
 * same card they left rather than at the top of the page.
 */
export default function BackToList() {
  const state = useListState();

  return (
    <Link
      href={listHref(state)}
      // Only fires for an ordinary in-app click; opening in a new tab still
      // follows the href.
      onNavigate={(event) => {
        if (cameFromList()) {
          event.preventDefault();
          window.history.back();
        }
      }}
      className="group inline-flex min-w-0 items-center gap-1.5 text-[14px] font-medium text-ink-secondary transition-colors hover:text-ink"
    >
      <ArrowLeft
        size={15}
        className="shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5"
      />
      <span className="truncate">{listLabel(state)}</span>
    </Link>
  );
}
