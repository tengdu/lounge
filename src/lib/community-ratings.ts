"use client";

import { useSyncExternalStore } from "react";
import { fetchAllRatings } from "@/lib/community";
import { communityEnabled } from "@/lib/supabase";

/**
 * Traveller ratings for every lounge, fetched once per visit and shared by all
 * the cards — 330 cards must not mean 330 requests.
 *
 * A card only switches from the editorial estimate to the community score
 * once enough people have rated it: one angry review should not turn a 4.4
 * into a 1.0 at the top of the list.
 */
export const MIN_REVIEWS_FOR_CARD = 3;

export interface CommunityRating {
  average: number;
  count: number;
}

type Ratings = ReadonlyMap<string, CommunityRating>;

const EMPTY: Ratings = new Map();
let ratings: Ratings = EMPTY;
let requested = false;
const listeners = new Set<() => void>();

function load() {
  if (requested || !communityEnabled) return;
  requested = true;
  fetchAllRatings()
    .then((next) => {
      ratings = next;
      for (const listener of listeners) listener();
    })
    // The cards already show the editorial rating; failing quietly is fine.
    .catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
}

/** The community rating for a lounge, or null until there are enough reviews. */
export function useCommunityRating(loungeId: string): CommunityRating | null {
  const all = useSyncExternalStore(
    subscribe,
    () => ratings,
    () => EMPTY
  );
  const rating = all.get(loungeId);
  return rating && rating.count >= MIN_REVIEWS_FOR_CARD ? rating : null;
}
