import React, { useState, useEffect } from "react";
import { progressService } from "../services/progressService";
import { projectService } from "../services/projectService";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { formatDate, formatDateForInput } from "../utils/dateFormatter";
import { formatValue, formatPercent } from "../utils/currencyFormatter";

export default function DailyProgress() {
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentReport, setCurrentReport] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    project: "",
    work_completed: "",
    progress_percent: 15,
    workers_deployed: 25,
    status: "In Progress",
    remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [progRes, projRes] = await Promise.all([
        progressService.getProgress().catch(() => ({ progress: [] })),
        projectService.getProjects().catch(() => ({ projects: [] })),
      ]);

      if (progRes.progress) setReports(progRes.progress);
      if (projRes.projects) setProjects(projRes.projects);
    } catch (err) {
      toastError("Load Error", "Unable to load site progress journals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setForm({
      date: new Date().toISOString().split("T")[0],
      project: projects[0]?.name || "",
      work_completed: "",
      progress_percent: 10,
      workers_deployed: 20,
      status: "In Progress",
      remarks: "",
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setModalMode("edit");
    setCurrentReport(item);
    setForm({
      date: formatDateForInput(item.date),
      project: item.project || "",
      work_completed: item.work_completed || "",
      progress_percent: Number(item.progress_percent) || 0,
      workers_deployed: item.workers_deployed || 0,
      status: item.status || "In Progress",
      remarks: item.remarks || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.project || !form.work_completed) {
      toastError("Missing Fields", "Please complete all required progress fields.");
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await progressService.createProgress(form);
        if (res.success) {
          toastSuccess("Logged", "Daily site progress report saved.");
          setShowModal(false);
          loadData();
        }
      } else {
        const res = await progressService.updateProgress(currentReport.id, form);
        if (res.success) {
          toastSuccess("Updated", "Progress report updated.");
          setShowModal(false);
          loadData();
        }
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to save progress report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await progressService.deleteProgress(deleteId);
      if (res.success) {
        toastSuccess("Deleted", "Progress report removed.");
        setDeleteId(null);
        loadData();
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to delete progress report.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const totalReports = reports.length;
  const avgProgress =
    totalReports > 0
      ? reports.reduce((sum, r) => sum + (Number(r.progress_percent) || 0), 0) / totalReports
      : 0;
  const completedReports = reports.filter(
    (r) => Number(r.progress_percent) >= 100 || (r.status || "").toLowerCase() === "completed"
  ).length;
  const latestReport = reports[0];

  return (
    <div>
      <PageHeader
        title="Daily Site Progress Reports"
        subtitle="Log construction activity output, milestone execution percentages, deployed crew, and site remarks."
        actions={
          <button type="button" className="btn-saas-primary" onClick={openCreateModal}>
            <i className="bi bi-plus-circle"></i> Log Progress Report
          </button>
        }
      />

      {/* 4 Cards: Total Reports, Average Progress, Completed, Latest Report */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-journal-check"
            label="Total Reports"
            value={String(totalReports).padStart(2, "0")}
            footer="Submitted Site Logs"
            colorBg="#eff6ff"
            colorIcon="#3b82f6"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-percent"
            label="Average Progress"
            value={formatPercent(avgProgress)}
            footer="Across Logged Sites"
            colorBg="#ecfdf5"
            colorIcon="#10b981"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-check-circle-fill"
            label="Completed Milestones"
            value={String(completedReports).padStart(2, "0")}
            footer="100% Target Met"
            colorBg="#f3e8ff"
            colorIcon="#8b5cf6"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-clock-history"
            label="Latest Report"
            value={latestReport ? formatDate(latestReport.date) : "None"}
            footer={formatValue(latestReport?.project, "Awaiting Submission")}
            colorBg="#e8f5f8"
            colorIcon="#0fa8c4"
          />
        </div>
      </div>

      <div className="saas-card mb-4">
        {loading ? (
          <LoadingState message="Loading site progress records..." />
        ) : reports.length === 0 ? (
          <EmptyState
            icon="bi-graph-up-arrow"
            title="No progress reports"
            message="No daily progress logs have been filed yet."
            actionLabel="Log Daily Progress"
            onAction={openCreateModal}
          />
        ) : (
          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Work Completed</th>
                  <th>Progress</th>
                  <th>Workers Deployed</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const pVal = Math.max(0, Math.min(100, Number(r.progress_percent) || 0));
                  return (
                    <tr key={r.id}>
                      <td className="fw-semibold">{formatDate(r.date)}</td>
                      <td>
                        <strong className="text-navy">{r.project}</strong>
                      </td>
                      <td>
                        <div className="text-navy" style={{ maxWidth: "320px" }}>
                          {r.work_completed}
                        </div>
                        {r.remarks && <small className="text-muted d-block mt-1">Note: {r.remarks}</small>}
                      </td>
                      <td style={{ minWidth: "130px" }}>
                        <div className="d-flex justify-content-between small fw-bold mb-1">
                          <span>{pVal}%</span>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div className="progress-bar bg-info" style={{ width: `${pVal}%` }}></div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-navy border">
                          {r.workers_deployed || 0} Crew
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Edit Report"
                            onClick={() => openEditModal(r)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Delete Report"
                            onClick={() => setDeleteId(r.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                  {modalMode === "create" ? "File Daily Progress Report" : `Edit Progress Log: ${currentReport?.project}`}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">REPORT DATE *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">PROJECT *</label>
                      {projects.length > 0 ? (
                        <select
                          className="form-select"
                          value={form.project}
                          onChange={(e) => setForm({ ...form, project: e.target.value })}
                          required
                        >
                          <option value="">Select Project</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Project name"
                          value={form.project}
                          onChange={(e) => setForm({ ...form, project: e.target.value })}
                          required
                        />
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">WORK COMPLETED TODAY *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="e.g. Completed second stage rebar tying and column shuttering..."
                        value={form.work_completed}
                        onChange={(e) => setForm({ ...form, work_completed: e.target.value })}
                        required
                      ></textarea>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">
                        PROGRESS PERCENT: {form.progress_percent}%
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        value={form.progress_percent}
                        onChange={(e) => setForm({ ...form, progress_percent: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">WORKERS DEPLOYED</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 24"
                        value={form.workers_deployed}
                        onChange={(e) => setForm({ ...form, workers_deployed: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Delayed">Delayed</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">ENGINEER REMARKS</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Concrete mix cube tests passed"
                        value={form.remarks}
                        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-saas-primary btn-sm" disabled={submitting}>
                    {submitting ? "Saving..." : modalMode === "create" ? "Save Log" : "Save Changes"}
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
        title="Delete Progress Report"
        message="Are you sure you want to permanently remove this daily progress report?"
        confirmLabel="Confirm Delete"
        confirmVariant="danger"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

