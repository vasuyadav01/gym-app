"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  query, where, serverTimestamp, getDoc, arrayUnion, Timestamp, increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import {
  LayoutDashboard, Store, Package, MessageCircle, Settings,
  CheckCircle2, Clock, Plus, Trash2, Edit2, X, LogOut,
  Phone, MapPin, Link2, AlertCircle, Copy, Eye, Send,
  ChevronDown, ChevronUp, Image as ImageIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "myshop" | "products" | "inquiries" | "settings";

type Shop = {
  id: string; ownerId: string; ownerName: string; email: string;
  phone: string; name: string; category: string;
  address: string; area: string; city: string; pincode: string;
  whatsapp: string; openingHours: string; mapsLink: string; photoUrl: string;
  lat: number; lng: number; verified: boolean; disabled: boolean;
  viewCount: number; createdAt: { seconds: number } | null;
};

type Listing = {
  id: string; shopId: string; productName: string; brand: string;
  price: number; quantityLabel: string; category: string;
  description: string; photoUrl: string; inStock: boolean;
  updatedAt: { seconds: number } | null;
};

type Inquiry = {
  id: string; shopId: string; shopOwnerId: string;
  userId: string; userName: string; userPhone: string;
  productName: string; message: string;
  replies: { text: string; from: "owner" | "member"; at: { seconds: number } }[];
  read: boolean; createdAt: { seconds: number } | null;
};

type ListingForm = {
  productName: string; brand: string; price: string; quantityLabel: string;
  category: string; description: string; photoUrl: string; inStock: boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const SHOP_CATEGORIES = [
  { key: "supplements", label: "Supplements", emoji: "💊" },
  { key: "equipment",   label: "Equipment",   emoji: "🏋️" },
  { key: "apparel",     label: "Apparel",      emoji: "👕" },
  { key: "food",        label: "Food",         emoji: "🥗" },
  { key: "other",       label: "Other",        emoji: "🛍️" },
];

const LISTING_CATS = ["Supplements", "Equipment", "Apparel", "Food", "Other"];

const EMPTY_LFORM: ListingForm = {
  productName: "", brand: "", price: "", quantityLabel: "",
  category: "Supplements", description: "", photoUrl: "", inStock: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(ts: { seconds: number } | null) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(ts: { seconds: number }) {
  return new Date(ts.seconds * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function catEmoji(key: string) {
  return SHOP_CATEGORIES.find((c) => c.key === key)?.emoji ?? "🛍️";
}
function catLabel(key: string) {
  return SHOP_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      style={{ width: 40, height: 22, backgroundColor: on ? "#d9ee4f" : "#3a3a3c" }}
      className="rounded-full relative transition-colors shrink-0">
      <div className="absolute top-[3px] w-4 h-4 rounded-full shadow transition-all"
        style={{ backgroundColor: on ? "#1a2000" : "white", left: on ? "20px" : "3px" }} />
    </button>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = "text", textarea = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; textarea?: boolean;
}) {
  const cls = "w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none";
  const handlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)",
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)",
  };
  return (
    <div>
      <p className="text-neutral-500 text-xs font-medium mb-1.5">{label}</p>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            rows={3} className={`${cls} resize-none`} {...handlers} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className={cls} {...handlers} />
      }
    </div>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────

function ShopBottomNav({ active, onChange, unreadCount }: {
  active: Tab; onChange: (t: Tab) => void; unreadCount: number;
}) {
  const items: { key: Tab; label: string; Icon: React.ElementType; isCenter?: boolean }[] = [
    { key: "overview",   label: "Overview",  Icon: LayoutDashboard },
    { key: "myshop",     label: "Shop",      Icon: Store },
    { key: "products",   label: "Products",  Icon: Package, isCenter: true },
    { key: "inquiries",  label: "Inquiries", Icon: MessageCircle },
    { key: "settings",   label: "Settings",  Icon: Settings },
  ];
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[380px]">
      <div className="rounded-full px-4 py-2 flex items-center justify-between border border-white/10"
        style={{ backgroundColor: "#1c1b1c", boxShadow: "0 4px 32px rgba(0,0,0,0.5)" }}>
        {items.map(({ key, label, Icon, isCenter }) => {
          const isActive = active === key;
          if (isCenter) {
            return (
              <button key={key} onClick={() => onChange(key)} className="relative flex items-center justify-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center border-[3px] hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: "#d9ee4f", borderColor: "#131314", boxShadow: "0 4px 16px rgba(217,238,79,0.35)" }}>
                  <Icon className="w-5 h-5" style={{ color: "#131314" }} />
                </div>
              </button>
            );
          }
          return (
            <button key={key} onClick={() => onChange(key)}
              className="relative flex flex-col items-center gap-0.5 min-w-[44px] py-1">
              <Icon className="w-5 h-5" style={{ color: isActive ? "#d9ee4f" : "#636366" }} />
              <span className="text-[10px] font-semibold" style={{ color: isActive ? "#d9ee4f" : "#636366" }}>{label}</span>
              {key === "inquiries" && unreadCount > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ shop, listingCount, inquiryCount }: {
  shop: Shop; listingCount: number; inquiryCount: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Verification status */}
      {shop.verified ? (
        <div className="rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Shop Verified & Live</h3>
              <p className="text-emerald-400/70 text-xs mt-0.5">Visible to all members in the marketplace</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-5 border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Under Review</h3>
              <p className="text-amber-400/70 text-xs mt-0.5">Admin will verify your shop. You&apos;ll be notified when it goes live.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Products", value: listingCount },
          { label: "Inquiries", value: inquiryCount },
          { label: "Views", value: shop.viewCount ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-4 flex flex-col gap-1">
            <span className="text-neutral-500 text-[10px] font-semibold uppercase tracking-widest">{label}</span>
            <span className="text-2xl font-black text-white">{value}</span>
          </div>
        ))}
      </div>

      {/* Quick info */}
      <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-4 flex flex-col gap-3">
        <p className="text-neutral-500 text-[10px] font-semibold uppercase tracking-widest">Shop Details</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{catEmoji(shop.category)}</span>
          <span className="text-white font-medium">{catLabel(shop.category)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
          <span>{shop.area}, {shop.city}</span>
        </div>
        {shop.openingHours && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
            <span>{shop.openingHours}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── My Shop Tab ───────────────────────────────────────────────────────────────

function MyShopTab({ shop }: { shop: Shop }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Photo */}
      {shop.photoUrl ? (
        <div className="w-full h-48 rounded-2xl overflow-hidden bg-[#1c1b1c]">
          <img src={shop.photoUrl} alt={shop.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-32 rounded-2xl bg-[#1c1b1c] border border-white/5 flex flex-col items-center justify-center gap-2">
          <ImageIcon className="w-8 h-8 text-neutral-600" />
          <p className="text-neutral-600 text-xs">No shop photo — add one in Settings</p>
        </div>
      )}

      {/* Shop name + category */}
      <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{catEmoji(shop.category)}</span>
          <div>
            <h2 className="text-white font-black text-lg">{shop.name}</h2>
            <span className="text-neutral-500 text-xs font-medium">{catLabel(shop.category)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          {shop.address && (
            <div className="flex items-start gap-2 text-neutral-400">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-600" />
              <span>{shop.address}, {shop.area}, {shop.city} – {shop.pincode}</span>
            </div>
          )}
          {!shop.address && (
            <div className="flex items-center gap-2 text-neutral-400">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
              <span>{shop.area}, {shop.city}</span>
            </div>
          )}
          {shop.openingHours && (
            <div className="flex items-center gap-2 text-neutral-400">
              <Clock className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
              <span>{shop.openingHours}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-neutral-400">
            <Phone className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
            <span>{shop.phone}</span>
          </div>
          {shop.whatsapp && (
            <div className="flex items-center gap-2 text-neutral-400">
              <MessageCircle className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
              <span>{shop.whatsapp}</span>
            </div>
          )}
          {shop.mapsLink && (
            <div className="flex items-center gap-2 text-neutral-400">
              <Link2 className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
              <a href={shop.mapsLink} target="_blank" rel="noopener noreferrer"
                className="text-[#d9ee4f] underline underline-offset-2 text-xs">
                View on Google Maps
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Owner */}
      <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-5">
        <p className="text-neutral-500 text-[10px] font-semibold uppercase tracking-widest mb-3">Owner</p>
        <p className="text-white font-bold text-sm">{shop.ownerName}</p>
        <p className="text-neutral-500 text-xs mt-0.5">{shop.email}</p>
      </div>
    </div>
  );
}

// ── Listing Sheet ─────────────────────────────────────────────────────────────

function ListingSheet({ initial, onSave, onClose, busy }: {
  initial: ListingForm | null; onSave: (f: ListingForm) => void;
  onClose: () => void; busy: boolean;
}) {
  const [form, setForm] = useState<ListingForm>(initial ?? EMPTY_LFORM);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof ListingForm) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `shopListings/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      set("photoUrl")(url);
    } catch { /* ignore upload error */ }
    setUploading(false);
  };

  const ok = form.productName.trim() && form.price.trim();

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[390px] bg-[#1c1b1c] rounded-t-3xl border-t border-white/10 p-5 pb-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{initial ? "Edit Product" : "Add Product"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#252528] flex items-center justify-center">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <Field label="Product Name *" value={form.productName}
          onChange={(v) => set("productName")(v)} placeholder="e.g. Gold Standard Whey" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand" value={form.brand} onChange={(v) => set("brand")(v)} placeholder="e.g. Optimum" />
          <Field label="Price (₹) *" value={form.price} onChange={(v) => set("price")(v)} placeholder="e.g. 2999" type="number" />
        </div>

        <Field label="Size / Qty" value={form.quantityLabel} onChange={(v) => set("quantityLabel")(v)} placeholder="e.g. 1kg · 30 servings" />

        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Category</p>
          <div className="flex flex-wrap gap-2">
            {LISTING_CATS.map((c) => (
              <button key={c} onClick={() => set("category")(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  form.category === c ? "bg-[#d9ee4f] text-[#1a2000] border-[#d9ee4f]" : "bg-[#252528] text-neutral-400 border-white/10"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <Field label="Description" value={form.description} onChange={(v) => set("description")(v)}
          placeholder="Short product description…" textarea />

        {/* Photo */}
        <div>
          <p className="text-neutral-500 text-xs font-medium mb-1.5">Product Photo</p>
          {form.photoUrl && (
            <div className="w-full h-32 rounded-xl overflow-hidden mb-2 bg-[#252528]">
              <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex gap-2">
            <input value={form.photoUrl} onChange={(e) => set("photoUrl")(e.target.value)}
              placeholder="Paste image URL…"
              className="flex-1 px-3 py-2.5 rounded-xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none"
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
            <label className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 bg-[#252528] text-neutral-400 text-xs font-bold cursor-pointer hover:border-[#d9ee4f]/40 transition-all">
              {uploading ? <div className="w-3 h-3 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#252528] rounded-2xl px-4 py-3">
          <span className="text-neutral-300 text-sm font-medium">In Stock</span>
          <Toggle on={form.inStock} onToggle={() => set("inStock")(!form.inStock)} />
        </div>

        <button onClick={() => ok && onSave(form)} disabled={!ok || busy}
          className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-40"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
          {busy ? "Saving…" : initial ? "Update Product" : "Add Product"}
        </button>
      </div>
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────────────────

function ProductsTab({ listings, onAdd, onEdit, onDelete, onToggleStock, busy }: {
  listings: Listing[];
  onAdd: (f: ListingForm) => void; onEdit: (id: string, f: ListingForm) => void;
  onDelete: (id: string) => void; onToggleStock: (l: Listing) => void;
  busy: string | null;
}) {
  const [sheet, setSheet] = useState<{ mode: "add" | "edit"; listing?: Listing } | null>(null);

  const handleSave = (form: ListingForm) => {
    if (sheet?.mode === "edit" && sheet.listing) onEdit(sheet.listing.id, form);
    else onAdd(form);
    setSheet(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-neutral-400 text-sm font-semibold">{listings.length} products</p>
        <button onClick={() => setSheet({ mode: "add" })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
          style={{ background: "rgba(217,238,79,0.1)", color: "#d9ee4f", border: "1px solid rgba(217,238,79,0.2)" }}>
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-10 text-center">
          <Package className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">No products yet</p>
          <button onClick={() => setSheet({ mode: "add" })}
            className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold"
            style={{ background: "rgba(217,238,79,0.1)", color: "#d9ee4f", border: "1px solid rgba(217,238,79,0.2)" }}>
            Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-[#1c1b1c] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
              {/* Photo */}
              <div className="w-full h-28 bg-[#252528] flex items-center justify-center overflow-hidden">
                {l.photoUrl
                  ? <img src={l.photoUrl} alt={l.productName} className="w-full h-full object-cover" />
                  : <Package className="w-8 h-8 text-neutral-700" />}
              </div>
              {/* Info */}
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <p className="text-white font-bold text-xs leading-tight line-clamp-2">{l.productName}</p>
                {l.brand && <p className="text-neutral-500 text-[10px]">{l.brand}</p>}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold bg-[#252528] text-neutral-400 px-1.5 py-0.5 rounded-md">{l.category}</span>
                </div>
                <p className="font-black text-sm mt-auto" style={{ color: "#d9ee4f" }}>₹{l.price.toLocaleString("en-IN")}</p>
                {l.quantityLabel && <p className="text-neutral-600 text-[10px]">{l.quantityLabel}</p>}
              </div>
              {/* Actions */}
              <div className="border-t border-white/5 px-3 py-2 flex items-center justify-between">
                <Toggle on={l.inStock} onToggle={() => onToggleStock(l)} />
                <div className="flex items-center gap-1">
                  <button onClick={() => setSheet({ mode: "edit", listing: l })}
                    className="w-7 h-7 rounded-lg bg-[#252528] flex items-center justify-center">
                    <Edit2 className="w-3 h-3 text-neutral-400" />
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${l.productName}"?`)) onDelete(l.id); }}
                    disabled={busy === l.id}
                    className="w-7 h-7 rounded-lg bg-[#252528] flex items-center justify-center disabled:opacity-40">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>
              {!l.inStock && (
                <div className="px-3 py-1.5 bg-[#252528]">
                  <p className="text-neutral-500 text-[10px]">Out of stock</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {sheet && (
        <ListingSheet
          initial={sheet.listing ? {
            productName: sheet.listing.productName, brand: sheet.listing.brand,
            price: String(sheet.listing.price), quantityLabel: sheet.listing.quantityLabel,
            category: sheet.listing.category, description: sheet.listing.description,
            photoUrl: sheet.listing.photoUrl, inStock: sheet.listing.inStock,
          } : null}
          onSave={handleSave} onClose={() => setSheet(null)} busy={!!busy}
        />
      )}
    </div>
  );
}

// ── Inquiries Tab ─────────────────────────────────────────────────────────────

function InquiriesTab({ inquiries, shopWhatsapp, onReply, onMarkRead }: {
  inquiries: Inquiry[]; shopWhatsapp: string;
  onReply: (id: string, text: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const sorted = [...inquiries].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
  });

  const handleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = prev === id ? null : id;
      if (next) onMarkRead(id);
      return next;
    });
    setReplyText("");
  };

  const handleReply = (id: string) => {
    if (!replyText.trim()) return;
    onReply(id, replyText.trim());
    setReplyText("");
  };

  if (inquiries.length === 0) {
    return (
      <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-10 text-center">
        <MessageCircle className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
        <p className="text-neutral-500 text-sm">No inquiries yet</p>
        <p className="text-neutral-600 text-xs mt-1">Members will message you here about your products</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((inq) => {
        const isOpen = expanded === inq.id;
        return (
          <div key={inq.id} className={`bg-[#1c1b1c] rounded-2xl border overflow-hidden transition-all ${
            !inq.read ? "border-[#d9ee4f]/20" : "border-white/5"
          }`}>
            <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => handleExpand(inq.id)}>
              <div className="w-9 h-9 rounded-xl bg-[#252528] flex items-center justify-center shrink-0 text-sm font-black text-neutral-400">
                {inq.userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-bold text-sm truncate">{inq.userName}</p>
                  {!inq.read && <span className="w-2 h-2 rounded-full bg-[#d9ee4f] shrink-0" />}
                </div>
                {inq.productName && (
                  <p className="text-neutral-500 text-[10px] mb-0.5">About: {inq.productName}</p>
                )}
                <p className="text-neutral-400 text-xs line-clamp-1">{inq.message}</p>
                <p className="text-neutral-600 text-[10px] mt-1">{fmtDate(inq.createdAt)}</p>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0 mt-1" />}
            </button>

            {isOpen && (
              <div className="border-t border-white/5 p-4 flex flex-col gap-3">
                {/* Member message */}
                <div className="bg-[#252528] rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-white text-sm">{inq.message}</p>
                  {inq.userPhone && (
                    <p className="text-neutral-500 text-xs mt-1">📱 {inq.userPhone}</p>
                  )}
                </div>

                {/* Replies thread */}
                {inq.replies.map((r, i) => (
                  <div key={i} className={`flex ${r.from === "owner" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      r.from === "owner"
                        ? "bg-[#d9ee4f] text-[#1a2000] rounded-br-sm"
                        : "bg-[#252528] text-white rounded-bl-sm"
                    }`}>
                      {r.text}
                    </div>
                  </div>
                ))}

                {/* Reply input */}
                <div className="flex gap-2 mt-1">
                  <input
                    value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply…"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none"
                    onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                    onKeyDown={(e) => { if (e.key === "Enter") handleReply(inq.id); }}
                  />
                  <button onClick={() => handleReply(inq.id)} disabled={!replyText.trim()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40"
                    style={{ backgroundColor: "#d9ee4f" }}>
                    <Send className="w-4 h-4 text-[#1a2000]" />
                  </button>
                </div>

                {/* WhatsApp CTA */}
                {inq.userPhone && (
                  <a
                    href={`https://wa.me/${inq.userPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${inq.userName}, regarding your inquiry about ${inq.productName || "our product"} — `)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                    <MessageCircle className="w-3.5 h-3.5" /> Continue on WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

function SettingsTab({ shop, onSaveShop, onSignOut }: {
  shop: Shop; onSaveShop: (data: Partial<Shop>) => Promise<void>; onSignOut: () => void;
}) {
  const SHOP_CATS = [
    { key: "supplements", label: "Supplements", emoji: "💊" },
    { key: "equipment",   label: "Equipment",   emoji: "🏋️" },
    { key: "apparel",     label: "Apparel",      emoji: "👕" },
    { key: "food",        label: "Food",         emoji: "🥗" },
    { key: "other",       label: "Other",        emoji: "🛍️" },
  ];

  const [ownerName,    setOwnerName]    = useState(shop.ownerName);
  const [phone,        setPhone]        = useState(shop.phone);
  const [shopName,     setShopName]     = useState(shop.name);
  const [category,     setCategory]     = useState(shop.category);
  const [address,      setAddress]      = useState(shop.address ?? "");
  const [area,         setArea]         = useState(shop.area);
  const [city,         setCity]         = useState(shop.city);
  const [pincode,      setPincode]      = useState(shop.pincode ?? "");
  const [whatsapp,     setWhatsapp]     = useState(shop.whatsapp ?? "");
  const [openingHours, setOpeningHours] = useState(shop.openingHours ?? "");
  const [mapsLink,     setMapsLink]     = useState(shop.mapsLink ?? "");
  const [photoUrl,     setPhotoUrl]     = useState(shop.photoUrl ?? "");
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);

  const [curPw,  setCurPw]  = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [confPw, setConfPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [pwBusy,  setPwBusy]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSaveShop({
      ownerName, phone, name: shopName, category,
      address, area, city, pincode, whatsapp, openingHours, mapsLink, photoUrl,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPw !== confPw) { setPwError("Passwords don't match"); return; }
    if (newPw.length < 6)  { setPwError("New password must be at least 6 characters"); return; }
    setPwBusy(true); setPwError("");
    const user = auth.currentUser;
    if (!user || !user.email) { setPwBusy(false); return; }
    try {
      const cred = EmailAuthProvider.credential(user.email, curPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setCurPw(""); setNewPw(""); setConfPw("");
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch {
      setPwError("Current password is incorrect");
    }
    setPwBusy(false);
  };

  const section = (title: string) => (
    <p className="text-neutral-500 text-[10px] font-semibold uppercase tracking-widest mb-3">{title}</p>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Personal */}
      <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
        {section("Personal Info")}
        <Field label="Your Name" value={ownerName} onChange={setOwnerName} placeholder="Full name" />
        <Field label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" type="tel" />
      </div>

      {/* Shop details */}
      <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
        {section("Shop Details")}
        <Field label="Shop Name" value={shopName} onChange={setShopName} placeholder="Shop name" />
        <div>
          <p className="text-neutral-500 text-xs font-medium mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            {SHOP_CATS.map((c) => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  category === c.key ? "bg-[#d9ee4f] text-[#1a2000] border-[#d9ee4f]" : "bg-[#252528] text-neutral-400 border-white/10"
                }`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Full Address" value={address} onChange={setAddress} placeholder="Street address" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Area / Locality" value={area} onChange={setArea} placeholder="e.g. Koramangala" />
          <Field label="City" value={city} onChange={setCity} placeholder="e.g. Bangalore" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pincode" value={pincode} onChange={setPincode} placeholder="560001" />
          <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="+91 98765 43210" type="tel" />
        </div>
        <Field label="Opening Hours" value={openingHours} onChange={setOpeningHours} placeholder="e.g. 9 AM – 9 PM, Mon–Sat" />
        <Field label="Google Maps Link" value={mapsLink} onChange={setMapsLink} placeholder="https://maps.google.com/…" />
        <Field label="Shop Photo URL" value={photoUrl} onChange={setPhotoUrl} placeholder="https://i.imgur.com/…" />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-40"
        style={{ backgroundColor: saved ? "#22c55e" : "#d9ee4f", color: "#1a2000" }}>
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
      </button>

      {/* Password */}
      <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
        {section("Change Password")}
        <Field label="Current Password" value={curPw} onChange={setCurPw} type="password" placeholder="••••••••" />
        <Field label="New Password" value={newPw} onChange={setNewPw} type="password" placeholder="Min. 6 characters" />
        <Field label="Confirm New Password" value={confPw} onChange={setConfPw} type="password" placeholder="Repeat new password" />
        {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
        <button onClick={handlePasswordChange} disabled={!curPw || !newPw || !confPw || pwBusy}
          className="w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-40"
          style={{ backgroundColor: pwSaved ? "#22c55e" : "#d9ee4f", color: "#1a2000" }}>
          {pwBusy ? "Updating…" : pwSaved ? "Password Updated ✓" : "Change Password"}
        </button>
      </div>

      {/* Sign out */}
      <button onClick={onSignOut}
        className="w-full py-3.5 rounded-2xl text-red-400 font-bold text-sm border border-red-900/30 bg-red-900/10">
        Sign Out
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ShopDashboardPage() {
  const router = useRouter();
  const [tab, setTab]         = useState<Tab>("overview");
  const [shop, setShop]       = useState<Shop | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [ready, setReady]     = useState(false);
  const [busy, setBusy]       = useState<string | null>(null);
  const [verifiedToast, setVerifiedToast] = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const prevVerifiedRef       = useRef<boolean | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Auth + shop listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace("/login"); return; }
      const q = query(collection(db, "shops"), where("ownerId", "==", u.uid));
      const unsub = onSnapshot(q, (snap) => {
        if (snap.empty) { router.replace("/shop/register"); return; }
        const d = snap.docs[0];
        const data = { id: d.id, ...d.data() } as Shop;
        // Verified transition notification
        if (prevVerifiedRef.current === false && data.verified === true) {
          setVerifiedToast(true);
          setTimeout(() => setVerifiedToast(false), 5000);
        }
        prevVerifiedRef.current = data.verified;
        setShop(data);
        setReady(true);
      });
      return unsub;
    });
  }, [router]);

  // Listings listener
  useEffect(() => {
    if (!shop?.id) return;
    return onSnapshot(
      query(collection(db, "shopListings"), where("shopId", "==", shop.id)),
      (s) => setListings(s.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)))
    );
  }, [shop?.id]);

  // Inquiries listener
  useEffect(() => {
    if (!shop?.id) return;
    return onSnapshot(
      query(collection(db, "shopInquiries"), where("shopId", "==", shop.id)),
      (s) => setInquiries(s.docs.map((d) => ({ id: d.id, ...d.data() } as Inquiry)))
    );
  }, [shop?.id]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const addListing = async (f: ListingForm) => {
    if (!shop) return;
    setBusy("adding");
    await addDoc(collection(db, "shopListings"), {
      shopId: shop.id, ownerId: shop.ownerId,
      productName: f.productName.trim(), brand: f.brand.trim(),
      price: Number(f.price), quantityLabel: f.quantityLabel.trim(),
      category: f.category, description: f.description.trim(),
      photoUrl: f.photoUrl.trim(), inStock: f.inStock,
      updatedAt: serverTimestamp(),
    }).catch(() => null);
    showToast("Product added");
    setBusy(null);
  };

  const editListing = async (id: string, f: ListingForm) => {
    setBusy(id);
    await updateDoc(doc(db, "shopListings", id), {
      productName: f.productName.trim(), brand: f.brand.trim(),
      price: Number(f.price), quantityLabel: f.quantityLabel.trim(),
      category: f.category, description: f.description.trim(),
      photoUrl: f.photoUrl.trim(), inStock: f.inStock,
      updatedAt: serverTimestamp(),
    }).catch(() => null);
    showToast("Product updated");
    setBusy(null);
  };

  const deleteListing = async (id: string) => {
    setBusy(id);
    await deleteDoc(doc(db, "shopListings", id)).catch(() => null);
    showToast("Product removed");
    setBusy(null);
  };

  const toggleStock = async (l: Listing) => {
    await updateDoc(doc(db, "shopListings", l.id), { inStock: !l.inStock, updatedAt: serverTimestamp() }).catch(() => null);
  };

  const replyToInquiry = async (id: string, text: string) => {
    await updateDoc(doc(db, "shopInquiries", id), {
      replies: arrayUnion({ text, from: "owner", at: Timestamp.now() }),
      read: true,
    }).catch(() => null);
  };

  const markRead = async (id: string) => {
    const inq = inquiries.find((i) => i.id === id);
    if (inq && !inq.read) {
      await updateDoc(doc(db, "shopInquiries", id), { read: true }).catch(() => null);
    }
  };

  const saveShop = async (data: Partial<Shop>) => {
    if (!shop) return;
    await updateDoc(doc(db, "shops", shop.id), data as Record<string, unknown>).catch(() => null);
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.replace("/login");
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!ready || !shop) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#131314]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  const unreadCount = inquiries.filter((i) => !i.read).length;

  // ── Dashboard ──────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#131314] pb-28">
      {/* Verified toast */}
      {verifiedToast && (
        <div className="fixed top-0 left-0 right-0 z-[80] flex justify-center px-4 pt-5">
          <div className="bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            Your shop is verified and live on marketplace ✓
          </div>
        </div>
      )}

      {/* Generic toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg pointer-events-none"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#131314]/90 backdrop-blur-md border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {shop.photoUrl
            ? <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0"><img src={shop.photoUrl} alt="" className="w-full h-full object-cover" /></div>
            : <div className="w-9 h-9 rounded-xl bg-[#252528] flex items-center justify-center shrink-0 text-sm">{catEmoji(shop.category)}</div>
          }
          <div>
            <h1 className="text-white font-black text-base leading-tight truncate max-w-[180px]">{shop.name}</h1>
            <div className="flex items-center gap-1.5">
              {shop.verified
                ? <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Verified</span>
                : <span className="text-amber-400 text-[10px] font-bold flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> Pending</span>
              }
            </div>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="w-9 h-9 rounded-full bg-[#1c1b1c] border border-red-900/30 flex items-center justify-center">
          <LogOut className="w-4 h-4 text-red-400" />
        </button>
      </header>

      {/* Pending banner */}
      {!shop.verified && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-amber-400 text-xs font-medium leading-snug">
            <span className="font-bold">Under review</span> — your shop will appear in the marketplace once the admin verifies it.
          </p>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-5">
        {tab === "overview"  && <OverviewTab shop={shop} listingCount={listings.length} inquiryCount={inquiries.length} />}
        {tab === "myshop"    && <MyShopTab shop={shop} />}
        {tab === "products"  && (
          <ProductsTab listings={listings} onAdd={addListing} onEdit={editListing}
            onDelete={deleteListing} onToggleStock={toggleStock} busy={busy} />
        )}
        {tab === "inquiries" && (
          <InquiriesTab inquiries={inquiries} shopWhatsapp={shop.whatsapp}
            onReply={replyToInquiry} onMarkRead={markRead} />
        )}
        {tab === "settings"  && (
          <SettingsTab shop={shop} onSaveShop={saveShop} onSignOut={handleSignOut} />
        )}
      </div>

      <ShopBottomNav active={tab} onChange={setTab} unreadCount={unreadCount} />
    </main>
  );
}
