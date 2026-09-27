import React from "react";
import { useAuth } from "../context/AuthContext";

export default function RoleGuard({ allowedRoles = [], children, fallback = null }) {
  const { currentUser } = useAuth();

  if (!currentUser || !currentUser.role) {
    return fallback;
  }

  const userRole = String(currentUser.role).trim().toLowerCase();
  const isAllowed = allowedRoles.some((r) => r.toLowerCase() === userRole);

  if (!isAllowed) {
    return fallback;
  }

  return <>{children}</>;
}

