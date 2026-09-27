// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// LANGUAGE CONTEXT (ENGLISH & MARATHI ONLY)
// ======================================================================

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);

const STORAGE_KEY = "smart_construction_language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "mr" || saved === "en") return saved;
    } catch (_) {}
    return "en";
  });

  const setLanguage = (lang) => {
    const validLang = lang === "mr" ? "mr" : "en";
    setLanguageState(validLang);
    try {
      localStorage.setItem(STORAGE_KEY, validLang);
      document.documentElement.setAttribute("lang", validLang);
    } catch (_) {}
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "mr" : "en");
  };

  useEffect(() => {
    try {
      document.documentElement.setAttribute("lang", language);
    } catch (_) {}
  }, [language]);

  /**
   * Translate key. Fallbacks to English, then provided fallback, then key name.
   */
  const t = (key, fallback = "") => {
    if (!key) return fallback;
    const currentDict = translations[language];
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback || key;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isMarathi: language === "mr",
    isEnglish: language === "en"
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

