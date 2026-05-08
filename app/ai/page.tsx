"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Sparkles, RotateCcw, ChevronDown, Play, Send, Bell, Calendar, Zap } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import BottomNav from "../components/BottomNav";
import { workoutDraftKey } from "../components/workoutTypes";
import type { WorkoutExercise, WorkoutSet } from "../components/workoutTypes";
import { getWorkoutPlan } from "@/lib/workoutTemplates";

type FitnessLevel = "Beginner" | "Intermediate" | "Advanced";
type Goal = "Lose Weight" | "Build Muscle" | "Stay Fit" | "Get Strong";
type Days = "3" | "4" | "5" | "6";
type Equipment = "Full Gym" | "Dumbbells Only" | "No Equipment";

type Profile = {
  fitnessLevel: FitnessLevel;
  goal: Goal;
  days: Days;
  equipment: Equipment;
};

type Exercise = {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
};

type WorkoutDay = {
  day: string;
  focus: string;
  exercises: Exercise[];
};

type Plan = {
  planName: string;
  days: WorkoutDay[];
};

type Message = { role: "user" | "assistant"; content: string };
type PageState = "loading" | "onboarding" | "plan";

const STEPS = [
  { key: "fitnessLevel" as const, question: "What's your fitness level?",       options: ["Beginner", "Intermediate", "Advanced"] },
  { key: "goal"         as const, question: "What's your goal?",                options: ["Lose Weight", "Build Muscle", "Stay Fit", "Get Strong"] },
  { key: "days"         as const, question: "How many days per week?",           options: ["3", "4", "5", "6"] },
  { key: "equipment"    as const, question: "What equipment do you have?",       options: ["Full Gym", "Dumbbells Only", "No Equipment"] },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getTodayName() { return DAY_NAMES[new Date().getDay()]; }

function cleanText(text: string) {
  return text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^\s*[-*+]\s/gm, "• ")
    .replace(/^\s*\d+\.\s/gm, "")
    .trim();
}

function convertToWorkoutExercises(exercises: Exercise[]): WorkoutExercise[] {
  return exercises.map((ex) => ({
    exerciseId: `ai-${ex.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: ex.name,
    category: "Strength",
    equipment: "varied",
    primaryMuscles: [],
    secondaryMuscles: [],
    notes: ex.notes ?? `${ex.sets} sets × ${ex.reps} · Rest ${ex.rest}`,
    sets: Array.from({ length: ex.sets }, (): WorkoutSet => ({
      weight: 0,
      reps: parseInt(ex.reps.split("-")[0]) || 10,
      completed: false,
      isPR: false,
    })),
  }));
}

// ── Shared Header ─────────────────────────────────────────────────────────────

function PageHeader({ initials }: { initials: string }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-40px)] max-w-[380px]">
      <div
        className="rounded-full px-5 h-12 flex items-center justify-between border border-white/10"
        style={{ backgroundColor: "#1c1b1c", boxShadow: "0 4px 32px rgba(0,0,0,0.5)" }}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
          <span className="text-[#131314] text-xs font-black">{initials}</span>
        </div>
        <span className="text-base font-black italic tracking-tighter text-[#d9ee4f]">VISFIT</span>
        <button className="text-[#d9ee4f] hover:opacity-80 transition-opacity" aria-label="Notifications">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AIPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gymId, setGymId] = useState("");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [plan, setPlan] = useState<Plan | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [planCollapsed, setPlanCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const todayName = getTodayName();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setGymId(data?.gymId ?? "");
            const saved = data?.aiPlan;
            if (saved && saved.days && Array.isArray(saved.days)) {
              setPlan(saved as Plan);
              setPageState("plan");
              setPlanCollapsed(true);
              setMessages([{ role: "assistant", content: "Your plan is ready! Ask me anything about your workout." }]);
              const todayIdx = (saved.days as WorkoutDay[]).findIndex((d) => d.day === getTodayName());
              if (todayIdx >= 0) setExpandedDays(new Set([todayIdx]));
              return;
            }
          }
        } catch (e) {
          console.error("Firestore load error:", e);
        }
      }
      setPageState("onboarding");
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOption = async (value: string) => {
    const step = STEPS[currentStep];
    const newProfile = { ...profile, [step.key]: value } as Partial<Profile>;
    setProfile(newProfile);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      await generatePlan(newProfile as Profile);
    }
  };

  const generatePlan = async (finalProfile: Profile) => {
    setError(null);

    const generated = getWorkoutPlan(
      finalProfile.fitnessLevel,
      finalProfile.goal,
      finalProfile.days,
      finalProfile.equipment,
    );
    setPlan(generated);
    setPageState("plan");
    setPlanCollapsed(true);
    setMessages([{ role: "assistant", content: "Your plan is ready! Ask me anything about your workout." }]);

    const todayIdx = generated.days.findIndex((d) => d.day === getTodayName());
    if (todayIdx >= 0) setExpandedDays(new Set([todayIdx]));

    if (user) {
      const todayDay = generated.days.find((d) => d.day === getTodayName()) ?? null;
      await setDoc(doc(db, "users", user.uid), { aiPlan: generated, todayWorkout: todayDay }, { merge: true }).catch(() => null);
      await addDoc(collection(db, "workouts"), {
        ownerId: user.uid, gymId,
        name: generated.planName,
        date: new Date().toISOString(),
        exercises: generated.days.flatMap((d) => d.exercises).map((e) => ({
          name: e.name,
          sets: Array(e.sets).fill({ reps: 0, weight: 0, completed: false }),
        })),
        createdAt: serverTimestamp(),
      }).catch(() => null);
      showToast("Workout saved to your routines!");
    }
  };

  const resetPlan = async () => {
    setPlan(null); setProfile({}); setCurrentStep(0);
    setExpandedDays(new Set()); setPlanCollapsed(false);
    setMessages([]); setPageState("onboarding");
    if (user) {
      await setDoc(doc(db, "users", user.uid), { aiPlan: null, todayWorkout: null }, { merge: true }).catch(() => null);
    }
  };

  const toggleDay = (idx: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const startWorkout = (exercises: Exercise[]) => {
    localStorage.setItem(workoutDraftKey, JSON.stringify(convertToWorkoutExercises(exercises)));
    router.push("/workout/new");
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatLoading(true);

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "chat", planContext: JSON.stringify(plan, null, 2), messages: newMessages }),
    }).catch(() => null);

    const data = res ? await res.json().catch(() => null) : null;
    const reply = res?.ok && data?.content ? data.content : "Failed to get response. Try again.";
    setMessages([...newMessages, { role: "assistant", content: reply }]);
    setChatLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    await sendMessage(text);
  };

  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <main className="min-h-screen bg-[#131314] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#d9ee4f] border-t-transparent animate-spin" />
          <span className="text-[#d9ee4f] text-xs font-black tracking-widest uppercase">VISFIT</span>
        </div>
      </main>
    );
  }

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (pageState === "onboarding") {
    const step = STEPS[currentStep];
    return (
      <main className="min-h-screen bg-[#131314] flex flex-col pb-28">
        <PageHeader initials={initials} />

        <div className="flex-1 flex flex-col justify-center px-5 pt-24 max-w-md mx-auto w-full">
          <div className="w-12 h-12 rounded-[16px] bg-[#d9ee4f] flex items-center justify-center mb-8">
            <Sparkles className="w-6 h-6 text-[#1a2000]" />
          </div>

          {/* Progress pills */}
          <div className="flex gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i <= currentStep ? "bg-[#d9ee4f] w-6" : "bg-[#2c2c2e] w-2"
                }`}
              />
            ))}
          </div>

          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
            {currentStep + 1} of {STEPS.length}
          </p>
          <h2 className="text-white text-2xl font-bold mb-6">{step.question}</h2>

          {error && (
            <div className="bg-[#1c1b1c] border border-red-900/40 text-red-400 text-sm p-4 rounded-[20px] mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {step.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleOption(opt)}
                className="w-full bg-[#1c1b1c] text-[#e5e2e3] font-semibold py-4 px-5 rounded-[20px] border border-[#2c2c2e] hover:border-[#d9ee4f]/50 hover:text-[#d9ee4f] active:scale-[0.98] transition-all text-left"
              >
                {opt}
              </button>
            ))}
          </div>

          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              className="mt-5 text-sm text-[#d9ee4f] font-semibold"
            >
              ← Back
            </button>
          )}
        </div>
        <BottomNav />
      </main>
    );
  }

  // ── Plan + Chat ────────────────────────────────────────────────────────────
  const todayDay = plan?.days.find((d) => d.day === todayName);
  const planDaysCount = plan?.days.length ?? 0;
  const intensityLabel =
    profile?.fitnessLevel ??
    (plan?.planName?.toLowerCase().includes("beginner")
      ? "Beginner"
      : plan?.planName?.toLowerCase().includes("advanced")
      ? "Advanced"
      : "Intermediate");

  return (
    <main className="min-h-screen bg-[#131314] font-sans">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#d9ee4f] text-[#1a2000] text-sm font-black px-4 py-2.5 rounded-2xl shadow-lg">
          ✓ {toast}
        </div>
      )}

      <PageHeader initials={initials} />

      {/* Scrollable body */}
      <div className="pt-24 px-5 max-w-md mx-auto pb-[160px] flex flex-col gap-6">

        {/* Page title */}
        <section className="pt-4">
          <h1 className="text-white font-bold text-[32px] leading-tight tracking-tight mb-1">Elite Coach</h1>
          <p className="text-neutral-500 text-sm">Your performance, engineered by AI.</p>
        </section>

        {/* Plan Card */}
        <section>
          <div className="bg-[#1c1b1c] rounded-[24px] p-6 relative overflow-hidden">
            {/* Refresh button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={(e) => { e.stopPropagation(); resetPlan(); }}
                title="Redo plan"
                className="w-10 h-10 rounded-full bg-[#353436] flex items-center justify-center text-white hover:text-[#d9ee4f] active:rotate-180 active:scale-95 transition-all duration-500"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Plan header (clickable to collapse) */}
            <div className="cursor-pointer" onClick={() => setPlanCollapsed((c) => !c)}>
              <div className="flex flex-col gap-2 pr-12">
                <span className="text-[#d9ee4f] text-[10px] font-bold uppercase tracking-[0.1em]">Active Plan</span>
                <h2 className="text-white font-semibold text-xl leading-snug">{plan?.planName}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#d9ee4f]" />
                    <span className="text-[#e5e2e3] text-xs">{planDaysCount} days/week</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#d9ee4f]" />
                    <span className="text-[#e5e2e3] text-xs">{intensityLabel}</span>
                  </div>
                  <ChevronDown
                    className="w-4 h-4 text-neutral-500 ml-auto transition-transform duration-300"
                    style={{ transform: planCollapsed ? "rotate(0deg)" : "rotate(180deg)" }}
                  />
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-5 h-1.5 w-full bg-[#353436] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#d9ee4f] rounded-full"
                  style={{ width: "25%", boxShadow: "0 0 10px rgba(217,238,79,0.3)" }}
                />
              </div>
            </div>

            {/* Expanded days */}
            {!planCollapsed && (
              <div className="mt-5 space-y-3 border-t border-[#2c2c2e] pt-4">
                {/* Today's highlight */}
                {todayDay && (
                  <div className="bg-[#d9ee4f]/10 border border-[#d9ee4f]/20 rounded-[20px] p-4 mb-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[#d9ee4f] text-[10px] font-bold uppercase tracking-wider">Today · {todayDay.day}</p>
                        <p className="text-white font-semibold text-sm mt-0.5">{todayDay.focus}</p>
                      </div>
                      <button
                        onClick={() => startWorkout(todayDay.exercises)}
                        className="flex items-center gap-1.5 bg-[#d9ee4f] text-[#1a2000] text-xs font-black px-3 py-1.5 rounded-full active:scale-95 transition-all"
                      >
                        <Play className="w-3 h-3 fill-[#1a2000] shrink-0" />
                        Start
                      </button>
                    </div>
                    {todayDay.exercises.slice(0, 4).map((ex, i) => (
                      <div key={i} className={`flex items-center justify-between py-1.5 ${i > 0 ? "border-t border-[#d9ee4f]/10" : ""}`}>
                        <span className="text-[#e5e2e3] text-xs">{ex.name}</span>
                        <span className="text-neutral-500 text-xs">{ex.sets} × {ex.reps}</span>
                      </div>
                    ))}
                    {todayDay.exercises.length > 4 && (
                      <p className="text-neutral-500 text-[10px] mt-1.5">+{todayDay.exercises.length - 4} more exercises</p>
                    )}
                  </div>
                )}

                {/* All workout days */}
                {plan?.days.map((day, i) => {
                  const isToday = day.day === todayName;
                  const isExpanded = expandedDays.has(i);
                  return (
                    <div
                      key={i}
                      className={`rounded-[20px] border transition-colors ${
                        isToday ? "bg-[#d9ee4f]/10 border-[#d9ee4f]/20" : "bg-[#252528] border-[#2c2c2e]"
                      }`}
                    >
                      <button onClick={() => toggleDay(i)} className="w-full flex items-center justify-between p-4">
                        <div className="flex items-center gap-2.5">
                          {isToday && <span className="w-2 h-2 rounded-full bg-[#d9ee4f] shrink-0" />}
                          <div className="text-left">
                            <p className={`font-bold text-sm ${isToday ? "text-[#d9ee4f]" : "text-white"}`}>{day.day}</p>
                            <p className="text-neutral-500 text-xs mt-0.5">{day.focus}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-500 text-xs">{day.exercises.length} ex</span>
                          <ChevronDown
                            className="w-4 h-4 text-neutral-500 transition-transform duration-200"
                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-[#2c2c2e]">
                          {day.exercises.map((ex, j) => (
                            <div key={j} className={`flex items-start justify-between py-3 ${j > 0 ? "border-t border-[#2c2c2e]" : ""}`}>
                              <div className="flex-1 min-w-0 pr-4">
                                <p className="text-sm font-medium text-[#e5e2e3]">{ex.name}</p>
                                {ex.notes && <p className="text-xs text-neutral-500 mt-0.5 truncate">{ex.notes}</p>}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-[#e5e2e3]">{ex.sets} × {ex.reps}</p>
                                <p className="text-xs text-neutral-500">rest {ex.rest}</p>
                              </div>
                            </div>
                          ))}
                          {isToday && (
                            <button
                              onClick={() => startWorkout(day.exercises)}
                              className="w-full mt-2 bg-[#d9ee4f] text-[#1a2000] text-sm font-black py-2.5 rounded-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                              <Play className="w-3.5 h-3.5 fill-[#1a2000]" />
                              Start Today&apos;s Workout
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Chat Messages */}
        <section className="flex flex-col gap-5">
          {messages.map((msg, i) =>
            msg.role === "assistant" ? (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-xl bg-[#d9ee4f] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#1a2000]" />
                </div>
                <div className="bg-[#2a2a2b] rounded-t-[20px] rounded-br-[20px] p-4 text-[#e5e2e3] text-sm leading-relaxed flex-1">
                  {cleanText(msg.content)}
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-3 items-start justify-end">
                <div className="bg-[#d9ee4f]/10 border border-[#d9ee4f]/20 rounded-t-[20px] rounded-bl-[20px] p-4 text-[#d9ee4f] text-sm leading-relaxed">
                  {msg.content}
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#353436] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#e5e2e3] text-xs font-bold">{initials}</span>
                </div>
              </div>
            )
          )}

          {/* Typing indicator */}
          {chatLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-xl bg-[#d9ee4f] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#1a2000]" />
              </div>
              <div className="bg-[#2a2a2b] rounded-t-[20px] rounded-br-[20px] p-4 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {messages.length === 0 && !chatLoading && (
            <div className="text-center py-6">
              <p className="text-neutral-500 text-sm">Ask anything about your plan...</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* Suggested Actions */}
        {messages.length <= 1 && (
          <div className="overflow-x-auto -mx-5 px-5" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-2 whitespace-nowrap">
              {["Make day 1 harder", "Replace bench press", "Shorten workout", "Focus on mobility"].map((s) => (
                <button
                  key={s}
                  onClick={() => setChatInput(s)}
                  className="px-4 py-2 bg-[#2a2a2b] rounded-full border border-[#464835]/30 text-[#e5e2e3] text-xs font-medium hover:border-[#d9ee4f]/50 hover:text-[#d9ee4f] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Floating chat input above pill nav */}
      <div className="fixed bottom-[100px] left-0 right-0 z-20 px-5">
        <div className="max-w-xs mx-auto relative group">
          <div className="absolute inset-0 bg-[#d9ee4f]/5 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
          <div
            className="relative flex items-center gap-2 rounded-2xl p-2 transition-all"
            style={{
              backgroundColor: "#1c1b1c",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask your AI Coach..."
              className="flex-grow bg-transparent border-none focus:ring-0 text-[#e5e2e3] placeholder:text-neutral-500 px-3 text-sm outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
              }}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-40 transition-all shrink-0"
              style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
