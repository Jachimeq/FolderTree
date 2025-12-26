const OpenAI = require("openai");

const KEYWORDS = {
  Code: ["script", "manager", "controller", ".cs", ".js", ".ts", ".tsx", ".py", ".java", ".cpp", ".go", ".rs"],
  Graphics: ["button", "logo", "icon", "sprite", "canvas", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".psd", ".ai"],
  Audio: ["sound", "music", ".mp3", ".wav", ".flac", ".ogg", ".m4a"],
  Video: [".mp4", ".mov", ".mkv", ".avi", ".webm"],
  Documents: ["faktura", "podatek", "rachunek", "umowa", ".pdf", ".doc", ".docx", ".txt", ".md", ".xlsx", ".csv"],
  Game: ["boss", "arena", "enemy", "player", "level", "quest", "weapon", "shader", "unity", "unreal"],
  Archives: [".zip", ".rar", ".7z", ".tar", ".gz"]
};

function classifyLocal(title) {
  const t = String(title || "").toLowerCase();
  for (const [category, terms] of Object.entries(KEYWORDS)) {
    if (terms.some(term => t.includes(term))) {
      return { category, confidence: 0.7, source: "local" };
    }
  }
  return { category: "Uncategorized", confidence: 0.1, source: "local" };
}

async function classifyWithOpenAI(title) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return classifyLocal(title);

  const client = new OpenAI({ apiKey });

  const prompt = [
    "Zwróć WYŁĄCZNIE poprawny JSON bez markdown.",
    "Wybierz kategorię dla nazwy pliku/folderu.",
    "Dopuszczalne kategorie: Code, Graphics, Audio, Video, Documents, Game, Archives, Uncategorized.",
    "Zwróć pola: category (string), confidence (0..1).",
    `Nazwa: ${String(title || "")}`
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  });

  const content = completion.choices?.[0]?.message?.content || "{}";

  try {
    const json = JSON.parse(content);
    const category = String(json.category || "Uncategorized");
    const confidence = Number(json.confidence || 0);

    if (!["Code","Graphics","Audio","Video","Documents","Game","Archives","Uncategorized"].includes(category)) {
      return classifyLocal(title);
    }
    return {
      category,
      confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
      source: "openai"
    };
  } catch {
    // fallback if model didn't return strict JSON
    return classifyLocal(title);
  }
}

module.exports = { classifyLocal, classifyWithOpenAI };
