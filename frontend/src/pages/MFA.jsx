import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authService } from "../services/authService";

export default function MFA() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { completeAuth } = useAuth();
  const { error: toastError, success: toastSuccess, warning: toastWarning } = useToast();

  useEffect(() => {
    const rawSession = sessionStorage.getItem("smartConstructionMfaSession");
    if (!rawSession) {
      toastError("Session Expired", "No active login session found. Please sign in again.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(rawSession);
      if (!parsed.mfaSessionToken) {
        navigate("/login", { replace: true });
        return;
      }
      setSessionData(parsed);
    } catch (e) {
      navigate("/login", { replace: true });
    }
  }, [navigate, toastError]);

  // Focus first input on mount
  useEffect(() => {
    if (!useRecovery && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [useRecovery]);

  const handleDigitChange = (index, value) => {
    // Only accept numbers
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    // Handle single digit
    const newDigits = [...digits];
    newDigits[index] = cleanValue[cleanValue.length - 1];
    setDigits(newDigits);

    // Auto-advance to next input
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // If 6th digit entered, auto submit
    if (index === 5 && newDigits.every((d) => d !== "")) {
      submitCode(newDigits.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedText) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedText[i] || "";
    }
    setDigits(newDigits);

    if (pastedText.length === 6) {
      submitCode(pastedText);
    } else {
      const nextIndex = Math.min(pastedText.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    }
  };

  const submitCode = async (fullCode) => {
    if (!sessionData?.mfaSessionToken) return;
    setLoading(true);

    try {
      const res = await authService.mfaVerify(sessionData.mfaSessionToken, fullCode);
      completeAuth(res);
      toastSuccess("Verification Successful", `Welcome back, ${res.user.name}!`);

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
      const msg = err.response?.data?.error || err.message || "Invalid verification code.";
      toastError("Verification Failed", msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setDigits(["", "", "", "", "", ""]);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    if (!recoveryCode.trim() || !sessionData?.mfaSessionToken) return;

    setLoading(true);
    try {
      const res = await authService.mfaVerifyRecovery(sessionData.mfaSessionToken, recoveryCode.trim());
      completeAuth(res);
      toastSuccess("Access Granted", res.message || "Recovery code accepted.");

      if (res.remainingRecoveryCodes !== undefined && res.remainingRecoveryCodes <= 2) {
        toastWarning(
          "Low Recovery Codes",
          `You only have ${res.remainingRecoveryCodes} backup codes remaining. Please regenerate them in Account Settings.`
        );
      }

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
      const msg = err.response?.data?.error || err.message || "Invalid or used recovery code.";
      toastError("Recovery Failed", msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: "linear-gradient(135deg, #051826 0%, #082B3A 50%, #0B3042 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-100"
        style={{ maxWidth: "460px" }}
      >
        <div
          className="card border-0 shadow-lg p-4 p-md-5 rounded-4 text-center position-relative overflow-hidden"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          {/* Top subtle decorative accent */}
          <div
            className="position-absolute top-0 start-0 w-100"
            style={{
              height: "5px",
              background: "linear-gradient(90deg, #0FA8C4, #27C4E8, #0FA8C4)",
            }}
          ></div>

          {/* Icon Badge */}
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mx-auto mb-3 shadow-sm"
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "rgba(15, 168, 196, 0.12)",
              color: "#0FA8C4",
              fontSize: "28px",
            }}
          >
            <i className={`bi ${useRecovery ? "bi-key-fill" : "bi-shield-check"}`}></i>
          </div>

          <h3 className="fw-bolder mb-1 text-navy" style={{ color: "#082B3A" }}>
            {useRecovery ? "Backup Recovery Code" : "Two-Factor Verification"}
          </h3>
          <p className="text-muted small mb-4">
            {useRecovery ? (
              <>Enter one of your 8 emergency recovery codes to authenticate.</>
            ) : (
              <>
                Enter the 6-digit security code generated by your Authenticator app for{" "}
                <strong className="text-dark">{sessionData?.user?.email || "your account"}</strong>.
              </>
            )}
          </p>

          <AnimatePresence mode="wait">
            {!useRecovery ? (
              <motion.div
                key="totp-entry"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* 6-Digit Auto-Advancing Input Boxes */}
                <motion.div
                  animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                  transition={{ duration: 0.5 }}
                  className="d-flex justify-content-between gap-2 mb-4"
                  onPaste={handlePaste}
                >
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      disabled={loading}
                      className="form-control text-center fw-bolder fs-3 font-monospace p-0"
                      style={{
                        height: "58px",
                        borderRadius: "10px",
                        border: digit ? "2px solid #0FA8C4" : "1.5px solid #CBD5E1",
                        backgroundColor: digit ? "#F0FDF4" : "#F8FAFC",
                        color: "#082B3A",
                        transition: "all 0.15s ease",
                      }}
                    />
                  ))}
                </motion.div>

                <button
                  type="button"
                  onClick={() => submitCode(digits.join(""))}
                  disabled={loading || digits.some((d) => d === "")}
                  className="btn-saas-primary w-100 py-3 justify-content-center mb-3"
                  style={{ fontSize: "14px" }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Verifying Code...
                    </>
                  ) : (
                    <>
                      Verify & Continue <i className="bi bi-arrow-right ms-2"></i>
                    </>
                  )}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setUseRecovery(true)}
                    className="btn btn-sm btn-link text-decoration-none text-muted"
                    style={{ fontSize: "13px" }}
                  >
                    <i className="bi bi-key me-1"></i> Don't have your phone? Use a backup code
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="recovery-entry"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRecoverySubmit}
              >
                <motion.div
                  animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                  transition={{ duration: 0.5 }}
                  className="mb-4"
                >
                  <label className="form-label fw-bold text-muted small text-start w-100 mb-1">
                    ENTER RECOVERY CODE (e.g. 4968-2A0C)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="bi bi-key"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 font-monospace text-uppercase fw-bold"
                      placeholder="XXXX-XXXX"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      required
                      autoFocus
                      style={{ fontSize: "15px", padding: "12px", letterSpacing: "2px" }}
                    />
                  </div>
                </motion.div>

                <button
                  type="submit"
                  disabled={loading || !recoveryCode.trim()}
                  className="btn-saas-primary w-100 py-3 justify-content-center mb-3"
                  style={{ fontSize: "14px" }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Validating Code...
                    </>
                  ) : (
                    <>
                      Verify Recovery Code <i className="bi bi-shield-check ms-2"></i>
                    </>
                  )}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setUseRecovery(false)}
                    className="btn btn-sm btn-link text-decoration-none text-muted"
                    style={{ fontSize: "13px" }}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Return to Authenticator app code
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="border-top mt-4 pt-3 text-center">
            <Link to="/login" className="text-decoration-none text-muted small hover-navy">
              <i className="bi bi-box-arrow-left me-1"></i> Cancel and sign in with a different account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

