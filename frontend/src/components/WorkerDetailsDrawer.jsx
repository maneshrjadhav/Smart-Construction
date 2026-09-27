import React, { useState, useEffect } from "react";
import { workerService } from "../services/workerService";
import { formatCurrency, formatValue } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateFormatter";
import StatusBadge from "./StatusBadge";
import LoadingState from "./LoadingState";
import { useToast } from "../context/ToastContext";

export default function WorkerDetailsDrawer({ show, onClose, workerId, onWorkerUpdated }) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  // Document upload state
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({
    document_name: "",
    document_type: "Identity Proof",
    issue_date: "",
    expiry_date: "",
    file_name: ""
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchWorkerDetails = async () => {
    if (!workerId) return;
    try {
      setLoading(true);
      const res = await workerService.getWorker(workerId);
      if (res.success && res.worker) {
        setWorker(res.worker);
      }
    } catch (err) {
      console.error("Fetch worker details error:", err);
      toastError("Load Error", "Failed to load complete worker profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && workerId) {
      fetchWorkerDetails();
    }
  }, [show, workerId]);

  if (!show) return null;

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    if (!docForm.document_name || !docForm.document_type) {
      toastError("Validation Error", "Document Name and Type are required.");
      return;
    }

    try {
      setUploadingDoc(true);
      const res = await workerService.uploadDocument(worker.id, docForm);
      if (res.success) {
        toastSuccess("Uploaded", "Document record saved successfully.");
        setShowDocForm(false);
        setDocForm({ document_name: "", document_type: "Identity Proof", issue_date: "", expiry_date: "", file_name: "" });
        fetchWorkerDetails();
      }
    } catch (err) {
      toastError("Upload Error", "Failed to save document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocDelete = async (docId) => {
    try {
      await workerService.deleteDocument(worker.id, docId);
      toastSuccess("Deleted", "Document removed.");
      fetchWorkerDetails();
    } catch (err) {
      toastError("Error", "Failed to remove document.");
    }
  };

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
                {worker?.name ? worker.name.substring(0, 2).toUpperCase() : "WK"}
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h5 className="modal-title fw-bold text-white mb-0">{worker?.name || "Worker Details"}</h5>
                  <span className="badge bg-secondary">{worker?.worker_code || `WRK-${worker?.id}`}</span>
                  <StatusBadge status={worker?.status || "Active"} />
                </div>
                <small className="text-white-50">
                  {worker?.trade || worker?.role || "Trade"} &bull; {worker?.project_name || "Unassigned Project"} &bull; Supervisor: {worker?.engineer_name || "Assigned Engineer"}
                </small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Navigation Tabs (8 Requirements-Aligned Tabs) */}
          <div className="bg-light border-bottom px-4 pt-2 d-flex flex-wrap gap-1">
            {[
              { key: "personal", label: "Personal Info", icon: "bi-person" },
              { key: "employment", label: "Employment Details", icon: "bi-briefcase" },
              { key: "assignment", label: "Project Assignment", icon: "bi-buildings" },
              { key: "attendance", label: "Attendance History", icon: "bi-calendar-check" },
              { key: "wage", label: "Wage & Bank Details", icon: "bi-cash-stack" },
              { key: "documents", label: `Documents (${worker?.documents?.length || 0})`, icon: "bi-file-earmark-text" },
              { key: "history", label: "Work History", icon: "bi-clock-history" },
              { key: "payments", label: `Payments (${worker?.payments?.length || 0})`, icon: "bi-wallet2" }
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
              <LoadingState message="Fetching complete worker dossier..." />
            ) : !worker ? (
              <div className="alert alert-warning">Unable to load worker information.</div>
            ) : (
              <>
                {/* TAB 1: PERSONAL INFORMATION */}
                {activeTab === "personal" && (
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <h6 className="fw-bold text-navy mb-3">Identity &amp; Bio</h6>
                        <dl className="row mb-0 small">
                          <dt className="col-sm-4 text-muted">Worker ID:</dt>
                          <dd className="col-sm-8 fw-bold">{worker.worker_code || `WRK-${worker.id}`}</dd>

                          <dt className="col-sm-4 text-muted">Full Name:</dt>
                          <dd className="col-sm-8 fw-bold">{worker.name}</dd>

                          <dt className="col-sm-4 text-muted">Gender:</dt>
                          <dd className="col-sm-8">{formatValue(worker.gender)}</dd>

                          <dt className="col-sm-4 text-muted">Date of Birth:</dt>
                          <dd className="col-sm-8">{formatDate(worker.dob)}</dd>

                          <dt className="col-sm-4 text-muted">Blood Group:</dt>
                          <dd className="col-sm-8">
                            <span className="badge bg-danger">{formatValue(worker.blood_group)}</span>
                          </dd>
                        </dl>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <h6 className="fw-bold text-navy mb-3">Contact &amp; Address</h6>
                        <dl className="row mb-0 small">
                          <dt className="col-sm-4 text-muted">Primary Phone:</dt>
                          <dd className="col-sm-8 fw-bold text-primary">{worker.phone}</dd>

                          <dt className="col-sm-4 text-muted">Alternate Phone:</dt>
                          <dd className="col-sm-8">{formatValue(worker.alternate_phone)}</dd>

                          <dt className="col-sm-4 text-muted">Email:</dt>
                          <dd className="col-sm-8">{formatValue(worker.email)}</dd>

                          <dt className="col-sm-4 text-muted">Full Address:</dt>
                          <dd className="col-sm-8">{formatValue(worker.address)}</dd>
                        </dl>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="p-3 bg-light rounded-3 border">
                        <h6 className="fw-bold text-navy mb-3">Emergency Contact</h6>
                        <div className="row small">
                          <div className="col-md-6">
                            <span className="text-muted d-block">Contact Person:</span>
                            <strong>{formatValue(worker.emergency_contact_name)}</strong>
                          </div>
                          <div className="col-md-6">
                            <span className="text-muted d-block">Emergency Number:</span>
                            <strong className="text-danger">{formatValue(worker.emergency_contact_phone)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: EMPLOYMENT DETAILS */}
                {activeTab === "employment" && (
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <h6 className="fw-bold text-navy mb-3">Trade &amp; Classification</h6>
                        <dl className="row mb-0 small">
                          <dt className="col-sm-5 text-muted">Worker Type:</dt>
                          <dd className="col-sm-7"><span className="badge bg-info text-dark">{worker.worker_type || "Skilled"}</span></dd>

                          <dt className="col-sm-5 text-muted">Trade / Skill:</dt>
                          <dd className="col-sm-7 fw-bold">{worker.trade || worker.role}</dd>

                          <dt className="col-sm-5 text-muted">Designation:</dt>
                          <dd className="col-sm-7">{worker.designation || worker.role}</dd>

                          <dt className="col-sm-5 text-muted">Employment Type:</dt>
                          <dd className="col-sm-7">{worker.employment_type || "Daily Wage"}</dd>

                          <dt className="col-sm-5 text-muted">Current Status:</dt>
                          <dd className="col-sm-7"><StatusBadge status={worker.status} /></dd>
                        </dl>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <h6 className="fw-bold text-navy mb-3">Experience &amp; History</h6>
                        <dl className="row mb-0 small">
                          <dt className="col-sm-5 text-muted">Joining Date:</dt>
                          <dd className="col-sm-7">{formatDate(worker.joining_date)}</dd>

                          <dt className="col-sm-5 text-muted">Total Experience:</dt>
                          <dd className="col-sm-7">{formatValue(worker.experience)}</dd>

                          <dt className="col-sm-5 text-muted">Previous Employer:</dt>
                          <dd className="col-sm-7">{formatValue(worker.previous_employer)}</dd>

                          <dt className="col-sm-5 text-muted">Enrolled In System:</dt>
                          <dd className="col-sm-7">{formatDate(worker.created_at)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: PROJECT ASSIGNMENT */}
                {activeTab === "assignment" && (
                  <div>
                    {/* Hierarchy Visualization */}
                    <div className="p-3 mb-4 rounded-3 border" style={{ backgroundColor: "#f1f5f9" }}>
                      <h6 className="fw-bold text-navy mb-3 text-center">Organizational Chain of Supervision</h6>
                      <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                        <div className="bg-white p-3 rounded shadow-sm text-center border" style={{ minWidth: "160px" }}>
                          <i className="bi bi-buildings fs-3 text-primary d-block mb-1"></i>
                          <small className="text-muted d-block">PROJECT</small>
                          <strong className="text-navy">{worker.project_name || "Unassigned"}</strong>
                        </div>
                        <i className="bi bi-arrow-right fs-3 text-muted"></i>
                        <div className="bg-white p-3 rounded shadow-sm text-center border" style={{ minWidth: "160px" }}>
                          <i className="bi bi-person-badge fs-3 text-info d-block mb-1"></i>
                          <small className="text-muted d-block">SITE ENGINEER</small>
                          <strong className="text-navy">{worker.engineer_name || "Assigned Engineer"}</strong>
                        </div>
                        <i className="bi bi-arrow-right fs-3 text-muted"></i>
                        <div className="bg-white p-3 rounded shadow-sm text-center border" style={{ minWidth: "160px" }}>
                          <i className="bi bi-person-workspace fs-3 text-success d-block mb-1"></i>
                          <small className="text-muted d-block">WORKER</small>
                          <strong className="text-navy">{worker.name}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="row g-3 small">
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded border">
                          <span className="text-muted d-block">Project Code:</span>
                          <strong>{formatValue(worker.project_code)}</strong>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded border">
                          <span className="text-muted d-block">Work Area / Section:</span>
                          <strong>{formatValue(worker.work_area)}</strong>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded border">
                          <span className="text-muted d-block">Shift:</span>
                          <strong>{worker.shift || "General"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: ATTENDANCE HISTORY */}
                {activeTab === "attendance" && (
                  <div>
                    <h6 className="fw-bold text-navy mb-3">Recent Attendance Logs</h6>
                    {worker.attendance && worker.attendance.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle small">
                          <thead className="table-light">
                            <tr>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Check-in</th>
                              <th>Check-out</th>
                              <th>Working Hours</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {worker.attendance.map((att) => (
                              <tr key={att.id}>
                                <td className="fw-bold">{formatDate(att.date)}</td>
                                <td><StatusBadge status={att.status} /></td>
                                <td>{att.check_in || "-"}</td>
                                <td>{att.check_out || "-"}</td>
                                <td>{att.working_hours ? `${att.working_hours} hrs` : "-"}</td>
                                <td className="text-muted">{att.remarks || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted bg-light rounded border">
                        No recorded attendance history for this worker yet.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: WAGE & BANK DETAILS */}
                {activeTab === "wage" && (
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <h6 className="fw-bold text-navy mb-3">Compensation Structure</h6>
                        <dl className="row mb-0 small">
                          <dt className="col-sm-5 text-muted">Wage Type:</dt>
                          <dd className="col-sm-7"><span className="badge bg-secondary">{worker.wage_type || "Daily"}</span></dd>

                          <dt className="col-sm-5 text-muted">Daily Wage Rate:</dt>
                          <dd className="col-sm-7 fw-bold text-success fs-6">{formatCurrency(worker.daily_wage)} / day</dd>

                          <dt className="col-sm-5 text-muted">Monthly Estimated Salary:</dt>
                          <dd className="col-sm-7 fw-bold">{formatCurrency(worker.salary)}</dd>

                          <dt className="col-sm-5 text-muted">Overtime Eligible:</dt>
                          <dd className="col-sm-7">{worker.overtime_eligible ? "Yes" : "No"}</dd>

                          <dt className="col-sm-5 text-muted">Overtime Rate:</dt>
                          <dd className="col-sm-7">{worker.overtime_rate ? `${formatCurrency(worker.overtime_rate)} / hr` : "Standard"}</dd>
                        </dl>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <h6 className="fw-bold text-navy mb-3">Bank &amp; Payment Accounts</h6>
                        <dl className="row mb-0 small">
                          <dt className="col-sm-5 text-muted">Preferred Method:</dt>
                          <dd className="col-sm-7 fw-bold">{worker.payment_method || "Cash"}</dd>

                          <dt className="col-sm-5 text-muted">Bank Name:</dt>
                          <dd className="col-sm-7">{formatValue(worker.bank_name)}</dd>

                          <dt className="col-sm-5 text-muted">Account Number:</dt>
                          <dd className="col-sm-7">{formatValue(worker.account_number)}</dd>

                          <dt className="col-sm-5 text-muted">IFSC Code:</dt>
                          <dd className="col-sm-7">{formatValue(worker.ifsc_code)}</dd>

                          <dt className="col-sm-5 text-muted">UPI ID:</dt>
                          <dd className="col-sm-7 fw-bold text-primary">{formatValue(worker.upi_id)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: DOCUMENTS & COMPLIANCE */}
                {activeTab === "documents" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-navy mb-0">Compliance &amp; Certificates</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setShowDocForm(!showDocForm)}
                      >
                        <i className={`bi ${showDocForm ? "bi-x" : "bi-plus"}`}></i> {showDocForm ? "Close Form" : "Upload Document"}
                      </button>
                    </div>

                    {showDocForm && (
                      <form onSubmit={handleDocSubmit} className="p-3 bg-light rounded-3 border mb-4">
                        <h6 className="small fw-bold text-navy mb-2">New Document Entry</h6>
                        <div className="row g-2 small">
                          <div className="col-md-3">
                            <label className="form-label">Document Name</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="e.g. Aadhaar Card / Safety Card"
                              value={docForm.document_name}
                              onChange={(e) => setDocForm({ ...docForm, document_name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Document Type</label>
                            <select
                              className="form-select form-select-sm"
                              value={docForm.document_type}
                              onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })}
                            >
                              <option value="Identity Proof">Identity Proof</option>
                              <option value="Address Proof">Address Proof</option>
                              <option value="Skill Certificate">Skill Certificate</option>
                              <option value="Safety Certificate">Safety Certificate</option>
                              <option value="Medical Fitness Certificate">Medical Fitness</option>
                              <option value="Worker ID Card">Worker ID Card</option>
                              <option value="Contract Document">Contract Document</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Issue Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={docForm.issue_date}
                              onChange={(e) => setDocForm({ ...docForm, issue_date: e.target.value })}
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Expiry Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={docForm.expiry_date}
                              onChange={(e) => setDocForm({ ...docForm, expiry_date: e.target.value })}
                            />
                          </div>
                          <div className="col-md-2 d-flex align-items-end">
                            <button type="submit" className="btn btn-sm btn-primary w-100" disabled={uploadingDoc}>
                              {uploadingDoc ? "Saving..." : "Save Record"}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {worker.documents && worker.documents.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle small">
                          <thead className="table-light">
                            <tr>
                              <th>Document Name</th>
                              <th>Type</th>
                              <th>Issue Date</th>
                              <th>Expiry Date</th>
                              <th>Status Alert</th>
                              <th className="text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {worker.documents.map((d) => (
                              <tr key={d.id}>
                                <td className="fw-bold">{d.document_name}</td>
                                <td><span className="badge bg-light text-dark border">{d.document_type}</span></td>
                                <td>{formatDate(d.issue_date)}</td>
                                <td>{formatDate(d.expiry_date)}</td>
                                <td>
                                  {d.computed_status === "Expired" && (
                                    <span className="badge bg-danger"><i className="bi bi-exclamation-triangle-fill me-1"></i> Expired</span>
                                  )}
                                  {d.computed_status === "Expiring Soon" && (
                                    <span className="badge bg-warning text-dark"><i className="bi bi-clock-history me-1"></i> Expiring Soon</span>
                                  )}
                                  {d.computed_status === "Valid" && (
                                    <span className="badge bg-success">Valid</span>
                                  )}
                                </td>
                                <td className="text-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDocDelete(d.id)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted bg-light rounded border">
                        No documents uploaded for this worker yet.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 7: WORK HISTORY */}
                {activeTab === "history" && (
                  <div>
                    <h6 className="fw-bold text-navy mb-3">Project Assignment History Timeline</h6>
                    {worker.work_history && worker.work_history.length > 0 ? (
                      <div className="timeline-container">
                        {worker.work_history.map((hist, idx) => (
                          <div key={hist.id} className="p-3 bg-light rounded-3 border mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <strong className="text-navy fs-6">{hist.project_name || "Assigned Project"}</strong>
                              <span className="badge bg-primary">{hist.work_role || "Role"}</span>
                            </div>
                            <div className="small text-muted mb-2">
                              Supervisor: {hist.engineer_name || "Site Engineer"} &bull; Area: {hist.work_area || "Site Main"}
                            </div>
                            <div className="small text-secondary">
                              <i className="bi bi-calendar-range me-1"></i>
                              {formatDate(hist.start_date)} &rarr; {hist.end_date ? formatDate(hist.end_date) : "Present"}
                            </div>
                            {hist.remarks && <div className="small text-muted mt-1 fst-italic">{hist.remarks}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted bg-light rounded border">
                        No prior historical transfers recorded.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 8: PAYMENT HISTORY */}
                {activeTab === "payments" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold text-navy mb-0">Disbursed Payment Ledger</h6>
                        <small className="text-muted">
                          Total Disbursed: <strong className="text-success">{formatCurrency(worker.total_paid || 0)}</strong> | Pending: <strong className="text-danger">{formatCurrency(worker.pending_payment || 0)}</strong>
                        </small>
                      </div>
                    </div>

                    {worker.payments && worker.payments.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle small">
                          <thead className="table-light">
                            <tr>
                              <th>Payment ID</th>
                              <th>Date</th>
                              <th>Period</th>
                              <th>Paid By</th>
                              <th>Gross</th>
                              <th>Paid</th>
                              <th>Remaining</th>
                              <th>Status</th>
                              <th>Method</th>
                            </tr>
                          </thead>
                          <tbody>
                            {worker.payments.map((p) => (
                              <tr key={p.id}>
                                <td className="fw-bold text-navy">{p.payment_code}</td>
                                <td>{formatDate(p.payment_date)}</td>
                                <td>{p.salary_period}</td>
                                <td>{p.engineer_name}</td>
                                <td>{formatCurrency(p.gross_amount)}</td>
                                <td className="fw-bold text-success">{formatCurrency(p.amount_paid)}</td>
                                <td className="text-danger">{formatCurrency(p.remaining_amount)}</td>
                                <td><StatusBadge status={p.payment_status} /></td>
                                <td><span className="badge bg-light text-dark border">{p.payment_method}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted bg-light rounded border">
                        No payments have been disbursed to this worker yet.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer bg-light border-top p-3">
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

