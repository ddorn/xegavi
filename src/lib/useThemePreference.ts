"use client";
import { useTheme } from "next-themes";

export type ThemePreference = "light" | "dark";

export function useThemePreference(): ThemePreference {
	const { theme, resolvedTheme } = useTheme();
	const t = (theme ?? resolvedTheme ?? "light");
	return t === "dark" ? "dark" : "light";
}