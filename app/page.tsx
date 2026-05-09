"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import BottomNav from "./components/BottomNav";
import Link from "next/link";
import { Bell, Play, TrendingUp, TrendingDown, Zap, Flame, Clock, ChevronRight, Store } from "lucide-react";
import { workoutDraftKey } from "./components/workoutTypes";
import type { WorkoutExercise, WorkoutSet } from "./components/workoutTypes";

// ── Types ──────────────────────────────────────────────────────────────────

type RawSet = { reps?: number; weight?: number };
type RawExercise = { name?: string; sets?: RawSet[] | number; reps?: number; weight?: number };
type Workout = {
  id: string; name?: string; startTime?: string; endTime?: string;
  duration?: number; date?: string; exercises?: RawExercise[]; totalVolume?: number;
};
type TodayExercise = { name: string; sets: number; reps: string };
type TodayWorkout = { day: string; focus: string; exercises: TodayExercise[] } | null;
type Shop = { id: string; name: string; area: string; city: string; verified: boolean };

// ── Helpers ────────────────────────────────────────────────────────────────

const getDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const getWeekDays = () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const off = today.getDay() === 0 ? -6 : 1 - today.getDay();
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + off + i); return d; });
};

const getVolume = (e: RawExercise): number => {
  if (Array.isArray(e.sets)) return e.sets.reduce((s, x) => s + (x.weight ?? 0) * (x.reps ?? 0), 0);
  return (Number(e.sets) || 0) * (e.reps ?? 0) * (e.weight ?? 0);
};

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutDays, setWorkoutDays] = useState<Set<string>>(new Set());
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  const [totalGrowth, setTotalGrowth] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [totalDurationMin, setTotalDurationMin] = useState(0);
  const [streak, setStreak] = useState(0);
  const [thisWeekWorkouts, setThisWeekWorkouts] = useState(0);
  const [lastWeekWorkouts, setLastWeekWorkouts] = useState(0);
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout>(null);
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (cu) => {
      if (!cu) { router.replace("/login"); return; }
      if (cu.email === "vasuyadav2003@gmail.com") { router.replace("/admin"); return; }
      setUser(cu);

      const userSnap = await getDoc(doc(db, "users", cu.uid)).catch(() => null);
      const userData = userSnap?.data() as { gymId?: string; todayWorkout?: TodayWorkout; role?: string } | undefined;

      // Role-based routing
      if (!userData?.role)                  { router.replace("/role-select");     setLoading(false); return; }
      if (userData.role === "gym_owner")    { router.replace("/gym-owner");       setLoading(false); return; }
      if (userData.role === "shop_owner")   { router.replace("/shop/dashboard");  setLoading(false); return; }
      if (userData?.todayWorkout) setTodayWorkout(userData.todayWorkout);

      const gymId = userData?.gymId;
      if (gymId) {
        const snap = await getDocs(
          query(collection(db, "workouts"), where("gymId", "==", gymId), where("ownerId", "==", cu.uid))
        ).catch(() => null);

        if (snap) {
          const workouts = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Workout[];
          setAllWorkouts(workouts);
          setTotalWorkouts(workouts.length);

          const now = new Date(); now.setHours(23, 59, 59, 999);
          const thisMonday = new Date(); thisMonday.setHours(0, 0, 0, 0);
          const wd = thisMonday.getDay();
          thisMonday.setDate(thisMonday.getDate() - (wd === 0 ? 6 : wd - 1));
          const lastSun = new Date(thisMonday); lastSun.setDate(lastSun.getDate() - 1); lastSun.setHours(23, 59, 59, 999);
          const lastMon = new Date(lastSun); lastMon.setDate(lastMon.getDate() - 6); lastMon.setHours(0, 0, 0, 0);

          const days = new Set<string>();
          let vol = 0, sets = 0, twCount = 0, lwCount = 0, twVol = 0, lwVol = 0, durMin = 0;

          workouts.forEach((w) => {
            const ds = w.startTime ?? w.date;
            if (ds) {
              const d = new Date(ds);
              if (!isNaN(d.getTime())) {
                days.add(getDateKey(d));
                if (d >= thisMonday && d <= now) twCount++;
                if (d >= lastMon && d <= lastSun) lwCount++;
              }
            }
            const wv = w.exercises?.reduce((s, e) => s + getVolume(e), 0) ?? 0;
            vol += wv;
            durMin += w.duration ?? 0;
            w.exercises?.forEach((e) => { sets += Array.isArray(e.sets) ? e.sets.length : 0; });
            const ds2 = w.startTime ?? w.date;
            if (ds2) {
              const d2 = new Date(ds2);
              if (!isNaN(d2.getTime())) {
                if (d2 >= thisMonday && d2 <= now) twVol += wv;
                if (d2 >= lastMon && d2 <= lastSun) lwVol += wv;
              }
            }
          });

          setWorkoutDays(days); setTotalVolume(vol); setTotalSets(sets);
          setTotalDurationMin(durMin);
          setThisWeekWorkouts(twCount); setLastWeekWorkouts(lwCount);

          let s = 0;
          const today = new Date(); today.setHours(0, 0, 0, 0);
          for (let i = 0; i < 365; i++) {
            const d = new Date(today); d.setDate(today.getDate() - i);
            if (days.has(getDateKey(d))) s++; else break;
          }
          setStreak(s);
          setTotalGrowth(lwVol === 0 ? (twVol > 0 ? 100 : 0) : Math.round(((twVol - lwVol) / lwVol) * 100));
        }
      }

      const shopsSnap = await getDocs(
        query(collection(db, "shops"), orderBy("createdAt", "desc"), limit(5))
      ).catch(() => null);
      if (shopsSnap) setShops(shopsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop)));

      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const barData = useMemo(() => {
    const thisMonday = new Date(); thisMonday.setHours(0, 0, 0, 0);
    const wd = thisMonday.getDay();
    thisMonday.setDate(thisMonday.getDate() - (wd === 0 ? 6 : wd - 1));
    const lastMonday = new Date(thisMonday); lastMonday.setDate(lastMonday.getDate() - 7);

    const curr = Array(7).fill(0);
    const last = Array(7).fill(0);
    allWorkouts.forEach((w) => {
      const ds = w.startTime ?? w.date;
      if (!ds) return;
      const d = new Date(ds); if (isNaN(d.getTime())) return;
      d.setHours(0, 0, 0, 0);
      const wv = w.exercises?.reduce((s, e) => s + getVolume(e), 0) ?? 80;
      const ti = Math.floor((d.getTime() - thisMonday.getTime()) / 86400000);
      const li = Math.floor((d.getTime() - lastMonday.getTime()) / 86400000);
      if (ti >= 0 && ti < 7) curr[ti] += wv;
      if (li >= 0 && li < 7) last[li] += wv;
    });
    const maxVal = Math.max(...curr, ...last, 1);
    return {
      curr: curr.map((v) => v > 0 ? Math.max(8, Math.round((v / maxVal) * 48)) : 2),
      last: last.map((v) => v > 0 ? Math.max(8, Math.round((v / maxVal) * 48)) : 2),
    };
  }, [allWorkouts]);

  const weekDays = getWeekDays();
  const todayKey = getDateKey(new Date());
  const calories = Math.round(totalVolume * 0.004);
  const displayName = user?.displayName || user?.email?.split("@")[0] || "there";
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();

  const progressPct = Math.min(
    Math.round(((Math.min(calories / 1200, 1) + Math.min(thisWeekWorkouts / 5, 1) + Math.min(streak / 30, 1)) / 3) * 100),
    100,
  );

  const durationHours = Math.floor(totalDurationMin / 60);
  const durationMins = totalDurationMin % 60;
  const durationDisplay = totalDurationMin > 0 ? `${durationHours}h ${durationMins}m` : "0h 0m";

  const handleStart = () => {
    const exList = todayWorkout
      ? todayWorkout.exercises.slice(0, 4).map((ex) => ({ name: ex.name, sub: `${ex.sets} sets × ${ex.reps}` }))
      : [
          { name: "Bench Press",    sub: "4 sets × 10" },
          { name: "Shoulder Press", sub: "3 sets × 12" },
          { name: "Tricep Dips",    sub: "3 sets × 15" },
          { name: "Cable Flyes",    sub: "3 sets × 12" },
        ];
    const draft: WorkoutExercise[] = exList.map((ex) => {
      const setsMatch = ex.sub.match(/(\d+)\s*sets?/i);
      const repsMatch = ex.sub.match(/[×x]\s*(\d+)/i);
      const setCount = setsMatch ? parseInt(setsMatch[1]) : 3;
      const repCount = repsMatch ? parseInt(repsMatch[1]) : 10;
      return {
        exerciseId: `home-${ex.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: ex.name,
        category: "Strength",
        equipment: "varied",
        primaryMuscles: [],
        secondaryMuscles: [],
        notes: ex.sub,
        sets: Array.from({ length: setCount }, (): WorkoutSet => ({
          weight: 0, reps: repCount, completed: false, isPR: false,
        })),
      };
    });
    localStorage.setItem(workoutDraftKey, JSON.stringify(draft));
    router.push("/workout/new");
  };

  void totalSets;
  void lastWeekWorkouts;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#131314]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-lime-400 border-t-transparent animate-spin" />
          <span className="text-lime-400 text-xs font-black tracking-widest uppercase">VISFIT</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#131314] pb-28">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#131314]/80 backdrop-blur-md flex justify-between items-center px-5 py-4 border-b border-white/5">
        <Link href="/profile">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 ring-2 ring-lime-400/30 flex items-center justify-center">
            <span className="text-[#131314] text-xs font-black">{initials}</span>
          </div>
        </Link>
        <h1 className="text-lime-400 font-black text-base tracking-[0.25em] uppercase">VISFIT</h1>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" aria-label="Notifications">
          <Bell className="w-5 h-5 text-lime-400" />
        </button>
      </header>

      <div className="px-4 pt-4 flex flex-col gap-4">

        {/* Weekly schedule strip */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {weekDays.slice(0, 6).map((date) => {
            const key = getDateKey(date);
            const isToday = key === todayKey;
            const hasWorkout = workoutDays.has(key);
            return (
              <div
                key={key}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-2xl transition-all ${
                  isToday
                    ? "bg-[#d9ee4f]"
                    : hasWorkout
                    ? "bg-[#201f20] ring-1 ring-lime-400/20"
                    : "bg-[#201f20]/60"
                }`}
              >
                <span className={`text-[9px] font-bold tracking-wider ${isToday ? "text-[#1a2000]" : "text-[#636366]"}`}>
                  {date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3).toUpperCase()}
                </span>
                <span className={`text-sm font-black ${isToday ? "text-[#1a2000]" : hasWorkout ? "text-[#d9ee4f]" : "text-[#ebebf0]"}`}>
                  {date.getDate()}
                </span>
                {hasWorkout && !isToday && <div className="w-1 h-1 rounded-full bg-lime-400" />}
              </div>
            );
          })}
        </div>

        {/* Profile summary card */}
        <div className="bg-[#1c1b1c] rounded-3xl p-4 flex items-center gap-4">
          {/* SVG progress ring */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            {(() => {
              const r = 30, sw = 5, size = 80;
              const circ = 2 * Math.PI * r;
              return (
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2c2c2e" strokeWidth={sw} />
                  <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke="#d9ee4f" strokeWidth={sw}
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - progressPct / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
              );
            })()}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[#d9ee4f] text-sm font-black leading-none">{progressPct}%</span>
              <span className="text-[#636366] text-[8px] mt-0.5">goal</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[#ebebf0] font-bold text-base leading-tight truncate capitalize">{displayName}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] font-semibold bg-[#d9ee4f]/10 text-[#d9ee4f] border border-[#d9ee4f]/20 px-2 py-0.5 rounded-full">
                {totalWorkouts} trainings
              </span>
              <span className="text-[10px] font-semibold bg-white/5 text-[#8e8e93] border border-white/10 px-2 py-0.5 rounded-full">
                Pro Member
              </span>
            </div>
            <button
              onClick={handleStart}
              className="mt-3 flex items-center gap-1.5 bg-[#d9ee4f] text-[#131314] text-xs font-black px-3.5 py-2 rounded-xl active:scale-95 transition-all"
            >
              <Play className="w-3 h-3 fill-[#131314] shrink-0" />
              Start Workout
            </button>
          </div>
        </div>

        {/* Weekly growth card */}
        <div className="bg-[#1c1b1c] rounded-3xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[#636366] text-[10px] font-bold uppercase tracking-widest">Weekly Growth</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-2xl font-black ${totalGrowth >= 0 ? "text-[#d9ee4f]" : "text-[#ff6b6b]"}`}>
                  {totalGrowth >= 0 ? "+" : ""}{totalGrowth}%
                </span>
                {totalGrowth >= 0
                  ? <TrendingUp className="w-5 h-5 text-[#d9ee4f]" />
                  : <TrendingDown className="w-5 h-5 text-[#ff6b6b]" />
                }
              </div>
              <p className="text-[#636366] text-[10px] mt-0.5">vs last week · {thisWeekWorkouts} sessions</p>
            </div>
            <Link href="/history" className="text-lime-400 text-[10px] font-semibold mt-1">
              Full report →
            </Link>
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-12">
            {barData.curr.map((curr, i) => (
              <div key={i} className="flex-1 rounded-t-lg transition-all" style={{
                height: `${Math.max(curr, 2)}px`,
                background: curr > 2 ? "linear-gradient(to top, #d9ee4f, #a8e63d)" : "#2c2c2e",
              }} />
            ))}
          </div>
          <div className="flex mt-1.5">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[#48484a] text-[9px]">{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Streak */}
          <div className="bg-[#1c1b1c] rounded-3xl p-4 flex flex-col gap-1">
            <Zap className="w-5 h-5 text-[#d9ee4f]" />
            <span className="text-[#ebebf0] text-2xl font-black leading-tight mt-1">{streak}</span>
            <span className="text-[#636366] text-[11px] font-medium">Day Streak</span>
          </div>

          {/* Kcal Burn */}
          <div className="bg-[#d9ee4f] rounded-3xl p-4 flex flex-col gap-1">
            <Flame className="w-5 h-5 text-[#1a2000]" />
            <span className="text-[#1a2000] text-2xl font-black leading-tight mt-1">
              {calories > 999 ? `${(calories / 1000).toFixed(1)}k` : calories}
            </span>
            <span className="text-[#1a2000]/60 text-[11px] font-bold">Kcal Burn</span>
          </div>

          {/* Total Duration — full width */}
          <div className="col-span-2 bg-[#1c1b1c] rounded-3xl p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Clock className="w-5 h-5 text-[#d9ee4f]" />
              <span className="text-[#ebebf0] text-2xl font-black leading-tight mt-1">{durationDisplay}</span>
              <span className="text-[#636366] text-[11px] font-medium">Total Duration</span>
            </div>
            <div className="flex items-end gap-1 h-10 mr-2">
              {barData.curr.slice(0, 5).map((v, i) => (
                <div
                  key={i}
                  className="w-2.5 rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(Math.round(v / 48 * 36), 4)}px`,
                    backgroundColor: v > 2 ? "#d9ee4f" : "#2c2c2e",
                    opacity: i === 4 ? 1 : 0.4 + i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Today's workout */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#ebebf0] font-bold text-base">Today&apos;s Workout</p>
            <Link href="/exercise-library" className="text-lime-400 text-xs font-semibold">Library →</Link>
          </div>
          <div className="bg-[#1c1b1c] rounded-3xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[#ebebf0] font-bold text-sm leading-snug">
                  {todayWorkout ? todayWorkout.focus : "Push Day — Chest & Arms"}
                </p>
                <p className="text-[#636366] text-[10px] mt-0.5">4 exercises · Intermediate</p>
              </div>
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 bg-[#d9ee4f] text-[#131314] text-xs font-black px-3 py-2 rounded-xl active:scale-95 transition-all shrink-0 ml-3"
              >
                <Play className="w-3 h-3 fill-[#131314] shrink-0" /> Start
              </button>
            </div>
            {(todayWorkout
              ? todayWorkout.exercises.slice(0, 4)
              : [
                  { name: "Bench Press",    sets: 4, reps: "10" },
                  { name: "Shoulder Press", sets: 3, reps: "12" },
                  { name: "Tricep Dips",    sets: 3, reps: "15" },
                  { name: "Cable Flyes",    sets: 3, reps: "12" },
                ]
            ).map((ex, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-t border-white/5">
                <div className="w-8 h-8 rounded-xl bg-[#d9ee4f]/10 border border-[#d9ee4f]/20 flex items-center justify-center shrink-0">
                  <span className="text-sm">{["🏋️", "💪", "🔁", "🎯"][i % 4]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#ebebf0] text-xs font-semibold truncate">{ex.name}</p>
                  <p className="text-[#636366] text-[10px]">{ex.sets} sets × {ex.reps}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby shops */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#ebebf0] font-bold text-base">Nearby Shops</p>
            <Link href="/market" className="text-lime-400 text-xs font-semibold">See all →</Link>
          </div>
          {shops.length === 0 ? (
            <div className="bg-[#1c1b1c] rounded-3xl p-6 text-center">
              <Store className="w-6 h-6 text-[#636366] mx-auto mb-2" />
              <p className="text-[#636366] text-xs">No local shops yet</p>
              <Link href="/market" className="text-lime-400 text-xs font-semibold mt-1 block">Browse online market →</Link>
            </div>
          ) : (
            <div className="bg-[#1c1b1c] rounded-3xl overflow-hidden">
              {shops.slice(0, 4).map((shop) => (
                <Link
                  key={shop.id}
                  href="/market"
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 last:border-b-0 active:bg-white/5 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#d9ee4f]/10 border border-[#d9ee4f]/20 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4 text-[#d9ee4f]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#ebebf0] text-xs font-semibold truncate">{shop.name}</p>
                    <p className="text-[#636366] text-[10px]">{shop.area}, {shop.city}</p>
                  </div>
                  {shop.verified && (
                    <span className="text-[#d9ee4f] text-[9px] font-bold shrink-0 mr-1">✓</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#3a3a3c] shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
      <BottomNav />
    </main>
  );
}
