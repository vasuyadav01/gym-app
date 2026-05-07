"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronUp,
  ChevronDown,
  Dumbbell,
  Edit3,
  MoreHorizontal,
  Timer,
  Trash2,
} from "lucide-react";
import ExerciseLibrary from "./ExerciseLibrary";
import RestTimer from "./RestTimer";
import RestTimerSheet from "./RestTimerSheet";
import SetRow from "./SetRow";
import {
  calculateWorkoutVolume,
  createEmptySet,
  getPreviousBestWeight,
  saveWorkoutHistory,
  workoutDraftKey,
  type ExerciseDefinition,
  type WorkoutExercise,
  type WorkoutHistoryItem,
  type WorkoutSet,
} from "./workoutTypes";
import SaveWorkoutScreen from "./SaveWorkoutScreen";

type WorkoutSessionProps = {
  onSave: (payload: {
    name: string;
    startTime: string;
    endTime: string;
    duration: number;
    totalVolume: number;
    exercises: WorkoutExercise[];
  }) => Promise<void>;
  saving: boolean;
  message?: string;
};

type MenuState = { id: string; mode: "menu" | "confirm" } | null;

const DEFAULT_REST = 90;

const readDraftExercises = (): WorkoutExercise[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(workoutDraftKey);
    const parsed = raw ? (JSON.parse(raw) as Partial<WorkoutExercise>[]) : [];
    return Array.isArray(parsed)
      ? parsed.map((ex) => ({
          exerciseId: ex.exerciseId ?? ex.name ?? crypto.randomUUID(),
          name: ex.name ?? "Exercise",
          category: ex.category ?? "General",
          equipment: ex.equipment ?? "bodyweight",
          primaryMuscles: ex.primaryMuscles ?? [],
          secondaryMuscles: ex.secondaryMuscles ?? [],
          notes: ex.notes ?? "",
          sets: Array.isArray(ex.sets)
            ? ex.sets.map((s) => ({
                weight: Number(s.weight) || 0,
                reps: Number(s.reps) || 0,
                completed: Boolean(s.completed),
                isPR: Boolean(s.isPR),
              }))
            : [createEmptySet()],
        }))
      : [];
  } catch {
    return [];
  }
};

const createWorkoutExercise = (def: ExerciseDefinition): WorkoutExercise => ({
  exerciseId: def.id,
  name: def.name,
  category: def.category,
  equipment: def.equipment,
  primaryMuscles: def.primaryMuscles,
  secondaryMuscles: def.secondaryMuscles,
  notes: "",
  sets: [createEmptySet()],
});

function useElapsedTime(startTime: string) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const fmtDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? (s > 0 ? `${m}m ${s}s` : `${m}m`) : `${s}s`;
};

export default function WorkoutSession({ onSave, saving, message }: WorkoutSessionProps) {
  const router = useRouter();

  const [name, setName] = useState("Log Workout");
  const [editingName, setEditingName] = useState(false);
  const [startTime] = useState(() => new Date().toISOString());
  const [exercises, setExercises] = useState<WorkoutExercise[]>(readDraftExercises);

  const [restDurations, setRestDurations] = useState<Record<string, number>>({});
  const [restActive, setRestActive] = useState<{ exerciseId: string; startedAt: number; duration: number } | null>(null);

  const [showLibrary, setShowLibrary] = useState(false);
  const [timerSheetFor, setTimerSheetFor] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<MenuState>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [showSaveScreen, setShowSaveScreen] = useState(false);
  const [pendingEndTime, setPendingEndTime] = useState("");

  const elapsed = useElapsedTime(startTime);
  const totalVolume = useMemo(() => calculateWorkoutVolume(exercises), [exercises]);
  const completedSets = useMemo(
    () => exercises.reduce((t, e) => t + e.sets.filter((s) => s.completed).length, 0),
    [exercises],
  );
  const previousBests = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of exercises) map[e.exerciseId] = getPreviousBestWeight(e.exerciseId);
    return map;
  }, [exercises]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) renameInputRef.current.focus();
  }, [renamingId]);

  const persist = (next: WorkoutExercise[]) =>
    window.localStorage.setItem(workoutDraftKey, JSON.stringify(next));

  const addExercise = (def: ExerciseDefinition) => {
    setExercises((curr) => {
      if (curr.some((e) => e.exerciseId === def.id)) return curr;
      const next = [...curr, createWorkoutExercise(def)];
      persist(next);
      return next;
    });
    setShowLibrary(false);
  };

  const updateExercise = (id: string, updater: (e: WorkoutExercise) => WorkoutExercise) => {
    setExercises((curr) => {
      const next = curr.map((e) => (e.exerciseId === id ? updater(e) : e));
      persist(next);
      return next;
    });
  };

  const deleteExercise = (id: string) => {
    setExercises((curr) => {
      const next = curr.filter((e) => e.exerciseId !== id);
      persist(next);
      return next;
    });
    setMenuState(null);
  };

  const moveExercise = (id: string, dir: -1 | 1) => {
    setExercises((curr) => {
      const idx = curr.findIndex((e) => e.exerciseId === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= curr.length) return curr;
      const arr = [...curr];
      const [item] = arr.splice(idx, 1);
      arr.splice(next, 0, item);
      persist(arr);
      return arr;
    });
    setMenuState(null);
  };

  const updateSet = (exerciseId: string, idx: number, nextSet: WorkoutSet) => {
    updateExercise(exerciseId, (e) => ({
      ...e,
      sets: e.sets.map((s, i) => (i === idx ? nextSet : s)),
    }));
  };

  const completeSet = (exerciseId: string, idx: number) => {
    const target = exercises.find((e) => e.exerciseId === exerciseId)?.sets[idx];
    updateExercise(exerciseId, (e) => {
      const best = getPreviousBestWeight(e.exerciseId);
      return {
        ...e,
        sets: e.sets.map((s, i) => {
          if (i !== idx) return s;
          const completed = !s.completed;
          return { ...s, completed, isPR: completed && Number(s.weight) > best };
        }),
      };
    });
    if (target && !target.completed) {
      const dur = restDurations[exerciseId] ?? DEFAULT_REST;
      if (dur > 0) setRestActive({ exerciseId, startedAt: Date.now(), duration: dur });
    }
  };

  const addSet = (exerciseId: string) => {
    updateExercise(exerciseId, (e) => ({ ...e, sets: [...e.sets, createEmptySet()] }));
  };

  const deleteSet = (exerciseId: string, idx: number) => {
    updateExercise(exerciseId, (e) => ({
      ...e,
      sets: e.sets.length === 1 ? [createEmptySet()] : e.sets.filter((_, i) => i !== idx),
    }));
  };

  const openSaveScreen = () => {
    setPendingEndTime(new Date().toISOString());
    setShowSaveScreen(true);
  };

  const confirmSave = async (finalName: string, _description: string) => {
    const endTime = pendingEndTime || new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    const workout: WorkoutHistoryItem = {
      id: crypto.randomUUID(),
      name: finalName,
      startTime,
      endTime,
      duration,
      totalVolume,
      exercises,
    };
    saveWorkoutHistory(workout);
    await onSave({ name: finalName, startTime, endTime, duration, totalVolume, exercises });
    window.localStorage.removeItem(workoutDraftKey);
  };

  const discardWorkout = () => {
    window.localStorage.removeItem(workoutDraftKey);
    router.back();
  };

  const commitRename = (id: string) => {
    if (renameValue.trim()) {
      updateExercise(id, (e) => ({ ...e, name: renameValue.trim() }));
    }
    setRenamingId(null);
  };

  const getRestDuration = (exerciseId: string) => restDurations[exerciseId] ?? DEFAULT_REST;

  const saveRestDuration = (exerciseId: string, secs: number) => {
    setRestDurations((prev) => ({ ...prev, [exerciseId]: secs }));
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#131314] flex flex-col relative">

      {showSaveScreen && (
        <SaveWorkoutScreen
          name={name}
          startTime={startTime}
          endTime={pendingEndTime}
          exercises={exercises}
          totalVolume={totalVolume}
          completedSets={completedSets}
          saving={saving}
          onSave={confirmSave}
          onDiscard={discardWorkout}
        />
      )}

      {showLibrary && (
        <div className="fixed inset-0 z-50 flex flex-col max-w-md mx-auto left-0 right-0">
          <ExerciseLibrary
            addedExerciseIds={exercises.map((e) => e.exerciseId)}
            onAdd={addExercise}
            onClose={() => setShowLibrary(false)}
          />
        </div>
      )}

      {timerSheetFor && (
        <RestTimerSheet
          initialSeconds={getRestDuration(timerSheetFor)}
          onSave={(secs) => saveRestDuration(timerSheetFor, secs)}
          onClose={() => setTimerSheetFor(null)}
        />
      )}

      {menuState && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setMenuState(null)}
        />
      )}

      {/* Sticky header */}
      <div className="bg-[#131314] border-b border-white/5 px-4 pt-12 pb-3 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          {editingName ? (
            <input
              autoFocus
              className="text-base font-bold text-white bg-transparent outline-none border-b-2 flex-1 mr-3"
              style={{ borderColor: "#d9ee4f" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-base font-bold text-white text-left flex-1 mr-3 truncate"
            >
              {name}
            </button>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (exercises.length > 0) {
                  const id = exercises[0].exerciseId;
                  const dur = getRestDuration(id);
                  setRestActive({ exerciseId: id, startedAt: Date.now(), duration: dur });
                }
              }}
              className="w-9 h-9 rounded-full border border-white/10 bg-[#1c1b1c] flex items-center justify-center"
            >
              <Timer className="w-4 h-4 text-neutral-500" />
            </button>
            <button
              onClick={openSaveScreen}
              disabled={saving || exercises.length === 0}
              className="text-sm font-bold px-5 py-2 rounded-xl active:scale-95 disabled:opacity-40 transition-all"
              style={{ backgroundColor: "#d9ee4f", color: "#1a2000", boxShadow: "0 4px 12px rgba(217,238,79,0.3)" }}
            >
              {saving ? "Saving…" : "Finish"}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-neutral-500 text-[11px] uppercase font-semibold tracking-wide">Duration</p>
            <p className="font-bold text-sm" style={{ color: "#d9ee4f" }}>{elapsed}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-[11px] uppercase font-semibold tracking-wide">Volume</p>
            <p className="text-white font-bold text-sm">{totalVolume.toLocaleString()} kg</p>
          </div>
          <div>
            <p className="text-neutral-500 text-[11px] uppercase font-semibold tracking-wide">Sets</p>
            <p className="text-white font-bold text-sm">{completedSets}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-4 pb-10">

        {restActive && (
          <RestTimer
            duration={restActive.duration}
            startedAt={restActive.startedAt}
            onDismiss={() => setRestActive(null)}
            onSkip={() => setRestActive(null)}
          />
        )}

        {exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#1c1b1c] flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-neutral-600" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">Get started</p>
              <p className="text-neutral-500 text-sm mt-1">Add an exercise to begin</p>
            </div>
            <button
              onClick={() => setShowLibrary(true)}
              className="flex items-center gap-2 font-semibold px-8 py-3.5 rounded-2xl active:scale-95 transition-all"
              style={{ backgroundColor: "#d9ee4f", color: "#1a2000", boxShadow: "0 4px 14px rgba(217,238,79,0.3)" }}
            >
              + Add Exercise
            </button>
            <div className="flex gap-3 w-full">
              <button className="flex-1 bg-[#1c1b1c] border border-white/10 text-neutral-300 font-semibold py-3 rounded-xl text-sm hover:bg-[#252528] active:scale-95 transition-all">
                Settings
              </button>
              <button
                onClick={discardWorkout}
                className="flex-1 bg-[#1c1b1c] border border-red-900/30 text-red-500 font-semibold py-3 rounded-xl text-sm hover:bg-red-900/10 active:scale-95 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {exercises.map((exercise, exerciseIndex) => {
          const isMenuOpen = menuState?.id === exercise.exerciseId;
          const restDur = getRestDuration(exercise.exerciseId);

          return (
            <div
              key={exercise.exerciseId}
              className="bg-[#1c1b1c] rounded-2xl border border-white/5 overflow-visible"
            >
              {/* Card header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <div className="w-9 h-9 rounded-full bg-[#252528] flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  {renamingId === exercise.exerciseId ? (
                    <input
                      ref={renameInputRef}
                      className="font-bold text-base bg-transparent outline-none border-b-2 w-full"
                      style={{ color: "#d9ee4f", borderColor: "#d9ee4f" }}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(exercise.exerciseId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(exercise.exerciseId);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                    />
                  ) : (
                    <h2 className="font-bold text-base truncate" style={{ color: "#d9ee4f" }}>{exercise.name}</h2>
                  )}
                  <p className="text-neutral-500 text-xs capitalize mt-0.5">
                    {exercise.category} · {exercise.equipment}
                  </p>
                </div>

                {/* Three-dots menu */}
                <div className="relative shrink-0">
                  <button
                    onClick={() =>
                      setMenuState(
                        isMenuOpen ? null : { id: exercise.exerciseId, mode: "menu" },
                      )
                    }
                    className="p-1.5 rounded-lg hover:bg-[#252528] text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {isMenuOpen && menuState?.mode === "menu" && (
                    <div className="absolute right-0 top-8 z-40 bg-[#1c1b1c] rounded-2xl shadow-xl border border-white/10 py-1 w-48">
                      <button
                        onClick={() => {
                          setRenamingId(exercise.exerciseId);
                          setRenameValue(exercise.name);
                          setMenuState(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-300 hover:bg-[#252528] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                        Rename
                      </button>
                      <button
                        onClick={() => moveExercise(exercise.exerciseId, -1)}
                        disabled={exerciseIndex === 0}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-300 hover:bg-[#252528] transition-colors disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                        Move Up
                      </button>
                      <button
                        onClick={() => moveExercise(exercise.exerciseId, 1)}
                        disabled={exerciseIndex === exercises.length - 1}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-300 hover:bg-[#252528] transition-colors disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                        Move Down
                      </button>
                      <div className="h-px bg-white/5 mx-3 my-1" />
                      <button
                        onClick={() => setMenuState({ id: exercise.exerciseId, mode: "confirm" })}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-900/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Exercise
                      </button>
                    </div>
                  )}

                  {isMenuOpen && menuState?.mode === "confirm" && (
                    <div className="absolute right-0 top-8 z-40 bg-[#1c1b1c] rounded-2xl shadow-xl border border-red-900/30 p-4 w-56">
                      <p className="text-white font-bold text-sm mb-1">Delete exercise?</p>
                      <p className="text-neutral-500 text-xs mb-4">All sets will be removed.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMenuState(null)}
                          className="flex-1 bg-[#252528] text-neutral-300 text-sm font-semibold py-2 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteExercise(exercise.exerciseId)}
                          className="flex-1 bg-red-500 text-white text-sm font-semibold py-2 rounded-xl"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="px-4 pb-2">
                <input
                  className="w-full text-sm text-neutral-500 placeholder:text-neutral-600 bg-transparent outline-none"
                  placeholder="Add notes here..."
                  value={exercise.notes}
                  onChange={(e) =>
                    updateExercise(exercise.exerciseId, (ex) => ({ ...ex, notes: e.target.value }))
                  }
                />
              </div>

              {/* Rest timer label */}
              <div className="px-4 pb-3">
                <button
                  onClick={() => setTimerSheetFor(exercise.exerciseId)}
                  className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: "#d9ee4f" }}
                >
                  <Timer className="w-3.5 h-3.5" />
                  Rest Timer: {fmtDuration(restDur)}
                </button>
              </div>

              {/* Sets table header */}
              <div className="grid grid-cols-[40px_1fr_80px_80px_44px] gap-1.5 px-4 pb-2 border-b border-white/5">
                <p className="text-neutral-500 text-[10px] font-bold uppercase text-center">Set</p>
                <p className="text-neutral-500 text-[10px] font-bold uppercase text-center">Previous</p>
                <p className="text-neutral-500 text-[10px] font-bold uppercase text-center">KG</p>
                <p className="text-neutral-500 text-[10px] font-bold uppercase text-center">Reps</p>
                <p className="text-neutral-500 text-[10px] font-bold uppercase text-center">✓</p>
              </div>

              {/* Set rows */}
              <div className="flex flex-col divide-y divide-white/5">
                {exercise.sets.map((set, idx) => (
                  <SetRow
                    key={`${exercise.exerciseId}-${idx}`}
                    set={set}
                    setNumber={idx + 1}
                    previousBest={previousBests[exercise.exerciseId] ?? 0}
                    onChange={(next) => updateSet(exercise.exerciseId, idx, next)}
                    onComplete={() => completeSet(exercise.exerciseId, idx)}
                    onDelete={() => deleteSet(exercise.exerciseId, idx)}
                  />
                ))}
              </div>

              {/* Add set */}
              <div className="px-4 py-3 border-t border-white/5">
                <button
                  onClick={() => addSet(exercise.exerciseId)}
                  className="w-full bg-[#252528] border border-white/8 text-neutral-400 text-sm font-semibold py-2.5 rounded-xl hover:bg-[#2a2a2b] active:scale-[0.98] transition-all"
                >
                  + Add Set
                </button>
              </div>
            </div>
          );
        })}

        {exercises.length > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => setShowLibrary(true)}
              className="flex items-center justify-center gap-2 w-full font-semibold py-4 rounded-2xl active:scale-[0.98] transition-all"
              style={{ backgroundColor: "#d9ee4f", color: "#1a2000", boxShadow: "0 4px 14px rgba(217,238,79,0.25)" }}
            >
              + Add Exercise
            </button>
            <div className="flex gap-3">
              <button className="flex-1 bg-[#1c1b1c] border border-white/10 text-neutral-300 font-semibold py-3 rounded-xl text-sm hover:bg-[#252528] active:scale-95 transition-all">
                Settings
              </button>
              <button
                onClick={discardWorkout}
                className="flex-1 bg-[#1c1b1c] border border-red-900/30 text-red-500 font-semibold py-3 rounded-xl text-sm hover:bg-red-900/10 active:scale-95 transition-all"
              >
                Discard Workout
              </button>
            </div>
          </div>
        )}

        {message && (
          <p className="rounded-xl border border-red-900/30 bg-red-900/10 p-4 text-sm text-red-500">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
