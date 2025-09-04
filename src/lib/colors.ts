import chroma from "chroma-js";

export function pickTextColor(bgHex: string): string {
  const luminance = chroma(bgHex).luminance();
  return luminance > 0.6 ? "#141414" : "#fff";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const NEGATIVE = chroma("#dc2626"); // red-600
const NEUTRAL_ON_LIGHT_BACKGROUND = chroma("#f3f4f6"); // gray-100
const NEUTRAL_ON_DARK_BACKGROUND = chroma("#1f2937"); // gray-800
const POSITIVE = chroma("#16a34a"); // green-600

const DARK_SCALE = chroma.scale([NEGATIVE, NEUTRAL_ON_DARK_BACKGROUND, POSITIVE]);
const LIGHT_SCALE = chroma.scale([NEGATIVE, NEUTRAL_ON_LIGHT_BACKGROUND, POSITIVE]);

export function tokenScoreToColor(value: number, isDark: boolean, maxAbs: number): string {
  const limit = Math.max(0, maxAbs);
  if (limit === 0) {
    return isDark ? NEUTRAL_ON_DARK_BACKGROUND.css() : NEUTRAL_ON_LIGHT_BACKGROUND.css();
  }

  const scale = isDark ? DARK_SCALE : LIGHT_SCALE;
  // Map [-limit, limit] to [0, 1]
  const v = clamp(value, -limit, limit);
  const t = v / limit / 2 + 0.5;
  return scale(t).css();
}