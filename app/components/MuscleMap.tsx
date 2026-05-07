"use client";

type MuscleMapProps = {
  primaryMuscles: string[];
  secondaryMuscles: string[];
};

const normalize = (muscle: string) => muscle.toLowerCase();

export default function MuscleMap({
  primaryMuscles,
  secondaryMuscles,
}: MuscleMapProps) {
  const primary = new Set(primaryMuscles.map(normalize));
  const secondary = new Set(secondaryMuscles.map(normalize));

  const fillFor = (muscle: string) => {
    if (primary.has(muscle)) {
      return "#3b82f6";
    }

    if (secondary.has(muscle)) {
      return "#93c5fd";
    }

    return "#27272a";
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Muscle Map
      </p>
      <svg className="h-52 w-full" viewBox="0 0 220 220" role="img">
        <title>Front and back muscle map</title>
        <g transform="translate(8 8)">
          <circle cx="48" cy="16" r="12" fill="#3f3f46" />
          <rect x="34" y="30" width="28" height="36" rx="12" fill={fillFor("chest")} />
          <rect x="30" y="62" width="36" height="28" rx="10" fill={fillFor("abs")} />
          <rect x="12" y="34" width="16" height="52" rx="8" fill={fillFor("biceps")} />
          <rect x="68" y="34" width="16" height="52" rx="8" fill={fillFor("triceps")} />
          <rect x="31" y="92" width="16" height="54" rx="8" fill={fillFor("quads")} />
          <rect x="50" y="92" width="16" height="54" rx="8" fill={fillFor("quads")} />
          <rect x="31" y="148" width="16" height="42" rx="8" fill={fillFor("calves")} />
          <rect x="50" y="148" width="16" height="42" rx="8" fill={fillFor("calves")} />
          <rect x="26" y="28" width="12" height="24" rx="6" fill={fillFor("shoulders")} />
          <rect x="58" y="28" width="12" height="24" rx="6" fill={fillFor("shoulders")} />
        </g>
        <g transform="translate(116 8)">
          <circle cx="48" cy="16" r="12" fill="#3f3f46" />
          <rect x="34" y="30" width="28" height="36" rx="12" fill={fillFor("back")} />
          <rect x="26" y="42" width="16" height="48" rx="8" fill={fillFor("lats")} />
          <rect x="54" y="42" width="16" height="48" rx="8" fill={fillFor("lats")} />
          <rect x="30" y="90" width="36" height="28" rx="10" fill={fillFor("glutes")} />
          <rect x="12" y="34" width="16" height="52" rx="8" fill={fillFor("triceps")} />
          <rect x="68" y="34" width="16" height="52" rx="8" fill={fillFor("triceps")} />
          <rect x="31" y="120" width="16" height="48" rx="8" fill={fillFor("hamstrings")} />
          <rect x="50" y="120" width="16" height="48" rx="8" fill={fillFor("hamstrings")} />
          <rect x="31" y="170" width="16" height="24" rx="8" fill={fillFor("calves")} />
          <rect x="50" y="170" width="16" height="24" rx="8" fill={fillFor("calves")} />
          <rect x="26" y="28" width="12" height="24" rx="6" fill={fillFor("shoulders")} />
          <rect x="58" y="28" width="12" height="24" rx="6" fill={fillFor("shoulders")} />
        </g>
      </svg>
    </div>
  );
}
