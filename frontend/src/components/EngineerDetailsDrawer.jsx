import React, { useState, useEffect } from "react";
import { formatCurrency, formatValue } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateFormatter";
import StatusBadge from "./StatusBadge";
import LoadingState from "./LoadingState";
import { paymentService } from "../services/paymentService";
import { workerService } from "../services/workerService";
import { attendanceService } from "../services/attendanceService";

export default function EngineerDetailsDrawer({ show, onClose, engineer }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [workers, setWorkers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!engineer) return;
      try {
        setLoading(true);
        const [wRes, pRes, aRes, allocRes] = await Promise.all([
          workerService.getWorkers().catch(() => ({ workers: [] })),
          paymentService.getWorkerPayments().catch(() => ({ payments: [] })),
          attendanceService.getAttendance().catch(() => ({ attendance: [] })),
          paymentService.getAllocations().catch(() => ({ allocations: [] }))
        ]);

        const engWorkers = (wRes.workers || []).filter(
          (w) => w.engineer_id === engineer.id || (engineer.project_id && w.project_id === engineer.project_id)
        );
        const engPayments = (pRes.payments || []).filter((p) => p.engineer_id === engineer.id);
        const engAttendance = (aRes.attendance || []).filter(
          (a) => a.engineer_id === engineer.id || (engineer.project_id && a.project_id === engineer.project_id)
        );
        const engAlloc = (allocRes.allocations || []).find((al) => al.engineer_id === engineer.id);

        setWorkers(engWorkers);
        setPayments(engPayments);
        setAttendance(engAttendance);
        setAllocation(engAlloc || null);
      } catch (err) {
        console.error("Engineer details load error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (show && engineer) {
      loadData();
    }
  }, [show, engineer]);

  if (!show || !engineer) return null;

  const totalPaidToWorkers = payments.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);
  const pendingWorkerPayments = payments.reduce((acc, p) => acc + Number(p.remaining_amount || 0), 0);
  const allocatedAmount = Number(allocation?.allocated_amount || 0);
  const remainingAllocation = Math.max(0, allocatedAmount - totalPaidToWorkers);

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15,23,42,0.65)", zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: "18px", overflow: "hidden" }}>
          {/* Header */}
          <div className="modal-header text-white p-4" style={{ backgroundColor: "#0f172a" }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark shadow-sm"
                style={{ width: "52px", height: "52px", backgroundColor: "#38bdf8", fontSize: "1.2rem" }}
              >
                {engineer.full_name ? engineer.full_name.substring(0, 2).toUpperCase() : "EG"}
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h5 className="modal-title fw-bold text-white mb-0">{engineer.full_name}</h5>
                  <span className="badge bg-secondary">{engineer.engineer_code}</span>
                  <StatusBadge status={engineer.status || "Active"} />
                </div>
                <small className="text-white-50">
                  {engineer.designation || "Site Engineer"} &bull; Project: {engineer.project_name || "Assigned Site"} &bull; Contact: {engineer.phone || "N/A"}
                </small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Navigation Tabs (7 Sections per Section 15) */}
          <div className="bg-light border-bottom px-4 pt-2 d-flex flex-wrap gap-1">
            {[
              { key: "profile", label: "Profile", icon: "bi-person-badge" },
              { key: "project", label: "Project", icon: "bi-buildings" },
              { key: "workers", label: `Workers (${workers.length})`, icon: "bi-people" },
              { key: "attendance", label: "Attendance", icon: "bi-calendar-check" },
              { key: "payments", label: "Payments & Budget", icon: "bi-wallet2" },
              { key: "history", label: "Work History", icon: "bi-clock-history" },
              { key: "reports", label: "Reports & Audit", icon: "bi-file-earmark-bar-graph" }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn border-0 py-2 px-3 fw-bold small ${
                  activeTab === tab.key ? "border-bottom border-3 border-info text-info bg-white" : "text-muted"
                }`}
                style={{ borderRadius: "8px 8px 0 0" }}
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={`bi ${tab.icon} me-1`}></i> {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-white" style={{ minHeight: "450px" }}>
            {loading ? (
              <LoadingState message="Aggregating engineer profile and workforce..." />
            ) : (
              <>
                {/* 1. PROFILE */}
                {activeTab === "profile" && (
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <h6 className="fw-bold text-navy mb-3">Professional Credentials</h6>
                        <dl className="row mb-0 small">
                          <dt className="col-sm-4 text-muted">Engineer ID:</dt>
                          <dd className="col-sm-8 fw-bold">{engineer.engineer_code}</dd>

                          <dt className="col-sm-4 text-muted">Full Name:</dt>
                          <dd className="col-sm-8 fw-bold">{engineer.full_name}</dd>

                          <dt className="col-sm-4 text-muted">Designation:</dt>
                          <dd className="col-sm-8">{engineer.designation || "Site Engineer"}</dd>

                          <dt className="col-sm-4 text-muted">Qualification:</dt>
                          <dd className="col-sm-8">{formatValue(engineer.qualification)}</dd>

                          <dt className="col-sm-4 text-muted">Experience:</dt>
                          <dd className="col-sm-8">{formatValue(engineer.experience)}</dd>

                          <dt className="col-sm-4 text-muted">Joining Date:</dt>
                          <dd className="col-sm-8">{formatDate(engineer.joining_date)}</dd>
                        </dl>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <h6 className="fw-bold text-navy mb-3">Account &amp; Contact Details</h6>
                        <dl className="row mb-0 small">
                          <dt className="col-sm-4 text-muted">Email Address:</dt>
                          <dd className="col-sm-8 fw-bold">{formatValue(engineer.email)}</dd>

                          <dt className="col-sm-4 text-muted">Phone Number:</dt>
                          <dd className="col-sm-8 text-primary fw-bold">{formatValue(engineer.phone)}</dd>

                          <dt className="col-sm-4 text-muted">Address:</dt>
                          <dd className="col-sm-8">{formatValue(engineer.address)}</dd>

                          <dt className="col-sm-4 text-muted">Status:</dt>
                          <dd className="col-sm-8"><StatusBadge status={engineer.status || "Active"} /></dd>

                          <dt className="col-sm-4 text-muted">Password Changed:</dt>
                          <dd className="col-sm-8">
                            <span className={`badge ${engineer.must_change_password ? "bg-warning text-dark" : "bg-success"}`}>
                              {engineer.must_change_password ? "Pending First Login" : "Secured"}
                            </span>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PROJECT */}
                {activeTab === "project" && (
                  <div>
                    <h6 className="fw-bold text-navy mb-3">Assigned Project Context</h6>
                    <div className="p-3 bg-light rounded-3 border mb-3">
                      <div className="row g-3 small">
                        <div className="col-md-4">
                          <span className="text-muted d-block">Project Name:</span>
                          <strong className="fs-6 text-navy">{engineer.project_name || "Unassigned"}</strong>
                        </div>
                        <div className="col-md-4">
                          <span className="text-muted d-block">Project ID / Code:</span>
                          <strong>{engineer.project_id ? `PRJ-${engineer.project_id}` : "-"}</strong>
                        </div>
                        <div className="col-md-4">
                          <span className="text-muted d-block">Site Engineer Assignment:</span>
                          <span className="badge bg-success">Active On Site</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. WORKERS */}
                {activeTab === "workers" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-navy mb-0">Workers Managed by this Engineer ({workers.length})</h6>
                      <small className="text-muted">Total Workforce under supervision</small>
                    </div>

                    {workers.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle small">
                          <thead className="table-light">
                            <tr>
                              <th>Worker ID</th>
                              <th>Name</th>
                              <th>Trade / Skill</th>
                              <th>Daily Wage</th>
                              <th>Paid to Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workers.map((w) => (
                              <tr key={w.id}>
                                <td className="fw-bold">{w.worker_code || `WRK-${w.id}`}</td>
                                <td className="fw-bold text-navy">{w.name}</td>
                                <td><span className="badge bg-light text-dark border">{w.trade || w.role}</span></td>
                                <td>{formatCurrency(w.daily_wage)} / day</td>
                                <td className="text-success fw-bold">{formatCurrency(w.total_paid || 0)}</td>
                                <td><StatusBadge status={w.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted bg-light rounded border">
                        No workers currently assigned to this engineer.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. ATTENDANCE */}
                {activeTab === "attendance" && (
                  <div>
                    <h6 className="fw-bold text-navy mb-3">Worker Attendance Records Supervised</h6>
                    {attendance.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle small">
                          <thead className="table-light">
                            <tr>
                              <th>Date</th>
                              <th>Worker Name</th>
                              <th>Status</th>
                              <th>Check-in</th>
                              <th>Check-out</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.slice(0, 20).map((att) => (
                              <tr key={att.id}>
                                <td className="fw-bold">{formatDate(att.date)}</td>
                                <td>{att.worker_name}</td>
                                <td><StatusBadge status={att.status} /></td>
                                <td>{att.check_in || "-"}</td>
                                <td>{att.check_out || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted bg-light rounded border">
                        No attendance logs submitted under this engineer yet.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. PAYMENTS & BUDGET */}
                {activeTab === "payments" && (
                  <div>
                    {/* Financial Flow Cards */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <div className="p-3 bg-light rounded border text-center">
                          <small className="text-muted d-block">Allocated Budget</small>
                          <strong className="fs-5 text-primary">{formatCurrency(allocatedAmount)}</strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="p-3 bg-light rounded border text-center">
                          <small className="text-muted d-block">Paid to Workers</small>
                          <strong className="fs-5 text-success">{formatCurrency(totalPaidToWorkers)}</strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="p-3 bg-light rounded border text-center">
                          <small className="text-muted d-block">Remaining Balance</small>
                          <strong className="fs-5 text-info">{formatCurrency(remainingAllocation)}</strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="p-3 bg-light rounded border text-center">
                          <small className="text-muted d-block">Pending Worker Pay</small>
                          <strong className="fs-5 text-danger">{formatCurrency(pendingWorkerPayments)}</strong>
                        </div>
                      </div>
                    </div>

                    <h6 className="fw-bold text-navy mb-3">Disbursed Worker Payment Ledger</h6>
                    {payments.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle small">
                          <thead className="table-light">
                            <tr>
                              <th>Payment ID</th>
                              <th>Date</th>
                              <th>Worker Name</th>
                              <th>Gross</th>
                              <th>Paid</th>
                              <th>Status</th>
                              <th>Reference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((p) => (
                              <tr key={p.id}>
                                <td className="fw-bold">{p.payment_code}</td>
                                <td>{formatDate(p.payment_date)}</td>
                                <td className="fw-bold text-navy">{p.worker_name}</td>
                                <td>{formatCurrency(p.gross_amount)}</td>
                                <td className="text-success fw-bold">{formatCurrency(p.amount_paid)}</td>
                                <td><StatusBadge status={p.payment_status} /></td>
                                <td className="text-muted">{p.reference_number || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted bg-light rounded border">
                        No payments recorded by this engineer yet.
                      </div>
                    )}
                  </div>
                )}

                {/* 6. WORK HISTORY */}
                {activeTab === "history" && (
                  <div>
                    <h6 className="fw-bold text-navy mb-3">Engineer Site Service Record</h6>
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-navy">{engineer.project_name || "Project Assignment"}</strong>
                        <span className="badge bg-success">Current Site</span>
                      </div>
                      <small className="text-muted d-block mb-2">Role: {engineer.designation || "Site Engineer"}</small>
                      <div className="small text-secondary">
                        <i className="bi bi-calendar-check me-1"></i> Joining Date: {formatDate(engineer.joining_date)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. REPORTS */}
                {activeTab === "reports" && (
                  <div>
                    <h6 className="fw-bold text-navy mb-3">Audit Summary &amp; Health</h6>
                    <div className="p-4 bg-light rounded-3 border">
                      <p className="small text-muted mb-3">
                        This summary reflects real-time database transactions under Site Engineer {engineer.full_name} ({engineer.engineer_code}).
                      </p>
                      <ul className="small mb-0 list-unstyled d-flex flex-column gap-2">
                        <li><i className="bi bi-check-circle-fill text-success me-2"></i> Budget Utilization: {allocatedAmount > 0 ? `${Math.round((totalPaidToWorkers / allocatedAmount) * 100)}%` : "0%"}</li>
                        <li><i className="bi bi-check-circle-fill text-success me-2"></i> Active Workers Enrolled: {workers.filter(w => w.status === "Active").length}</li>
                        <li><i className="bi bi-check-circle-fill text-success me-2"></i> Total Payment Transactions Disbursed: {payments.length}</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer bg-light border-top p-3">
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Close Engineer Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

