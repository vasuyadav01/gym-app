export type ExerciseDefinition = {
  id: string;
  name: string;
  category: "Chest" | "Back" | "Shoulders" | "Arms" | "Legs" | "Core" | "Cardio";
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight";
  primaryMuscles: string[];
  secondaryMuscles: string[];
};

export type WorkoutSet = {
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
  isPR?: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  name: string;
  category: string;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  notes: string;
  sets: WorkoutSet[];
};

export type WorkoutHistoryItem = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalVolume: number;
  exercises: WorkoutExercise[];
};

export const workoutHistoryKey = "gympulse:workout-history";
export const workoutDraftKey = "gympulse:new-workout-exercises";

export const createEmptySet = (): WorkoutSet => ({
  weight: 0,
  reps: 0,
  completed: false,
  isPR: false,
});

export const calculateSetVolume = (set: WorkoutSet) => {
  return Number(set.weight || 0) * Number(set.reps || 0);
};

export const calculateExerciseVolume = (exercise: WorkoutExercise) => {
  return exercise.sets.reduce((total, set) => {
    return total + calculateSetVolume(set);
  }, 0);
};

export const calculateWorkoutVolume = (exercises: WorkoutExercise[]) => {
  return exercises.reduce((total, exercise) => {
    return total + calculateExerciseVolume(exercise);
  }, 0);
};

export const getWorkoutHistory = (): WorkoutHistoryItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedHistory = window.localStorage.getItem(workoutHistoryKey);
    const parsedHistory = storedHistory
      ? (JSON.parse(storedHistory) as WorkoutHistoryItem[])
      : [];

    return Array.isArray(parsedHistory) ? parsedHistory : [];
  } catch {
    return [];
  }
};

export const saveWorkoutHistory = (workout: WorkoutHistoryItem) => {
  const history = getWorkoutHistory();
  window.localStorage.setItem(
    workoutHistoryKey,
    JSON.stringify([workout, ...history]),
  );
};

export const getPreviousBestWeight = (exerciseId: string) => {
  return getWorkoutHistory().reduce((best, workout) => {
    const exercise = workout.exercises.find((item) => {
      return item.exerciseId === exerciseId;
    });

    if (!exercise) {
      return best;
    }

    return Math.max(
      best,
      ...exercise.sets.map((set) => Number(set.weight || 0)),
    );
  }, 0);
};

export const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};
