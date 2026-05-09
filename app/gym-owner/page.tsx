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
  LayoutDashboard, Users, Receipt, UserPlus, TrendingDown,
  Plus, Trash2, Edit2, Check, X,
  Phone, AlertCircle, LogOut, Search, Copy,
  Building2, CheckCircle2, Clock, Zap, Home, Wrench, UserCheck, MoreHorizontal,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "members" | "fees" | "invite" | "expenses";
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
type Expense = {
  id: string; gymId: string;
  category: string; description: string;
  amount: number; date: { seconds: number };
  createdAt: { seconds: number } | null;
};
type MemberForm  = { name: string; phone: string; plan: string; feeAmount: string; dueDate: string };
type ExpenseForm = { category: string; description: string; amount: string; date: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const PLANS = ["Monthly", "Quarterly", "Annual", "Custom"];
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const EMPTY_MFORM: MemberForm  = { name: "", phone: "", plan: "Monthly", feeAmount: "", dueDate: "" };
const EMPTY_EFORM: ExpenseForm = { category: "Electricity", description: "", amount: "", date: "" };
const EXPENSE_CATEGORIES = ["Electricity", "Rent", "Equipment", "Staff", "Maintenance", "Other"];

const CATEGORY_ICON: Record<string, React.ElementType> = {
  Electricity: Zap,
  Rent: Home,
  Equipment: Wrench,
  Staff: UserCheck,
  Maintenance: Wrench,
  Other: MoreHorizontal,
};

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
function monthKey(ts: { seconds: number } | null) {
  if (!ts) return "";
  const d = new Date(ts.seconds * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

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

// ── OvStat ────────────────────────────────────────────────────────────────────

function OvStat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-4 flex flex-col gap-1">
      <span className="text-neutral-500 text-[10px] font-semibold uppercase tracking-widest">{label}</span>
      <span className="text-2xl font-black leading-tight" style={{ color: accent ? "#d9ee4f" : "#fff" }}>{value}</span>
      {sub && <span className="text-[10px] text-neutral-600">{sub}</span>}
    </div>
  );
}

// ── Floating Pill Nav ─────────────────────────────────────────────────────────

const NAV_TABS: { key: Tab; label: string; Icon: React.ElementType; isCenter?: boolean }[] = [
  { key: "overview",  label: "Overview", Icon: LayoutDashboard },
  { key: "members",   label: "Members",  Icon: Users },
  { key: "fees",      label: "Fees",     Icon: Receipt, isCenter: true },
  { key: "invite",    label: "Invite",   Icon: UserPlus },
  { key: "expenses",  label: "Expenses", Icon: TrendingDown },
];

function GymBottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[380px]">
      <div
        className="rounded-full px-4 py-2 flex items-center justify-between border border-white/10"
        style={{ backgroundColor: "#1c1b1c", boxShadow: "0 4px 32px rgba(0,0,0,0.5)" }}
      >
        {NAV_TABS.map(({ key, label, Icon, isCenter }) => {
          const isActive = active === key;
          if (isCenter) {
            return (
              <button key={key} onClick={() => onChange(key)} className="relative flex items-center justify-center">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center border-[3px] hover:scale-105 active:scale-95 transition-all"
                  style={{
                    backgroundColor: "#d9ee4f",
                    borderColor: "#131314",
                    boxShadow: "0 4px 16px rgba(217,238,79,0.35)",
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#131314" }} />
                </div>
              </button>
            );
          }
          return (
            <button
              key={key} onClick={() => onChange(key)}
              className="flex flex-col items-center gap-0.5 min-w-[44px] py-1"
            >
              <Icon className="w-5 h-5" style={{ color: isActive ? "#d9ee4f" : "#636366" }} />
              <span className="text-[10px] font-semibold" style={{ color: isActive ? "#d9ee4f" : "#636366" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ members, payments, expenses }: {
  members: Member[]; payments: FeePayment[]; expenses: Expense[];
}) {
  const now = new Date();
  const mk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthPay = payments.filter((p) => monthKey(p.paidAt) === mk);
  const monthExp = expenses.filter((e) => monthKey(e.date) === mk);
  const monthRev = monthPay.reduce((s, p) => s + p.amount, 0);
  const monthExpTotal = monthExp.reduce((s, e) => s + e.amount, 0);
  const profit = monthRev - monthExpTotal;

  const active  = members.filter((m) => getStatus(m.dueDate) === "active").length;
  const dueSoon = members.filter((m) => getStatus(m.dueDate) === "due_soon").length;
  const overdue = members.filter((m) => getStatus(m.dueDate) === "overdue").length;

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

      {/* Revenue + Profit card */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#d9ee4f,#a8c020)" }}>
        <p className="text-[#1a2000]/70 text-xs font-bold uppercase tracking-widest">Revenue This Month</p>
        <p className="text-[#1a2000] text-4xl font-black mt-1">{fmtINR(monthRev)}</p>
        <p className="text-[#1a2000]/60 text-xs mt-1">{monthPay.length} payments collected</p>
        <div className="mt-3 pt-3 border-t border-[#1a2000]/15 flex items-center justify-between">
          <div>
            <p className="text-[#1a2000]/60 text-[10px] font-bold uppercase tracking-widest">Expenses</p>
            <p className="text-[#1a2000]/80 text-lg font-black">{fmtINR(monthExpTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-[#1a2000]/60 text-[10px] font-bold uppercase tracking-widest">Net Profit</p>
            <p className="text-lg font-black" style={{ color: profit >= 0 ? "#1a2000" : "#ef4444" }}>
              {profit >= 0 ? "" : "-"}{fmtINR(Math.abs(profit))}
            </p>
          </div>
        </div>
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

function MemberSheet({ initial, onSave, onClose, busy }: {
  initial: MemberForm | null; onSave: (f: MemberForm) => void;
  onClose: () => void; busy: boolean;
}) {
  const [form, setForm] = useState<MemberForm>(initial ?? EMPTY_MFORM);
  const set = (k: keyof MemberForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const ok = form.name.trim() && form.phone.trim() && form.feeAmount.trim() && form.dueDate;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
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

function MembersTab({ members, onAdd, onEdit, onDelete, busy }: {
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

function FeesTab({ members, payments, onMarkPaid, busy }: {
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

// ── Invite Tab ────────────────────────────────────────────────────────────────

function InviteTab({ inviteCode, gymName, isPending }: {
  inviteCode: string; gymName: string; isPending: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPending || !inviteCode) {
    return (
      <div className="bg-[#1c1b1c] rounded-2xl border border-amber-500/20 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-amber-400" />
        </div>
        <h3 className="text-white font-bold text-base mb-2">Awaiting Admin Approval</h3>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Your invite code will appear here once the admin verifies and approves your gym. Share it with members so they can join your leaderboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-6 text-center">
        <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-4">Your Gym Invite Code</p>
        <div
          className="rounded-2xl py-5 px-6 mb-4"
          style={{ background: "rgba(217,238,79,0.08)", border: "1px solid rgba(217,238,79,0.2)" }}
        >
          <span className="font-mono font-black text-4xl tracking-[0.35em]" style={{ color: "#d9ee4f" }}>
            {inviteCode}
          </span>
        </div>
        <button
          onClick={copy}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
        >
          {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
        </button>
      </div>

      <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-5">
        <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-4">How It Works</p>
        <div className="flex flex-col gap-4">
          {[
            { n: "1", title: "Share the code", desc: "Send this code to your gym members via WhatsApp, SMS, or in person." },
            { n: "2", title: "Member opens the app", desc: "They tap 'Join a Gym' on the gym screen and enter this code." },
            { n: "3", title: "Instantly connected", desc: `They appear on ${gymName}'s leaderboard and can compete with other members.` },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-black"
                style={{ background: "rgba(217,238,79,0.15)", color: "#d9ee4f" }}>
                {n}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{title}</p>
                <p className="text-neutral-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-neutral-600 text-xs text-center">
        This is a permanent code for your gym. Only share it with verified members.
      </p>
    </div>
  );
}

// ── Expense Sheet ─────────────────────────────────────────────────────────────

function ExpenseSheet({ initial, onSave, onClose, busy }: {
  initial: ExpenseForm | null; onSave: (f: ExpenseForm) => void;
  onClose: () => void; busy: boolean;
}) {
  const [form, setForm] = useState<ExpenseForm>(initial ?? EMPTY_EFORM);
  const set = (k: keyof ExpenseForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const ok = form.amount.trim() && form.date;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[390px] bg-[#1c1b1c] rounded-t-3xl border-t border-white/10 p-5 pb-10 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{initial ? "Edit Expense" : "Add Expense"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#252528] flex items-center justify-center">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Category</p>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((c) => (
              <button key={c} onClick={() => set("category")(c)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  form.category === c
                    ? "bg-[#d9ee4f] text-[#1a2000] border-[#d9ee4f]"
                    : "bg-[#252528] text-neutral-400 border-white/10"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Description (optional)</p>
          <input
            type="text" value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            placeholder="e.g. Monthly electricity bill"
            className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none"
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
        </div>

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Amount (₹) *</p>
          <input
            type="number" value={form.amount}
            onChange={(e) => set("amount")(e.target.value)}
            placeholder="e.g. 3500"
            className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none"
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
        </div>

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Date *</p>
          <input
            type="date" value={form.date}
            onChange={(e) => set("date")(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white text-sm outline-none"
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
        </div>

        <button onClick={() => ok && onSave(form)} disabled={!ok || busy}
          className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-40"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
          {busy ? "Saving…" : initial ? "Update Expense" : "Add Expense"}
        </button>
      </div>
    </div>
  );
}

// ── Expenses Tab ──────────────────────────────────────────────────────────────

function ExpensesTab({ expenses, payments, onAdd, onEdit, onDelete, busy }: {
  expenses: Expense[]; payments: FeePayment[];
  onAdd: (f: ExpenseForm) => void; onEdit: (id: string, f: ExpenseForm) => void;
  onDelete: (id: string) => void; busy: string | null;
}) {
  const [sheet, setSheet] = useState<{ mode: "add" | "edit"; expense?: Expense } | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const now = new Date();
  const mk  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthExp = expenses.filter((e) => monthKey(e.date) === mk);
  const monthPay = payments.filter((p) => monthKey(p.paidAt) === mk);
  const monthRev = monthPay.reduce((s, p) => s + p.amount, 0);
  const monthExpTotal = monthExp.reduce((s, e) => s + e.amount, 0);
  const profit = monthRev - monthExpTotal;

  const sorted = [...expenses].sort((a, b) => b.date.seconds - a.date.seconds);
  const filtered = filter === "All" ? sorted : sorted.filter((e) => e.category === filter);

  const byCategory = EXPENSE_CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = monthExp.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {});

  const handleSave = (form: ExpenseForm) => {
    if (sheet?.mode === "edit" && sheet.expense) onEdit(sheet.expense.id, form);
    else onAdd(form);
    setSheet(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}>
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Expenses</p>
          <p className="text-white text-2xl font-black mt-1">{fmtINR(monthExpTotal)}</p>
          <p className="text-white/60 text-[10px] mt-0.5">this month</p>
        </div>
        <div className="rounded-2xl p-4" style={{
          background: profit >= 0
            ? "linear-gradient(135deg,#22c55e,#15803d)"
            : "linear-gradient(135deg,#f97316,#c2410c)",
        }}>
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Net Profit</p>
          <p className="text-white text-2xl font-black mt-1">
            {profit >= 0 ? "" : "-"}{fmtINR(Math.abs(profit))}
          </p>
          <p className="text-white/60 text-[10px] mt-0.5">{profit >= 0 ? "after expenses" : "net loss"}</p>
        </div>
      </div>

      {/* Category breakdown (only if there are expenses this month) */}
      {monthExpTotal > 0 && (
        <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-4">
          <p className="text-neutral-500 text-[10px] font-semibold uppercase tracking-widest mb-3">This Month by Category</p>
          <div className="flex flex-col gap-2">
            {EXPENSE_CATEGORIES.filter((c) => byCategory[c] > 0).map((c) => {
              const pct = monthExpTotal > 0 ? (byCategory[c] / monthExpTotal) * 100 : 0;
              return (
                <div key={c}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-400 text-xs font-medium">{c}</span>
                    <span className="text-white text-xs font-bold">{fmtINR(byCategory[c])}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#d9ee4f" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter chips + add button */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto flex-1 pb-1 no-scrollbar">
          {["All", ...EXPENSE_CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                filter === c
                  ? "bg-[#d9ee4f] text-[#1a2000] border-[#d9ee4f]"
                  : "bg-[#1c1b1c] text-neutral-400 border-white/10"
              }`}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setSheet({ mode: "add" })}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#d9ee4f" }}>
          <Plus className="w-4 h-4 text-[#1a2000]" />
        </button>
      </div>

      {/* Expense list */}
      {filtered.length === 0 ? (
        <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-8 text-center">
          <TrendingDown className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-neutral-500 text-sm">
            {expenses.length === 0 ? "No expenses yet — track your first one" : "No expenses in this category"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((e) => {
            const CatIcon = CATEGORY_ICON[e.category] ?? MoreHorizontal;
            return (
              <div key={e.id} className="bg-[#1c1b1c] rounded-2xl border border-white/5 flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <CatIcon className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-white font-bold text-sm">
                      {e.description || e.category}
                    </p>
                    {e.description && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#252528] text-neutral-500">
                        {e.category}
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-500 text-xs">{fmtDate(e.date)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-red-400 font-bold text-sm mr-1">{fmtINR(e.amount)}</span>
                  <button onClick={() => setSheet({ mode: "edit", expense: e })}
                    className="w-7 h-7 rounded-lg bg-[#252528] flex items-center justify-center">
                    <Edit2 className="w-3 h-3 text-neutral-400" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this expense?")) onDelete(e.id); }}
                    disabled={busy === e.id}
                    className="w-7 h-7 rounded-lg bg-[#252528] flex items-center justify-center disabled:opacity-40">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sheet && (
        <ExpenseSheet
          initial={sheet.expense ? {
            category: sheet.expense.category,
            description: sheet.expense.description,
            amount: String(sheet.expense.amount),
            date: new Date(sheet.expense.date.seconds * 1000).toISOString().slice(0, 10),
          } : null}
          onSave={handleSave} onClose={() => setSheet(null)} busy={!!busy}
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
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [inviteCode, setInviteCode] = useState("");
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
      const gymData = gymDoc.data() as { name?: string; status?: string; inviteCode?: string };
      setGymId(gymDoc.id);
      setGymName(gymData.name ?? "My Gym");
      setGymStatus(gymData.status ?? "pending");
      setInviteCode(gymData.inviteCode ?? "");
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
      query(collection(db, "gymExpenses"), where("gymId", "==", gymId)),
      (s) => setExpenses(s.docs.map((d) => ({ id: d.id, ...d.data() } as Expense)))
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

  const addExpense = async (f: ExpenseForm) => {
    if (!gymId || !uid) return;
    setBusy("adding_expense");
    await addDoc(collection(db, "gymExpenses"), {
      gymId, gymOwnerId: uid,
      category: f.category,
      description: f.description.trim(),
      amount: Number(f.amount),
      date: Timestamp.fromDate(new Date(f.date)),
      createdAt: serverTimestamp(),
    }).catch(() => null);
    setBusy(null);
  };

  const editExpense = async (id: string, f: ExpenseForm) => {
    setBusy(id);
    await updateDoc(doc(db, "gymExpenses", id), {
      category: f.category,
      description: f.description.trim(),
      amount: Number(f.amount),
      date: Timestamp.fromDate(new Date(f.date)),
    }).catch(() => null);
    setBusy(null);
  };

  const deleteExpense = async (id: string) => {
    setBusy(id);
    await deleteDoc(doc(db, "gymExpenses", id)).catch(() => null);
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
            Register your gym to get started. You can manage members and fees right away — it goes live to others once the admin approves it.
          </p>
          <button onClick={() => router.push("/gym?mode=create")}
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

  const overdue    = members.filter((m) => getStatus(m.dueDate) === "overdue").length;
  const dueSoon    = members.filter((m) => getStatus(m.dueDate) === "due_soon").length;
  const needsBadge = overdue + dueSoon;

  // ── Dashboard ──────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#131314] pb-28">
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

      {/* Pending verification banner */}
      {gymStatus === "pending" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-amber-400 text-xs font-medium leading-snug">
            <span className="font-bold">Under review</span> — your gym is visible to you only. Members can join once admin approves it.
          </p>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-5">
        {tab === "overview" && (
          <OverviewTab members={members} payments={payments} expenses={expenses} />
        )}
        {tab === "members" && (
          <MembersTab members={members} onAdd={addMember} onEdit={editMember} onDelete={deleteMember} busy={busy} />
        )}
        {tab === "fees" && (
          <FeesTab members={members} payments={payments} onMarkPaid={markAsPaid} busy={busy} />
        )}
        {tab === "invite" && (
          <InviteTab inviteCode={inviteCode} gymName={gymName} isPending={gymStatus === "pending"} />
        )}
        {tab === "expenses" && (
          <ExpensesTab
            expenses={expenses} payments={payments}
            onAdd={addExpense} onEdit={editExpense} onDelete={deleteExpense}
            busy={busy}
          />
        )}
      </div>

      <GymBottomNav active={tab} onChange={setTab} />
    </main>
  );
}
