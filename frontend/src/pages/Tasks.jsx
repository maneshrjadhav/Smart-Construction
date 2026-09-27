import React, { useState, useEffect } from "react";
import { taskService } from "../services/taskService";
import { projectService } from "../services/projectService";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { formatDate, formatDateForInput } from "../utils/dateFormatter";
import { formatValue } from "../utils/currencyFormatter";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentTask, setCurrentTask] = useState(null);
  const [form, setForm] = useState({
    task_name: "",
    project: "",
    assigned_to: "",
    due_date: "",
    priority: "Medium",
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
      const [tasksRes, projRes] = await Promise.all([
        taskService.getTasks().catch(() => ({ tasks: [] })),
        projectService.getProjects().catch(() => ({ projects: [] })),
      ]);

      if (tasksRes.tasks) setTasks(tasksRes.tasks);
      if (projRes.projects) setProjects(projRes.projects);
    } catch (err) {
      toastError("Load Error", "Failed to load tasks from server.");
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
      task_name: "",
      project: projects[0]?.name || "",
      assigned_to: "",
      due_date: new Date().toISOString().split("T")[0],
      priority: "Medium",
      status: "Pending",
    });
    setShowModal(true);
  };

  const openEditModal = (t) => {
    setModalMode("edit");
    setCurrentTask(t);
    setForm({
      task_name: t.task_name || "",
      project: t.project || "",
      assigned_to: t.assigned_to || "",
      due_date: formatDateForInput(t.due_date),
      priority: t.priority || "Medium",
      status: t.status || "Pending",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.task_name || !form.project || !form.assigned_to || !form.due_date) {
      toastError("Validation Error", "Please fill in all required task fields.");
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await taskService.createTask(form);
        if (res.success) {
          toastSuccess("Success", "Task created successfully.");
          setShowModal(false);
          loadData();
        }
      } else {
        const res = await taskService.updateTask(currentTask.id, form);
        if (res.success) {
          toastSuccess("Success", "Task updated successfully.");
          setShowModal(false);
          loadData();
        }
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to save task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await taskService.deleteTask(deleteId);
      if (res.success) {
        toastSuccess("Deleted", "Task deleted successfully.");
        setDeleteId(null);
        loadData();
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to delete task.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      (t.task_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.project || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assigned_to || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (t.status || "").toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Tasks &amp; Site Assignments"
        subtitle="Coordinate construction milestones, trade work packages, and safety compliance tasks."
        actions={
          <button type="button" className="btn-saas-primary" onClick={openCreateModal}>
            <i className="bi bi-plus-circle"></i> Add Task
          </button>
        }
      />

      <div className="saas-card mb-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search tasks by title, project or assignee..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "ALL", label: "All Statuses" },
            { value: "PENDING", label: "Pending" },
            { value: "IN PROGRESS", label: "In Progress" },
            { value: "COMPLETED", label: "Completed" },
          ]}
        />

        {loading ? (
          <LoadingState message="Loading tasks..." />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon="bi-check2-square"
            title="No tasks found"
            message="No jobsite tasks matching your criteria have been scheduled."
            actionLabel="Add Task"
            onAction={openCreateModal}
          />
        ) : (
          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong className="text-navy">{t.task_name}</strong>
                    </td>
                    <td>
                      <span className="badge bg-light text-navy border">
                        {formatValue(t.project)}
                      </span>
                    </td>
                    <td>{formatValue(t.assigned_to)}</td>
                    <td className="fw-semibold">
                      {/* Formatted Date requirement: 03 Dec 2026 */}
                      {formatDate(t.due_date)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          (t.priority || "").toLowerCase() === "high"
                            ? "bg-danger-subtle text-danger"
                            : (t.priority || "").toLowerCase() === "low"
                            ? "bg-info-subtle text-info"
                            : "bg-warning-subtle text-warning"
                        }`}
                      >
                        {t.priority || "Medium"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Edit Task"
                          onClick={() => openEditModal(t)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Delete Task"
                          onClick={() => setDeleteId(t.id)}
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
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(8, 43, 58, 0.6)", backdropFilter: "blur(4px)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-navy">
                  {modalMode === "create" ? "Add New Site Task" : `Edit Task: ${currentTask?.task_name}`}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">TASK DESCRIPTION *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Electrical conduit rough-in for 3rd Floor"
                        value={form.task_name}
                        onChange={(e) => setForm({ ...form, task_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
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
                      <label className="form-label small fw-bold text-muted">ASSIGNED CREW / WORKER *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Electrical Team A"
                        value={form.assigned_to}
                        onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">DUE DATE *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">PRIORITY</label>
                      <select
                        className="form-select"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-saas-primary btn-sm" disabled={submitting}>
                    {submitting ? "Saving..." : modalMode === "create" ? "Create Task" : "Save Changes"}
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
        title="Delete Site Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Confirm Delete"
        confirmVariant="danger"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

