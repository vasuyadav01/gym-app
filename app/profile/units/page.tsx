"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check } from "lucide-react";

export default function UnitsPage() {
  const router = useRouter();
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");

  return (
    <main className="min-h-screen bg-[#131314] pb-10">
      <div className="w-full max-w-md mx-auto px-5 pt-12 flex flex-col gap-5">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1c1b1c] border border-white/10 hover:bg-[#252528] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: "#d9ee4f" }} />
          </button>
          <h1 className="text-white text-2xl font-black">Units</h1>
        </div>

        <div className="bg-[#1c1b1c] rounded-[24px] border border-white/5 overflow-hidden">
          {(["kg", "lbs"] as const).map((u, i) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-[#252528] active:bg-[#2a2a2b] transition-colors ${i > 0 ? "border-t border-white/5" : ""}`}
            >
              <div>
                <p className="text-white text-sm font-semibold text-left">
                  {u === "kg" ? "Kilograms (kg)" : "Pounds (lbs)"}
                </p>
                <p className="text-neutral-500 text-xs mt-0.5 text-left">
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
