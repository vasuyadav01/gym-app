"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Compass, MoreHorizontal, Check, X, Trophy } from "lucide-react";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { workoutDraftKey } from "./workoutTypes";

type FitnessExercise = {
  exerciseId?: string;
  name?: string;
  category?: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
};

type FitnessWorkout = {
  id: string;
  name: string;
  date?: string;
  duration?: number;
  exercises?: FitnessExercise[];
};

type FitnessDashboardProps = {
  gymName?: string;
  inviteCode?: string;
  userEmail?: string | null;
  workouts: FitnessWorkout[];
  onSignOut: () => void;
};

function derivedCategory(exercises: FitnessExercise[] = []): string {
  const cats = exercises.map((e) => e.category).filter(Boolean) as string[];
  if (!cats.length) return "Routine";
  const freq: Record<string, number> = {};
  cats.forEach((c) => { freq[c] = (freq[c] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function computeStreak(workouts: FitnessWorkout[]): number {
  const days = new Set(workouts.map((w) => w.date?.split("T")[0]).filter(Boolean));
  let s = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (days.has(key)) s++; else break;
  }
  return s;
}

export default function FitnessDashboard({
  gymName,
  userEmail,
  workouts,
}: FitnessDashboardProps) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [localNames, setLocalNames] = useState<Record<string, string>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleWorkouts = workouts.filter((w) => !deletedIds.has(w.id));
  const hasRoutines = visibleWorkouts.length > 0;
  const initials = (userEmail ?? "U").slice(0, 2).toUpperCase();
  const streak = computeStreak(workouts);
  const lastSession = [...workouts]
    .filter((w) => w.date)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0];

  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenu]);

  const startRoutine = (workout: FitnessWorkout) => {
    if (typeof window === "undefined") return;
    const draft = (workout.exercises ?? []).map((ex, i) => ({
      exerciseId: ex.exerciseId ?? ex.name?.toLowerCase().replace(/\s+/g, "-") ?? `ex-${i}`,
      name: ex.name ?? "Exercise",
      category: ex.category ?? "General",
      equipment: ex.equipment ?? "bodyweight",
      primaryMuscles: ex.primaryMuscles ?? [],
      secondaryMuscles: ex.secondaryMuscles ?? [],
      notes: "",
      sets: [{ weight: 0, reps: 0, completed: false, isPR: false }],
    }));
    window.localStorage.setItem(workoutDraftKey, JSON.stringify(draft));
    router.push("/workout/new");
  };

  const handleDelete = async (id: string) => {
    setOpenMenu(null);
    if (!window.confirm("Delete this routine?")) return;
    setDeletedIds((prev) => new Set(prev).add(id));
    try {
      await deleteDoc(doc(db, "workouts", id));
    } catch (e) {
      console.error("Delete failed:", e);
      setDeletedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const startRename = (workout: FitnessWorkout) => {
    setOpenMenu(null);
    setRenamingId(workout.id);
    setRenameValue(localNames[workout.id] ?? workout.name);
  };

  const commitRename = async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    setLocalNames((prev) => ({ ...prev, [id]: trimmed }));
    setRenamingId(null);
    try {
      await updateDoc(doc(db, "workouts", id), { name: trimmed });
    } catch (e) {
      console.error("Rename failed:", e);
      setLocalNames((prev) => { const next = { ...prev }; delete next[id]; return next; });
    }
  };

  return (
    <div className="min-h-screen bg-[#131314] font-sans">

      {/* Header */}
      <header className="bg-[#131314] border-b border-[#1C1C1E] flex justify-between items-center px-5 h-16 sticky top-0 z-[60]">
        <div className="w-8 h-8 flex items-center justify-center">
          <div className="flex flex-col gap-[5px]">
            <span className="w-5 h-0.5 bg-[#EAFF5F] block rounded-full" />
            <span className="w-3.5 h-0.5 bg-[#EAFF5F] block rounded-full" />
            <span className="w-5 h-0.5 bg-[#EAFF5F] block rounded-full" />
          </div>
        </div>
        <h1 className="text-xl font-black tracking-widest text-[#EAFF5F] uppercase">
          {gymName ? gymName.toUpperCase() : "WORKOUTS"}
        </h1>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 ring-1 ring-lime-400/30 flex items-center justify-center">
          <span className="text-[#131314] text-xs font-black">{initials}</span>
        </div>
      </header>

      <main className="px-5 pt-2">

        {/* Quick Start */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-xl">Quick Start</h2>
            <span className="text-[#EAFF5F] text-[11px] font-bold uppercase tracking-wider">Start Now</span>
          </div>
          <Link
            href="/workout/new"
            onClick={() => typeof window !== "undefined" && window.localStorage.removeItem(workoutDraftKey)}
            className="w-full bg-[#EAFF5F] text-black h-14 rounded-full font-bold text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="text-lg font-black leading-none">+</span>
            Start Empty Workout
          </Link>
        </section>

        {/* My Routines */}
        <section className="mt-8">
          <div className="flex flex-col items-start gap-4 mb-4">
            <h2 className="text-white font-semibold text-xl">My Routines</h2>
            <div className="flex w-full gap-3">
              <Link
                href="/workout/new"
                onClick={() => typeof window !== "undefined" && window.localStorage.removeItem(workoutDraftKey)}
                className="flex-1 bg-[#1C1C1E] text-zinc-300 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-zinc-800 hover:bg-[#252528] hover:text-[#EAFF5F] hover:border-[#EAFF5F]/50 active:scale-95 transition-all"
              >
                <Dumbbell className="w-4 h-4" />
                New Routine
              </Link>
              <Link
                href="/explore"
                className="flex-1 bg-[#1C1C1E] text-zinc-300 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-zinc-800 hover:bg-[#252528] hover:text-[#EAFF5F] hover:border-[#EAFF5F]/50 active:scale-95 transition-all"
              >
                <Compass className="w-4 h-4" />
                Explore
              </Link>
            </div>
          </div>

          {/* Empty state */}
          {!hasRoutines ? (
            <div className="bg-[#1C1C1E] rounded-[24px] p-8 flex flex-col items-center text-center border border-dashed border-zinc-800 mt-2">
              <div className="w-12 h-12 bg-[#EAFF5F]/10 rounded-full flex items-center justify-center mb-4">
                <Dumbbell className="w-6 h-6 text-[#EAFF5F]" />
              </div>
              <h3 className="text-white font-semibold mb-1">No routines yet</h3>
              <p className="text-zinc-500 text-sm mb-5">Create a routine to get started</p>
              <Link
                href="/workout/new"
                className="bg-[#EAFF5F] text-black text-sm font-bold px-5 py-2.5 rounded-full uppercase tracking-wider active:scale-95 transition-all"
              >
                + New Routine
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4" ref={menuRef}>
              {visibleWorkouts.map((workout) => {
                const displayName = localNames[workout.id] ?? workout.name;
                const exercises = workout.exercises ?? [];
                const exerciseNames = exercises.map((e) => e.name).filter(Boolean) as string[];
                const category = derivedCategory(exercises);
                const isMenuOpen = openMenu === workout.id;
                const isRenaming = renamingId === workout.id;

                return (
                  <div
                    key={workout.id}
                    className="bg-[#1C1C1E] rounded-[24px] p-6 border border-transparent hover:border-[#EAFF5F]/30 transition-all group relative overflow-hidden"
                  >
                    {/* Decorative bg bolt */}
                    <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none select-none">
                      <span className="text-[100px] font-black text-white leading-none">⚡</span>
                    </div>

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 mr-2">
                          <span className="text-[#EAFF5F] text-[10px] font-bold uppercase tracking-widest mb-1 block">
                            {category}
                          </span>
                          {isRenaming ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitRename(workout.id);
                                  if (e.key === "Escape") setRenamingId(null);
                                }}
                                className="flex-1 text-white font-semibold text-lg bg-[#252528] rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#EAFF5F]/40"
                              />
                              <button onClick={() => commitRename(workout.id)} className="text-[#EAFF5F] hover:opacity-80 transition-opacity">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setRenamingId(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <h3 className="text-white font-semibold text-lg leading-tight">
                              {displayName || "Workout Routine"}
                            </h3>
                          )}
                        </div>

                        {/* ··· menu */}
                        <div className="relative shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenu(isMenuOpen ? null : workout.id); }}
                            className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 -mr-1"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 top-8 z-50 bg-[#1C1C1E] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 py-1 w-44">
                              <button
                                onClick={() => { startRoutine(workout); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#252528] hover:text-[#EAFF5F] transition-colors"
                              >
                                Start Routine
                              </button>
                              <button
                                onClick={() => startRename(workout)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#252528] transition-colors"
                              >
                                Rename
                              </button>
                              <div className="border-t border-zinc-800 my-1" />
                              <button
                                onClick={() => handleDelete(workout.id)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Exercise chips */}
                      {exerciseNames.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {exerciseNames.slice(0, 2).map((name, i) => (
                            <div key={i} className="bg-[#252528] px-3 py-1 rounded-full flex items-center gap-1.5">
                              <Dumbbell className="w-3 h-3 text-zinc-500" />
                              <span className="text-zinc-400 text-xs">{name}</span>
                            </div>
                          ))}
                          {exerciseNames.length > 2 && (
                            <div className="bg-[#252528] px-3 py-1 rounded-full">
                              <span className="text-zinc-500 text-xs">+{exerciseNames.length - 2} more</span>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => startRoutine(workout)}
                        className="w-full bg-[#252528] text-white h-12 rounded-xl font-semibold text-sm uppercase tracking-wider group-hover:bg-[#EAFF5F] group-hover:text-black transition-colors"
                      >
                        Start Routine
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Performance Stats */}
        <section className="mt-8 pb-10">
          <h2 className="text-white font-semibold text-xl mb-4">Performance Stats</h2>
          <div className="grid grid-cols-2 gap-4">

            <div className="bg-[#1C1C1E] p-6 rounded-[24px]">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Workouts</span>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[#EAFF5F] text-3xl font-bold leading-none">{workouts.length}</span>
                <span className="text-zinc-500 text-[10px] font-bold mb-1">LIFETIME</span>
              </div>
            </div>

            <div className="bg-[#1C1C1E] p-6 rounded-[24px]">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Active Streak</span>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[#EAFF5F] text-3xl font-bold leading-none">{streak}</span>
                <span className="text-zinc-500 text-[10px] font-bold mb-1">DAYS</span>
              </div>
            </div>

            <div className="bg-[#1C1C1E] p-6 rounded-[24px] col-span-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Last Session</span>
                  <h4 className="text-white font-semibold text-base mt-1 leading-snug">
                    {lastSession?.name ?? "No sessions yet"}
                  </h4>
                </div>
                {lastSession?.date && (
                  <div className="text-right shrink-0 ml-4">
                    {lastSession.duration ? (
                      <span className="text-[#EAFF5F] font-bold text-lg leading-none block">{lastSession.duration}m</span>
                    ) : null}
                    <p className="text-zinc-500 text-[10px] uppercase mt-0.5">
                      {new Date(lastSession.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#1C1C1E] p-6 rounded-[24px] col-span-2 relative overflow-hidden">
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Routines</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[#EAFF5F] text-3xl font-bold leading-none">{String(visibleWorkouts.length).padStart(2, "0")}</span>
                    <span className="text-zinc-400 text-sm">Saved Routines</span>
                  </div>
                </div>
                <Trophy className="w-9 h-9 text-[#EAFF5F]" />
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#EAFF5F]/5 blur-3xl rounded-full pointer-events-none" />
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
