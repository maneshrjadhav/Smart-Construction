import React, { useState, useEffect } from "react";
import { issueService } from "../services/issueService";
import { projectService } from "../services/projectService";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { formatDate, formatDateForInput } from "../utils/dateFormatter";
import { formatValue } from "../utils/currencyFormatter";

export default function SiteIssues() {
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentIssue, setCurrentIssue] = useState(null);
  const [form, setForm] = useState({
    title: "",
    project: "",
    reported_by: "",
    priority: "Medium",
    status: "Open",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [issRes, projRes] = await Promise.all([
        issueService.getIssues().catch(() => ({ issues: [] })),
        projectService.getProjects().catch(() => ({ projects: [] })),
      ]);

      if (issRes.issues) setIssues(issRes.issues);
      if (projRes.projects) setProjects(projRes.projects);
    } catch (err) {
      toastError("Load Error", "Unable to load site issue incidents.");
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
      title: "",
      project: projects[0]?.name || "",
      reported_by: "",
      priority: "Medium",
      status: "Open",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setModalMode("edit");
    setCurrentIssue(item);
    setForm({
      title: item.title || "",
      project: item.project || "",
      reported_by: item.reported_by || "",
      priority: item.priority || "Medium",
      status: item.status || "Open",
      date: formatDateForInput(item.date),
      description: item.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.project || !form.reported_by || !form.date || !form.description) {
      toastError("Validation Error", "Please fill in all required issue fields.");
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await issueService.createIssue(form);
        if (res.success) {
          toastSuccess("Reported", "Site issue registered.");
          setShowModal(false);
          loadData();
        }
      } else {
        const res = await issueService.updateIssue(currentIssue.id, form);
        if (res.success) {
          toastSuccess("Updated", "Issue record updated.");
          setShowModal(false);
          loadData();
        }
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to save issue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await issueService.deleteIssue(deleteId);
      if (res.success) {
        toastSuccess("Deleted", "Issue record removed.");
        setDeleteId(null);
        loadData();
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to delete issue.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const totalIssues = issues.length;
  const openCount = issues.filter((i) => (i.status || "").toLowerCase() === "open").length;
  const inProgressCount = issues.filter((i) => (i.status || "").toLowerCase() === "in progress").length;
  const resolvedCount = issues.filter((i) => (i.status || "").toLowerCase() === "resolved").length;

  const filteredIssues = issues.filter((i) => {
    const matchesSearch =
      (i.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.project || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.reported_by || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || (i.status || "").toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Site Issues &amp; Incident Log"
        subtitle="Report jobsite hazards, structural defects, safety non-compliances, and mechanical outages."
        actions={
          <button type="button" className="btn-saas-primary" onClick={openCreateModal}>
            <i className="bi bi-plus-circle"></i> Log Site Issue
          </button>
        }
      />

      {/* 4 Cards: Total Issues, Open, In Progress, Resolved */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-shield-exclamation"
            label="Total Issues"
            value={String(totalIssues).padStart(2, "0")}
            footer="Logged Incidents"
            colorBg="#eff6ff"
            colorIcon="#3b82f6"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-exclamation-triangle-fill"
            label="Open"
            value={String(openCount).padStart(2, "0")}
            footer="Urgent Attention"
            colorBg="#fee2e2"
            colorIcon="#ef4444"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-hourglass-split"
            label="In Progress"
            value={String(inProgressCount).padStart(2, "0")}
            footer="Remediation Underway"
            colorBg="#fef3c7"
            colorIcon="#f59e0b"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-check-circle-fill"
            label="Resolved"
            value={String(resolvedCount).padStart(2, "0")}
            footer="Inspected & Fixed"
            colorBg="#ecfdf5"
            colorIcon="#10b981"
          />
        </div>
      </div>

      <div className="saas-card mb-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search issues by title, project or reporter..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "ALL", label: "All Statuses" },
            { value: "OPEN", label: "Open" },
            { value: "IN PROGRESS", label: "In Progress" },
            { value: "RESOLVED", label: "Resolved" },
          ]}
        />

        {loading ? (
          <LoadingState message="Loading site incidents..." />
        ) : filteredIssues.length === 0 ? (
          <EmptyState
            icon="bi-shield-check"
            title="No issues found"
            message="No active safety hazards or site issues match your filter."
            actionLabel="Report Issue"
            onAction={openCreateModal}
          />
        ) : (
          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Project</th>
                  <th>Reported By</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Logged</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <strong className="d-block text-navy">{i.title}</strong>
                      <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: "250px" }}>
                        {i.description}
                      </small>
                    </td>
                    <td>
                      <span className="badge bg-light text-navy border">{formatValue(i.project)}</span>
                    </td>
                    <td>{formatValue(i.reported_by)}</td>
                    <td>
                      <span
                        className={`badge ${
                          (i.priority || "").toLowerCase() === "high" ||
                          (i.priority || "").toLowerCase() === "critical"
                            ? "bg-danger-subtle text-danger"
                            : (i.priority || "").toLowerCase() === "low"
                            ? "bg-info-subtle text-info"
                            : "bg-warning-subtle text-warning"
                        }`}
                      >
                        {i.priority || "Medium"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="small">{formatDate(i.date)}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Edit Issue"
                          onClick={() => openEditModal(i)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Delete Issue"
                          onClick={() => setDeleteId(i.id)}
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
                  {modalMode === "create" ? "Report Jobsite Hazard / Issue" : `Edit Issue: ${currentIssue?.title}`}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">ISSUE TITLE *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Scaffolding clamp slippage on Grid 4"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
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

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">REPORTED BY *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Safety Inspector Kumar"
                        value={form.reported_by}
                        onChange={(e) => setForm({ ...form, reported_by: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">PRIORITY</label>
                      <select
                        className="form-select"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">DATE *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">DETAILED DESCRIPTION *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Describe exact location, observed defect, and recommended corrective action..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-saas-primary btn-sm" disabled={submitting}>
                    {submitting ? "Submitting..." : modalMode === "create" ? "Submit Issue" : "Save Changes"}
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
        title="Delete Site Issue"
        message="Are you sure you want to permanently delete this issue record?"
        confirmLabel="Confirm Delete"
        confirmVariant="danger"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

