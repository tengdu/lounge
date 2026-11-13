"use client";

import { useMemo } from "react";
import { Check, Map } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import LoungeList from "@/components/LoungeList";
import WalletSheet from "@/components/WalletSheet";
import { lounges, type Lounge } from "@/data/lounges";
import { hasMap } from "@/lib/positions";
import { verdictFor } from "@/lib/access";
import { FILTERS, listKey, updateListState, useListState } from "@/lib/list-state";
import { useWallet } from "@/lib/wallet";

const AIRPORT_COUNT = new Set(lounges.map((l) => l.airportCode)).size;
const MAP_COUNT = lounges.filter((l) => hasMap(l.id)).length;

/**
 * Lower is better. Without this an airport code like "sea" ranks Chelsea
 * Lounge alongside Seattle, because every field was a plain substring test.
 */
function rank(lounge: Lounge, term: string): number {
  const code = lounge.airportCode.toLowerCase();
  const city = lounge.airportCity.toLowerCase();
  const name = lounge.name.toLowerCase();

  if (code === term) return 0;
  if (city === term) return 1;
  if (city.startsWith(term)) return 2;
  if (name.startsWith(term)) return 3;
  if (city.includes(term)) return 4;
  if (name.includes(term)) return 5;
  if (lounge.location.toLowerCase().includes(term)) return 6;
  return Number.POSITIVE_INFINITY;
}

export default function Home() {
  // Search, filter and toggles live in the URL (`/?q=dfw`), not in component
  // state, so opening a lounge and coming back returns to the same results.
  const list = useListState();
  const { q: searchTerm, filter: activeFilter, mine: onlyMine, plans: onlyPlans } = list;
  const { credentials, ready } = useWallet();

  const hasWallet = ready && credentials.size > 0;

  const enterableCount = useMemo(
    () => (hasWallet ? lounges.filter((l) => verdictFor(l.access, credentials).status === "in").length : 0),
    [credentials, hasWallet]
  );

  const filteredLounges = useMemo(() => {
    let result = lounges;

    // Guarded on `hasWallet` so an emptied wallet cannot leave the list stuck
    // showing nothing with no visible filter to explain it.
    if (onlyMine && hasWallet) {
      result = result.filter((l) => verdictFor(l.access, credentials).status === "in");
    }

    if (onlyPlans) {
      result = result.filter((l) => hasMap(l.id));
    }

    const filter = FILTERS.find((f) => f.label === activeFilter);
    if (filter && filter.kind !== "all") {
      const needle = filter.label.toLowerCase();
      result =
        filter.kind === "airport"
          ? result.filter((l) => l.airportCode.toLowerCase() === needle)
          : result.filter((l) => l.name.toLowerCase().includes(needle));
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result
        .map((lounge) => ({ lounge, score: rank(lounge, term) }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((a, b) => a.score - b.score)
        .map((entry) => entry.lounge);
    }

    return result;
  }, [searchTerm, activeFilter, onlyMine, onlyPlans, hasWallet, credentials]);

  const handleFilter = (filter: string) => {
    updateListState({ filter: activeFilter === filter ? "All" : filter, q: "" });
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/72 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5">
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">Lounge</span>
          <span className="text-[12px] text-ink-tertiary">
            {lounges.length} lounges · {AIRPORT_COUNT} airports
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5">
        <section className="animate-rise pt-20 pb-14 text-center md:pt-28 md:pb-16">
          <h1 className="text-display mx-auto max-w-3xl text-[44px] text-ink sm:text-[60px] md:text-[76px]">
            Every lounge.
            <br />
            Every airport.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-[19px] leading-[1.45] text-ink-secondary">
            A complete guide to airport lounges across the United States — where they are, and
            how to get in.
          </p>

          <div className="mt-10">
            <SearchBar searchTerm={searchTerm} onSearchChange={(q) => updateListState({ q })} />
          </div>

          <div className="mt-5 flex justify-center">
            <WalletSheet compact />
          </div>
          <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-ink-tertiary">
            {hasWallet
              ? `Your cards and status open ${enterableCount} of these ${lounges.length} lounges.`
              : "Tell us what you carry and every lounge will say whether you can walk in."}
          </p>
        </section>

        <nav aria-label="Quick filters" className="no-scrollbar -mx-5 overflow-x-auto px-5 pb-2">
          <div className="flex w-max gap-2 pb-1">
            {hasWallet && (
              <button
                type="button"
                onClick={() => updateListState({ mine: !onlyMine })}
                aria-pressed={onlyMine}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium transition-colors duration-200 ${
                  onlyMine
                    ? "bg-emerald-600 text-white"
                    : "bg-surface text-ink-secondary ring-1 ring-hairline hover:text-ink"
                }`}
              >
                <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                I can enter
                <span className="tabular-nums opacity-70">{enterableCount}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => updateListState({ plans: !onlyPlans })}
              aria-pressed={onlyPlans}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium transition-colors duration-200 ${
                onlyPlans
                  ? "bg-ink text-white"
                  : "bg-surface text-ink-secondary ring-1 ring-hairline hover:text-ink"
              }`}
            >
              <Map size={14} strokeWidth={2} aria-hidden="true" />
              Map
              <span className="tabular-nums opacity-70">{MAP_COUNT}</span>
            </button>
            {FILTERS.map(({ label }) => {
              const active = activeFilter === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleFilter(label)}
                  aria-pressed={active}
                  className={`h-9 shrink-0 rounded-full px-4 text-[14px] font-medium transition-colors duration-200 ${
                    active
                      ? "bg-ink text-white"
                      : "bg-surface text-ink-secondary ring-1 ring-hairline hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* The anchor a lounge page's back link aims at; the margin keeps the
            heading clear of the sticky header. */}
        <div id="results" className="mt-10 mb-6 flex scroll-mt-16 items-baseline justify-between">
          {/* Name the search when there is one. A back link can land here with
              the search box scrolled out of view, and "All lounges" above
              sixteen DFW cards reads as a broken filter. */}
          <h2 className="text-title min-w-0 truncate pr-4 text-[24px] text-ink">
            {searchTerm.trim()
              ? `Results for “${searchTerm.trim()}”`
              : activeFilter === "All"
                ? "All lounges"
                : `${activeFilter} lounges`}
          </h2>
          <span className="shrink-0 text-[13px] tabular-nums text-ink-tertiary">
            {filteredLounges.length}{" "}
            {filteredLounges.length === 1 ? "result" : "results"}
          </span>
        </div>

        <LoungeList lounges={filteredLounges} stateKey={listKey(list)} />
      </main>

      <footer className="mt-24 border-t border-hairline">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <p className="text-[12px] leading-relaxed text-ink-tertiary">
            Lounge locations and access rules change frequently — confirm with your airline or
            lounge operator before you travel.
          </p>
          <p className="mt-3 text-[12px] text-ink-tertiary">
            © {new Date().getFullYear()} Lounge
          </p>
        </div>
      </footer>
    </>
  );
}
