// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// TOP NAVBAR WITH THEME TOGGLE, I18N SELECTOR & PROFILE
// ======================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";

export default function TopNavbar({ title, breadcrumb = "Management Console", onToggleMobile }) {
  const { currentUser } = useAuth();
  const { t, isMarathi } = useLanguage();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = currentUser?.name || "User";
  const roleRaw = (currentUser?.role || "Administrator").toLowerCase();
  
  let roleLabel = t("adminRole", "Administrator");
  if (roleRaw === "engineer") roleLabel = t("engineerRole", "Site Engineer");
  if (roleRaw === "worker") roleLabel = t("workerRole", "Worker");

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSettingsClick = () => {
    if (roleRaw === "worker") {
      navigate("/worker/account-settings");
    } else if (roleRaw === "engineer") {
      navigate("/engineer/account-settings");
    } else {
      navigate("/account-settings");
    }
  };

  return (
    <header className="app-topbar d-flex align-items-center justify-content-between px-3 px-md-4">
      <div className="topbar-left d-flex align-items-center gap-3">
        <button
          type="button"
          className="mobile-toggle-btn btn btn-sm border-0 d-lg-none"
          onClick={onToggleMobile}
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-4"></i>
        </button>
        <div>
          <div className="page-breadcrumb text-muted small" style={{ fontSize: "0.78rem" }}>
            {breadcrumb}
          </div>
          <h1 className="page-heading-title m-0 fw-bold" style={{ fontSize: "1.25rem", color: "var(--text-navy)" }}>
            {title}
          </h1>
        </div>
      </div>

      <div className="topbar-right d-flex align-items-center gap-2.5">
        {/* Global Language Selector */}
        <LanguageSelector compact={true} />

        {/* Global Light / Dark Theme Toggle */}
        <ThemeToggle compact={true} />

        {/* Notification Bell */}
        <div className="dropdown position-relative">
          <button
            type="button"
            className="notification-bell-btn btn btn-sm rounded-circle d-flex align-items-center justify-content-center border"
            style={{
              width: "38px",
              height: "38px",
              background: "var(--bg-card, #ffffff)",
              borderColor: "var(--border-color, #e2e8f0)",
              color: "var(--text-navy, #0f172a)"
            }}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <i className="bi bi-bell"></i>
            <span
              className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
              style={{ width: "8px", height: "8px" }}
            ></span>
          </button>

          {showNotifications && (
            <div
              className="dropdown-menu dropdown-menu-end show position-absolute mt-2 p-0 shadow-lg border rounded-3"
              style={{
                width: "320px",
                right: 0,
                zIndex: 1050,
                background: "var(--bg-card, #ffffff)",
                borderColor: "var(--border-color, #e2e8f0)"
              }}
            >
              <div
                className="p-3 border-bottom d-flex justify-content-between align-items-center"
                style={{ background: "var(--bg-alt, #edf3f7)" }}
              >
                <strong style={{ fontSize: "13px", color: "var(--text-navy)" }}>
                  {isMarathi ? "साइट सूचना व संदेश" : "Site Notifications"}
                </strong>
                <span className="badge bg-primary rounded-pill">3 {isMarathi ? "नवीन" : "New"}</span>
              </div>
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                <div className="p-2.5 px-3 border-bottom small">
                  <div className="fw-bold" style={{ color: "var(--text-navy)" }}>
                    {isMarathi ? "दैनिक प्रगती अहवाल सादर" : "Daily Progress Submitted"}
                  </div>
                  <div className="text-muted" style={{ fontSize: "11px" }}>
                    {isMarathi ? "पाया कॉंक्रिट काम आज पूर्ण" : "Foundation concrete pour verified today"}
                  </div>
                </div>
                <div className="p-2.5 px-3 border-bottom small">
                  <div className="fw-bold" style={{ color: "var(--text-navy)" }}>
                    {isMarathi ? "सामग्री साठा अलर्ट" : "Material Restock Alert"}
                  </div>
                  <div className="text-muted" style={{ fontSize: "11px" }}>
                    {isMarathi ? "स्टील १६ मिमी किमान मर्यादेवर" : "TMT Steel 16mm reached minimum threshold"}
                  </div>
                </div>
                <div className="p-2.5 px-3 small">
                  <div className="fw-bold" style={{ color: "var(--text-navy)" }}>
                    {isMarathi ? "टास्क वाटप अपडेट" : "Task Priority Update"}
                  </div>
                  <div className="text-muted" style={{ fontSize: "11px" }}>
                    {isMarathi ? "इलेक्ट्रिकल कामे टॉवर बी ला सुरू" : "Electrical rough-in assigned for Tower B"}
                  </div>
                </div>
              </div>
              <div className="p-2 text-center border-top">
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none p-0 small"
                  style={{ color: "var(--color-primary, #0fa8c4)" }}
                  onClick={() => setShowNotifications(false)}
                >
                  {t("close", "Close")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card / Pill */}
        <div
          className="topbar-profile d-flex align-items-center gap-2 p-1.5 pe-2.5 rounded-pill border cursor-pointer"
          style={{
            background: "var(--bg-card, #ffffff)",
            borderColor: "var(--border-color, #e2e8f0)",
            cursor: "pointer"
          }}
          onClick={handleSettingsClick}
          title={t("navSettings", "Account Settings")}
        >
          <div
            className="profile-avatar-circle d-flex align-items-center justify-content-center rounded-circle fw-bold text-white"
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #0FA8C4, #082B3A)",
              fontSize: "0.8rem"
            }}
          >
            {initials}
          </div>
          <div className="profile-info d-none d-sm-block text-start" style={{ lineHeight: 1.2 }}>
            <div className="fw-bold small text-truncate" style={{ maxWidth: "120px", color: "var(--text-navy)" }}>
              {displayName}
            </div>
            <div className="text-muted" style={{ fontSize: "0.72rem" }}>
              {roleLabel}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
