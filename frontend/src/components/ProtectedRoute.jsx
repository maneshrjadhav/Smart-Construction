import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "./LoadingState";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, currentUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Verifying authentication session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Requirement 14: If engineer must change temporary password, restrict access to /secure-account
  const mustChange = Boolean(currentUser?.mustChangePassword || currentUser?.must_change_password);
  if (mustChange && location.pathname !== "/secure-account") {
    return <Navigate to="/secure-account" replace />;
  }

  // If already secured, don't allow visiting /secure-account
  if (!mustChange && location.pathname === "/secure-account") {
    if ((currentUser?.role || "").toLowerCase() === "engineer") {
      return <Navigate to="/engineer-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (currentUser?.role || "").toLowerCase();
    const hasRole = allowedRoles.some((r) => r.toLowerCase() === userRole);

    if (!hasRole) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
}
