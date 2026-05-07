"use client";

import { useMemo, useState } from "react";

const percentages = [95, 90, 85, 80, 75, 70, 65, 60];

export default function OneRMCalculator() {
  const [weight, setWeight] = useState(100);
  const [reps, setReps] = useState(5);

  const oneRepMax = useMemo(() => {
    return weight * (1 + reps / 30);
  }, [reps, weight]);

  return (
    <section className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-card)] p-5">
      <h2 className="text-[var(--app-text)] text-base font-bold">One Rep Max</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--app-text-muted)]">
          Weight (kg)
          <input
            className="w-full rounded-xl border border-[var(--app-border-md)] bg-[var(--app-card2)] px-3 py-3 font-mono text-[var(--app-text)] text-sm outline-none transition-all"
            min={0}
            onChange={(e) => setWeight(Number(e.target.value) || 0)}
            type="number"
            value={weight}
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "var(--app-border-md)"}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--app-text-muted)]">
          Reps
          <input
            className="w-full rounded-xl border border-[var(--app-border-md)] bg-[var(--app-card2)] px-3 py-3 font-mono text-[var(--app-text)] text-sm outline-none transition-all"
            min={1}
            onChange={(e) => setReps(Number(e.target.value) || 1)}
            type="number"
            value={reps}
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "var(--app-border-md)"}
          />
        </label>
      </div>

      <div className="mt-4 rounded-xl px-4 py-3 flex items-baseline gap-2"
        style={{ background: "rgba(217,238,79,0.08)", border: "1px solid rgba(217,238,79,0.15)" }}>
        <span className="font-mono text-3xl font-bold" style={{ color: "#d9ee4f" }}>
          {Math.round(oneRepMax)}
        </span>
        <span className="text-sm font-medium" style={{ color: "#d9ee4f80" }}>kg estimated 1RM</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {percentages.map((percent) => (
          <div
            className="flex items-center justify-between rounded-xl bg-[var(--app-card2)] border border-[var(--app-border)] px-3 py-2.5 text-sm"
            key={percent}
          >
            <span className="text-[var(--app-text-muted)] font-medium">{percent}%</span>
            <span className="font-mono font-semibold text-[var(--app-text)]">
              {Math.round(oneRepMax * (percent / 100))}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
