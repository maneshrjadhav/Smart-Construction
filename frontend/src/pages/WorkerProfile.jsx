// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER PROFILE DOSSIER PAGE
// ======================================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatCurrency } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateFormatter";

export default function WorkerProfile() {
  const { currentUser } = useAuth();
  const { t, isMarathi } = useLanguage();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await api.get("/workers/me");
        if (res.data.success) {
          setProfile(res.data.worker || {});
        } else {
          toastError(t("error", "Error"), res.data.error || "Failed to load profile.");
        }
      } catch (err) {
        console.error("Fetch profile failed:", err);
        toastError(t("error", "Error"), err.response?.data?.error || "Could not load worker profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [t, toastError]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-semibold">{t("loading", "Loading worker dossier...")}</div>
      </div>
    );
  }

  const w = profile || {};

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div
        className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #09203f 0%, #1e3c72 100%)",
        }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex align-items-center gap-3.5">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow border border-2 border-white"
              style={{
                width: "76px",
                height: "76px",
                fontSize: "2rem",
                background: "linear-gradient(135deg, #00c6ff, #0072ff)",
                color: "#ffffff"
              }}
            >
              {w.name ? w.name.charAt(0).toUpperCase() : "W"}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h2 className="h4 fw-bold mb-0 text-white">{w.name || currentUser?.name || "Worker"}</h2>
                <span className="badge bg-primary px-3 py-1.5 rounded-pill fw-semibold">
                  {w.worker_code || currentUser?.workerId || "WRK-xxx"}
                </span>
                <span className="badge bg-success px-3 py-1.5 rounded-pill">
                  {w.status || "Active"}
                </span>
              </div>
              <p className="text-white-50 mb-0 small">
                {isMarathi ? "व्यावसायिक ट्रेड:" : "Trade:"} <strong className="text-white">{w.trade || w.role || "General Worker"}</strong>
                {" • "}
                {isMarathi ? "साइट:" : "Site:"} <strong className="text-white">{w.project_name || "Assigned Project"}</strong>
                {" • "}
                {isMarathi ? "पर्यवेक्षक:" : "Supervisor:"} <strong className="text-white">{w.engineer_name || "Site Engineer"}</strong>
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/worker-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-arrow-left me-1"></i> {isMarathi ? "डॅशबोर्डवर जा" : "Back to Dashboard"}
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div className="row g-4">
        {/* 1. Personal Details */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-person-lines-fill fs-5 text-primary"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "१. वैयक्तिक माहिती" : "1. Personal Information"}
              </h5>
            </div>
            <div className="row g-3">
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "पूर्ण नाव" : "Full Name"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.name || "--"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "कामगार आयडी" : "Worker Code"}</small>
                <div className="fw-bold text-primary">{w.worker_code || "--"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "मोबाईल नंबर" : "Mobile Phone"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>
                  <i className="bi bi-telephone text-success me-1"></i> {w.phone || "--"}
                </div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "पर्यायी मोबाईल" : "Alternate Phone"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.alternate_phone || "--"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "जन्म तारीख" : "Date of Birth"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{formatDate(w.dob)}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "लिंग / रक्तगट" : "Gender / Blood Group"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>
                  {w.gender || "Male"} • {w.blood_group || "N/A"}
                </div>
              </div>
              <div className="col-12">
                <small className="text-muted d-block">{isMarathi ? "कायमचा पत्ता" : "Permanent Address"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.address || "On Site"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Employment & Trade Details */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-tools fs-5 text-warning"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "२. व्यवसाय व नोकरी तपशील" : "2. Trade & Employment Details"}
              </h5>
            </div>
            <div className="row g-3">
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "कौशल्य वर्गवारी" : "Worker Classification"}</small>
                <div className="fw-semibold text-primary">{w.worker_type || "Skilled"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "ट्रेड / कौशल्य" : "Trade / Specialization"}</small>
                <div className="fw-bold" style={{ color: "var(--text-navy)" }}>{w.trade || w.role || "--"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "पदनाम" : "Designation"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.designation || w.trade || "Worker"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "नोकरी प्रकार" : "Employment Type"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.employment_type || "Daily Wage"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "सामील होण्याची तारीख" : "Joining Date"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{formatDate(w.joining_date)}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "कामाचा अनुभव" : "Experience"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.experience || "3+ Years"}</div>
              </div>
              <div className="col-12">
                <small className="text-muted d-block">{isMarathi ? "मागील नियोक्ता" : "Previous Employer"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.previous_employer || "Self / Freelance"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Site Assignment & Supervisor */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-buildings fs-5 text-info"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "३. बांधकाम साइट व अभियंता" : "3. Project & Supervising Engineer"}
              </h5>
            </div>
            <div className="row g-3">
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "नेमलेला प्रकल्प" : "Assigned Project"}</small>
                <div className="fw-bold text-primary">{w.project_name || "Unassigned"}</div>
                {w.project_code && <span className="badge bg-secondary-subtle text-secondary small">{w.project_code}</span>}
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "साइट लोकेशन" : "Site Location"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.project_location || "Headquarters"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "साइट अभियंता (पर्यवेक्षक)" : "Supervising Site Engineer"}</small>
                <div className="fw-bold text-success">{w.engineer_name || "Site Engineer"}</div>
                {w.engineer_code && <span className="badge bg-success-subtle text-success small">{w.engineer_code}</span>}
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "अभियंता संपर्क" : "Engineer Contact"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>
                  {w.engineer_phone ? <a href={`tel:${w.engineer_phone}`} className="text-decoration-none">{w.engineer_phone}</a> : "Contact on site"}
                </div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "कार्य क्षेत्र (Work Area)" : "Work Area"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.work_area || "General Site"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "शिफ्ट" : "Work Shift"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.shift || "General (09:00 - 18:00)"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Wage, Compensation & Bank Details */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-wallet2 fs-5 text-success"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "४. मजुरी दर व बँक तपशील" : "4. Wage & Payment Information"}
              </h5>
            </div>
            <div className="row g-3">
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "मजुरी दर (Daily Wage)" : "Daily Wage Rate"}</small>
                <div className="fs-5 fw-bold text-success">{formatCurrency(w.daily_wage)} / {isMarathi ? "दिवस" : "day"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "ओव्हरटाइम पात्रता" : "Overtime Eligibility"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>
                  {w.overtime_eligible ? (
                    <span className="badge bg-success-subtle text-success">
                      {isMarathi ? "पात्र" : "Eligible"} ({formatCurrency(w.overtime_rate)}/hr)
                    </span>
                  ) : (
                    <span className="badge bg-secondary-subtle text-secondary">
                      {isMarathi ? "अपात्र" : "Not Eligible"}
                    </span>
                  )}
                </div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "पसंतीचे पेमेंट माध्यम" : "Payment Method"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>
                  <span className="badge bg-info-subtle text-info px-2.5 py-1">{w.payment_method || "Cash"}</span>
                </div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "बँकेचे नाव" : "Bank Name"}</small>
                <div className="fw-semibold" style={{ color: "var(--text-navy)" }}>{w.bank_name || "Not Configured"}</div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "बँक खाते क्रमांक" : "Account Number"}</small>
                <div className="fw-semibold font-monospace" style={{ color: "var(--text-navy)" }}>
                  {w.account_number ? `•••• •••• ${String(w.account_number).slice(-4)}` : "--"}
                </div>
              </div>
              <div className="col-sm-6">
                <small className="text-muted d-block">{isMarathi ? "आयएफएससी / UPI" : "IFSC / UPI ID"}</small>
                <div className="fw-semibold font-monospace" style={{ color: "var(--text-navy)" }}>
                  {w.ifsc_code || w.upi_id || "--"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Emergency Contact Card */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-shield-plus fs-5 text-danger"></i>
              <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "५. आपत्कालीन संपर्क (Emergency Contact)" : "5. Emergency Contact"}
              </h5>
            </div>
            <div className="row g-3">
              <div className="col-sm-4">
                <small className="text-muted d-block">{isMarathi ? "संपर्क व्यक्तीचे नाव" : "Contact Person Name"}</small>
                <div className="fw-bold" style={{ color: "var(--text-navy)" }}>{w.emergency_contact_name || "Family Member"}</div>
              </div>
              <div className="col-sm-4">
                <small className="text-muted d-block">{isMarathi ? "आपत्कालीन फोन" : "Emergency Phone"}</small>
                <div className="fw-semibold text-danger">
                  <i className="bi bi-telephone-fill me-1"></i> {w.emergency_contact_phone || w.phone || "--"}
                </div>
              </div>
              <div className="col-sm-4">
                <small className="text-muted d-block">{isMarathi ? "रक्तगट" : "Blood Group"}</small>
                <div className="badge bg-danger px-3 py-1.5 fs-6">{w.blood_group || "O+"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

