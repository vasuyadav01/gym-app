"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ChevronLeft } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace("/login"); return; }
      setUser(u);
      setDisplayName(u.displayName || "");
    });
    return () => unsub();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      await updateProfile(user, { displayName: displayName.trim() || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to update profile. Please try again.");
    }
    setLoading(false);
  };

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
          <h1 className="text-white text-2xl font-black">Edit Profile</h1>
        </div>

        <div className="bg-[#1c1b1c] rounded-[24px] border border-white/5 p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-500 text-sm font-medium">Display Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-base outline-none transition-all"
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-500 text-sm font-medium">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#252528]/50 text-neutral-600 text-base cursor-not-allowed"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-base font-bold active:scale-[0.98] disabled:opacity-50 transition-all"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
          >
            {saved ? "Saved!" : loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
