"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import WorkoutSession from "../../components/WorkoutSession";
import type { WorkoutExercise } from "../../components/workoutTypes";
import { auth, db } from "@/lib/firebase";

type WorkoutSavePayload = {
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalVolume: number;
  exercises: WorkoutExercise[];
};

export default function NewWorkoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gymId, setGymId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Something went wrong.";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.replace("/login"); return; }
      setUser(currentUser);
      try {
        const userSnapshot = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userSnapshot.data() as { gymId?: string } | undefined;
        const currentGymId = userData?.gymId;
        if (currentGymId) setGymId(currentGymId);
      } catch (err) {
        setMessage(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [router]);

  const saveWorkout = async (payload: WorkoutSavePayload) => {
    if (!user) { router.replace("/login"); return; }
    if (!gymId) { setMessage("Join a gym first to save workouts to the leaderboard."); setSaving(false); return; }
    setSaving(true);
    setMessage("");
    try {
      const sanitizedExercises = JSON.parse(JSON.stringify(
        payload.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          category: ex.category,
          equipment: ex.equipment,
          primaryMuscles: ex.primaryMuscles ?? [],
          secondaryMuscles: ex.secondaryMuscles ?? [],
          notes: ex.notes ?? "",
          sets: ex.sets.map((s) => ({
            weight: s.weight ?? 0,
            reps: s.reps ?? 0,
            completed: s.completed ?? false,
            isPR: s.isPR ?? false,
            ...(s.rpe != null ? { rpe: s.rpe } : {}),
          })),
        }))
      ));
      const workoutRef = doc(collection(db, "workouts"));
      await setDoc(workoutRef, {
        name: payload.name.trim() || "New Workout",
        gymId,
        ownerId: user.uid,
        ownerEmail: user.email ?? "",
        startTime: payload.startTime,
        endTime: payload.endTime,
        duration: payload.duration,
        exercises: sanitizedExercises,
        totalWeight: payload.totalVolume,
        totalVolume: payload.totalVolume,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.replace("/dashboard");
    } catch (err) {
      setMessage(getErrorMessage(err));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#d9ee4f", borderTopColor: "transparent" }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--app-bg)]">
      <WorkoutSession message={message} onSave={saveWorkout} saving={saving} />
    </main>
  );
}
