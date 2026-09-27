// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// APPLICATION ROOT & ROUTING ARCHITECTURE
// ======================================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import EngineerLayout from "./layouts/EngineerLayout";
import WorkerLayout from "./layouts/WorkerLayout";
import AuthLayout from "./layouts/AuthLayout";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import MFA from "./pages/MFA";
import MFASetup from "./pages/MFASetup";
import AdminDashboard from "./pages/AdminDashboard";
import EngineerDashboard from "./pages/EngineerDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import Projects from "./pages/Projects";
import Workforce from "./pages/Workforce";
import Tasks from "./pages/Tasks";
import Attendance from "./pages/Attendance";
import Payroll from "./pages/Payroll";
import Materials from "./pages/Materials";
import SiteIssues from "./pages/SiteIssues";
import DailyProgress from "./pages/DailyProgress";
import Reports from "./pages/Reports";
import AccountSettings from "./pages/AccountSettings";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";
import SecureAccount from "./pages/SecureAccount";
import WorkerProfileDashboard from "./pages/WorkerProfileDashboard";
import EngineerAttendance from "./pages/EngineerAttendance";
import WorkerProfile from "./pages/WorkerProfile";
import WorkerAttendance from "./pages/WorkerAttendance";
import WorkerPayments from "./pages/WorkerPayments";
import WorkerWorkTasks from "./pages/WorkerWorkTasks";
import WorkerDocuments from "./pages/WorkerDocuments";
import WorkerProject from "./pages/WorkerProject";
import WorkerEngineer from "./pages/WorkerEngineer";
import WorkerNotifications from "./pages/WorkerNotifications";

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                {/* Public Authentication & SaaS Landing */}
                <Route element={<AuthLayout />}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/mfa" element={<MFA />} />
                  <Route path="/mfa/setup" element={<MFASetup />} />
                </Route>

                {/* Mandatory First-Login Password Change for Engineers & Workers */}
                <Route
                  path="/secure-account"
                  element={
                    <ProtectedRoute allowedRoles={["Engineer", "Worker"]}>
                      <SecureAccount />
                    </ProtectedRoute>
                  }
                />

                {/* Access Denied (403) */}
                <Route path="/403" element={<AccessDenied />} />

                {/* =========================================================
                    1. ADMINISTRATOR CONSOLE
                ========================================================= */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["Administrator", "Admin"]}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                </Route>

                <Route
                  element={
                    <ProtectedRoute allowedRoles={["Administrator", "Admin"]}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/workforce" element={<Workforce />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/engineer-attendance" element={<EngineerAttendance />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/materials" element={<Materials />} />
                  <Route path="/issues" element={<SiteIssues />} />
                  <Route path="/progress" element={<DailyProgress />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/account-settings" element={<AccountSettings />} />
                  <Route path="/worker-profile/:id?" element={<WorkerProfileDashboard />} />
                </Route>

                {/* =========================================================
                    2. SITE ENGINEER CONSOLE
                ========================================================= */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["Engineer"]}>
                      <EngineerLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/engineer-dashboard" element={<EngineerDashboard />} />
                  <Route path="/engineer/project" element={<Projects />} />
                  <Route path="/engineer/workforce" element={<Workforce />} />
                  <Route path="/engineer/worker-profile/:id?" element={<WorkerProfileDashboard />} />
                  <Route path="/engineer/tasks" element={<Tasks />} />
                  <Route path="/engineer/attendance" element={<Attendance />} />
                  <Route path="/engineer/materials" element={<Materials />} />
                  <Route path="/engineer/issues" element={<SiteIssues />} />
                  <Route path="/engineer/progress" element={<DailyProgress />} />
                  <Route path="/engineer/reports" element={<Reports />} />
                  <Route path="/engineer/account-settings" element={<AccountSettings />} />
                </Route>

                {/* =========================================================
                    3. WORKER SELF-SERVICE PORTAL
                ========================================================= */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["Worker"]}>
                      <WorkerLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/worker-dashboard" element={<WorkerDashboard />} />
                  <Route path="/worker/profile" element={<WorkerProfile />} />
                  <Route path="/worker/attendance" element={<WorkerAttendance />} />
                  <Route path="/worker/payments" element={<WorkerPayments />} />
                  <Route path="/worker/work-history" element={<WorkerWorkTasks />} />
                  <Route path="/worker/documents" element={<WorkerDocuments />} />
                  <Route path="/worker/project" element={<WorkerProject />} />
                  <Route path="/worker/engineer" element={<WorkerEngineer />} />
                  <Route path="/worker/notifications" element={<WorkerNotifications />} />
                  <Route path="/worker/account-settings" element={<AccountSettings />} />
                </Route>

                {/* 404 Catch-All Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
