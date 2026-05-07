"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import exercisesData from "@/data/exercises.json";
import type { ExerciseDefinition } from "./workoutTypes";

type ExerciseLibraryProps = {
  onAdd: (exercise: ExerciseDefinition) => void;
  onClose?: () => void;
  addedExerciseIds?: string[];
};

const exercises = exercisesData as ExerciseDefinition[];

const CATEGORIES = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  Chest: "🫁",
  Back: "🔙",
  Shoulders: "🏋️",
  Arms: "💪",
  Legs: "🦵",
  Core: "⚡",
  Cardio: "🏃",
};

export default function ExerciseLibrary({
  onAdd,
  onClose,
  addedExerciseIds = [],
}: ExerciseLibraryProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => {
      const matchSearch = !q || ex.name.toLowerCase().includes(q);
      const matchCat = activeCategory === "All" || ex.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const map: Partial<Record<string, ExerciseDefinition[]>> = {};
    for (const ex of filtered) {
      if (!map[ex.category]) map[ex.category] = [];
      map[ex.category]!.push(ex);
    }
    return map;
  }, [filtered]);

  const visibleCategories = CATEGORIES.filter((c) => (grouped[c]?.length ?? 0) > 0);

  return (
    <div className="flex flex-col h-full bg-[#131314]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h2 className="text-lg font-bold text-white">Add Exercise</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#252528] flex items-center justify-center hover:bg-[#2a2a2b] transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-[#1c1b1c] rounded-xl px-3 py-2.5 border border-white/5">
          <Search className="w-4 h-4 text-neutral-500 shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            type="search"
            value={search}
          />
          {search && (
            <button onClick={() => setSearch("")} className="shrink-0">
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {(["All", ...CATEGORIES] as string[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            style={activeCategory === cat
              ? { backgroundColor: "#d9ee4f", color: "#1a2000" }
              : { backgroundColor: "#252528", color: "#737373" }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto">
        {visibleCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <Search className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm">No exercises found</p>
          </div>
        ) : (
          visibleCategories.map((category) => (
            <div key={category}>
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1c1b1c] sticky top-0 z-10 border-b border-white/5">
                <span className="text-base leading-none">{CATEGORY_EMOJI[category]}</span>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  {category}
                </span>
                <span className="text-[11px] text-neutral-600">
                  ({grouped[category]!.length})
                </span>
              </div>

              {/* Exercises */}
              {grouped[category]!.map((exercise) => {
                const isAdded = addedExerciseIds.includes(exercise.id);
                return (
                  <button
                    key={exercise.id}
                    onClick={() => !isAdded && onAdd(exercise)}
                    disabled={isAdded}
                    className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-white/5 text-left transition-colors ${
                      isAdded ? "opacity-40" : "hover:bg-[#1c1b1c]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-sm">{exercise.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 capitalize">
                        {exercise.primaryMuscles.join(", ")} · {exercise.equipment}
                      </p>
                    </div>
                    <div
                      className="ml-3 shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                      style={isAdded
                        ? { backgroundColor: "rgba(217,238,79,0.15)", color: "#d9ee4f" }
                        : { backgroundColor: "#d9ee4f", color: "#1a2000" }}
                    >
                      {isAdded ? "✓" : "+"}
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
