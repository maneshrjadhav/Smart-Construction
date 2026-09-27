// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER ATTENDANCE HISTORY & CALENDAR PAGE
// ======================================================================

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatDate } from "../utils/dateFormatter";

export default function WorkerAttendance() {
  const { t, isMarathi } = useLanguage();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    async function loadAttendance() {
      setLoading(true);
      try {
        const res = await api.get("/workers/me/attendance");
        if (res.data.success) {
          setAttendance(res.data.attendance || []);
        } else {
          toastError(t("error", "Error"), res.data.error || "Failed to load attendance records.");
        }
      } catch (err) {
        console.error("Attendance fetch error:", err);
        toastError(t("error", "Error"), err.response?.data?.error || "Could not fetch attendance records.");
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, [t, toastError]);

  // Generate list of available months from current year
  const availableMonths = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      list.push({ val, label });
    }
    return list;
  }, []);

  // Filter records by selected month and status
  const monthRecords = useMemo(() => {
    return attendance.filter((a) => {
      const recordDate = String(a.date).split("T")[0];
      return recordDate.startsWith(selectedMonth);
    });
  }, [attendance, selectedMonth]);

  const filteredRecords = useMemo(() => {
    if (statusFilter === "ALL") return monthRecords;
    return monthRecords.filter((a) => a.status === statusFilter);
  }, [monthRecords, statusFilter]);

  // Calculate monthly metrics
  const daysPresent = monthRecords.filter((a) => a.status === "Present").length;
  const daysHalfDay = monthRecords.filter((a) => a.status === "Half Day").length;
  const daysAbsent = monthRecords.filter((a) => a.status === "Absent").length;
  const totalEffectiveDays = daysPresent + daysHalfDay * 0.5;
  const totalHoursWorked = monthRecords.reduce((acc, a) => acc + Number(a.working_hours || (a.status === "Present" ? 8 : a.status === "Half Day" ? 4 : 0)), 0);

  // Calendar Day Map for the selected month
  const calendarDays = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    const firstDayIndex = new Date(year, monthIndex, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const days = [];
    // Blank padding before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const record = monthRecords.find((r) => String(r.date).split("T")[0] === dateStr);
      const isSunday = new Date(year, monthIndex, d).getDay() === 0;
      const isFuture = dateStr > todayStr;

      days.push({
        dayNumber: d,
        dateStr,
        record,
        isSunday,
        isFuture,
        status: record ? record.status : isSunday ? "Holiday" : isFuture ? "Future" : "Not Marked",
      });
    }

    return days;
  }, [selectedMonth, monthRecords]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-semibold">{t("loading", "Loading attendance records...")}</div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div
        className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative" style={{ zIndex: 1 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-calendar2-check-fill fs-3"></i>
              <h2 className="h4 fw-bold mb-0 text-white">
                {isMarathi ? "माझी दैनंदिन हजेरी नोंदवही" : "My Attendance Dossier"}
              </h2>
            </div>
            <p className="text-white-50 mb-0 small">
              {isMarathi ? "साइटवर नोंदवलेली अधिकृत हजेरी व कामाचे तास" : "Official site attendance, working hours and monthly calendar"}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select
              className="form-select form-select-sm bg-white text-dark fw-bold border-0 shadow-sm rounded-pill px-3"
              style={{ width: "auto" }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map((m) => (
                <option key={m.val} value={m.val}>
                  {m.label}
                </option>
              ))}
            </select>

            <Link to="/worker-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-arrow-left me-1"></i> {isMarathi ? "डॅशबोर्ड" : "Dashboard"}
            </Link>
          </div>
        </div>
      </div>

      {/* Monthly KPI Cards */}
      <div className="row g-3">
        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-success" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "उपस्थित दिवस (Present)" : "Days Present"}
                </small>
                <div className="fs-3 fw-bold text-success">{daysPresent} {isMarathi ? "दिवस" : "Days"}</div>
              </div>
              <div className="rounded-circle p-2.5 bg-success-subtle text-success">
                <i className="bi bi-check-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-warning" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "अर्धा दिवस (Half Day)" : "Half Days"}
                </small>
                <div className="fs-3 fw-bold text-warning">{daysHalfDay} {isMarathi ? "दिवस" : "Days"}</div>
              </div>
              <div className="rounded-circle p-2.5 bg-warning-subtle text-warning">
                <i className="bi bi-circle-half fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-primary" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "एकूण कामाचे दिवस" : "Effective Work Days"}
                </small>
                <div className="fs-3 fw-bold text-primary">{totalEffectiveDays} {isMarathi ? "दिवस" : "Days"}</div>
              </div>
              <div className="rounded-circle p-2.5 bg-primary-subtle text-primary">
                <i className="bi bi-calendar-event fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-info" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "कामाचे एकूण तास" : "Total Work Hours"}
                </small>
                <div className="fs-3 fw-bold text-info">{totalHoursWorked.toFixed(1)} {isMarathi ? "तास" : "hrs"}</div>
              </div>
              <div className="rounded-circle p-2.5 bg-info-subtle text-info">
                <i className="bi bi-clock-history fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Monthly Calendar Grid */}
      <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "var(--bg-card)" }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-calendar3 fs-5 text-primary"></i>
            <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
              {isMarathi ? "मासिक कॅलेंडर दृश्य" : "Monthly Calendar Overview"}
            </h5>
          </div>
          {/* Legend */}
          <div className="d-flex align-items-center gap-3 small flex-wrap">
            <span className="d-flex align-items-center gap-1">
              <span className="badge bg-success p-1 rounded-circle"></span> {isMarathi ? "हजर" : "Present"}
            </span>
            <span className="d-flex align-items-center gap-1">
              <span className="badge bg-warning p-1 rounded-circle"></span> {isMarathi ? "अर्धा दिवस" : "Half Day"}
            </span>
            <span className="d-flex align-items-center gap-1">
              <span className="badge bg-danger p-1 rounded-circle"></span> {isMarathi ? "गैरहजर" : "Absent"}
            </span>
            <span className="d-flex align-items-center gap-1 text-muted">
              <span className="badge bg-secondary p-1 rounded-circle"></span> {isMarathi ? "सुट्टी / रविवार" : "Holiday / Sun"}
            </span>
          </div>
        </div>

        {/* Calendar Day Header */}
        <div className="row g-2 text-center text-muted fw-bold small mb-2">
          <div className="col text-danger">{isMarathi ? "रवि" : "Sun"}</div>
          <div className="col">{isMarathi ? "सोम" : "Mon"}</div>
          <div className="col">{isMarathi ? "मंगळ" : "Tue"}</div>
          <div className="col">{isMarathi ? "बुध" : "Wed"}</div>
          <div className="col">{isMarathi ? "गुरू" : "Thu"}</div>
          <div className="col">{isMarathi ? "शुक्र" : "Fri"}</div>
          <div className="col">{isMarathi ? "शनि" : "Sat"}</div>
        </div>

        {/* Calendar Grid */}
        <div className="row g-2">
          {calendarDays.map((cDay, idx) => {
            if (!cDay.dayNumber) {
              return <div key={`empty-${idx}`} className="col" style={{ minWidth: "13%" }}></div>;
            }

            let badgeClass = "bg-light text-muted border";
            let statusText = isMarathi ? "नोंद नाही" : "Not Marked";

            if (cDay.status === "Present") {
              badgeClass = "bg-success text-white";
              statusText = isMarathi ? "हजर" : "Present";
            } else if (cDay.status === "Half Day") {
              badgeClass = "bg-warning text-dark";
              statusText = isMarathi ? "अर्धा दिवस" : "Half Day";
            } else if (cDay.status === "Absent") {
              badgeClass = "bg-danger text-white";
              statusText = isMarathi ? "गैरहजर" : "Absent";
            } else if (cDay.isSunday) {
              badgeClass = "bg-secondary-subtle text-secondary";
              statusText = isMarathi ? "रविवार" : "Sunday";
            } else if (cDay.isFuture) {
              badgeClass = "bg-light text-muted opacity-50";
              statusText = "--";
            }

            return (
              <div key={`day-${cDay.dayNumber}`} className="col" style={{ minWidth: "13%" }}>
                <div
                  className={`p-2 rounded-3 text-center d-flex flex-column justify-content-between ${badgeClass}`}
                  style={{ minHeight: "74px" }}
                >
                  <span className="fw-bold fs-6">{cDay.dayNumber}</span>
                  <span className="small fw-semibold text-truncate" style={{ fontSize: "0.72rem" }}>
                    {statusText}
                  </span>
                  {cDay.record?.working_hours && (
                    <span className="small opacity-75" style={{ fontSize: "0.68rem" }}>
                      {cDay.record.working_hours}h
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filterable Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "var(--bg-card)" }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-list-check fs-5 text-success"></i>
            <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
              {isMarathi ? "तपशीलवार हजेरी नोंदवही" : "Attendance Log Details"}
            </h5>
            <span className="badge bg-secondary-subtle text-secondary rounded-pill">
              {filteredRecords.length} {isMarathi ? "नोंदी" : "records"}
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${statusFilter === "ALL" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setStatusFilter("ALL")}
              >
                {isMarathi ? "सर्व" : "All"}
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === "Present" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setStatusFilter("Present")}
              >
                {isMarathi ? "हजर" : "Present"}
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === "Half Day" ? "btn-warning" : "btn-outline-secondary"}`}
                onClick={() => setStatusFilter("Half Day")}
              >
                {isMarathi ? "अर्धा दिवस" : "Half Day"}
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === "Absent" ? "btn-danger" : "btn-outline-secondary"}`}
                onClick={() => setStatusFilter("Absent")}
              >
                {isMarathi ? "गैरहजर" : "Absent"}
              </button>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-calendar-x fs-1 d-block mb-2 opacity-50"></i>
            {isMarathi ? "या कालावधीत कोणतीही हजेरी नोंद आढळली नाही." : "No attendance records found for this period."}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>{isMarathi ? "तारीख" : "Date"}</th>
                  <th>{isMarathi ? "हजेरी स्थिती" : "Status"}</th>
                  <th>{isMarathi ? "कामाचे तास" : "Working Hours"}</th>
                  <th>{isMarathi ? "चेक-इन" : "Check In"}</th>
                  <th>{isMarathi ? "चेक-आउट" : "Check Out"}</th>
                  <th>{isMarathi ? "साइट / प्रकल्प" : "Site / Project"}</th>
                  <th>{isMarathi ? "शेरा / नोंदी" : "Supervisor Remarks"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((att) => {
                  let badge = <span className="badge bg-success px-2.5 py-1">Present</span>;
                  if (att.status === "Half Day") badge = <span className="badge bg-warning text-dark px-2.5 py-1">Half Day</span>;
                  if (att.status === "Absent") badge = <span className="badge bg-danger px-2.5 py-1">Absent</span>;

                  return (
                    <tr key={att.id}>
                      <td className="fw-semibold" style={{ color: "var(--text-navy)" }}>
                        {formatDate(att.date)}
                      </td>
                      <td>{badge}</td>
                      <td className="fw-bold">{att.working_hours ? `${att.working_hours} hrs` : "8.0 hrs"}</td>
                      <td>{att.check_in || "09:00 AM"}</td>
                      <td>{att.check_out || "06:00 PM"}</td>
                      <td>{att.project_name || "Assigned Project"}</td>
                      <td className="text-muted small">{att.remarks || "Normal shift verified"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

