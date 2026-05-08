// Premade workout plan generator — no API required.
// Covers all 144 combinations of the 4 onboarding questions.

export type FitnessLevel = "Beginner" | "Intermediate" | "Advanced";
export type Goal = "Lose Weight" | "Build Muscle" | "Stay Fit" | "Get Strong";
export type Days = "3" | "4" | "5" | "6";
export type Equipment = "Full Gym" | "Dumbbells Only" | "No Equipment";

export type Exercise   = { name: string; sets: number; reps: string; rest: string; notes?: string };
export type WorkoutDay = { day: string; focus: string; exercises: Exercise[] };
export type Plan       = { planName: string; days: WorkoutDay[] };

// ── Rep / Set params ─────────────────────────────────────────────────────────

const PARAMS: Record<Goal, Record<FitnessLevel, { sets: number; reps: string; rest: string }>> = {
  "Build Muscle": {
    Beginner:     { sets: 3, reps: "8-12",  rest: "75s"   },
    Intermediate: { sets: 4, reps: "8-12",  rest: "90s"   },
    Advanced:     { sets: 4, reps: "6-12",  rest: "90s"   },
  },
  "Lose Weight": {
    Beginner:     { sets: 2, reps: "15-20", rest: "30s"   },
    Intermediate: { sets: 3, reps: "12-20", rest: "45s"   },
    Advanced:     { sets: 4, reps: "12-20", rest: "30s"   },
  },
  "Stay Fit": {
    Beginner:     { sets: 2, reps: "12-15", rest: "45s"   },
    Intermediate: { sets: 3, reps: "10-15", rest: "60s"   },
    Advanced:     { sets: 3, reps: "10-15", rest: "60s"   },
  },
  "Get Strong": {
    Beginner:     { sets: 3, reps: "5-8",   rest: "2 min" },
    Intermediate: { sets: 4, reps: "4-6",   rest: "3 min" },
    Advanced:     { sets: 5, reps: "3-5",   rest: "4 min" },
  },
};

// ── Exercise pools ────────────────────────────────────────────────────────────
// Each pool is [name, ...]. Selection uses slice(offset, offset+count) so
// PPL-A and PPL-B can use different exercises from the same pool.

type Pool = Record<string, string[]>;

const POOL: Record<Equipment, Pool> = {
  "Full Gym": {
    chest: [
      "Barbell Bench Press",
      "Incline Barbell Press",
      "Dumbbell Bench Press",
      "Cable Chest Flye",
      "Incline Dumbbell Press",
      "Pec Deck Machine",
      "Decline Dumbbell Press",
      "Cable Crossover",
    ],
    back: [
      "Barbell Row",
      "Lat Pulldown",
      "Seated Cable Row",
      "T-Bar Row",
      "Pull-Up",
      "Single-Arm Dumbbell Row",
      "Face Pull",
      "Chest-Supported Row",
    ],
    shoulders: [
      "Barbell Overhead Press",
      "Dumbbell Shoulder Press",
      "Lateral Raise",
      "Arnold Press",
      "Upright Row",
      "Cable Lateral Raise",
      "Rear Delt Flye",
      "Machine Shoulder Press",
    ],
    triceps: [
      "Tricep Pushdown (Cable)",
      "Skull Crusher",
      "Close-Grip Bench Press",
      "Overhead Tricep Extension",
      "Cable Overhead Tricep Extension",
      "Diamond Push-Up",
    ],
    biceps: [
      "Barbell Curl",
      "Hammer Curl",
      "Incline Dumbbell Curl",
      "Cable Curl",
      "Preacher Curl",
      "Concentration Curl",
    ],
    quads: [
      "Barbell Back Squat",
      "Leg Press",
      "Hack Squat",
      "Leg Extension",
      "Walking Lunge",
      "Front Squat",
      "Bulgarian Split Squat",
    ],
    hamstrings: [
      "Romanian Deadlift",
      "Lying Leg Curl",
      "Stiff-Leg Deadlift",
      "Good Morning",
      "Nordic Curl",
      "Seated Leg Curl",
    ],
    glutes: [
      "Barbell Hip Thrust",
      "Bulgarian Split Squat",
      "Sumo Deadlift",
      "Cable Glute Kickback",
      "Step-Up",
      "Glute Bridge",
    ],
    calves: [
      "Standing Calf Raise",
      "Seated Calf Raise",
      "Leg Press Calf Raise",
    ],
    core: [
      "Hanging Leg Raise",
      "Cable Crunch",
      "Ab Rollout",
      "Plank",
      "Russian Twist",
      "Decline Crunch",
      "Oblique Crunch",
    ],
  },

  "Dumbbells Only": {
    chest: [
      "Dumbbell Bench Press",
      "Incline Dumbbell Press",
      "Dumbbell Flye",
      "Dumbbell Pullover",
      "Close-Grip Push-Up",
      "Push-Up",
      "Decline Dumbbell Press",
    ],
    back: [
      "Single-Arm Dumbbell Row",
      "Bent-Over Dumbbell Row",
      "Dumbbell Pullover",
      "Renegade Row",
      "Dumbbell Shrug",
      "Superman Hold",
      "Prone Dumbbell Row",
    ],
    shoulders: [
      "Dumbbell Shoulder Press",
      "Arnold Press",
      "Lateral Raise",
      "Front Raise",
      "Dumbbell Upright Row",
      "Rear Delt Raise",
      "Seated Dumbbell Press",
    ],
    triceps: [
      "Overhead Tricep Extension",
      "Tricep Kickback",
      "Diamond Push-Up",
      "Close-Grip Push-Up",
      "Dumbbell Skull Crusher",
    ],
    biceps: [
      "Dumbbell Curl",
      "Hammer Curl",
      "Incline Dumbbell Curl",
      "Concentration Curl",
      "Zottman Curl",
      "Cross-Body Curl",
    ],
    quads: [
      "Goblet Squat",
      "Dumbbell Lunge",
      "Bulgarian Split Squat",
      "Dumbbell Step-Up",
      "Sumo Squat",
      "Dumbbell Front Squat",
      "Reverse Lunge",
    ],
    hamstrings: [
      "Romanian Deadlift",
      "Lying Dumbbell Leg Curl",
      "Good Morning",
      "Single-Leg Romanian Deadlift",
      "Nordic Curl",
    ],
    glutes: [
      "Dumbbell Hip Thrust",
      "Bulgarian Split Squat",
      "Sumo Squat",
      "Step-Up",
      "Dumbbell Glute Bridge",
    ],
    calves: [
      "Dumbbell Calf Raise",
      "Single-Leg Calf Raise",
      "Seated Calf Raise",
    ],
    core: [
      "Dumbbell Russian Twist",
      "Leg Raise",
      "Plank",
      "Dumbbell Side Bend",
      "Crunch",
      "Bicycle Crunch",
      "Hollow Body Hold",
    ],
  },

  "No Equipment": {
    upper_push: [
      "Push-Up",
      "Wide Push-Up",
      "Decline Push-Up",
      "Incline Push-Up",
      "Diamond Push-Up",
      "Pike Push-Up",
      "Archer Push-Up",
    ],
    upper_pull: [
      "Pull-Up",
      "Superman",
      "Inverted Row",
      "Australian Pull-Up",
      "Reverse Snow Angel",
      "Prone Y-T-W",
    ],
    shoulders: [
      "Pike Push-Up",
      "Shoulder Tap",
      "Downward Dog Push-Up",
      "Wall Handstand Hold",
    ],
    triceps: [
      "Tricep Dips",
      "Diamond Push-Up",
      "Close-Grip Push-Up",
    ],
    legs: [
      "Bodyweight Squat",
      "Lunge",
      "Jump Squat",
      "Bulgarian Split Squat",
      "Glute Bridge",
      "Hip Thrust",
      "Wall Sit",
      "Step-Up",
      "Sumo Squat",
      "Reverse Lunge",
    ],
    calves: [
      "Calf Raise",
      "Single-Leg Calf Raise",
      "Jump Rope (simulated)",
    ],
    core: [
      "Plank",
      "Crunch",
      "Leg Raise",
      "Mountain Climber",
      "Bicycle Crunch",
      "Hollow Body Hold",
      "Russian Twist",
      "Flutter Kick",
      "V-Up",
    ],
    cardio: [
      "Burpee",
      "High Knees",
      "Jumping Jack",
      "Jump Squat",
      "Mountain Climber",
      "Bear Crawl",
    ],
  },
};

// ── Day-of-week assignment ────────────────────────────────────────────────────

const DAY_SCHEDULES: Record<string, string[]> = {
  "3": ["Monday", "Wednesday", "Friday"],
  "4": ["Monday", "Tuesday", "Thursday", "Friday"],
  "5": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "6": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

// ── Day split templates ───────────────────────────────────────────────────────
// muscles: [poolKey, count, offset]   offset lets PPL-B use different exercises

type MuscleSlice = [string, number, number]; // [poolKey, count, offset]
type DayTemplate = { focus: string; muscles: MuscleSlice[] };
type SplitMap = Record<string, DayTemplate[]>;

const SPLITS: Record<Equipment, SplitMap> = {
  "Full Gym": {
    "3": [
      {
        focus: "Full Body A",
        muscles: [["chest", 2, 0], ["back", 2, 0], ["quads", 2, 0], ["core", 1, 0]],
      },
      {
        focus: "Full Body B",
        muscles: [["shoulders", 2, 0], ["back", 2, 2], ["hamstrings", 2, 0], ["core", 1, 1]],
      },
      {
        focus: "Full Body C",
        muscles: [["chest", 2, 2], ["biceps", 1, 0], ["quads", 1, 2], ["glutes", 2, 0], ["core", 1, 2]],
      },
    ],
    "4": [
      {
        focus: "Upper A (Chest & Back)",
        muscles: [["chest", 2, 0], ["back", 2, 0], ["shoulders", 1, 0], ["triceps", 1, 0], ["biceps", 1, 0]],
      },
      {
        focus: "Lower A (Quads & Hamstrings)",
        muscles: [["quads", 2, 0], ["hamstrings", 2, 0], ["glutes", 1, 0], ["calves", 1, 0], ["core", 1, 0]],
      },
      {
        focus: "Upper B (Shoulders & Arms)",
        muscles: [["shoulders", 2, 2], ["back", 2, 4], ["chest", 1, 4], ["biceps", 1, 2], ["triceps", 1, 2]],
      },
      {
        focus: "Lower B (Glutes & Core)",
        muscles: [["quads", 2, 3], ["hamstrings", 2, 2], ["glutes", 2, 2], ["core", 2, 3]],
      },
    ],
    "5": [
      {
        focus: "Push (Chest, Shoulders, Triceps)",
        muscles: [["chest", 3, 0], ["shoulders", 2, 0], ["triceps", 2, 0]],
      },
      {
        focus: "Pull (Back & Biceps)",
        muscles: [["back", 4, 0], ["biceps", 3, 0]],
      },
      {
        focus: "Legs (Quads, Hamstrings, Glutes)",
        muscles: [["quads", 3, 0], ["hamstrings", 2, 0], ["glutes", 1, 0], ["calves", 1, 0]],
      },
      {
        focus: "Upper Body",
        muscles: [["chest", 2, 3], ["back", 2, 5], ["shoulders", 2, 4], ["biceps", 1, 4], ["triceps", 1, 4]],
      },
      {
        focus: "Lower Body & Core",
        muscles: [["quads", 2, 4], ["hamstrings", 2, 3], ["glutes", 2, 3], ["core", 3, 2]],
      },
    ],
    "6": [
      {
        focus: "Push A (Chest Heavy)",
        muscles: [["chest", 3, 0], ["shoulders", 2, 0], ["triceps", 2, 0]],
      },
      {
        focus: "Pull A (Back Heavy)",
        muscles: [["back", 4, 0], ["biceps", 3, 0]],
      },
      {
        focus: "Legs A (Quad Dominant)",
        muscles: [["quads", 3, 0], ["hamstrings", 2, 0], ["calves", 1, 0], ["core", 1, 0]],
      },
      {
        focus: "Push B (Shoulders Heavy)",
        muscles: [["chest", 2, 3], ["shoulders", 3, 3], ["triceps", 2, 3]],
      },
      {
        focus: "Pull B (Width Focus)",
        muscles: [["back", 4, 4], ["biceps", 3, 3]],
      },
      {
        focus: "Legs B (Posterior Chain)",
        muscles: [["hamstrings", 3, 2], ["glutes", 3, 2], ["quads", 1, 6], ["calves", 1, 1]],
      },
    ],
  },

  "Dumbbells Only": {
    "3": [
      {
        focus: "Full Body A",
        muscles: [["chest", 2, 0], ["back", 2, 0], ["quads", 2, 0], ["core", 1, 0]],
      },
      {
        focus: "Full Body B",
        muscles: [["shoulders", 2, 0], ["back", 2, 2], ["hamstrings", 2, 0], ["core", 1, 1]],
      },
      {
        focus: "Full Body C",
        muscles: [["chest", 2, 2], ["biceps", 2, 0], ["quads", 2, 2], ["core", 1, 3]],
      },
    ],
    "4": [
      {
        focus: "Upper A (Chest & Back)",
        muscles: [["chest", 2, 0], ["back", 2, 0], ["shoulders", 1, 0], ["triceps", 1, 0], ["biceps", 1, 0]],
      },
      {
        focus: "Lower A (Quads & Glutes)",
        muscles: [["quads", 3, 0], ["hamstrings", 2, 0], ["glutes", 1, 0], ["calves", 1, 0]],
      },
      {
        focus: "Upper B (Shoulders & Arms)",
        muscles: [["shoulders", 2, 3], ["back", 2, 4], ["biceps", 2, 2], ["triceps", 2, 2]],
      },
      {
        focus: "Lower B & Core",
        muscles: [["quads", 2, 3], ["hamstrings", 2, 2], ["glutes", 2, 2], ["core", 2, 3]],
      },
    ],
    "5": [
      {
        focus: "Push (Chest, Shoulders, Triceps)",
        muscles: [["chest", 3, 0], ["shoulders", 2, 0], ["triceps", 2, 0]],
      },
      {
        focus: "Pull (Back & Biceps)",
        muscles: [["back", 4, 0], ["biceps", 3, 0]],
      },
      {
        focus: "Legs (Quads, Hamstrings, Glutes)",
        muscles: [["quads", 3, 0], ["hamstrings", 2, 0], ["glutes", 2, 0], ["calves", 1, 0]],
      },
      {
        focus: "Upper Body",
        muscles: [["chest", 2, 3], ["back", 2, 4], ["shoulders", 2, 3], ["biceps", 1, 4]],
      },
      {
        focus: "Lower Body & Core",
        muscles: [["quads", 2, 4], ["hamstrings", 2, 3], ["glutes", 1, 3], ["core", 3, 2]],
      },
    ],
    "6": [
      {
        focus: "Push A",
        muscles: [["chest", 3, 0], ["shoulders", 2, 0], ["triceps", 2, 0]],
      },
      {
        focus: "Pull A",
        muscles: [["back", 4, 0], ["biceps", 3, 0]],
      },
      {
        focus: "Legs A",
        muscles: [["quads", 3, 0], ["hamstrings", 2, 0], ["calves", 1, 0], ["core", 1, 0]],
      },
      {
        focus: "Push B",
        muscles: [["chest", 2, 3], ["shoulders", 3, 3], ["triceps", 2, 2]],
      },
      {
        focus: "Pull B",
        muscles: [["back", 3, 4], ["biceps", 3, 2]],
      },
      {
        focus: "Legs B & Core",
        muscles: [["hamstrings", 3, 2], ["glutes", 2, 2], ["quads", 1, 5], ["core", 2, 2]],
      },
    ],
  },

  "No Equipment": {
    "3": [
      {
        focus: "Full Body A",
        muscles: [["upper_push", 2, 0], ["upper_pull", 2, 0], ["legs", 2, 0], ["core", 2, 0]],
      },
      {
        focus: "Full Body B",
        muscles: [["upper_push", 2, 2], ["legs", 3, 3], ["core", 2, 2]],
      },
      {
        focus: "Full Body C",
        muscles: [["upper_push", 2, 4], ["upper_pull", 2, 2], ["legs", 2, 6], ["core", 2, 4]],
      },
    ],
    "4": [
      {
        focus: "Upper Body A",
        muscles: [["upper_push", 3, 0], ["upper_pull", 2, 0], ["shoulders", 1, 0], ["triceps", 1, 0]],
      },
      {
        focus: "Lower Body A",
        muscles: [["legs", 4, 0], ["calves", 1, 0], ["core", 2, 0]],
      },
      {
        focus: "Upper Body B",
        muscles: [["upper_push", 3, 2], ["upper_pull", 2, 2], ["core", 2, 3]],
      },
      {
        focus: "Lower Body B & Core",
        muscles: [["legs", 3, 5], ["calves", 1, 1], ["core", 3, 4]],
      },
    ],
    "5": [
      {
        focus: "Push (Chest & Triceps)",
        muscles: [["upper_push", 4, 0], ["shoulders", 2, 0], ["triceps", 2, 0]],
      },
      {
        focus: "Pull & Back",
        muscles: [["upper_pull", 4, 0], ["core", 3, 0]],
      },
      {
        focus: "Legs (Quads & Glutes)",
        muscles: [["legs", 5, 0], ["calves", 2, 0]],
      },
      {
        focus: "Upper Body",
        muscles: [["upper_push", 3, 2], ["upper_pull", 2, 2], ["shoulders", 1, 1], ["core", 2, 3]],
      },
      {
        focus: "Lower Body & Core",
        muscles: [["legs", 4, 5], ["core", 4, 4]],
      },
    ],
    "6": [
      {
        focus: "Push A",
        muscles: [["upper_push", 4, 0], ["shoulders", 2, 0], ["triceps", 2, 0]],
      },
      {
        focus: "Pull A",
        muscles: [["upper_pull", 4, 0], ["core", 3, 0]],
      },
      {
        focus: "Legs A",
        muscles: [["legs", 5, 0], ["calves", 1, 0], ["core", 2, 6]],
      },
      {
        focus: "Push B",
        muscles: [["upper_push", 4, 2], ["shoulders", 1, 2], ["triceps", 1, 1]],
      },
      {
        focus: "Pull B",
        muscles: [["upper_pull", 3, 2], ["core", 4, 2]],
      },
      {
        focus: "Legs B & Core",
        muscles: [["legs", 4, 5], ["calves", 1, 1], ["core", 3, 5]],
      },
    ],
  },
};

// ── Plan name generator ───────────────────────────────────────────────────────

function planName(goal: Goal, level: FitnessLevel, days: Days, equipment: Equipment): string {
  const goalMap: Record<Goal, string> = {
    "Build Muscle":  "Hypertrophy",
    "Lose Weight":   "Fat Burn",
    "Stay Fit":      "Performance",
    "Get Strong":    "Strength",
  };
  const equip: Record<Equipment, string> = {
    "Full Gym":       "",
    "Dumbbells Only": "· DB",
    "No Equipment":   "· Bodyweight",
  };
  return `${level} ${goalMap[goal]} · ${days}×/wk${equip[equipment]}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function getWorkoutPlan(
  fitnessLevel: FitnessLevel,
  goal: Goal,
  days: Days,
  equipment: Equipment,
): Plan {
  const params    = PARAMS[goal][fitnessLevel];
  const schedule  = DAY_SCHEDULES[days];
  const pool      = POOL[equipment];
  const templates = SPLITS[equipment][days];

  const workoutDays: WorkoutDay[] = templates.map((template, idx) => {
    const exercises: Exercise[] = template.muscles.flatMap(([poolKey, count, offset]) => {
      const available = pool[poolKey] ?? [];
      return available.slice(offset, offset + count).map((name) => ({
        name,
        sets: params.sets,
        reps: params.reps,
        rest: params.rest,
      }));
    });

    return {
      day:       schedule[idx],
      focus:     template.focus,
      exercises,
    };
  });

  return {
    planName: planName(goal, fitnessLevel, days, equipment),
    days:     workoutDays,
  };
}
