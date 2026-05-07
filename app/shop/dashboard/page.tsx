"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  ArrowLeft, CheckCircle, Clock, Plus, Trash2,
  ChevronUp, Store, MapPin, Phone,
} from "lucide-react";

type Shop = {
  id: string;
  ownerId: string;
  name: string;
  area: string;
  city: string;
  phone: string;
  whatsapp: string;
  verified: boolean;
};

type Listing = {
  id: string;
  shopId: string;
  productName: string;
  brand: string;
  price: number;
  quantityLabel: string;
  inStock: boolean;
  updatedAt: { seconds: number } | null;
};

const PRODUCT_SUGGESTIONS = [
  "Whey Protein", "Creatine Monohydrate", "Pre-Workout", "BCAA",
  "Mass Gainer", "Casein Protein", "Fish Oil", "Multivitamin",
  "Glutamine", "Beta-Alanine", "Protein Bar", "Caffeine Tablets",
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ width: 40, height: 22, backgroundColor: on ? "#d9ee4f" : "#3a3a3c" }}
      className="rounded-full relative transition-colors"
    >
      <div
        className="absolute top-[3px] w-4 h-4 rounded-full shadow transition-all"
        style={{
          backgroundColor: on ? "#1a2000" : "white",
          left: on ? "20px" : "3px",
        }}
      />
    </button>
  );
}

export default function ShopDashboardPage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [quantityLabel, setQuantityLabel] = useState("");
  const [inStock, setInStock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let shopUnsub: (() => void) | null = null;
    const authUnsub = onAuthStateChanged(auth, (u) => {
      if (shopUnsub) { shopUnsub(); shopUnsub = null; }
      if (!u) { router.replace("/login"); return; }
      const q = query(collection(db, "shops"), where("ownerId", "==", u.uid));
      shopUnsub = onSnapshot(q, (snap) => {
        if (snap.empty) { router.replace("/shop/register"); return; }
        const d = snap.docs[0];
        setShop({ id: d.id, ...d.data() } as Shop);
        setLoading(false);
      });
    });
    return () => { authUnsub(); shopUnsub?.(); };
  }, [router]);

  useEffect(() => {
    if (!shop?.id) return;
    const q = query(collection(db, "shopListings"), where("shopId", "==", shop.id));
    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
    });
    return unsub;
  }, [shop?.id]);

  const suggestions = PRODUCT_SUGGESTIONS.filter(
    (s) => productName.length > 0 && s.toLowerCase().includes(productName.toLowerCase())
  );

  const resetForm = () => {
    setProductName(""); setBrand(""); setPrice(""); setQuantityLabel(""); setInStock(true);
    setShowSuggestions(false); setShowForm(false);
  };

  const handleAdd = async () => {
    const p = parseFloat(price);
    if (!productName.trim() || isNaN(p) || p <= 0 || !shop) return;
    setSubmitting(true);
    await addDoc(collection(db, "shopListings"), {
      shopId: shop.id, productName: productName.trim(), brand: brand.trim(),
      price: p, quantityLabel: quantityLabel.trim(), inStock, updatedAt: serverTimestamp(),
    }).catch(() => null);
    resetForm();
    showToast("Product added!");
    setSubmitting(false);
  };

  const handleToggleStock = async (listing: Listing) => {
    await updateDoc(doc(db, "shopListings", listing.id), {
      inStock: !listing.inStock, updatedAt: serverTimestamp(),
    }).catch(() => null);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "shopListings", id)).catch(() => null);
    showToast("Product removed");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#131314]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#131314] pb-12">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg pointer-events-none"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
          {toast}
        </div>
      )}

      <div className="w-full max-w-md mx-auto px-5">
        <div className="flex items-center gap-3 pt-12 pb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-[#1c1b1c] border border-white/10 flex items-center justify-center hover:bg-[#252528] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </button>
          <h1 className="text-white text-xl font-black">My Shop</h1>
        </div>

        {shop && (
          <div className="bg-[#1c1b1c] rounded-[24px] border border-white/5 p-5 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <h2 className="text-white font-bold text-lg">{shop.name}</h2>
                  {shop.verified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
                      style={{ background: "rgba(217,238,79,0.1)", borderColor: "rgba(217,238,79,0.2)", color: "#d9ee4f" }}>
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-900/30 bg-amber-900/10">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500 text-sm">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{shop.area}, {shop.city}</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500 text-sm mt-1">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{shop.phone}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#252528] flex items-center justify-center shrink-0">
                <Store className="w-6 h-6 text-neutral-400" />
              </div>
            </div>
            {!shop.verified && (
              <div className="mt-4 rounded-xl px-3 py-2.5 border"
                style={{ background: "rgba(217,238,79,0.04)", borderColor: "rgba(217,238,79,0.12)" }}>
                <p className="text-xs leading-relaxed" style={{ color: "#d9ee4f80" }}>
                  Your shop is under review. Once verified, it will appear in the Local Shops feed with a Verified badge.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-neutral-300 font-semibold text-sm">
            Products ({listings.length})
          </h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            style={showForm
              ? { background: "rgba(255,255,255,0.06)", color: "#737373", border: "1px solid rgba(255,255,255,0.08)" }
              : { background: "rgba(217,238,79,0.1)", color: "#d9ee4f", border: "1px solid rgba(217,238,79,0.2)" }}
          >
            {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? "Cancel" : "Add Product"}
          </button>
        </div>

        {showForm && (
          <div className="bg-[#1c1b1c] rounded-[24px] border border-white/5 p-4 mb-3 flex flex-col gap-3">
            <div className="relative">
              <p className="text-neutral-500 text-xs font-medium mb-1.5">Product Name *</p>
              <input
                value={productName}
                onChange={(e) => { setProductName(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="e.g. Whey Protein"
                className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none transition-all"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1b1c] border border-white/10 rounded-xl shadow-lg z-10 overflow-hidden">
                  {suggestions.slice(0, 5).map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => { setProductName(s); setShowSuggestions(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-[#252528] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-neutral-500 text-xs font-medium mb-1.5">Brand</p>
                <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Optimum Nutrition"
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#252528] text-sm text-white placeholder:text-neutral-600 outline-none transition-all" />
              </div>
              <div>
                <p className="text-neutral-500 text-xs font-medium mb-1.5">Price (₹) *</p>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 2999"
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#252528] text-sm text-white placeholder:text-neutral-600 outline-none transition-all" />
              </div>
            </div>

            <div>
              <p className="text-neutral-500 text-xs font-medium mb-1.5">Size / Qty</p>
              <input value={quantityLabel} onChange={(e) => setQuantityLabel(e.target.value)} placeholder="e.g. 1kg · 30 servings"
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#252528] text-sm text-white placeholder:text-neutral-600 outline-none transition-all" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-300 text-sm font-medium">In Stock</span>
              <Toggle on={inStock} onToggle={() => setInStock((v) => !v)} />
            </div>

            <button
              onClick={handleAdd}
              disabled={!productName.trim() || !price || submitting}
              className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
            >
              {submitting ? "Adding..." : "Add Product"}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-[#1c1b1c] rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{listing.productName}</p>
                  <p className="text-neutral-500 text-xs">
                    {[listing.brand, listing.quantityLabel].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="font-bold text-sm shrink-0" style={{ color: "#d9ee4f" }}>
                  ₹{listing.price.toLocaleString()}
                </span>
                <Toggle on={listing.inStock} onToggle={() => handleToggleStock(listing)} />
                <button
                  onClick={() => handleDelete(listing.id)}
                  className="w-7 h-7 rounded-lg bg-red-900/20 flex items-center justify-center hover:bg-red-900/40 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
              {!listing.inStock && (
                <div className="px-4 py-1.5 bg-[#252528] border-t border-white/5">
                  <span className="text-neutral-500 text-xs">Out of stock — hidden from buyers</span>
                </div>
              )}
            </div>
          ))}

          {listings.length === 0 && !showForm && (
            <div className="text-center py-12 bg-[#1c1b1c] rounded-[24px] border border-white/5">
              <Store className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm font-medium">No products yet</p>
              <p className="text-neutral-600 text-xs mt-1">Add your first product to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                style={{ background: "rgba(217,238,79,0.1)", color: "#d9ee4f", border: "1px solid rgba(217,238,79,0.2)" }}
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
