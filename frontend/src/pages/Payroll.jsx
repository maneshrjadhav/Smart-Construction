import React, { useState, useEffect } from "react";
import { payrollService } from "../services/payrollService";
import { workerService } from "../services/workerService";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { formatCurrency, formatValue } from "../utils/currencyFormatter";

export default function Payroll() {
  const [payroll, setPayroll] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentPayroll, setCurrentPayroll] = useState(null);
  const [form, setForm] = useState({
    worker_name: "",
    salary_month: "September 2026",
    working_days: 26,
    daily_wage: 750,
    total_salary: 19500,
    status: "Pending",
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, workRes] = await Promise.all([
        payrollService.getPayroll().catch(() => ({ payroll: [] })),
        workerService.getWorkers().catch(() => ({ workers: [] })),
      ]);

      if (payRes.payroll) setPayroll(payRes.payroll);
      if (workRes.workers) setWorkers(workRes.workers);
    } catch (err) {
      toastError("Load Error", "Unable to load payroll statements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update total salary when working days or daily wage changes
  const handleDaysOrWageChange = (days, wage) => {
    const d = Number(days) || 0;
    const w = Number(wage) || 0;
    setForm((prev) => ({
      ...prev,
      working_days: d,
      daily_wage: w,
      total_salary: d * w,
    }));
  };

  const openCreateModal = () => {
    setModalMode("create");
    const initialWorker = workers[0];
    const initialWage = initialWorker ? Number(initialWorker.daily_wage) || 750 : 750;
    const days = 26;
    setForm({
      worker_name: initialWorker?.name || "",
      salary_month: "September 2026",
      working_days: days,
      daily_wage: initialWage,
      total_salary: days * initialWage,
      status: "Pending",
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setModalMode("edit");
    setCurrentPayroll(item);
    setForm({
      worker_name: item.worker_name || "",
      salary_month: item.salary_month || "",
      working_days: item.working_days || 0,
      daily_wage: item.daily_wage || 0,
      total_salary: item.total_salary || 0,
      status: item.status || "Pending",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.worker_name || !form.salary_month || !form.working_days || !form.daily_wage) {
      toastError("Missing Fields", "Please complete all payroll fields.");
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await payrollService.createPayroll(form);
        if (res.success) {
          toastSuccess("Success", "Payroll record registered.");
          setShowModal(false);
          loadData();
        }
      } else {
        const res = await payrollService.updatePayroll(currentPayroll.id, form);
        if (res.success) {
          toastSuccess("Success", "Payroll record updated.");
          setShowModal(false);
          loadData();
        }
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to save payroll.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await payrollService.deletePayroll(deleteId);
      if (res.success) {
        toastSuccess("Deleted", "Payroll record removed.");
        setDeleteId(null);
        loadData();
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to delete payroll record.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const totalRecords = payroll.length;
  const totalSalary = payroll.reduce((sum, p) => sum + (Number(p.total_salary) || 0), 0);
  const pendingCount = payroll.filter((p) => (p.status || "").toLowerCase() === "pending").length;
  const paidCount = payroll.filter((p) => (p.status || "").toLowerCase() === "paid").length;

  return (
    <div>
      <PageHeader
        title="Workforce Payroll &amp; Compensation"
        subtitle="Manage verified wage disbursements, monthly settlements, and worker compensation audit logs."
        actions={
          <button type="button" className="btn-saas-primary" onClick={openCreateModal}>
            <i className="bi bi-plus-circle"></i> Add Payroll Entry
          </button>
        }
      />

      {/* 4 Cards: Total Records, Total Salary, Pending, Paid */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-file-text-fill"
            label="Total Records"
            value={String(totalRecords).padStart(2, "0")}
            footer="Logged Statements"
            colorBg="#eff6ff"
            colorIcon="#3b82f6"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-cash-coin"
            label="Total Salary"
            value={formatCurrency(totalSalary)}
            footer="Aggregate Disbursed & Pending"
            colorBg="#ecfdf5"
            colorIcon="#10b981"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-hourglass-split"
            label="Pending"
            value={String(pendingCount).padStart(2, "0")}
            footer="Awaiting Approval"
            colorBg="#fef3c7"
            colorIcon="#f59e0b"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-check2-circle"
            label="Paid"
            value={String(paidCount).padStart(2, "0")}
            footer="Disbursed to Workers"
            colorBg="#e8f5f8"
            colorIcon="#0fa8c4"
          />
        </div>
      </div>

      <div className="saas-card mb-4">
        {loading ? (
          <LoadingState message="Loading payroll ledger..." />
        ) : payroll.length === 0 ? (
          <EmptyState
            icon="bi-wallet2"
            title="No payroll records found"
            message="No payroll records have been generated yet."
            actionLabel="Add Payroll Entry"
            onAction={openCreateModal}
          />
        ) : (
          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Salary Month</th>
                  <th>Working Days</th>
                  <th>Daily Wage</th>
                  <th>Total Salary</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong className="text-navy">{p.worker_name}</strong>
                    </td>
                    <td>{p.salary_month}</td>
                    <td>{p.working_days} Days</td>
                    <td>{formatCurrency(p.daily_wage)} / day</td>
                    <td>
                      {/* Currency formatting: ₹50,000, never NaN/undefined */}
                      <strong className="text-success">{formatCurrency(p.total_salary)}</strong>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Edit Record"
                          onClick={() => openEditModal(p)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Delete Record"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(8, 43, 58, 0.6)", backdropFilter: "blur(4px)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-navy">
                  {modalMode === "create" ? "Generate Payroll Entry" : `Edit Payroll: ${currentPayroll?.worker_name}`}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">WORKER NAME *</label>
                      {workers.length > 0 ? (
                        <select
                          className="form-select"
                          value={form.worker_name}
                          onChange={(e) => {
                            const selectedW = workers.find((w) => w.name === e.target.value);
                            const wage = selectedW ? Number(selectedW.daily_wage) || 750 : form.daily_wage;
                            setForm({
                              ...form,
                              worker_name: e.target.value,
                              daily_wage: wage,
                              total_salary: form.working_days * wage,
                            });
                          }}
                          required
                        >
                          <option value="">Select Worker</option>
                          {workers.map((w) => (
                            <option key={w.id} value={w.name}>
                              {w.name} ({w.role} - ₹{w.daily_wage}/day)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Ramesh Patel"
                          value={form.worker_name}
                          onChange={(e) => setForm({ ...form, worker_name: e.target.value })}
                          required
                        />
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">SALARY MONTH *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. September 2026"
                        value={form.salary_month}
                        onChange={(e) => setForm({ ...form, salary_month: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">WORKING DAYS *</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max="31"
                        value={form.working_days}
                        onChange={(e) => handleDaysOrWageChange(e.target.value, form.daily_wage)}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">DAILY WAGE (INR ₹) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.daily_wage}
                        onChange={(e) => handleDaysOrWageChange(form.working_days, e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 p-3 bg-light rounded-3 border">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="small text-muted fw-bold">CALCULATED SALARY:</span>
                        <h4 className="fw-bolder text-success m-0">{formatCurrency(form.total_salary)}</h4>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-saas-primary btn-sm" disabled={submitting}>
                    {submitting ? "Saving..." : modalMode === "create" ? "Save Record" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete Payroll Record"
        message="Are you sure you want to remove this payroll record?"
        confirmLabel="Confirm Delete"
        confirmVariant="danger"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

