const axios = require("axios");
const OpenAI = require("openai");

async function generateWithOllama({ prompt, model }) {
  const m = model || process.env.OLLAMA_MODEL || "mistral";
  const url = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
  const resp = await axios.post(url, {
    model: m,
    prompt,
    stream: false,
  }, { timeout: 60000 });
  // ollama returns { response }
  return (resp.data && (resp.data.response || resp.data.output || "")).toString().trim();
}

async function generateWithOpenAI({ prompt, model }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const client = new OpenAI({ apiKey });
  const m = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const completion = await client.chat.completions.create({
    model: m,
    messages: [
      { role: "system", content: "Return ONLY a plain-text indented folder/file tree. 2 spaces per level. No markdown, no explanations." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });
  const text = completion.choices?.[0]?.message?.content || "";
  return text.trim();
}

async function generateStructure({ prompt, provider, model }) {
  const p = (provider || process.env.AI_PROVIDER || "ollama").toLowerCase();
  if (p === "openai") return generateWithOpenAI({ prompt, model });
  return generateWithOllama({ prompt, model });
}

module.exports = { generateStructure };
