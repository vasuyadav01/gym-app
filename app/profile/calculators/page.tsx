"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import OneRMCalculator from "@/app/components/OneRMCalculator";
import PlateCalculator from "@/app/components/PlateCalculator";

export default function CalculatorsPage() {
  const router = useRouter();

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
          <h1 className="text-[var(--app-text)] text-2xl font-black">Training Calculators</h1>
        </div>
        <OneRMCalculator />
        <PlateCalculator />
      </div>
    </main>
  );
}
