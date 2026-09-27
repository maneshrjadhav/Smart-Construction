import React from "react";

export default function ErrorState({
  title = "Failed to load data",
  message = "An error occurred while communicating with the server.",
  onRetry,
}) {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="mx-auto mb-3 d-flex align-items-center justify-content-center"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "var(--status-danger-bg)",
          color: "var(--status-danger)",
          fontSize: "24px",
        }}
      >
        <i className="bi bi-exclamation-triangle-fill"></i>
      </div>
      <h5 className="fw-bold mb-1" style={{ color: "var(--status-danger)", fontSize: "15px" }}>
        {title}
      </h5>
      <p className="text-muted mx-auto mb-3" style={{ fontSize: "13px", maxWidth: "420px" }}>
        {message}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-1"></i> Try Again
        </button>
      )}
    </div>
  );
}

