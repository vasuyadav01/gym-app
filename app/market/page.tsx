"use client";

import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";
import LocalShopsTab, { LOCAL_CATEGORY_FILTERS } from "../components/LocalShopsTab";
import { Search, ExternalLink, Loader2, Star, ArrowLeft, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

const HOT_DEAL_QUERIES = [
  "creatine monohydrate india",
  "whey protein india best price",
  "pre workout supplement india",
];

const ONLINE_CATEGORIES = ["Creatine", "Whey Protein", "Pre-Workout", "BCAA", "Mass Gainer", "Vitamins"];

type Product = {
  name: string;
  brand: string;
  type: string;
  price: string;
  priceNum: number;
  pricePerServing: string;
  store: string;
  link: string;
  badge: string;
  badgeColor: string;
  emoji: string;
  servings: string;
  thumbnail: string;
  reviews: number;
  rating: number;
};

type SortOption = "nearest" | "cheapest" | "updated";

function SkeletonCard() {
  return (
    <div className="bg-[#1C1C1E] rounded-[24px] p-4 flex gap-4 animate-pulse">
      <div className="w-32 h-32 rounded-xl bg-[#252528] shrink-0" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-3 bg-[#252528] rounded-full w-2/5" />
        <div className="h-4 bg-[#252528] rounded-full w-4/5" />
        <div className="h-3 bg-[#252528] rounded-full w-1/3" />
        <div className="flex items-center justify-between mt-4">
          <div className="h-5 bg-[#252528] rounded-full w-16" />
          <div className="h-8 bg-[#252528] rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product, isCheapest, savings,
}: {
  product: Product; isCheapest: boolean; savings: number;
}) {
  return (
    <div className="bg-[#1C1C1E] rounded-[24px] p-4 flex gap-4 border border-transparent hover:border-[#d9ee4f]/30 transition-colors relative overflow-hidden">
      {/* Image */}
      <div className="w-32 h-32 bg-[#252528] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-24 h-24 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).parentElement!.textContent = product.emoji;
            }}
          />
        ) : (
          <span className="text-4xl">{product.emoji}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <span className="text-neutral-500 text-[10px] uppercase tracking-wider font-bold truncate">
              {product.store}
            </span>
            {isCheapest ? (
              <span className="bg-[#d9ee4f] text-[#1a2000] text-[9px] px-2 py-0.5 rounded-full font-black shrink-0">
                BEST DEAL
              </span>
            ) : product.badge ? (
              <span className="bg-[#252528] text-neutral-400 text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0">
                {product.badge.toUpperCase()}
              </span>
            ) : null}
          </div>
          <h4 className="text-white font-bold text-sm leading-snug mt-1 line-clamp-2">{product.name}</h4>

          {/* Stars */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className="w-2.5 h-2.5"
                  style={{
                    color: i < Math.round(product.rating) ? "#d9ee4f" : "#3a3a3c",
                    fill: i < Math.round(product.rating) ? "#d9ee4f" : "#3a3a3c",
                  }}
                />
              ))}
              <span className="text-[10px] text-neutral-500 ml-0.5">
                {product.rating.toFixed(1)}{product.reviews > 0 ? ` (${product.reviews})` : ""}
              </span>
            </div>
          )}

          {savings > 0 && (
            <p className="text-[10px] text-[#d9ee4f] font-semibold mt-1">Save ₹{savings} vs others</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[#d9ee4f] font-bold text-lg leading-none">{product.price}</span>
          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-[#d9ee4f] text-[#1a2000] text-xs font-black px-4 py-2 rounded-full active:scale-95 transition-transform"
          >
            <ExternalLink className="w-3 h-3" />
            Buy Now
          </a>
        </div>
      </div>
    </div>
  );
}

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<"online" | "local">("online");

  // Online tab state
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [hotDeals, setHotDeals] = useState<Product[]>([]);
  const [hotLoading, setHotLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [error, setError] = useState("");

  // Local tab state
  const [localCatFilter, setLocalCatFilter] = useState("All");
  const [localSort, setLocalSort] = useState<SortOption>("nearest");

  useEffect(() => {
    loadHotDeals();
  }, []);

  const loadHotDeals = async () => {
    setHotLoading(true);
    const res = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries: HOT_DEAL_QUERIES }),
    }).catch(() => null);
    if (res) {
      const data = await res.json().catch(() => ({}));
      setHotDeals(data.products ?? []);
    }
    setHotLoading(false);
  };

  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    setActiveCategory(searchQuery);
    const res = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery }),
    }).catch(() => null);
    if (!res) { setError("Network error. Please try again."); setLoading(false); return; }
    const data = await res.json().catch(() => ({}));
    if (!data.products || data.products.length === 0) {
      setError("No results found. Try a different search.");
      setProducts([]);
    } else {
      setProducts(data.products);
    }
    setLoading(false);
  };

  const backToHotDeals = () => {
    setSearched(false); setProducts([]); setActiveCategory(""); setQuery(""); setError("");
  };

  const displayProducts: Product[] = searched ? products : hotDeals;
  const validPrices = displayProducts.map((p) => p.priceNum).filter((n) => n !== Infinity);
  const minPrice = validPrices.length ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length ? Math.max(...validPrices) : 0;
  const totalSavings = Math.round(maxPrice - minPrice);

  return (
    <main className="min-h-screen bg-[#131314] pb-28 font-sans">

      {/* Header */}
      <header className="bg-[#131314] border-b border-[#1C1C1E] flex justify-between items-center px-5 h-16 sticky top-0 z-[60]">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-[5px]">
            <span className="w-5 h-0.5 bg-[#EAFF5F] block rounded-full" />
            <span className="w-3.5 h-0.5 bg-[#EAFF5F] block rounded-full" />
            <span className="w-5 h-0.5 bg-[#EAFF5F] block rounded-full" />
          </div>
        </div>
        <h1 className="text-xl font-black tracking-widest text-[#EAFF5F] uppercase">VISFIT</h1>
        <Link href="/profile">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 ring-1 ring-lime-400/30 flex items-center justify-center">
            <span className="text-[#131314] text-[10px] font-black">ME</span>
          </div>
        </Link>
      </header>

      <div className="px-5">

        {/* Page title */}
        <div className="pt-5 pb-4">
          <h2 className="text-white font-semibold text-xl">Supplement Market</h2>
        </div>

        {/* Search + Go */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") search(query); }}
              placeholder="Search supplements..."
              className="w-full bg-[#252528] border-none rounded-xl py-3 pl-12 pr-4 text-[#e5e2e3] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#d9ee4f]/50 text-sm"
            />
          </div>
          <button
            onClick={() => search(query)}
            disabled={loading || !query.trim()}
            className="bg-[#d9ee4f] text-[#1a2000] px-5 py-3 rounded-xl font-bold text-sm active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#1a2000]" /> : "Go"}
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-[#201f20] rounded-full p-1 border border-[#464835]/30 mb-4">
          <button
            onClick={() => setActiveTab("online")}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "online"
                ? "bg-[#d9ee4f] text-[#1a2000]"
                : "text-neutral-500"
            }`}
          >
            Online
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "local"
                ? "bg-[#d9ee4f] text-[#1a2000]"
                : "text-neutral-500"
            }`}
          >
            Local Shops
          </button>
        </div>

        {/* Online: category chips */}
        {activeTab === "online" && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: "none" }}>
            {ONLINE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setQuery(cat); search(cat); }}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat && searched
                    ? "bg-[#d9ee4f] text-[#1a2000]"
                    : "bg-[#2C2C2E] text-[#c7c8af] border border-[#464835]/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Local: category + sort */}
        {activeTab === "local" && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: "none" }}>
              {LOCAL_CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLocalCatFilter(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    localCatFilter === cat
                      ? "bg-[#d9ee4f] text-[#1a2000]"
                      : "bg-[#2C2C2E] text-[#c7c8af] border border-[#464835]/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              {(["nearest", "cheapest", "updated"] as SortOption[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setLocalSort(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                    localSort === s
                      ? "bg-[#d9ee4f] text-[#1a2000] border-[#d9ee4f]"
                      : "bg-[#1C1C1E] text-neutral-500 border-[#2C2C2E]"
                  }`}
                >
                  {s === "nearest" ? "Nearest" : s === "cheapest" ? "Cheapest" : "Recent"}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Content ── */}
        {activeTab === "local" ? (
          <LocalShopsTab catFilter={localCatFilter} sort={localSort} />
        ) : (
          <div className="flex flex-col gap-4">

            {/* Back to hot deals */}
            {searched && !loading && (
              <button
                onClick={backToHotDeals}
                className="flex items-center gap-1.5 text-sm text-[#d9ee4f] font-semibold self-start"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Hot Deals
              </button>
            )}

            {/* Section header */}
            {!loading && (
              <div className="flex items-center justify-between">
                {!searched ? (
                  <>
                    <h3 className="text-white font-semibold text-xl">Hot Deals</h3>
                    {!hotLoading && hotDeals.length > 0 && (
                      <span className="text-[#d9ee4f] text-xs font-bold">View All</span>
                    )}
                  </>
                ) : (
                  !error && products.length > 0 && (
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                      {products.length} results · &quot;{activeCategory}&quot;
                    </p>
                  )
                )}
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center py-16 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1C1C1E] border border-[#d9ee4f]/20 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-[#d9ee4f] animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">Finding best prices...</p>
                  <p className="text-neutral-500 text-sm mt-1">Scanning Indian stores for you</p>
                </div>
              </div>
            )}

            {/* Skeleton loading for hot deals */}
            {hotLoading && !searched && (
              <div className="flex flex-col gap-4">
                <SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-[#1C1C1E] border border-red-900/40 rounded-[24px] p-5 text-center">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Product cards */}
            {!loading && !hotLoading && displayProducts.length > 0 && (
              <div className="flex flex-col gap-4">
                {displayProducts.map((product, i) => {
                  const isCheapest = product.priceNum === minPrice && minPrice !== Infinity;
                  return (
                    <ProductCard
                      key={i}
                      product={product}
                      isCheapest={isCheapest}
                      savings={isCheapest && totalSavings > 0 ? totalSavings : 0}
                    />
                  );
                })}
              </div>
            )}

            {/* Footer note */}
            {!loading && !hotLoading && (
              <p className="text-neutral-500 text-xs text-center pb-2">
                Prices from Google Shopping India. Click to buy on store website.
              </p>
            )}

          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
