// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER PORTAL LAYOUT
// ======================================================================

import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { useLanguage } from "../context/LanguageContext";

const ROUTE_KEYS = {
  "/worker-dashboard": { titleKey: "navMyDashboard", defaultTitle: "Worker Dashboard", breadcrumb: "Worker Portal / Overview" },
  "/worker/profile": { titleKey: "navMyProfile", defaultTitle: "My Profile Dossier", breadcrumb: "Worker Portal / Profile" },
  "/worker/attendance": { titleKey: "navMyAttendance", defaultTitle: "My Attendance History", breadcrumb: "Worker Portal / Attendance" },
  "/worker/payments": { titleKey: "navMyPayments", defaultTitle: "My Payments & Vouchers", breadcrumb: "Worker Portal / Payments" },
  "/worker/work-history": { titleKey: "navMyWork", defaultTitle: "My Work & Assigned Tasks", breadcrumb: "Worker Portal / Work & Tasks" },
  "/worker/documents": { titleKey: "navMyDocuments", defaultTitle: "My Document Vault", breadcrumb: "Worker Portal / Documents" },
  "/worker/project": { titleKey: "navMyProject", defaultTitle: "My Assigned Project Site", breadcrumb: "Worker Portal / Project" },
  "/worker/engineer": { titleKey: "navMyEngineer", defaultTitle: "Supervising Site Engineer", breadcrumb: "Worker Portal / Engineer" },
  "/worker/notifications": { titleKey: "navNotifications", defaultTitle: "Notifications & System Alerts", breadcrumb: "Worker Portal / Notifications" },
  "/worker/account-settings": { titleKey: "navSettings", defaultTitle: "Account Settings", breadcrumb: "Worker Portal / Settings" },
};

export default function WorkerLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const meta = ROUTE_KEYS[location.pathname] || {
    titleKey: "navMyDashboard",
    defaultTitle: "Worker Console",
    breadcrumb: "Worker Portal"
  };

  const currentTitle = t(meta.titleKey, meta.defaultTitle);

  return (
    <div className="app-layout">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="app-main">
        <TopNavbar
          title={currentTitle}
          breadcrumb={meta.breadcrumb}
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
        />

        <main className="app-content p-3 p-md-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

