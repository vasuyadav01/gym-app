"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const ITEM_H = 52;
const MINUTES = [0, 1, 2, 3, 4, 5];
const SECONDS = [0, 15, 30, 45];

function ScrollPicker({
  items,
  selected,
  onChange,
  label,
}: {
  items: number[];
  selected: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(selected);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const idx = Math.max(0, items.indexOf(selected));
    if (ref.current) ref.current.scrollTop = idx * ITEM_H;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), items.length - 1));
    setActive(items[idx]);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      onChange(items[idx]);
    }, 150);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: ITEM_H * 3,
          scrollSnapType: "y mandatory",
          overflowY: "scroll",
          scrollbarWidth: "none",
        }}
      >
        <div style={{ height: ITEM_H }} />
        {items.map((item) => (
          <div
            key={item}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            className="flex items-center justify-center select-none"
          >
            <span
              className="tabular-nums font-bold transition-all duration-150"
              style={item === active
                ? { color: "#d9ee4f", fontSize: "2.25rem" }
                : { color: "var(--app-control)", fontSize: "1.5rem" }}
            >
              {String(item).padStart(2, "0")}
            </span>
          </div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>
      <span className="text-[var(--app-text-muted)] text-xs font-semibold">{label}</span>
    </div>
  );
}

type Props = {
  initialSeconds: number;
  onSave: (seconds: number) => void;
  onClose: () => void;
};

export default function RestTimerSheet({ initialSeconds, onSave, onClose }: Props) {
  const initMins = Math.floor(initialSeconds / 60);
  const rawSecs = initialSeconds % 60;
  const initSecs = SECONDS.reduce((prev, curr) =>
    Math.abs(curr - rawSecs) < Math.abs(prev - rawSecs) ? curr : prev,
  );

  const [minutes, setMinutes] = useState(initMins);
  const [seconds, setSeconds] = useState(initSecs);
  const total = minutes * 60 + seconds;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--app-card)] rounded-t-3xl w-full max-w-md mx-auto border-t border-[var(--app-border-md)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-6 pt-3 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--app-text)] font-bold text-lg">Rest Timer</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--app-card2)] flex items-center justify-center"
            >
              <X className="w-4 h-4 text-[var(--app-text-muted)]" />
            </button>
          </div>

          <div className="relative flex items-start justify-center gap-4">
            <div
              className="absolute left-4 right-4 rounded-2xl pointer-events-none"
              style={{
                height: ITEM_H,
                top: "50%",
                transform: "translateY(calc(-50% - 12px))",
                backgroundColor: "rgba(217,238,79,0.08)",
                border: "1px solid rgba(217,238,79,0.15)",
              }}
            />
            <ScrollPicker items={MINUTES} selected={minutes} onChange={setMinutes} label="min" />
            <div className="text-neutral-600 font-bold text-3xl mt-12">:</div>
            <ScrollPicker items={SECONDS} selected={seconds} onChange={setSeconds} label="sec" />
          </div>

          <p className="text-center text-[var(--app-text-muted)] text-sm mt-5">
            {total === 0
              ? "No rest"
              : `${minutes > 0 ? `${minutes}m ` : ""}${seconds}s between sets`}
          </p>

          <div className="flex gap-2 mt-4 justify-center">
            {[30, 60, 90, 120, 180].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setMinutes(Math.floor(s / 60));
                  setSeconds(s % 60);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                style={total === s
                  ? { backgroundColor: "#d9ee4f", color: "#1a2000" }
                  : { backgroundColor: "var(--app-card2)", color: "var(--app-text-muted)" }}
              >
                {s < 60 ? `${s}s` : `${s / 60}m`}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-[var(--app-card2)] text-[var(--app-text-muted)] font-semibold py-3.5 rounded-2xl text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(total); onClose(); }}
              className="flex-1 font-semibold py-3.5 rounded-2xl text-sm"
              style={{ backgroundColor: "#d9ee4f", color: "#1a2000", boxShadow: "0 4px 14px rgba(217,238,79,0.25)" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
