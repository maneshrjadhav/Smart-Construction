import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authService } from "../services/authService";

export default function MFASetup() {
  const [step, setStep] = useState(1); // 1: QR & Secret, 2: Recovery Codes, 3: Verify TOTP
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mfaData, setMfaData] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [backedUp, setBackedUp] = useState(false);

  const navigate = useNavigate();
  const { completeAuth } = useAuth();
  const { error: toastError, success: toastSuccess, info: toastInfo } = useToast();

  useEffect(() => {
    const rawSession = sessionStorage.getItem("smartConstructionMfaSession");
    if (!rawSession) {
      toastError("Session Missing", "Please log in to configure Multi-Factor Authentication.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(rawSession);
      setSessionData(parsed);

      // Generate MFA credentials
      authService
        .mfaGenerate(parsed.mfaSessionToken)
        .then((res) => {
          if (res.success) {
            setMfaData(res);
          } else {
            toastError("MFA Error", res.error || "Failed to initialize MFA setup.");
          }
        })
        .catch((err) => {
          toastError("Error", err.response?.data?.error || err.message || "Failed to start MFA setup.");
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (e) {
      navigate("/login", { replace: true });
    }
  }, [navigate, toastError]);

  const handleCopyKey = () => {
    if (!mfaData?.secret) return;
    navigator.clipboard.writeText(mfaData.secret);
    setCopiedKey(true);
    toastSuccess("Copied", "Secret key copied to clipboard.");
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleCopyAllCodes = () => {
    if (!mfaData?.recoveryCodes) return;
    const text = mfaData.recoveryCodes.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    toastSuccess("Copied", "All 8 recovery codes copied to clipboard.");
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  const handleDownloadCodes = () => {
    if (!mfaData?.recoveryCodes) return;
    const text = [
      "==================================================",
      "SMART CONSTRUCTION MANAGEMENT - BACKUP RECOVERY CODES",
      "==================================================",
      `Account: ${sessionData?.user?.email || "User"}`,
      `Date Generated: ${new Date().toLocaleString()}`,
      "",
      "IMPORTANT:",
      "- Each code can be used ONLY ONCE if you lose access to your authenticator app.",
      "- Store these codes in a secure, encrypted password manager.",
      "",
      "RECOVERY CODES:",
      ...mfaData.recoveryCodes.map((code, idx) => `[${idx + 1}]  ${code}`),
      "==================================================",
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SmartBuild-Recovery-Codes-${sessionData?.user?.email || "backup"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toastSuccess("Downloaded", "Recovery codes downloaded successfully.");
  };

  const handleVerifyAndActivate = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim() || !mfaData?.setupToken) return;

    setSubmitting(true);
    try {
      const res = await authService.mfaVerifySetup(mfaData.setupToken, verifyCode.trim());
      completeAuth(res);
      toastSuccess("MFA Enabled", "Two-Factor Authentication is now active on your account!");

      if ((res.user.role || "").toLowerCase() === "engineer") {
        if (res.mustChangePassword || res.user.mustChangePassword) {
          navigate("/secure-account", { replace: true });
        } else {
          navigate("/engineer-dashboard", { replace: true });
        }
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Invalid 6-digit code.";
      toastError("Activation Failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipSetup = async () => {
    if (!sessionData?.mfaSessionToken) return;
    setSubmitting(true);
    try {
      const res = await authService.mfaSkipSetup(sessionData.mfaSessionToken);
      completeAuth(res);
      toastInfo("Setup Deferred", "You can configure Two-Factor Authentication anytime from Account Settings.");

      if ((res.user.role || "").toLowerCase() === "engineer") {
        if (res.mustChangePassword || res.user.mustChangePassword) {
          navigate("/secure-account", { replace: true });
        } else {
          navigate("/engineer-dashboard", { replace: true });
        }
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      toastError("Error", "Failed to bypass setup.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center p-3"
        style={{ background: "linear-gradient(135deg, #051826 0%, #082B3A 50%, #0B3042 100%)" }}
      >
        <div className="text-center text-white">
          <div className="spinner-border text-info mb-3" style={{ width: "3rem", height: "3rem" }} role="status"></div>
          <h5 className="fw-bold">Generating Cryptographic Credentials...</h5>
          <p className="text-white-50 small">Preparing your RFC 6238 TOTP seed and emergency recovery keys.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3 py-5"
      style={{
        background: "linear-gradient(135deg, #051826 0%, #082B3A 50%, #0B3042 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-100"
        style={{ maxWidth: "620px" }}
      >
        <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 position-relative overflow-hidden bg-white">
          {/* Accent Line */}
          <div
            className="position-absolute top-0 start-0 w-100"
            style={{ height: "5px", background: "linear-gradient(90deg, #0FA8C4, #27C4E8, #0FA8C4)" }}
          ></div>

          {/* Header */}
          <div className="text-center mb-4">
            <span
              className="badge px-3 py-2 rounded-pill fw-bold mb-2"
              style={{ backgroundColor: "rgba(15, 168, 196, 0.12)", color: "#0FA8C4" }}
            >
              SECURITY HARDENING
            </span>
            <h3 className="fw-bolder text-navy m-0" style={{ color: "#082B3A" }}>
              Setup Two-Factor Authentication
            </h3>
            <p className="text-muted small mt-1">
              Protect your account with standard TOTP (Google Authenticator, Microsoft Authenticator, etc.)
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-4 pb-2 border-bottom">
            <div
              className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill small fw-bold ${
                step === 1 ? "bg-info text-dark" : "text-muted"
              }`}
            >
              <span className="badge rounded-circle bg-white text-dark">1</span> Scan QR Code
            </div>
            <i className="bi bi-chevron-right text-muted small"></i>
            <div
              className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill small fw-bold ${
                step === 2 ? "bg-info text-dark" : "text-muted"
              }`}
            >
              <span className="badge rounded-circle bg-white text-dark">2</span> Save Backup Codes
            </div>
            <i className="bi bi-chevron-right text-muted small"></i>
            <div
              className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill small fw-bold ${
                step === 3 ? "bg-info text-dark" : "text-muted"
              }`}
            >
              <span className="badge rounded-circle bg-white text-dark">3</span> Confirm Code
            </div>
          </div>

          {/* STEP 1: Scan QR Code & Key */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className="text-center mb-3">
                <div
                  className="d-inline-block p-3 rounded-3 shadow-sm bg-white border mb-3"
                  style={{ maxWidth: "230px" }}
                >
                  {mfaData?.qrCode && (
                    <img
                      src={mfaData.qrCode}
                      alt="Authenticator QR Code"
                      className="img-fluid rounded"
                      style={{ width: "200px", height: "200px" }}
                    />
                  )}
                </div>
                <p className="text-muted small mb-3">
                  Scan this QR code with your mobile authenticator app.
                </p>
              </div>

              {/* Manual Secret Block */}
              <div className="p-3 rounded-3 mb-4 bg-light border">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small fw-bold text-muted">CANNOT SCAN? ENTER KEY MANUALLY:</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="btn btn-sm btn-link text-decoration-none p-0 fw-bold"
                    style={{ color: "#0FA8C4" }}
                  >
                    {copiedKey ? (
                      <>
                        <i className="bi bi-check2 text-success me-1"></i> Copied!
                      </>
                    ) : (
                      <>
                        <i className="bi bi-clipboard me-1"></i> Copy Key
                      </>
                    )}
                  </button>
                </div>
                <div className="font-monospace fw-bolder fs-6 text-dark text-break" style={{ letterSpacing: "1.5px" }}>
                  {mfaData?.formattedSecret || mfaData?.secret}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  onClick={handleSkipSetup}
                  disabled={submitting}
                  className="btn btn-link text-decoration-none text-muted small p-0"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-saas-primary py-2 px-4"
                  style={{ fontSize: "14px" }}
                >
                  Next: Save Recovery Codes <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Backup Recovery Codes */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className="alert alert-warning border-0 small d-flex align-items-start gap-2 mb-3">
                <i className="bi bi-exclamation-triangle-fill fs-5 text-warning flex-shrink-0"></i>
                <div>
                  <strong>Store these emergency recovery codes securely!</strong> If you lose access to your
                  authenticator device, these single-use codes are the only way to regain account access.
                </div>
              </div>

              {/* 8 Codes Grid */}
              <div className="p-3 rounded-3 bg-light border mb-3">
                <div className="row g-2">
                  {mfaData?.recoveryCodes?.map((code, idx) => (
                    <div key={idx} className="col-6">
                      <div
                        className="p-2 rounded bg-white border text-center font-monospace fw-bold text-navy"
                        style={{ fontSize: "14px", letterSpacing: "1px" }}
                      >
                        <span className="text-muted me-2" style={{ fontSize: "11px" }}>
                          #{idx + 1}
                        </span>
                        {code}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleDownloadCodes}
                  className="btn btn-outline-secondary btn-sm flex-fill fw-bold py-2"
                >
                  <i className="bi bi-download me-1"></i> Download .txt
                </button>
                <button
                  type="button"
                  onClick={handleCopyAllCodes}
                  className="btn btn-outline-secondary btn-sm flex-fill fw-bold py-2"
                >
                  {copiedCodes ? (
                    <>
                      <i className="bi bi-check2 text-success me-1"></i> Copied All!
                    </>
                  ) : (
                    <>
                      <i className="bi bi-clipboard me-1"></i> Copy All Codes
                    </>
                  )}
                </button>
              </div>

              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="backupCheck"
                  checked={backedUp}
                  onChange={(e) => setBackedUp(e.target.checked)}
                />
                <label className="form-check-label small text-muted" htmlFor="backupCheck">
                  I have copied or downloaded these 8 emergency recovery codes and saved them in a safe place.
                </label>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-outline-light text-muted btn-sm"
                >
                  <i className="bi bi-arrow-left me-1"></i> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!backedUp}
                  className="btn-saas-primary py-2 px-4"
                  style={{ fontSize: "14px" }}
                >
                  Next: Verify Setup <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Verify TOTP Code */}
          {step === 3 && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleVerifyAndActivate}
            >
              <div className="text-center mb-4">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mx-auto mb-2"
                  style={{ width: "56px", height: "56px", background: "rgba(15, 168, 196, 0.12)", color: "#0FA8C4" }}
                >
                  <i className="bi bi-shield-lock-fill fs-3"></i>
                </div>
                <h5 className="fw-bolder text-navy m-0">Confirm Authenticator Code</h5>
                <p className="text-muted small mt-1">
                  Enter the 6-digit code currently shown in your Authenticator app to activate protection.
                </p>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-muted small mb-1">
                  6-DIGIT VERIFICATION CODE
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="form-control text-center font-monospace fw-bolder fs-3"
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  autoFocus
                  style={{ letterSpacing: "8px", height: "56px" }}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-outline-light text-muted btn-sm"
                >
                  <i className="bi bi-arrow-left me-1"></i> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || verifyCode.length !== 6}
                  className="btn-saas-primary py-2 px-4"
                  style={{ fontSize: "14px" }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Activating...
                    </>
                  ) : (
                    <>
                      Activate 2FA Protection <i className="bi bi-check-circle ms-1"></i>
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          <div className="border-top mt-4 pt-3 text-center">
            <Link to="/login" className="text-decoration-none text-muted small hover-navy">
              <i className="bi bi-box-arrow-left me-1"></i> Return to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

