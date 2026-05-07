"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, addDoc, query, where, getDocs, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { MapPin, ArrowLeft, CheckCircle } from "lucide-react";

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
        className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none transition-all"
        onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
      />
    </div>
  );
}

export default function ShopRegisterPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace("/login"); return; }
      getDocs(query(collection(db, "shops"), where("ownerId", "==", u.uid)))
        .then((snap) => {
          if (!snap.empty) { router.replace("/shop/dashboard"); return; }
          setUid(u.uid);
          setLoading(false);
        })
        .catch(() => { setUid(u.uid); setLoading(false); });
    });
  }, [router]);

  const captureLocation = () => {
    if (!navigator.geolocation) { setLocStatus("error"); return; }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocStatus("done"); },
      () => setLocStatus("error"),
      { timeout: 10000 }
    );
  };

  const canSubmit = name.trim() && area.trim() && city.trim() && phone.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !uid) return;
    setSubmitting(true);
    setError("");
    const result = await addDoc(collection(db, "shops"), {
      ownerId: uid, name: name.trim(), area: area.trim(), city: city.trim(),
      phone: phone.trim(), whatsapp: whatsapp.trim(), mapsLink: mapsLink.trim(),
      lat, lng, verified: false, createdAt: serverTimestamp(),
    }).catch(() => null);
    if (!result) {
      setError("Failed to register shop. Please try again.");
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
            Your shop has been submitted for review. It will appear in Local Shops once verified.
          </p>
          <button
            onClick={() => router.push("/shop/dashboard")}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
          >
            Go to My Shop Dashboard
          </button>
          <button
            onClick={() => router.push("/market")}
            className="w-full py-3 rounded-2xl text-neutral-500 text-sm font-medium hover:text-neutral-300 transition-all mt-2"
          >
            Back to Market
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#131314] pb-12">
      <div className="w-full max-w-md mx-auto px-5">
        <div className="flex items-center gap-3 pt-12 pb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-[#1c1b1c] border border-white/10 flex items-center justify-center hover:bg-[#252528] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </button>
          <div>
            <h1 className="text-white text-xl font-black">List Your Shop</h1>
            <p className="text-neutral-500 text-xs">Free · Reach local gym-goers</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-[#1c1b1c] rounded-[24px] border border-white/5 p-5 flex flex-col gap-4">
            <Field label="Shop Name *" value={name} onChange={setName} placeholder="e.g. GainZone Supplements" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-neutral-500 text-xs font-medium mb-1.5">Area / Locality *</p>
                <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Koramangala"
                  className="w-full px-3 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none transition-all"
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
              <div>
                <p className="text-neutral-500 text-xs font-medium mb-1.5">City *</p>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bangalore"
                  className="w-full px-3 py-3 rounded-2xl border border-white/10 bg-[#252528] text-white placeholder:text-neutral-600 text-sm outline-none transition-all"
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(217,238,79,0.4)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            </div>
            <Field label="Phone *" value={phone} onChange={setPhone} placeholder="+91 98765 43210" type="tel" />
            <Field label="WhatsApp (optional)" value={whatsapp} onChange={setWhatsapp} placeholder="+91 98765 43210" type="tel" />
            <Field label="Google Maps Link (optional)" value={mapsLink} onChange={setMapsLink} placeholder="https://maps.google.com/..." />
          </div>

          <div className="bg-[#1c1b1c] rounded-[24px] border border-white/5 p-5">
            <p className="text-white text-sm font-semibold mb-3">Shop Location</p>
            <button
              type="button"
              onClick={captureLocation}
              disabled={locStatus === "loading" || locStatus === "done"}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all"
              style={locStatus === "done"
                ? { background: "rgba(217,238,79,0.08)", borderColor: "rgba(217,238,79,0.2)", color: "#d9ee4f" }
                : { background: "#252528", borderColor: "rgba(255,255,255,0.08)", color: "#737373" }}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              {locStatus === "idle" && "Pin my current location"}
              {locStatus === "loading" && "Getting location..."}
              {locStatus === "done" && `Location pinned (${lat.toFixed(3)}, ${lng.toFixed(3)})`}
              {locStatus === "error" && "Skip — continue without GPS pin"}
            </button>
            <p className="text-neutral-600 text-[10px] mt-2">
              Used to show distance to nearby buyers. You can skip this step.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/10 border border-red-900/30 rounded-2xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 rounded-[24px] font-bold text-sm active:scale-[0.98] disabled:opacity-40 transition-all"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
          >
            {submitting ? "Registering..." : "Register My Shop — Free"}
          </button>
        </div>
      </div>
    </main>
  );
}
