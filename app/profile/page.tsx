"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useTheme } from "@/lib/ThemeContext";
import BottomNav from "../components/BottomNav";
import {
  User as UserIcon,
  Dumbbell,
  Trophy,
  Flame,
  ChevronRight,
  Bell,
  Ruler,
  LogOut,
  Calculator,
  Store,
  Moon,
  Sun,
} from "lucide-react";

type UserProfile = {
  gymName?: string;
  inviteCode?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [hasShop, setHasShop] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.replace("/login"); return; }
      setUser(currentUser);
      try {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userSnap.data() as { gymId?: string } | undefined;
        const gymId = userData?.gymId;
        if (gymId) {
          const gymSnap = await getDoc(doc(db, "gyms", gymId));
          if (gymSnap.exists()) {
            const gymData = gymSnap.data() as { name?: string; inviteCode?: string };
            setProfile({ gymName: gymData.name, inviteCode: gymData.inviteCode });
          }
        }
        const shopSnap = await getDocs(
          query(collection(db, "shops"), where("ownerId", "==", currentUser.uid))
        ).catch(() => null);
        if (shopSnap && !shopSnap.empty) setHasShop(true);
      } catch (e) {
        void e;
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.replace("/login");
  };

  const getInitials = (email: string) => email.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  const isDark = theme === "dark";

  return (
    <main className="min-h-screen bg-[var(--app-bg)] pb-28">
      <div className="w-full max-w-md mx-auto px-5 pt-12 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[var(--app-text)] text-2xl font-black tracking-tight">Profile</h1>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--app-card)] border border-[var(--app-border-md)]">
            <span className="text-[var(--app-text-muted)] text-lg leading-none">···</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-[var(--app-card)] rounded-[24px] border border-[var(--app-border)] p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #d9ee4f, #a8c020)", boxShadow: "0 4px 14px rgba(217,238,79,0.3)" }}>
              <span className="text-[#1a2000] text-xl font-black">
                {user?.email ? getInitials(user.email) : "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[var(--app-text)] text-lg font-bold truncate">
                {user?.displayName || user?.email?.split("@")[0] || "User"}
              </h2>
              <p className="text-[var(--app-text-muted)] text-sm truncate">{user?.email}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { icon: Dumbbell, label: "Workouts" },
              { icon: Trophy, label: "Volume" },
              { icon: Flame, label: "Streak" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center bg-[var(--app-card2)] rounded-2xl py-3 border border-[var(--app-border)]">
                <Icon className="w-4 h-4 mb-1" style={{ color: "#d9ee4f" }} />
                <span className="text-[var(--app-text)] text-lg font-bold">0</span>
                <span className="text-[var(--app-text-muted)] text-[10px] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gym Card */}
        {profile.gymName && (
          <div className="bg-[var(--app-card)] rounded-[24px] border border-[var(--app-border)] p-5">
            <p className="text-[var(--app-text-muted)] text-xs font-semibold uppercase tracking-widest mb-3">
              Current Gym
            </p>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[var(--app-text)] font-bold text-base">{profile.gymName}</h3>
                {profile.inviteCode && (
                  <div className="mt-2 inline-block rounded-lg px-3 py-1 font-mono text-sm font-semibold border"
                    style={{ background: "rgba(217,238,79,0.08)", borderColor: "rgba(217,238,79,0.2)", color: "#d9ee4f" }}>
                    {profile.inviteCode}
                  </div>
                )}
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(217,238,79,0.1)" }}>
                <Dumbbell className="w-5 h-5" style={{ color: "#d9ee4f" }} />
              </div>
            </div>
          </div>
        )}

        {/* Appearance */}
        <div className="bg-[var(--app-card)] rounded-[24px] border border-[var(--app-border)] overflow-hidden">
          <p className="text-[var(--app-text-muted)] text-xs font-semibold uppercase tracking-widest px-5 pt-4 pb-2">
            Appearance
          </p>
          <div className="px-5 py-3.5 border-t border-[var(--app-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--app-card2)]">
                {isDark
                  ? <Moon className="w-4 h-4 text-[var(--app-text-muted)]" />
                  : <Sun className="w-4 h-4 text-[var(--app-text-muted)]" />}
              </div>
              <div>
                <span className="text-[var(--app-text)] text-sm font-medium">
                  {isDark ? "Dark Mode" : "Light Mode"}
                </span>
                <p className="text-[var(--app-text-muted)] text-[11px]">
                  {isDark ? "Switch to light theme" : "Switch to dark theme"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 rounded-full transition-colors duration-300"
              style={{ backgroundColor: isDark ? "#d9ee4f" : "#9ca3af" }}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${
                isDark ? "translate-x-6 bg-[#1a2000]" : "translate-x-0.5 bg-white"
              }`} />
            </button>
          </div>
        </div>

        {/* Settings List */}
        <div className="bg-[var(--app-card)] rounded-[24px] border border-[var(--app-border)] overflow-hidden">
          <p className="text-[var(--app-text-muted)] text-xs font-semibold uppercase tracking-widest px-5 pt-4 pb-2">
            Settings
          </p>
          {[
            { icon: UserIcon,   label: "Edit Profile",         href: "/profile/edit" },
            { icon: Bell,       label: "Notifications",        href: "/profile/notifications" },
            { icon: Ruler,      label: "Units (kg / lbs)",     href: "/profile/units" },
            { icon: Calculator, label: "Training Calculators", href: "/profile/calculators" },
            ...(hasShop ? [{ icon: Store, label: "My Shop", href: "/shop/dashboard" }] : []),
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--app-hover)] active:bg-[var(--app-hover)] transition-colors border-t border-[var(--app-border)]"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--app-card2)] flex items-center justify-center">
                <item.icon className="w-4 h-4 text-[var(--app-text-muted)]" />
              </div>
              <span className="flex-1 text-left text-[var(--app-text)] text-sm font-medium">
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 bg-[var(--app-card)] border border-red-900/30 text-red-500 font-semibold text-sm py-4 rounded-[24px] hover:bg-red-900/10 active:scale-[0.98] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

      </div>
      <BottomNav />
    </main>
  );
}
