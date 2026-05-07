const functions = require("firebase-functions");
const axios = require("axios");
require("dotenv").config();

exports.ai = functions.https.onRequest(async (req, res) => {
  // ✅ CORS FIX (IMPORTANT)
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  // ❌ Only allow POST
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  try {
    const { message } = req.body;

    // ❌ Safety check
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are a smart gym AI assistant. Give short, practical advice about workouts, diet, and supplements. Prefer Indian budget options."
          },
          {
            role: "user",
            content: message
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // ✅ Safe response handling
    const aiMessage =
      response.data?.choices?.[0]?.message?.content || "No response from AI";

    return res.status(200).json({
      content: aiMessage
    });

  } catch (err) {
    console.error("FULL ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      error: "AI failed",
      details: err.response?.data || err.message
    });
  }
});