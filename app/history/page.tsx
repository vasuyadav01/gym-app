"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import BottomNav from "../components/BottomNav";
import WorkoutHistory from "../components/WorkoutHistory";

export default function HistoryPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[var(--app-bg)] pb-28 pt-12">
      <section className="mx-auto flex max-w-md flex-col gap-5 px-5">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--app-card)] border border-[var(--app-border-md)] hover:bg-[var(--app-hover)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: "#d9ee4f" }} />
          </button>
          <div>
            <p className="text-[var(--app-text-muted)] text-xs font-semibold uppercase tracking-widest">Fitness</p>
            <h1 className="text-[var(--app-text)] text-2xl font-black">History</h1>
          </div>
        </div>
        <WorkoutHistory />
      </section>
      <BottomNav />
    </main>
  );
}
