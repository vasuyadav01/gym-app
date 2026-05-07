"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ChevronLeft, Timer, Check } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import BottomNav from "../../components/BottomNav";
import { INFLUENCERS, type Influencer, type ProgramDay } from "@/data/influencers";

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700",
  Intermediate: "bg-amber-100 text-amber-700",
  Advanced: "bg-red-100 text-red-600",
};

// Map influencer exercise names to proper category/equipment for Firestore
function inferExerciseMeta(name: string): {
  category: string;
  equipment: string;
  primaryMuscles: string[];
} {
  const n = name.toLowerCase();
  if (n.includes("squat") || n.includes("lunge") || n.includes("leg press") || n.includes("leg extension") || n.includes("leg curl") || n.includes("calf") || n.includes("deadlift") || n.includes("rdl") || n.includes("hip thrust") || n.includes("glute")) {
    return { category: "Legs", equipment: n.includes("dumbbell") ? "dumbbell" : n.includes("cable") ? "cable" : n.includes("machine") || n.includes("press") && n.includes("leg") ? "machine" : "barbell", primaryMuscles: ["quads", "glutes"] };
  }
  if (n.includes("bench") || n.includes("chest") || n.includes("pec") || n.includes("fly") || n.includes("push-up") || n.includes("push up")) {
    return { category: "Chest", equipment: n.includes("dumbbell") ? "dumbbell" : n.includes("cable") ? "cable" : n.includes("machine") ? "machine" : "barbell", primaryMuscles: ["chest"] };
  }
  if (n.includes("pull-up") || n.includes("pull up") || n.includes("chin") || n.includes("row") || n.includes("lat pull") || n.includes("pulldown") || n.includes("deadlift")) {
    return { category: "Back", equipment: n.includes("dumbbell") ? "dumbbell" : n.includes("cable") || n.includes("pulldown") ? "cable" : n.includes("machine") ? "machine" : "barbell", primaryMuscles: ["back", "lats"] };
  }
  if (n.includes("shoulder") || n.includes("press") && !n.includes("bench") || n.includes("lateral") || n.includes("delt") || n.includes("face pull") || n.includes("overhead") && !n.includes("triceps") || n.includes("shrug") || n.includes("arnold")) {
    return { category: "Shoulders", equipment: n.includes("dumbbell") ? "dumbbell" : n.includes("cable") ? "cable" : n.includes("machine") ? "machine" : "barbell", primaryMuscles: ["shoulders"] };
  }
  if (n.includes("curl") || n.includes("bicep") || n.includes("tricep") || n.includes("skull") || n.includes("pushdown") || n.includes("dip") || n.includes("extension") && n.includes("tricep")) {
    return { category: "Arms", equipment: n.includes("cable") ? "cable" : n.includes("barbell") || n.includes("ez") || n.includes("skull") ? "barbell" : n.includes("machine") ? "machine" : "dumbbell", primaryMuscles: n.includes("curl") || n.includes("bicep") ? ["biceps"] : ["triceps"] };
  }
  if (n.includes("plank") || n.includes("crunch") || n.includes("ab") || n.includes("core") || n.includes("leg raise")) {
    return { category: "Core", equipment: "bodyweight", primaryMuscles: ["abs"] };
  }
  return { category: "Chest", equipment: "barbell", primaryMuscles: [] };
}

function buildRoutineExercises(program: ProgramDay[]) {
  const allExercises: object[] = [];
  program.forEach((day, dayIdx) => {
    day.exercises.forEach((ex) => {
      const meta = inferExerciseMeta(ex.name);
      allExercises.push({
        exerciseId: `${ex.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-day${dayIdx + 1}`,
        name: ex.name,
        category: meta.category,
        equipment: meta.equipment,
        primaryMuscles: meta.primaryMuscles,
        secondaryMuscles: [],
        notes: `${day.name} — ${ex.sets}×${ex.reps} · Rest ${ex.rest}${ex.notes ? ` · ${ex.notes}` : ""}`,
        sets: Array.from({ length: ex.sets }, () => ({
          weight: 0,
          reps: parseInt(ex.reps) || 10,
          completed: false,
          isPR: false,
        })),
      });
    });
  });
  return allExercises;
}

export default function ExploreDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [gymId, setGymId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const influencer = INFLUENCERS.find((p) => p.id === params.id) as Influencer | undefined;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.data() as { gymId?: string } | undefined;
        setGymId(data?.gymId ?? null);
      } catch {
        // no gym — user can still view program
      }
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addAsRoutine = async () => {
    if (!user) { router.push("/login"); return; }
    if (!gymId) { showToast("Join a gym first to save routines"); return; }
    if (!influencer) return;

    setSaving(true);
    try {
      const exercises = buildRoutineExercises(influencer.program);
      const routineRef = doc(collection(db, "workouts"));
      await setDoc(routineRef, {
        name: `${influencer.name} — ${influencer.split}`,
        gymId,
        ownerId: user.uid,
        ownerEmail: user.email ?? "",
        exercises,
        totalVolume: 0,
        totalWeight: 0,
        isTemplate: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      showToast("Routine added! Check your dashboard 💪");
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (err) {
      console.error(err);
      showToast("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!influencer) {
    return (
      <main className="min-h-screen bg-[#f4f4f5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-sm">Program not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-500 font-semibold text-sm"
          >
            ← Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f5] pb-36">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-300 max-w-xs text-center">
          {toast}
        </div>
      )}

      <div className="w-full max-w-md mx-auto">

        {/* Back button */}
        <div className="px-4 pt-12 pb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Explore</span>
          </button>
        </div>

        {/* Hero card */}
        <div className="mx-4 mb-5 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          {/* Accent stripe */}
          <div className="h-2 w-full" style={{ background: influencer.accentColor }} />

          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm"
                style={{ background: `${influencer.accentColor}20` }}
              >
                {influencer.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-slate-900 font-bold text-lg leading-tight">{influencer.name}</h1>
                <p className="text-slate-500 text-xs mt-0.5 leading-tight">{influencer.title}</p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      DIFFICULTY_COLOR[influencer.difficulty]
                    }`}
                  >
                    {influencer.difficulty}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                    {influencer.category}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                    {influencer.daysPerWeek} days/week
                  </span>
                </div>
              </div>
            </div>

            {/* Split */}
            <div className="mt-4 bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Split</p>
              <p className="text-slate-800 font-semibold text-sm">{influencer.split}</p>
            </div>

            {/* Quote */}
            <blockquote className="mt-4 border-l-4 border-blue-500 pl-4 py-1">
              <p className="text-slate-600 text-sm italic leading-relaxed">
                &ldquo;{influencer.quote}&rdquo;
              </p>
            </blockquote>
          </div>
        </div>

        {/* Program days */}
        <div className="px-4 mb-4">
          <h2 className="text-slate-900 font-bold text-base mb-3">Weekly Program</h2>
          <div className="flex flex-col gap-3">
            {influencer.program.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Day header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      {day.day}
                    </p>
                    <p className="text-slate-900 font-bold text-base">{day.name}</p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                    {day.exercises.length} exercises
                  </span>
                </div>

                {/* Exercises */}
                <div className="divide-y divide-slate-50">
                  {day.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-semibold text-sm">{ex.name}</p>
                          {ex.notes && (
                            <p className="text-slate-400 text-xs mt-0.5 leading-tight">{ex.notes}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-slate-800 font-bold text-sm">
                            {ex.sets}×{ex.reps}
                          </p>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <Timer className="w-3 h-3 text-slate-300" />
                            <p className="text-slate-400 text-[11px]">{ex.rest}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed "Add as Routine" button */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-20">
        <div className="max-w-md mx-auto">
          <button
            onClick={addAsRoutine}
            disabled={saving || saved}
            className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98] ${
              saved
                ? "bg-emerald-500 shadow-[0_4px_20px_rgba(34,197,94,0.4)]"
                : "bg-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:bg-blue-600"
            } disabled:opacity-60`}
          >
            {saved ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Routine Saved!
              </span>
            ) : saving ? (
              "Saving…"
            ) : (
              `+ Add ${influencer.name.split(" ")[0]}'s Program as Routine`
            )}
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
