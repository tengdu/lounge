"use client";

import { useState, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import LoungeList from "@/components/LoungeList";
import { lounges } from "@/data/lounges";

const QUICK_FILTERS = ["All", "SEA", "JFK", "SFO", "LHR", "Delta", "Centurion", "Alaska"];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredLounges = useMemo(() => {
    let filtered = lounges;

    // Apply quick filter
    if (activeFilter !== "All") {
       const filterLower = activeFilter.toLowerCase();
       filtered = filtered.filter(l => 
         l.airportCode.toLowerCase() === filterLower || 
         l.name.toLowerCase().includes(filterLower)
       );
    }

    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((lounge) => {
        return (
          lounge.name.toLowerCase().includes(term) ||
          lounge.airportCity.toLowerCase().includes(term) ||
          lounge.airportCode.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  }, [searchTerm, activeFilter]);

  const handleFilterClick = (filter: string) => {
    if (activeFilter === filter) {
      setActiveFilter("All");
    } else {
      setActiveFilter(filter);
    }
    setSearchTerm(""); // Clear search term when a quick filter is clicked
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-[family-name:var(--font-geist-sans)] selection:bg-blue-200">
      <header className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white pt-24 pb-32 px-4 overflow-hidden">
        {/* Abstract background shapes for depth */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
          <div className="absolute top-1/2 -left-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-2xl"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-widest text-blue-100 uppercase mb-6 shadow-sm">
            Premium Travel Experience
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            Discover Your <br className="hidden md:block"/> Pre-Flight <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">Oasis</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto font-light leading-relaxed">
            Find and explore the world's most luxurious airport lounges. Search by city, code, or airline to begin your journey in comfort.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 -mt-20 relative z-20">
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        
        {/* Quick Filters */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12 max-w-4xl mx-auto">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterClick(filter)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeFilter === filter
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-600 scale-105"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 shadow-sm"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-8 animate-in fade-in duration-700 delay-150">
          <div className="flex justify-between items-end mb-8 px-2 border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeFilter !== "All" ? `${activeFilter} Lounges` : "Featured Lounges"}
            </h2>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full shadow-sm border border-blue-100">
              {filteredLounges.length} {filteredLounges.length === 1 ? 'Location' : 'Locations'}
            </span>
          </div>
          
          <LoungeList lounges={filteredLounges} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 text-gray-500 text-center py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 rotate-3 hover:rotate-0 transition-transform">
             <span className="text-blue-600 font-black text-2xl">L</span>
          </div>
          <p className="text-sm font-medium text-gray-400">© {new Date().getFullYear()} Lounge Finder. Designed for the modern traveler.</p>
        </div>
      </footer>
    </div>
  );
}