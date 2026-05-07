"use client";

import { useEffect, useMemo, useState } from "react";
import { FastForward, X } from "lucide-react";

type Props = {
  duration: number;
  startedAt: number;
  onDismiss: () => void;
  onSkip: () => void;
};

export default function RestTimer({ duration, startedAt, onDismiss, onSkip }: Props) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    const elapsed = Math.floor((now - startedAt) / 1000);
    return Math.max(0, duration - elapsed);
  }, [duration, now, startedAt]);

  const done = remaining === 0;
  const progress = duration > 0 ? remaining / duration : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="bg-[var(--app-card)] rounded-2xl border border-[var(--app-border)] p-4 flex items-center gap-4">
      {/* Countdown ring */}
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--app-card2)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={done ? "#d9ee4f" : "#d9ee4f"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-all duration-300"
            style={{ opacity: done ? 1 : 0.8 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[var(--app-text)] font-bold text-xl tabular-nums leading-none">
            {mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}s`}
          </span>
          <span className="text-[var(--app-text-muted)] text-[10px] mt-0.5">
            {done ? "done!" : "rest"}
          </span>
        </div>
      </div>

      {/* Info + controls */}
      <div className="flex-1 min-w-0">
        <p className="text-[var(--app-text)] font-bold text-sm">
          {done ? "Rest complete!" : "Rest Time"}
        </p>
        <p className="text-[var(--app-text-muted)] text-xs mt-0.5">
          {done ? "Start your next set when ready" : "Take a breather…"}
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-all"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
          >
            <FastForward className="w-3 h-3" />
            Skip
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center gap-1.5 bg-[var(--app-card2)] text-[var(--app-text-muted)] text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-all"
          >
            <X className="w-3 h-3" />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
