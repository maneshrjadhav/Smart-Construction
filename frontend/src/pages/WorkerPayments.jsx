// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER PAYMENTS LEDGER & PRINTABLE VOUCHER PAGE
// ======================================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatCurrency } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateFormatter";

export default function WorkerPayments() {
  const { t, isMarathi } = useLanguage();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [workerInfo, setWorkerInfo] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      try {
        const [payRes, meRes] = await Promise.all([
          api.get("/workers/me/payments"),
          api.get("/workers/me"),
        ]);

        if (payRes.data.success) {
          setPayments(payRes.data.payments || []);
        }
        if (meRes.data.success) {
          setWorkerInfo(meRes.data.worker || {});
        }
      } catch (err) {
        console.error("Payments fetch error:", err);
        toastError(t("error", "Error"), err.response?.data?.error || "Could not load payments data.");
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, [t, toastError]);

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);
  const totalPending = payments.reduce((acc, p) => acc + Number(p.remaining_amount || 0), 0);
  const totalGross = payments.reduce((acc, p) => acc + Number(p.gross_amount || p.amount_paid || 0), 0);

  const filteredPayments = statusFilter === "ALL"
    ? payments
    : payments.filter((p) => (p.payment_status || "Paid") === statusFilter);

  const handlePrintVoucher = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-semibold">{t("loading", "Loading financial ledger & payment vouchers...")}</div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-voucher-card, #printable-voucher-card * {
            visibility: visible !important;
          }
          #printable-voucher-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #000 !important;
            margin: 0 !important;
            padding: 24px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Header Banner */}
      <div
        className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden no-print"
        style={{ background: "linear-gradient(135deg, #1d976c 0%, #93f9b9 100%)" }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative" style={{ zIndex: 1 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-cash-stack fs-3"></i>
              <h2 className="h4 fw-bold mb-0 text-white">
                {isMarathi ? "माझे पेमेंट व्हाउचर्स व लेजर" : "My Payments & Vouchers"}
              </h2>
            </div>
            <p className="text-white-50 mb-0 small">
              {isMarathi ? "अधिकृत मजुरी वाटप, व्हाउचर्स आणि बँक पेमेंट इतिहास" : "Official wage disbursements, payment receipts and printable vouchers"}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/worker-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-arrow-left me-1"></i> {isMarathi ? "डॅशबोर्ड" : "Dashboard"}
            </Link>
          </div>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="row g-3 no-print">
        <div className="col-xl-4 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-success" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "एकूण मिळालेली मजुरी (Total Paid)" : "Total Disbursed to Date"}
                </small>
                <div className="fs-3 fw-bold text-success">{formatCurrency(totalPaid)}</div>
                <small className="text-muted">{payments.length} {isMarathi ? "व्हाउचर्स वाटप" : "disbursements issued"}</small>
              </div>
              <div className="rounded-circle p-2.5 bg-success-subtle text-success">
                <i className="bi bi-check2-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-warning" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "शिल्लक येणे बाकी (Pending Balance)" : "Pending Balance"}
                </small>
                <div className="fs-3 fw-bold text-warning">{formatCurrency(totalPending)}</div>
                <small className="text-muted">{isMarathi ? "पुढील मजुरी चक्रात देय" : "Payable in next disbursement cycle"}</small>
              </div>
              <div className="rounded-circle p-2.5 bg-warning-subtle text-warning">
                <i className="bi bi-hourglass-split fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-12">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-primary" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">
                  {isMarathi ? "एकूण मजुरी रक्कम (Gross Earned)" : "Total Gross Earnings"}
                </small>
                <div className="fs-3 fw-bold text-primary">{formatCurrency(totalGross)}</div>
                <small className="text-muted">{isMarathi ? "दैनिक दर:" : "Daily Rate:"} {formatCurrency(workerInfo?.daily_wage)}/day</small>
              </div>
              <div className="rounded-circle p-2.5 bg-primary-subtle text-primary">
                <i className="bi bi-wallet2 fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4 no-print" style={{ background: "var(--bg-card)" }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-receipt-cutoff fs-5 text-primary"></i>
            <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
              {isMarathi ? "मजुरी वाटप व्हाउचर्स सूची" : "Payment Vouchers Ledger"}
            </h5>
            <span className="badge bg-secondary-subtle text-secondary rounded-pill">
              {filteredPayments.length} {isMarathi ? "नोंदी" : "vouchers"}
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
                className={`btn ${statusFilter === "Paid" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setStatusFilter("Paid")}
              >
                {isMarathi ? "दिलेले" : "Paid"}
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === "Pending" ? "btn-warning" : "btn-outline-secondary"}`}
                onClick={() => setStatusFilter("Pending")}
              >
                {isMarathi ? "प्रलंबित" : "Pending"}
              </button>
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-cash fs-1 d-block mb-2 opacity-50"></i>
            {isMarathi ? "कोणतेही पेमेंट व्हाउचर्स उपलब्ध नाहीत." : "No payment vouchers recorded yet."}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>{isMarathi ? "व्हाउचर कोड" : "Voucher #"}</th>
                  <th>{isMarathi ? "तारीख" : "Payment Date"}</th>
                  <th>{isMarathi ? "कालावधी" : "Period"}</th>
                  <th>{isMarathi ? "कामाचे दिवस" : "Work Days"}</th>
                  <th>{isMarathi ? "निव्वळ रक्कम" : "Net Amount"}</th>
                  <th>{isMarathi ? "दिलेली रक्कम" : "Paid Amount"}</th>
                  <th>{isMarathi ? "माध्यम" : "Mode"}</th>
                  <th>{isMarathi ? "स्थिती" : "Status"}</th>
                  <th className="text-end">{isMarathi ? "कृती" : "Action"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  return (
                    <tr key={p.id}>
                      <td className="fw-bold text-primary">{p.payment_code || `WPAY-${p.id}`}</td>
                      <td>{formatDate(p.payment_date || p.created_at)}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{p.salary_period || "Recent Cycle"}</span>
                      </td>
                      <td>{p.working_days ? `${p.working_days} days` : "--"}</td>
                      <td className="fw-semibold">{formatCurrency(p.net_amount || p.amount_paid)}</td>
                      <td className="fw-bold text-success">{formatCurrency(p.amount_paid)}</td>
                      <td>
                        <span className="badge bg-info-subtle text-info">{p.payment_method || "Cash"}</span>
                      </td>
                      <td>
                        <span className={`badge ${p.payment_status === "Paid" ? "bg-success" : "bg-warning text-dark"}`}>
                          {p.payment_status || "Paid"}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm rounded-pill px-3"
                          onClick={() => setSelectedVoucher(p)}
                        >
                          <i className="bi bi-printer me-1"></i> {isMarathi ? "व्हाउचर पाहा" : "View Voucher"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Payment Voucher Modal */}
      {selectedVoucher && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
          onClick={() => setSelectedVoucher(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white border-0 py-3 no-print">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text fs-5 text-warning"></i>
                  <h5 className="modal-title fw-bold">
                    {isMarathi ? "अधिकृत मजुरी पावती (Payment Voucher)" : "Official Worker Payment Voucher"}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedVoucher(null)}
                ></button>
              </div>

              {/* Printable Voucher Paper */}
              <div id="printable-voucher-card" className="modal-body p-4 p-md-5 bg-white text-dark">
                {/* Letterhead */}
                <div className="d-flex align-items-center justify-content-between border-bottom pb-4 mb-4">
                  <div>
                    <h3 className="fw-bold text-primary mb-1 tracking-tight">SMART CONSTRUCTION</h3>
                    <p className="text-muted small mb-0">
                      Enterprise Construction Management & Workforce Payroll ERP
                    </p>
                    <small className="text-muted">
                      Site: <strong>{selectedVoucher.project_name || workerInfo?.project_name || "Assigned Site"}</strong>
                    </small>
                  </div>
                  <div className="text-end">
                    <div className="badge bg-primary fs-6 px-3 py-1.5 mb-1">
                      {selectedVoucher.payment_code || `WPAY-${selectedVoucher.id}`}
                    </div>
                    <div className="small text-muted">
                      Date: <strong>{formatDate(selectedVoucher.payment_date || selectedVoucher.created_at)}</strong>
                    </div>
                  </div>
                </div>

                {/* Worker & Supervisor Details */}
                <div className="row g-3 p-3 bg-light rounded-3 mb-4">
                  <div className="col-sm-6">
                    <small className="text-muted d-block text-uppercase fw-bold">Worker Details</small>
                    <div className="fw-bold fs-5 text-navy">{workerInfo?.name || selectedVoucher.worker_name}</div>
                    <div className="small text-muted">
                      ID: <strong>{workerInfo?.worker_code || `WRK-${workerInfo?.id || "--"}`}</strong>
                      {" • "}
                      Trade: <strong>{workerInfo?.trade || workerInfo?.role || "Skilled Artisan"}</strong>
                    </div>
                    <div className="small text-muted">
                      Mobile: <strong>{workerInfo?.phone || "--"}</strong>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <small className="text-muted d-block text-uppercase fw-bold">Supervising Site Engineer</small>
                    <div className="fw-bold fs-5 text-dark">{selectedVoucher.engineer_name || workerInfo?.engineer_name || "Site Engineer"}</div>
                    <div className="small text-muted">
                      Period: <strong>{selectedVoucher.salary_period || "Monthly Cycle"}</strong>
                    </div>
                    <div className="small text-muted">
                      Payment Mode: <strong className="text-success">{selectedVoucher.payment_method || "Cash"}</strong>
                    </div>
                  </div>
                </div>

                {/* Breakdown Table */}
                <table className="table table-bordered mb-4">
                  <thead className="table-light">
                    <tr>
                      <th>Description</th>
                      <th className="text-center">Rate / Basis</th>
                      <th className="text-center">Units / Days</th>
                      <th className="text-end">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Basic Wage Compensation</strong>
                        <div className="small text-muted">Normal daily site attendance</div>
                      </td>
                      <td className="text-center">{formatCurrency(selectedVoucher.daily_wage || workerInfo?.daily_wage)} / day</td>
                      <td className="text-center">{selectedVoucher.working_days || "N/A"} days</td>
                      <td className="text-end fw-semibold">
                        {formatCurrency(
                          selectedVoucher.working_days && selectedVoucher.daily_wage
                            ? Number(selectedVoucher.working_days) * Number(selectedVoucher.daily_wage)
                            : selectedVoucher.gross_amount || selectedVoucher.amount_paid
                        )}
                      </td>
                    </tr>
                    {Number(selectedVoucher.overtime_amount || 0) > 0 && (
                      <tr>
                        <td>
                          <strong>Overtime Allowance</strong>
                        </td>
                        <td className="text-center">Hourly Rate</td>
                        <td className="text-center">OT Hrs</td>
                        <td className="text-end fw-semibold">{formatCurrency(selectedVoucher.overtime_amount)}</td>
                      </tr>
                    )}
                    {Number(selectedVoucher.deductions || 0) > 0 && (
                      <tr className="text-danger">
                        <td>
                          <strong>Advances / Deductions</strong>
                        </td>
                        <td className="text-center">--</td>
                        <td className="text-center">--</td>
                        <td className="text-end">- {formatCurrency(selectedVoucher.deductions)}</td>
                      </tr>
                    )}
                    <tr className="table-light fw-bold">
                      <td colSpan="3" className="text-end text-uppercase">Net Disbursed Amount</td>
                      <td className="text-end text-success fs-5">{formatCurrency(selectedVoucher.amount_paid)}</td>
                    </tr>
                    {Number(selectedVoucher.remaining_amount || 0) > 0 && (
                      <tr className="text-muted small">
                        <td colSpan="3" className="text-end">Remaining / Balance Due</td>
                        <td className="text-end text-warning fw-semibold">{formatCurrency(selectedVoucher.remaining_amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {selectedVoucher.reference_number && (
                  <div className="small text-muted mb-4">
                    Transaction / UTR Reference: <strong>{selectedVoucher.reference_number}</strong>
                  </div>
                )}

                {/* Signatures */}
                <div className="row pt-5 mt-4 border-top">
                  <div className="col-6 text-center">
                    <div className="border-bottom pb-4 mb-2 mx-auto" style={{ width: "180px" }}></div>
                    <div className="fw-bold small">{isMarathi ? "कामगाराची स्वाक्षरी / अंगठा" : "Worker Signature / Thumb Impression"}</div>
                    <div className="text-muted small">{workerInfo?.name || selectedVoucher.worker_name}</div>
                  </div>
                  <div className="col-6 text-center">
                    <div className="border-bottom pb-4 mb-2 mx-auto" style={{ width: "180px" }}></div>
                    <div className="fw-bold small">{isMarathi ? "साइट अभियंता स्वाक्षरी व शिक्का" : "Site Engineer Signature & Stamp"}</div>
                    <div className="text-muted small">{selectedVoucher.engineer_name || workerInfo?.engineer_name || "Authorized Signatory"}</div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="modal-footer bg-light border-0 py-3 d-flex justify-content-between no-print">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setSelectedVoucher(null)}
                >
                  {isMarathi ? "बंद करा" : "Close"}
                </button>
                <button
                  type="button"
                  className="btn btn-success rounded-pill px-4 fw-semibold"
                  onClick={handlePrintVoucher}
                >
                  <i className="bi bi-printer-fill me-1.5"></i> {isMarathi ? "व्हाउचर प्रिंट करा" : "Print Voucher"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

