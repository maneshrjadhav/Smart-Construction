import React, { useState, useEffect } from "react";
import { paymentService } from "../services/paymentService";
import { useToast } from "../context/ToastContext";
import { formatCurrency } from "../utils/currencyFormatter";

export default function AllocationModal({ show, onClose, onAllocationSaved, projects = [], engineers = [] }) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [projectId, setProjectId] = useState("");
  const [engineerId, setEngineerId] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState("");
  const [amountPaidToEngineer, setAmountPaidToEngineer] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
    if (engineers.length > 0 && !engineerId) {
      setEngineerId(engineers[0].id);
    }
  }, [projects, engineers]);

  if (!show) return null;

  const selectedProject = projects.find((p) => String(p.id) === String(projectId));
  const selectedEngineer = engineers.find((e) => String(e.id) === String(engineerId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId || !engineerId || !allocatedAmount) {
      toastError("Validation Error", "Project, Engineer, and Allocated Amount are required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await paymentService.createAllocation({
        project_id: projectId,
        engineer_id: engineerId,
        allocated_amount: Number(allocatedAmount),
        amount_paid_to_engineer: amountPaidToEngineer ? Number(amountPaidToEngineer) : Number(allocatedAmount),
        notes
      });

      if (res.success) {
        toastSuccess("Allocation Saved", res.message || "Budget allocated successfully.");
        if (onAllocationSaved) onAllocationSaved();
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to allocate budget.";
      toastError("Allocation Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15,23,42,0.6)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
          {/* Header */}
          <div className="modal-header text-white p-4" style={{ backgroundColor: "#0f172a" }}>
            <div>
              <span className="badge bg-info text-dark mb-1">Project Financial Governance</span>
              <h5 className="modal-title fw-bold mb-0">Allocate Budget to Engineer</h5>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={submitting}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-light">
              <div className="bg-white p-3 rounded-3 shadow-sm border mb-3">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Select Project</label>
                  <select
                    className="form-select"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.projectCode || `PRJ-${p.id}`}) — Budget: {formatCurrency(p.budget)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Select Site Engineer</label>
                  <select
                    className="form-select"
                    value={engineerId}
                    onChange={(e) => setEngineerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Engineer --</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.full_name} ({eng.engineer_code}) — {eng.designation || "Site Engineer"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Budget Allocated to Engineer (₹)</label>
                  <input
                    type="number"
                    className="form-control fw-bold fs-5 text-navy"
                    placeholder="e.g. 500000"
                    value={allocatedAmount}
                    onChange={(e) => {
                      setAllocatedAmount(e.target.value);
                      if (!amountPaidToEngineer) setAmountPaidToEngineer(e.target.value);
                    }}
                    required
                  />
                  <div className="form-text small">
                    This forms the spending limit from which the engineer disburses payments to workers.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Amount Transferred / Paid to Engineer (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 500000"
                    value={amountPaidToEngineer}
                    onChange={(e) => setAmountPaidToEngineer(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label small fw-bold">Allocation Notes</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Purpose, phase, or remarks for this financial disbursement..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {selectedProject && (
                <div className="p-3 bg-white rounded-3 border small">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Project Total Budget:</span>
                    <strong className="text-navy">{formatCurrency(selectedProject.budget)}</strong>
                  </div>
                  {allocatedAmount && (
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Proposed Allocation:</span>
                      <strong className="text-success">{formatCurrency(allocatedAmount)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer bg-white border-top p-3 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4 fw-bold"
                style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Authorize Allocation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

