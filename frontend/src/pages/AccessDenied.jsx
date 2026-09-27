import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AccessDenied() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if ((currentUser?.role || "").toLowerCase() === "engineer") {
      navigate("/engineer-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-4"
      style={{ backgroundColor: "#F4F8FB" }}
    >
      <div className="text-center" style={{ maxWidth: "520px" }}>
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4 shadow-sm"
          style={{
            width: "88px",
            height: "88px",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            color: "#EF4444",
            fontSize: "40px",
          }}
        >
          <i className="bi bi-shield-lock-fill"></i>
        </div>

        <div className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill fw-bold mb-3">
          SECURITY PROTOCOL • 403 FORBIDDEN
        </div>

        <h1 className="fw-bolder mb-2 text-navy" style={{ color: "#082B3A", fontSize: "32px" }}>
          Access Restricted
        </h1>

        <p className="text-muted mb-4" style={{ fontSize: "15px", lineHeight: "1.6" }}>
          You do not have administrative authorization to view this module. Your current role is registered as{" "}
          <strong className="text-navy">{currentUser?.role || "Restricted User"}</strong>.
        </p>

        <div className="p-3 mb-4 rounded-3 bg-white border text-start small">
          <div className="d-flex justify-content-between py-1 text-muted">
            <span>User Account:</span>
            <strong className="text-navy">{currentUser?.email || "Unknown"}</strong>
          </div>
          <div className="d-flex justify-content-between py-1 text-muted">
            <span>Assigned Role:</span>
            <span className="badge bg-light text-navy border">{currentUser?.role || "Site Engineer"}</span>
          </div>
          {currentUser?.engineerId && (
            <div className="d-flex justify-content-between py-1 text-muted">
              <span>Engineer ID:</span>
              <span className="text-info fw-bold">{currentUser.engineerId}</span>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-center gap-2">
          <button type="button" onClick={handleReturn} className="btn-saas-primary px-4 py-2">
            <i className="bi bi-arrow-left me-1"></i> Return to My Console
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="btn btn-outline-secondary px-4 py-2 fw-bold"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
