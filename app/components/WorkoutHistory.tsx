"use client";

import { useState } from "react";
import { Dumbbell, Flame, Zap, X, ChevronRight } from "lucide-react";
import {
  calculateExerciseVolume,
  formatDuration,
  getWorkoutHistory,
  type WorkoutHistoryItem,
} from "./workoutTypes";

const getWorkoutIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (/cardio|run|hiit|bike/.test(lower)) return Flame;
  if (/leg|squat|lower|glute/.test(lower)) return Zap;
  return Dumbbell;
};

const formatWorkoutDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  if (day.getTime() === today.getTime()) return "Today";
  if (day.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

export default function WorkoutHistory() {
  const [history] = useState<WorkoutHistoryItem[]>(() =>
    [...getWorkoutHistory()].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
  );
  const [selected, setSelected] = useState<WorkoutHistoryItem | null>(null);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--app-card2)] flex items-center justify-center mb-4">
          <Dumbbell className="w-7 h-7 text-neutral-600" />
        </div>
        <p className="text-[var(--app-text)] font-semibold">No workout history yet</p>
        <p className="mt-1 text-sm text-[var(--app-text-muted)] max-w-[200px]">
          Completed sessions will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {history.map((workout) => {
          const Icon = getWorkoutIcon(workout.name);
          const dateLabel = formatWorkoutDate(workout.startTime);
          const durationLabel = formatDuration(workout.duration);
          return (
            <button
              key={workout.id}
              onClick={() => setSelected(workout)}
              className="w-full bg-[var(--app-card)] rounded-2xl border border-[var(--app-border)] px-4 py-3.5 flex items-center gap-3 text-left hover:bg-[var(--app-hover)] active:scale-[0.99] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--app-card2)] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[var(--app-text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--app-text)] text-sm font-semibold truncate">{workout.name}</p>
                <p className="text-[var(--app-text-muted)] text-xs mt-0.5">
                  {dateLabel}{dateLabel && durationLabel ? " · " : ""}{durationLabel}
                </p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                  <p className="text-[var(--app-text)] text-sm font-bold">{workout.exercises.length}</p>
                  <p className="text-[var(--app-text-muted)] text-[11px]">exercises</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--app-card)] rounded-3xl shadow-xl max-h-[80vh] flex flex-col overflow-hidden border border-[var(--app-border-md)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[var(--app-border)] shrink-0">
              <div>
                <h2 className="text-[var(--app-text)] text-lg font-bold">{selected.name}</h2>
                <p className="text-[var(--app-text-muted)] text-sm mt-0.5">
                  {formatWorkoutDate(selected.startTime)} · {formatDuration(selected.duration)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-[var(--app-card2)] flex items-center justify-center hover:bg-[var(--app-hover)] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--app-text-muted)]" />
              </button>
            </div>

            {/* Exercise list */}
            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
              {selected.exercises.map((exercise) => (
                <div
                  key={exercise.exerciseId}
                  className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card2)] p-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-[var(--app-text)] font-semibold text-sm">{exercise.name}</h3>
                    <span className="font-mono text-xs font-semibold" style={{ color: "#d9ee4f" }}>
                      {calculateExerciseVolume(exercise).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {exercise.sets.map((set, idx) => (
                      <div
                        key={`${exercise.exerciseId}-${idx}`}
                        className="grid grid-cols-[1.5rem_1fr_1fr_auto] items-center gap-2 rounded-xl bg-[var(--app-card)] border border-[var(--app-border)] px-3 py-2 text-sm"
                      >
                        <span className="font-mono text-[var(--app-text-muted)] text-xs">{idx + 1}</span>
                        <span className="font-mono text-[var(--app-text-muted)]">{set.weight} kg</span>
                        <span className="font-mono text-[var(--app-text-muted)]">{set.reps} reps</span>
                        {set.isPR && (
                          <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
                            PR
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
