"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check } from "lucide-react";

export default function UnitsPage() {
  const router = useRouter();
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");

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
          <h1 className="text-[var(--app-text)] text-2xl font-black">Units</h1>
        </div>

        <div className="bg-[var(--app-card)] rounded-[24px] border border-[var(--app-border)] overflow-hidden">
          {(["kg", "lbs"] as const).map((u, i) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--app-hover)] active:bg-[var(--app-hover)] transition-colors ${i > 0 ? "border-t border-[var(--app-border)]" : ""}`}
            >
              <div>
                <p className="text-[var(--app-text)] text-sm font-semibold text-left">
                  {u === "kg" ? "Kilograms (kg)" : "Pounds (lbs)"}
                </p>
                <p className="text-[var(--app-text-muted)] text-xs mt-0.5 text-left">
                  {u === "kg" ? "Used in most countries worldwide" : "Used primarily in the United States"}
                </p>
              </div>
              {unit === u && <Check className="w-5 h-5 shrink-0" style={{ color: "#d9ee4f" }} />}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
