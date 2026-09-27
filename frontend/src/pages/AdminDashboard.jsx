import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { financialService } from "../services/financialService";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import AllocationModal from "../components/AllocationModal";
import { formatCurrency, formatValue } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateFormatter";

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditAnswers, setAuditAnswers] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await financialService.getAdminDashboardFinancials();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openAuditModal = async () => {
    try {
      setLoadingAudit(true);
      setShowAuditModal(true);
      const res = await financialService.getPaymentAudit();
      if (res.success) {
        setAuditAnswers(res);
      }
    } catch (err) {
      console.error("Audit load error:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  if (loading) {
    return <LoadingState message="Aggregating live organizational portfolio and financial audit data..." />;
  }

  const s = data?.summary || {};
  const charts = data?.charts || {};
  const projectsOverview = data?.projects_overview || [];
  const engineersOverview = data?.engineers_overview || [];

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <span className="badge bg-primary text-white mb-1">Corporate Portfolio</span>
          <h3 className="fw-bold text-navy mb-0">Executive &amp; Financial Governance</h3>
          <small className="text-muted">
            Company-wide workforce, budget allocation, and contractor disbursements overview.
          </small>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center gap-1 fw-bold"
            onClick={openAuditModal}
          >
            <i className="bi bi-shield-check"></i> 10-Point Audit Report
          </button>
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-1 fw-bold"
            style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
            onClick={() => setShowAllocationModal(true)}
          >
            <i className="bi bi-wallet2"></i> Allocate Budget
          </button>
        </div>
      </div>

      {/* 9 TOP SUMMARY METRIC CARDS (Requirement 14) */}
      <div className="row g-3 mb-4">
        <div className="col-xl-4 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-primary h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Total Project Budget</small>
                <div className="fs-4 fw-bold text-navy">{formatCurrency(s.total_project_budget || 0)}</div>
                <small className="text-muted">{s.total_projects || 0} Total Active Projects</small>
              </div>
              <div className="p-2 rounded bg-light text-primary">
                <i className="bi bi-buildings fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-info h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Allocated to Engineers</small>
                <div className="fs-4 fw-bold text-info">{formatCurrency(s.total_allocated_to_engineers || 0)}</div>
                <small className="text-muted">{s.total_engineers || 0} Site Engineers ({s.active_engineers || 0} Active)</small>
              </div>
              <div className="p-2 rounded bg-light text-info">
                <i className="bi bi-person-gear fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-success h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Total Paid to Workers</small>
                <div className="fs-4 fw-bold text-success">{formatCurrency(s.total_paid_to_workers || 0)}</div>
                <small className="text-muted">{s.total_workers || 0} Total Workforce Roster</small>
              </div>
              <div className="p-2 rounded bg-light text-success">
                <i className="bi bi-cash-stack fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-warning h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Pending Worker Pay</small>
                <div className="fs-4 fw-bold text-warning">{formatCurrency(s.pending_worker_payments || 0)}</div>
                <small className="text-muted">Outstanding Balances</small>
              </div>
              <div className="p-2 rounded bg-light text-warning">
                <i className="bi bi-clock-history fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-secondary h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Material Expenses</small>
                <div className="fs-4 fw-bold text-secondary">{formatCurrency(s.material_expenses || 0)}</div>
                <small className="text-muted">Procured Site Resources</small>
              </div>
              <div className="p-2 rounded bg-light text-secondary">
                <i className="bi bi-box-seam fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-dark h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Remaining Budget</small>
                <div className="fs-4 fw-bold text-dark">{formatCurrency(s.remaining_project_budget || 0)}</div>
                <small className="text-muted">Uncommitted Project Capital</small>
              </div>
              <div className="p-2 rounded bg-light text-dark">
                <i className="bi bi-pie-chart fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FINANCIAL CHARTS SECTION (Requirement 14) */}
      <div className="row g-4 mb-4">
        {/* Chart 1: Project Budget vs Spending */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-navy mb-0">Project Budget vs. Total Spending</h6>
              <span className="badge bg-light text-dark border">Live Data</span>
            </div>
            <div style={{ height: "280px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.budget_vs_spending || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Legend />
                  <Bar dataKey="budget" fill="#0f172a" name="Total Budget" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spending" fill="#0284c7" name="Total Disbursed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 2: Engineer Allocation vs Worker Payments */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-navy mb-0">Engineer Allocations vs. Worker Payments</h6>
              <span className="badge bg-light text-dark border">By Engineer</span>
            </div>
            <div style={{ height: "280px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.engineer_allocations || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Legend />
                  <Bar dataKey="allocated" fill="#38bdf8" name="Allocated Budget" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" fill="#10b981" name="Paid to Workers" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* PROJECT FINANCIAL MANAGEMENT SUMMARY (Requirement 13) */}
      <div className="card border-0 shadow-sm rounded-3 p-4 bg-white mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-navy mb-0">Project Financial Management &amp; Utilization</h5>
            <small className="text-muted">Calculated directly from project budgets, allocations, and worker payment transactions.</small>
          </div>
          <Link to="/projects" className="btn btn-sm btn-outline-primary fw-bold">
            View All Projects
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Project Code</th>
                <th>Project Name</th>
                <th>Total Budget</th>
                <th>Engineer Allocation</th>
                <th>Engineer &rarr; Workers</th>
                <th>Materials</th>
                <th>Remaining Budget</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {projectsOverview.map((pr) => (
                <tr key={pr.id}>
                  <td><span className="badge bg-light text-navy border">{pr.project_code || `PRJ-${pr.id}`}</span></td>
                  <td><strong className="text-navy">{pr.name}</strong></td>
                  <td className="fw-bold">{formatCurrency(pr.budget)}</td>
                  <td>{formatCurrency(pr.total_allocated || 0)}</td>
                  <td className="fw-bold text-success">{formatCurrency(pr.total_paid_to_workers || 0)}</td>
                  <td>{formatCurrency(pr.project_material_cost || 0)}</td>
                  <td className="fw-bold text-dark">{formatCurrency(pr.remaining_budget || 0)}</td>
                  <td style={{ minWidth: "140px" }}>
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" style={{ height: "6px" }}>
                        <div
                          className={`progress-bar ${pr.utilization_percentage > 90 ? "bg-danger" : "bg-primary"}`}
                          style={{ width: `${Math.min(100, pr.utilization_percentage)}%` }}
                        ></div>
                      </div>
                      <span className="fw-bold">{pr.utilization_percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENGINEER SUPERVISION & FINANCIAL OVERVIEW (Requirement 15 & 22) */}
      <div className="card border-0 shadow-sm rounded-3 p-4 bg-white mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-navy mb-0">Engineer Supervision &amp; Financial Ledger</h5>
            <small className="text-muted">Overview of site engineers, their assigned workforce, and budget disbursement balances.</small>
          </div>
          <Link to="/workforce" className="btn btn-sm btn-outline-primary fw-bold">
            Manage Engineers &amp; Workforce
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Engineer Code</th>
                <th>Engineer Name</th>
                <th>Assigned Project</th>
                <th>Allocated Budget</th>
                <th>Paid to Workers</th>
                <th>Remaining Balance</th>
                <th>Workers Count</th>
                <th>Pending Payments</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {engineersOverview.map((eng) => (
                <tr key={eng.id}>
                  <td><span className="badge bg-light text-navy border">{eng.engineer_code}</span></td>
                  <td><strong className="text-navy">{eng.full_name}</strong></td>
                  <td><span className="badge bg-light text-dark border">{eng.project_name || "Unassigned"}</span></td>
                  <td className="fw-bold">{formatCurrency(eng.allocated_amount || 0)}</td>
                  <td className="fw-bold text-success">{formatCurrency(eng.paid_to_workers || 0)}</td>
                  <td className="fw-bold text-info">{formatCurrency(eng.remaining_balance || 0)}</td>
                  <td><span className="badge bg-primary">{eng.worker_count || 0} Workers</span></td>
                  <td>
                    {Number(eng.pending_worker_payments) > 0 ? (
                      <span className="badge bg-warning text-dark">{formatCurrency(eng.pending_worker_payments)}</span>
                    ) : (
                      <span className="text-muted">₹0</span>
                    )}
                  </td>
                  <td><StatusBadge status={eng.status || "Active"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10-POINT PAYMENT AUDIT MODAL (Requirement 23) */}
      {showAuditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15,23,42,0.65)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: "18px", overflow: "hidden" }}>
              <div className="modal-header text-white p-4" style={{ backgroundColor: "#0f172a" }}>
                <div>
                  <span className="badge bg-info text-dark mb-1">Regulatory &amp; Executive Compliance</span>
                  <h5 className="modal-title fw-bold mb-0">10-Point Corporate Payment Audit</h5>
                  <small className="text-white-50">Direct, real-time answers to the 10 fundamental financial governance questions.</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAuditModal(false)}></button>
              </div>

              <div className="modal-body p-4 bg-light">
                {loadingAudit ? (
                  <LoadingState message="Auditing transactional tables and calculating balances..." />
                ) : auditAnswers?.answers ? (
                  <div className="row g-3 small">
                    {/* Q1 */}
                    <div className="col-md-6">
                      <div className="p-3 bg-white rounded-3 shadow-sm border h-100">
                        <strong className="text-muted d-block mb-1">1. How much is the total project budget?</strong>
                        <div className="fs-5 fw-bold text-navy">{formatCurrency(auditAnswers.answers.q1_total_project_budget)}</div>
                      </div>
                    </div>

                    {/* Q10 */}
                    <div className="col-md-6">
                      <div className="p-3 bg-white rounded-3 shadow-sm border h-100">
                        <strong className="text-muted d-block mb-1">10. How much project budget remains?</strong>
                        <div className="fs-5 fw-bold text-success">{formatCurrency(auditAnswers.answers.q10_total_project_budget_remaining)}</div>
                      </div>
                    </div>

                    {/* Q2 */}
                    <div className="col-md-6">
                      <div className="p-3 bg-white rounded-3 shadow-sm border h-100">
                        <strong className="text-muted d-block mb-1">2. How much was allocated to each engineer?</strong>
                        <ul className="list-unstyled mb-0 mt-2">
                          {auditAnswers.answers.q2_engineer_allocations.map((a, idx) => (
                            <li key={idx} className="d-flex justify-content-between border-bottom py-1">
                              <span>{a.engineer} ({a.project || "Project"}):</span>
                              <strong>{formatCurrency(a.allocated)}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Q3 */}
                    <div className="col-md-6">
                      <div className="p-3 bg-white rounded-3 shadow-sm border h-100">
                        <strong className="text-muted d-block mb-1">3. How much has each engineer received / used?</strong>
                        <ul className="list-unstyled mb-0 mt-2">
                          {auditAnswers.answers.q3_engineer_used_amount.map((a, idx) => (
                            <li key={idx} className="d-flex justify-content-between border-bottom py-1">
                              <span>{a.engineer}:</span>
                              <strong>{formatCurrency(a.received)}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Q6 */}
                    <div className="col-md-6">
                      <div className="p-3 bg-white rounded-3 shadow-sm border h-100">
                        <strong className="text-muted d-block mb-1">6. How much has each engineer paid to workers?</strong>
                        <ul className="list-unstyled mb-0 mt-2">
                          {auditAnswers.answers.q6_engineer_paid_to_workers.map((a, idx) => (
                            <li key={idx} className="d-flex justify-content-between border-bottom py-1">
                              <span>{a.engineer}:</span>
                              <strong className="text-success">{formatCurrency(a.paid)}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Q4 */}
                    <div className="col-md-6">
                      <div className="p-3 bg-white rounded-3 shadow-sm border h-100">
                        <strong className="text-muted d-block mb-1">4. How many workers does each engineer manage?</strong>
                        <ul className="list-unstyled mb-0 mt-2">
                          {auditAnswers.answers.q4_worker_count_per_engineer.map((a, idx) => (
                            <li key={idx} className="d-flex justify-content-between border-bottom py-1">
                              <span>{a.engineer}:</span>
                              <span className="badge bg-primary">{a.count} Workers</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Q7 */}
                    <div className="col-md-6">
                      <div className="p-3 bg-white rounded-3 shadow-sm border h-100">
                        <strong className="text-muted d-block mb-1">7. Fully Paid Transactions:</strong>
                        <div className="fs-5 fw-bold text-success">{auditAnswers.answers.q7_fully_paid_workers_count} Disbursed Records</div>
                      </div>
                    </div>

                    {/* Q9 */}
                    <div className="col-md-6">
                      <div className="p-3 bg-white rounded-3 shadow-sm border h-100">
                        <strong className="text-muted d-block mb-1">9. How much remains unpaid?</strong>
                        <div className="fs-5 fw-bold text-danger">{formatCurrency(auditAnswers.answers.q9_total_unpaid_balance)}</div>
                      </div>
                    </div>

                    {/* Q8: Workers with Pending Payments */}
                    <div className="col-12">
                      <div className="p-3 bg-white rounded-3 shadow-sm border">
                        <strong className="text-muted d-block mb-2">8. Workers with Pending / Unpaid Balances:</strong>
                        {auditAnswers.answers.q8_workers_with_pending_payments.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-sm table-hover mb-0">
                              <thead>
                                <tr>
                                  <th>Worker</th>
                                  <th>Trade</th>
                                  <th>Site Engineer</th>
                                  <th>Project</th>
                                  <th>Unpaid Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {auditAnswers.answers.q8_workers_with_pending_payments.map((w) => (
                                  <tr key={w.id}>
                                    <td><strong>{w.name}</strong> ({w.worker_code})</td>
                                    <td>{w.trade}</td>
                                    <td>{w.engineer_name}</td>
                                    <td>{w.project_name}</td>
                                    <td className="text-danger fw-bold">{formatCurrency(w.total_unpaid_balance)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-success small">✓ All recorded worker payments are fully settled with zero pending arrears.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning">Unable to load audit report.</div>
                )}
              </div>

              <div className="modal-footer bg-white border-top p-3">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowAuditModal(false)}>
                  Close Audit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Budget Modal */}
      <AllocationModal
        show={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
        onAllocationSaved={fetchDashboardData}
        projects={projectsOverview}
        engineers={engineersOverview}
      />
    </div>
  );
}
