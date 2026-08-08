"use client";

import { useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import LoungeList from "@/components/LoungeList";
import { lounges, type Lounge } from "@/data/lounges";

/**
 * Airport filters match the code exactly; brand filters match the name.
 * Without that split, "SEA" also matches JFK's *Chel*sea* Lounge.
 */
const FILTERS: { label: string; kind: "all" | "airport" | "brand" }[] = [
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

const AIRPORT_COUNT = new Set(lounges.map((l) => l.airportCode)).size;

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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filteredLounges = useMemo(() => {
    let result = lounges;

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
  }, [searchTerm, activeFilter]);

  const handleFilter = (filter: string) => {
    setActiveFilter((current) => (current === filter ? "All" : filter));
    setSearchTerm("");
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
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
        </section>

        <nav aria-label="Quick filters" className="no-scrollbar -mx-5 overflow-x-auto px-5 pb-2">
          <div className="flex w-max gap-2 pb-1">
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

        <div className="mt-10 mb-6 flex items-baseline justify-between">
          <h2 className="text-title text-[24px] text-ink">
            {activeFilter === "All" ? "All lounges" : `${activeFilter} lounges`}
          </h2>
          <span className="text-[13px] tabular-nums text-ink-tertiary">
            {filteredLounges.length}{" "}
            {filteredLounges.length === 1 ? "result" : "results"}
          </span>
        </div>

        <LoungeList lounges={filteredLounges} />
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
