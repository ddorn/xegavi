"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	// Delay rendering until the client mounts to avoid SSR/CSR theme mismatch
	// (next-themes resolves on the client) and to prevent a brief wrong icon flash.
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return null;

	const isDark = theme === "dark";
	return (
		<button
			type="button"
			onClick={() => setTheme(isDark ? "light" : "dark")}
			className="button inline-flex items-center gap-2"
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			title={isDark ? "Light" : "Dark"}
		>
			<img src={isDark ? "/sun.svg" : "/moon.svg"} alt="" className="h-5 w-5 dark:invert" />
		</button>
	);
}