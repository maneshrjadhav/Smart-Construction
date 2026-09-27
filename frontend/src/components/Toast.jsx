import React from "react";

export default function Toast({ id, title, message, type = "info", onClose }) {
  let icon = "bi-info-circle-fill";
  if (type === "success") icon = "bi-check-circle-fill";
  if (type === "error") icon = "bi-x-circle-fill";
  if (type === "warning") icon = "bi-exclamation-triangle-fill";

  return (
    <div className={`app-toast toast-${type}`}>
      <i
        className={`bi ${icon} fs-5 text-${
          type === "success"
            ? "success"
            : type === "error"
            ? "danger"
            : type === "warning"
            ? "warning"
            : "info"
        }`}
      ></i>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: "13px", color: "var(--text-navy)" }}>
          {title}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
          {message}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          className="btn-close btn-close-sm"
          style={{ fontSize: "10px" }}
          onClick={() => onClose(id)}
        ></button>
      )}
    </div>
  );
}

