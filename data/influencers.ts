export type InfluencerExercise = {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
};

export type ProgramDay = {
  day: string;
  name: string;
  exercises: InfluencerExercise[];
};

export type Influencer = {
  id: string;
  name: string;
  title: string;
  emoji: string;
  category: "Bodybuilding" | "Powerbuilding" | "HIT" | "Classic" | "Science-Based";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  split: string;
  daysPerWeek: number;
  quote: string;
  accentColor: string;
  program: ProgramDay[];
};

export const INFLUENCERS: Influencer[] = [
  // ─────────────────────────────────────────────────────────────────
  {
    id: "arnold",
    name: "Arnold Schwarzenegger",
    title: "Golden Era Bodybuilding · 7x Mr. Olympia",
    emoji: "🏆",
    category: "Bodybuilding",
    difficulty: "Advanced",
    split: "Arnold Split (Chest+Back / Shoulders+Arms / Legs)",
    daysPerWeek: 6,
    quote: "The last three or four reps is what makes the muscle grow. This area of pain divides the champion from someone else who is not a champion.",
    accentColor: "#f59e0b",
    program: [
      {
        day: "Monday & Thursday",
        name: "Chest & Back",
        exercises: [
          { name: "Bench Press", sets: 5, reps: "6-10", rest: "90s" },
          { name: "Incline Dumbbell Press", sets: 5, reps: "6-10", rest: "90s" },
          { name: "Dumbbell Fly", sets: 5, reps: "10-12", rest: "60s" },
          { name: "Cable Crossover", sets: 6, reps: "10-12", rest: "60s" },
          { name: "Pull-Up", sets: 5, reps: "failure", rest: "90s", notes: "Wide grip" },
          { name: "Barbell Row", sets: 5, reps: "8-12", rest: "90s" },
          { name: "T-Bar Row", sets: 5, reps: "8-12", rest: "90s" },
          { name: "Seated Cable Row", sets: 5, reps: "10-12", rest: "60s" },
        ],
      },
      {
        day: "Tuesday & Friday",
        name: "Shoulders & Arms",
        exercises: [
          { name: "Overhead Press", sets: 5, reps: "8-10", rest: "90s", notes: "Barbell, standing" },
          { name: "Dumbbell Shoulder Press", sets: 5, reps: "8-10", rest: "90s" },
          { name: "Dumbbell Lateral Raise", sets: 5, reps: "12-15", rest: "60s" },
          { name: "Barbell Curl", sets: 6, reps: "8-10", rest: "60s" },
          { name: "Dumbbell Curl", sets: 6, reps: "8-10", rest: "60s", notes: "Alternating" },
          { name: "Concentration Curl", sets: 6, reps: "10-12", rest: "45s" },
          { name: "Triceps Pushdown", sets: 6, reps: "10-12", rest: "60s" },
          { name: "Skull Crusher", sets: 5, reps: "8-10", rest: "60s" },
          { name: "Dip", sets: 5, reps: "failure", rest: "90s", notes: "Weighted if possible" },
        ],
      },
      {
        day: "Wednesday & Saturday",
        name: "Legs",
        exercises: [
          { name: "Back Squat", sets: 6, reps: "8-12", rest: "2min" },
          { name: "Front Squat", sets: 5, reps: "8-10", rest: "2min" },
          { name: "Leg Press", sets: 6, reps: "10-15", rest: "90s" },
          { name: "Romanian Deadlift", sets: 6, reps: "10-15", rest: "90s", notes: "Stiff-leg style" },
          { name: "Leg Curl", sets: 5, reps: "10-12", rest: "60s" },
          { name: "Leg Extension", sets: 5, reps: "12-15", rest: "60s" },
          { name: "Standing Calf Raise", sets: 6, reps: "15", rest: "45s" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    id: "ronnie",
    name: "Ronnie Coleman",
    title: "8× Mr. Olympia · The GOAT of Bodybuilding",
    emoji: "🦁",
    category: "Bodybuilding",
    difficulty: "Advanced",
    split: "5-Day Bro Split",
    daysPerWeek: 5,
    quote: "Everybody wants to be a bodybuilder, but don't nobody wanna lift no heavy ass weights. Lightweight baby!",
    accentColor: "#ef4444",
    program: [
      {
        day: "Monday",
        name: "Chest",
        exercises: [
          { name: "Bench Press", sets: 4, reps: "10-12", rest: "2min", notes: "Work up to 495 lb" },
          { name: "Incline Barbell Press", sets: 4, reps: "10-12", rest: "2min" },
          { name: "Decline Bench Press", sets: 4, reps: "10-12", rest: "2min" },
          { name: "Dumbbell Fly", sets: 4, reps: "12-15", rest: "90s" },
          { name: "Cable Crossover", sets: 4, reps: "15-20", rest: "60s" },
        ],
      },
      {
        day: "Tuesday",
        name: "Back — Lightweight Baby",
        exercises: [
          { name: "Barbell Row", sets: 4, reps: "10-12", rest: "2min", notes: "315+ lb, strict form" },
          { name: "T-Bar Row", sets: 4, reps: "10-12", rest: "2min" },
          { name: "Lat Pulldown", sets: 4, reps: "12-15", rest: "90s", notes: "Wide grip" },
          { name: "Seated Cable Row", sets: 4, reps: "12-15", rest: "90s" },
          { name: "Single-Arm Cable Row", sets: 3, reps: "12-15", rest: "60s" },
        ],
      },
      {
        day: "Wednesday",
        name: "Legs — The Freakiest Legs",
        exercises: [
          { name: "Back Squat", sets: 4, reps: "10-12", rest: "3min", notes: "Up to 800 lb" },
          { name: "Leg Press", sets: 4, reps: "10-12", rest: "2min", notes: "2000+ lb" },
          { name: "Leg Extension", sets: 3, reps: "15-20", rest: "60s" },
          { name: "Romanian Deadlift", sets: 4, reps: "10-12", rest: "2min" },
          { name: "Leg Curl", sets: 4, reps: "12-15", rest: "90s" },
        ],
      },
      {
        day: "Thursday",
        name: "Shoulders",
        exercises: [
          { name: "Overhead Press", sets: 4, reps: "10-12", rest: "2min", notes: "Barbell, standing" },
          { name: "Dumbbell Shoulder Press", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Dumbbell Lateral Raise", sets: 4, reps: "15-20", rest: "60s" },
          { name: "Front Raise", sets: 4, reps: "12-15", rest: "60s" },
          { name: "Face Pull", sets: 4, reps: "15-20", rest: "60s" },
        ],
      },
      {
        day: "Friday",
        name: "Arms",
        exercises: [
          { name: "Barbell Curl", sets: 4, reps: "12-15", rest: "90s" },
          { name: "Hammer Curl", sets: 4, reps: "12-15", rest: "60s" },
          { name: "Preacher Curl", sets: 4, reps: "12-15", rest: "60s" },
          { name: "Triceps Pushdown", sets: 4, reps: "12-15", rest: "60s" },
          { name: "Skull Crusher", sets: 4, reps: "12-15", rest: "90s" },
          { name: "Overhead Triceps Extension", sets: 4, reps: "12-15", rest: "60s" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    id: "cbum-classic",
    name: "Chris Bumstead",
    title: "5× Classic Physique Mr. Olympia · CBum",
    emoji: "⚡",
    category: "Bodybuilding",
    difficulty: "Intermediate",
    split: "Push / Pull / Legs (6-Day)",
    daysPerWeek: 6,
    quote: "I want to be the best I can be. I want to push myself to my absolute limits and beyond.",
    accentColor: "#3b82f6",
    program: [
      {
        day: "Monday",
        name: "Push — Chest Focus",
        exercises: [
          { name: "Incline Dumbbell Press", sets: 4, reps: "8-12", rest: "90s" },
          { name: "Bench Press", sets: 4, reps: "8-12", rest: "90s" },
          { name: "Chest Press Machine", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Pec Deck / Chest Fly", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Cable Lateral Raise", sets: 4, reps: "15-20", rest: "45s" },
          { name: "Triceps Pushdown", sets: 3, reps: "12-15", rest: "60s" },
        ],
      },
      {
        day: "Tuesday",
        name: "Pull — Back Thickness",
        exercises: [
          { name: "Pull-Up", sets: 4, reps: "8-12", rest: "90s", notes: "Wide grip, full stretch" },
          { name: "Barbell Row", sets: 4, reps: "8-10", rest: "90s" },
          { name: "Seated Cable Row", sets: 4, reps: "10-12", rest: "60s" },
          { name: "Lat Pulldown", sets: 4, reps: "12-15", rest: "60s", notes: "Close grip" },
          { name: "Face Pull", sets: 3, reps: "15-20", rest: "45s" },
        ],
      },
      {
        day: "Wednesday",
        name: "Legs — Quad Sweep",
        exercises: [
          { name: "Hack Squat", sets: 4, reps: "8-12", rest: "2min", notes: "CBum's signature" },
          { name: "Leg Press", sets: 4, reps: "10-15", rest: "90s" },
          { name: "Leg Extension", sets: 3, reps: "15-20", rest: "60s" },
          { name: "Romanian Deadlift", sets: 4, reps: "8-12", rest: "90s" },
          { name: "Leg Curl", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Seated Calf Raise", sets: 4, reps: "15-20", rest: "45s" },
        ],
      },
      {
        day: "Thursday",
        name: "Push — Shoulder Focus",
        exercises: [
          { name: "Dumbbell Shoulder Press", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Cable Lateral Raise", sets: 4, reps: "15-20", rest: "45s" },
          { name: "Machine Shoulder Press", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Arnold Press", sets: 3, reps: "10-12", rest: "60s" },
          { name: "Rear Delt Fly", sets: 3, reps: "15-20", rest: "45s" },
          { name: "Rope Pushdown", sets: 3, reps: "15-20", rest: "45s" },
        ],
      },
      {
        day: "Friday",
        name: "Pull — Back Width",
        exercises: [
          { name: "Chest-Supported Row", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Dumbbell Row", sets: 4, reps: "10-12", rest: "60s", notes: "Unilateral" },
          { name: "Lat Pulldown", sets: 4, reps: "12-15", rest: "60s" },
          { name: "Straight-Arm Pulldown", sets: 3, reps: "12-15", rest: "45s" },
          { name: "Seated Cable Row", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Cable Curl", sets: 3, reps: "12-15", rest: "45s" },
        ],
      },
      {
        day: "Saturday",
        name: "Legs — Hamstring Focus",
        exercises: [
          { name: "Romanian Deadlift", sets: 4, reps: "8-12", rest: "90s" },
          { name: "Leg Curl", sets: 4, reps: "10-15", rest: "60s" },
          { name: "Back Squat", sets: 4, reps: "8-12", rest: "2min" },
          { name: "Leg Press", sets: 3, reps: "12-15", rest: "90s" },
          { name: "Walking Lunge", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Standing Calf Raise", sets: 4, reps: "15-20", rest: "45s" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    id: "jeff-nippard",
    name: "Jeff Nippard",
    title: "Science-Based Powerbuilding · Natural Pro",
    emoji: "🔬",
    category: "Science-Based",
    difficulty: "Intermediate",
    split: "Upper / Lower (4-Day)",
    daysPerWeek: 4,
    quote: "Train smarter, not just harder. Every rep should have a purpose backed by evidence.",
    accentColor: "#8b5cf6",
    program: [
      {
        day: "Monday",
        name: "Upper A — Strength",
        exercises: [
          { name: "Bench Press", sets: 4, reps: "4-6", rest: "3min", notes: "85% 1RM, RPE 8" },
          { name: "Barbell Row", sets: 4, reps: "4-6", rest: "3min" },
          { name: "Overhead Press", sets: 3, reps: "6-8", rest: "2min" },
          { name: "Lat Pulldown", sets: 3, reps: "8-10", rest: "90s" },
          { name: "Dumbbell Lateral Raise", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Triceps Pushdown", sets: 3, reps: "10-12", rest: "60s" },
          { name: "Biceps Curl", sets: 3, reps: "10-12", rest: "60s" },
        ],
      },
      {
        day: "Tuesday",
        name: "Lower A — Strength",
        exercises: [
          { name: "Back Squat", sets: 4, reps: "4-6", rest: "3min", notes: "RPE 8, pause at bottom" },
          { name: "Romanian Deadlift", sets: 3, reps: "6-8", rest: "2min" },
          { name: "Leg Press", sets: 3, reps: "10-12", rest: "90s" },
          { name: "Leg Curl", sets: 3, reps: "10-12", rest: "60s" },
          { name: "Standing Calf Raise", sets: 4, reps: "12-15", rest: "60s" },
        ],
      },
      {
        day: "Thursday",
        name: "Upper B — Hypertrophy",
        exercises: [
          { name: "Incline Dumbbell Press", sets: 4, reps: "8-12", rest: "90s" },
          { name: "Seated Cable Row", sets: 4, reps: "8-12", rest: "90s" },
          { name: "Dumbbell Shoulder Press", sets: 3, reps: "10-12", rest: "90s" },
          { name: "Pull-Up", sets: 3, reps: "8-12", rest: "90s", notes: "Add weight if needed" },
          { name: "Pec Deck / Chest Fly", sets: 3, reps: "12-15", rest: "60s" },
          { name: "EZ-Bar Curl", sets: 3, reps: "10-12", rest: "60s" },
          { name: "Skull Crusher", sets: 3, reps: "10-12", rest: "60s" },
        ],
      },
      {
        day: "Friday",
        name: "Lower B — Hypertrophy",
        exercises: [
          { name: "Leg Press", sets: 4, reps: "10-15", rest: "90s" },
          { name: "Romanian Deadlift", sets: 4, reps: "8-12", rest: "90s" },
          { name: "Hack Squat", sets: 3, reps: "10-12", rest: "90s" },
          { name: "Leg Curl", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Leg Extension", sets: 3, reps: "15-20", rest: "60s" },
          { name: "Seated Calf Raise", sets: 4, reps: "15-20", rest: "45s" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    id: "david-laid",
    name: "David Laid",
    title: "DUP Strength & Aesthetics · Skinny-to-Jacked",
    emoji: "🎯",
    category: "Powerbuilding",
    difficulty: "Intermediate",
    split: "DUP 3-Day Full Body",
    daysPerWeek: 3,
    quote: "Consistency over everything. The transformation happens slowly, then all at once.",
    accentColor: "#06b6d4",
    program: [
      {
        day: "Monday",
        name: "Heavy Day — Strength",
        exercises: [
          { name: "Back Squat", sets: 5, reps: "3-5", rest: "3min", notes: "90%+ intensity, low bar" },
          { name: "Bench Press", sets: 5, reps: "3-5", rest: "3min" },
          { name: "Barbell Row", sets: 5, reps: "3-5", rest: "3min" },
          { name: "Overhead Press", sets: 4, reps: "4-6", rest: "2min" },
          { name: "Dip", sets: 3, reps: "5-8", rest: "2min", notes: "Weighted" },
        ],
      },
      {
        day: "Wednesday",
        name: "Moderate Day — Power",
        exercises: [
          { name: "Deadlift", sets: 5, reps: "5", rest: "3min", notes: "Conventional, 80-85%" },
          { name: "Incline Barbell Press", sets: 4, reps: "6-8", rest: "2min" },
          { name: "Pull-Up", sets: 4, reps: "5-8", rest: "2min", notes: "Weighted" },
          { name: "Dumbbell Row", sets: 4, reps: "6-8", rest: "90s" },
          { name: "Barbell Curl", sets: 3, reps: "8-10", rest: "60s" },
        ],
      },
      {
        day: "Friday",
        name: "Light Day — Hypertrophy",
        exercises: [
          { name: "Leg Press", sets: 4, reps: "12-15", rest: "90s", notes: "High volume, 70%" },
          { name: "Dumbbell Bench Press", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Lat Pulldown", sets: 4, reps: "12-15", rest: "60s" },
          { name: "Seated Cable Row", sets: 4, reps: "12-15", rest: "60s" },
          { name: "Dumbbell Lateral Raise", sets: 4, reps: "15-20", rest: "45s" },
          { name: "Triceps Pushdown", sets: 3, reps: "12-15", rest: "45s" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    id: "mike-mentzer",
    name: "Mike Mentzer",
    title: "Heavy Duty HIT · Mr. Universe Champion",
    emoji: "💡",
    category: "HIT",
    difficulty: "Advanced",
    split: "HIT 3-Day Split",
    daysPerWeek: 3,
    quote: "Less is more. One set taken to absolute failure is worth more than twenty mediocre sets. Train infrequently, train intensely.",
    accentColor: "#dc2626",
    program: [
      {
        day: "Monday",
        name: "Chest & Back",
        exercises: [
          { name: "Pec Deck / Chest Fly", sets: 1, reps: "6-8", rest: "none", notes: "Immediately pre-exhaust before press" },
          { name: "Incline Barbell Press", sets: 1, reps: "6-8", rest: "5min", notes: "Absolute failure, forced reps" },
          { name: "Pull-Up", sets: 1, reps: "6-8", rest: "none", notes: "Pre-exhaust for row" },
          { name: "Barbell Row", sets: 1, reps: "6-8", rest: "5min", notes: "Maximum weight to failure" },
          { name: "Deadlift", sets: 1, reps: "5", rest: "5min", notes: "Very heavy, complete failure" },
        ],
      },
      {
        day: "Thursday",
        name: "Legs & Shoulders",
        exercises: [
          { name: "Leg Extension", sets: 1, reps: "8-10", rest: "none", notes: "Pre-exhaust superset" },
          { name: "Hack Squat", sets: 1, reps: "8-10", rest: "5min", notes: "To absolute failure" },
          { name: "Leg Curl", sets: 1, reps: "8-10", rest: "5min", notes: "Failure, negatives if possible" },
          { name: "Overhead Press", sets: 1, reps: "6-8", rest: "5min", notes: "Maximum load to failure" },
          { name: "Dumbbell Lateral Raise", sets: 1, reps: "8-10", rest: "5min", notes: "Strict, to failure" },
        ],
      },
      {
        day: "Monday+4",
        name: "Arms (Bi & Tri)",
        exercises: [
          { name: "Preacher Curl", sets: 1, reps: "6-8", rest: "none", notes: "Pre-exhaust" },
          { name: "Barbell Curl", sets: 1, reps: "6-8", rest: "5min", notes: "Cheat slightly on last rep" },
          { name: "Skull Crusher", sets: 1, reps: "6-8", rest: "none", notes: "Immediately into dips" },
          { name: "Dip", sets: 1, reps: "6-8", rest: "5min", notes: "Weighted, absolute failure" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    id: "frank-zane",
    name: "Frank Zane",
    title: "Mr. Olympia 1977-79 · The Aesthetics King",
    emoji: "🎨",
    category: "Classic",
    difficulty: "Intermediate",
    split: "3-Day Full Split",
    daysPerWeek: 3,
    quote: "Aesthetics is not just about size. It's about symmetry, proportion, and the illusion of perfection.",
    accentColor: "#10b981",
    program: [
      {
        day: "Monday",
        name: "Chest, Shoulders & Triceps",
        exercises: [
          { name: "Bench Press", sets: 5, reps: "8", rest: "90s" },
          { name: "Incline Barbell Press", sets: 5, reps: "8", rest: "90s" },
          { name: "Dumbbell Fly", sets: 5, reps: "10", rest: "60s" },
          { name: "Cable Crossover", sets: 5, reps: "12", rest: "60s" },
          { name: "Overhead Press", sets: 5, reps: "8", rest: "90s" },
          { name: "Dumbbell Lateral Raise", sets: 5, reps: "12", rest: "60s" },
          { name: "Triceps Pushdown", sets: 5, reps: "12", rest: "60s" },
          { name: "Skull Crusher", sets: 5, reps: "10", rest: "60s" },
        ],
      },
      {
        day: "Wednesday",
        name: "Back & Biceps",
        exercises: [
          { name: "Pull-Up", sets: 5, reps: "10", rest: "90s", notes: "Medium grip" },
          { name: "Barbell Row", sets: 5, reps: "8", rest: "90s" },
          { name: "T-Bar Row", sets: 5, reps: "8", rest: "90s" },
          { name: "Lat Pulldown", sets: 5, reps: "12", rest: "60s", notes: "Front, close grip" },
          { name: "Barbell Curl", sets: 5, reps: "8", rest: "60s" },
          { name: "Dumbbell Curl", sets: 5, reps: "10", rest: "60s" },
          { name: "Concentration Curl", sets: 5, reps: "12", rest: "45s" },
        ],
      },
      {
        day: "Friday",
        name: "Legs & Abs",
        exercises: [
          { name: "Front Squat", sets: 5, reps: "8-10", rest: "2min", notes: "Zane preferred front squats" },
          { name: "Leg Extension", sets: 5, reps: "15", rest: "60s" },
          { name: "Leg Curl", sets: 5, reps: "12", rest: "60s" },
          { name: "Standing Calf Raise", sets: 5, reps: "15", rest: "45s" },
          { name: "Hanging Leg Raise", sets: 5, reps: "15", rest: "45s" },
          { name: "Crunch", sets: 5, reps: "25", rest: "30s" },
          { name: "Side Plank", sets: 3, reps: "30s hold", rest: "30s" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    id: "dorian-yates",
    name: "Dorian Yates",
    title: "6× Mr. Olympia · Blood and Guts Training",
    emoji: "🩸",
    category: "Bodybuilding",
    difficulty: "Advanced",
    split: "4-Day HIT Bro Split",
    daysPerWeek: 4,
    quote: "Most people lack the guts to start a new life. They stay trapped in old habits because it's comfortable.",
    accentColor: "#7c3aed",
    program: [
      {
        day: "Monday",
        name: "Chest & Biceps",
        exercises: [
          { name: "Pec Deck / Chest Fly", sets: 1, reps: "8-10", rest: "90s", notes: "2 warm-up sets, then 1 all-out working set" },
          { name: "Incline Barbell Press", sets: 1, reps: "6-8", rest: "90s", notes: "Working set to absolute failure" },
          { name: "Dumbbell Bench Press", sets: 1, reps: "6-8", rest: "90s", notes: "Forced reps if needed" },
          { name: "Barbell Curl", sets: 1, reps: "6-8", rest: "90s", notes: "2 warm-up, 1 max effort" },
          { name: "Hammer Curl", sets: 1, reps: "8-10", rest: "90s", notes: "Failure + 2 forced reps" },
        ],
      },
      {
        day: "Wednesday",
        name: "Legs",
        exercises: [
          { name: "Leg Extension", sets: 1, reps: "10-12", rest: "90s", notes: "Warm-up then full send" },
          { name: "Leg Press", sets: 1, reps: "10-12", rest: "2min", notes: "Extremely heavy working set" },
          { name: "Back Squat", sets: 1, reps: "10-12", rest: "2min", notes: "After leg press, brutal" },
          { name: "Leg Curl", sets: 2, reps: "10-12", rest: "90s", notes: "Lying, both legs then unilateral" },
          { name: "Standing Calf Raise", sets: 2, reps: "12", rest: "60s" },
        ],
      },
      {
        day: "Thursday",
        name: "Back — Blood and Guts",
        exercises: [
          { name: "Pull-Up", sets: 1, reps: "8-10", rest: "90s", notes: "Warm-up sets, then failure" },
          { name: "Barbell Row", sets: 1, reps: "6-8", rest: "2min", notes: "315+ lb, Dorian's signature" },
          { name: "Seated Cable Row", sets: 1, reps: "8-10", rest: "90s" },
          { name: "Lat Pulldown", sets: 1, reps: "8-10", rest: "90s", notes: "Underhand grip" },
          { name: "Deadlift", sets: 1, reps: "6", rest: "3min", notes: "HEAVY — 400+ lb, back builder" },
        ],
      },
      {
        day: "Saturday",
        name: "Shoulders & Triceps",
        exercises: [
          { name: "Machine Shoulder Press", sets: 1, reps: "8-10", rest: "90s", notes: "Prefer machine for safety" },
          { name: "Dumbbell Lateral Raise", sets: 1, reps: "10-12", rest: "60s" },
          { name: "Rear Delt Fly", sets: 1, reps: "10-12", rest: "60s" },
          { name: "Skull Crusher", sets: 1, reps: "8-10", rest: "90s", notes: "2 warm-up, 1 working set" },
          { name: "Triceps Pushdown", sets: 1, reps: "10-12", rest: "60s" },
          { name: "Close-Grip Bench Press", sets: 1, reps: "8-10", rest: "90s" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    id: "greg-doucette",
    name: "Greg Doucette",
    title: "IFBB Pro · Hypertrophy Coach",
    emoji: "📊",
    category: "Science-Based",
    difficulty: "Intermediate",
    split: "Push / Pull / Legs (6-Day)",
    daysPerWeek: 6,
    quote: "Train harder than last time. Progressive overload isn't optional — it's mandatory for growth.",
    accentColor: "#f97316",
    program: [
      {
        day: "Monday",
        name: "Push 1 — Chest Focus",
        exercises: [
          { name: "Bench Press", sets: 4, reps: "8-12", rest: "90s" },
          { name: "Incline Dumbbell Press", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Pec Deck / Chest Fly", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Overhead Press", sets: 4, reps: "8-10", rest: "90s" },
          { name: "Dumbbell Lateral Raise", sets: 4, reps: "15-20", rest: "45s" },
          { name: "Triceps Pushdown", sets: 4, reps: "12-15", rest: "60s" },
        ],
      },
      {
        day: "Tuesday",
        name: "Pull 1 — Back Width",
        exercises: [
          { name: "Barbell Row", sets: 4, reps: "8-10", rest: "90s" },
          { name: "Lat Pulldown", sets: 4, reps: "10-12", rest: "60s" },
          { name: "Seated Cable Row", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Face Pull", sets: 3, reps: "15-20", rest: "45s" },
          { name: "Barbell Curl", sets: 3, reps: "10-12", rest: "60s" },
          { name: "Hammer Curl", sets: 3, reps: "10-12", rest: "45s" },
        ],
      },
      {
        day: "Wednesday",
        name: "Legs 1 — Quad Dominant",
        exercises: [
          { name: "Back Squat", sets: 4, reps: "8-10", rest: "2min" },
          { name: "Romanian Deadlift", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Leg Extension", sets: 3, reps: "15-20", rest: "60s" },
          { name: "Leg Curl", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Standing Calf Raise", sets: 4, reps: "15-20", rest: "45s" },
        ],
      },
      {
        day: "Thursday",
        name: "Push 2 — Shoulder Focus",
        exercises: [
          { name: "Dumbbell Shoulder Press", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Cable Lateral Raise", sets: 4, reps: "15-20", rest: "45s" },
          { name: "Arnold Press", sets: 3, reps: "10-12", rest: "60s" },
          { name: "Incline Dumbbell Press", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Pec Deck / Chest Fly", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Rope Pushdown", sets: 3, reps: "15-20", rest: "45s" },
        ],
      },
      {
        day: "Friday",
        name: "Pull 2 — Back Thickness",
        exercises: [
          { name: "Pull-Up", sets: 4, reps: "8-10", rest: "90s" },
          { name: "T-Bar Row", sets: 4, reps: "8-10", rest: "90s" },
          { name: "Straight-Arm Pulldown", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Single-Arm Cable Row", sets: 3, reps: "12-15", rest: "60s" },
          { name: "EZ-Bar Curl", sets: 3, reps: "10-12", rest: "60s" },
          { name: "Concentration Curl", sets: 3, reps: "12-15", rest: "45s" },
        ],
      },
      {
        day: "Saturday",
        name: "Legs 2 — Ham & Glute",
        exercises: [
          { name: "Romanian Deadlift", sets: 4, reps: "8-12", rest: "90s" },
          { name: "Leg Curl", sets: 4, reps: "12-15", rest: "60s" },
          { name: "Leg Press", sets: 4, reps: "10-15", rest: "90s", notes: "High foot placement" },
          { name: "Hack Squat", sets: 3, reps: "10-12", rest: "90s" },
          { name: "Leg Extension", sets: 3, reps: "15-20", rest: "60s" },
          { name: "Seated Calf Raise", sets: 4, reps: "12-15", rest: "45s" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    id: "cbum-evolved",
    name: "CBum Evolved",
    title: "Chris Bumstead's Competition Prep Program",
    emoji: "🌊",
    category: "Classic",
    difficulty: "Advanced",
    split: "5-Day Bodypart Split",
    daysPerWeek: 5,
    quote: "The evolved program is about mastering mind-muscle connection and bringing the detail to stage.",
    accentColor: "#0ea5e9",
    program: [
      {
        day: "Monday",
        name: "Back — Width & Thickness",
        exercises: [
          { name: "Pull-Up", sets: 5, reps: "8-12", rest: "90s", notes: "Wide grip, dead hang to chin over bar" },
          { name: "Barbell Row", sets: 4, reps: "8-10", rest: "90s" },
          { name: "Chest-Supported Row", sets: 4, reps: "10-12", rest: "60s" },
          { name: "Lat Pulldown", sets: 4, reps: "10-15", rest: "60s" },
          { name: "Straight-Arm Pulldown", sets: 3, reps: "12-15", rest: "45s" },
          { name: "Face Pull", sets: 3, reps: "15-20", rest: "45s" },
        ],
      },
      {
        day: "Tuesday",
        name: "Chest — Thickness & Upper Tie-In",
        exercises: [
          { name: "Incline Barbell Press", sets: 5, reps: "6-10", rest: "2min", notes: "CBum's weak point focus" },
          { name: "Incline Dumbbell Press", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Bench Press", sets: 4, reps: "8-12", rest: "90s" },
          { name: "High Cable Fly", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Pec Deck / Chest Fly", sets: 3, reps: "15-20", rest: "45s" },
        ],
      },
      {
        day: "Wednesday",
        name: "Shoulders & Arms",
        exercises: [
          { name: "Dumbbell Shoulder Press", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Cable Lateral Raise", sets: 5, reps: "15-20", rest: "45s", notes: "Side cable for constant tension" },
          { name: "Rear Delt Fly", sets: 4, reps: "15-20", rest: "45s" },
          { name: "EZ-Bar Curl", sets: 4, reps: "10-12", rest: "60s" },
          { name: "Incline Dumbbell Curl", sets: 3, reps: "12-15", rest: "45s" },
          { name: "Rope Pushdown", sets: 4, reps: "12-15", rest: "60s" },
          { name: "Overhead Triceps Extension", sets: 3, reps: "12-15", rest: "60s" },
        ],
      },
      {
        day: "Thursday",
        name: "Legs — Quad Focus",
        exercises: [
          { name: "Hack Squat", sets: 5, reps: "8-12", rest: "2min", notes: "Close stance, full ROM" },
          { name: "Leg Extension", sets: 4, reps: "15-20", rest: "60s", notes: "Slow eccentric" },
          { name: "Leg Press", sets: 4, reps: "10-15", rest: "90s" },
          { name: "Romanian Deadlift", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Leg Curl", sets: 4, reps: "12-15", rest: "60s" },
          { name: "Seated Calf Raise", sets: 5, reps: "15-20", rest: "45s" },
        ],
      },
      {
        day: "Friday",
        name: "Legs — Hamstring & Glute",
        exercises: [
          { name: "Romanian Deadlift", sets: 5, reps: "8-10", rest: "2min", notes: "Heaviest lift of the week" },
          { name: "Leg Curl", sets: 5, reps: "10-15", rest: "60s" },
          { name: "Bulgarian Split Squat", sets: 4, reps: "10-12", rest: "90s" },
          { name: "Hip Thrust", sets: 4, reps: "12-15", rest: "90s" },
          { name: "Walking Lunge", sets: 3, reps: "12-15", rest: "60s" },
          { name: "Standing Calf Raise", sets: 4, reps: "15-20", rest: "45s" },
        ],
      },
    ],
  },
];

export const CATEGORIES = ["All", "Bodybuilding", "Classic", "Science-Based", "Powerbuilding", "HIT"] as const;
export type Category = typeof CATEGORIES[number];
