"use client";

import { useMemo, useState } from "react";

const plateSets = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
};

const PLATE_COLORS: Record<number, { bg: string; text: string }> = {
  25:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171" },
  20:   { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa" },
  15:   { bg: "rgba(234,179,8,0.12)",   text: "#facc15" },
  10:   { bg: "rgba(34,197,94,0.12)",   text: "#4ade80" },
  5:    { bg: "var(--app-card2)",  text: "var(--app-text)" },
  2.5:  { bg: "var(--app-card2)", text: "var(--app-text-muted)" },
  1.25: { bg: "var(--app-card2)", text: "var(--app-text-muted)" },
  45:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171" },
  35:   { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa" },
};

const calculatePlates = (
  remaining: number,
  plates: number[],
): Array<{ plate: number; count: number }> => {
  const [plate, ...rest] = plates;
  if (!plate) return [];
  const count = Math.floor(remaining / plate);
  const nextRemaining = remaining - count * plate;
  const currentPlate = count > 0 ? [{ plate, count }] : [];
  return [...currentPlate, ...calculatePlates(nextRemaining, rest)];
};

export default function PlateCalculator() {
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [targetWeight, setTargetWeight] = useState(100);

  const plates = useMemo(() => {
    const barWeight = unit === "kg" ? 20 : 45;
    const remaining = Math.max(0, targetWeight - barWeight) / 2;
    return calculatePlates(remaining, plateSets[unit]);
  }, [targetWeight, unit]);

  return (
    <section className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-card)] p-5">
      <h2 className="text-[var(--app-text)] text-base font-bold">Plate Calculator</h2>
      <p className="text-[var(--app-text-muted)] text-xs mt-0.5">Plates per side · bar = {unit === "kg" ? "20 kg" : "45 lb"}</p>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <input
          className="rounded-xl border border-[var(--app-border-md)] bg-[var(--app-card2)] px-3 py-3 font-mono text-[var(--app-text)] text-sm outline-none transition-all"
          min={0}
          onChange={(e) => setTargetWeight(Number(e.target.value) || 0)}
          type="number"
          value={targetWeight}
          onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
          onBlur={(e) => e.currentTarget.style.borderColor = "var(--app-border-md)"}
        />
        <select
          className="rounded-xl border border-[var(--app-border-md)] bg-[var(--app-card2)] px-3 py-3 text-[var(--app-text)] text-sm outline-none transition-all"
          onChange={(e) => setUnit(e.target.value as "kg" | "lb")}
          value={unit}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {plates.length === 0 ? (
          <div className="w-full rounded-xl bg-[var(--app-card2)] border border-[var(--app-border)] px-4 py-3">
            <p className="text-sm text-[var(--app-text-muted)] font-medium">Bar only</p>
          </div>
        ) : (
          plates.map((item) => {
            const colors = PLATE_COLORS[item.plate] ?? { bg: "var(--app-card2)", text: "var(--app-text-muted)" };
            return (
              <span
                className="rounded-xl border px-3 py-2 font-mono text-sm font-semibold"
                key={item.plate}
                style={{ backgroundColor: colors.bg, color: colors.text, borderColor: `${colors.text}30` }}
              >
                {item.count} × {item.plate} {unit}
              </span>
            );
          })
        )}
      </div>
    </section>
  );
}
