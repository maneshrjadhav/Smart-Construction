import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div>
        <h2 className="mb-1" style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-navy)" }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="d-flex align-items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

