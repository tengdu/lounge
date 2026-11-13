"use client";

import { useSyncExternalStore } from "react";
import { BASE_PATH } from "@/lib/images";

/**
 * What the home page is currently listing — the search box, the quick filter
 * and the two toggles — kept in the address bar as `/?q=dfw`.
 *
 * It used to be component state, which is thrown away the moment a lounge is
 * opened: coming back always showed every lounge again. In the URL it belongs
 * to the history entry instead, so the back button returns to the same
 * results, a reload keeps them, and a search can be shared as a link.
 *
 * Read through `useSyncExternalStore` rather than `useSearchParams`: the home
 * page is prerendered, and `useSearchParams` would push the whole lounge list
 * out of the static HTML and into client-only rendering.
 */
export interface ListState {
  /** The search box, exactly as typed. */
  q: string;
  /** Label of the active quick filter, or "All". */
  filter: string;
  /** "I can enter" — only lounges the traveller's wallet opens. */
  mine: boolean;
  /** "Map" — only lounges that can be shown on the map. */
  plans: boolean;
}

/**
 * Airport filters match the code exactly; brand filters match the name.
 * Without that split, "SEA" also matches JFK's *Chel*sea* Lounge.
 */
export const FILTERS: { label: string; kind: "all" | "airport" | "brand" }[] = [
  { label: "All", kind: "all" },
  { label: "JFK", kind: "airport" },
  { label: "LAX", kind: "airport" },
  { label: "SFO", kind: "airport" },
  { label: "ORD", kind: "airport" },
  { label: "DFW", kind: "airport" },
  { label: "ATL", kind: "airport" },
  { label: "SEA", kind: "airport" },
  { label: "Delta", kind: "brand" },
  { label: "United", kind: "brand" },
  { label: "Admirals", kind: "brand" },
  { label: "Centurion", kind: "brand" },
  { label: "Alaska", kind: "brand" },
];

/** Long enough for any airport or lounge name; short enough to keep URLs sane. */
export const MAX_QUERY_LENGTH = 80;

const DEFAULT: ListState = Object.freeze({ q: "", filter: "All", mine: false, plans: false });

/** Survives a reload of a lounge page, so its back link still knows the search. */
const STORAGE_KEY = "lounge.list.v1";

// ------------------------------------------------------------- URL encoding

function parse(search: string): ListState {
  const params = new URLSearchParams(search);
  const wanted = params.get("filter")?.toLowerCase();
  return {
    q: (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
    // Only a filter that exists: a hand-edited `?filter=xyz` must not put
    // "xyz lounges" in a heading above the full list.
    filter: FILTERS.find((f) => f.label.toLowerCase() === wanted)?.label ?? "All",
    mine: params.get("mine") === "1",
    plans: params.get("plan") === "1",
  };
}

/** The query string for `state`, keeping any parameters in `existing` that are not ours. */
function toSearch(state: ListState, existing = ""): string {
  const params = new URLSearchParams(existing);
  const put = (key: string, value: string | null) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };
  put("q", state.q);
  put("filter", state.filter === "All" ? null : state.filter);
  put("mine", state.mine ? "1" : null);
  put("plan", state.plans ? "1" : null);
  const query = params.toString();
  return query ? `?${query}` : "";
}

const same = (a: ListState, b: ListState) =>
  a.q === b.q && a.filter === b.filter && a.mine === b.mine && a.plans === b.plans;

/** Whether `state` narrows the list at all — a search of only spaces does not. */
const isFiltered = (state: ListState) =>
  state.q.trim() !== "" || state.filter !== "All" || state.mine || state.plans;

// --------------------------------------------------------------------- store

let current: ListState = DEFAULT;
/** The address-bar query `current` was last reconciled with. */
let seenSearch: string | null = null;
let restored = false;
let retry: number | undefined;
const listeners = new Set<() => void>();

function isListPath(pathname: string): boolean {
  return pathname.replace(/(?:\/index\.html)?\/*$/, "") === BASE_PATH;
}

function remember() {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, toSearch(current));
  } catch {
    // Storage can be blocked outright; the back link then just says "All lounges".
  }
}

/**
 * Bring `current` in line with the address bar.
 *
 * Only while the address bar is the list's own. During a client-side
 * navigation Next renders the new page before it changes the URL, so for a
 * moment the list is rendering under a lounge's address — and off the list
 * page altogether, `current` is simply the last list anyone looked at, which
 * is what a "back to results" link wants.
 *
 * And only when the query has changed since we last looked. Our own writes
 * can be refused (see `writeUrl`), and then memory is ahead of the URL;
 * adopting the stale URL would un-type what was just typed.
 */
function reconcile() {
  if (!restored) {
    restored = true;
    try {
      current = parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      // blocked storage: start from the default
    }
  }
  if (!isListPath(window.location.pathname)) return;

  const search = window.location.search;
  if (search === seenSearch) return;
  seenSearch = search;

  const next = parse(search);
  if (!same(next, current)) {
    current = next;
    remember();
  }
}

function writeUrl() {
  window.clearTimeout(retry);
  // A late retry must never stamp the list's query onto another page's entry.
  if (!isListPath(window.location.pathname)) return;

  const target = toSearch(current, window.location.search);
  if (target !== window.location.search) {
    try {
      // replaceState, not pushState: refining a search is not a place to go
      // "back" to, so Back always leaves the list in one step.
      window.history.replaceState(null, "", window.location.pathname + target + window.location.hash);
    } catch {
      // Safari throws once a page exceeds 100 history updates in 10 seconds.
    }
  }

  // Chrome drops excess updates silently instead, so trust only what landed.
  seenSearch = window.location.search;
  if (seenSearch !== target) retry = window.setTimeout(writeUrl, 1000);
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Back/forward between two list entries changes the URL under a mounted page.
  if (listeners.size === 1) window.addEventListener("popstate", emit);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("popstate", emit);
  };
}

function getSnapshot(): ListState {
  reconcile();
  return current;
}

/** The static HTML is the unfiltered list; hydration has to start from the same. */
function getServerSnapshot(): ListState {
  return DEFAULT;
}

// ----------------------------------------------------------------------- API

export function useListState(): ListState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateListState(patch: Partial<ListState>) {
  reconcile();
  const next = { ...current, ...patch };
  if (same(next, current)) return;
  current = next;
  remember();
  writeUrl();
  emit();
}

/** Identifies a result set, e.g. to remember how far down it someone had scrolled. */
export function listKey(state: ListState): string {
  return toSearch(state);
}

/**
 * Where "back to the list" should lead. With a search or filter active it
 * lands on the results rather than the hero above them, which on most screens
 * fills the first view.
 */
export function listHref(state: ListState): string {
  return isFiltered(state) ? `/${toSearch(state)}#results` : "/";
}

export function listLabel(state: ListState): string {
  const q = state.q.trim();
  if (q) return `Results for “${q}”`;
  if (state.filter !== "All") return `${state.filter} lounges`;
  if (state.mine || state.plans) return "Back to results";
  return "All lounges";
}

/**
 * True when the previous entry in this tab's history is the list — in which
 * case stepping back is better than a fresh visit: the browser restores the
 * scroll position along with the results.
 *
 * Needs the Navigation API to see the neighbouring entry. Where it is missing
 * this is false, and callers fall back to an ordinary link.
 */
export function cameFromList(): boolean {
  const navigation = (
    window as unknown as {
      navigation?: { currentEntry?: { index: number } | null; entries?: () => { url: string | null }[] };
    }
  ).navigation;
  const index = navigation?.currentEntry?.index;
  if (!navigation?.entries || index === undefined || index < 1) return false;

  const url = navigation.entries()[index - 1]?.url;
  if (!url) return false;
  try {
    return isListPath(new URL(url).pathname);
  } catch {
    return false;
  }
}
