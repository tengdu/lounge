"use client";

import { Search, X } from "lucide-react";
import { MAX_QUERY_LENGTH } from "@/lib/list-state";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <Search
        size={17}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-tertiary"
      />
      <input
        type="search"
        value={searchTerm}
        maxLength={MAX_QUERY_LENGTH}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search lounges by airport, city, or name"
        placeholder="Search airport, city, or lounge"
        className="h-12 w-full rounded-full bg-surface pr-11 pl-11 text-[16px] text-ink ring-1 ring-hairline transition-shadow duration-200 outline-none placeholder:text-ink-tertiary focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => onSearchChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
