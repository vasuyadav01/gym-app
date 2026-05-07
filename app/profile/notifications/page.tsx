"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const NOTIFICATION_OPTIONS = [
  { key: "workoutReminders", label: "Workout Reminders", description: "Daily reminders to log your workouts" },
  { key: "streakAlerts", label: "Streak Alerts", description: "Get notified before your streak breaks" },
  { key: "leaderboardUpdates", label: "Leaderboard Updates", description: "When your gym rank changes" },
  { key: "newFeatures", label: "New Features", description: "Product updates and announcements" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    workoutReminders: true,
    streakAlerts: true,
    leaderboardUpdates: false,
    newFeatures: false,
  });

  const toggle = (key: string) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <main className="min-h-screen bg-[var(--app-bg)] pb-10">
      <div className="w-full max-w-md mx-auto px-5 pt-12 flex flex-col gap-5">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--app-card)] border border-[var(--app-border-md)] hover:bg-[var(--app-hover)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: "#d9ee4f" }} />
          </button>
          <h1 className="text-[var(--app-text)] text-2xl font-black">Notifications</h1>
        </div>

        <div className="bg-[var(--app-card)] rounded-[24px] border border-[var(--app-border)] overflow-hidden">
          {NOTIFICATION_OPTIONS.map((opt, i) => (
            <div
              key={opt.key}
              className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-[var(--app-border)]" : ""}`}
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[var(--app-text)] text-sm font-semibold">{opt.label}</p>
                <p className="text-[var(--app-text-muted)] text-xs mt-0.5">{opt.description}</p>
              </div>
              <button
                onClick={() => toggle(opt.key)}
                className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
                style={{ backgroundColor: prefs[opt.key] ? "#d9ee4f" : "#3a3a3c" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-200"
                  style={{
                    backgroundColor: prefs[opt.key] ? "#1a2000" : "white",
                    transform: prefs[opt.key] ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
