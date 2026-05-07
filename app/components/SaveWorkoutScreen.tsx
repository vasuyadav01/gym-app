"use client";

import { useEffect, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { getWorkoutHistory, type WorkoutExercise } from "./workoutTypes";

type Props = {
  name: string;
  startTime: string;
  endTime: string;
  exercises: WorkoutExercise[];
  totalVolume: number;
  completedSets: number;
  saving: boolean;
  onSave: (name: string, description: string) => void;
  onDiscard: () => void;
};

function calcDuration(startTime: string, endTime: string): string {
  const ms = new Date(endTime).getTime() - new Date(startTime).getTime();
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SaveWorkoutScreen({
  name: initialName,
  startTime,
  endTime,
  exercises,
  totalVolume,
  completedSets,
  saving,
  onSave,
  onDiscard,
}: Props) {
  const [workoutName, setWorkoutName] = useState(initialName);
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(false);
    try {
      const history = getWorkoutHistory();
      const prevWorkout =
        history.find((w) =>
          w.exercises.some((e) => exercises.some((ex) => ex.name === e.name))
        ) ?? null;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "summary",
          workout: {
            name: initialName,
            totalVolume,
            exercises: exercises.map((e) => ({
              name: e.name,
              sets: e.sets
                .filter((s) => s.completed)
                .map((s) => ({ weight: s.weight, reps: s.reps })),
            })),
          },
          previousWorkout: prevWorkout
            ? {
                name: prevWorkout.name,
                totalVolume: prevWorkout.totalVolume,
                exercises: prevWorkout.exercises.map((e) => ({
                  name: e.name,
                  sets: e.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
                })),
              }
            : null,
        }),
      });
      if (!res.ok) throw new Error("api");
      const data = await res.json();
      setSummary(data.content ?? null);
    } catch {
      setSummaryError(true);
    }
    setSummaryLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSummary(); }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--app-bg)] overflow-y-auto">
      <div className="w-full max-w-md mx-auto px-5 pt-12 pb-10 flex flex-col gap-4">

        <h1 className="text-[var(--app-text)] text-2xl font-black mb-2">Save Workout</h1>

        {/* Workout name */}
        <div className="bg-[var(--app-card)] rounded-[24px] border border-[var(--app-border)] px-4 py-3.5">
          <p className="text-[var(--app-text-muted)] text-[11px] font-semibold uppercase tracking-widest mb-1.5">
            Workout Name
          </p>
          <input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="w-full text-[var(--app-text)] font-bold text-base bg-transparent outline-none"
            placeholder="Workout name"
          />
        </div>

        {/* Stats grid */}
        <div className="bg-[var(--app-card)] rounded-[24px] border border-[var(--app-border)] p-4 grid grid-cols-2 gap-4">
          {[
            { label: "Duration", value: calcDuration(startTime, endTime), lime: true },
            { label: "Volume", value: `${totalVolume.toLocaleString()} kg`, lime: false },
            { label: "Sets", value: String(completedSets), lime: false },
            { label: "When", value: formatWhen(startTime), lime: false, small: true },
          ].map(({ label, value, lime, small }) => (
            <div key={label}>
              <p className="text-[var(--app-text-muted)] text-[11px] font-semibold uppercase tracking-widest mb-1">
                {label}
              </p>
              <p className={`font-bold ${small ? "text-sm leading-tight text-[var(--app-text-muted)]" : "text-lg"}`}
                style={lime ? { color: "#d9ee4f" } : { color: "var(--app-text)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="bg-[var(--app-card)] rounded-[24px] border border-[var(--app-border)] px-4 py-3.5">
          <p className="text-[var(--app-text-muted)] text-[11px] font-semibold uppercase tracking-widest mb-1.5">
            Notes
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="How did it go?"
            rows={3}
            className="w-full text-[var(--app-text-muted)] text-sm bg-transparent outline-none resize-none placeholder:text-[var(--app-text-muted)]"
          />
        </div>

        {/* AI Performance Summary */}
        <div className="bg-[var(--app-card)] rounded-[24px] border border-[var(--app-border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(217,238,79,0.1)" }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#d9ee4f" }} />
            </div>
            <p className="text-[var(--app-text)] font-bold text-sm">AI Summary</p>
          </div>

          {summaryLoading && (
            <div className="flex flex-col gap-2.5">
              <div className="h-3 bg-[var(--app-card2)] rounded-full animate-pulse" />
              <div className="h-3 bg-[var(--app-card2)] rounded-full w-5/6 animate-pulse" />
              <div className="h-3 bg-[var(--app-card2)] rounded-full w-4/6 animate-pulse" />
            </div>
          )}

          {summaryError && !summaryLoading && (
            <div className="flex items-center justify-between">
              <p className="text-[var(--app-text-muted)] text-sm">Could not load summary.</p>
              <button
                onClick={fetchSummary}
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "#d9ee4f" }}
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {summary && !summaryLoading && (
            <p className="text-[var(--app-text-muted)] text-sm leading-relaxed">{summary}</p>
          )}
        </div>

        {/* Discard */}
        <button
          onClick={onDiscard}
          className="w-full py-4 rounded-[24px] bg-[var(--app-card)] border border-red-900/30 text-red-500 font-semibold text-sm hover:bg-red-900/10 active:scale-[0.98] transition-all"
        >
          Discard Workout
        </button>

        {/* Save */}
        <button
          onClick={() => onSave(workoutName.trim() || "Workout", description)}
          disabled={saving}
          className="w-full py-4 rounded-[24px] font-bold text-base active:scale-[0.98] disabled:opacity-50 transition-all"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000", boxShadow: "0 4px 14px rgba(217,238,79,0.3)" }}
        >
          {saving ? "Saving…" : "Save Workout"}
        </button>

      </div>
    </div>
  );
}
