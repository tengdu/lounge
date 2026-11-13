"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { CREDENTIALS, type Credential } from "@/data/lounges";

/**
 * The traveller's credentials, kept in localStorage.
 *
 * The site is a static export with nowhere to store a profile, and a list of
 * someone's credit cards is not something to ship to a server anyway. It never
 * leaves the browser.
 */
const KEY = "lounge.wallet.v1";

const VALID = new Set<string>(CREDENTIALS.map((c) => c.id));

/** Stable empty reference — useSyncExternalStore compares snapshots by identity. */
const EMPTY: readonly Credential[] = Object.freeze([]);

const listeners = new Set<() => void>();

let lastRaw: string | null = null;
let lastValue: readonly Credential[] = EMPTY;

function parse(raw: string | null): readonly Credential[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    // Drop anything unrecognised, so a stale key from an older catalog cannot
    // resurrect a credential that no longer exists.
    const kept = parsed.filter((id): id is Credential => typeof id === "string" && VALID.has(id));
    return kept.length > 0 ? kept : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): readonly Credential[] {
  const raw = window.localStorage.getItem(KEY);
  // Re-parsing on every read would hand React a new array each time and spin
  // forever, so only rebuild when the stored string actually changed.
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastValue = parse(raw);
  }
  return lastValue;
}

function getServerSnapshot(): readonly Credential[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Keep two tabs of the site in agreement.
  window.addEventListener("storage", emit);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", emit);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

function write(next: readonly Credential[]) {
  if (next.length === 0) window.localStorage.removeItem(KEY);
  else window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export interface Wallet {
  credentials: ReadonlySet<Credential>;
  /** False until the browser has hydrated — render neutral until then. */
  ready: boolean;
  has: (id: Credential) => boolean;
  toggle: (id: Credential) => void;
  clear: () => void;
}

export function useWallet(): Wallet {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // The server renders an empty wallet, so the first client paint must match.
  // `ready` lets callers hold back personalised UI until after hydration
  // instead of flashing the wrong answer.
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const credentials = useMemo(() => new Set(stored), [stored]);

  const has = useCallback((id: Credential) => credentials.has(id), [credentials]);

  const toggle = useCallback(
    (id: Credential) => {
      const next = new Set(getSnapshot());
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Persist in catalog order so the stored value is stable regardless of
      // the order the traveller ticked things.
      write(CREDENTIALS.filter((c) => next.has(c.id)).map((c) => c.id));
    },
    []
  );

  const clear = useCallback(() => write(EMPTY), []);

  return { credentials, ready, has, toggle, clear };
}
