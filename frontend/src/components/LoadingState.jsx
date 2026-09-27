import React from "react";

export default function LoadingState({ message = "Loading data from server..." }) {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-info mb-3" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <div className="fw-semibold text-muted" style={{ fontSize: "13.5px" }}>
        {message}
      </div>
    </div>
  );
}

