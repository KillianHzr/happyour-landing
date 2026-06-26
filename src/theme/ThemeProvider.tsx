"use client";

// Client-side theme state for the Light/Dark toggle.
//
// - Writes the active mode to <html data-theme="…"> so all CSS var()s re-theme.
// - Exposes the typed theme object (colors/shadows/spacing/…) for inline styles
//   and JS consumers (e.g. recharts) via useTheme().
// - Persists the choice to localStorage. The no-flash inline script in layout.tsx
//   applies the stored mode before first paint; this provider re-syncs on mount.

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { darkTheme, lightTheme, type Theme, type ThemeMode } from "./theme";

const STORAGE_KEY = "theme-mode";

interface ThemeContextValue {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const applyMode = (mode: ThemeMode) => {
  document.documentElement.setAttribute("data-theme", mode === "Light" ? "light" : "dark");
};

export function ThemeProvider({
  children,
  defaultMode = "Light",
}: {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);

  // Re-sync from the value the no-flash script already applied.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "Light" || stored === "Dark") setModeState(stored);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    applyMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, []);

  const toggle = useCallback(
    () => setMode(mode === "Dark" ? "Light" : "Dark"),
    [mode, setMode]
  );

  const theme = mode === "Light" ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider>");
  return ctx;
}

/** Inline script string for layout <head> to set data-theme before first paint. */
export const noFlashThemeScript = `(function(){try{var m=localStorage.getItem("${STORAGE_KEY}");document.documentElement.setAttribute("data-theme",m==="Dark"?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
