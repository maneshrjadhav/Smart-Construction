import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authService } from "../services/authService";
import PageHeader from "../components/PageHeader";

export default function AccountSettings() {
  const { currentUser, updateUser } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || "");
  const [avatarImage, setAvatarImage] = useState(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // MFA Management State
  const [mfaStatus, setMfaStatus] = useState({
    loading: true,
    enabled: false,
    verifiedAt: null,
    remainingRecoveryCodes: 0,
  });

  // Modals state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disablingMfa, setDisablingMfa] = useState(false);

  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenPassword, setRegenPassword] = useState("");
  const [regenCode, setRegenCode] = useState("");
  const [regeneratingCodes, setRegeneratingCodes] = useState(false);
  const [newRegenCodes, setNewRegenCodes] = useState(null);

  // In-app MFA Setup state for enabling 2FA directly from settings
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupData, setSetupData] = useState(null);
  const [setupTotpCode, setSetupTotpCode] = useState("");
  const [settingUp, setSettingUp] = useState(false);

  const initials = (profileName || "User")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Load MFA Status
  const loadMfaStatus = async () => {
    try {
      const res = await authService.mfaGetStatus();
      if (res.success) {
        setMfaStatus({
          loading: false,
          enabled: res.mfaEnabled,
          verifiedAt: res.verifiedAt,
          remainingRecoveryCodes: res.remainingRecoveryCodes,
        });
      }
    } catch (err) {
      setMfaStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadMfaStatus();
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarImage(event.target.result);
        toastSuccess("Photo Updated", "Profile picture preview updated.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarImage(null);
    toastSuccess("Photo Removed", "Reverted to default avatar badge.");
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toastError("Validation Error", "Full name cannot be empty.");
      return;
    }
    updateUser({ name: profileName.trim() });
    toastSuccess("Profile Saved", "User profile details updated successfully.");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toastError("Missing Fields", "Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      toastError("Weak Password", "New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toastError("Mismatch", "New password and confirmation do not match.");
      return;
    }

    setSubmittingPassword(true);
    try {
      const res = await authService.changePassword(currentUser.id, {
        currentPassword,
        newPassword,
      });

      if (res.success) {
        toastSuccess("Password Changed", "Your password has been updated in MySQL.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to update password.");
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Start in-app MFA setup
  const handleStartSetup = async () => {
    setShowSetupModal(true);
    setSetupStep(1);
    setSettingUp(true);
    try {
      const token = localStorage.getItem("smartConstructionToken");
      const res = await authService.mfaGenerate(token);
      if (res.success) {
        setSetupData(res);
      }
    } catch (err) {
      toastError("Setup Error", "Failed to generate MFA credentials.");
      setShowSetupModal(false);
    } finally {
      setSettingUp(false);
    }
  };

  const handleConfirmSetup = async (e) => {
    e.preventDefault();
    if (!setupTotpCode.trim() || !setupData?.setupToken) return;

    setSettingUp(true);
    try {
      const res = await authService.mfaVerifySetup(setupData.setupToken, setupTotpCode.trim());
      toastSuccess("MFA Enabled", "Two-Factor Authentication is now active!");
      setShowSetupModal(false);
      setSetupTotpCode("");
      setSetupData(null);
      loadMfaStatus();
    } catch (err) {
      toastError("Activation Failed", err.response?.data?.error || "Invalid verification code.");
    } finally {
      setSettingUp(false);
    }
  };

  // Disable MFA
  const handleConfirmDisable = async (e) => {
    e.preventDefault();
    if (!disablePassword) return;

    setDisablingMfa(true);
    try {
      const res = await authService.mfaDisable(disablePassword);
      if (res.success) {
        toastSuccess("MFA Disabled", "Two-factor authentication has been disabled.");
        setShowDisableModal(false);
        setDisablePassword("");
        loadMfaStatus();
      }
    } catch (err) {
      toastError("Failed to Disable", err.response?.data?.error || "Incorrect password.");
    } finally {
      setDisablingMfa(false);
    }
  };

  // Regenerate recovery codes
  const handleConfirmRegenerate = async (e) => {
    e.preventDefault();
    if (!regenPassword || !regenCode) return;

    setRegeneratingCodes(true);
    try {
      const res = await authService.mfaRegenerateRecovery(regenPassword, regenCode);
      if (res.success) {
        setNewRegenCodes(res.recoveryCodes);
        toastSuccess("Regenerated", "8 new recovery codes have been generated.");
        loadMfaStatus();
      }
    } catch (err) {
      toastError("Regeneration Failed", err.response?.data?.error || "Verification failed.");
    } finally {
      setRegeneratingCodes(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Account Settings"
        subtitle="Manage your personal credentials, profile picture, and access authorization."
      />

      <div className="row g-4">
        {/* Left Column: Profile Card */}
        <div className="col-lg-4">
          <div className="saas-card text-center mb-4">
            <div className="position-relative d-inline-block mb-3">
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt="Profile"
                  className="rounded-circle shadow-sm"
                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="mx-auto rounded-circle shadow-sm d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{
                    width: "100px",
                    height: "100px",
                    background: "linear-gradient(135deg, var(--primary-light), var(--secondary))",
                    fontSize: "32px",
                  }}
                >
                  {initials}
                </div>
              )}
            </div>

            <h4 className="fw-bolder mb-1 text-navy">{currentUser?.name || "Administrator"}</h4>
            <span className="badge bg-info-subtle text-info fw-bold mb-3">
              {currentUser?.role || "Administrator"}
            </span>

            <div className="d-flex justify-content-center gap-2 mb-4">
              <label className="btn btn-sm btn-outline-primary" style={{ cursor: "pointer" }}>
                <i className="bi bi-camera me-1"></i> Change Photo
                <input type="file" accept="image/*" className="d-none" onChange={handlePhotoUpload} />
              </label>
              {avatarImage && (
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleRemovePhoto}>
                  <i className="bi bi-trash"></i>
                </button>
              )}
            </div>

            <div className="border-top pt-3 text-start small">
              <div className="d-flex justify-content-between py-1 text-muted">
                <span>Account Status:</span>
                <span className="text-success fw-bold">Active</span>
              </div>
              <div className="d-flex justify-content-between py-1 text-muted">
                <span>User Role:</span>
                <span className="text-navy fw-semibold">{currentUser?.role || "Administrator"}</span>
              </div>
              {currentUser?.engineerId && (
                <div className="d-flex justify-content-between py-1 text-muted">
                  <span>Engineer ID:</span>
                  <span className="text-info fw-bold">{currentUser.engineerId}</span>
                </div>
              )}
              <div className="d-flex justify-content-between py-1 text-muted">
                <span>2FA Protection:</span>
                <span className={`fw-bold ${mfaStatus.enabled ? "text-success" : "text-warning"}`}>
                  {mfaStatus.enabled ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Security Summary Card */}
          <div className="saas-card">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div
                className="rounded-3 p-2 text-white"
                style={{ background: mfaStatus.enabled ? "#10B981" : "#F59E0B" }}
              >
                <i className={`bi ${mfaStatus.enabled ? "bi-shield-fill-check" : "bi-shield-exclamation"} fs-4`}></i>
              </div>
              <div>
                <h6 className="fw-bolder m-0 text-navy">Authentication Level</h6>
                <small className="text-muted">
                  {mfaStatus.enabled ? "Two-Factor TOTP Active" : "Standard Single-Factor (Password)"}
                </small>
              </div>
            </div>
            <p className="text-muted small mb-0 mt-2">
              {mfaStatus.enabled
                ? "Your account requires an RFC 6238 TOTP authenticator code upon signing in."
                : "Enable Two-Factor Authentication to block unauthorized password-based attacks."}
            </p>
          </div>
        </div>

        {/* Right Column: Profile & Security Modules */}
        <div className="col-lg-8">
          {/* Profile Details Form */}
          <div className="saas-card mb-4">
            <div className="saas-card-header">
              <h3 className="saas-card-title">Personal Profile Information</h3>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">FULL NAME</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">EMAIL ADDRESS (LOGIN ID)</label>
                  <input
                    type="email"
                    className="form-control bg-light"
                    value={profileEmail}
                    disabled
                    title="Email is bound to system account"
                  />
                </div>

                <div className="col-12 text-end mt-4">
                  <button type="submit" className="btn-saas-primary btn-sm">
                    <i className="bi bi-check2 me-1"></i> Save Profile
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* TWO-FACTOR AUTHENTICATION (TOTP MFA) SECTION */}
          <div className="saas-card mb-4">
            <div className="saas-card-header d-flex justify-content-between align-items-center">
              <div>
                <h3 className="saas-card-title">Two-Factor Authentication (TOTP 2FA)</h3>
                <p className="text-muted small mb-0">
                  Google Authenticator / Microsoft Authenticator / RFC 6238 compatible TOTP
                </p>
              </div>
              <span
                className={`badge px-3 py-2 rounded-pill fw-bold ${
                  mfaStatus.enabled ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"
                }`}
              >
                <i className={`bi ${mfaStatus.enabled ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"} me-1`}></i>
                {mfaStatus.enabled ? "ACTIVE & ENFORCED" : "NOT CONFIGURED"}
              </span>
            </div>

            <div className="mt-3">
              {mfaStatus.enabled ? (
                <div>
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center p-3 rounded-3 bg-light border mb-3 gap-2">
                    <div>
                      <div className="fw-bold text-navy">
                        <i className="bi bi-shield-lock-fill text-success me-2"></i>
                        Authenticator App Configured
                      </div>
                      <small className="text-muted">
                        Verified at:{" "}
                        {mfaStatus.verifiedAt
                          ? new Date(mfaStatus.verifiedAt).toLocaleString()
                          : "Active"}
                      </small>
                    </div>
                    <div>
                      <span className="badge bg-secondary-subtle text-dark border px-2 py-1">
                        <i className="bi bi-key me-1"></i> {mfaStatus.remainingRecoveryCodes} of 8 backup codes remaining
                      </span>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRegenModal(true);
                        setNewRegenCodes(null);
                        setRegenPassword("");
                        setRegenCode("");
                      }}
                      className="btn btn-outline-primary btn-sm fw-bold"
                    >
                      <i className="bi bi-arrow-repeat me-1"></i> Regenerate Recovery Codes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisableModal(true);
                        setDisablePassword("");
                      }}
                      className="btn btn-outline-danger btn-sm fw-bold"
                    >
                      <i className="bi bi-x-circle me-1"></i> Disable 2FA
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="alert alert-warning border-0 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Your account is currently protected by password alone. Set up Two-Factor Authentication to prevent
                    unauthorized logins even if your password is compromised.
                  </div>
                  <button
                    type="button"
                    onClick={handleStartSetup}
                    className="btn-saas-primary btn-sm"
                  >
                    <i className="bi bi-qr-code me-1"></i> Set Up Two-Factor Authentication
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Change Password Form */}
          <div className="saas-card">
            <div className="saas-card-header">
              <h3 className="saas-card-title">Security &amp; Password Update</h3>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">CURRENT PASSWORD *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter existing password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">NEW PASSWORD *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">CONFIRM NEW PASSWORD *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 text-end mt-4">
                  <button
                    type="submit"
                    className="btn btn-outline-danger btn-sm"
                    disabled={submittingPassword}
                    style={{ fontWeight: 700, borderRadius: "8px" }}
                  >
                    {submittingPassword ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: DISABLE 2FA */}
      {showDisableModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-shield-x me-2"></i> Disable Two-Factor Authentication
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDisableModal(false)}
                ></button>
              </div>
              <form onSubmit={handleConfirmDisable}>
                <div className="modal-body py-3">
                  <p className="text-muted small">
                    Disabling 2FA will reduce your account security. Please verify your account password to confirm.
                  </p>
                  <label className="form-label small fw-bold text-muted">CURRENT PASSWORD</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    onClick={() => setShowDisableModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm fw-bold"
                    disabled={disablingMfa || !disablePassword}
                  >
                    {disablingMfa ? "Disabling..." : "Confirm Disable"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGENERATE RECOVERY CODES */}
      {showRegenModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">
                  <i className="bi bi-arrow-repeat me-2 text-info"></i> Regenerate Backup Recovery Codes
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRegenModal(false)}
                ></button>
              </div>

              {!newRegenCodes ? (
                <form onSubmit={handleConfirmRegenerate}>
                  <div className="modal-body py-3">
                    <p className="text-muted small">
                      Regenerating will permanently invalidate all previously issued recovery codes. You will receive 8
                      new single-use codes.
                    </p>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">CURRENT ACCOUNT PASSWORD</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter password"
                        value={regenPassword}
                        onChange={(e) => setRegenPassword(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">6-DIGIT AUTHENTICATOR CODE</label>
                      <input
                        type="text"
                        maxLength={6}
                        className="form-control font-monospace text-center fs-4 fw-bold"
                        placeholder="000000"
                        value={regenCode}
                        onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, ""))}
                        required
                        style={{ letterSpacing: "6px" }}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => setShowRegenModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-saas-primary btn-sm"
                      disabled={regeneratingCodes || !regenPassword || regenCode.length !== 6}
                    >
                      {regeneratingCodes ? "Verifying..." : "Generate New Codes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="modal-body py-3">
                  <div className="alert alert-success border-0 small mb-3">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    8 new recovery codes generated. Previous codes have been deleted.
                  </div>
                  <div className="row g-2 mb-3">
                    {newRegenCodes.map((code, idx) => (
                      <div key={idx} className="col-6">
                        <div className="p-2 rounded bg-light border text-center font-monospace fw-bold">
                          {code}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newRegenCodes.join("\n"));
                        toastSuccess("Copied", "Recovery codes copied to clipboard.");
                      }}
                      className="btn btn-outline-secondary btn-sm fw-bold"
                    >
                      <i className="bi bi-clipboard me-1"></i> Copy Codes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRegenModal(false)}
                      className="btn-saas-primary btn-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IN-APP MFA SETUP */}
      {showSetupModal && setupData && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">
                  <i className="bi bi-shield-check me-2 text-info"></i> Set Up Two-Factor Authentication
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSetupModal(false)}
                ></button>
              </div>

              {setupStep === 1 && (
                <div className="modal-body py-3">
                  <div className="row align-items-center g-4">
                    <div className="col-md-5 text-center">
                      <div className="p-2 bg-white border rounded shadow-sm d-inline-block">
                        <img
                          src={setupData.qrCode}
                          alt="QR Code"
                          className="img-fluid"
                          style={{ width: "190px", height: "190px" }}
                        />
                      </div>
                      <div className="small text-muted mt-2">Scan with Authenticator App</div>
                    </div>
                    <div className="col-md-7">
                      <h6 className="fw-bold text-navy mb-2">Step 1: Scan QR Code</h6>
                      <p className="text-muted small mb-3">
                        Use Google Authenticator, Microsoft Authenticator, or any RFC 6238 TOTP app to scan the code.
                      </p>
                      <div className="p-3 bg-light rounded border mb-3">
                        <small className="text-muted fw-bold d-block mb-1">MANUAL SECRET KEY:</small>
                        <span className="font-monospace fw-bold text-navy text-break">
                          {setupData.formattedSecret || setupData.secret}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(setupData.secret);
                          toastSuccess("Copied", "Secret key copied.");
                        }}
                        className="btn btn-outline-secondary btn-sm fw-bold"
                      >
                        <i className="bi bi-clipboard me-1"></i> Copy Secret Key
                      </button>
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 pt-3">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => setShowSetupModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-saas-primary btn-sm"
                      onClick={() => setSetupStep(2)}
                    >
                      Next: Save Backup Codes <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  </div>
                </div>
              )}

              {setupStep === 2 && (
                <div className="modal-body py-3">
                  <h6 className="fw-bold text-navy mb-1">Step 2: Emergency Recovery Codes</h6>
                  <p className="text-muted small mb-3">
                    Keep these 8 codes safe. Each code can be used once to regain access if you lose your device.
                  </p>
                  <div className="row g-2 mb-3">
                    {setupData.recoveryCodes?.map((code, idx) => (
                      <div key={idx} className="col-6">
                        <div className="p-2 bg-light border rounded text-center font-monospace fw-bold small">
                          {code}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(setupData.recoveryCodes.join("\n"));
                        toastSuccess("Copied", "Recovery codes copied.");
                      }}
                      className="btn btn-outline-secondary btn-sm fw-bold"
                    >
                      <i className="bi bi-clipboard me-1"></i> Copy Codes
                    </button>
                  </div>
                  <div className="modal-footer border-top-0 pt-2">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => setSetupStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn-saas-primary btn-sm"
                      onClick={() => setSetupStep(3)}
                    >
                      Next: Confirm Setup <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  </div>
                </div>
              )}

              {setupStep === 3 && (
                <form onSubmit={handleConfirmSetup}>
                  <div className="modal-body py-3 text-center">
                    <h6 className="fw-bold text-navy mb-2">Step 3: Enter 6-Digit Authenticator Code</h6>
                    <p className="text-muted small mb-4">
                      Enter the code displayed in your Authenticator app to confirm and activate.
                    </p>
                    <div className="mx-auto mb-4" style={{ maxWidth: "260px" }}>
                      <input
                        type="text"
                        maxLength={6}
                        className="form-control text-center font-monospace fs-3 fw-bold"
                        placeholder="000000"
                        value={setupTotpCode}
                        onChange={(e) => setSetupTotpCode(e.target.value.replace(/\D/g, ""))}
                        required
                        autoFocus
                        style={{ letterSpacing: "6px" }}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => setSetupStep(2)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn-saas-primary btn-sm"
                      disabled={settingUp || setupTotpCode.length !== 6}
                    >
                      {settingUp ? "Activating..." : "Activate 2FA"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
