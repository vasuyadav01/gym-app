"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import BottomNav from "../components/BottomNav";
import Chest1RMLeaderboard from "../components/Chest1RMLeaderboard";

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gymId, setGymId] = useState("");
  const [gymName, setGymName] = useState("");
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
        setGymName((gymSnap.data() as { name?: string }).name ?? "Your Gym");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  const currentUserName = user?.displayName || user?.email?.split("@")[0] || "You";

  return (
    <main className="min-h-screen bg-[var(--app-bg)]">
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
