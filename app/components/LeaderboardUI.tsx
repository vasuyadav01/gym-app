"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"

type Member = {
  id: string
  name: string
  avatar: string
  weight: number
}

type LeaderboardUIProps = {
  gymName: string
  totalVolume: number
  members: Member[]
  currentUserId: string
}

function formatNumber(num: number): string {
  return num.toLocaleString()
}

function getRankBadgeStyles(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-amber-100 text-amber-700 border-amber-300"
    case 2:
      return "bg-slate-100 text-slate-600 border-slate-300"
    case 3:
      return "bg-orange-100 text-orange-700 border-orange-300"
    default:
      return "bg-slate-100 text-slate-500 border-slate-200"
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

type ViewType = "gym" | "region"

export default function LeaderboardUI({
  gymName,
  totalVolume,
  members,
  currentUserId,
}: LeaderboardUIProps) {
  const [activeView, setActiveView] = useState<ViewType>("gym")

  const topFive = members.slice(0, 5)
  const currentUser = members.find((m) => m.id === currentUserId)
  const currentUserRank = members.findIndex((m) => m.id === currentUserId) + 1
  const isInTopFive = currentUserRank >= 1 && currentUserRank <= 5

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen font-sans pb-28">

      {/* Header */}
      <header className="px-5 pt-12 pb-4">
        <p className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-2">
          Leaderboard
        </p>
        <h1 className="text-slate-900 text-2xl font-bold mb-1">
          {activeView === "gym" ? "Gym Standings" : "Region Standings"}
        </h1>
        <p className="text-slate-500 text-sm">
          {activeView === "gym" ? gymName : "Your Region"}
        </p>
      </header>

      {/* Toggle */}
      <div className="px-5 mb-4">
        <div className="bg-slate-200 rounded-xl p-1 flex">
          <button
            onClick={() => setActiveView("gym")}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
              activeView === "gym"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Gym
          </button>
          <button
            onClick={() => setActiveView("region")}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
              activeView === "region"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Region
          </button>
        </div>
      </div>

      {/* Total Volume Card */}
      <div className="px-5 mb-4">
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/40 via-transparent to-emerald-500/20">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">
              Total Volume
            </p>
            <p className="text-slate-900 text-4xl font-bold mb-1">
              {formatNumber(totalVolume)}
            </p>
            <p className="text-slate-400 text-xs">
              Sets × reps × weight across this {activeView === "gym" ? "gym" : "region"}
            </p>
            {activeView === "region" && (
              <p className="mt-2 text-xs text-amber-500 font-medium">
                🚧 Region data coming soon
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rankings Card */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-4">
            <h2 className="text-slate-900 font-semibold">Rankings</h2>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {members.length} members
            </span>
          </div>

          <div className="px-5 pb-5">
            {topFive.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-4">
                No workouts logged yet.
              </p>
            ) : (
              topFive.map((member, index) => {
                const rank = index + 1
                const isFirst = rank === 1

                return (
                  <div key={member.id}>
                    <div
                      className={cn(
                        "flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl transition-colors",
                        isFirst && "bg-amber-50 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                      )}
                    >
                      <span
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold border",
                          getRankBadgeStyles(rank)
                        )}
                      >
                        #{rank}
                      </span>

                      <Avatar className="w-9 h-9">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>

                      <span className="flex-1 text-slate-700 text-sm font-medium truncate">
                        {member.name}
                      </span>

                      <span className="text-slate-900 text-sm font-semibold tabular-nums">
                        {formatNumber(member.weight)} lbs
                      </span>
                    </div>

                    {index < topFive.length - 1 && (
                      <div className="h-px bg-slate-100" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Your Rank — shown when outside top 5 */}
      {!isInTopFive && currentUser && (
        <div className="px-5">
          <div className="bg-white rounded-2xl border border-emerald-300 shadow-sm overflow-hidden">
            <div className="p-5">
              <p className="text-emerald-600 text-xs font-semibold tracking-[0.15em] uppercase mb-4">
                Your Rank
              </p>
              <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-3 mb-3">
                <span className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-300">
                  #{currentUserRank}
                </span>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="bg-emerald-200 text-emerald-700 text-xs">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-slate-700 text-sm font-medium truncate">
                  {currentUser.name}
                </span>
                <span className="text-slate-900 text-sm font-semibold tabular-nums">
                  {formatNumber(currentUser.weight)} lbs
                </span>
              </div>
              <p className="text-slate-500 text-sm text-center">
                You&apos;re #{currentUserRank} — keep pushing! 🔥
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}