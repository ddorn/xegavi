import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark";

export function useThemePreference(): ThemePreference {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mql.addEventListener?.("change", handler);
    return () => {
      mql.removeEventListener?.("change", handler);
    };
  }, []);

  return theme;
}