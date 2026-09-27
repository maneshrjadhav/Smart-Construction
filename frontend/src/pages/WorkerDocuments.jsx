// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER DIGITAL DOCUMENT VAULT PAGE
// ======================================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatDate } from "../utils/dateFormatter";

export default function WorkerDocuments() {
  const { t, isMarathi } = useLanguage();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    async function loadDocuments() {
      setLoading(true);
      try {
        const res = await api.get("/workers/me/documents");
        if (res.data.success) {
          const rawDocs = res.data.documents || [];
          const todayStr = new Date().toISOString().split("T")[0];
          const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

          const enriched = rawDocs.map((d) => {
            let status = d.status || "Valid";
            if (d.expiry_date) {
              const exp = String(d.expiry_date).split("T")[0];
              if (exp < todayStr) status = "Expired";
              else if (exp <= thirtyDaysAhead) status = "Expiring Soon";
            }
            return { ...d, computed_status: status };
          });

          setDocuments(enriched);
        } else {
          toastError(t("error", "Error"), res.data.error || "Failed to load documents.");
        }
      } catch (err) {
        console.error("Documents fetch error:", err);
        toastError(t("error", "Error"), err.response?.data?.error || "Could not load document vault.");
      } finally {
        setLoading(false);
      }
    }
    loadDocuments();
  }, [t, toastError]);

  const validCount = documents.filter((d) => d.computed_status === "Valid").length;
  const expiringSoonCount = documents.filter((d) => d.computed_status === "Expiring Soon").length;
  const expiredCount = documents.filter((d) => d.computed_status === "Expired").length;

  const filteredDocs = typeFilter === "ALL"
    ? documents
    : documents.filter((d) => d.document_type === typeFilter);

  const documentTypes = Array.from(new Set(documents.map((d) => d.document_type).filter(Boolean)));

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-semibold">{t("loading", "Loading document vault...")}</div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div
        className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)" }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative" style={{ zIndex: 1 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-folder2-open fs-3"></i>
              <h2 className="h4 fw-bold mb-0 text-white">
                {isMarathi ? "माझी अधिकृत कागदपत्रे" : "My Digital Document Vault"}
              </h2>
            </div>
            <p className="text-white-50 mb-0 small">
              {isMarathi ? "ओळखपत्र, सुरक्षा प्रमाणपत्र, वैद्यकीय दाखला व करार कागदपत्रे" : "Official identity proofs, safety certificates, medical fitness, and trade credentials"}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/worker-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-arrow-left me-1"></i> {isMarathi ? "डॅशबोर्ड" : "Dashboard"}
            </Link>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3">
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-primary" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "एकूण कागदपत्रे" : "Total Documents"}
                </small>
                <div className="fs-3 fw-bold text-primary">{documents.length}</div>
              </div>
              <div className="rounded-circle p-2.5 bg-primary-subtle text-primary">
                <i className="bi bi-folder2 fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-success" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "वैध कागदपत्रे (Valid)" : "Valid & Verified"}
                </small>
                <div className="fs-3 fw-bold text-success">{validCount}</div>
              </div>
              <div className="rounded-circle p-2.5 bg-success-subtle text-success">
                <i className="bi bi-shield-check fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-warning" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "लवकरच संपणारे" : "Expiring Soon (<30d)"}
                </small>
                <div className="fs-3 fw-bold text-warning">{expiringSoonCount}</div>
              </div>
              <div className="rounded-circle p-2.5 bg-warning-subtle text-warning">
                <i className="bi bi-exclamation-triangle fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-danger" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "मुदत संपलेली" : "Expired Documents"}
                </small>
                <div className="fs-3 fw-bold text-danger">{expiredCount}</div>
              </div>
              <div className="rounded-circle p-2.5 bg-danger-subtle text-danger">
                <i className="bi bi-x-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "var(--bg-card)" }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-files fs-5 text-primary"></i>
            <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
              {isMarathi ? "कागदपत्रे यादी व स्थिती" : "Document Files & Compliance Status"}
            </h5>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select
              className="form-select form-select-sm rounded-pill px-3"
              style={{ width: "auto" }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">{isMarathi ? "सर्व कागदपत्र प्रकार" : "All Document Types"}</option>
              {documentTypes.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-folder-x fs-1 d-block mb-2 opacity-50"></i>
            <p className="mb-2">
              {isMarathi
                ? "कोणतीही कागदपत्रे आढळली नाहीत. नवीन प्रमाणपत्रे किंवा ओळखपत्र जोडण्यासाठी आपल्या साइट अभियंत्याशी संपर्क साधा."
                : "No documents found in vault. Contact your Site Engineer to upload required compliance certificates."}
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {filteredDocs.map((doc) => {
              let badge = <span className="badge bg-success px-2.5 py-1">Valid</span>;
              if (doc.computed_status === "Expiring Soon") {
                badge = <span className="badge bg-warning text-dark px-2.5 py-1">Expiring Soon</span>;
              } else if (doc.computed_status === "Expired") {
                badge = <span className="badge bg-danger px-2.5 py-1">Expired</span>;
              }

              return (
                <div key={doc.id} className="col-md-6 col-lg-4">
                  <div className="card h-100 border border-light-subtle shadow-sm rounded-3 p-3.5" style={{ background: "var(--bg-alt)" }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary-subtle text-primary">
                        {doc.document_type || "General Document"}
                      </span>
                      {badge}
                    </div>

                    <h6 className="fw-bold mb-1" style={{ color: "var(--text-navy)" }}>{doc.document_name}</h6>
                    <p className="text-muted small mb-3">
                      {doc.file_name || "Official Digital Certificate"}
                    </p>

                    <div className="row g-1 small text-muted mb-3">
                      <div className="col-6">
                        <span className="d-block text-muted">{isMarathi ? "जारी तारीख" : "Issue Date"}:</span>
                        <strong>{formatDate(doc.issue_date)}</strong>
                      </div>
                      <div className="col-6">
                        <span className="d-block text-muted">{isMarathi ? "मुदत समाप्ती" : "Expiry Date"}:</span>
                        <strong className={doc.computed_status === "Expired" ? "text-danger" : doc.computed_status === "Expiring Soon" ? "text-warning" : "text-dark"}>
                          {formatDate(doc.expiry_date)}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                      <span className="small text-muted">
                        <i className="bi bi-file-earmark-check text-success me-1"></i>
                        Verified
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-pill px-3"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <i className="bi bi-eye me-1"></i> {isMarathi ? "पहा" : "View"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document View Modal */}
      {selectedDoc && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text fs-5"></i>
                  <h5 className="modal-title fw-bold">{selectedDoc.document_name}</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedDoc(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="p-3 bg-light rounded-3 mb-3">
                  <div className="mb-2">
                    <small className="text-muted d-block">{isMarathi ? "कागदपत्र प्रकार" : "Document Category"}</small>
                    <strong className="text-dark">{selectedDoc.document_type || "Official Document"}</strong>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">{isMarathi ? "फाइल नाव" : "File Name"}</small>
                    <strong className="text-dark">{selectedDoc.file_name || `${selectedDoc.document_name}.pdf`}</strong>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted d-block">{isMarathi ? "जारी तारीख" : "Issue Date"}</small>
                      <strong className="text-dark">{formatDate(selectedDoc.issue_date)}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">{isMarathi ? "मुदत समाप्ती" : "Expiry Date"}</small>
                      <strong className="text-dark">{formatDate(selectedDoc.expiry_date)}</strong>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  {isMarathi
                    ? "हे कागदपत्र साइट अभियंत्याद्वारे सत्यापित केले आहे. अधिक माहितीसाठी आपल्या अभियंत्याशी संपर्क साधा."
                    : "This document is verified and archived in the Smart Construction compliance repository."}
                </div>
              </div>
              <div className="modal-footer bg-light border-0 py-2.5">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setSelectedDoc(null)}
                >
                  {isMarathi ? "बंद करा" : "Close"}
                </button>
                {selectedDoc.file_url && (
                  <a
                    href={selectedDoc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary rounded-pill px-4"
                  >
                    <i className="bi bi-download me-1.5"></i> {isMarathi ? "डाउनलोड" : "Download"}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

