"use client"

import Link from "next/link"

type RoutineCardProps = {
  name: string
  exercises: string[]
}

export default function RoutineCard({ name, exercises }: RoutineCardProps) {
  const preview = exercises.length > 0 ? exercises.join(" · ") : "No exercises yet"

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-slate-900 font-semibold">{name}</h3>
        <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded-full shrink-0 ml-2">
          {exercises.length} exercises
        </span>
      </div>
      <p className="text-slate-500 text-sm mb-4 line-clamp-2">{preview}</p>
      <Link
        href="/workout/new"
        className="block w-full bg-slate-900 text-white text-sm font-medium py-2.5 rounded-xl text-center hover:bg-blue-500 active:scale-[0.98] transition-all"
      >
        Start Routine
      </Link>
    </div>
  )
}