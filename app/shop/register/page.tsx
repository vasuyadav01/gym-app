"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { CheckCircle, ChevronRight, ChevronLeft, Store } from "lucide-react";

const SHOP_CATEGORIES = [
  { key: "supplements", label: "Supplements", emoji: "💊" },
  { key: "equipment",   label: "Equipment",   emoji: "🏋️" },
  { key: "apparel",     label: "Apparel",      emoji: "👕" },
  { key: "food",        label: "Food & Nutrition", emoji: "🥗" },
  { key: "other",       label: "Other",        emoji: "🛍️" },
];

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <p className="text-neutral-500 text-xs font-medium mb-1.5">{label}</p>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none"
        onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
      />
    </div>
  );
}

export default function ShopRegisterPage() {
  const router = useRouter();
  const [uid, setUid]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep]     = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]   = useState("");

  // Step 1 — personal
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");

  // Step 2 — shop
  const [shopName, setShopName]       = useState("");
  const [category, setCategory]       = useState("supplements");
  const [address, setAddress]         = useState("");
  const [area, setArea]               = useState("");
  const [city, setCity]               = useState("");
  const [pincode, setPincode]         = useState("");
  const [whatsapp, setWhatsapp]       = useState("");
  const [openingHours, setOpeningHours] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace("/login"); return; }
      setEmail(u.email ?? "");
      getDocs(query(collection(db, "shops"), where("ownerId", "==", u.uid)))
        .then((snap) => {
          if (!snap.empty) { router.replace("/shop/dashboard"); return; }
          setUid(u.uid);
          setLoading(false);
        })
        .catch(() => { setUid(u.uid); setLoading(false); });
    });
  }, [router]);

  const step1Ok = ownerName.trim() && phone.trim();
  const step2Ok = shopName.trim() && area.trim() && city.trim();

  const handleSubmit = async () => {
    if (!step2Ok || !uid) return;
    setSubmitting(true);
    setError("");
    const result = await addDoc(collection(db, "shops"), {
      ownerId: uid,
      ownerName: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      name: shopName.trim(),
      category,
      address: address.trim(),
      area: area.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      whatsapp: whatsapp.trim(),
      openingHours: openingHours.trim(),
      mapsLink: "",
      photoUrl: "",
      lat: 0, lng: 0,
      verified: false,
      disabled: false,
      viewCount: 0,
      createdAt: serverTimestamp(),
    }).catch(() => null);
    if (!result) {
      setError("Failed to register. Please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#131314]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#131314] px-6">
        <div className="bg-[#1c1b1c] rounded-3xl border border-white/5 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(217,238,79,0.1)", border: "1px solid rgba(217,238,79,0.2)" }}>
            <CheckCircle className="w-8 h-8" style={{ color: "#d9ee4f" }} />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Shop Submitted!</h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-6">
            Your shop is under review. Once verified by the admin, it will appear in the marketplace for members to find you.
          </p>
          <button
            onClick={() => router.push("/shop/dashboard")}
            className="w-full py-3.5 rounded-2xl font-bold text-sm"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
          >
            Go to My Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#131314] pb-12">
      <div className="w-full max-w-md mx-auto px-5">

        {/* Header */}
        <div className="flex items-center gap-3 pt-12 pb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(217,238,79,0.12)", border: "1px solid rgba(217,238,79,0.2)" }}>
            <Store className="w-5 h-5" style={{ color: "#d9ee4f" }} />
          </div>
          <div>
            <h1 className="text-white text-xl font-black">List Your Shop</h1>
            <p className="text-neutral-500 text-xs">Free · Reach local gym-goers</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 mt-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= s ? "text-[#1a2000]" : "bg-[#252528] text-neutral-500"
              }`} style={step >= s ? { backgroundColor: "#d9ee4f" } : {}}>
                {s}
              </div>
              {s < 2 && <div className={`h-0.5 w-12 rounded-full transition-all ${step > s ? "bg-[#d9ee4f]" : "bg-[#252528]"}`} />}
            </div>
          ))}
          <span className="ml-2 text-neutral-500 text-xs">{step === 1 ? "About You" : "Your Shop"}</span>
        </div>

        {/* ── Step 1: Personal Info ── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#1c1b1c] rounded-[24px] border border-white/5 p-5 flex flex-col gap-4">
              <Field label="Your Full Name *" value={ownerName} onChange={setOwnerName} placeholder="e.g. Rahul Sharma" />
              <Field label="Email" value={email} onChange={setEmail} placeholder="your@email.com" type="email" />
              <Field label="Phone *" value={phone} onChange={setPhone} placeholder="+91 98765 43210" type="tel" />
            </div>
            <button
              onClick={() => { if (step1Ok) setStep(2); }}
              disabled={!step1Ok}
              className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
            >
              Next — Shop Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 2: Shop Details ── */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#1c1b1c] rounded-[24px] border border-white/5 p-5 flex flex-col gap-4">
              <Field label="Shop Name *" value={shopName} onChange={setShopName} placeholder="e.g. GainZone Supplements" />

              <div>
                <p className="text-neutral-500 text-xs font-medium mb-2">Shop Category *</p>
                <div className="flex flex-wrap gap-2">
                  {SHOP_CATEGORIES.map((c) => (
                    <button key={c.key} onClick={() => setCategory(c.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        category === c.key
                          ? "bg-[#d9ee4f] text-[#1a2000] border-[#d9ee4f]"
                          : "bg-[#252528] text-neutral-400 border-white/10"
                      }`}>
                      <span>{c.emoji}</span> {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Full Address" value={address} onChange={setAddress} placeholder="e.g. 12, MG Road" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Area / Locality *" value={area} onChange={setArea} placeholder="e.g. Koramangala" />
                <Field label="City *" value={city} onChange={setCity} placeholder="e.g. Bangalore" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pincode" value={pincode} onChange={setPincode} placeholder="e.g. 560001" />
                <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="+91 98765 43210" type="tel" />
              </div>
              <Field label="Opening Hours" value={openingHours} onChange={setOpeningHours} placeholder="e.g. 9 AM – 9 PM, Mon–Sat" />
            </div>

            {error && (
              <div className="bg-red-900/10 border border-red-900/30 rounded-2xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-1 px-5 py-4 rounded-2xl font-bold text-sm bg-[#1c1b1c] border border-white/10 text-neutral-400">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!step2Ok || submitting}
                className="flex-1 py-4 rounded-2xl font-bold text-sm disabled:opacity-40"
                style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
              >
                {submitting ? "Registering…" : "Submit Shop — Free"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
