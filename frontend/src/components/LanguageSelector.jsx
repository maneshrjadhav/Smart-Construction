// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// LANGUAGE SELECTOR COMPONENT (ENGLISH & MARATHI ONLY)
// ======================================================================

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSelector({ className = "", compact = false }) {
  const { language, setLanguage, isMarathi } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`position-relative d-inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn btn-sm d-flex align-items-center gap-2 border shadow-sm px-2.5 py-1.5 rounded-pill"
        style={{
          background: "var(--bg-card, #ffffff)",
          color: "var(--text-primary, #0f172a)",
          borderColor: "var(--border-color, #e2e8f0)",
          fontSize: "0.825rem",
          fontWeight: 600,
          transition: "all 0.2s ease"
        }}
        title="Switch Language / भाषा निवडा"
      >
        <span className="d-flex align-items-center justify-content-center text-primary" style={{ fontSize: "0.95rem" }}>
          🌐
        </span>
        <span>{isMarathi ? "मराठी" : "English"}</span>
        <i
          className={`bi bi-chevron-down ms-1 transition-transform ${open ? "rotate-180" : ""}`}
          style={{
            fontSize: "0.7rem",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s"
          }}
        ></i>
      </button>

      {open && (
        <div
          className="position-absolute end-0 mt-1.5 py-1 rounded-3 shadow-lg border"
          style={{
            minWidth: "140px",
            background: "var(--bg-card, #ffffff)",
            borderColor: "var(--border-color, #e2e8f0)",
            zIndex: 1050,
            backdropFilter: "blur(8px)"
          }}
        >
          <button
            type="button"
            onClick={() => {
              setLanguage("en");
              setOpen(false);
            }}
            className={`dropdown-item d-flex align-items-center justify-content-between px-3 py-2 text-start w-100 ${
              language === "en" ? "fw-bold text-primary" : ""
            }`}
            style={{
              fontSize: "0.85rem",
              background: language === "en" ? "var(--border-light, #f1f5f9)" : "transparent",
              color: language === "en" ? "var(--color-primary, #2563eb)" : "var(--text-primary, #0f172a)"
            }}
          >
            <span className="d-flex align-items-center gap-2">
              <span className="badge rounded-pill bg-light text-dark border">EN</span>
              English
            </span>
            {language === "en" && <i className="bi bi-check2 text-primary fw-bold"></i>}
          </button>

          <button
            type="button"
            onClick={() => {
              setLanguage("mr");
              setOpen(false);
            }}
            className={`dropdown-item d-flex align-items-center justify-content-between px-3 py-2 text-start w-100 ${
              language === "mr" ? "fw-bold text-primary" : ""
            }`}
            style={{
              fontSize: "0.85rem",
              background: language === "mr" ? "var(--border-light, #f1f5f9)" : "transparent",
              color: language === "mr" ? "var(--color-primary, #2563eb)" : "var(--text-primary, #0f172a)"
            }}
          >
            <span className="d-flex align-items-center gap-2">
              <span className="badge rounded-pill bg-light text-dark border">म</span>
              मराठी
            </span>
            {language === "mr" && <i className="bi bi-check2 text-primary fw-bold"></i>}
          </button>
        </div>
      )}
    </div>
  );
}

