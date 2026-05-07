import { NextRequest, NextResponse } from "next/server";

type SerpItem = {
  title?: string;
  price?: string;
  source?: string;
  link?: string;
  product_link?: string;
  thumbnail?: string;
  rating?: number;
  reviews?: number;
};

function parsePrice(price?: string): number {
  if (!price) return Infinity;
  const num = parseFloat(price.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? Infinity : num;
}

function getEmoji(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("creatine")) return "⚡";
  if (q.includes("whey") || q.includes("protein")) return "🥛";
  if (q.includes("pre")) return "🔥";
  if (q.includes("bcaa")) return "💊";
  if (q.includes("mass") || q.includes("gainer")) return "💪";
  if (q.includes("vitamin")) return "🌿";
  return "🏋️";
}

async function fetchQuery(query: string, appendSupplement = true) {
  const q = appendSupplement ? `${query} supplement` : query;
  const params = new URLSearchParams({
    engine: "google_shopping",
    q,
    gl: "in",
    hl: "en",
    location: "India",
    api_key: process.env.SERPAPI_KEY!,
  });
  const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
  const data = await response.json();
  const results: SerpItem[] = data?.shopping_results ?? [];
  return results.slice(0, 6).map((item) => ({
    name: item.title ?? "Unknown Product",
    brand: item.source ?? "Unknown",
    type: query,
    price: item.price ?? "N/A",
    priceNum: parsePrice(item.price),
    pricePerServing: "N/A",
    store: item.source ?? "Unknown",
    link: item.product_link ?? item.link ?? "#",
    badge: item.rating ? `⭐ ${item.rating}` : "New",
    badgeColor: "blue",
    emoji: getEmoji(query),
    servings: "",
    thumbnail: item.thumbnail ?? "",
    reviews: item.reviews ?? 0,
    rating: item.rating ?? 0,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, queries } = body;

    if (queries && Array.isArray(queries) && queries.length > 0) {
      // Batch mode: fetch all queries in parallel
      const allResults = await Promise.all(
        queries.map((q: string) => fetchQuery(q, false))
      );
      const combined = allResults.flat();

      // Deduplicate by name (keep lowest price per product)
      const seen = new Map<string, typeof combined[0]>();
      for (const item of combined) {
        const key = item.name.toLowerCase().trim().slice(0, 60);
        const existing = seen.get(key);
        if (!existing || item.priceNum < existing.priceNum) {
          seen.set(key, item);
        }
      }

      // Sort cheapest first
      const products = Array.from(seen.values()).sort(
        (a, b) => a.priceNum - b.priceNum
      );
      return NextResponse.json({ products });
    }

    // Single query mode (existing behaviour)
    if (!query) return NextResponse.json({ products: [] }, { status: 400 });
    const products = (await fetchQuery(query, true)).sort(
      (a, b) => a.priceNum - b.priceNum
    );
    return NextResponse.json({ products });
  } catch (err) {
    console.error("Market API error:", err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
