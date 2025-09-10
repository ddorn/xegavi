// Nice names copied from scripts/export_barrace_csv.py (subset relevant for UI)
const NICE_NAME_MAP: Record<string, string> = {
  // Anthropic
  "claude-3-5-sonnet-20241022": "Sonnet 3.5",
  "claude-3-7-sonnet-20250219": "Sonnet 3.7",
  "claude-opus-4-1-20250805": "Opus 4.1",
  "claude-opus-4-20250514": "Opus 4",
  "claude-sonnet-4-20250514": "Sonnet 4",
  // DeepSeek
  "deepseek-chat": "DeepSeek chat",
  "deepseek-reasoner": "DeepSeek reasoner",
  // Google
  "gemini-2.5-flash": "Gemini 2.5 flash",
  "gemini-2.5-pro": "Gemini 2.5 pro",
  // OpenAI
  "gpt-4.1": "GPT-4.1",
  "gpt-4o": "GPT-4o",
  "gpt-5": "GPT-5",
  "gpt-5-mini": "GPT-5 mini",
  "gpt-5-nano": "GPT-5 nano",
  "o3": "o3",
  "o4-mini": "o4 mini",
  // xAI
  "grok-3": "Grok 3",
  "grok-3-mini": "Grok 3 Mini",
  "grok-4-0709": "Grok 4",
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
  if (NICE_NAME_MAP[key]) return NICE_NAME_MAP[key];
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

// Map company to local logo in public/companieslogo
const COMPANY_LOGO_NAMES: Record<string, string | null> = {
  OpenAI: "openai",
  Anthropic: "anthropic",
  Google: "gemini", // using gemini icon for Google
  xAI: "xai",
  Meta: null,
  Mistral: null,
  Alibaba: null,
  DeepSeek: "deepseek",
  Reka: null,
  Cohere: null,
  Microsoft: null,
  Unknown: null,
};

export function modelColor(model: string): string {
  const company = inferCompany(model);
  return COMPANY_COLORS[company] ?? COMPANY_COLORS["Unknown"];
}

export function modelLogoName(model: string): string | null {
  const company = inferCompany(model);
  return COMPANY_LOGO_NAMES[company] ?? null;
}

export function deriveModelPresentation(model: string): { niceModel: string; company: string; color: string; logoName: string | null } {
  const company = inferCompany(model);
  const niceModel = niceModelName(model);
  const color = modelColor(model);
  const logoName = modelLogoName(model);
  return { niceModel, company, color, logoName };
}