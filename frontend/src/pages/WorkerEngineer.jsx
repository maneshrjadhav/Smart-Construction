// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER SUPERVISING SITE ENGINEER PAGE
// ======================================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatDate } from "../utils/dateFormatter";

export default function WorkerEngineer() {
  const { t, isMarathi } = useLanguage();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadEngineer() {
      setLoading(true);
      try {
        const res = await api.get("/workers/me/engineer");
        if (res.data.success) {
          setData(res.data);
        } else {
          toastError(t("error", "Error"), res.data.error || "Failed to load engineer details.");
        }
      } catch (err) {
        console.error("Engineer fetch error:", err);
        toastError(t("error", "Error"), err.response?.data?.error || "Could not load supervising engineer information.");
      } finally {
        setLoading(false);
      }
    }
    loadEngineer();
  }, [t, toastError]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-semibold">{t("loading", "Loading supervising engineer dossier...")}</div>
      </div>
    );
  }

  const engineer = data?.engineer || null;
  const todayStatus = data?.todayStatus || { status: "Not Marked" };
  const attendanceList = data?.attendance || [];

  if (!engineer) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center" style={{ background: "var(--bg-card)" }}>
        <i className="bi bi-person-x fs-1 text-muted mb-3 d-block"></i>
        <h4 className="fw-bold" style={{ color: "var(--text-navy)" }}>
          {isMarathi ? "कोणताही साइट अभियंता नेमलेला नाही" : "No Supervising Engineer Assigned"}
        </h4>
        <p className="text-muted">
          {isMarathi
            ? "तुमच्या प्रोफाइलला सध्या कोणताही साइट अभियंता जोडलेला नाही. कृपया प्रशासकाशी संपर्क साधा."
            : "No site engineer is currently assigned to supervise your site deployment."}
        </p>
        <div>
          <Link to="/worker-dashboard" className="btn btn-primary rounded-pill px-4">
            {isMarathi ? "डॅशबोर्डवर परत जा" : "Back to Dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div
        className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d324d 0%, #7f5a83 100%)" }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex align-items-center gap-3.5">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow border border-2 border-white"
              style={{
                width: "72px",
                height: "72px",
                fontSize: "1.8rem",
                background: "linear-gradient(135deg, #f39c12, #d35400)",
                color: "#ffffff"
              }}
            >
              {engineer.full_name ? engineer.full_name.charAt(0).toUpperCase() : "E"}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h2 className="h4 fw-bold mb-0 text-white">{engineer.full_name}</h2>
                <span className="badge bg-warning text-dark px-3 py-1.5 rounded-pill fw-bold">
                  {engineer.engineer_code || `ENG-${engineer.id}`}
                </span>
                <span className="badge bg-success px-3 py-1.5 rounded-pill">
                  {engineer.status || "Active"}
                </span>
              </div>
              <p className="text-white-50 mb-0 small">
                {isMarathi ? "पर्यवेक्षक अभियंता • साइट:" : "Supervising Site Engineer • Site:"}{" "}
                <strong className="text-white">{engineer.project_name || "Assigned Site"}</strong>
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/worker-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-arrow-left me-1"></i> {isMarathi ? "डॅशबोर्ड" : "Dashboard"}
            </Link>
          </div>
        </div>
      </div>

      {/* Engineer Status & Dossier Cards */}
      <div className="row g-4">
        {/* Today's Engineer Attendance Widget */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-calendar2-day fs-5 text-primary"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "आजची अभियंता उपस्थिती स्थिती" : "Today's Engineer Status"}
              </h5>
            </div>

            <div className="p-3.5 bg-light rounded-4 text-center mb-3">
              <small className="text-muted text-uppercase fw-bold d-block mb-1">
                {isMarathi ? "साइटवर उपस्थिती" : "On-Site Status"}
              </small>
              <div className="fs-4 fw-bold mb-1">
                {todayStatus.status === "Present" ? (
                  <span className="badge bg-success px-3 py-1.5">
                    <i className="bi bi-geo-alt-fill me-1"></i>
                    {isMarathi ? "साइटवर उपस्थित (Present)" : "On Site (Present)"}
                  </span>
                ) : todayStatus.status === "Half Day" ? (
                  <span className="badge bg-warning text-dark px-3 py-1.5">
                    {isMarathi ? "अर्धा दिवस (Half Day)" : "Half Day"}
                  </span>
                ) : (
                  <span className="badge bg-secondary px-3 py-1.5">
                    {isMarathi ? "नोंद नाही / गैरहजर" : "Not Marked Today"}
                  </span>
                )}
              </div>
              <small className="text-muted">
                {isMarathi ? "तारीख:" : "Date:"} {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
              </small>
            </div>

            <div className="row g-2 text-muted small">
              <div className="col-6">
                <div className="p-2.5 bg-light rounded-3 text-center">
                  <small className="d-block text-muted">{isMarathi ? "चेक-इन वेळ" : "Check-in"}</small>
                  <strong className="fs-6 text-dark">{todayStatus.check_in || "--:--"}</strong>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2.5 bg-light rounded-3 text-center">
                  <small className="d-block text-muted">{isMarathi ? "चेक-आउट वेळ" : "Check-out"}</small>
                  <strong className="fs-6 text-dark">{todayStatus.check_out || "--:--"}</strong>
                </div>
              </div>
            </div>

            {todayStatus.remarks && (
              <div className="mt-3 p-2.5 bg-light rounded-3 small text-muted fst-italic">
                "{todayStatus.remarks}"
              </div>
            )}
          </div>
        </div>

        {/* Engineer Contact & Details */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-person-vcard fs-5 text-success"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "अभियंता संपर्क व अधिकृत माहिती" : "Contact & Engineering Profile"}
              </h5>
            </div>

            <div className="row g-3">
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "पूर्ण नाव" : "Full Name"}</small>
                <div className="fw-bold fs-6" style={{ color: "var(--text-navy)" }}>{engineer.full_name}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "अभियंता आयडी" : "Engineer Code"}</small>
                <div className="fw-bold text-primary">{engineer.engineer_code || `ENG-${engineer.id}`}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "मोबाईल फोन" : "Mobile Phone"}</small>
                <div className="fw-semibold">
                  {engineer.phone ? (
                    <a href={`tel:${engineer.phone}`} className="text-success text-decoration-none fw-bold">
                      <i className="bi bi-telephone-fill me-1"></i> {engineer.phone}
                    </a>
                  ) : (
                    "--"
                  )}
                </div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "ईमेल पत्ता" : "Official Email"}</small>
                <div className="fw-semibold">
                  {engineer.email ? (
                    <a href={`mailto:${engineer.email}`} className="text-primary text-decoration-none">
                      <i className="bi bi-envelope-fill me-1"></i> {engineer.email}
                    </a>
                  ) : (
                    "--"
                  )}
                </div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "नेमलेली साइट" : "Assigned Construction Site"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>
                  {engineer.project_name || "Assigned Project"}
                </div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "शाखा / विशेषीकरण" : "Department / Specialization"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>
                  {engineer.specialization || "Civil & Structural Engineering"}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-top d-flex gap-2">
              {engineer.phone && (
                <a href={`tel:${engineer.phone}`} className="btn btn-success btn-sm rounded-pill px-3">
                  <i className="bi bi-telephone me-1"></i> {isMarathi ? "कॉल करा" : "Call Engineer"}
                </a>
              )}
              {engineer.email && (
                <a href={`mailto:${engineer.email}`} className="btn btn-outline-primary btn-sm rounded-pill px-3">
                  <i className="bi bi-envelope me-1"></i> {isMarathi ? "ईमेल पाठवा" : "Send Email"}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Engineer's Verified Site Attendance History */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-calendar-check fs-5 text-primary"></i>
                <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                  {isMarathi ? "अभियंत्याची साइट हजेरी नोंदवही (मागील ३० दिवस)" : "Engineer Verified Site Attendance Log (Last 30 Days)"}
                </h5>
              </div>
              <span className="badge bg-secondary-subtle text-secondary rounded-pill">
                {attendanceList.length} {isMarathi ? "नोंदी" : "logs"}
              </span>
            </div>

            {attendanceList.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-calendar-x fs-1 d-block mb-2 opacity-50"></i>
                {isMarathi ? "या अभियंत्याची हजेरी नोंद अद्याप उपलब्ध नाही." : "No engineer attendance logs recorded yet."}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{isMarathi ? "तारीख" : "Date"}</th>
                      <th>{isMarathi ? "हजेरी स्थिती" : "Status"}</th>
                      <th>{isMarathi ? "चेक-इन" : "Check In"}</th>
                      <th>{isMarathi ? "चेक-आउट" : "Check Out"}</th>
                      <th>{isMarathi ? "कामाचे तास" : "Hours"}</th>
                      <th>{isMarathi ? "साइट / प्रकल्प" : "Project Site"}</th>
                      <th>{isMarathi ? "शेरा" : "Remarks"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.map((ea) => {
                      let badge = <span className="badge bg-success px-2.5 py-1">Present</span>;
                      if (ea.status === "Half Day") badge = <span className="badge bg-warning text-dark px-2.5 py-1">Half Day</span>;
                      if (ea.status === "Absent") badge = <span className="badge bg-danger px-2.5 py-1">Absent</span>;

                      return (
                        <tr key={ea.id}>
                          <td className="fw-semibold" style={{ color: "var(--text-navy)" }}>
                            {formatDate(ea.date)}
                          </td>
                          <td>{badge}</td>
                          <td>{ea.check_in || "--:--"}</td>
                          <td>{ea.check_out || "--:--"}</td>
                          <td className="fw-bold">{ea.working_hours ? `${ea.working_hours} hrs` : "--"}</td>
                          <td>{ea.project_name || "Assigned Site"}</td>
                          <td className="text-muted small">{ea.remarks || "Site supervision verified"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

