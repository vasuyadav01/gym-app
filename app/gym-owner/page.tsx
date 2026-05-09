"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  query, where, serverTimestamp, getDoc, getDocs, Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  LayoutDashboard, Users, Receipt, Tag, Trophy,
  Plus, Copy, Trash2, Edit2, Check, X,
  Phone, AlertCircle, LogOut, Search, RefreshCw,
  Building2, CheckCircle2,
} from "lucide-react";
import Chest1RMLeaderboard from "../components/Chest1RMLeaderboard";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "members" | "fees" | "coupons" | "leaderboard";
type MemberStatus = "active" | "due_soon" | "overdue";

type Member = {
  id: string; gymId: string; gymOwnerId: string;
  name: string; phone: string; plan: string;
  feeAmount: number; dueDate: { seconds: number };
  createdAt: { seconds: number } | null;
};
type FeePayment = {
  id: string; memberId: string; memberName: string;
  gymId: string; amount: number;
  paidAt: { seconds: number } | null;
};
type Coupon = {
  id: string; gymId: string; gymOwnerId: string;
  code: string; discount: number; discountType: "percent" | "flat";
  expiresAt: { seconds: number } | null;
  maxUses: number; usedCount: number; disabled: boolean;
  createdAt: { seconds: number } | null;
};
type MemberForm = { name: string; phone: string; plan: string; feeAmount: string; dueDate: string };
type CouponForm  = { code: string; discount: string; discountType: "percent" | "flat"; expiresAt: string; maxUses: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const PLANS = ["Monthly", "Quarterly", "Annual", "Custom"];
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const EMPTY_MFORM: MemberForm = { name: "", phone: "", plan: "Monthly", feeAmount: "", dueDate: "" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStatus(d: { seconds: number }): MemberStatus {
  const due = d.seconds * 1000, now = Date.now();
  if (due < now) return "overdue";
  if (due < now + THREE_DAYS_MS) return "due_soon";
  return "active";
}
function fmtDate(ts: { seconds: number } | null) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtINR(n: number) { return `₹${n.toLocaleString("en-IN")}`; }
function planDays(plan: string) {
  if (plan === "Quarterly") return 90;
  if (plan === "Annual")    return 365;
  return 30;
}
function genCode() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MemberStatus }) {
  const map = {
    active:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    due_soon: "bg-amber-500/15  text-amber-400  border-amber-500/30",
    overdue:  "bg-red-500/15    text-red-400    border-red-500/30",
  };
  const labels = { active: "Active", due_soon: "Due Soon", overdue: "Overdue" };
  return (
    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

// ── OvStatCard ────────────────────────────────────────────────────────────────

function OvStat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-4 flex flex-col gap-1">
      <span className="text-neutral-500 text-[10px] font-semibold uppercase tracking-widest">{label}</span>
      <span className="text-2xl font-black leading-tight" style={{ color: accent ? "#d9ee4f" : "#fff" }}>{value}</span>
      {sub && <span className="text-[10px] text-neutral-600">{sub}</span>}
    </div>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "overview",    label: "Overview", Icon: LayoutDashboard },
  { key: "members",     label: "Members",  Icon: Users },
  { key: "fees",        label: "Fees",     Icon: Receipt },
  { key: "coupons",     label: "Coupons",  Icon: Tag },
  { key: "leaderboard", label: "Rankings", Icon: Trophy },
];

function GymBottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center">
      <div className="w-full max-w-[390px] bg-[#131314]/95 backdrop-blur-md border-t border-white/5 flex">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key} onClick={() => onChange(key)}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-all"
            style={{ color: active === key ? "#d9ee4f" : "#48484a" }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wide">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ members, payments }: { members: Member[]; payments: FeePayment[] }) {
  const now = new Date();
  const mk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthPay = payments.filter((p) => {
    if (!p.paidAt) return false;
    const d = new Date(p.paidAt.seconds * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === mk;
  });
  const monthRev  = monthPay.reduce((s, p) => s + p.amount, 0);
  const active    = members.filter((m) => getStatus(m.dueDate) === "active").length;
  const dueSoon   = members.filter((m) => getStatus(m.dueDate) === "due_soon").length;
  const overdue   = members.filter((m) => getStatus(m.dueDate) === "overdue").length;

  return (
    <div className="flex flex-col gap-4">
      {(dueSoon + overdue) > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-amber-400 font-bold text-sm">
              {overdue > 0 && `${overdue} overdue`}{overdue > 0 && dueSoon > 0 && " · "}{dueSoon > 0 && `${dueSoon} due soon`}
            </p>
            <p className="text-amber-400/60 text-xs">Go to Fees to collect</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#d9ee4f,#a8c020)" }}>
        <p className="text-[#1a2000]/70 text-xs font-bold uppercase tracking-widest">Revenue This Month</p>
        <p className="text-[#1a2000] text-4xl font-black mt-1">{fmtINR(monthRev)}</p>
        <p className="text-[#1a2000]/60 text-xs mt-1">{monthPay.length} payments collected</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <OvStat label="Total Members" value={members.length} sub="registered" />
        <OvStat label="Active"        value={active}         sub="paid & current" accent />
        <OvStat label="Due Soon"      value={dueSoon}        sub="within 3 days" />
        <OvStat label="Overdue"       value={overdue}        sub="past due date" />
      </div>
    </div>
  );
}

// ── Member Sheet ──────────────────────────────────────────────────────────────

function MemberSheet({
  initial, onSave, onClose, busy,
}: {
  initial: MemberForm | null; onSave: (f: MemberForm) => void;
  onClose: () => void; busy: boolean;
}) {
  const [form, setForm] = useState<MemberForm>(initial ?? EMPTY_MFORM);
  const set = (k: keyof MemberForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const ok = form.name.trim() && form.phone.trim() && form.feeAmount.trim() && form.dueDate;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[390px] bg-[#1c1b1c] rounded-t-3xl border-t border-white/10 p-5 pb-10 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{initial ? "Edit Member" : "Add Member"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#252528] flex items-center justify-center">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {([
          { label: "Full Name *",       k: "name"      as const, type: "text",   ph: "e.g. Rahul Sharma" },
          { label: "Phone *",           k: "phone"     as const, type: "tel",    ph: "+91 98765 43210" },
          { label: "Fee Amount (₹) *",  k: "feeAmount" as const, type: "number", ph: "e.g. 1500" },
        ]).map(({ label, k, type, ph }) => (
          <div key={k}>
            <p className="text-neutral-500 text-xs font-medium mb-1.5">{label}</p>
            <input type={type} value={form[k]} onChange={(e) => set(k)(e.target.value)} placeholder={ph}
              className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none"
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>
        ))}

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Plan</p>
          <div className="flex gap-2">
            {PLANS.map((p) => (
              <button key={p} onClick={() => set("plan")(p)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  form.plan === p ? "bg-[#d9ee4f] text-[#1a2000] border-[#d9ee4f]" : "bg-[#252528] text-neutral-400 border-white/10"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Due Date *</p>
          <input type="date" value={form.dueDate} onChange={(e) => set("dueDate")(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white text-sm outline-none"
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
        </div>

        <button onClick={() => ok && onSave(form)} disabled={!ok || busy}
          className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-40"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
          {busy ? "Saving…" : initial ? "Update Member" : "Add Member"}
        </button>
      </div>
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────────────────────

function MembersTab({
  members, onAdd, onEdit, onDelete, busy,
}: {
  members: Member[];
  onAdd: (f: MemberForm) => void; onEdit: (id: string, f: MemberForm) => void;
  onDelete: (id: string) => void; busy: string | null;
}) {
  const [sheet, setSheet] = useState<{ mode: "add" | "edit"; member?: Member } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)
  );

  const handleSave = (form: MemberForm) => {
    if (sheet?.mode === "edit" && sheet.member) onEdit(sheet.member.id, form);
    else onAdd(form);
    setSheet(null);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…"
            className="w-full bg-[#1c1b1c] border border-white/5 rounded-2xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none"
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"} />
        </div>
        <button onClick={() => setSheet({ mode: "add" })}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#d9ee4f" }}>
          <Plus className="w-5 h-5 text-[#1a2000]" />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-8 text-center">
          <Users className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-neutral-500 text-sm">
            {members.length === 0 ? "No members yet — add your first one" : "No members match your search"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((m) => {
            const status = getStatus(m.dueDate);
            return (
              <div key={m.id} className={`bg-[#1c1b1c] rounded-2xl border p-4 ${
                status === "overdue"  ? "border-red-900/40" :
                status === "due_soon" ? "border-amber-500/30" : "border-white/5"
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-white font-bold text-sm truncate">{m.name}</p>
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex items-center gap-1 text-neutral-500 text-xs mb-1">
                      <Phone className="w-3 h-3" /> {m.phone}
                    </div>
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="bg-[#252528] text-neutral-400 px-2 py-0.5 rounded-lg font-medium">{m.plan}</span>
                      <span className="font-bold" style={{ color: "#d9ee4f" }}>{fmtINR(m.feeAmount)}</span>
                      <span className="text-neutral-500">Due {fmtDate(m.dueDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setSheet({ mode: "edit", member: m })}
                      className="w-8 h-8 rounded-xl bg-[#252528] flex items-center justify-center">
                      <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete ${m.name}?`)) onDelete(m.id); }}
                      disabled={busy === m.id}
                      className="w-8 h-8 rounded-xl bg-[#252528] flex items-center justify-center disabled:opacity-40">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sheet && (
        <MemberSheet
          initial={sheet.member ? {
            name: sheet.member.name, phone: sheet.member.phone,
            plan: sheet.member.plan, feeAmount: String(sheet.member.feeAmount),
            dueDate: new Date(sheet.member.dueDate.seconds * 1000).toISOString().slice(0, 10),
          } : null}
          onSave={handleSave} onClose={() => setSheet(null)} busy={!!busy}
        />
      )}
    </div>
  );
}

// ── Fees Tab ──────────────────────────────────────────────────────────────────

function FeesTab({
  members, payments, onMarkPaid, busy,
}: {
  members: Member[]; payments: FeePayment[];
  onMarkPaid: (m: Member) => void; busy: string | null;
}) {
  const [subTab, setSubTab] = useState<"due" | "history">("due");
  const now = new Date();
  const mk  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthPay = payments.filter((p) => {
    if (!p.paidAt) return false;
    const d = new Date(p.paidAt.seconds * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === mk;
  });
  const monthRev = monthPay.reduce((s, p) => s + p.amount, 0);

  const sortedMembers  = [...members].sort((a, b) => a.dueDate.seconds - b.dueDate.seconds);
  const sortedPayments = [...payments].sort((a, b) => (b.paidAt?.seconds ?? 0) - (a.paidAt?.seconds ?? 0));
  const dueCount       = sortedMembers.filter((m) => getStatus(m.dueDate) !== "active").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#d9ee4f,#a8c020)" }}>
        <p className="text-[#1a2000]/70 text-xs font-bold uppercase tracking-widest">Revenue This Month</p>
        <p className="text-[#1a2000] text-3xl font-black mt-1">{fmtINR(monthRev)}</p>
        <p className="text-[#1a2000]/60 text-xs mt-1">{monthPay.length} payments collected</p>
      </div>

      <div className="flex bg-[#1c1b1c] rounded-2xl p-1 border border-white/5">
        {(["due", "history"] as const).map((t) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              subTab === t ? "bg-[#d9ee4f] text-[#1a2000]" : "text-neutral-500"
            }`}>
            {t === "due" ? `Due ${dueCount > 0 ? `(${dueCount})` : ""}` : "History"}
          </button>
        ))}
      </div>

      {subTab === "due" && (
        <div className="flex flex-col gap-3">
          {sortedMembers.length === 0 ? (
            <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">No members added yet</p>
            </div>
          ) : (
            sortedMembers.map((m) => {
              const status = getStatus(m.dueDate);
              return (
                <div key={m.id} className={`bg-[#1c1b1c] rounded-2xl border flex items-center gap-3 p-4 ${
                  status === "overdue"  ? "border-red-900/40" :
                  status === "due_soon" ? "border-amber-500/30" : "border-white/5"
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-white font-bold text-sm truncate">{m.name}</p>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-neutral-500 text-xs">Due {fmtDate(m.dueDate)} · {fmtINR(m.feeAmount)}</p>
                  </div>
                  {status !== "active" && (
                    <button onClick={() => onMarkPaid(m)} disabled={busy === m.id}
                      className="shrink-0 flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl disabled:opacity-50 transition-all active:scale-[0.97]">
                      {busy === m.id
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><Check className="w-3.5 h-3.5" /> Paid</>}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {subTab === "history" && (
        <div className="flex flex-col gap-2">
          {sortedPayments.length === 0 ? (
            <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-8 text-center">
              <Receipt className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">No payments recorded yet</p>
            </div>
          ) : (
            sortedPayments.map((p) => (
              <div key={p.id} className="bg-[#1c1b1c] rounded-2xl border border-white/5 flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{p.memberName}</p>
                  <p className="text-neutral-500 text-xs">{fmtDate(p.paidAt)}</p>
                </div>
                <span className="text-emerald-400 font-bold text-sm shrink-0">{fmtINR(p.amount)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Coupon Sheet ──────────────────────────────────────────────────────────────

function CouponSheet({ onSave, onClose, busy }: {
  onSave: (f: CouponForm) => void; onClose: () => void; busy: boolean;
}) {
  const [form, setForm] = useState<CouponForm>({
    code: genCode(), discount: "", discountType: "percent", expiresAt: "", maxUses: "0",
  });
  const set = (k: keyof CouponForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const ok  = form.code.trim() && form.discount.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[390px] bg-[#1c1b1c] rounded-t-3xl border-t border-white/10 p-5 pb-10 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Create Coupon</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#252528] flex items-center justify-center">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Coupon Code *</p>
          <div className="flex gap-2">
            <input value={form.code} onChange={(e) => set("code")(e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20"
              className="flex-1 px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white font-mono text-sm outline-none"
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
            <button onClick={() => set("code")(genCode())}
              className="w-12 h-12 rounded-2xl bg-[#252528] border border-white/10 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Discount Type</p>
          <div className="flex gap-2">
            {(["percent", "flat"] as const).map((t) => (
              <button key={t} onClick={() => set("discountType")(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  form.discountType === t ? "bg-[#d9ee4f] text-[#1a2000] border-[#d9ee4f]" : "bg-[#252528] text-neutral-400 border-white/10"
                }`}>
                {t === "percent" ? "% Percent" : "₹ Flat"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">
            Discount {form.discountType === "percent" ? "(%)" : "(₹)"} *
          </p>
          <input type="number" value={form.discount} onChange={(e) => set("discount")(e.target.value)}
            placeholder={form.discountType === "percent" ? "e.g. 20" : "e.g. 200"}
            className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none"
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
        </div>

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Expiry Date (optional)</p>
          <input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt")(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white text-sm outline-none"
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
        </div>

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Max Uses (0 = unlimited)</p>
          <input type="number" value={form.maxUses} onChange={(e) => set("maxUses")(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none"
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
        </div>

        <button onClick={() => ok && onSave(form)} disabled={!ok || busy}
          className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-40"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
          {busy ? "Creating…" : "Create Coupon"}
        </button>
      </div>
    </div>
  );
}

// ── Coupons Tab ───────────────────────────────────────────────────────────────

function CouponsTab({
  coupons, onAdd, onToggle, onDelete, busy,
}: {
  coupons: Coupon[];
  onAdd: (f: CouponForm) => void;
  onToggle: (id: string, disabled: boolean) => void;
  onDelete: (id: string) => void;
  busy: string | null;
}) {
  const [showSheet, setShowSheet] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => null);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <button onClick={() => setShowSheet(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm mb-4"
        style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
        <Plus className="w-4 h-4" /> Create Coupon
      </button>

      {coupons.length === 0 ? (
        <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-8 text-center">
          <Tag className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-neutral-500 text-sm">No coupons yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {coupons.map((c) => {
            const expired  = !!c.expiresAt && c.expiresAt.seconds * 1000 < Date.now();
            const usedUp   = c.maxUses > 0 && c.usedCount >= c.maxUses;
            const inactive = c.disabled || expired || usedUp;
            return (
              <div key={c.id} className={`bg-[#1c1b1c] rounded-2xl border p-4 ${inactive ? "border-neutral-700/40 opacity-70" : "border-white/5"}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base tracking-widest px-3 py-1 rounded-xl"
                      style={{ background: "rgba(217,238,79,0.1)", color: "#d9ee4f" }}>
                      {c.code}
                    </span>
                    <button onClick={() => copyCode(c.code)}
                      className="w-7 h-7 rounded-lg bg-[#252528] flex items-center justify-center">
                      {copied === c.code
                        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                        : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                    </button>
                  </div>
                  {inactive
                    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-700/30 text-neutral-400 border border-neutral-700/40">
                        {expired ? "Expired" : usedUp ? "Used Up" : "Disabled"}
                      </span>
                    : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>
                  }
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3 flex-wrap">
                  <span>{c.discountType === "percent" ? `${c.discount}% off` : `₹${c.discount} off`}</span>
                  {c.expiresAt && <span>Expires {fmtDate(c.expiresAt)}</span>}
                  <span>{c.maxUses === 0 ? "Unlimited uses" : `${c.usedCount}/${c.maxUses} used`}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onToggle(c.id, !c.disabled)} disabled={busy === c.id}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      c.disabled
                        ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30"
                        : "bg-transparent text-neutral-400 border-neutral-700/50"
                    }`}>
                    {c.disabled ? "Enable" : "Disable"}
                  </button>
                  <button onClick={() => { if (confirm(`Delete coupon ${c.code}?`)) onDelete(c.id); }}
                    disabled={busy === c.id}
                    className="flex-1 py-2 rounded-xl text-xs font-bold border border-red-900/40 text-red-400 bg-transparent hover:bg-red-900/10 transition-all">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showSheet && (
        <CouponSheet
          onSave={(f) => { onAdd(f); setShowSheet(false); }}
          onClose={() => setShowSheet(false)} busy={!!busy}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GymOwnerPage() {
  const router = useRouter();
  const [tab, setTab]               = useState<Tab>("overview");
  const [uid, setUid]               = useState<string | null>(null);
  const [gymId, setGymId]           = useState<string | null>(null);
  const [gymName, setGymName]       = useState("");
  const [gymStatus, setGymStatus]   = useState<string | null>(null);
  const [ready, setReady]           = useState(false);
  const [members, setMembers]       = useState<Member[]>([]);
  const [payments, setPayments]     = useState<FeePayment[]>([]);
  const [coupons, setCoupons]       = useState<Coupon[]>([]);
  const [busy, setBusy]             = useState<string | null>(null);
  const [userEmail, setUserEmail]   = useState("");

  // Auth guard + role check + gym lookup
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login"); return; }
      setUid(u.uid);
      setUserEmail(u.email ?? "");

      const userSnap = await getDoc(doc(db, "users", u.uid)).catch(() => null);
      const role = userSnap?.data()?.role;
      if (role !== "gym_owner") { router.replace("/"); return; }

      const gymSnap = await getDocs(
        query(collection(db, "gyms"), where("ownerId", "==", u.uid))
      ).catch(() => null);

      if (!gymSnap || gymSnap.empty) { setReady(true); return; }

      const gymDoc  = gymSnap.docs[0];
      const gymData = gymDoc.data() as { name?: string; status?: string };
      setGymId(gymDoc.id);
      setGymName(gymData.name ?? "My Gym");
      setGymStatus(gymData.status ?? "pending");
      setReady(true);
    });
  }, [router]);

  // Real-time listeners once gym is known
  useEffect(() => {
    if (!gymId) return;
    const u1 = onSnapshot(
      query(collection(db, "gymMembers"), where("gymId", "==", gymId)),
      (s) => setMembers(s.docs.map((d) => ({ id: d.id, ...d.data() } as Member)))
    );
    const u2 = onSnapshot(
      query(collection(db, "feePayments"), where("gymId", "==", gymId)),
      (s) => setPayments(s.docs.map((d) => ({ id: d.id, ...d.data() } as FeePayment)))
    );
    const u3 = onSnapshot(
      query(collection(db, "coupons"), where("gymId", "==", gymId)),
      (s) => setCoupons(s.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon)))
    );
    return () => { u1(); u2(); u3(); };
  }, [gymId]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const addMember = async (f: MemberForm) => {
    if (!gymId || !uid) return;
    setBusy("adding");
    await addDoc(collection(db, "gymMembers"), {
      gymId, gymOwnerId: uid,
      name: f.name.trim(), phone: f.phone.trim(),
      plan: f.plan, feeAmount: Number(f.feeAmount),
      dueDate: Timestamp.fromDate(new Date(f.dueDate)),
      createdAt: serverTimestamp(),
    }).catch(() => null);
    setBusy(null);
  };

  const editMember = async (id: string, f: MemberForm) => {
    setBusy(id);
    await updateDoc(doc(db, "gymMembers", id), {
      name: f.name.trim(), phone: f.phone.trim(),
      plan: f.plan, feeAmount: Number(f.feeAmount),
      dueDate: Timestamp.fromDate(new Date(f.dueDate)),
    }).catch(() => null);
    setBusy(null);
  };

  const deleteMember = async (id: string) => {
    setBusy(id);
    await deleteDoc(doc(db, "gymMembers", id)).catch(() => null);
    setBusy(null);
  };

  const markAsPaid = async (m: Member) => {
    if (!gymId) return;
    setBusy(m.id);
    const base    = Math.max(m.dueDate.seconds * 1000, Date.now());
    const nextDue = new Date(base + planDays(m.plan) * 24 * 60 * 60 * 1000);
    await Promise.all([
      addDoc(collection(db, "feePayments"), {
        memberId: m.id, memberName: m.name, gymId,
        amount: m.feeAmount, paidAt: serverTimestamp(),
      }),
      updateDoc(doc(db, "gymMembers", m.id), { dueDate: Timestamp.fromDate(nextDue) }),
    ]).catch(() => null);
    setBusy(null);
  };

  const addCoupon = async (f: CouponForm) => {
    if (!gymId || !uid) return;
    setBusy("adding_coupon");
    await addDoc(collection(db, "coupons"), {
      gymId, gymOwnerId: uid,
      code: f.code.trim().toUpperCase(),
      discount: Number(f.discount), discountType: f.discountType,
      expiresAt: f.expiresAt ? Timestamp.fromDate(new Date(f.expiresAt)) : null,
      maxUses: Number(f.maxUses), usedCount: 0, disabled: false,
      createdAt: serverTimestamp(),
    }).catch(() => null);
    setBusy(null);
  };

  const toggleCoupon = async (id: string, disabled: boolean) => {
    setBusy(id);
    await updateDoc(doc(db, "coupons", id), { disabled }).catch(() => null);
    setBusy(null);
  };

  const deleteCoupon = async (id: string) => {
    setBusy(id);
    await deleteDoc(doc(db, "coupons", id)).catch(() => null);
    setBusy(null);
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.replace("/login");
  };

  // ── Render guards ──────────────────────────────────────────────────────────

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#131314]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  if (!gymId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#131314] px-6">
        <div className="bg-[#1c1b1c] rounded-3xl border border-white/5 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(217,238,79,0.1)", border: "1px solid rgba(217,238,79,0.2)" }}>
            <Building2 className="w-8 h-8" style={{ color: "#d9ee4f" }} />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">No Gym Registered</h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-6">
            Register your gym first. Once approved by the admin you&apos;ll have access to the full dashboard.
          </p>
          <button onClick={() => router.push("/gym")}
            className="w-full py-3.5 rounded-2xl font-bold text-sm"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
            Register My Gym
          </button>
          <button onClick={handleSignOut}
            className="w-full py-3 mt-2 text-neutral-500 text-sm font-medium">
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  if (gymStatus === "pending") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#131314] px-6">
        <div className="bg-[#1c1b1c] rounded-3xl border border-amber-500/20 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-amber-500/10 border border-amber-500/20">
            <Building2 className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Pending Approval</h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Your gym <span className="text-white font-semibold">{gymName}</span> is under review. You&apos;ll get access once the admin approves it.
          </p>
          <button onClick={handleSignOut}
            className="w-full mt-6 py-3 rounded-2xl text-neutral-500 text-sm font-medium border border-white/10">
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  if (gymStatus === "rejected") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#131314] px-6">
        <div className="bg-[#1c1b1c] rounded-3xl border border-red-900/30 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-900/10 border border-red-900/30">
            <Building2 className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Application Rejected</h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Your gym application was rejected. Contact support for more information.
          </p>
          <button onClick={handleSignOut}
            className="w-full mt-6 py-3 rounded-2xl text-neutral-500 text-sm font-medium border border-white/10">
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  const overdue  = members.filter((m) => getStatus(m.dueDate) === "overdue").length;
  const dueSoon  = members.filter((m) => getStatus(m.dueDate) === "due_soon").length;
  const needsBadge = overdue + dueSoon;

  // ── Dashboard ──────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#131314] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#131314]/90 backdrop-blur-md border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-base leading-tight truncate max-w-[200px]">{gymName}</h1>
          <p className="text-neutral-500 text-[11px] truncate">{userEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          {needsBadge > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 text-[10px] font-bold">{needsBadge}</span>
            </div>
          )}
          <button onClick={handleSignOut}
            className="w-9 h-9 rounded-full bg-[#1c1b1c] border border-red-900/30 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-5">
        {tab === "overview"    && <OverviewTab members={members} payments={payments} />}
        {tab === "members"     && <MembersTab  members={members} onAdd={addMember} onEdit={editMember} onDelete={deleteMember} busy={busy} />}
        {tab === "fees"        && <FeesTab     members={members} payments={payments} onMarkPaid={markAsPaid} busy={busy} />}
        {tab === "coupons"     && <CouponsTab  coupons={coupons} onAdd={addCoupon} onToggle={toggleCoupon} onDelete={deleteCoupon} busy={busy} />}
        {tab === "leaderboard" && uid && (
          <div className="-mx-4 -mt-5">
            <Chest1RMLeaderboard
              gymId={gymId}
              gymName={gymName}
              currentUserId={uid}
              currentUserName={userEmail.split("@")[0]}
            />
          </div>
        )}
      </div>

      <GymBottomNav active={tab} onChange={setTab} />
    </main>
  );
}
