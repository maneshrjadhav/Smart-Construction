// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// UNIFIED ROLE-AWARE & LOCALIZED SIDEBAR (ADMIN, ENGINEER, WORKER)
// ======================================================================

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { isAdmin, isEngineer } from "../utils/permissions";

export default function Sidebar({ isMobileOpen, onCloseMobile }) {
  const { currentUser, logout } = useAuth();
  const { t, isMarathi } = useLanguage();
  const navigate = useNavigate();

  const userIsAdmin = isAdmin(currentUser);
  const userIsEngineer = isEngineer(currentUser);
  const userIsWorker = (currentUser?.role || "").toLowerCase() === "worker";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <div
        className={`sidebar-backdrop ${isMobileOpen ? "active" : ""}`}
        onClick={onCloseMobile}
      ></div>

      <aside className={`app-sidebar ${isMobileOpen ? "sidebar-open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sc-logo-badge">
            <i className="bi bi-buildings"></i>
          </div>
          <div className="sidebar-brand-text">
            <strong>{t("brandName", "SmartBuild")}</strong>
            <small>
              {userIsWorker
                ? (isMarathi ? "कामगार पोर्टल" : "Worker Portal")
                : userIsEngineer
                ? (isMarathi ? "अभियंता कन्सोल" : "Engineer Console")
                : (isMarathi ? "प्रशासक कन्सोल" : "Enterprise ERP")}
            </small>
          </div>
        </div>

        {/* =========================================================
            1. ADMINISTRATOR MENU
        ========================================================= */}
        {userIsAdmin && (
          <>
            <div className="sidebar-category">{isMarathi ? "मुख्य मेनू" : "Portfolio"}</div>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-grid-1x2-fill"></i>
              <span>{t("navDashboard", "Dashboard")}</span>
            </NavLink>

            <NavLink
              to="/projects"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-buildings"></i>
              <span>{t("navProjects", "Projects")}</span>
            </NavLink>

            <NavLink
              to="/workforce"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-people"></i>
              <span>{t("navWorkforce", "Workforce")}</span>
            </NavLink>

            <NavLink
              to="/tasks"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-check2-square"></i>
              <span>{t("navTasks", "Tasks")}</span>
            </NavLink>

            <NavLink
              to="/attendance"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-calendar-check"></i>
              <span>{t("navAttendance", "Attendance")}</span>
            </NavLink>

            <NavLink
              to="/engineer-attendance"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-person-check-fill"></i>
              <span>{isMarathi ? "अभियंता उपस्थिती" : "Engineer Attendance"}</span>
            </NavLink>

            <div className="sidebar-category">{isMarathi ? "कामकाज व सामग्री" : "Operations"}</div>
            <NavLink
              to="/payroll"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-wallet2"></i>
              <span>{t("navPayroll", "Payroll & Wages")}</span>
            </NavLink>

            <NavLink
              to="/materials"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-box-seam"></i>
              <span>{t("navMaterials", "Materials")}</span>
            </NavLink>

            <div className="sidebar-category">{isMarathi ? "निरीक्षण व अहवाल" : "Monitoring"}</div>
            <NavLink
              to="/issues"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-exclamation-octagon"></i>
              <span>{t("navIssues", "Site Issues")}</span>
            </NavLink>

            <NavLink
              to="/progress"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-graph-up-arrow"></i>
              <span>{t("navProgress", "Daily Progress")}</span>
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-file-earmark-bar-graph"></i>
              <span>{t("navReports", "Reports")}</span>
            </NavLink>
          </>
        )}

        {/* =========================================================
            2. SITE ENGINEER MENU
        ========================================================= */}
        {userIsEngineer && (
          <>
            <div className="sidebar-category">{isMarathi ? "साइट कामकाज" : "Site Operations"}</div>
            <NavLink
              to="/engineer-dashboard"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-speedometer2"></i>
              <span>{t("navDashboard", "Dashboard")}</span>
            </NavLink>

            <NavLink
              to="/engineer/project"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-buildings"></i>
              <span>{isMarathi ? "माझा प्रकल्प" : "My Project"}</span>
            </NavLink>

            <NavLink
              to="/engineer/workforce"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-people"></i>
              <span>{t("navWorkforce", "Workforce")}</span>
            </NavLink>

            <NavLink
              to="/engineer/tasks"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-check2-square"></i>
              <span>{t("navTasks", "Tasks")}</span>
            </NavLink>

            <NavLink
              to="/engineer/attendance"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-calendar-check"></i>
              <span>{t("navAttendance", "Attendance")}</span>
            </NavLink>

            <div className="sidebar-category">{isMarathi ? "नोंदवही व अहवाल" : "Site Logs"}</div>
            <NavLink
              to="/engineer/materials"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-box-seam"></i>
              <span>{t("navMaterials", "Materials")}</span>
            </NavLink>

            <NavLink
              to="/engineer/issues"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-exclamation-octagon"></i>
              <span>{t("navIssues", "Site Issues")}</span>
            </NavLink>

            <NavLink
              to="/engineer/progress"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-graph-up-arrow"></i>
              <span>{t("navProgress", "Daily Progress")}</span>
            </NavLink>

            <NavLink
              to="/engineer/reports"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-file-earmark-bar-graph"></i>
              <span>{t("navReports", "Reports")}</span>
            </NavLink>
          </>
        )}

        {/* =========================================================
            3. WORKER PORTAL MENU
        ========================================================= */}
        {userIsWorker && (
          <>
            <div className="sidebar-category">{t("myWorkspace", isMarathi ? "माझे कार्यक्षेत्र" : "My Workspace")}</div>
            <NavLink
              to="/worker-dashboard"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-speedometer2"></i>
              <span>{t("navMyDashboard", "My Dashboard")}</span>
            </NavLink>

            <NavLink
              to="/worker/profile"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-person-badge"></i>
              <span>{t("navMyProfile", "My Profile")}</span>
            </NavLink>

            <NavLink
              to="/worker/attendance"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-calendar2-check"></i>
              <span>{t("navMyAttendance", "My Attendance")}</span>
            </NavLink>

            <NavLink
              to="/worker/payments"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-cash-stack"></i>
              <span>{t("navMyPayments", "My Payments & Vouchers")}</span>
            </NavLink>

            <NavLink
              to="/worker/work-history"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-check2-square"></i>
              <span>{t("navMyWork", "My Work & Tasks")}</span>
            </NavLink>

            <NavLink
              to="/worker/documents"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-folder2-open"></i>
              <span>{t("navMyDocuments", "My Documents")}</span>
            </NavLink>

            <div className="sidebar-category">{t("mySite", isMarathi ? "माझी साइट" : "My Site")}</div>
            <NavLink
              to="/worker/project"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-buildings"></i>
              <span>{t("navMyProject", "My Project")}</span>
            </NavLink>

            <NavLink
              to="/worker/engineer"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-person-gear"></i>
              <span>{t("navMyEngineer", "My Engineer")}</span>
            </NavLink>

            <NavLink
              to="/worker/notifications"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <i className="bi bi-bell"></i>
              <span>{t("navNotifications", "Notifications")}</span>
            </NavLink>
          </>
        )}

        {/* =========================================================
            SYSTEM / SETTINGS
        ========================================================= */}
        <div className="sidebar-category">{isMarathi ? "प्रणाली" : "System"}</div>
        <NavLink
          to={userIsWorker ? "/worker/account-settings" : userIsEngineer ? "/engineer/account-settings" : "/account-settings"}
          className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
          onClick={onCloseMobile}
        >
          <i className="bi bi-gear"></i>
          <span>{t("navSettings", "Account Settings")}</span>
        </NavLink>

        <button
          type="button"
          className="sidebar-nav-item text-danger text-start bg-transparent border-0 w-100 mt-auto"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right text-danger"></i>
          <span>{t("navLogout", "Sign Out")}</span>
        </button>
      </aside>
    </>
  );
}
