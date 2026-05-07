"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import ExerciseLibrary from "../components/ExerciseLibrary";
import {
  createEmptySet,
  workoutDraftKey,
  type ExerciseDefinition,
  type WorkoutExercise,
} from "../components/workoutTypes";

const readDraft = (): WorkoutExercise[] => {
  try {
    const storedDraft = window.localStorage.getItem(workoutDraftKey);
    const parsedDraft = storedDraft
      ? (JSON.parse(storedDraft) as WorkoutExercise[])
      : [];
    return Array.isArray(parsedDraft) ? parsedDraft : [];
  } catch {
    return [];
  }
};

export default function ExerciseLibraryPage() {
  const router = useRouter();

  const addExercise = (exercise: ExerciseDefinition) => {
    const currentExercises = readDraft();
    if (currentExercises.some((item) => item.exerciseId === exercise.id)) {
      router.push("/workout/new");
      return;
    }
    const nextExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      equipment: exercise.equipment,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      notes: "",
      sets: [createEmptySet()],
    };
    window.localStorage.setItem(
      workoutDraftKey,
      JSON.stringify([...currentExercises, nextExercise]),
    );
    router.push("/workout/new");
  };

  return (
    <main className="min-h-screen bg-[#131314] px-5 pb-28 pt-6 text-white">
      <section className="mx-auto flex max-w-md flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#d9ee4f" }}>
              Exercise Library
            </p>
            <h1 className="text-white text-3xl font-black">Add Exercise</h1>
          </div>
          <Link
            className="rounded-xl border border-white/10 bg-[#1c1b1c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#252528] transition-colors"
            href="/workout/new"
          >
            Done
          </Link>
        </div>
        <ExerciseLibrary onAdd={addExercise} />
      </section>
      <BottomNav />
    </main>
  );
}
