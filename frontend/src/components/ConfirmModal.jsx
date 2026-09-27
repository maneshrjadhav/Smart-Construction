import React from "react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmLabel = "Delete",
  confirmVariant = "danger",
  onConfirm,
  onClose,
  isProcessing = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(8, 43, 58, 0.5)", backdropFilter: "blur(4px)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: "14px" }}>
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold" style={{ fontSize: "16px", color: "var(--text-navy)" }}>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isProcessing}
            ></button>
          </div>
          <div className="modal-body py-3">
            <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
              {message}
            </p>
          </div>
          <div className="modal-footer border-top-0 pt-0">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              disabled={isProcessing}
              style={{ fontWeight: 600, borderRadius: "8px" }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn btn-sm btn-${confirmVariant}`}
              onClick={onConfirm}
              disabled={isProcessing}
              style={{ fontWeight: 600, borderRadius: "8px" }}
            >
              {isProcessing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  Processing...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

