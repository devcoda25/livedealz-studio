"use client";

import * as React from "react";

export type AppTheme = "light" | "dark";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children?: React.ReactNode;
  defaultTheme?: AppTheme | string;
  enableSystem?: boolean;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
  [key: string]: unknown;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  enableSystem = false,
  storageKey = "livedealz-theme",
  disableTransitionOnChange = true,
}: ThemeProviderProps) {
  const initial: AppTheme = defaultTheme === "dark" ? "dark" : "light";
  const [theme, setThemeState] = React.useState<AppTheme>(initial);

  // Load stored preference after mount.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
      return;
    }
    if (enableSystem) {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
      setThemeState(prefersDark ? "dark" : "light");
    }
  }, [enableSystem, storageKey]);

  // Apply theme class to <html>.
  React.useLayoutEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    if (disableTransitionOnChange) {
      root.classList.add("[&_*]:!transition-none");
      window.setTimeout(() => root.classList.remove("[&_*]:!transition-none"), 0);
    }

    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // ignore
    }
  }, [disableTransitionOnChange, storageKey, theme]);

  const setTheme = React.useCallback((next: AppTheme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = React.useMemo<ThemeContextValue>(() => ({ theme, setTheme, toggleTheme }), [setTheme, theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}
