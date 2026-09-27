import React from "react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  filterValue,
  onFilterChange,
  filterOptions = [],
}) {
  return (
    <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
      <div className="position-relative flex-grow-1" style={{ minWidth: "200px" }}>
        <i
          className="bi bi-search position-absolute text-muted"
          style={{ left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px" }}
        ></i>
        <input
          type="text"
          className="form-control form-control-sm ps-4"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            borderRadius: "8px",
            borderColor: "var(--border-color)",
            padding: "8px 12px 8px 34px",
            fontSize: "13px",
          }}
        />
      </div>

      {filterOptions.length > 0 && (
        <select
          className="form-select form-select-sm"
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          style={{
            width: "auto",
            minWidth: "140px",
            borderRadius: "8px",
            borderColor: "var(--border-color)",
            fontSize: "13px",
            padding: "8px 12px",
          }}
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

