"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, onSnapshot, updateDoc, doc, query, orderBy, getDocs, where, limit,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { CheckCircle, Clock, MapPin, Phone, Store, Building2, IdCard, XCircle, User } from "lucide-react";

const ADMIN_EMAIL = "vasuyadav2003@gmail.com";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateInviteCode = () =>
  Array.from({ length: 6 }, () => INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)]).join("");

async function generateUniqueCode(): Promise<string> {
  let code = generateInviteCode();
  let snap = await getDocs(query(collection(db, "gyms"), where("inviteCode", "==", code), limit(1)));
  while (!snap.empty) {
    code = generateInviteCode();
    snap = await getDocs(query(collection(db, "gyms"), where("inviteCode", "==", code), limit(1)));
  }
  return code;
}

type Shop = {
  id: string; name: string; area: string; city: string;
  phone: string; ownerId: string; verified: boolean;
  createdAt: { seconds: number } | null;
};

type Gym = {
  id: string; name: string; ownerName: string; aadharNumber: string;
  location: string; ownerEmail: string; ownerId: string;
  status: "pending" | "approved" | "rejected";
  verified: boolean; inviteCode?: string;
  createdAt: { seconds: number } | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"gyms" | "shops">("gyms");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace("/login"); return; }
      if (u.email !== ADMIN_EMAIL) { router.replace("/"); return; }
      setAuthorized(true);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    const unsubShops = onSnapshot(
      query(collection(db, "shops"), orderBy("createdAt", "desc")),
      (snap) => setShops(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop)))
    );
    const unsubGyms = onSnapshot(
      query(collection(db, "gyms"), orderBy("createdAt", "desc")),
      (snap) => setGyms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Gym)))
    );
    return () => { unsubShops(); unsubGyms(); };
  }, [authorized]);

  const handleApproveGym = async (gymId: string) => {
    setBusyId(gymId);
    const code = await generateUniqueCode().catch(() => null);
    if (!code) { showToast("Failed to generate invite code"); setBusyId(null); return; }
    await updateDoc(doc(db, "gyms", gymId), {
      status: "approved", verified: true, inviteCode: code,
    }).catch(() => null);
    setBusyId(null);
    showToast("Gym approved ✓ Invite code generated");
  };

  const handleRejectGym = async (gymId: string) => {
    setBusyId(gymId);
    await updateDoc(doc(db, "gyms", gymId), { status: "rejected", verified: false }).catch(() => null);
    setBusyId(null);
    showToast("Gym application rejected");
  };

  const handleRevokeGym = async (gymId: string) => {
    setBusyId(gymId);
    await updateDoc(doc(db, "gyms", gymId), { status: "pending", verified: false, inviteCode: "" }).catch(() => null);
    setBusyId(null);
    showToast("Gym approval revoked");
  };

  const handleVerifyShop = async (shopId: string) => {
    setBusyId(shopId);
    await updateDoc(doc(db, "shops", shopId), { verified: true }).catch(() => null);
    setBusyId(null);
    showToast("Shop verified ✓");
  };

  const handleRevokeShop = async (shopId: string) => {
    setBusyId(shopId);
    await updateDoc(doc(db, "shops", shopId), { verified: false }).catch(() => null);
    setBusyId(null);
    showToast("Verification revoked");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
      </main>
    );
  }

  const pendingGyms = gyms.filter((g) => g.status === "pending");
  const approvedGyms = gyms.filter((g) => g.status === "approved");
  const pendingShops = shops.filter((s) => !s.verified);
  const verifiedShops = shops.filter((s) => s.verified);

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg pointer-events-none">
          {toast}
        </div>
      )}

      <div className="w-full max-w-md mx-auto px-5 pt-12">
        <div className="mb-6">
          <h1 className="text-slate-900 text-2xl font-bold">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-0.5">Verify gyms and shops</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-200 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setTab("gyms")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "gyms" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Gyms {pendingGyms.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingGyms.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("shops")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "shops" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Shops {pendingShops.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingShops.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Gyms tab ── */}
        {tab === "gyms" && (
          <>
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-slate-700 font-semibold text-sm">Pending Gyms</h2>
                {pendingGyms.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingGyms.length}
                  </span>
                )}
              </div>
              {pendingGyms.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No pending gym applications</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingGyms.map((gym) => (
                    <GymRow
                      key={gym.id} gym={gym} busy={busyId === gym.id}
                      onApprove={() => handleApproveGym(gym.id)}
                      onReject={() => handleRejectGym(gym.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {approvedGyms.length > 0 && (
              <section>
                <h2 className="text-slate-700 font-semibold text-sm mb-3">Approved Gyms ({approvedGyms.length})</h2>
                <div className="flex flex-col gap-3">
                  {approvedGyms.map((gym) => (
                    <GymRow
                      key={gym.id} gym={gym} busy={busyId === gym.id}
                      onRevoke={() => handleRevokeGym(gym.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Shops tab ── */}
        {tab === "shops" && (
          <>
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-slate-700 font-semibold text-sm">Pending Shops</h2>
                {pendingShops.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingShops.length}
                  </span>
                )}
              </div>
              {pendingShops.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">All caught up — no pending shops</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingShops.map((shop) => (
                    <ShopRow key={shop.id} shop={shop} busy={busyId === shop.id} action="verify" onAction={() => handleVerifyShop(shop.id)} />
                  ))}
                </div>
              )}
            </section>
            {verifiedShops.length > 0 && (
              <section>
                <h2 className="text-slate-700 font-semibold text-sm mb-3">Verified Shops ({verifiedShops.length})</h2>
                <div className="flex flex-col gap-3">
                  {verifiedShops.map((shop) => (
                    <ShopRow key={shop.id} shop={shop} busy={busyId === shop.id} action="revoke" onAction={() => handleRevokeShop(shop.id)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function GymRow({ gym, busy, onApprove, onReject, onRevoke }: {
  gym: Gym; busy: boolean;
  onApprove?: () => void; onReject?: () => void; onRevoke?: () => void;
}) {
  const isPending = gym.status === "pending";
  const maskedAadhar = gym.aadharNumber
    ? `XXXX XXXX ${gym.aadharNumber.slice(-4)}`
    : "—";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            isPending ? "bg-amber-50 border border-amber-100" : "bg-emerald-50 border border-emerald-100"
          }`}>
            <Building2 className={`w-5 h-5 ${isPending ? "text-amber-600" : "text-emerald-600"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-slate-900 font-bold text-sm">{gym.name}</p>
              {isPending ? (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-2.5 h-2.5" /> Pending
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-2.5 h-2.5" /> Approved
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <User className="w-3 h-3 shrink-0" /> {gym.ownerName}
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" /> {gym.location}
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
              <IdCard className="w-3 h-3 shrink-0" /> {maskedAadhar}
            </div>
            {gym.inviteCode && (
              <div className="mt-1.5 inline-block bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2 py-0.5 rounded-lg tracking-widest">
                {gym.inviteCode}
              </div>
            )}
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={busy}
            className="flex-1 text-xs font-bold px-3 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-all"
          >
            {busy ? "..." : "✓ Approve"}
          </button>
          <button
            onClick={onReject}
            disabled={busy}
            className="flex-1 text-xs font-bold px-3 py-2.5 rounded-xl border border-red-200 text-red-500 bg-white hover:bg-red-50 disabled:opacity-40 transition-all"
          >
            <XCircle className="w-3.5 h-3.5 inline mr-1" />Reject
          </button>
        </div>
      ) : (
        <button
          onClick={onRevoke}
          disabled={busy}
          className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-red-200 text-red-500 bg-white hover:bg-red-50 disabled:opacity-40 transition-all"
        >
          {busy ? "..." : "Revoke Approval"}
        </button>
      )}
    </div>
  );
}

function ShopRow({ shop, busy, action, onAction }: {
  shop: Shop; busy: boolean; action: "verify" | "revoke"; onAction: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
            <Store className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-slate-900 font-bold text-sm">{shop.name}</p>
              {shop.verified ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-2.5 h-2.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-2.5 h-2.5" /> Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />{shop.area}, {shop.city}
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
              <Phone className="w-3 h-3 shrink-0" />{shop.phone}
            </div>
          </div>
        </div>
        <button
          onClick={onAction}
          disabled={busy}
          className={`shrink-0 text-xs font-bold px-3 py-2 rounded-xl border transition-all disabled:opacity-40 ${
            action === "verify"
              ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
              : "bg-white text-red-500 border-red-200 hover:bg-red-50"
          }`}
        >
          {busy ? "..." : action === "verify" ? "Verify" : "Revoke"}
        </button>
      </div>
    </div>
  );
}
