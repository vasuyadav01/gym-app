"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  MapPin, Phone, MessageCircle, Navigation,
  CheckCircle, Clock, Search, Store,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Shop = {
  id: string;
  ownerId: string;
  name: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  whatsapp: string;
  mapsLink: string;
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

type ShopWithListings = Shop & { listings: Listing[]; distanceKm?: number };
export type SortOption = "nearest" | "cheapest" | "updated";

// ── Constants ──────────────────────────────────────────────────────────────

export const LOCAL_CATEGORY_FILTERS = [
  "All", "Whey", "Creatine", "Pre-Workout", "BCAA", "Mass Gainer", "Vitamins",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
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
  if (cat === "All") return true;
  return categoryOf(listing) === cat;
}

// ── ShopCard ───────────────────────────────────────────────────────────────

function ShopCard({
  shop, isOwner, onManage,
}: {
  shop: ShopWithListings;
  isOwner: boolean;
  onManage: () => void;
}) {
  const inStockListings = shop.listings.filter((l) => l.inStock);
  const cats = Array.from(new Set(shop.listings.map(categoryOf).filter(Boolean)));

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-slate-200 dark:border-[#2c2c2e] shadow-sm overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-slate-900 dark:text-[#f2f2f7] font-bold text-sm leading-tight">{shop.name}</h3>
              {shop.verified ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/30">
                  <CheckCircle className="w-2.5 h-2.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/30">
                  <Clock className="w-2.5 h-2.5" /> Pending review
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-[#8e8e93] text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{shop.area}, {shop.city}</span>
              {shop.distanceKm !== undefined && shop.lat !== 0 && (
                <span className="text-emerald-600 font-semibold shrink-0">
                  &nbsp;· {fmtDist(shop.distanceKm)}
                </span>
              )}
            </div>
          </div>
          {isOwner && (
            <button
              onClick={onManage}
              className="shrink-0 text-xs text-blue-500 font-semibold bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              Manage
            </button>
          )}
        </div>

        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {cats.map((cat) => (
              <span key={cat} className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {inStockListings.length > 0 ? (
        <div className="border-t border-slate-100 dark:border-[#2c2c2e] divide-y divide-slate-100 dark:divide-[#2c2c2e]">
          {inStockListings.slice(0, 5).map((l) => (
            <div key={l.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 dark:text-[#ebebf0] text-xs font-semibold truncate">{l.productName}</p>
                <p className="text-slate-400 dark:text-[#636366] text-[10px]">
                  {[l.brand, l.quantityLabel].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="text-emerald-700 font-bold text-sm ml-3 shrink-0">
                ₹{l.price.toLocaleString()}
              </span>
            </div>
          ))}
          {inStockListings.length > 5 && (
            <div className="px-4 py-2 text-slate-400 dark:text-[#636366] text-xs">
              +{inStockListings.length - 5} more products in stock
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-slate-100 dark:border-[#2c2c2e] px-4 py-3">
          <p className="text-slate-400 dark:text-[#636366] text-xs italic">No products currently listed</p>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/80 dark:bg-[#2c2c2e]/50 border-t border-slate-100 dark:border-[#2c2c2e]">
        <a
          href={`tel:${shop.phone}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-[#8e8e93] bg-white dark:bg-[#2c2c2e] border border-slate-200 dark:border-[#3a3a3c] px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#3a3a3c] transition-colors"
        >
          <Phone className="w-3 h-3" /> Call
        </a>
        {shop.whatsapp && (
          <a
            href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 px-3 py-2 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <MessageCircle className="w-3 h-3" /> WhatsApp
          </a>
        )}
        {shop.mapsLink && (
          <a
            href={shop.mapsLink}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-[#8e8e93] bg-white dark:bg-[#2c2c2e] border border-slate-200 dark:border-[#3a3a3c] px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#3a3a3c] transition-colors"
          >
            <Navigation className="w-3 h-3" /> Directions
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function LocalShopsTab({
  catFilter,
  sort,
}: {
  catFilter: string;
  sort: SortOption;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"loading" | "granted" | "denied">("loading");
  const [citySearch, setCitySearch] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("granted");
      },
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
        if (gpsStatus === "denied" && citySearch.trim()) {
          const q = citySearch.toLowerCase();
          return (
            shop.city.toLowerCase().includes(q) ||
            shop.area.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .map((shop) => {
        const shopListings = allListings
          .filter((l) => l.shopId === shop.id)
          .filter((l) => matchesFilter(l, catFilter));
        const distanceKm =
          userCoords && shop.lat && shop.lng
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
      {/* GPS denied — city search fallback */}
      {gpsStatus === "denied" && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#636366] pointer-events-none" />
            <input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search by city or area..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-[#2c2c2e] bg-white dark:bg-[#1c1c1e] text-slate-800 dark:text-[#ebebf0] placeholder:text-slate-400 dark:placeholder:text-[#636366] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
            />
          </div>
          <p className="text-slate-400 dark:text-[#636366] text-[11px] mt-1.5 pl-1">
            Location access denied — search by city to find nearby shops
          </p>
        </div>
      )}

      {shopsWithListings.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-[#636366] text-sm">
          {gpsStatus === "denied" && citySearch.trim()
            ? `No shops found in "${citySearch}"`
            : "No local shops listed yet — be the first!"}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shopsWithListings.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              isOwner={shop.ownerId === user?.uid}
              onManage={() => router.push("/shop/dashboard")}
            />
          ))}
        </div>
      )}

      {!myShop ? (
        <button
          onClick={() =>
            user ? router.push("/shop/register") : router.push("/login")
          }
          className="w-full mt-4 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-[0.99] transition-all"
        >
          <Store className="w-5 h-5" />
          <div className="text-center">
            <p className="font-semibold text-sm">Own a supplement shop? List your prices free</p>
            <p className="text-xs text-emerald-600 mt-0.5">Reach local gym-goers · Free forever</p>
          </div>
        </button>
      ) : (
        <button
          onClick={() => router.push("/shop/dashboard")}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/20 active:scale-[0.99] transition-all"
        >
          <Store className="w-4 h-4" />
          Manage My Shop — {myShop.name}
        </button>
      )}
    </>
  );
}
