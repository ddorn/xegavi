// Nice names copied from scripts/export_barrace_csv.py (subset relevant for UI)
const MODEL_METADATA: Record<string, { niceName: string; color: string; }> = {
  // Anthropic
  "claude-3-5-sonnet-20241022": { niceName: "Sonnet 3.5", color: "#D1866A" },
  "claude-3-7-sonnet-20250219": { niceName: "Sonnet 3.7", color: "#E39981" },
  "claude-opus-4-1-20250805": { niceName: "Opus 4.1", color: "#E9AB9A" },
  "claude-opus-4-20250514": { niceName: "Opus 4", color: "#F0BCB1" },
  "claude-sonnet-4-20250514": { niceName: "Sonnet 4", color: "#F6CEC8" },
  // DeepSeek
  "deepseek-chat": { niceName: "DeepSeek chat", color: "#5A4CAD" },
  "deepseek-reasoner": { niceName: "DeepSeek reasoner", color: "#6A5ACD" },
  // Google
  "gemini-2.5-flash": { niceName: "Gemini 2.5 flash", color: "#3367D6" },
  "gemini-2.5-pro": { niceName: "Gemini 2.5 pro", color: "#4285F4" },
  // OpenAI
  "gpt-4.1": { niceName: "GPT-4.1", color: "#0D8A69" },
  "gpt-4o": { niceName: "GPT-4o", color: "#10A37F" },
  "gpt-5": { niceName: "GPT-5", color: "#13BC95" },
  "gpt-5-mini": { niceName: "GPT-5 mini", color: "#40C2A5" },
  "gpt-5-nano": { niceName: "GPT-5 nano", color: "#6DD0B9" },
  o3: { niceName: "o3", color: "#8EE0CE" },
  "o4-mini": { niceName: "o4 mini", color: "#B2EFE3" },
  // xAI
  "grok-3": { niceName: "Grok 3", color: "#1A1A1A" },
  "grok-3-mini": { niceName: "Grok 3 Mini", color: "#333333" },
  "grok-4-0709": { niceName: "Grok 4", color: "#000000" },
};

export function inferCompany(modelName: string): string {
  const m = modelName.toLowerCase();
  if (m.includes("gpt") || m.includes("openai") || /^o\d-?/.test(m)) return "OpenAI";
  if (m.includes("claude") || m.includes("anthropic")) return "Anthropic";
  if (m.includes("gemini") || m.includes("palm") || m.includes("bison") || m.includes("google")) return "Google";
  if (m.includes("grok") || m.includes("xai")) return "xAI";
  if (m.includes("llama") || m.includes("meta")) return "Meta";
  if (m.includes("mistral") || m.includes("mixtral")) return "Mistral";
  if (m.includes("qwen") || m.includes("ali")) return "Alibaba";
  if (m.includes("deepseek")) return "DeepSeek";
  if (m.includes("reka")) return "Reka";
  if (m.includes("cohere") || m.includes("command")) return "Cohere";
  if (m.includes("phi")) return "Microsoft";
  return "Unknown";
}

export function niceModelName(modelName: string): string {
  const key = modelName.trim().toLowerCase();
  if (MODEL_METADATA[key]) return MODEL_METADATA[key].niceName;
  return modelName;
}

export const COMPANY_COLORS: Record<string, string> = {
  OpenAI: "#10A37F",
  Anthropic: "#E39981",
  Google: "#4285F4",
  xAI: "#000000",
  Meta: "#0866FF",
  Mistral: "#FF6B00",
  Alibaba: "#FF6A00",
  DeepSeek: "#6A5ACD",
  Reka: "#6C63FF",
  Cohere: "#FF6F3D",
  Microsoft: "#737373",
  Unknown: "#888888",
};

export function modelColor(model: string): string {
  // I don't use the per-model colors, it doesn't have a nice unity.
  // Maybe it's just a matter of picking the right colors?
  // const key = model.trim().toLowerCase();
  // if (MODEL_METADATA[key]) return MODEL_METADATA[key].color;

  const company = inferCompany(model);
  return COMPANY_COLORS[company] ?? COMPANY_COLORS["Unknown"];
}

export function deriveModelPresentation(model: string): { niceModel: string; company: string; color: string; } {
  const company = inferCompany(model);
  const niceModel = niceModelName(model);
  const color = modelColor(model);
  return { niceModel, company, color };
}