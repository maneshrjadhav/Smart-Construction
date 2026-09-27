import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authService } from "../services/authService";
import heroImg from "../assets/hero-construction.jpg";

export default function SecureAccount() {
  const { currentUser, completeAuth, logout } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Requirement checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isDifferent = newPassword !== "" && currentPassword !== "" && newPassword !== currentPassword;
  const isMatching = newPassword !== "" && newPassword === confirmPassword;

  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    isDifferent &&
    isMatching &&
    currentPassword.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toastError("Validation Error", "Please enter your current temporary password.");
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      toastError(
        "Weak Password",
        "Your new password must meet all complexity requirements (8+ chars, uppercase, lowercase, number)."
      );
      return;
    }

    if (!isDifferent) {
      toastError("Password Conflict", "Your new password must be different from your temporary password.");
      return;
    }

    if (!isMatching) {
      toastError("Password Mismatch", "New password and confirmation password do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.firstLoginChangePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success && res.token) {
        completeAuth(res);
        toastSuccess(
          "Account Secured Successfully",
          "Your personal password has been established. Welcome to your portal!"
        );
        const destination = currentUser?.role === "Worker" ? "/worker-dashboard" : "/engineer-dashboard";
        navigate(destination, { replace: true });
      } else {
        throw new Error(res.error || "Failed to update password.");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to update password.";
      toastError("Security Update Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const isWorker = currentUser?.role === "Worker";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex flex-column flex-lg-row">
      {/* Left Column: Visual Brand Hero */}
      <div
        className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #051826 0%, #082B3A 50%, #0B3042 100%)",
        }}
      >
        <div
          className="position-absolute"
          style={{
            inset: 0,
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.16,
            mixBlendMode: "overlay",
          }}
        ></div>

        <div className="position-relative z-1">
          <div className="d-flex align-items-center gap-2 text-white">
            <div
              className="d-flex align-items-center justify-content-center fw-bold rounded-3"
              style={{
                width: "44px",
                height: "44px",
                background: "linear-gradient(135deg, #0FA8C4, #27C4E8)",
                color: "#082B3A",
                fontSize: "18px",
              }}
            >
              SC
            </div>
            <div>
              <h5 className="fw-bolder m-0">Smart Construction</h5>
              <small className="text-info fw-bold" style={{ fontSize: "10px", letterSpacing: "1px" }}>
                ACCOUNT INITIALIZATION
              </small>
            </div>
          </div>
        </div>

        <div className="position-relative z-1 my-auto py-5" style={{ maxWidth: "440px" }}>
          <div
            className="badge px-3 py-2 rounded-pill fw-bold mb-3"
            style={{ backgroundColor: "rgba(39, 196, 232, 0.15)", color: "#27C4E8" }}
          >
            MANDATORY CREDENTIAL SECURITY
          </div>
          <h2 className="display-6 fw-bolder mb-3" style={{ lineHeight: "1.2" }}>
            {isWorker ? "Protect your site workforce account." : "Protect your site engineering authority."}
          </h2>
          <p className="text-white-50" style={{ fontSize: "14px", lineHeight: "1.7" }}>
            {isWorker
              ? "As an enrolled workforce member, your credentials protect your daily attendance, wage calculations, and profile details. Replacing your temporary password activates your access."
              : "As a registered Site Engineer, your credentials sign off on site safety reports, material dispatches, and worker attendance rosters. Replacing your temporary password ensures zero unauthorized access."}
          </p>

          <div
            className="p-3 mt-4 rounded-3 border"
            style={{ background: "rgba(255, 255, 255, 0.06)", borderColor: "rgba(255, 255, 255, 0.12)" }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "40px", height: "40px", backgroundColor: "rgba(39, 196, 232, 0.2)" }}
              >
                <i className="bi bi-shield-lock-fill text-info fs-5"></i>
              </div>
              <div>
                <strong className="d-block text-white small">
                  {isWorker ? "Worker Identity Verified" : "Engineer Identity Verified"}
                </strong>
                <small className="text-white-50 font-monospace">
                  ID: {isWorker ? (currentUser?.workerId || "WRK") : (currentUser?.engineerId || "ENG-001")} • {currentUser?.email || currentUser?.phone}
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="position-relative z-1 small text-white-50">
          © 2026 Smart Construction Management System. All rights reserved.
        </div>
      </div>

      {/* Right Column: Password Form */}
      <div className="col-lg-7 d-flex flex-column justify-content-center align-items-center p-4 p-md-5 bg-light min-vh-100">
        <div style={{ maxWidth: "480px", width: "100%" }}>
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: "rgba(15, 168, 196, 0.12)",
                color: "#0fa8c4",
              }}
            >
              <i className="bi bi-key-fill fs-3"></i>
            </div>
            <h2 className="fw-bolder text-navy mb-1" style={{ letterSpacing: "-0.5px" }}>
              SECURE YOUR ACCOUNT
            </h2>
            <p className="text-muted small">
              Your administrator created a temporary password for you.
              <br />
              For security, create your own password before continuing.
            </p>
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-4 bg-white">
            <form onSubmit={handleSubmit}>
              {/* Current Temporary Password */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">
                  CURRENT TEMPORARY PASSWORD *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="form-control border-start-0 border-end-0"
                    placeholder="Enter the SMS temporary password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0 bg-light"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <i className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">
                  NEW PERSONAL PASSWORD *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-shield-check"></i>
                  </span>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="form-control border-start-0 border-end-0"
                    placeholder="Create a strong new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0 bg-light"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <i className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted">
                  CONFIRM NEW PASSWORD *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-shield-lock"></i>
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-control border-start-0 border-end-0"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0 bg-light"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 mb-4 rounded-3 border bg-light">
                <span className="text-uppercase fw-bold text-muted d-block mb-2" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  Password Requirements:
                </span>
                <ul className="list-unstyled mb-0 small">
                  <li className={`d-flex align-items-center gap-2 mb-1 ${hasMinLength ? "text-success fw-bold" : "text-muted"}`}>
                    <i className={`bi ${hasMinLength ? "bi-check-circle-fill text-success" : "bi-circle"}`}></i>
                    Minimum 8 characters
                  </li>
                  <li className={`d-flex align-items-center gap-2 mb-1 ${hasUppercase ? "text-success fw-bold" : "text-muted"}`}>
                    <i className={`bi ${hasUppercase ? "bi-check-circle-fill text-success" : "bi-circle"}`}></i>
                    At least one uppercase letter (A-Z)
                  </li>
                  <li className={`d-flex align-items-center gap-2 mb-1 ${hasLowercase ? "text-success fw-bold" : "text-muted"}`}>
                    <i className={`bi ${hasLowercase ? "bi-check-circle-fill text-success" : "bi-circle"}`}></i>
                    At least one lowercase letter (a-z)
                  </li>
                  <li className={`d-flex align-items-center gap-2 mb-1 ${hasNumber ? "text-success fw-bold" : "text-muted"}`}>
                    <i className={`bi ${hasNumber ? "bi-check-circle-fill text-success" : "bi-circle"}`}></i>
                    At least one numeric digit (0-9)
                  </li>
                  <li className={`d-flex align-items-center gap-2 mb-1 ${isDifferent ? "text-success fw-bold" : "text-muted"}`}>
                    <i className={`bi ${isDifferent ? "bi-check-circle-fill text-success" : "bi-circle"}`}></i>
                    Different from temporary password
                  </li>
                  <li className={`d-flex align-items-center gap-2 ${isMatching ? "text-success fw-bold" : "text-muted"}`}>
                    <i className={`bi ${isMatching ? "bi-check-circle-fill text-success" : "bi-circle"}`}></i>
                    Passwords match
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-saas-primary w-100 py-3 fw-bold mb-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                disabled={loading || !isFormValid}
                style={{ fontSize: "15px" }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Securing Account...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-fill-check"></i>
                    Save Password &amp; Open Dashboard
                  </>
                )}
              </button>

              {/* Exit / Cancel */}
              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none text-muted small p-0"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-left me-1"></i> Exit &amp; Log Out
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

