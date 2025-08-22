export const COMPANY_COLORS: Record<string, { light: string; dark: string }> = {
  OpenAI: { light: "#10A37F", dark: "#0B7D61" },
  Anthropic: { light: "#E39981", dark: "#E39981" },
  Google: { light: "#4285F4", dark: "#2E6BD8" },
  xAI: { light: "#000000", dark: "#111111" },
  Meta: { light: "#0866FF", dark: "#0750C9" },
  Mistral: { light: "#FF6B00", dark: "#CC5600" },
  Alibaba: { light: "#FF6A00", dark: "#CC5500" },
  DeepSeek: { light: "#6A5ACD", dark: "#5249A3" },
  Reka: { light: "#6C63FF", dark: "#4E49CC" },
  Cohere: { light: "#FF6F3D", dark: "#D7582F" },
  Microsoft: { light: "#737373", dark: "#595959" },
  Unknown: { light: "#888888", dark: "#666666" },
};

export function colorForCompany(company: string, theme: "light" | "dark"): string {
  const c = COMPANY_COLORS[company] ?? COMPANY_COLORS["Unknown"];
  return theme === "dark" ? c.dark : c.light;
}

export function pickTextColor(bgHex: string): string {
  const hex = bgHex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#141414" : "#fff";
}