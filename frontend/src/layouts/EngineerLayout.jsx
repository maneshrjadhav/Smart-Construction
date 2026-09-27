import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";

const ROUTE_TITLES = {
  "/engineer-dashboard": { title: "Engineer Dashboard", breadcrumb: "Site Console" },
  "/engineer/project": { title: "My Project Details", breadcrumb: "Site Operations / Project" },
  "/engineer/tasks": { title: "Assigned Tasks", breadcrumb: "Site Operations / Tasks" },
  "/engineer/workforce": { title: "Site Workforce", breadcrumb: "Site Operations / Workforce" },
  "/engineer/attendance": { title: "Worker Attendance", breadcrumb: "Site Operations / Attendance" },
  "/engineer/materials": { title: "Site Materials", breadcrumb: "Site Operations / Materials" },
  "/engineer/issues": { title: "Site Issues Log", breadcrumb: "Site Monitoring / Issues" },
  "/engineer/progress": { title: "Daily Progress Log", breadcrumb: "Site Monitoring / Progress" },
  "/engineer/reports": { title: "Site Reports", breadcrumb: "Site Monitoring / Reports" },
  "/engineer/account-settings": { title: "Account Settings", breadcrumb: "System / Profile" },
  "/account-settings": { title: "Account Settings", breadcrumb: "System / Profile" },
};

export default function EngineerLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const currentRouteMeta = ROUTE_TITLES[location.pathname] || {
    title: "Engineer Workspace",
    breadcrumb: "Site Console",
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

