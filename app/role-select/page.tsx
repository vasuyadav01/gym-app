"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Building2, Store, Dumbbell } from "lucide-react";

const ROLES = [
  {
    key: "gym_owner",
    icon: Building2,
    title: "Gym Owner",
    desc: "Manage members, fees, coupons, and track your gym's performance",
    href: "/gym-owner",
  },
  {
    key: "shop_owner",
    icon: Store,
    title: "Shop Owner",
    desc: "List your supplement shop, manage products, reach local gym-goers",
    href: "/shop/dashboard",
  },
  {
    key: "gym_member",
    icon: Dumbbell,
    title: "Gym Member",
    desc: "Track workouts, compete on leaderboards, explore the marketplace",
    href: "/",
  },
];

export default function RoleSelectPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login"); return; }
      const snap = await getDoc(doc(db, "users", u.uid)).catch(() => null);
      const role = snap?.data()?.role as string | undefined;
      if (role === "gym_owner")  { router.replace("/gym-owner");       return; }
      if (role === "shop_owner") { router.replace("/shop/dashboard");  return; }
      if (role === "gym_member") { router.replace("/");                return; }
      setUid(u.uid);
      setLoading(false);
    });
  }, [router]);

  const selectRole = async (key: string, href: string) => {
    if (!uid || selecting) return;
    setSelecting(key);
    await setDoc(doc(db, "users", uid), { role: key }, { merge: true }).catch(() => null);
    router.replace(href);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#131314]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#131314] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(217,238,79,0.1)", border: "1px solid rgba(217,238,79,0.2)" }}>
            <span className="text-2xl font-black" style={{ color: "#d9ee4f" }}>V</span>
          </div>
          <h1 className="text-white text-2xl font-black">What brings you here?</h1>
          <p className="text-neutral-500 text-sm mt-2">Choose your role to personalise your experience</p>
        </div>

        <div className="flex flex-col gap-3">
          {ROLES.map(({ key, icon: Icon, title, desc, href }) => (
            <button
              key={key}
              onClick={() => selectRole(key, href)}
              disabled={!!selecting}
              className={`w-full bg-[#1c1b1c] rounded-2xl border p-5 text-left transition-all active:scale-[0.98] disabled:opacity-60 ${
                selecting === key ? "border-[#d9ee4f]/40" : "border-white/5 hover:border-white/15"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(217,238,79,0.1)", border: "1px solid rgba(217,238,79,0.15)" }}>
                  {selecting === key
                    ? <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
                    : <Icon className="w-6 h-6" style={{ color: "#d9ee4f" }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base">{title}</p>
                  <p className="text-neutral-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
