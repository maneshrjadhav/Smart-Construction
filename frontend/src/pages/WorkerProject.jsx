// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER ASSIGNED PROJECT & SITE PAGE
// ======================================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatDate } from "../utils/dateFormatter";

export default function WorkerProject() {
  const { t, isMarathi } = useLanguage();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    async function loadProject() {
      setLoading(true);
      try {
        const res = await api.get("/workers/me/project");
        if (res.data.success) {
          setProject(res.data.project || null);
        } else {
          toastError(t("error", "Error"), res.data.error || "Failed to load project details.");
        }
      } catch (err) {
        console.error("Project fetch error:", err);
        toastError(t("error", "Error"), err.response?.data?.error || "Could not load assigned project details.");
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [t, toastError]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-semibold">{t("loading", "Loading project site dossier...")}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center" style={{ background: "var(--bg-card)" }}>
        <i className="bi bi-building-slash fs-1 text-muted mb-3 d-block"></i>
        <h4 className="fw-bold" style={{ color: "var(--text-navy)" }}>
          {isMarathi ? "कोणताही प्रकल्प नेमलेला नाही" : "No Active Project Assignment"}
        </h4>
        <p className="text-muted">
          {isMarathi
            ? "तुम्ही सध्या कोणत्याही सक्रिय साइटवर नेमलेले नाही आहात. अधिक माहितीसाठी आपल्या साइट अभियंत्याशी संपर्क साधा."
            : "You are currently not assigned to an active construction site. Please contact your site engineer or administrator."}
        </p>
        <div>
          <Link to="/worker-dashboard" className="btn btn-primary rounded-pill px-4">
            {isMarathi ? "डॅशबोर्डवर परत जा" : "Back to Dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.max(0, Number(project.progress || 0)));

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div
        className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)" }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative" style={{ zIndex: 1 }}>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <i className="bi bi-buildings-fill fs-3 text-warning"></i>
              <h2 className="h4 fw-bold mb-0 text-white">{project.name}</h2>
              {project.project_code && (
                <span className="badge bg-warning text-dark fw-bold px-3 py-1.5 rounded-pill">
                  {project.project_code}
                </span>
              )}
              <span className="badge bg-success px-3 py-1.5 rounded-pill">
                {project.status || "Active"}
              </span>
            </div>
            <p className="text-white-50 mb-0 small">
              <i className="bi bi-geo-alt-fill text-danger me-1"></i>
              {project.location || "Site Location"}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/worker-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-arrow-left me-1"></i> {isMarathi ? "डॅशबोर्ड" : "Dashboard"}
            </Link>
          </div>
        </div>
      </div>

      {/* Progress & Timeline Cards */}
      <div className="row g-4">
        {/* Project Completion Progress */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-graph-up-arrow fs-5 text-primary"></i>
                <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                  {isMarathi ? "बांधकाम प्रगती (Progress)" : "Site Construction Progress"}
                </h5>
              </div>
              <span className="fs-5 fw-bold text-primary">{progressPercent}%</span>
            </div>

            <p className="text-muted small mb-3">
              {isMarathi
                ? "या साइटचे एकूण बांधकाम काम पूर्णत्वाची स्थिती."
                : "Real-time site construction completion status tracked by engineering team."}
            </p>

            <div className="progress rounded-pill mb-3" style={{ height: "18px" }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                role="progressbar"
                style={{ width: `${progressPercent}%` }}
                aria-valuenow={progressPercent}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {progressPercent}%
              </div>
            </div>

            <div className="d-flex justify-content-between text-muted small">
              <span>{isMarathi ? "सुरुवात: ०%" : "Start: 0%"}</span>
              <span>{isMarathi ? "लक्ष्य: १००%" : "Target: 100%"}</span>
            </div>
          </div>
        </div>

        {/* Project Timeline & Dates */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-calendar3-range fs-5 text-info"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "प्रकल्प कालावधी व तारखा" : "Project Timeline & Schedule"}
              </h5>
            </div>
            <div className="row g-3">
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "सुरुवात तारीख" : "Start Date"}</small>
                <div className="fw-bold text-primary fs-6">{formatDate(project.start_date)}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "अपेक्षित पूर्णता तारीख" : "Completion Target"}</small>
                <div className="fw-bold text-success fs-6">{formatDate(project.completion_date)}</div>
              </div>
              <div className="col-12">
                <small className="text-muted d-block">{isMarathi ? "साइट स्थिती" : "Site Phase / Status"}</small>
                <div className="badge bg-primary-subtle text-primary px-3 py-1.5 fs-6 mt-1">
                  {project.status || "Active Construction"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Worker's Role on this Site */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-person-badge fs-5 text-warning"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "या साइटवर तुमची भूमिका" : "Your Role on this Site"}
              </h5>
            </div>
            <div className="row g-3">
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "नेमलेला ट्रेड / कार्य" : "Assigned Trade"}</small>
                <div className="fw-bold text-dark fs-6">{project.workerTrade || "Artisan"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "कामाचे क्षेत्र" : "Deployment Area"}</small>
                <div className="fw-semibold text-primary">{project.workerArea || "Main Site Ground"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "शिफ्ट वेळ" : "Work Shift"}</small>
                <div className="fw-semibold text-dark">{project.workerShift || "General Shift (9 AM - 6 PM)"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "हजेरी नोंद" : "Daily Attendance Check"}</small>
                <Link to="/worker/attendance" className="btn btn-outline-primary btn-sm rounded-pill mt-1">
                  {isMarathi ? "हजेरी पाहा" : "View Attendance"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Supervising Engineer Contact Card */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-person-gear fs-5 text-success"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "साइट अभियंता (पर्यवेक्षक)" : "Supervising Site Engineer"}
              </h5>
            </div>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                style={{ width: "52px", height: "52px", background: "linear-gradient(135deg, #11998e, #38ef7d)" }}
              >
                {project.engineer_name ? project.engineer_name.charAt(0).toUpperCase() : "E"}
              </div>
              <div>
                <div className="fw-bold fs-6" style={{ color: "var(--text-navy)" }}>
                  {project.engineer_name || "Assigned Site Engineer"}
                </div>
                {project.engineer_code && (
                  <span className="badge bg-secondary-subtle text-secondary small">
                    {project.engineer_code}
                  </span>
                )}
              </div>
            </div>

            <div className="row g-2 small text-muted">
              <div className="col-sm-6">
                <i className="bi bi-telephone-fill text-success me-1"></i>
                {project.engineer_phone ? (
                  <a href={`tel:${project.engineer_phone}`} className="text-decoration-none fw-semibold">
                    {project.engineer_phone}
                  </a>
                ) : (
                  "Contact on site"
                )}
              </div>
              <div className="col-sm-6">
                <i className="bi bi-envelope-fill text-primary me-1"></i>
                {project.engineer_email || "engineer@smartbuild.local"}
              </div>
              <div className="col-12 mt-2">
                <Link to="/worker/engineer" className="btn btn-outline-success btn-sm rounded-pill px-3">
                  <i className="bi bi-person-lines-fill me-1"></i>
                  {isMarathi ? "अभियंत्याची हजेरी व माहिती पाहा" : "View Engineer Details & Status"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Site Safety Instructions Banner */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-shield-exclamation fs-5 text-danger"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "साइट सुरक्षा मार्गदर्शक तत्त्वे" : "Site Safety Protocols"}
              </h5>
            </div>
            <div className="row g-3 small">
              <div className="col-md-4">
                <div className="p-3 bg-light rounded-3 h-100">
                  <div className="fw-bold text-dark mb-1">
                    <i className="bi bi-cone-striped text-warning me-1"></i>
                    {isMarathi ? "सुरक्षा हेल्मेट व बूट" : "PPE Hard Hat & Steel-Toe Boots"}
                  </div>
                  <div className="text-muted">
                    {isMarathi
                      ? "साइटवर असताना नेहमी पिवळे/पांढरे हेल्मेट आणि सुरक्षा बूट घालणे बंधनकारक आहे."
                      : "Standard safety helmet and protective footwear are mandatory at all times on site."}
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded-3 h-100">
                  <div className="fw-bold text-dark mb-1">
                    <i className="bi bi-exclamation-triangle text-danger me-1"></i>
                    {isMarathi ? "उंच ठिकाणी काम करताना हार्नेस" : "Full Body Harness at Heights"}
                  </div>
                  <div className="text-muted">
                    {isMarathi
                      ? "२ मीटरपेक्षा जास्त उंचीवर काम करताना सेफ्टी हार्नेस योग्य ठिकाणी बांधणे आवश्यक आहे."
                      : "Always secure safety harness to certified lifelines when working above 2 meters."}
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded-3 h-100">
                  <div className="fw-bold text-dark mb-1">
                    <i className="bi bi-bandaid text-success me-1"></i>
                    {isMarathi ? "तात्काळ प्रथमोपचार" : "Immediate First-Aid Reporting"}
                  </div>
                  <div className="text-muted">
                    {isMarathi
                      ? "कोणतीही किरकोळ दुखापत झाल्यास त्वरित साइट अभियंत्याला किंवा सुरक्षा अधिकाऱ्याला कळवा."
                      : "Report any near-misses or injuries immediately to your site engineer."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

