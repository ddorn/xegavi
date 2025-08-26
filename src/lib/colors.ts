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

// TODO: move this to a more appropriate place?
export const TOKEN_SCORE_MAX = 3;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function rgbToCss(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export function tokenScoreToColor(value: number, isDark: boolean): string {
  const RED: [number, number, number] = [220, 38, 38];      // red-600
  const NEUTRAL: [number, number, number] = isDark ? [31, 41, 55] : [243, 244, 246]; // gray-800 vs gray-100
  const GREEN: [number, number, number] = [22, 163, 74];     // green-600
  const v = clamp(value, -TOKEN_SCORE_MAX, TOKEN_SCORE_MAX);
  if (v >= 0) {
    const t = v / TOKEN_SCORE_MAX;
    return rgbToCss(
      lerp(NEUTRAL[0], GREEN[0], t),
      lerp(NEUTRAL[1], GREEN[1], t),
      lerp(NEUTRAL[2], GREEN[2], t)
    );
  } else {
    const t = (-v) / TOKEN_SCORE_MAX;
    return rgbToCss(
      lerp(NEUTRAL[0], RED[0], t),
      lerp(NEUTRAL[1], RED[1], t),
      lerp(NEUTRAL[2], RED[2], t)
    );
  }
}