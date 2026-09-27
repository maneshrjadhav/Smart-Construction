import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";

const ROUTE_TITLES = {
  "/dashboard": { title: "Administrator Dashboard", breadcrumb: "Management Console" },
  "/projects": { title: "Projects Management", breadcrumb: "Operations / Projects" },
  "/workforce": { title: "Workforce & Engineers", breadcrumb: "Operations / Workforce" },
  "/tasks": { title: "Site Tasks & Assignments", breadcrumb: "Operations / Tasks" },
  "/attendance": { title: "Workforce Attendance", breadcrumb: "Operations / Attendance" },
  "/payroll": { title: "Payroll & Compensation", breadcrumb: "Operations / Payroll" },
  "/materials": { title: "Materials & Inventory", breadcrumb: "Operations / Materials" },
  "/issues": { title: "Site Issues & Safety", breadcrumb: "Monitoring / Issues" },
  "/progress": { title: "Daily Site Progress", breadcrumb: "Monitoring / Progress" },
  "/reports": { title: "Executive Analytics & Reports", breadcrumb: "Monitoring / Reports" },
  "/account-settings": { title: "Account Settings", breadcrumb: "System / Profile" },
};

export default function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const currentRouteMeta = ROUTE_TITLES[location.pathname] || {
    title: "Smart Construction Management",
    breadcrumb: "Console",
  };

  return (
    <div className="app-layout">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="app-main">
        <TopNavbar
          title={currentRouteMeta.title}
          breadcrumb={currentRouteMeta.breadcrumb}
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
        />

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

