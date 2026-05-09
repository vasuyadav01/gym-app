"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, limit,
  query, serverTimestamp, setDoc, where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Users, Building2, ArrowLeft, ChevronRight, Clock, XCircle } from "lucide-react";

type View = "choose" | "join" | "create" | "pending" | "rejected";

function Field({
  label, placeholder, value, onChange, inputMode,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void;
  inputMode?: "text" | "numeric" | "tel" | "email";
}) {
  return (
    <div>
      <p className="text-neutral-500 text-xs font-medium mb-1.5">{label}</p>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none transition-all"
        onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
      />
    </div>
  );
}

export default function GymPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(params.get("mode") === "create" ? "create" : "choose");
  const [busy, setBusy] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [gymName, setGymName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (cu) => {
      if (!cu) { router.replace("/login"); return; }
      setUser(cu);

      const snap = await getDoc(doc(db, "users", cu.uid)).catch(() => null);
      if (!snap?.exists()) {
        await setDoc(doc(db, "users", cu.uid), { userId: cu.uid, email: cu.email ?? "", gymId: "" }).catch(() => null);
      } else {
        const gymId = (snap.data() as { gymId?: string }).gymId;
        if (gymId) {
          const gymSnap = await getDoc(doc(db, "gyms", gymId)).catch(() => null);
          const gymData = gymSnap?.data() as { status?: string } | undefined;
          if (gymData?.status === "pending") { setView("pending"); setLoading(false); return; }
          if (gymData?.status === "rejected") { setView("rejected"); setLoading(false); return; }
          router.replace("/leaderboard"); return;
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleJoin = async () => {
    if (!user) return;
    const code = inviteCode.trim().toUpperCase();
    if (!code) { setError("Enter an invite code."); return; }
    setBusy(true); setError("");
    const snap = await getDocs(query(collection(db, "gyms"), where("inviteCode", "==", code), where("status", "==", "approved"), limit(1))).catch(() => null);
    if (!snap || snap.empty) { setError("Invalid code or gym not yet approved."); setBusy(false); return; }
    await setDoc(doc(db, "users", user.uid), { userId: user.uid, email: user.email ?? "", gymId: snap.docs[0].id }).catch(() => null);
    router.replace("/leaderboard");
  };

  const handleCreate = async () => {
    if (!user) return;
    const owner = ownerName.trim();
    const aadhar = aadharNumber.trim();
    const name = gymName.trim();
    const loc = location.trim();
    if (!owner) { setError("Enter your full name."); return; }
    if (aadhar.length !== 12) { setError("Aadhar number must be exactly 12 digits."); return; }
    if (!name) { setError("Enter a gym name."); return; }
    if (!loc) { setError("Enter your gym location."); return; }
    setBusy(true); setError("");

    const gymRef = doc(collection(db, "gyms"));
    await setDoc(gymRef, {
      name, ownerName: owner, aadharNumber: aadhar, location: loc,
      ownerId: user.uid, ownerEmail: user.email ?? "",
      verified: false, status: "pending", createdAt: serverTimestamp(),
    }).catch(() => null);
    await setDoc(doc(db, "users", user.uid), { userId: user.uid, email: user.email ?? "", gymId: gymRef.id }).catch(() => null);
    setView("pending");
    setBusy(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#131314]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  if (view === "pending") {
    return (
      <main className="min-h-screen bg-[#131314] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm bg-[#1c1b1c] rounded-3xl border border-white/5 p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(217,238,79,0.1)", border: "1px solid rgba(217,238,79,0.2)" }}>
            <Clock className="w-8 h-8" style={{ color: "#d9ee4f" }} />
          </div>
          <h2 className="text-white font-bold text-xl mb-1">Application Submitted</h2>
          <p className="text-neutral-500 text-sm mb-6">Your gym is under review. Admin will verify within 24–48 hours.</p>

          <div className="bg-[#252528] border border-white/5 rounded-2xl px-5 py-4 mb-6 text-left">
            <p className="text-neutral-500 text-[11px] font-semibold uppercase tracking-wider mb-3">What happens next</p>
            {[
              "Admin reviews your Aadhar & gym details",
              "You receive an invite code once approved",
              "Share the code with your gym members",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 mb-2.5 last:mb-0">
                <div className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(217,238,79,0.15)", color: "#d9ee4f" }}>
                  {i + 1}
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.replace("/gym-owner")}
            className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (view === "rejected") {
    return (
      <main className="min-h-screen bg-[#131314] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm bg-[#1c1b1c] rounded-3xl border border-white/5 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-white font-bold text-xl mb-1">Application Rejected</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Your gym application was not approved. Please contact the admin or re-apply with correct details.
          </p>
          <button
            onClick={() => { setView("create"); setError(""); }}
            className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all mb-3"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
          >
            Re-apply
          </button>
          <button
            onClick={() => signOut(auth).then(() => router.replace("/login"))}
            className="w-full py-3 text-neutral-500 text-sm font-medium hover:text-neutral-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  if (view === "join") {
    return (
      <main className="min-h-screen bg-[#131314] px-5 pt-12 pb-10 flex flex-col max-w-md mx-auto">
        <button
          onClick={() => { setView("choose"); setError(""); setInviteCode(""); }}
          className="w-9 h-9 rounded-full bg-[#1c1b1c] border border-white/10 flex items-center justify-center hover:bg-[#252528] transition-colors mb-6 self-start"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-400" />
        </button>

        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(217,238,79,0.1)", border: "1px solid rgba(217,238,79,0.2)" }}>
          <Users className="w-6 h-6" style={{ color: "#d9ee4f" }} />
        </div>
        <h1 className="text-white text-2xl font-black mb-1">Join a Gym</h1>
        <p className="text-neutral-500 text-sm mb-8">Enter the 6-character invite code from your gym owner</p>

        <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-5 flex flex-col gap-4 mb-4">
          <div>
            <p className="text-neutral-500 text-xs font-medium mb-1.5">Invite Code</p>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError(""); }}
              maxLength={6}
              placeholder="e.g. ABC123"
              className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-[#252528] text-white text-xl font-bold text-center tracking-[0.3em] uppercase outline-none transition-all"
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>

        <div className="mt-auto pt-6">
          <button
            onClick={handleJoin}
            disabled={busy || inviteCode.length < 6}
            className="w-full py-4 rounded-2xl font-bold text-sm active:scale-[0.98] disabled:opacity-40 transition-all"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
          >
            {busy ? "Joining..." : "Join Gym"}
          </button>
        </div>
      </main>
    );
  }

  if (view === "create") {
    const canSubmit = ownerName.trim() && aadharNumber.length === 12 && gymName.trim() && location.trim();
    return (
      <main className="min-h-screen bg-[#131314] px-5 pt-12 pb-10 flex flex-col max-w-md mx-auto">
        <button
          onClick={() => { setView("choose"); setError(""); setOwnerName(""); setAadharNumber(""); setGymName(""); setLocation(""); }}
          className="w-9 h-9 rounded-full bg-[#1c1b1c] border border-white/10 flex items-center justify-center hover:bg-[#252528] transition-colors mb-6 self-start"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-400" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#1c1b1c] border border-white/10 flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-neutral-400" />
        </div>
        <h1 className="text-white text-2xl font-black mb-1">Register Your Gym</h1>
        <p className="text-neutral-500 text-sm mb-6">Admin will verify your details within 24–48 hours</p>

        <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-5 flex flex-col gap-4 mb-4">
          <Field label="Owner Full Name" placeholder="e.g. Rahul Sharma" value={ownerName}
            onChange={(v) => { setOwnerName(v); setError(""); }} />
          <div>
            <p className="text-neutral-500 text-xs font-medium mb-1.5">Aadhar Card Number</p>
            <input
              type="text"
              inputMode="numeric"
              value={aadharNumber}
              onChange={(e) => { setAadharNumber(e.target.value.replace(/\D/g, "").slice(0, 12)); setError(""); }}
              placeholder="12-digit number"
              className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none transition-all tracking-widest font-mono"
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            <p className="text-neutral-600 text-[10px] mt-1 ml-1">{aadharNumber.length}/12 digits</p>
          </div>
          <Field label="Gym Name" placeholder="e.g. Iron House Gym" value={gymName}
            onChange={(v) => { setGymName(v); setError(""); }} />
          <Field label="Location (Area, City)" placeholder="e.g. Koramangala, Bengaluru" value={location}
            onChange={(v) => { setLocation(v); setError(""); }} />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>

        <div className="rounded-2xl px-4 py-3 mb-4 border"
          style={{ background: "rgba(217,238,79,0.04)", borderColor: "rgba(217,238,79,0.15)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "#d9ee4f80" }}>
            🔒 Your Aadhar number is used only for identity verification and is stored securely.
          </p>
        </div>

        <div className="mt-auto pt-2">
          <button
            onClick={handleCreate}
            disabled={busy || !canSubmit}
            className="w-full py-4 rounded-2xl font-bold text-sm active:scale-[0.98] disabled:opacity-40 transition-all"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
          >
            {busy ? "Submitting..." : "Submit for Verification"}
          </button>
        </div>
      </main>
    );
  }

  // Choose screen
  return (
    <main className="min-h-screen bg-[#131314] flex flex-col px-5 pt-12 pb-10 max-w-md mx-auto">
      <button
        onClick={() => router.replace("/")}
        className="w-9 h-9 rounded-full bg-[#1c1b1c] border border-white/10 flex items-center justify-center hover:bg-[#252528] transition-colors mb-6 self-start"
      >
        <ArrowLeft className="w-4 h-4 text-neutral-400" />
      </button>

      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: "#d9ee4f" }}>
          <span className="text-2xl">🏆</span>
        </div>
        <h1 className="text-white text-2xl font-black leading-tight mb-2">
          You need a gym to join the leaderboard
        </h1>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Connect with your gym to compete on the leaderboard with your training partners.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-auto">
        <button
          onClick={() => setView("join")}
          className="w-full bg-[#1c1b1c] rounded-2xl border border-white/5 p-5 flex items-center gap-4 text-left hover:border-white/15 active:scale-[0.99] transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#252528] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base">Join a Gym</p>
            <p className="text-neutral-500 text-sm mt-0.5">Enter an invite code from your gym owner</p>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-600 shrink-0" />
        </button>

        <button
          onClick={() => setView("create")}
          className="w-full bg-[#1c1b1c] rounded-2xl border border-white/5 p-5 flex items-center gap-4 text-left hover:border-white/15 active:scale-[0.99] transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#252528] flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base">Create a Gym</p>
            <p className="text-neutral-500 text-sm mt-0.5">Register and get verified by admin</p>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-600 shrink-0" />
        </button>
      </div>

      <div className="pt-8">
        <button
          onClick={() => setView("join")}
          className="w-full py-4 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
        >
          Join a gym to enter
        </button>
        <button
          onClick={() => signOut(auth).then(() => router.replace("/login"))}
          className="w-full py-3 text-neutral-500 text-sm font-medium hover:text-neutral-300 transition-colors mt-1"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
