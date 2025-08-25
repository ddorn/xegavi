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

export function colorForCompany(company: string): string {
  const c = COMPANY_COLORS[company] ?? COMPANY_COLORS["Unknown"];
  return c;
}

export function pickTextColor(bgHex: string): string {
  const hex = bgHex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#141414" : "#fff";
}