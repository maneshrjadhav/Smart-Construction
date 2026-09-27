import React from "react";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "var(--bg-page)" }}>
      <Outlet />
    </div>
  );
}

