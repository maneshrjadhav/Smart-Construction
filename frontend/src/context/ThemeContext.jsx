// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// THEME CONTEXT (LIGHT & DARK SYSTEM)
// ======================================================================

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "smart_construction_theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch (_) {}
    return "light";
  });

  const setTheme = (newTheme) => {
    const validTheme = newTheme === "dark" ? "dark" : "light";
    setThemeState(validTheme);
    try {
      localStorage.setItem(STORAGE_KEY, validTheme);
      document.documentElement.setAttribute("data-theme", validTheme);
    } catch (_) {}
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
    } catch (_) {}
  }, [theme]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
    isLight: theme === "light"
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

