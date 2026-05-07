"use client";

import { useRef } from "react";
import type { WorkoutSet } from "./workoutTypes";

type SetRowProps = {
  set: WorkoutSet;
  setNumber: number;
  previousBest: number;
  onChange: (set: WorkoutSet) => void;
  onDelete: () => void;
  onComplete: () => void;
};

export default function SetRow({
  set,
  setNumber,
  previousBest,
  onChange,
  onDelete,
  onComplete,
}: SetRowProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = () => {
    timerRef.current = setTimeout(() => onDelete(), 600);
  };

  const cancelLongPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const completed = set.completed;

  return (
    <>
      <div
        className={`grid grid-cols-[40px_1fr_80px_80px_44px] items-center gap-1.5 px-4 py-2 transition-colors ${
          completed ? "bg-[#d9ee4f]/5" : ""
        }`}
      >
        {/* Set number — long press to delete */}
        <button
          type="button"
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold select-none transition-colors"
          style={completed
            ? { backgroundColor: "rgba(217,238,79,0.15)", color: "#d9ee4f" }
            : { backgroundColor: "#252528", color: "#737373" }}
        >
          {setNumber}
        </button>

        {/* Previous best */}
        <span className="text-xs text-neutral-500 text-center truncate">
          {previousBest > 0 ? `${previousBest} kg` : "—"}
        </span>

        {/* KG input */}
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.5}
          placeholder="0"
          value={set.weight || ""}
          onChange={(e) => onChange({ ...set, weight: Number(e.target.value) || 0 })}
          className="w-full rounded-xl text-center text-sm font-semibold py-2 outline-none border transition-colors"
          style={completed
            ? { backgroundColor: "rgba(217,238,79,0.08)", borderColor: "rgba(217,238,79,0.2)", color: "#d9ee4f" }
            : { backgroundColor: "#252528", borderColor: "rgba(255,255,255,0.08)", color: "#e5e2e3" }}
        />

        {/* Reps input */}
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={set.reps || ""}
          onChange={(e) => onChange({ ...set, reps: Number(e.target.value) || 0 })}
          className="w-full rounded-xl text-center text-sm font-semibold py-2 outline-none border transition-colors"
          style={completed
            ? { backgroundColor: "rgba(217,238,79,0.08)", borderColor: "rgba(217,238,79,0.2)", color: "#d9ee4f" }
            : { backgroundColor: "#252528", borderColor: "rgba(255,255,255,0.08)", color: "#e5e2e3" }}
        />

        {/* Complete button */}
        <button
          type="button"
          onClick={onComplete}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all active:scale-90"
          style={completed
            ? { backgroundColor: "#d9ee4f", color: "#1a2000" }
            : { backgroundColor: "#252528", color: "#636366" }}
        >
          ✓
        </button>
      </div>

      {/* PR badge */}
      {set.isPR && (
        <div className="px-4 pb-1">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
            🏆 NEW PR
          </span>
        </div>
      )}
    </>
  );
}
