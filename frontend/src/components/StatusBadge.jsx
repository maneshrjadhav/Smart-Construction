import React from "react";

export default function StatusBadge({ status, customClass }) {
  if (!status) return <span className="app-badge badge-pending">—</span>;

  const s = String(status).trim().toLowerCase();
  let badgeClass = "badge-pending";

  if (["active", "completed", "present", "resolved", "paid"].includes(s)) {
    badgeClass = "badge-active";
  } else if (["in progress", "in-progress", "pending", "half day", "medium"].includes(s)) {
    badgeClass = "badge-pending";
  } else if (["inactive", "absent", "high", "critical", "out of stock", "rejected"].includes(s)) {
    badgeClass = "badge-absent";
  } else if (["low", "on leave", "low stock", "planning", "approved"].includes(s)) {
    badgeClass = "badge-low";
  }

  return (
    <span className={`app-badge ${customClass || badgeClass}`}>
      {status}
    </span>
  );
}

