"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, collection, query, where, getDocs,
  addDoc, updateDoc, serverTimestamp, increment,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Navigation,
  CheckCircle2, Clock, Package, Send, Star, Image as ImageIcon,
} from "lucide-react";

const SHOP_CATEGORIES = [
  { key: "supplements", label: "Supplements", emoji: "💊" },
  { key: "equipment",   label: "Equipment",   emoji: "🏋️" },
  { key: "apparel",     label: "Apparel",      emoji: "👕" },
  { key: "food",        label: "Food",         emoji: "🥗" },
  { key: "other",       label: "Other",        emoji: "🛍️" },
];

type Shop = {
  id: string; ownerId: string; name: string; category: string;
  address: string; area: string; city: string; pincode: string;
  phone: string; whatsapp: string; mapsLink: string; photoUrl: string;
  openingHours: string; verified: boolean; viewCount: number;
};

type Listing = {
  id: string; productName: string; brand: string; price: number;
  quantityLabel: string; category: string; description: string;
  photoUrl: string; inStock: boolean;
};

function catEmoji(key: string) {
  return SHOP_CATEGORIES.find((c) => c.key === key)?.emoji ?? "🛍️";
}
function catLabel(key: string) {
  return SHOP_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export default function ShopProfilePage() {
  const params    = useParams();
  const router    = useRouter();
  const shopId    = params.id as string;
  const countedRef = useRef(false);

  const [shop, setShop]           = useState<Shop | null>(null);
  const [listings, setListings]   = useState<Listing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [userId, setUserId]       = useState<string | null>(null);
  const [userName, setUserName]   = useState("");

  // Inquiry form
  const [selectedProduct, setSelectedProduct] = useState("");
  const [message, setMessage]     = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUserId(u?.uid ?? null);
    if (u?.displayName) setUserName(u.displayName);
    else if (u?.email) setUserName(u.email.split("@")[0]);
  }), []);

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const snap = await getDoc(doc(db, "shops", shopId)).catch(() => null);
      if (!snap || !snap.exists()) { setNotFound(true); setLoading(false); return; }
      setShop({ id: snap.id, ...snap.data() } as Shop);

      const lSnap = await getDocs(
        query(collection(db, "shopListings"), where("shopId", "==", shopId))
      ).catch(() => null);
      if (lSnap) setListings(lSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));

      setLoading(false);
    })();
  }, [shopId]);

  // Increment view count once
  useEffect(() => {
    if (!shopId || countedRef.current) return;
    countedRef.current = true;
    updateDoc(doc(db, "shops", shopId), { viewCount: increment(1) }).catch(() => null);
  }, [shopId]);

  const handleSendInquiry = async () => {
    if (!message.trim() || !userId || !shop) return;
    setSending(true);
    await addDoc(collection(db, "shopInquiries"), {
      shopId: shop.id, shopOwnerId: shop.ownerId,
      userId, userName: userName || "Anonymous",
      userPhone: userPhone.trim(),
      productName: selectedProduct,
      message: message.trim(),
      replies: [], read: false,
      createdAt: serverTimestamp(),
    }).catch(() => null);
    setSent(true);
    setMessage(""); setSelectedProduct(""); setUserPhone("");
    setSending(false);
    setTimeout(() => setSent(false), 3000);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#131314]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  if (notFound || !shop) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#131314] px-6 gap-4">
        <p className="text-neutral-400 text-sm">Shop not found</p>
        <button onClick={() => router.back()} className="text-[#d9ee4f] font-bold text-sm">← Go back</button>
      </main>
    );
  }

  const inStock = listings.filter((l) => l.inStock);

  return (
    <main className="min-h-screen bg-[#131314] pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#131314]/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-[#1c1b1c] border border-white/10 flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-neutral-400" />
        </button>
        <h1 className="text-white font-black text-base truncate">{shop.name}</h1>
        {shop.verified
          ? <span className="ml-auto shrink-0 flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" /> Verified
            </span>
          : <span className="ml-auto shrink-0 flex items-center gap-1 text-amber-400 text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
              <Clock className="w-2.5 h-2.5" /> Pending
            </span>
        }
      </div>

      <div className="px-4 pt-4 flex flex-col gap-5">
        {/* Shop photo */}
        {shop.photoUrl ? (
          <div className="w-full h-48 rounded-2xl overflow-hidden bg-[#1c1b1c]">
            <img src={shop.photoUrl} alt={shop.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 rounded-2xl bg-[#1c1b1c] border border-white/5 flex items-center justify-center">
            <span className="text-5xl">{catEmoji(shop.category)}</span>
          </div>
        )}

        {/* Shop info */}
        <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div>
              <h2 className="text-white font-black text-xl">{shop.name}</h2>
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-neutral-400 bg-[#252528] px-2 py-0.5 rounded-lg">
                {catEmoji(shop.category)} {catLabel(shop.category)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            {(shop.address || shop.area) && (
              <div className="flex items-start gap-2 text-neutral-400">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-600" />
                <span>{[shop.address, shop.area, shop.city, shop.pincode].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {shop.openingHours && (
              <div className="flex items-center gap-2 text-neutral-400">
                <Clock className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
                <span>{shop.openingHours}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <a href={`tel:${shop.phone}`}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl border border-white/10 bg-[#252528] text-neutral-300">
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
            {shop.whatsapp && (
              <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {shop.mapsLink && (
              <a href={shop.mapsLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl border border-white/10 bg-[#252528] text-neutral-300">
                <Navigation className="w-3.5 h-3.5" /> Directions
              </a>
            )}
          </div>
        </div>

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-base">Products</h3>
            <span className="text-neutral-500 text-xs">{inStock.length} in stock</span>
          </div>

          {listings.length === 0 ? (
            <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-8 text-center">
              <Package className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">No products listed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listings.map((l) => (
                <div key={l.id} className={`bg-[#1c1b1c] rounded-2xl border overflow-hidden flex flex-col ${
                  l.inStock ? "border-white/5" : "border-white/5 opacity-60"
                }`}>
                  <div className="w-full h-28 bg-[#252528] flex items-center justify-center overflow-hidden">
                    {l.photoUrl
                      ? <img src={l.photoUrl} alt={l.productName} className="w-full h-full object-cover" />
                      : <Package className="w-7 h-7 text-neutral-700" />
                    }
                  </div>
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <p className="text-white font-bold text-xs leading-tight line-clamp-2">{l.productName}</p>
                    {l.brand && <p className="text-neutral-500 text-[10px]">{l.brand}</p>}
                    {l.description && <p className="text-neutral-500 text-[10px] line-clamp-2">{l.description}</p>}
                    <p className="font-black text-sm mt-auto" style={{ color: "#d9ee4f" }}>₹{l.price.toLocaleString("en-IN")}</p>
                    {l.quantityLabel && <p className="text-neutral-600 text-[10px]">{l.quantityLabel}</p>}
                    {!l.inStock && <p className="text-red-400 text-[10px] font-bold">Out of stock</p>}
                  </div>
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => setSelectedProduct(l.productName)}
                      className="w-full py-2 rounded-xl text-xs font-bold border transition-all"
                      style={selectedProduct === l.productName
                        ? { backgroundColor: "#d9ee4f", color: "#1a2000", borderColor: "#d9ee4f" }
                        : { backgroundColor: "transparent", color: "#d9ee4f", borderColor: "rgba(217,238,79,0.3)" }
                      }>
                      {selectedProduct === l.productName ? "✓ Selected" : "Ask About This"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inquiry form */}
        <div className="bg-[#1c1b1c] rounded-2xl border border-white/5 p-5">
          <h3 className="text-white font-bold text-base mb-4">Send an Inquiry</h3>

          {!userId ? (
            <div className="text-center py-4">
              <p className="text-neutral-500 text-sm mb-3">Sign in to send an inquiry to this shop</p>
              <button onClick={() => router.push("/login")}
                className="px-6 py-2.5 rounded-xl font-bold text-sm"
                style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
                Sign In
              </button>
            </div>
          ) : sent ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-white font-bold text-sm">Inquiry sent!</p>
              <p className="text-neutral-500 text-xs">The shop owner will reply shortly.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedProduct && (
                <div className="flex items-center justify-between bg-[#252528] rounded-xl px-3 py-2">
                  <span className="text-neutral-400 text-xs">About: <span className="text-white font-bold">{selectedProduct}</span></span>
                  <button onClick={() => setSelectedProduct("")} className="text-neutral-600 text-xs">✕</button>
                </div>
              )}

              <div>
                <p className="text-neutral-500 text-xs font-medium mb-1.5">Your Message *</p>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Is this product available? What's the price for bulk order?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none resize-none"
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>

              <div>
                <p className="text-neutral-500 text-xs font-medium mb-1.5">Your WhatsApp (optional)</p>
                <input value={userPhone} onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  type="tel"
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none"
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
                <p className="text-neutral-600 text-[10px] mt-1">So the shop can reply via WhatsApp</p>
              </div>

              <button onClick={handleSendInquiry} disabled={!message.trim() || sending}
                className="w-full py-3.5 rounded-2xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}>
                <Send className="w-4 h-4" />
                {sending ? "Sending…" : "Send Inquiry"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
