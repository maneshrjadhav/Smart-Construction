import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { financialService } from "../services/financialService";
import { workerService } from "../services/workerService";
import { engineerAttendanceService } from "../services/engineerAttendanceService";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import PaymentModal from "../components/PaymentModal";
import WorkerDetailsDrawer from "../components/WorkerDetailsDrawer";
import { formatCurrency, formatValue } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateFormatter";
import { useToast } from "../context/ToastContext";

export default function EngineerDashboard() {
  const { currentUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  // Engineer Self Attendance State
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  // Modals & Drawers
  const [paymentWorker, setPaymentWorker] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [showWorkerDrawer, setShowWorkerDrawer] = useState(false);

  // Worker Credentials Modal (after enrollment)
  const [workerCredentialsModal, setWorkerCredentialsModal] = useState(null);

  // Add Worker Modal State
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    name: "",
    trade: "Mason",
    role: "Mason",
    worker_type: "Skilled",
    phone: "",
    daily_wage: "650",
    payment_method: "Cash"
  });
  const [submittingWorker, setSubmittingWorker] = useState(false);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, attToday] = await Promise.all([
        financialService.getEngineerDashboardFinancials().catch(() => ({ success: false })),
        engineerAttendanceService.getToday().catch(() => null)
      ]);
      if (res.success) {
        setDashboard(res);
      }
      if (attToday?.record) {
        setTodayAttendance(attToday.record);
      }
    } catch (err) {
      console.error("Engineer dashboard load error:", err);
      toastError("Load Error", "Failed to load engineer site data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleMarkPresent = async () => {
    try {
      setMarkingAttendance(true);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const res = await engineerAttendanceService.markAttendance({
        status: "Present",
        check_in: timeStr,
        remarks: "Site punch-in via Engineer Console"
      });
      if (res.success) {
        toastSuccess("Attendance Marked", "You are marked Present on site for today.");
        setTodayAttendance(res.record);
      }
    } catch (err) {
      toastError("Failed", err.response?.data?.error || "Could not mark attendance.");
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setMarkingAttendance(true);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const res = await engineerAttendanceService.markAttendance({
        status: todayAttendance?.status || "Present",
        check_in: todayAttendance?.check_in || "09:00",
        check_out: timeStr,
        working_hours: 8.5,
        remarks: "Shift punch-out logged"
      });
      if (res.success) {
        toastSuccess("Punch Out Logged", "Shift punch-out recorded.");
        setTodayAttendance(res.record);
      }
    } catch (err) {
      toastError("Failed", err.response?.data?.error || "Could not record punch out.");
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleMarkLeave = async () => {
    try {
      setMarkingAttendance(true);
      const res = await engineerAttendanceService.markAttendance({
        status: "Leave",
        remarks: "Site leave reported via Engineer Console"
      });
      if (res.success) {
        toastSuccess("Leave Recorded", "Leave status recorded for today.");
        setTodayAttendance(res.record);
      }
    } catch (err) {
      toastError("Failed", err.response?.data?.error || "Could not record leave.");
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleAddWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!workerForm.name || !workerForm.phone || !workerForm.daily_wage) {
      toastError("Validation Error", "Name, Phone, and Daily Wage are required.");
      return;
    }

    try {
      setSubmittingWorker(true);
      const res = await workerService.createWorker(workerForm);
      if (res.success) {
        toastSuccess("Worker Enrolled", res.message || "Worker added successfully.");
        setShowAddWorkerModal(false);
        setWorkerForm({ name: "", trade: "Mason", role: "Mason", worker_type: "Skilled", phone: "", daily_wage: "650", payment_method: "Cash" });
        if (res.credentials) {
          setWorkerCredentialsModal(res.credentials);
        }
        loadData();
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to add worker.");
    } finally {
      setSubmittingWorker(false);
    }
  };

  if (loading) {
    return <LoadingState message="Connecting to assigned site and workforce records..." />;
  }

  const proj = dashboard?.project;
  const fin = dashboard?.financials || {};
  const m = dashboard?.metrics || {};
  const workers = dashboard?.workers || [];
  const tasks = dashboard?.tasks || [];

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header Banner */}
      <div className="card border-0 shadow-sm rounded-4 p-4 text-white mb-4" style={{ backgroundColor: "#0f172a" }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <span className="badge bg-info text-dark mb-2">Site Engineer Operational Console</span>
            <h3 className="fw-bold mb-1">
              {greeting}, {currentUser?.name || "Site Engineer"}
            </h3>
            <p className="text-white-50 mb-0 small">
              Active Project: <strong className="text-white">{proj?.name || "Assigned Project"}</strong> ({proj?.project_code || "PRJ-001"}) &bull; Location: {proj?.location || "Site Headquarters"}
            </p>
          </div>

          <div className="d-flex gap-2">
            {/* Add Worker Button exclusive to Engineer */}
            <button
              type="button"
              className="btn btn-primary fw-bold d-flex align-items-center gap-2 px-3 py-2"
              style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
              onClick={() => setShowAddWorkerModal(true)}
            >
              <i className="bi bi-person-plus-fill"></i> + Add Worker
            </button>
            <Link to="/engineer/attendance" className="btn btn-outline-light d-flex align-items-center gap-1">
              <i className="bi bi-calendar-check"></i> Attendance
            </Link>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MY SITE ATTENDANCE TODAY (Self-Punch & Status)       */}
      {/* ---------------------------------------------------- */}
      <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white mb-4 border-start border-4 border-primary">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{ width: "48px", height: "48px", backgroundColor: "#0f172a" }}
            >
              <i className="bi bi-person-check-fill fs-4 text-info"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h6 className="fw-bold text-navy mb-0">My Site Attendance Today</h6>
                {todayAttendance?.status === "Present" ? (
                  <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1">
                    <i className="bi bi-check-circle-fill me-1"></i> Present On Site
                  </span>
                ) : todayAttendance?.status === "Half Day" ? (
                  <span className="badge bg-warning-subtle text-warning border border-warning fw-bold px-2 py-1">
                    <i className="bi bi-clock-history me-1"></i> Half Day
                  </span>
                ) : todayAttendance?.status === "Leave" ? (
                  <span className="badge bg-info-subtle text-info border border-info fw-bold px-2 py-1">
                    <i className="bi bi-calendar2-minus me-1"></i> On Leave
                  </span>
                ) : (
                  <span className="badge bg-secondary-subtle text-secondary border fw-bold px-2 py-1">
                    <i className="bi bi-clock me-1"></i> Not Marked Yet
                  </span>
                )}
              </div>
              <small className="text-muted d-block mt-0.5">
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {todayAttendance?.check_in && ` • Punch In: ${todayAttendance.check_in}`}
                {todayAttendance?.check_out && ` • Punch Out: ${todayAttendance.check_out}`}
                {todayAttendance?.working_hours && ` (${todayAttendance.working_hours} hrs)`}
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {todayAttendance?.status !== "Present" && (
              <button
                type="button"
                className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1 px-3 py-2"
                disabled={markingAttendance}
                onClick={handleMarkPresent}
              >
                {markingAttendance ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-box-arrow-in-right"></i>}
                Punch In (Present)
              </button>
            )}

            {todayAttendance?.status === "Present" && !todayAttendance?.check_out && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary fw-bold d-flex align-items-center gap-1 px-3 py-2"
                disabled={markingAttendance}
                onClick={handlePunchOut}
              >
                {markingAttendance ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-box-arrow-right"></i>}
                Punch Out
              </button>
            )}

            <button
              type="button"
              className="btn btn-sm btn-outline-info fw-bold d-flex align-items-center gap-1 px-3 py-2"
              disabled={markingAttendance}
              onClick={handleMarkLeave}
            >
              <i className="bi bi-calendar-minus"></i>
              Report Leave
            </button>
          </div>
        </div>
      </div>

      {/* FINANCIAL HIERARCHY FLOW (Requirement 12) */}
      <div className="card border-0 shadow-sm rounded-3 p-4 bg-white mb-4 border-start border-4 border-info">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-bold text-navy mb-0">Project Budget &rarr; Engineer Allocation Flow</h6>
            <small className="text-muted">Direct transactional tracking of your authorized disbursements to site workers.</small>
          </div>
          <span className="badge bg-light text-navy border">Real-Time Balance</span>
        </div>

        <div className="row g-3 text-center">
          <div className="col-md-3 col-sm-6">
            <div className="p-3 bg-light rounded-3 border">
              <small className="text-muted d-block mb-1">Project Total Budget</small>
              <strong className="fs-5 text-navy">{formatCurrency(fin.project_budget || 0)}</strong>
              <small className="text-muted d-block mt-1">Approved Capital</small>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="p-3 bg-light rounded-3 border">
              <small className="text-muted d-block mb-1">Allocated to You</small>
              <strong className="fs-5 text-primary">{formatCurrency(fin.allocated_budget || 0)}</strong>
              <small className="text-muted d-block mt-1">Authorized Limit</small>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="p-3 bg-light rounded-3 border">
              <small className="text-muted d-block mb-1">Paid to Workers</small>
              <strong className="fs-5 text-success">{formatCurrency(fin.paid_to_workers || 0)}</strong>
              <small className="text-muted d-block mt-1">Total Disbursed</small>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="p-3 bg-light rounded-3 border border-2 border-info">
              <small className="text-muted d-block mb-1">Remaining Allocation</small>
              <strong className="fs-5 text-info">{formatCurrency(fin.remaining_balance || 0)}</strong>
              <small className="text-muted d-block mt-1">Available to Disburse</small>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operational Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-primary">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">My Site Workforce</small>
            <div className="fs-4 fw-bold text-navy">{m.total_workers || 0} Workers</div>
            <small className="text-muted">{m.active_workers || 0} Active on Shift</small>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-success">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Present Today</small>
            <div className="fs-4 fw-bold text-success">{m.present_today || 0} Present</div>
            <small className="text-muted">Today's Attendance</small>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-warning">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Pending Worker Pay</small>
            <div className="fs-4 fw-bold text-warning">{formatCurrency(m.pending_worker_payments_total || 0)}</div>
            <small className="text-muted">{m.pending_worker_payments_count || 0} Outstanding</small>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-danger">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Open Site Issues</small>
            <div className="fs-4 fw-bold text-danger">{m.open_issues_count || 0} Open</div>
            <small className="text-muted">Requires Resolution</small>
          </div>
        </div>
      </div>

      {/* MY WORKERS SECTION (Requirement 21) */}
      <div className="card border-0 shadow-sm rounded-3 p-4 bg-white mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h5 className="fw-bold text-navy mb-0">My Supervised Workforce</h5>
            <small className="text-muted">Workers assigned to your site. You can record payments or enroll new workers.</small>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1 fw-bold"
            style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
            onClick={() => setShowAddWorkerModal(true)}
          >
            <i className="bi bi-person-plus-fill"></i> + Add Worker
          </button>
        </div>

        {workers.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Worker ID</th>
                  <th>Name</th>
                  <th>Trade / Skill</th>
                  <th>Daily Wage</th>
                  <th>Paid to Date</th>
                  <th>Payment Status</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <span className="badge bg-light text-navy border fw-bold">{w.worker_code || `WRK-${w.id}`}</span>
                    </td>
                    <td>
                      <strong className="d-block text-navy">{w.name}</strong>
                      <small className="text-muted">{w.phone}</small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{w.trade || w.role}</span>
                    </td>
                    <td className="fw-bold text-success">{formatCurrency(w.daily_wage)} / day</td>
                    <td className="fw-bold">{formatCurrency(w.total_paid || 0)}</td>
                    <td>
                      <span className={`badge ${
                        w.payment_status === "Paid" ? "bg-success" :
                        w.payment_status === "Partially Paid" ? "bg-warning text-dark" : "bg-danger"
                      }`}>
                        {w.payment_status || "Paid"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          title="View Worker Dossier"
                          onClick={() => {
                            setSelectedWorkerId(w.id);
                            setShowWorkerDrawer(true);
                          }}
                        >
                          <i className="bi bi-eye"></i> Details
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-success"
                          title="Record Payment"
                          onClick={() => {
                            setPaymentWorker(w);
                            setShowPaymentModal(true);
                          }}
                        >
                          <i className="bi bi-cash-coin"></i> Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-muted bg-light rounded border">
            No workers currently enrolled in your project. Click <strong>+ Add Worker</strong> above to add workforce members.
          </div>
        )}
      </div>

      {/* Worker Details Drawer */}
      <WorkerDetailsDrawer
        show={showWorkerDrawer}
        onClose={() => setShowWorkerDrawer(false)}
        workerId={selectedWorkerId}
        onWorkerUpdated={loadData}
      />

      {/* Record Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        worker={paymentWorker}
        engineerAllocation={fin.remaining_balance}
        onPaymentRecorded={loadData}
      />

      {/* Quick Add Worker Modal for Engineer */}
      {showAddWorkerModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15,23,42,0.6)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
              <div className="modal-header text-white p-4" style={{ backgroundColor: "#0f172a" }}>
                <div>
                  <span className="badge bg-info text-dark mb-1">Direct Site Enrollment</span>
                  <h5 className="modal-title fw-bold mb-0">Enroll Worker to Your Project</h5>
                  <small className="text-white-50">Worker ID (WRK-xxx) will be generated sequentially.</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddWorkerModal(false)} disabled={submittingWorker}></button>
              </div>

              <form onSubmit={handleAddWorkerSubmit}>
                <div className="modal-body p-4 bg-light">
                  <div className="bg-white p-3 rounded-3 shadow-sm border">
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Worker Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Suresh Kumar"
                        value={workerForm.name}
                        onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-bold">Mobile Number *</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="e.g. 9876543210"
                        value={workerForm.phone}
                        onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                        required
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-bold">Trade / Skill</label>
                        <select
                          className="form-select"
                          value={workerForm.trade}
                          onChange={(e) => setWorkerForm({ ...workerForm, trade: e.target.value, role: e.target.value })}
                        >
                          {["Mason", "Carpenter", "Electrician", "Plumber", "Painter", "Welder", "Helper", "Operator", "Other"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-bold">Classification</label>
                        <select
                          className="form-select"
                          value={workerForm.worker_type}
                          onChange={(e) => setWorkerForm({ ...workerForm, worker_type: e.target.value })}
                        >
                          <option value="Skilled">Skilled</option>
                          <option value="Semi-skilled">Semi-skilled</option>
                          <option value="Unskilled">Unskilled</option>
                        </select>
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small fw-bold">Daily Wage Rate (₹) *</label>
                        <input
                          type="number"
                          className="form-control fw-bold text-success"
                          value={workerForm.daily_wage}
                          onChange={(e) => setWorkerForm({ ...workerForm, daily_wage: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-bold">Payment Method</label>
                        <select
                          className="form-select"
                          value={workerForm.payment_method}
                          onChange={(e) => setWorkerForm({ ...workerForm, payment_method: e.target.value })}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Bank">Bank Transfer</option>
                          <option value="UPI">UPI</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-white border-top p-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setShowAddWorkerModal(false)} disabled={submittingWorker}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                    disabled={submittingWorker}
                  >
                    {submittingWorker ? "Enrolling..." : "Enroll Worker"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Worker Credentials Modal (SMS dispatch feedback) */}
      {workerCredentialsModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="modal-header text-white p-3 px-4 d-flex align-items-center justify-content-between"
                style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center bg-white"
                    style={{ width: "36px", height: "36px", color: "#0284c7" }}
                  >
                    <i className="bi bi-person-check-fill fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold m-0 text-white">Worker Enrolled Successfully</h5>
                    <small className="text-white-50" style={{ fontSize: "11px" }}>
                      Worker Credentials Generated &amp; Dispatched via SMS
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setWorkerCredentialsModal(null)}
                ></button>
              </div>

              <div className="modal-body p-4 bg-light">
                <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <div>
                      <small className="text-muted text-uppercase fw-bold" style={{ fontSize: "10px" }}>Worker ID</small>
                      <div className="fs-5 fw-bolder font-monospace text-primary">
                        {workerCredentialsModal.workerId}
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1">
                      <i className="bi bi-chat-left-dots-fill me-1"></i> SMS Dispatched
                    </span>
                  </div>

                  <div className="row g-2 small mb-3">
                    <div className="col-6">
                      <span className="text-muted d-block">Worker Name:</span>
                      <strong className="text-dark">{workerCredentialsModal.name}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Login Mobile:</span>
                      <strong className="text-dark">{workerCredentialsModal.phone}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Assigned Project:</span>
                      <strong className="text-dark">{workerCredentialsModal.projectName}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Supervising Engineer:</span>
                      <strong className="text-dark">{workerCredentialsModal.assignedEngineer}</strong>
                    </div>
                  </div>

                  {workerCredentialsModal.temporaryPassword && (
                    <div className="p-2 rounded-2 bg-light border d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: "10px" }}>TEMPORARY PASSWORD</small>
                        <span className="font-monospace fw-bold text-navy">
                          {workerCredentialsModal.temporaryPassword}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          navigator.clipboard.writeText(workerCredentialsModal.temporaryPassword);
                          toastSuccess("Copied", "Worker temporary password copied to clipboard.");
                        }}
                      >
                        <i className="bi bi-clipboard"></i> Copy
                      </button>
                    </div>
                  )}

                  <div className="alert alert-info py-2 px-3 mb-0 small border-0" style={{ fontSize: "11px" }}>
                    <i className="bi bi-shield-check me-1"></i>
                    <strong>Worker Portal Sign-in:</strong> Worker logs in with their Worker ID / Mobile Number and temporary password. They will be prompted to secure their account on first sign-in.
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 py-2 fw-bold small"
                    onClick={() => {
                      const text = `Smart Construction - Worker Credentials\nWorker ID: ${workerCredentialsModal.workerId}\nName: ${workerCredentialsModal.name}\nLogin: ${workerCredentialsModal.phone}\nProject: ${workerCredentialsModal.projectName}\nTemporary Password: ${workerCredentialsModal.temporaryPassword}`;
                      navigator.clipboard.writeText(text);
                      toastSuccess("Copied", "Worker credentials copied to clipboard.");
                    }}
                  >
                    <i className="bi bi-clipboard-check me-1"></i> Copy Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary w-100 py-2 fw-bold small"
                    style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                    onClick={() => setWorkerCredentialsModal(null)}
                  >
                    Done &amp; Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
