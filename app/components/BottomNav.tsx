"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Trophy, User, Sparkles, ShoppingBag } from "lucide-react"

const navItems = [
  { href: "/",           label: "Home",   icon: Home },
  { href: "/dashboard",  label: "Workout", icon: Dumbbell },
  { href: "/ai",         label: "AI",     icon: Sparkles, isCenter: true },
  { href: "/leaderboard",label: "Ranks",  icon: Trophy },
  { href: "/market",     label: "Market", icon: ShoppingBag },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" ||
        pathname.startsWith("/workout") ||
        pathname.startsWith("/exercise-library") ||
        pathname.startsWith("/history")
    }
    return pathname === href
  }

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[380px]">
      <div
        className="rounded-full px-4 py-2 flex items-center justify-between border border-[var(--app-border-md)]"
        style={{ backgroundColor: "var(--app-card)", boxShadow: "var(--app-nav-shadow)" }}
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          if (item.isCenter) {
            return (
              <Link key={item.href} href="/ai" className="relative flex items-center justify-center">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center border-[3px] hover:scale-105 active:scale-95 transition-all"
                  style={{
                    backgroundColor: "#d9ee4f",
                    borderColor: "var(--app-bg)",
                    boxShadow: "0 4px 16px rgba(217,238,79,0.35)",
                  }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: "#1a2000" }} />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 min-w-[44px] py-1"
            >
              <Icon className="w-5 h-5" style={{ color: active ? "#d9ee4f" : "var(--app-text-muted)" }} />
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? "#d9ee4f" : "var(--app-text-muted)" }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
