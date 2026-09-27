import React from "react";
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = "No records found",
  emptyMessage = "There are no entries available for this table.",
  onEmptyAction,
  emptyActionLabel,
}) {
  if (loading) {
    return <LoadingState message="Loading table data..." />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="app-table-container">
      <table className="app-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={col.className || ""}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={row.id || rowIdx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={col.className || ""}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

