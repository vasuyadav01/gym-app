"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, onSnapshot, updateDoc, deleteDoc, doc,
  query, orderBy, getDocs, where, limit,
} from "firebase/firestore";
import {
  CheckCircle, Clock, MapPin, Phone, Store, Building2, IdCard,
  XCircle, User, ShieldCheck, ShieldOff, RefreshCw, Mail,
  TrendingUp, AlertCircle, Search, ChevronDown,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";

const ADMIN_EMAIL = "vasuyadav2003@gmail.com";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () =>
  Array.from({ length: 6 }, () => INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)]).join("");

async function uniqueCode(): Promise<string> {
  let code = makeCode();
  let snap = await getDocs(query(collection(db, "gyms"), where("inviteCode", "==", code), limit(1)));
  while (!snap.empty) { code = makeCode(); snap = await getDocs(query(collection(db, "gyms"), where("inviteCode", "==", code), limit(1))); }
  return code;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type GymStatus = "pending" | "approved" | "rejected";

type Gym = {
  id: string; name: string; ownerName: string; aadharNumber: string;
  location: string; ownerEmail: string; ownerId: string;
  status: GymStatus; verified: boolean; disabled?: boolean;
  inviteCode?: string; createdAt: { seconds: number } | null;
};

type Shop = {
  id: string; name: string; area: string; city: string;
  phone: string; whatsapp?: string; ownerId: string;
  verified: boolean; disabled?: boolean;
  createdAt: { seconds: number } | null;
};

type Filter = "all" | "pending" | "active" | "disabled" | "rejected";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(ts: { seconds: number } | null) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function masked(aadhar: string) {
  return aadhar ? `XXXX XXXX ${aadhar.slice(-4)}` : "—";
}

// ── Status pill ───────────────────────────────────────────────────────────────

function Pill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending:  { label: "Pending",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    approved: { label: "Active",   color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    active:   { label: "Active",   color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    verified: { label: "Verified", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    rejected: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/30" },
    disabled: { label: "Disabled", color: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>
      {s.label}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-4 flex flex-col gap-1">
      <span className="text-neutral-500 text-[10px] font-semibold uppercase tracking-widest">{label}</span>
      <span
        className="text-2xl font-black leading-tight"
        style={{ color: accent ? "#d9ee4f" : "#ffffff" }}
      >{value}</span>
      {sub && <span className="text-[10px] text-neutral-600 font-medium">{sub}</span>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady]     = useState(false);
  const [gyms, setGyms]       = useState<Gym[]>([]);
  const [shops, setShops]     = useState<Shop[]>([]);
  const [busy, setBusy]       = useState<string | null>(null);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [tab, setTab]         = useState<"gyms" | "shops">("gyms");
  const [filter, setFilter]   = useState<Filter>("all");
  const [search, setSearch]   = useState("");

  const flash = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Auth guard
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace("/login"); return; }
      if (u.email !== ADMIN_EMAIL) { router.replace("/"); return; }
      setReady(true);
    });
  }, [router]);

  // Real-time listeners
  useEffect(() => {
    if (!ready) return;
    const u1 = onSnapshot(
      query(collection(db, "gyms"), orderBy("createdAt", "desc")),
      (s) => setGyms(s.docs.map((d) => ({ id: d.id, ...d.data() } as Gym))),
    );
    const u2 = onSnapshot(
      query(collection(db, "shops"), orderBy("createdAt", "desc")),
      (s) => setShops(s.docs.map((d) => ({ id: d.id, ...d.data() } as Shop))),
    );
    return () => { u1(); u2(); };
  }, [ready]);

  // ── Gym actions ────────────────────────────────────────────────────────────

  const approveGym = async (id: string) => {
    setBusy(id);
    const code = await uniqueCode().catch(() => null);
    if (!code) { flash("Failed to generate code", false); setBusy(null); return; }
    await updateDoc(doc(db, "gyms", id), { status: "approved", verified: true, disabled: false, inviteCode: code });
    setBusy(null); flash("Gym approved — invite code generated");
  };

  const rejectGym = async (id: string) => {
    setBusy(id);
    await updateDoc(doc(db, "gyms", id), { status: "rejected", verified: false });
    setBusy(null); flash("Gym application rejected");
  };

  const disableGym = async (id: string) => {
    setBusy(id);
    await updateDoc(doc(db, "gyms", id), { disabled: true });
    setBusy(null); flash("Gym disabled");
  };

  const enableGym = async (id: string) => {
    setBusy(id);
    await updateDoc(doc(db, "gyms", id), { disabled: false });
    setBusy(null); flash("Gym re-enabled");
  };

  const resetGym = async (id: string) => {
    setBusy(id);
    await updateDoc(doc(db, "gyms", id), { status: "pending", verified: false, disabled: false, inviteCode: "" });
    setBusy(null); flash("Reset to pending");
  };

  // ── Shop actions ───────────────────────────────────────────────────────────

  const verifyShop = async (id: string) => {
    setBusy(id);
    await updateDoc(doc(db, "shops", id), { verified: true, disabled: false });
    setBusy(null); flash("Shop verified");
  };

  const disableShop = async (id: string) => {
    setBusy(id);
    await updateDoc(doc(db, "shops", id), { disabled: true });
    setBusy(null); flash("Shop disabled");
  };

  const enableShop = async (id: string) => {
    setBusy(id);
    await updateDoc(doc(db, "shops", id), { disabled: false });
    setBusy(null); flash("Shop re-enabled");
  };

  const deleteShop = async (id: string) => {
    if (!confirm("Delete this shop permanently?")) return;
    setBusy(id);
    await deleteDoc(doc(db, "shops", id));
    setBusy(null); flash("Shop deleted");
  };

  // ── Derived lists ──────────────────────────────────────────────────────────

  const gymState = (g: Gym): Filter => {
    if (g.disabled) return "disabled";
    if (g.status === "pending") return "pending";
    if (g.status === "approved") return "active";
    return "rejected";
  };
  const shopState = (s: Shop): Filter => {
    if (s.disabled) return "disabled";
    if (!s.verified) return "pending";
    return "active";
  };

  const q = search.toLowerCase();
  const filteredGyms = gyms.filter((g) => {
    if (filter !== "all" && gymState(g) !== filter) return false;
    if (q) return g.name.toLowerCase().includes(q) || g.ownerName?.toLowerCase().includes(q) || g.ownerEmail?.toLowerCase().includes(q);
    return true;
  });
  const filteredShops = shops.filter((s) => {
    if (filter !== "all" && shopState(s) !== filter) return false;
    if (q) return s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q);
    return true;
  });

  const pendingGyms  = gyms.filter((g) => gymState(g) === "pending").length;
  const pendingShops = shops.filter((s) => shopState(s) === "pending").length;
  const totalPending = pendingGyms + pendingShops;

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#131314] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  // ── Filter pills config ────────────────────────────────────────────────────

  const GYM_FILTERS:  { key: Filter; label: string }[] = [
    { key: "all",      label: `All (${gyms.length})` },
    { key: "pending",  label: `Pending (${gyms.filter((g) => gymState(g) === "pending").length})` },
    { key: "active",   label: `Active (${gyms.filter((g) => gymState(g) === "active").length})` },
    { key: "disabled", label: `Disabled (${gyms.filter((g) => gymState(g) === "disabled").length})` },
    { key: "rejected", label: `Rejected (${gyms.filter((g) => gymState(g) === "rejected").length})` },
  ];
  const SHOP_FILTERS: { key: Filter; label: string }[] = [
    { key: "all",      label: `All (${shops.length})` },
    { key: "pending",  label: `Pending (${shops.filter((s) => shopState(s) === "pending").length})` },
    { key: "active",   label: `Active (${shops.filter((s) => shopState(s) === "active").length})` },
    { key: "disabled", label: `Disabled (${shops.filter((s) => shopState(s) === "disabled").length})` },
  ];
  const filters = tab === "gyms" ? GYM_FILTERS : SHOP_FILTERS;

  return (
    <main className="min-h-screen bg-[#131314] pb-16">

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-xl pointer-events-none transition-all"
          style={{ backgroundColor: toast.ok ? "#d9ee4f", color: toast.ok ? "#1a2000" : "#fff", background: toast.ok ? "#d9ee4f" : "#ef4444" }}
        >
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}

      <div className="w-full max-w-md mx-auto px-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="pt-12 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-black tracking-tight">Admin Panel</h1>
              <p className="text-neutral-500 text-xs mt-0.5">VISFIT · vasuyadav2003@gmail.com</p>
            </div>
            {totalPending > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-full">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold">{totalPending} pending</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard label="Total Gyms"  value={gyms.length}  sub={`${pendingGyms} pending`} />
          <StatCard label="Total Shops" value={shops.length} sub={`${pendingShops} pending`} accent />
          <StatCard label="Active Gyms"  value={gyms.filter((g) => gymState(g) === "active").length}  sub="approved & live" />
          <StatCard label="Active Shops" value={shops.filter((s) => shopState(s) === "active").length} sub="verified & live" />
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div className="flex bg-[#1c1b1c] rounded-2xl p-1 mb-4 border border-white/5">
          {(["gyms", "shops"] as const).map((t) => {
            const count = t === "gyms" ? pendingGyms : pendingShops;
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setFilter("all"); setSearch(""); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  tab === t ? "bg-[#d9ee4f] text-[#1a2000]" : "text-neutral-500"
                }`}
              >
                {t === "gyms" ? <Building2 className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                {t === "gyms" ? "Gyms" : "Shops"}
                {count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === t ? "bg-[#1a2000] text-[#d9ee4f]" : "bg-amber-500 text-white"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Search ─────────────────────────────────────────────────────── */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "gyms" ? "Search gyms or owners…" : "Search shops or city…"}
            className="w-full bg-[#1c1b1c] border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition-all"
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
          />
        </div>

        {/* ── Filter pills ───────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === key
                  ? "bg-[#d9ee4f] text-[#1a2000] border-[#d9ee4f]"
                  : "bg-[#1c1b1c] text-neutral-400 border-white/5 hover:border-white/15"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Gym list ───────────────────────────────────────────────────── */}
        {tab === "gyms" && (
          <div className="flex flex-col gap-3">
            {filteredGyms.length === 0 && (
              <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 px-5 py-10 text-center">
                <CheckCircle className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">No gyms match this filter</p>
              </div>
            )}
            {filteredGyms.map((gym) => (
              <GymCard
                key={gym.id} gym={gym} state={gymState(gym)}
                busy={busy === gym.id}
                onApprove={() => approveGym(gym.id)}
                onReject={() => rejectGym(gym.id)}
                onDisable={() => disableGym(gym.id)}
                onEnable={() => enableGym(gym.id)}
                onReset={() => resetGym(gym.id)}
              />
            ))}
          </div>
        )}

        {/* ── Shop list ──────────────────────────────────────────────────── */}
        {tab === "shops" && (
          <div className="flex flex-col gap-3">
            {filteredShops.length === 0 && (
              <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 px-5 py-10 text-center">
                <CheckCircle className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">No shops match this filter</p>
              </div>
            )}
            {filteredShops.map((shop) => (
              <ShopCard
                key={shop.id} shop={shop} state={shopState(shop)}
                busy={busy === shop.id}
                onVerify={() => verifyShop(shop.id)}
                onDisable={() => disableShop(shop.id)}
                onEnable={() => enableShop(shop.id)}
                onDelete={() => deleteShop(shop.id)}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

// ── Gym Card ──────────────────────────────────────────────────────────────────

function GymCard({ gym, state, busy, onApprove, onReject, onDisable, onEnable, onReset }: {
  gym: Gym; state: Filter; busy: boolean;
  onApprove: () => void; onReject: () => void;
  onDisable: () => void; onEnable: () => void; onReset: () => void;
}) {
  const [expanded, setExpanded] = useState(state === "pending");

  return (
    <div className={`bg-[#1c1b1c] rounded-2xl border overflow-hidden transition-all ${
      state === "pending" ? "border-amber-500/30" :
      state === "disabled" ? "border-neutral-700/50" :
      state === "rejected" ? "border-red-900/40" :
      "border-white/5"
    }`}>
      {/* Header row */}
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded((v) => !v)}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          state === "pending"  ? "bg-amber-500/10"   :
          state === "active"   ? "bg-emerald-500/10"  :
          state === "disabled" ? "bg-neutral-700/30"  :
                                  "bg-red-500/10"
        }`}>
          <Building2 className={`w-5 h-5 ${
            state === "pending"  ? "text-amber-400"   :
            state === "active"   ? "text-emerald-400"  :
            state === "disabled" ? "text-neutral-500"  :
                                    "text-red-400"
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm leading-tight truncate">{gym.name}</p>
            <Pill status={state === "active" ? "approved" : state} />
          </div>
          <p className="text-neutral-500 text-xs mt-0.5 truncate">{gym.ownerName} · {gym.location}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-600 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 flex flex-col gap-3">
          {/* Info grid */}
          <div className="grid grid-cols-1 gap-1.5">
            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Owner" value={gym.ownerName} />
            <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={gym.ownerEmail} />
            <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={gym.location} />
            <InfoRow icon={<IdCard className="w-3.5 h-3.5" />} label="Aadhaar" value={masked(gym.aadharNumber)} />
            <InfoRow icon={<TrendingUp className="w-3.5 h-3.5" />} label="Applied" value={fmtDate(gym.createdAt)} />
            {gym.inviteCode && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-neutral-500 text-xs">Invite Code</span>
                <span className="font-mono text-xs font-black tracking-widest px-2 py-1 rounded-lg" style={{ background: "rgba(217,238,79,0.1)", color: "#d9ee4f" }}>
                  {gym.inviteCode}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {state === "pending" && (
              <>
                <ActionBtn color="green" onClick={onApprove} busy={busy}>✓ Approve</ActionBtn>
                <ActionBtn color="red"   onClick={onReject}  busy={busy}><XCircle className="w-3.5 h-3.5 inline mr-1" />Reject</ActionBtn>
              </>
            )}
            {state === "active" && (
              <ActionBtn color="red" onClick={onDisable} busy={busy}><ShieldOff className="w-3.5 h-3.5 inline mr-1" />Disable Gym</ActionBtn>
            )}
            {state === "disabled" && (
              <ActionBtn color="green" onClick={onEnable} busy={busy}><ShieldCheck className="w-3.5 h-3.5 inline mr-1" />Re-enable</ActionBtn>
            )}
            {state === "rejected" && (
              <ActionBtn color="amber" onClick={onReset} busy={busy}><RefreshCw className="w-3.5 h-3.5 inline mr-1" />Move to Pending</ActionBtn>
            )}
            {state === "approved" && (
              <ActionBtn color="amber" onClick={onReset} busy={busy}><RefreshCw className="w-3.5 h-3.5 inline mr-1" />Reset</ActionBtn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shop Card ─────────────────────────────────────────────────────────────────

function ShopCard({ shop, state, busy, onVerify, onDisable, onEnable, onDelete }: {
  shop: Shop; state: Filter; busy: boolean;
  onVerify: () => void; onDisable: () => void; onEnable: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(state === "pending");

  return (
    <div className={`bg-[#1c1b1c] rounded-2xl border overflow-hidden transition-all ${
      state === "pending"  ? "border-amber-500/30"  :
      state === "disabled" ? "border-neutral-700/50" :
                              "border-white/5"
    }`}>
      {/* Header row */}
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded((v) => !v)}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          state === "pending"  ? "bg-amber-500/10"  :
          state === "disabled" ? "bg-neutral-700/30" :
                                  "bg-emerald-500/10"
        }`}>
          <Store className={`w-5 h-5 ${
            state === "pending"  ? "text-amber-400"   :
            state === "disabled" ? "text-neutral-500"  :
                                    "text-emerald-400"
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm leading-tight truncate">{shop.name}</p>
            <Pill status={state === "active" ? "verified" : state} />
          </div>
          <p className="text-neutral-500 text-xs mt-0.5 truncate">{shop.area}, {shop.city}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-600 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-1.5">
            <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Area" value={`${shop.area}, ${shop.city}`} />
            <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={shop.phone} />
            {shop.whatsapp && <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="WhatsApp" value={shop.whatsapp} />}
            <InfoRow icon={<TrendingUp className="w-3.5 h-3.5" />} label="Registered" value={fmtDate(shop.createdAt)} />
          </div>

          <div className="flex gap-2 flex-wrap">
            {state === "pending" && (
              <>
                <ActionBtn color="green" onClick={onVerify}  busy={busy}><ShieldCheck className="w-3.5 h-3.5 inline mr-1" />Verify</ActionBtn>
                <ActionBtn color="red"   onClick={onDelete}  busy={busy}><XCircle className="w-3.5 h-3.5 inline mr-1" />Delete</ActionBtn>
              </>
            )}
            {state === "active" && (
              <ActionBtn color="red" onClick={onDisable} busy={busy}><ShieldOff className="w-3.5 h-3.5 inline mr-1" />Disable Shop</ActionBtn>
            )}
            {state === "disabled" && (
              <ActionBtn color="green" onClick={onEnable} busy={busy}><ShieldCheck className="w-3.5 h-3.5 inline mr-1" />Re-enable</ActionBtn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-1.5 text-neutral-500 text-xs shrink-0">
        {icon} {label}
      </div>
      <span className="text-white text-xs font-medium text-right truncate max-w-[55%]">{value || "—"}</span>
    </div>
  );
}

function ActionBtn({ color, onClick, busy, children }: {
  color: "green" | "red" | "amber"; onClick: () => void; busy: boolean; children: React.ReactNode;
}) {
  const styles = {
    green: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
    red:   "bg-transparent text-red-400 hover:bg-red-500/10 border-red-500/40",
    amber: "bg-transparent text-amber-400 hover:bg-amber-500/10 border-amber-500/40",
  };
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex-1 min-w-[100px] text-xs font-bold px-3 py-2.5 rounded-xl border transition-all disabled:opacity-40 ${styles[color]}`}
    >
      {busy ? <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  );
}
