"use client";

import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot,
  doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Check, Dumbbell, FileText } from "lucide-react";

const CHEST_EXERCISES = [
  "Bench Press", "Incline Barbell Press", "Decline Bench Press",
  "Dumbbell Bench Press", "Incline Dumbbell Press", "Close-Grip Bench Press",
  "Chest Press Machine", "Cable Crossover",
];

type Chest1RMDoc = {
  userId: string; gymId: string; userName: string; exercise: string; weight: number;
};

type RankedEntry = Chest1RMDoc & { rank: number };

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function QualBadge() {
  return (
    <span
      className="absolute -top-2 -left-2 text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded shadow-sm"
      style={{ backgroundColor: "#d9ee4f", color: "#131314" }}
    >
      QUALIFIED
    </span>
  );
}

function Rank1Card({ entry }: { entry: RankedEntry }) {
  return (
    <div
      className="rounded-xl p-3 text-center flex flex-col items-center border-2 -translate-y-4 scale-105"
      style={{ backgroundColor: "var(--app-card)", borderColor: "#d9ee4f", boxShadow: "0 0 20px rgba(217,238,79,0.15)" }}
    >
      <div className="relative mb-3">
        <Avatar className="w-20 h-20 border-2" style={{ borderColor: "#d9ee4f" } as React.CSSProperties}>
          <AvatarImage src={`https://i.pravatar.cc/150?u=${entry.userId}`} />
          <AvatarFallback className="bg-[var(--app-card2)] text-[var(--app-text-muted)] text-base">{getInitials(entry.userName)}</AvatarFallback>
        </Avatar>
        <div
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
          style={{ backgroundColor: "#d9ee4f", color: "#131314" }}
        >1</div>
        <QualBadge />
      </div>
      <p className="text-xs font-medium truncate w-full mb-1" style={{ color: "#d9ee4f" }}>
        {entry.userName.split(" ")[0]}
      </p>
      <p className="text-2xl font-bold" style={{ color: "#d9ee4f" }}>
        {entry.weight}<span className="text-sm ml-0.5">kg</span>
      </p>
    </div>
  );
}

function Rank2Card({ entry }: { entry: RankedEntry }) {
  return (
    <div
      className="rounded-xl p-3 text-center flex flex-col items-center border"
      style={{ backgroundColor: "var(--app-card)", borderColor: "rgba(217,238,79,0.5)", boxShadow: "0 0 10px rgba(217,238,79,0.1)" }}
    >
      <div className="relative mb-3">
        <Avatar className="w-16 h-16 border-2 border-zinc-600">
          <AvatarImage src={`https://i.pravatar.cc/150?u=${entry.userId}`} />
          <AvatarFallback className="bg-[var(--app-card2)] text-[var(--app-text-muted)] text-sm">{getInitials(entry.userName)}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-[var(--app-text)] bg-zinc-600">2</div>
        <QualBadge />
      </div>
      <p className="text-xs font-medium text-[var(--app-text-muted)] truncate w-full mb-1">{entry.userName.split(" ")[0]}</p>
      <p className="text-lg font-semibold text-[var(--app-text)]">{entry.weight}<span className="text-xs ml-0.5">kg</span></p>
    </div>
  );
}

function Rank3Card({ entry }: { entry: RankedEntry }) {
  return (
    <div
      className="rounded-xl p-3 text-center flex flex-col items-center border"
      style={{ backgroundColor: "var(--app-card)", borderColor: "rgba(217,238,79,0.5)", boxShadow: "0 0 10px rgba(217,238,79,0.1)" }}
    >
      <div className="relative mb-3">
        <Avatar className="w-16 h-16 border-2 border-zinc-800">
          <AvatarImage src={`https://i.pravatar.cc/150?u=${entry.userId}`} />
          <AvatarFallback className="bg-[var(--app-card2)] text-[var(--app-text-muted)] text-sm">{getInitials(entry.userName)}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-zinc-800 text-zinc-400">3</div>
        <QualBadge />
      </div>
      <p className="text-xs font-medium text-[var(--app-text-muted)] truncate w-full mb-1">{entry.userName.split(" ")[0]}</p>
      <p className="text-lg font-semibold text-[var(--app-text)]">{entry.weight}<span className="text-xs ml-0.5">kg</span></p>
    </div>
  );
}

export default function Chest1RMLeaderboard({
  gymId, gymName, currentUserId, currentUserName,
}: {
  gymId: string; gymName: string; currentUserId: string; currentUserName: string;
}) {
  const [entries, setEntries] = useState<RankedEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showTnC, setShowTnC] = useState(false);
  const [exercise, setExercise] = useState(CHEST_EXERCISES[0]);
  const [weight, setWeight] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!gymId) return;
    const q = query(collection(db, "chest1rm"), where("gymId", "==", gymId));
    return onSnapshot(q, (snap) => {
      const ranked = snap.docs
        .map((d) => d.data() as Chest1RMDoc)
        .sort((a, b) => b.weight - a.weight)
        .map((e, i) => ({ ...e, rank: i + 1 }));
      setEntries(ranked);
    });
  }, [gymId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openModal = () => {
    setExercise(CHEST_EXERCISES[0]);
    setWeight("");
    setConfirmed(false);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const w = parseFloat(weight);
    if (!confirmed || isNaN(w) || w <= 0) return;
    setSubmitting(true);
    const docId = `${gymId}_${currentUserId}`;
    const ref = doc(db, "chest1rm", docId);
    const existing = await getDoc(ref).catch(() => null);
    if (existing?.exists() && (existing.data() as Chest1RMDoc).weight >= w) {
      showToast("Your current best is already higher. Keep grinding!");
    } else {
      await setDoc(ref, {
        userId: currentUserId, gymId, userName: currentUserName,
        exercise, weight: w, loggedAt: serverTimestamp(),
      }).catch(() => null);
      showToast("New personal best logged! 🏆");
    }
    setSubmitting(false);
    setShowModal(false);
  };

  const currentEntry = entries.find((e) => e.userId === currentUserId);
  const currentRank = currentEntry?.rank ?? null;
  const hasPodium = entries.length >= 3;
  const top3 = hasPodium ? entries.slice(0, 3) : [];
  const listEntries = hasPodium ? entries.slice(3) : entries;
  const isCurrentUserInPodium = hasPodium && currentRank !== null && currentRank <= 3;
  const isCurrentUserInList = listEntries.some((e) => e.userId === currentUserId);
  const showPinnedUser = currentEntry && !isCurrentUserInPodium && !isCurrentUserInList;
  const topPercent = currentRank && entries.length > 0
    ? Math.max(1, Math.round((currentRank / entries.length) * 100))
    : null;

  return (
    <div className="w-full max-w-md mx-auto bg-[var(--app-bg)] min-h-screen font-sans pb-56">

      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg pointer-events-none"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
          {toast}
        </div>
      )}

      {/* Log 1RM Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-md bg-[var(--app-card)] rounded-3xl shadow-2xl border border-[var(--app-border-md)] max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 overflow-y-auto flex-1">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[var(--app-text)] font-bold text-lg">Log Chest 1RM</h3>
                <p className="text-[var(--app-text-muted)] text-xs mt-0.5">Only your personal best counts</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[var(--app-card2)] flex items-center justify-center hover:bg-[var(--app-hover)] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--app-text-muted)]" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-[var(--app-text-muted)] text-xs font-medium mb-2">Exercise</p>
              <div className="flex flex-wrap gap-2">
                {CHEST_EXERCISES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setExercise(ex)}
                    className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
                    style={exercise === ex
                      ? { backgroundColor: "#d9ee4f", color: "#1a2000", borderColor: "#d9ee4f" }
                      : { backgroundColor: "var(--app-card2)", color: "var(--app-text-muted)", borderColor: "var(--app-border-md)" }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[var(--app-text-muted)] text-xs font-medium mb-1.5">Weight (kg)</p>
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-4 py-3.5 rounded-2xl border border-[var(--app-border-md)] bg-[var(--app-card2)] text-[var(--app-text)] text-2xl font-black text-center outline-none transition-all"
                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--app-border-md)"}
              />
            </div>

            <button
              onClick={() => setConfirmed((c) => !c)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border mb-5 transition-all text-left"
              style={confirmed
                ? { background: "rgba(217,238,79,0.08)", borderColor: "rgba(217,238,79,0.2)" }
                : { background: "var(--app-card2)", borderColor: "var(--app-border-md)" }}
            >
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={confirmed
                  ? { backgroundColor: "#d9ee4f", borderColor: "#d9ee4f" }
                  : { borderColor: "var(--app-control)" }}
              >
                {confirmed && <Check className="w-3 h-3" style={{ color: "#1a2000" }} strokeWidth={3} />}
              </div>
              <span className="text-sm font-medium" style={{ color: confirmed ? "#d9ee4f" : "#737373" }}>
                I confirm this was a true 1-rep max
              </span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={!weight || !confirmed || submitting}
              className="w-full py-4 rounded-2xl font-bold text-sm active:scale-[0.98] disabled:opacity-40 transition-all"
              style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
            >
              {submitting ? "Saving…" : "Submit 1RM"}
            </button>
          </div>
          </div>
        </div>
      )}

      {/* T&C Modal */}
      {showTnC && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTnC(false); }}
        >
          <div className="w-full max-w-md bg-[var(--app-card)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--app-border-md)] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--app-border)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--app-card2)] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[var(--app-text-muted)]" />
                </div>
                <div>
                  <h3 className="text-[var(--app-text)] font-bold text-base">Terms &amp; Conditions</h3>
                  <p className="text-[var(--app-text-muted)] text-xs">Best Chest 1RM — {gymName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTnC(false)}
                className="w-8 h-8 rounded-full bg-[var(--app-card2)] flex items-center justify-center hover:bg-[var(--app-hover)] transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-[var(--app-text-muted)]" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4 flex-1 overflow-y-auto">
              {[
                { title: "Entry Verification", body: "All entries will be verified and approved by gym owners before appearing on the leaderboard." },
                { title: "Competition Deadline", body: "The competition ends on 15th May 2025. No entries submitted after this date will be eligible for prizes." },
                { title: "Prize Pool", body: "[Add your prize details here]" },
                { title: "Fair Play", body: "All lifts must be performed with full range of motion and without assistance." },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: "rgba(217,238,79,0.15)", color: "#d9ee4f" }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-[var(--app-text)] text-sm font-semibold mb-0.5">{item.title}</p>
                    <p className="text-[var(--app-text-muted)] text-sm leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 pb-6 pt-3 border-t border-[var(--app-border)]">
              <button
                onClick={() => setShowTnC(false)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
                style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-[var(--app-text)] font-bold leading-tight tracking-tight mb-1" style={{ fontSize: "32px" }}>
          Leaderboard
        </h1>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--app-accent-caption)" }}>
          Best Chest 1RM — {gymName}
        </p>
      </header>

      {/* Podium */}
      {hasPodium && (
        <div className="px-5 mb-8 grid grid-cols-3 gap-3">
          <div className="mt-8">
            <Rank2Card entry={top3[1]} />
          </div>
          <div>
            <Rank1Card entry={top3[0]} />
          </div>
          <div className="mt-12">
            <Rank3Card entry={top3[2]} />
          </div>
        </div>
      )}

      {/* Rankings List (rank 4+) */}
      <div className="px-5 space-y-2 mb-4">
        {entries.length === 0 && (
          <div className="text-center py-16 bg-[var(--app-card)] rounded-2xl border border-[var(--app-border)]">
            <Dumbbell className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-[var(--app-text)] font-semibold text-sm">No lifts logged yet</p>
            <p className="text-[var(--app-text-muted)] text-xs mt-1">Be the first to post your best chest 1RM</p>
          </div>
        )}

        {listEntries.map((entry) => {
          const isQualified = entry.rank <= 5;
          const isCurrentUser = entry.userId === currentUserId;

          if (isCurrentUser) {
            return (
              <div
                key={entry.userId}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: "var(--app-card2)", borderLeft: "4px solid #d9ee4f" }}
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-sm font-semibold" style={{ color: "#d9ee4f" }}>
                    {entry.rank}
                  </span>
                  <Avatar className="w-10 h-10 shrink-0" style={{ border: "1px solid rgba(217,238,79,0.3)" } as React.CSSProperties}>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${entry.userId}`} />
                    <AvatarFallback className="bg-[var(--app-card2)] text-[var(--app-text-muted)] text-xs">{getInitials(entry.userName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-[var(--app-text)]">
                      {entry.userName} <span className="text-[var(--app-text-muted)] font-normal">(you)</span>
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-tight" style={{ color: "#d9ee4f" }}>
                      {topPercent !== null ? `Top ${topPercent}% this week` : entry.exercise}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-[var(--app-text)]">
                  {entry.weight} <span className="text-xs text-[var(--app-text-muted)]">kg</span>
                </p>
              </div>
            );
          }

          return (
            <div
              key={entry.userId}
              className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-[var(--app-hover)]"
              style={{
                backgroundColor: "var(--app-card)",
                border: isQualified ? "1px solid rgba(217,238,79,0.3)" : "1px solid transparent",
              }}
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-sm font-semibold text-[var(--app-text-muted)]">{entry.rank}</span>
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${entry.userId}`} />
                  <AvatarFallback className="bg-[var(--app-card2)] text-[var(--app-text-muted)] text-xs">{getInitials(entry.userName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">{entry.userName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[10px] uppercase font-bold tracking-tight text-[var(--app-text-muted)]">{entry.exercise}</p>
                    {isQualified && (
                      <span
                        className="inline-block px-1 rounded text-[8px] font-bold tracking-widest"
                        style={{ backgroundColor: "rgba(217,238,79,0.2)", color: "#d9ee4f" }}
                      >
                        QUALIFIED
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-lg font-semibold text-[var(--app-text)]">
                {entry.weight} <span className="text-xs text-[var(--app-text-muted)]">kg</span>
              </p>
            </div>
          );
        })}

        {/* Pinned user row when outside visible list */}
        {showPinnedUser && currentEntry && (
          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ backgroundColor: "var(--app-card2)", borderLeft: "4px solid #d9ee4f" }}
          >
            <div className="flex items-center gap-4">
              <span className="w-6 text-sm font-semibold" style={{ color: "#d9ee4f" }}>
                {currentRank}
              </span>
              <Avatar className="w-10 h-10 shrink-0" style={{ border: "1px solid rgba(217,238,79,0.3)" } as React.CSSProperties}>
                <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUserId}`} />
                <AvatarFallback className="bg-[var(--app-card2)] text-[var(--app-text-muted)] text-xs">{getInitials(currentUserName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-[var(--app-text)]">
                  {currentUserName} <span className="text-[var(--app-text-muted)] font-normal">(you)</span>
                </p>
                <p className="text-[10px] uppercase font-bold tracking-tight" style={{ color: "#d9ee4f" }}>
                  {topPercent !== null ? `Top ${topPercent}% this week` : ""}
                </p>
              </div>
            </div>
            <p className="text-lg font-semibold text-[var(--app-text)]">
              {currentEntry.weight} <span className="text-xs text-[var(--app-text-muted)]">kg</span>
            </p>
          </div>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="px-5 mb-4">
        <button
          onClick={() => setShowTnC(true)}
          className="w-full bg-[var(--app-card)] rounded-2xl border border-[var(--app-border)] p-4 flex items-center gap-3 hover:bg-[var(--app-hover)] active:scale-[0.99] transition-all text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--app-card2)] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-[var(--app-text-muted)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--app-text)] text-sm font-semibold">Terms &amp; Conditions</p>
            <p className="text-[var(--app-text-muted)] text-xs mt-0.5">Competition rules · Prize pool · Deadlines</p>
          </div>
          <svg className="w-4 h-4 text-neutral-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Log CTA — floats above the pill nav */}
      <div className="fixed bottom-[100px] left-0 w-full px-10 pointer-events-none z-20">
        <div className="max-w-sm mx-auto">
          <button
            onClick={openModal}
            className="pointer-events-auto w-full h-14 rounded-full font-bold text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000", boxShadow: "0 10px 25px rgba(217,238,79,0.3)" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
            </svg>
            Log Your Chest 1RM
          </button>
        </div>
      </div>
    </div>
  );
}
