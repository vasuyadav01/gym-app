"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import BottomNav from "../components/BottomNav";
import FitnessDashboard from "../components/FitnessDashboard";
import { auth, db } from "@/lib/firebase";

type Gym = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
};

type WorkoutTemplate = {
  id: string;
  name: string;
  date?: string;
  duration?: number;
  exercises?: WorkoutExercise[];
};

type WorkoutExercise = {
  exerciseId?: string;
  name: string;
  category: string;
  equipment: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  sets?: unknown[];
};

const toWorkoutDate = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return (value.toDate() as Date).toISOString();
  }

  return undefined;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : "Something went wrong.";
  };

  useEffect(() => {
    let unsubscribeWorkouts: Unsubscribe | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);

      try {
        const userSnapshot = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userSnapshot.data() as { gymId?: string } | undefined;
        const gymId = userData?.gymId;

        if (!gymId) {
          setLoading(false);
          return;
        }

        const gymSnapshot = await getDoc(doc(db, "gyms", gymId));

        if (!gymSnapshot.exists()) {
          setLoading(false);
          return;
        }

        const gymData = gymSnapshot.data() as Omit<Gym, "id">;
        setGym({
          id: gymSnapshot.id,
          name: gymData.name,
          ownerId: gymData.ownerId,
          inviteCode: gymData.inviteCode,
        });

        unsubscribeWorkouts?.();

        unsubscribeWorkouts = onSnapshot(
          query(collection(db, "workouts"), where("gymId", "==", gymId)),
          (workoutsSnapshot) => {
            setWorkouts(
              workoutsSnapshot.docs.map((workoutDoc) => {
                const workoutData = workoutDoc.data() as Omit<
                  WorkoutTemplate,
                  "id"
                >;

                return {
                  id: workoutDoc.id,
                  name: workoutData.name,
                  date:
                    toWorkoutDate(
                      (workoutData as { startTime?: unknown }).startTime,
                    ) ??
                    toWorkoutDate(
                      (workoutData as { createdAt?: unknown }).createdAt,
                    ),
                  duration: (workoutData as { duration?: number }).duration,
                  exercises: workoutData.exercises ?? [],
                };
              }),
            );
          },
          (err) => setMessage(getErrorMessage(err)),
        );
      } catch (err: unknown) {
        setMessage(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeWorkouts?.();
    };
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="w-8 h-8 rounded-full border-4 border-[#EAFF5F] border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--app-bg)]">
      {message ? (
        <div className="max-w-md mx-auto px-5 pt-5">
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {message}
          </p>
        </div>
      ) : null}
      <FitnessDashboard
        gymName={gym?.name}
        inviteCode={gym?.inviteCode}
        onSignOut={handleSignOut}
        userEmail={user?.email}
        workouts={workouts}
      />
      <BottomNav />
    </main>
  );
}
