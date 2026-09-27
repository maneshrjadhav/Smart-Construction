import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { workerService } from "../services/workerService";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency, formatValue } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateFormatter";

export default function WorkerProfileDashboard() {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkerProfile() {
      try {
        setLoading(true);
        // If an ID is supplied in URL, use it; otherwise, fetch first worker as preview
        if (id) {
          const res = await workerService.getWorker(id);
          if (res.success) setWorker(res.worker);
        } else {
          const listRes = await workerService.getWorkers();
          if (listRes.workers && listRes.workers.length > 0) {
            const firstId = listRes.workers[0].id;
            const res = await workerService.getWorker(firstId);
            if (res.success) setWorker(res.worker);
          }
        }
      } catch (err) {
        console.error("Worker profile dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadWorkerProfile();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading worker dashboard portal..." />;
  }

  if (!worker) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-info">
          No worker profile selected. Browse the <Link to="/workforce">Workforce Roster</Link> to select a worker.
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = (worker.attendance || []).find((a) => (a.date || "").split("T")[0] === todayStr);

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Profile Header */}
      <div className="card border-0 shadow-sm rounded-4 p-4 text-white mb-4" style={{ backgroundColor: "#0f172a" }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark shadow"
              style={{ width: "64px", height: "64px", backgroundColor: "#38bdf8", fontSize: "1.5rem" }}
            >
              {worker.name ? worker.name.substring(0, 2).toUpperCase() : "WK"}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h3 className="fw-bold mb-0 text-white">{worker.name}</h3>
                <span className="badge bg-secondary">{worker.worker_code || `WRK-${worker.id}`}</span>
                <StatusBadge status={worker.status || "Active"} />
              </div>
              <p className="text-white-50 mb-0 small">
                Trade: <strong className="text-white">{worker.trade || worker.role}</strong> &bull; Site: <strong className="text-white">{worker.project_name || "Unassigned Site"}</strong> &bull; Supervisor: <strong className="text-white">{worker.engineer_name || "Site Engineer"}</strong>
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/workforce" className="btn btn-outline-light btn-sm">
              <i className="bi bi-arrow-left me-1"></i> Back to Roster
            </Link>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-primary">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Daily Wage Rate</small>
            <div className="fs-4 fw-bold text-navy">{formatCurrency(worker.daily_wage)} / day</div>
            <small className="text-muted">{worker.wage_type || "Daily"} Compensation</small>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-info">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Today's Attendance</small>
            <div className="fs-4 fw-bold text-info">
              {todayAttendance ? todayAttendance.status : "Not Marked"}
            </div>
            <small className="text-muted">{todayAttendance ? (todayAttendance.check_in || "Logged") : "Awaiting Site Punch"}</small>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-success">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Total Paid to Date</small>
            <div className="fs-4 fw-bold text-success">{formatCurrency(worker.total_paid || 0)}</div>
            <small className="text-muted">Settled Disbursements</small>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-warning">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Pending Payment</small>
            <div className="fs-4 fw-bold text-warning">{formatCurrency(worker.pending_payment || 0)}</div>
            <small className="text-muted">Unsettled Balance</small>
          </div>
        </div>
      </div>

      {/* Main Grid: Work History & Payment History */}
      <div className="row g-4 mb-4">
        {/* Work History */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white h-100">
            <h5 className="fw-bold text-navy mb-3">Work History &amp; Site Assignments</h5>
            {worker.work_history && worker.work_history.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {worker.work_history.map((hist) => (
                  <div key={hist.id} className="p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-navy">{hist.project_name || "Project Site"}</strong>
                      <span className="badge bg-primary">{hist.work_role || "Worker"}</span>
                    </div>
                    <small className="text-muted d-block mb-1">
                      Supervisor: {hist.engineer_name || "Engineer"} &bull; Area: {hist.work_area || "Main"}
                    </small>
                    <small className="text-secondary">
                      <i className="bi bi-calendar-range me-1"></i>
                      {formatDate(hist.start_date)} &rarr; {hist.end_date ? formatDate(hist.end_date) : "Present"}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted small">No prior project transfers recorded.</div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white h-100">
            <h5 className="fw-bold text-navy mb-3">Recent Payments Received</h5>
            {worker.payments && worker.payments.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Period</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worker.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-bold">{p.payment_code}</td>
                        <td>{formatDate(p.payment_date)}</td>
                        <td>{p.salary_period}</td>
                        <td className="fw-bold text-success">{formatCurrency(p.amount_paid)}</td>
                        <td><StatusBadge status={p.payment_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted small">No payment records found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

