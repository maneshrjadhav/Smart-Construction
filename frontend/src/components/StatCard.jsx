import React from "react";

export default function StatCard({
  icon = "bi-bar-chart",
  label,
  value,
  footer,
  colorBg = "#e8f5f8",
  colorIcon = "#0fa8c4",
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrap" style={{ backgroundColor: colorBg, color: colorIcon }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {footer && <div className="stat-footer">{footer}</div>}
      </div>
    </div>
  );
}

