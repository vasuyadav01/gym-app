"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"landing" | "login" | "signup">("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch {
      setError("Invalid email or password. Please try again.");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") setError("An account with this email already exists.");
      else if (code === "auth/invalid-email") setError("Please enter a valid email address.");
      else if (code === "auth/operation-not-allowed") setError("Email/password sign-up is not enabled. Please use Google sign-in or contact support.");
      else if (code === "auth/weak-password") setError("Password is too weak. Please use at least 6 characters.");
      else if (code === "auth/network-request-failed") setError("Network error. Please check your connection and try again.");
      else setError(`Failed to create account (${code ?? "unknown error"}). Please try again.`);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError("Enter your email address above, then tap Forgot Password."); return; }
    setLoading(true);
    setError("");
    const result = await sendPasswordResetEmail(auth, email.trim()).catch((err: { code?: string }) => err);
    setLoading(false);
    if (result && (result as { code?: string }).code) {
      setError("Couldn't send reset email. Check the address and try again.");
    } else {
      setResetSent(true);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace("/");
    } catch {
      setError("Google sign in failed. Please try again.");
    }
    setLoading(false);
  };

  // Landing Screen
  if (view === "landing") {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ "--app-text": "#ffffff", "--app-text-muted": "rgba(255,255,255,0.7)" } as React.CSSProperties}>
        {/* Full-screen background image */}
        <img
          src="/loginpageUI.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient overlay — transparent top, dark bottom */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)" }}
        />

        {/* Content layer */}
        <div className="relative z-10 flex flex-col min-h-screen">

          {/* Spacer pushes text/buttons to bottom */}
          <div className="flex-1" />

          {/* Hero text */}
          <div className="px-6 pb-8">
            <h1 className="text-[var(--app-text)] font-black uppercase leading-none tracking-tight" style={{ fontSize: "clamp(2.5rem,11vw,3.5rem)" }}>
              BE HEALTHY<br />
              BE STRONGER<br />
              BE YOURSELF
            </h1>
          </div>

          {/* Buttons */}
          <div className="px-6 pb-14 flex gap-3">
            <button
              onClick={() => setView("signup")}
              className="flex-1 py-4 rounded-full font-bold text-base active:scale-[0.98] transition-all"
              style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
            >
              Create Account
            </button>
            <button
              onClick={() => setView("login")}
              className="flex-1 py-4 rounded-full text-[var(--app-text)] text-base font-semibold active:scale-[0.98] transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Signup Screen
  if (view === "signup") {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex flex-col text-[var(--app-text)]">
        <div className="px-6 pt-14 pb-2">
          <button onClick={() => setView("landing")}
            className="w-9 h-9 rounded-full bg-[var(--app-card)] border border-[var(--app-border-md)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="px-6 pt-8 pb-8">
          <h1 className="text-3xl font-black text-[var(--app-text)] leading-tight">
            Create an account
          </h1>
          <p className="mt-2" style={{ color: "#d9ee4f" }}>with VISFIT</p>
          <p className="mt-3 text-[var(--app-text-muted)] text-sm leading-relaxed">
            Track workouts, crush PRs, and compete with your gym.
          </p>
        </div>

        <div className="flex-1 px-6 flex flex-col gap-4">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center px-5 py-4 rounded-2xl border border-[var(--app-border-md)] bg-[var(--app-card)] hover:bg-[var(--app-hover)] active:scale-[0.98] transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="flex-1 text-center text-[var(--app-text)] text-sm font-semibold">Sign up with Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[var(--app-text-muted)] text-xs">or sign up with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[var(--app-text-muted)] text-sm">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border border-[var(--app-border-md)] bg-[var(--app-card)] text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] text-base outline-none transition-all"
              style={{ "--tw-ring-color": "#d9ee4f" } as React.CSSProperties}
              onFocus={(e) => e.currentTarget.style.borderColor = "#d9ee4f50"}
              onBlur={(e) => e.currentTarget.style.borderColor = "var(--app-border-md)"}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[var(--app-text-muted)] text-sm">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 pr-12 rounded-2xl border border-[var(--app-border-md)] bg-[var(--app-card)] text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] text-base outline-none transition-all"
                onFocus={(e) => e.currentTarget.style.borderColor = "#d9ee4f50"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--app-border-md)"}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)] hover:text-[var(--app-text-muted)] transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>

        <div className="px-6 pt-4 pb-14 flex flex-col gap-3">
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] disabled:opacity-50 transition-all"
            style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <button onClick={() => setView("login")}
            className="text-center text-sm text-[var(--app-text-muted)]">
            Returning User? <span className="font-semibold" style={{ color: "#d9ee4f" }}>Log In</span>
          </button>
        </div>
      </div>
    );
  }

  // Login Screen
  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex flex-col text-[var(--app-text)]">
      <div className="px-6 pt-14 pb-2">
        <button onClick={() => setView("landing")}
          className="w-9 h-9 rounded-full bg-[var(--app-card)] border border-[var(--app-border-md)] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="px-6 pt-8 pb-8">
        <h1 className="text-3xl font-black text-[var(--app-text)] leading-tight">
          Login to <span style={{ color: "#d9ee4f" }}>VISFIT</span>
        </h1>
        <p className="mt-2 text-[var(--app-text-muted)] text-sm">Welcome back. Let&apos;s get moving.</p>
      </div>

      <div className="flex-1 px-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[var(--app-text-muted)] text-sm">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl border border-[var(--app-border-md)] bg-[var(--app-card)] text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] text-base outline-none transition-all"
            onFocus={(e) => e.currentTarget.style.borderColor = "#d9ee4f50"}
            onBlur={(e) => e.currentTarget.style.borderColor = "var(--app-border-md)"}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[var(--app-text-muted)] text-sm">Password</label>
            <button type="button" onClick={handleForgotPassword} disabled={loading}
              className="text-xs font-medium disabled:opacity-50 transition-colors"
              style={{ color: "#d9ee4f" }}>
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 pr-12 rounded-2xl border border-[var(--app-border-md)] bg-[var(--app-card)] text-[var(--app-text)] placeholder:text-[var(--app-text-muted)] text-base outline-none transition-all"
              onFocus={(e) => e.currentTarget.style.borderColor = "#d9ee4f50"}
              onBlur={(e) => e.currentTarget.style.borderColor = "var(--app-border-md)"}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)] hover:text-[var(--app-text-muted)] transition-colors">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex-1 flex items-center justify-center h-14 rounded-2xl border border-[var(--app-border-md)] bg-[var(--app-card)] hover:bg-[var(--app-hover)] active:scale-95 transition-all"
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </button>
          <button
            disabled={loading}
            className="flex-1 flex items-center justify-center h-14 rounded-2xl border border-[var(--app-border-md)] bg-[var(--app-card)] hover:bg-[var(--app-hover)] active:scale-95 transition-all"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </button>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {resetSent && (
          <div className="rounded-2xl px-4 py-3 text-center border" style={{ background: "rgba(217,238,79,0.05)", borderColor: "rgba(217,238,79,0.2)" }}>
            <p className="text-sm font-medium" style={{ color: "#d9ee4f" }}>Reset email sent!</p>
            <p className="text-[var(--app-text-muted)] text-xs mt-0.5">Check your inbox and follow the link to set a new password.</p>
          </div>
        )}
      </div>

      <div className="px-6 pt-4 pb-14 flex flex-col gap-3">
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] disabled:opacity-50 transition-all"
          style={{ backgroundColor: "#d9ee4f", color: "#1a2000" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <button onClick={() => setView("signup")}
          className="text-center text-sm text-[var(--app-text-muted)]">
          Don&apos;t have an account? <span className="font-semibold" style={{ color: "#d9ee4f" }}>Create Account</span>
        </button>
      </div>
    </div>
  );
}
