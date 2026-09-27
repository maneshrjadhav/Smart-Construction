import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NotFound() {
  const { isAuthenticated, currentUser } = useAuth();
  const userIsEngineer = (currentUser?.role || "").toLowerCase() === "engineer";

  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-center p-4"
      style={{ background: "var(--bg-page)" }}
    >
      <div
        className="mb-3 d-flex align-items-center justify-content-center rounded-circle mx-auto"
        style={{
          width: "90px",
          height: "90px",
          background: "rgba(15, 168, 196, 0.1)",
          color: "var(--secondary)",
          fontSize: "40px",
        }}
      >
        <i className="bi bi-compass"></i>
      </div>

      <h1 className="display-4 fw-bolder text-navy mb-2">404</h1>
      <h3 className="fw-bold text-navy mb-2">Page Not Found</h3>
      <p className="text-muted mb-4" style={{ maxWidth: "420px", fontSize: "14px" }}>
        The construction management resource or jobsite link you requested does not exist or has been moved.
      </p>

      {isAuthenticated ? (
        <Link
          to={userIsEngineer ? "/engineer-dashboard" : "/dashboard"}
          className="btn-saas-primary px-4 py-2"
        >
          <i className="bi bi-house me-2"></i> Return to Dashboard
        </Link>
      ) : (
        <Link to="/login" className="btn-saas-primary px-4 py-2">
          <i className="bi bi-box-arrow-in-right me-2"></i> Return to Sign In
        </Link>
      )}
    </div>
  );
}

