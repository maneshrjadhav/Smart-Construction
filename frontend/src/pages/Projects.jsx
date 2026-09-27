import React, { useState, useEffect } from "react";
import { projectService } from "../services/projectService";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isEngineer } from "../utils/permissions";
import { formatCurrency, formatValue } from "../utils/currencyFormatter";
import { formatDate, formatDateForInput } from "../utils/dateFormatter";

export default function Projects() {
  const { currentUser } = useAuth();
  const userIsAdmin = isAdmin(currentUser);
  const userIsEngineer = isEngineer(currentUser);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit' | 'view'
  const [currentProject, setCurrentProject] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    engineer: "",
    budget: "",
    startDate: "",
    completionDate: "",
    progress: 0,
    status: "In Progress",
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      if (data.success && data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      toastError("Load Error", "Unable to load projects from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      name: "",
      location: "",
      engineer: "",
      budget: "",
      startDate: "",
      completionDate: "",
      progress: 0,
      status: "In Progress",
    });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setModalMode("edit");
    setCurrentProject(p);
    setFormData({
      name: p.name || "",
      location: p.location || "",
      engineer: p.engineer || "",
      budget: p.budget || "",
      startDate: formatDateForInput(p.startDate || p.start_date),
      completionDate: formatDateForInput(p.completionDate || p.completion_date),
      progress: p.progress || 0,
      status: p.status || "In Progress",
    });
    setShowModal(true);
  };

  const openViewModal = (p) => {
    setModalMode("view");
    setCurrentProject(p);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toastError("Validation Error", "Project name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await projectService.createProject(formData);
        if (res.success) {
          toastSuccess("Success", "Project created successfully.");
          setShowModal(false);
          loadProjects();
        }
      } else if (modalMode === "edit") {
        const res = await projectService.updateProject(currentProject.id, formData);
        if (res.success) {
          toastSuccess("Success", "Project updated successfully.");
          setShowModal(false);
          loadProjects();
        }
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to save project.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await projectService.deleteProject(deleteId);
      if (res.success) {
        toastSuccess("Deleted", "Project deleted successfully.");
        setDeleteId(null);
        loadProjects();
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to delete project.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered list
  const baseProjects = userIsEngineer
    ? projects.filter(
        (p) =>
          p.id === currentUser?.projectId ||
          (p.engineer || "").toLowerCase() === (currentUser?.name || "").toLowerCase()
      )
    : projects;

  const filteredProjects = baseProjects.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.projectCode || p.project_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.engineer || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (p.status || "").toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title={userIsEngineer ? "My Assigned Project" : "Project Management"}
        subtitle={
          userIsEngineer
            ? "View assigned jobsite specifications, capital allocation, and milestone progress."
            : "Manage construction job sites, allocated capital, scheduled milestones, and site progress."
        }
        actions={
          userIsAdmin ? (
            <button type="button" className="btn-saas-primary" onClick={openCreateModal}>
              <i className="bi bi-plus-circle"></i> Add Project
            </button>
          ) : null
        }
      />

      <div className="saas-card mb-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by project name, code, location or engineer..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "ALL", label: "All Statuses" },
            { value: "IN PROGRESS", label: "In Progress" },
            { value: "COMPLETED", label: "Completed" },
            { value: "PENDING", label: "Pending" },
            { value: "PLANNING", label: "Planning" },
          ]}
        />

        {loading ? (
          <LoadingState message="Loading projects..." />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon="bi-buildings"
            title="No projects found"
            message="No construction projects match your search criteria or none have been added yet."
            actionLabel="Add Project"
            onAction={openCreateModal}
          />
        ) : (
          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Project Name</th>
                  <th>Location</th>
                  <th>Site Engineer</th>
                  <th>Budget</th>
                  <th>Timeline</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => {
                  const prog = Math.max(0, Math.min(100, Number(p.progress) || 0));
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="badge bg-light text-navy border fw-bold">
                          {p.projectCode || p.project_code || `PRJ-${String(p.id).padStart(3, "0")}`}
                        </span>
                      </td>
                      <td>
                        <strong className="text-navy">{p.name}</strong>
                      </td>
                      <td>{formatValue(p.location)}</td>
                      <td>
                        <span className="badge bg-info-subtle text-info fw-semibold">
                          {formatValue(p.engineer, "Unassigned")}
                        </span>
                      </td>
                      <td className="fw-bold">{formatCurrency(p.budget)}</td>
                      <td className="small text-muted">
                        <div>Start: {formatDate(p.startDate || p.start_date)}</div>
                        <div>End: {formatDate(p.completionDate || p.completion_date)}</div>
                      </td>
                      <td style={{ minWidth: "120px" }}>
                        <div className="d-flex justify-content-between small fw-bold mb-1">
                          <span>{prog}%</span>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className="progress-bar bg-info"
                            style={{ width: `${prog}%` }}
                          ></div>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="View Details"
                            onClick={() => openViewModal(p)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {userIsAdmin && (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                title="Edit Project"
                                onClick={() => openEditModal(p)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                title="Delete Project"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </>
                          )}
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

      {/* Create / Edit / View Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(8, 43, 58, 0.6)", backdropFilter: "blur(4px)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-navy">
                  {modalMode === "create"
                    ? "Add New Construction Project"
                    : modalMode === "edit"
                    ? `Edit Project: ${currentProject?.name}`
                    : `Project Details: ${currentProject?.name}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              {modalMode === "view" ? (
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold">PROJECT CODE</label>
                      <p className="fw-bold">{currentProject?.projectCode || currentProject?.project_code}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold">PROJECT NAME</label>
                      <p className="fw-bold">{currentProject?.name}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold">LOCATION</label>
                      <p>{formatValue(currentProject?.location)}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold">ASSIGNED SITE ENGINEER</label>
                      <p>{formatValue(currentProject?.engineer)}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold">BUDGET</label>
                      <p className="fw-bold text-success">{formatCurrency(currentProject?.budget)}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold">CURRENT STATUS</label>
                      <div>
                        <StatusBadge status={currentProject?.status} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold">START DATE</label>
                      <p>{formatDate(currentProject?.startDate || currentProject?.start_date)}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold">COMPLETION TARGET</label>
                      <p>{formatDate(currentProject?.completionDate || currentProject?.completion_date)}</p>
                    </div>
                    <div className="col-12">
                      <label className="text-muted small fw-bold">PROGRESS ({currentProject?.progress}%)</label>
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className="progress-bar bg-info"
                          style={{ width: `${currentProject?.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-md-8">
                        <label className="form-label small fw-bold text-muted">
                          PROJECT NAME <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Skyline Heights Tower A"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted">STATUS</label>
                        <select
                          className="form-select"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Pending">Pending</option>
                          <option value="Planning">Planning</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">LOCATION</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Sector 62, Noida"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">SITE ENGINEER</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Vikram Sharma"
                          value={formData.engineer}
                          onChange={(e) => setFormData({ ...formData, engineer: e.target.value })}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">BUDGET (INR ₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 5000000"
                          value={formData.budget}
                          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">
                          PROGRESS PERCENT ({formData.progress}%)
                        </label>
                        <input
                          type="range"
                          className="form-range"
                          min="0"
                          max="100"
                          value={formData.progress}
                          onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">START DATE</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">COMPLETION DATE</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.completionDate}
                          onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer border-top px-4 py-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-saas-primary btn-sm" disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span> Saving...
                        </>
                      ) : modalMode === "create" ? (
                        "Create Project"
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete Construction Project"
        message="Are you sure you want to delete this project? All associated assignments, logs and progress will be detached."
        confirmLabel="Confirm Delete"
        confirmVariant="danger"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

