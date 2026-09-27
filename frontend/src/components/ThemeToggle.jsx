// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// THEME TOGGLE BUTTON COMPONENT
// ======================================================================

import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "", compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-sm d-flex align-items-center gap-2 border shadow-sm rounded-pill px-2.5 py-1.5 ${className}`}
      style={{
        background: "var(--bg-card, #ffffff)",
        color: "var(--text-primary, #0f172a)",
        borderColor: "var(--border-color, #e2e8f0)",
        fontSize: "0.825rem",
        fontWeight: 600,
        transition: "all 0.25s ease"
      }}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle visual theme"
    >
      {isDark ? (
        <>
          <i className="bi bi-sun-fill text-warning" style={{ fontSize: "0.95rem" }}></i>
          {!compact && <span>Light</span>}
        </>
      ) : (
        <>
          <i className="bi bi-moon-stars-fill text-primary" style={{ fontSize: "0.95rem" }}></i>
          {!compact && <span>Dark</span>}
        </>
      )}
    </button>
  );
}

