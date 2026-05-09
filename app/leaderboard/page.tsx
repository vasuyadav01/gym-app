"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import BottomNav from "../components/BottomNav";
import Chest1RMLeaderboard from "../components/Chest1RMLeaderboard";
import { ShieldOff } from "lucide-react";

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gymId, setGymId] = useState("");
  const [gymName, setGymName] = useState("");
  const [gymDisabled, setGymDisabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login"); return; }
      setUser(u);

      const userSnap = await getDoc(doc(db, "users", u.uid));
      const gId = (userSnap.data() as { gymId?: string })?.gymId;
      if (!gId) { router.replace("/gym"); return; }
      setGymId(gId);

      const gymSnap = await getDoc(doc(db, "gyms", gId));
      if (gymSnap.exists()) {
        const data = gymSnap.data() as { name?: string; disabled?: boolean };
        setGymName(data.name ?? "Your Gym");
        setGymDisabled(data.disabled === true);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#131314]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  if (gymDisabled) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#131314] px-6">
        <div className="bg-[#1c1b1c] rounded-3xl border border-red-900/30 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-red-900/10 border border-red-900/30 flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Gym Disabled</h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            This gym has been disabled by the admin. Leaderboard access is unavailable.
          </p>
        </div>
        <BottomNav />
      </main>
    );
  }

  const currentUserName = user?.displayName || user?.email?.split("@")[0] || "You";

  return (
    <main className="min-h-screen bg-[#131314]">
      <Chest1RMLeaderboard
        gymId={gymId}
        gymName={gymName}
        currentUserId={user?.uid ?? ""}
        currentUserName={currentUserName}
      />
      <BottomNav />
    </main>
  );
}
