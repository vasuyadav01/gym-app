"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { INFLUENCERS, CATEGORIES, type Category } from "@/data/influencers";

const DIFFICULTY_COLOR: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: "rgba(34,197,94,0.12)",  text: "#4ade80" },
  Intermediate: { bg: "rgba(234,179,8,0.12)",  text: "#facc15" },
  Advanced:     { bg: "rgba(239,68,68,0.12)",  text: "#f87171" },
};

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filtered = INFLUENCERS.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.split.toLowerCase().includes(q);
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <main className="min-h-screen bg-[#131314] pb-32">
      <div className="w-full max-w-md mx-auto px-4 pt-12">

        <div className="mb-5">
          <h1 className="text-2xl font-black text-white">Explore Programs</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Real programs from legends of the sport
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#1c1b1c] rounded-2xl px-4 py-3 border border-white/5 mb-4">
          <Search className="w-4 h-4 text-neutral-500 shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
            placeholder="Search athletes or splits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-colors"
              style={activeCategory === cat
                ? { backgroundColor: "#d9ee4f", color: "#1a2000" }
                : { backgroundColor: "#1c1b1c", color: "#737373", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-xs text-neutral-500 font-medium mb-3">
          {filtered.length} program{filtered.length !== 1 ? "s" : ""} found
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🔍</span>
            <p className="font-semibold text-white">No results</p>
            <p className="text-neutral-500 text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((person) => {
              const diff = DIFFICULTY_COLOR[person.difficulty] ?? { bg: "rgba(255,255,255,0.06)", text: "#737373" };
              return (
                <Link
                  key={person.id}
                  href={`/explore/${person.id}`}
                  className="bg-[#1c1b1c] rounded-2xl border border-white/5 overflow-hidden active:scale-[0.97] transition-all hover:border-white/15"
                >
                  <div className="h-1.5 w-full" style={{ background: person.accentColor }} />
                  <div className="p-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                      style={{ background: `${person.accentColor}18` }}
                    >
                      {person.emoji}
                    </div>
                    <h3 className="font-bold text-white text-sm leading-tight mb-1 line-clamp-2">
                      {person.name}
                    </h3>
                    <p className="text-neutral-500 text-[11px] leading-tight mb-3 line-clamp-2">
                      {person.split}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: diff.bg, color: diff.text }}
                      >
                        {person.difficulty}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#252528] text-neutral-500">
                        {person.daysPerWeek}d/wk
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
