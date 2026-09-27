// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// EXECUTIVE WORKER DASHBOARD (SAAS HUB)
// ======================================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatCurrency } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateFormatter";

export default function WorkerDashboard() {
  const { currentUser } = useAuth();
  const { t, isMarathi } = useLanguage();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [workerData, setWorkerData] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [meRes, tasksRes] = await Promise.all([
          api.get("/workers/me"),
          api.get("/workers/me/tasks"),
        ]);

        if (meRes.data.success) {
          setWorkerData(meRes.data);
        } else {
          toastError(t("error", "Error"), meRes.data.error || "Failed to load dashboard data.");
        }

        if (tasksRes.data.success) {
          setTasks(tasksRes.data.tasks || []);
        }
      } catch (err) {
        console.error("Worker dashboard load error:", err);
        toastError(t("error", "Error"), err.response?.data?.error || "Could not load worker dashboard.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [t, toastError]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-semibold">{t("loading", "Loading your worker dashboard...")}</div>
      </div>
    );
  }

  const worker = workerData?.worker || {};
  const summary = workerData?.summary || {};
  const attendanceHistory = workerData?.attendanceHistory || [];
  const paymentHistory = workerData?.paymentHistory || [];
  const assignedEngineerAttendance = workerData?.assignedEngineerAttendance || [];

  const todayAtt = summary.todayAttendance || { status: "Not Marked" };

  // Calculate dynamic greeting based on time of day
  const hour = new Date().getHours();
  let greeting = isMarathi ? "शुभ सकाळ" : "Good Morning";
  if (hour >= 12 && hour < 17) {
    greeting = isMarathi ? "शुभ दुपार" : "Good Afternoon";
  } else if (hour >= 17) {
    greeting = isMarathi ? "शुभ संध्याकाळ" : "Good Evening";
  }

  // Engineer today attendance
  const todayStr = new Date().toISOString().split("T")[0];
  const engineerToday = assignedEngineerAttendance.find(
    (ea) => String(ea.date).split("T")[0] === todayStr
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* ---------------------------------------------------- */}
      {/* 1. WORKER HERO IDENTITY BANNER                       */}
      {/* ---------------------------------------------------- */}
      <div
        className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative"
        style={{
          background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        }}
      >
        <div className="p-4 p-md-4 text-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4 position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex align-items-center gap-3.5">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow border border-2 border-white"
              style={{
                width: "74px",
                height: "74px",
                fontSize: "2rem",
                background: "linear-gradient(135deg, #00c6ff, #0072ff)",
                color: "#ffffff",
              }}
            >
              {worker.name ? worker.name.charAt(0).toUpperCase() : "W"}
            </div>

            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <span className="text-white-50 small fw-semibold">
                  {greeting},
                </span>
                <h2 className="h4 fw-bold mb-0 text-white">
                  {worker.name || currentUser?.name || "Worker"} 👋
                </h2>
                <span className="badge bg-primary px-3 py-1.5 rounded-pill fw-semibold">
                  {worker.worker_code || currentUser?.workerId || "WRK-xxx"}
                </span>
                <span className="badge bg-success px-3 py-1.5 rounded-pill">
                  {worker.status || "Active"}
                </span>
              </div>
              <p className="text-white-50 mb-0 small">
                {isMarathi ? "व्यावसायिक ट्रेड:" : "Trade:"} <strong className="text-white">{worker.trade || worker.role || "Artisan"}</strong>
                {" • "}
                {isMarathi ? "साइट:" : "Site:"} <strong className="text-white">{worker.project_name || "Assigned Project"}</strong>
                {" • "}
                {isMarathi ? "साइट अभियंता:" : "Site Engineer:"} <strong className="text-white">{worker.engineer_name || "Supervising Engineer"}</strong>
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Link to="/worker/profile" className="btn btn-outline-light btn-sm rounded-pill px-3 py-1.5">
              <i className="bi bi-person-badge me-1"></i> {isMarathi ? "माझे प्रोफाइल" : "My Profile"}
            </Link>
            <Link to="/worker/notifications" className="btn btn-light btn-sm text-dark fw-semibold rounded-pill px-3 py-1.5 shadow-sm">
              <i className="bi bi-bell-fill text-warning me-1"></i> {isMarathi ? "सूचना" : "Notifications"}
            </Link>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. SIX EXECUTIVE KPI SUMMARY CARDS                   */}
      {/* ---------------------------------------------------- */}
      <div className="row g-3">
        {/* KPI 1: Today's Attendance */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-primary" style={{ background: "var(--bg-card)" }}>
            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
              {isMarathi ? "आजची हजेरी" : "Today's Status"}
            </small>
            <div className="fs-5 fw-bold mb-1">
              {todayAtt.status === "Present" ? (
                <span className="badge bg-success px-2.5 py-1">Present</span>
              ) : todayAtt.status === "Half Day" ? (
                <span className="badge bg-warning text-dark px-2.5 py-1">Half Day</span>
              ) : (
                <span className="badge bg-secondary px-2.5 py-1">{todayAtt.status || "Not Marked"}</span>
              )}
            </div>
            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
              {todayAtt.workArea || worker.work_area || "Site Main"}
            </small>
          </div>
        </div>

        {/* KPI 2: Daily Wage Rate */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-success" style={{ background: "var(--bg-card)" }}>
            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
              {isMarathi ? "दैनिक मजुरी दर" : "Daily Wage Rate"}
            </small>
            <div className="fs-5 fw-bold text-success mb-1">
              {formatCurrency(summary.dailyWage || worker.daily_wage)}
            </div>
            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
              {worker.wage_type || "Daily"} Basis
            </small>
          </div>
        </div>

        {/* KPI 3: Days Worked This Month */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-info" style={{ background: "var(--bg-card)" }}>
            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
              {isMarathi ? "चालू महिना हजेरी" : "Days This Month"}
            </small>
            <div className="fs-5 fw-bold text-info mb-1">
              {summary.effectiveDaysWorked || 0} {isMarathi ? "दिवस" : "Days"}
            </div>
            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
              {summary.daysPresent || 0}P • {summary.daysHalfDay || 0}HD
            </small>
          </div>
        </div>

        {/* KPI 4: Estimated Month Earnings */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-primary" style={{ background: "var(--bg-card)" }}>
            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
              {isMarathi ? "अंदाजित कमाई" : "Month Earnings"}
            </small>
            <div className="fs-5 fw-bold text-primary mb-1">
              {formatCurrency(summary.estimatedMonthEarnings || 0)}
            </div>
            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
              {isMarathi ? "चालू महिना" : "Current Month"}
            </small>
          </div>
        </div>

        {/* KPI 5: Total Paid to Date */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-success" style={{ background: "var(--bg-card)" }}>
            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
              {isMarathi ? "एकूण मिळालेले" : "Total Paid"}
            </small>
            <div className="fs-5 fw-bold text-success mb-1">
              {formatCurrency(summary.totalPaid || 0)}
            </div>
            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
              {paymentHistory.length} {isMarathi ? "व्हाउचर्स" : "receipts"}
            </small>
          </div>
        </div>

        {/* KPI 6: Pending Balance */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-warning" style={{ background: "var(--bg-card)" }}>
            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
              {isMarathi ? "येणे बाकी शिल्लक" : "Pending Balance"}
            </small>
            <div className="fs-5 fw-bold text-warning mb-1">
              {formatCurrency(summary.totalPending || 0)}
            </div>
            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
              {isMarathi ? "पुढील फेरीत देय" : "Payable Next"}
            </small>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. DUAL STATUS WIDGETS: TODAY ATTENDANCE + ENGINEER  */}
      {/* ---------------------------------------------------- */}
      <div className="row g-4">
        {/* Left: Worker's Today Attendance Widget */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-calendar-check-fill fs-5 text-primary"></i>
                <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                  {isMarathi ? "आजची माझी हजेरी स्थिती" : "Today's Attendance Status"}
                </h5>
              </div>
              <Link to="/worker/attendance" className="btn btn-outline-primary btn-sm rounded-pill px-3">
                {isMarathi ? "कॅलेंडर पहा" : "View Full Log"}
              </Link>
            </div>

            <div className="row g-3">
              <div className="col-sm-6">
                <div className="p-3 bg-light rounded-3">
                  <small className="text-muted d-block">{isMarathi ? "हजेरी नोंद" : "Attendance Recorded"}</small>
                  <div className="fw-bold fs-6">
                    {todayAtt.status === "Present" ? (
                      <span className="text-success"><i className="bi bi-check-circle-fill me-1"></i> Present</span>
                    ) : todayAtt.status === "Half Day" ? (
                      <span className="text-warning"><i className="bi bi-circle-half me-1"></i> Half Day</span>
                    ) : (
                      <span className="text-secondary"><i className="bi bi-clock-history me-1"></i> {todayAtt.status || "Not Marked"}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="p-3 bg-light rounded-3">
                  <small className="text-muted d-block">{isMarathi ? "कामाची शिफ्ट" : "Shift Schedule"}</small>
                  <div className="fw-bold fs-6 text-dark">
                    {todayAtt.shift || worker.shift || "General (9 AM - 6 PM)"}
                  </div>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="p-3 bg-light rounded-3">
                  <small className="text-muted d-block">{isMarathi ? "कार्य क्षेत्र" : "Assigned Work Area"}</small>
                  <div className="fw-bold fs-6 text-primary">
                    {todayAtt.workArea || worker.work_area || "Site Main Ground"}
                  </div>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="p-3 bg-light rounded-3">
                  <small className="text-muted d-block">{isMarathi ? "साइट अभियंता पडताळणी" : "Supervisor Verification"}</small>
                  <div className="fw-bold fs-6 text-success">
                    <i className="bi bi-shield-check me-1"></i> Verified by Site Eng.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Supervising Engineer Live Status Widget */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-gear fs-5 text-success"></i>
                <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                  {isMarathi ? "साइट अभियंता उपस्थिती स्थिती" : "Supervising Site Engineer"}
                </h5>
              </div>
              <Link to="/worker/engineer" className="btn btn-outline-success btn-sm rounded-pill px-3">
                {isMarathi ? "तपशील पहा" : "View Engineer"}
              </Link>
            </div>

            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm flex-shrink-0"
                style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #f39c12, #d35400)" }}
              >
                {worker.engineer_name ? worker.engineer_name.charAt(0).toUpperCase() : "E"}
              </div>
              <div className="flex-grow-1">
                <h6 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                  {worker.engineer_name || "Assigned Site Engineer"}
                </h6>
                <div className="small text-muted">
                  Code: <strong>{worker.engineer_code || "ENG-xxx"}</strong>
                  {" • "}
                  Site: <strong>{worker.project_name || "Assigned Site"}</strong>
                </div>
              </div>
            </div>

            <div className="p-3 bg-light rounded-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted">{isMarathi ? "आजची साइट उपस्थिती:" : "Today's Site Availability:"}</span>
                {engineerToday ? (
                  <span className="badge bg-success px-2.5 py-1">
                    <i className="bi bi-geo-alt-fill me-1"></i> Present on Site ({engineerToday.check_in || "Logged"})
                  </span>
                ) : (
                  <span className="badge bg-secondary-subtle text-secondary px-2.5 py-1">
                    Available On Site
                  </span>
                )}
              </div>
              {worker.engineer_phone && (
                <div className="small text-muted mt-2 pt-2 border-top">
                  <i className="bi bi-telephone-fill text-success me-1"></i>
                  Direct Contact: <a href={`tel:${worker.engineer_phone}`} className="text-decoration-none fw-semibold">{worker.engineer_phone}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. QUICK ACTION NAVIGATION TILES                     */}
      {/* ---------------------------------------------------- */}
      <div>
        <h5 className="fw-bold mb-3" style={{ color: "var(--text-navy)" }}>
          <i className="bi bi-grid-fill me-1 text-primary"></i>
          {isMarathi ? "त्वरित कृती व नेव्हिगेशन" : "Quick Action Console"}
        </h5>
        <div className="row g-3">
          <div className="col-xl-2 col-md-4 col-6">
            <Link to="/worker/attendance" className="text-decoration-none">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 text-center h-100 hover-elevate transition-all" style={{ background: "var(--bg-card)" }}>
                <div className="rounded-circle p-3 bg-success-subtle text-success mx-auto mb-2" style={{ width: "54px", height: "54px" }}>
                  <i className="bi bi-calendar2-check fs-4"></i>
                </div>
                <h6 className="fw-bold mb-1 text-dark small">{isMarathi ? "माझी हजेरी" : "My Attendance"}</h6>
                <small className="text-muted" style={{ fontSize: "0.72rem" }}>Monthly log & calendar</small>
              </div>
            </Link>
          </div>

          <div className="col-xl-2 col-md-4 col-6">
            <Link to="/worker/payments" className="text-decoration-none">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 text-center h-100 hover-elevate transition-all" style={{ background: "var(--bg-card)" }}>
                <div className="rounded-circle p-3 bg-primary-subtle text-primary mx-auto mb-2" style={{ width: "54px", height: "54px" }}>
                  <i className="bi bi-cash-stack fs-4"></i>
                </div>
                <h6 className="fw-bold mb-1 text-dark small">{isMarathi ? "पेमेंट व्हाउचर्स" : "My Payments"}</h6>
                <small className="text-muted" style={{ fontSize: "0.72rem" }}>Print vouchers & ledger</small>
              </div>
            </Link>
          </div>

          <div className="col-xl-2 col-md-4 col-6">
            <Link to="/worker/work-history" className="text-decoration-none">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 text-center h-100 hover-elevate transition-all" style={{ background: "var(--bg-card)" }}>
                <div className="rounded-circle p-3 bg-warning-subtle text-warning mx-auto mb-2" style={{ width: "54px", height: "54px" }}>
                  <i className="bi bi-check2-square fs-4"></i>
                </div>
                <h6 className="fw-bold mb-1 text-dark small">{isMarathi ? "कामे व टास्क" : "Work & Tasks"}</h6>
                <small className="text-muted" style={{ fontSize: "0.72rem" }}>Assigned operations</small>
              </div>
            </Link>
          </div>

          <div className="col-xl-2 col-md-4 col-6">
            <Link to="/worker/project" className="text-decoration-none">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 text-center h-100 hover-elevate transition-all" style={{ background: "var(--bg-card)" }}>
                <div className="rounded-circle p-3 bg-info-subtle text-info mx-auto mb-2" style={{ width: "54px", height: "54px" }}>
                  <i className="bi bi-buildings fs-4"></i>
                </div>
                <h6 className="fw-bold mb-1 text-dark small">{isMarathi ? "माझा प्रकल्प" : "My Project"}</h6>
                <small className="text-muted" style={{ fontSize: "0.72rem" }}>Site details & progress</small>
              </div>
            </Link>
          </div>

          <div className="col-xl-2 col-md-4 col-6">
            <Link to="/worker/documents" className="text-decoration-none">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 text-center h-100 hover-elevate transition-all" style={{ background: "var(--bg-card)" }}>
                <div className="rounded-circle p-3 bg-secondary-subtle text-secondary mx-auto mb-2" style={{ width: "54px", height: "54px" }}>
                  <i className="bi bi-folder2-open fs-4"></i>
                </div>
                <h6 className="fw-bold mb-1 text-dark small">{isMarathi ? "कागदपत्रे" : "Document Vault"}</h6>
                <small className="text-muted" style={{ fontSize: "0.72rem" }}>Certificates & proofs</small>
              </div>
            </Link>
          </div>

          <div className="col-xl-2 col-md-4 col-6">
            <Link to="/worker/engineer" className="text-decoration-none">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 text-center h-100 hover-elevate transition-all" style={{ background: "var(--bg-card)" }}>
                <div className="rounded-circle p-3 bg-danger-subtle text-danger mx-auto mb-2" style={{ width: "54px", height: "54px" }}>
                  <i className="bi bi-person-gear fs-4"></i>
                </div>
                <h6 className="fw-bold mb-1 text-dark small">{isMarathi ? "साइट अभियंता" : "My Engineer"}</h6>
                <small className="text-muted" style={{ fontSize: "0.72rem" }}>Supervision & contact</small>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5. BOTTOM SECTION: RECENT ACTIVITY & ASSIGNED TASKS  */}
      {/* ---------------------------------------------------- */}
      <div className="row g-4">
        {/* Left: Recent Payment Disbursements */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-receipt fs-5 text-success"></i>
                <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                  {isMarathi ? "अलीकडील पेमेंट व्हाउचर्स" : "Recent Payment Receipts"}
                </h5>
              </div>
              <Link to="/worker/payments" className="btn btn-outline-success btn-sm rounded-pill px-3">
                {isMarathi ? "सर्व पहा" : "View All"}
              </Link>
            </div>

            {paymentHistory.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-wallet2 fs-1 d-block mb-2 opacity-50"></i>
                {isMarathi ? "कोणतेही पेमेंट व्हाउचर्स उपलब्ध नाहीत." : "No payment vouchers recorded yet."}
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {paymentHistory.slice(0, 4).map((p) => (
                  <div key={p.id} className="p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-bold text-primary mb-0.5">{p.payment_code || `WPAY-${p.id}`}</div>
                      <small className="text-muted">
                        {formatDate(p.payment_date || p.created_at)} • {p.salary_period || "Recent"} • {p.payment_method || "Cash"}
                      </small>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-success fs-6">{formatCurrency(p.amount_paid)}</div>
                      <span className="badge bg-success-subtle text-success small">Paid</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Assigned Tasks Preview */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-card-checklist fs-5 text-primary"></i>
                <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                  {isMarathi ? "नेमलेली कामे व टास्क" : "Assigned Work Tasks"}
                </h5>
              </div>
              <Link to="/worker/work-history" className="btn btn-outline-primary btn-sm rounded-pill px-3">
                {isMarathi ? "सर्व पहा" : "View All"}
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-check2-circle fs-1 d-block mb-2 text-success opacity-50"></i>
                {isMarathi ? "सध्या कोणतीही प्रलंबित कामे नाहीत." : "No pending tasks assigned."}
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {tasks.slice(0, 4).map((tItem) => (
                  <div key={tItem.id} className="p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-bold text-dark mb-0.5">{tItem.task_name}</div>
                      <small className="text-muted">
                        Site: {tItem.project || "Assigned"} • Due: {formatDate(tItem.due_date)}
                      </small>
                    </div>
                    <div>
                      <span className={`badge ${tItem.status === "In Progress" ? "bg-warning text-dark" : tItem.status === "Completed" ? "bg-success" : "bg-secondary"}`}>
                        {tItem.status || "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
