import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS = [
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3-4b-it:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "nvidia/nemotron-nano-9b-v2:free",
];

type ChatMessage = { role: string; content: string };

function buildGenerateMessages(profile: {
  fitnessLevel: string;
  goal: string;
  days: string;
  equipment: string;
}): ChatMessage[] {
  return [
    {
      role: "system",
      content: "You are a fitness coach. Output ONLY raw JSON. No markdown, no code fences, no explanation.",
    },
    {
      role: "user",
      content: `Create a ${profile.days}-day workout plan. Level: ${profile.fitnessLevel}. Goal: ${profile.goal}. Equipment: ${profile.equipment}.

Respond with ONLY this JSON (no other text):
{"planName":"string","days":[{"day":"Monday","focus":"string","exercises":[{"name":"string","sets":3,"reps":"10-12","rest":"60s","notes":"string"}]}]}

Rules:
- Exactly ${profile.days} days spread Mon-Sun
- 4-5 exercises per day
- Keep notes under 8 words
- No trailing commas`,
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    let messages: ChatMessage[];

    if (type === "generate") {
      messages = buildGenerateMessages(body.profile);
    } else if (type === "chat") {
      messages = [
        {
          role: "system",
          content: `You are a professional fitness coach. The user has this workout plan:\n${body.planContext}\n\nHelp modify or answer questions about it. Be concise and specific. If suggesting exercise replacements, name specific exercises.`,
        },
        ...body.messages,
      ];
    } else if (type === "summary") {
      const { workout, previousWorkout } = body as {
        workout: { name: string; totalVolume: number; exercises: { name: string; sets: { weight: number; reps: number }[] }[] };
        previousWorkout: { name: string; totalVolume: number; exercises: { name: string; sets: { weight: number; reps: number }[] }[] } | null;
      };
      const fmt = (exs: { name: string; sets: { weight: number; reps: number }[] }[]) =>
        exs.map((e) => `${e.name}: ${e.sets.map((s) => `${s.weight}kg×${s.reps}`).join(", ")}`).join("\n");
      const userContent = previousWorkout
        ? `Today's workout (${workout.name}):\n${fmt(workout.exercises)}\nTotal volume: ${workout.totalVolume}kg\n\nPrevious similar workout (${previousWorkout.name}):\n${fmt(previousWorkout.exercises)}\nTotal volume: ${previousWorkout.totalVolume}kg\n\nAssess my performance vs last session and suggest what to focus on next.`
        : `First time doing this workout (${workout.name}):\n${fmt(workout.exercises)}\nTotal volume: ${workout.totalVolume}kg\n\nThis is my first session. Give brief feedback and what to focus on next.`;
      messages = [
        { role: "system", content: "You are a fitness coach. Be concise. Max 4 sentences." },
        { role: "user", content: userContent },
      ];
    } else {
      return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
    }

    let data: { choices?: { message?: { content?: string } }[] } | null = null;
    let lastError = "AI service error";

    for (const model of MODELS) {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://gymai-9edba.web.app",
          "X-Title": "GymAI",
        },
        body: JSON.stringify({ model, messages, max_tokens: 4096 }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`OpenRouter error (${model}):`, res.status, text);
        try { lastError = JSON.parse(text)?.error?.message ?? lastError; } catch { /* ignore */ }
        continue;
      }

      data = await res.json();
      break;
    }

    if (!data) {
      return NextResponse.json({ error: lastError }, { status: 503 });
    }

    const content: string = data.choices?.[0]?.message?.content ?? "";

    if (type === "generate") {
      // Strip markdown code fences that free models often add despite instructions
      // Strip all code fences (``` or ```json) anywhere in the string
      const stripped = content.replace(/```(?:json)?/gi, "").trim();

      // Find the outermost { ... } block
      const start = stripped.indexOf("{");
      const end = stripped.lastIndexOf("}");
      if (start === -1 || end <= start) {
        console.error("No JSON object found. Raw response:", content);
        return NextResponse.json({ error: "AI returned an unexpected format. Try again." }, { status: 500 });
      }

      let jsonStr = stripped.slice(start, end + 1);

      // Fix common AI mistakes before parsing
      jsonStr = jsonStr
        .replace(/,(\s*[}\]])/g, "$1")   // trailing commas
        .replace(/\/\/[^\n]*/g, "")       // single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, ""); // block comments

      try {
        const plan = JSON.parse(jsonStr);
        if (!plan.planName || !Array.isArray(plan.days) || plan.days.length === 0) {
          throw new Error("Missing required fields");
        }
        return NextResponse.json({ plan });
      } catch (e) {
        console.error("JSON parse failed:", e, "\nExtracted:", jsonStr.slice(0, 800));
        return NextResponse.json({ error: "Failed to parse plan. Try generating again." }, { status: 500 });
      }
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
