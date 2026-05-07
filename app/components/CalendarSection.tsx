"use client"

import { cn } from "@/lib/utils"

type CalendarWorkout = {
  id: string
  date?: string
}

type CalendarSectionProps = {
  workouts: CalendarWorkout[]
}

const startOfDay = (date: Date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const getWeekDays = () => {
  const today = startOfDay(new Date())
  const dayIndex = today.getDay()
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + mondayOffset + i)
    return d
  })
}

const getDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export default function CalendarSection({ workouts }: CalendarSectionProps) {
  const todayKey = getDateKey(new Date())
  const weekDays = getWeekDays()
  const weekDayKeys = new Set(weekDays.map(getDateKey))

  const workoutCounts = workouts.reduce<Record<string, number>>((acc, w) => {
    if (!w.date) return acc
    const d = new Date(w.date)
    if (isNaN(d.getTime())) return acc
    const key = getDateKey(d)
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const workoutDays = new Set(Object.keys(workoutCounts))
  const activeDaysThisWeek = Array.from(workoutDays).filter(k => weekDayKeys.has(k)).length

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">
        Activity
      </p>
      <h2 className="text-slate-900 text-lg font-bold mb-1">This Week</h2>
      <p className="text-slate-500 text-sm mb-4">
        You worked out {activeDaysThisWeek} {activeDaysThisWeek === 1 ? "day" : "days"} this week
      </p>

      <div className="flex justify-between">
        {weekDays.map((date) => {
          const key = getDateKey(date)
          const isToday = key === todayKey
          const hasWorkout = workoutDays.has(key)

          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className="text-slate-400 text-xs">
                {date.toLocaleDateString("default", { weekday: "short" })}
              </span>
              <div
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors",
                  isToday
                    ? "bg-blue-500 text-white shadow-[0_4px_10px_rgba(59,130,246,0.35)]"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                {date.getDate()}
              </div>
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  hasWorkout ? "bg-emerald-500" : "bg-slate-300"
                )}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}