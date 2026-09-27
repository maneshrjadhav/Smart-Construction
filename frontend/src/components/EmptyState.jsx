import React from "react";

export default function EmptyState({
  icon = "bi-inbox",
  title = "No records found",
  message = "There are currently no records matching this query.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="mx-auto mb-3 d-flex align-items-center justify-content-center"
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "var(--bg-alt)",
          color: "var(--text-muted)",
          fontSize: "26px",
        }}
      >
        <i className={`bi ${icon}`}></i>
      </div>
      <h5 className="fw-bold mb-1" style={{ color: "var(--text-navy)", fontSize: "15px" }}>
        {title}
      </h5>
      <p className="text-muted mx-auto mb-3" style={{ fontSize: "13px", maxWidth: "380px" }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button type="button" className="btn-saas-primary btn-sm" onClick={onAction}>
          <i className="bi bi-plus-circle me-1"></i> {actionLabel}
        </button>
      )}
    </div>
  );
}

