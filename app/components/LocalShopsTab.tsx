"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  MapPin, Phone, MessageCircle, Navigation,
  CheckCircle, Search, Store, Package, ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Shop = {
  id: string; ownerId: string; name: string; category: string;
  area: string; city: string; lat: number; lng: number;
  phone: string; whatsapp: string; mapsLink: string;
  photoUrl: string; openingHours: string;
  verified: boolean; disabled?: boolean;
};

type Listing = {
  id: string; shopId: string; productName: string; brand: string;
  price: number; quantityLabel: string; inStock: boolean;
  updatedAt: { seconds: number } | null;
};

type ShopWithListings = Shop & { listings: Listing[]; distanceKm?: number };
export type SortOption = "nearest" | "cheapest" | "updated";

// ── Constants ──────────────────────────────────────────────────────────────

export const LOCAL_CATEGORY_FILTERS = [
  "All", "Whey", "Creatine", "Pre-Workout", "BCAA", "Mass Gainer", "Vitamins",
];

const SHOP_CAT_EMOJI: Record<string, string> = {
  supplements: "💊", equipment: "🏋️", apparel: "👕", food: "🥗", other: "🛍️",
};
const SHOP_CAT_LABEL: Record<string, string> = {
  supplements: "Supplements", equipment: "Equipment",
  apparel: "Apparel", food: "Food & Nutrition", other: "Other",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function fmtDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}
function categoryOf(listing: Listing): string {
  const n = listing.productName.toLowerCase();
  if (n.includes("whey") || (n.includes("protein") && !n.includes("pre"))) return "Whey";
  if (n.includes("creatine")) return "Creatine";
  if (n.includes("pre") || n.includes("pre-workout")) return "Pre-Workout";
  if (n.includes("bcaa") || n.includes("amino")) return "BCAA";
  if (n.includes("mass") || n.includes("gainer")) return "Mass Gainer";
  if (n.includes("vitamin") || n.includes("multivit")) return "Vitamins";
  return "";
}
function matchesFilter(listing: Listing, cat: string): boolean {
  return cat === "All" || categoryOf(listing) === cat;
}

// ── Shop Card ──────────────────────────────────────────────────────────────

function ShopCard({ shop, onTap, isOwner, onManage }: {
  shop: ShopWithListings; onTap: () => void; isOwner: boolean; onManage: () => void;
}) {
  const inStock = shop.listings.filter((l) => l.inStock);
  const emoji   = SHOP_CAT_EMOJI[shop.category] ?? "🛍️";
  const catLbl  = SHOP_CAT_LABEL[shop.category] ?? shop.category;

  return (
    <div
      className="bg-[#1c1b1c] rounded-2xl border border-white/5 overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
      onClick={onTap}
    >
      {/* Top: photo or emoji placeholder */}
      {shop.photoUrl ? (
        <div className="w-full h-32 overflow-hidden">
          <img src={shop.photoUrl} alt={shop.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-20 bg-[#252528] flex items-center justify-center">
          <span className="text-4xl">{emoji}</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-white font-bold text-sm leading-tight truncate">{shop.name}</h3>
              <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                <CheckCircle className="w-2.5 h-2.5" /> Verified
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-neutral-500 bg-[#252528] px-2 py-0.5 rounded-md">{emoji} {catLbl}</span>
              <span className="text-[10px] text-neutral-500 flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" /> {shop.area}, {shop.city}
              </span>
              {shop.distanceKm !== undefined && shop.lat !== 0 && (
                <span className="text-[10px] text-[#d9ee4f] font-semibold">{fmtDist(shop.distanceKm)}</span>
              )}
            </div>
            {shop.openingHours && (
              <p className="text-neutral-600 text-[10px] mt-1">{shop.openingHours}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
        </div>

        {/* In-stock products preview */}
        {inStock.length > 0 && (
          <div className="border-t border-white/5 pt-3 mt-2 flex flex-col gap-1.5">
            {inStock.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center justify-between">
                <p className="text-neutral-400 text-xs truncate flex-1">{l.productName}{l.brand ? ` · ${l.brand}` : ""}</p>
                <span className="text-[#d9ee4f] font-bold text-xs ml-2 shrink-0">₹{l.price.toLocaleString("en-IN")}</span>
              </div>
            ))}
            {inStock.length > 3 && (
              <p className="text-neutral-600 text-[10px]">+{inStock.length - 3} more in stock</p>
            )}
          </div>
        )}

        {inStock.length === 0 && (
          <div className="border-t border-white/5 pt-3 mt-2">
            <p className="text-neutral-600 text-xs italic">No products currently listed</p>
          </div>
        )}

        {/* Quick action buttons */}
        <div className="flex gap-2 mt-3">
          <a href={`tel:${shop.phone}`} onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-2 rounded-xl border border-white/10 bg-[#252528] text-neutral-400">
            <Phone className="w-3 h-3" /> Call
          </a>
          {shop.whatsapp && (
            <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`}
              target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>
          )}
          {shop.mapsLink && (
            <a href={shop.mapsLink} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-2 rounded-xl border border-white/10 bg-[#252528] text-neutral-400">
              <Navigation className="w-3 h-3" /> Map
            </a>
          )}
          {isOwner && (
            <button onClick={(e) => { e.stopPropagation(); onManage(); }}
              className="ml-auto flex items-center gap-1 text-[11px] font-bold px-2.5 py-2 rounded-xl"
              style={{ background: "rgba(217,238,79,0.1)", color: "#d9ee4f", border: "1px solid rgba(217,238,79,0.2)" }}>
              Manage
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function LocalShopsTab({ catFilter, sort }: { catFilter: string; sort: SortOption }) {
  const router = useRouter();
  const [user, setUser]             = useState<User | null>(null);
  const [shops, setShops]           = useState<Shop[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus]   = useState<"loading" | "granted" | "denied">("loading");
  const [citySearch, setCitySearch] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsStatus("granted"); },
      () => setGpsStatus("denied"),
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "shops"), (snap) =>
      setShops(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop)))
    );
    const u2 = onSnapshot(collection(db, "shopListings"), (snap) =>
      setAllListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)))
    );
    return () => { u1(); u2(); };
  }, []);

  const shopsWithListings = useMemo<ShopWithListings[]>(() => {
    return shops
      .filter((shop) => {
        if (!shop.verified) return false;
        if (shop.disabled) return false;
        if (gpsStatus === "denied" && citySearch.trim()) {
          const q = citySearch.toLowerCase();
          return shop.city.toLowerCase().includes(q) || shop.area.toLowerCase().includes(q);
        }
        return true;
      })
      .map((shop) => {
        const shopListings = allListings
          .filter((l) => l.shopId === shop.id)
          .filter((l) => matchesFilter(l, catFilter));
        const distanceKm = userCoords && shop.lat && shop.lng
          ? haversine(userCoords.lat, userCoords.lng, shop.lat, shop.lng)
          : undefined;
        return { ...shop, listings: shopListings, distanceKm };
      })
      .sort((a, b) => {
        if (sort === "nearest") {
          if (a.distanceKm === undefined) return 1;
          if (b.distanceKm === undefined) return -1;
          return a.distanceKm - b.distanceKm;
        }
        if (sort === "cheapest") {
          const aMin = a.listings.length ? Math.min(...a.listings.map((l) => l.price)) : Infinity;
          const bMin = b.listings.length ? Math.min(...b.listings.map((l) => l.price)) : Infinity;
          return aMin - bMin;
        }
        const aT = Math.max(...a.listings.map((l) => l.updatedAt?.seconds ?? 0), 0);
        const bT = Math.max(...b.listings.map((l) => l.updatedAt?.seconds ?? 0), 0);
        return bT - aT;
      });
  }, [shops, allListings, catFilter, sort, userCoords, gpsStatus, citySearch]);

  const myShop = shops.find((s) => s.ownerId === user?.uid);

  return (
    <>
      {/* GPS denied — city search */}
      {gpsStatus === "denied" && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              value={citySearch} onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search by city or area…"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/5 bg-[#1c1b1c] text-white placeholder:text-neutral-600 text-sm focus:outline-none"
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.3)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}
            />
          </div>
          <p className="text-neutral-600 text-[11px] mt-1.5 pl-1">
            Location access denied — search by city to find nearby shops
          </p>
        </div>
      )}

      {shopsWithListings.length === 0 ? (
        <div className="text-center py-12">
          <Store className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">
            {gpsStatus === "denied" && citySearch.trim()
              ? `No verified shops found in "${citySearch}"`
              : "No verified shops listed yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shopsWithListings.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onTap={() => router.push(`/shop/${shop.id}`)}
              isOwner={shop.ownerId === user?.uid}
              onManage={() => router.push("/shop/dashboard")}
            />
          ))}
        </div>
      )}

      {/* CTA: list your shop / manage */}
      {!myShop ? (
        <button
          onClick={() => user ? router.push("/shop/register") : router.push("/login")}
          className="w-full mt-4 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed border-[#d9ee4f]/20 bg-[#d9ee4f]/5"
        >
          <Store className="w-5 h-5" style={{ color: "#d9ee4f" }} />
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color: "#d9ee4f" }}>Own a shop? List your prices free</p>
            <p className="text-xs text-neutral-500 mt-0.5">Reach local gym-goers · Free forever</p>
          </div>
        </button>
      ) : (
        <button onClick={() => router.push("/shop/dashboard")}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#d9ee4f]/20 bg-[#d9ee4f]/5 font-semibold text-sm"
          style={{ color: "#d9ee4f" }}>
          <Store className="w-4 h-4" /> Manage My Shop — {myShop.name}
        </button>
      )}
    </>
  );
}
