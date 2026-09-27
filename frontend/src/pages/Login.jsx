// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// REDESIGNED ENTERPRISE LOGIN PORTAL (3-ROLE + CAPTCHA + THEME + I18N)
// ======================================================================

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import heroImg from "../assets/hero-construction.jpg";

export default function Login() {
  const [activeRole, setActiveRole] = useState("Administrator"); // Administrator | Engineer | Worker
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [engineerId, setEngineerId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Security Math CAPTCHA
  const [numA, setNumA] = useState(5);
  const [numB, setNumB] = useState(7);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaSpin, setCaptchaSpin] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, currentUser } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const { t, isMarathi } = useLanguage();
  const navigate = useNavigate();

  // If already authenticated, route directly to the designated dashboard
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const userRole = (currentUser.role || "").toLowerCase();
      if (userRole === "worker") {
        navigate("/worker-dashboard", { replace: true });
      } else if (userRole === "engineer") {
        if (currentUser.mustChangePassword || currentUser.must_change_password) {
          navigate("/secure-account", { replace: true });
        } else {
          navigate("/engineer-dashboard", { replace: true });
        }
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  const generateCaptcha = () => {
    setCaptchaSpin(true);
    const a = Math.floor(Math.random() * 9) + 2;
    const b = Math.floor(Math.random() * 8) + 1;
    setNumA(a);
    setNumB(b);
    setCaptchaAnswer("");
    setTimeout(() => setCaptchaSpin(false), 500);
  };

  useEffect(() => {
    generateCaptcha();
  }, [activeRole]);

  const triggerShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate Math CAPTCHA
    if (Number(captchaAnswer) !== numA + numB) {
      triggerShake();
      toastError(
        t("captchaError", "Security Check Failed"),
        isMarathi ? "कृपया अचूक बेरीज टाका." : "Please enter the correct sum for math verification."
      );
      generateCaptcha();
      return;
    }

    // 2. Validate Role-Specific Inputs
    if (activeRole === "Administrator") {
      if (!email.trim() || !password) {
        triggerShake();
        toastError(t("error", "Error"), isMarathi ? "कृपया ईमेल व पासवर्ड टाका." : "Please enter your administrator email and password.");
        return;
      }
    } else if (activeRole === "Engineer") {
      if (!engineerId.trim() || !email.trim() || !password) {
        triggerShake();
        toastError(t("error", "Error"), isMarathi ? "कृपया अभियंता आयडी, ईमेल आणि पासवर्ड टाका." : "Please enter your Engineer ID (ENG-xxx), email, and password.");
        return;
      }
    } else if (activeRole === "Worker") {
      if (!workerId.trim() || !password) {
        triggerShake();
        toastError(t("error", "Error"), isMarathi ? "कृपया कामगार आयडी (WRK-xxx) आणि पासवर्ड टाका." : "Please enter your Worker ID (WRK-xxx) and password.");
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        role: activeRole,
        password,
      };

      if (activeRole === "Administrator") {
        payload.email = email.trim();
      } else if (activeRole === "Engineer") {
        payload.email = email.trim();
        payload.engineerId = engineerId.trim().toUpperCase();
      } else if (activeRole === "Worker") {
        payload.workerId = workerId.trim().toUpperCase();
        if (phoneOrEmail.trim()) {
          payload.identifier = phoneOrEmail.trim();
        }
      }

      const res = await login(payload);

      if (res.mfaRequired) {
        toastSuccess(t("mfaVerification", "MFA Required"), isMarathi ? "कृपया ऑथेंटिकेटर कोड टाका." : "Please provide your two-factor code.");
        navigate("/mfa", { replace: true });
        return;
      }

      if (res.mfaSetupRequired) {
        toastSuccess(t("mfaVerification", "MFA Setup Required"), isMarathi ? "सुरक्षेसाठी MFA सेट करा." : "Please set up two-factor authentication.");
        navigate("/mfa/setup", { replace: true });
        return;
      }

      toastSuccess(t("loginSuccess", "Login Successful"), `${isMarathi ? "स्वागत आहे, " : "Welcome back, "} ${res.user?.name || "User"}!`);

      const resRole = (res.user?.role || "").toLowerCase();
      if (resRole === "worker") {
        navigate("/worker-dashboard", { replace: true });
      } else if (resRole === "engineer") {
        if (res.mustChangePassword || res.user?.mustChangePassword) {
          navigate("/secure-account", { replace: true });
        } else {
          navigate("/engineer-dashboard", { replace: true });
        }
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      triggerShake();
      const errMsg = err.response?.data?.error || err.message || (isMarathi ? "लॉगिन अयशस्वी. कृपया तपशील तपासा." : "Invalid login credentials.");
      toastError(t("error", "Authentication Failed"), errMsg);
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid p-0 min-vh-100 d-flex flex-column flex-lg-row"
      style={{
        background: "var(--bg-page, #f4f8fb)",
        color: "var(--text-navy, #0f172a)",
        transition: "background 0.3s ease, color 0.3s ease"
      }}
    >
      {/* ---------------------------------------------------- */}
      {/* LEFT COLUMN: CINEMATIC CONSTRUCTION HERO VISUAL      */}
      {/* ---------------------------------------------------- */}
      <div
        className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #051322 0%, #082B3A 55%, #0B394E 100%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)"
        }}
      >
        {/* Background Overlay Image */}
        <div
          className="position-absolute"
          style={{
            inset: 0,
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.22,
            mixBlendMode: "luminosity",
            transform: "scale(1.04)",
            transition: "transform 10s ease"
          }}
        ></div>

        {/* Dynamic Architectural Grid & Glow */}
        <div
          className="position-absolute"
          style={{
            inset: 0,
            backgroundImage: "radial-gradient(circle at 20% 30%, rgba(39, 196, 232, 0.15) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(15, 168, 196, 0.12) 0%, transparent 50%)",
            pointerEvents: "none"
          }}
        ></div>

        {/* Top Brand Header */}
        <div className="position-relative z-1 d-flex align-items-center justify-content-between">
          <Link to="/" className="d-flex align-items-center gap-3 text-white text-decoration-none">
            <div
              className="d-flex align-items-center justify-content-center fw-bold rounded-3 shadow"
              style={{
                width: "44px",
                height: "44px",
                background: "linear-gradient(135deg, #0FA8C4, #27C4E8)",
                color: "#082B3A",
                fontSize: "19px",
                boxShadow: "0 4px 14px rgba(39, 196, 232, 0.35)"
              }}
            >
              <i className="bi bi-buildings-fill"></i>
            </div>
            <div>
              <div className="fw-bold fs-5 tracking-wide" style={{ letterSpacing: "0.5px" }}>
                {t("brandName", "SmartBuild Pro")}
              </div>
              <div className="text-white-50 small" style={{ fontSize: "0.72rem" }}>
                {t("tagline", "Enterprise Construction Management ERP")}
              </div>
            </div>
          </Link>

          <span className="badge rounded-pill bg-white bg-opacity-10 border border-white border-opacity-20 px-3 py-1.5 small text-cyan">
            <i className="bi bi-shield-lock-fill me-1 text-info"></i> 256-Bit Encrypted
          </span>
        </div>

        {/* Hero Central Value Proposition */}
        <div className="position-relative z-1 my-auto py-5" style={{ maxWidth: "540px" }}>
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-white bg-opacity-10 border border-white border-opacity-20 mb-3 small">
            <span className="spinner-grow spinner-grow-sm text-info" role="status"></span>
            <span className="fw-semibold text-info-light">{t("landingHeroBadge", "Next-Gen Construction Operating System")}</span>
          </div>

          <h1 className="display-6 fw-bold text-white mb-3" style={{ lineHeight: 1.25 }}>
            {t("landingHeroTitle", "Build Smarter. Manage Better. Build Together.")}
          </h1>

          <p className="lead text-white-50 mb-4" style={{ fontSize: "1.05rem" }}>
            {t(
              "landingHeroSubtitle",
              "Unified field workforce coordination, engineer budget allocations, verifiable worker disbursements, and real-time project safety."
            )}
          </p>

          {/* Key Value Badges */}
          <div className="row g-3 pt-2">
            <div className="col-6">
              <div className="p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-10 backdrop-blur">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-people-fill text-info fs-5"></i>
                  <span className="fw-bold fs-5 text-white">100%</span>
                </div>
                <div className="small text-white-50">{isMarathi ? "कामगार हजेरी व लेजर" : "Verified Workforce Ledger"}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-10 backdrop-blur">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-cash-stack text-success fs-5"></i>
                  <span className="fw-bold fs-5 text-white">₹0 Drift</span>
                </div>
                <div className="small text-white-50">{isMarathi ? "दुहेरी नियंत्रण पेमेंट सुरक्षा" : "Dual-Control Budget Safety"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Footer Meta */}
        <div className="position-relative z-1 d-flex align-items-center justify-content-between text-white-50 small border-top border-white border-opacity-10 pt-3">
          <span>{t("copyrightNotice", "© 2026 Smart Construction ERP")}</span>
          <span className="d-flex align-items-center gap-2">
            <i className="bi bi-translate text-info"></i>
            {isMarathi ? "मराठी व इंग्रजी भाषा समर्थन" : "Bilingual English & Marathi"}
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* RIGHT COLUMN: INTERACTIVE ROLE LOGIN CARD            */}
      {/* ---------------------------------------------------- */}
      <div className="col-lg-6 d-flex flex-column justify-content-between p-4 p-md-5">
        {/* Top Controls: Language Selector & Theme Toggle */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Link to="/" className="d-flex d-lg-none align-items-center gap-2 text-decoration-none" style={{ color: "var(--text-navy)" }}>
            <div
              className="d-flex align-items-center justify-content-center fw-bold rounded-2 text-white"
              style={{ width: "32px", height: "32px", background: "var(--color-primary, #0FA8C4)" }}
            >
              <i className="bi bi-buildings"></i>
            </div>
            <span className="fw-bold">{t("brandName", "SmartBuild")}</span>
          </Link>

          <div className="d-none d-lg-block">
            <Link to="/" className="text-decoration-none small text-muted hover-underline">
              <i className="bi bi-arrow-left me-1"></i> {t("back", "Back to Home")}
            </Link>
          </div>

          <div className="d-flex align-items-center gap-2 ms-auto">
            <LanguageSelector />
            <ThemeToggle compact={true} />
          </div>
        </div>

        {/* Main Card Wrapper */}
        <div
          className={`card border-0 shadow-lg rounded-4 mx-auto w-100 p-4 p-md-5 ${shakeError ? "animate-shake" : ""}`}
          style={{
            maxWidth: "520px",
            background: "var(--bg-card, #ffffff)",
            borderColor: "var(--border-color, #e2e8f0)",
            transition: "all 0.3s ease"
          }}
        >
          {/* Header */}
          <div className="mb-4">
            <h2 className="fw-bold mb-1" style={{ color: "var(--text-navy, #0f172a)", fontSize: "1.65rem" }}>
              {t("loginTitle", "Sign in to your account")}
            </h2>
            <p className="text-muted small mb-0">
              {t("loginSubtitle", "Select your designated role to enter the secure portal")}
            </p>
          </div>

          {/* 3-Role Interactive Switcher Tabs */}
          <div
            className="p-1 rounded-3 mb-4 d-flex gap-1"
            style={{
              background: "var(--bg-alt, #edf3f7)",
              border: "1px solid var(--border-color, #e2ebf0)"
            }}
          >
            {[
              { role: "Administrator", label: t("adminTab", "Administrator"), icon: "bi-shield-shaded" },
              { role: "Engineer", label: t("engineerTab", "Site Engineer"), icon: "bi-cone-striped" },
              { role: "Worker", label: t("workerTab", "Worker"), icon: "bi-person-badge-fill" }
            ].map((tab) => {
              const active = activeRole === tab.role;
              return (
                <button
                  key={tab.role}
                  type="button"
                  onClick={() => setActiveRole(tab.role)}
                  className={`btn btn-sm flex-grow-1 py-2 px-2 d-flex align-items-center justify-content-center gap-1.5 rounded-2 transition-all ${
                    active ? "shadow-sm fw-bold" : "text-muted"
                  }`}
                  style={{
                    background: active ? "var(--bg-card, #ffffff)" : "transparent",
                    color: active ? "var(--color-primary, #0fa8c4)" : "var(--text-muted, #64748b)",
                    fontSize: "0.825rem",
                    border: "none"
                  }}
                >
                  <i className={`bi ${tab.icon}`} style={{ fontSize: "0.95rem" }}></i>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Login Form */}
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            {/* 1. Worker Role Fields */}
            {activeRole === "Worker" && (
              <>
                <div>
                  <label className="form-label small fw-semibold mb-1" style={{ color: "var(--text-navy)" }}>
                    <i className="bi bi-person-vcard text-primary me-1"></i>
                    {t("workerId", "Worker ID")} <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0">
                      <i className="bi bi-card-heading text-muted"></i>
                    </span>
                    <input
                      type="text"
                      required
                      value={workerId}
                      onChange={(e) => setWorkerId(e.target.value)}
                      placeholder="WRK-001"
                      className="form-control border-start-0"
                      style={{ textTransform: "uppercase" }}
                    />
                  </div>
                  <div className="form-text small" style={{ fontSize: "0.75rem" }}>
                    {isMarathi ? "साइट अभियंत्याने दिलेला कामगार आयडी टाका" : "Enter your unique ID issued by your site engineer"}
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-semibold mb-1" style={{ color: "var(--text-navy)" }}>
                    <i className="bi bi-phone text-primary me-1"></i>
                    {isMarathi ? "नोंदणीकृत मोबाईल नंबर (पर्यायी)" : "Registered Mobile / Email (Optional)"}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0">
                      <i className="bi bi-telephone text-muted"></i>
                    </span>
                    <input
                      type="text"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      placeholder="9823456789"
                      className="form-control border-start-0"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 2. Engineer Role Fields */}
            {activeRole === "Engineer" && (
              <div>
                <label className="form-label small fw-semibold mb-1" style={{ color: "var(--text-navy)" }}>
                  <i className="bi bi-badge-ad text-primary me-1"></i>
                  {t("engineerId", "Engineer ID")} <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bi bi-hash text-muted"></i>
                  </span>
                  <input
                    type="text"
                    required
                    value={engineerId}
                    onChange={(e) => setEngineerId(e.target.value)}
                    placeholder="ENG-001"
                    className="form-control border-start-0"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
              </div>
            )}

            {/* 3. Email (for Admin and Engineer) */}
            {activeRole !== "Worker" && (
              <div>
                <label className="form-label small fw-semibold mb-1" style={{ color: "var(--text-navy)" }}>
                  <i className="bi bi-envelope text-primary me-1"></i>
                  {t("emailAddress", "Email Address")} <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bi bi-at text-muted"></i>
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeRole === "Administrator" ? "admin@smartbuild.com" : "engineer@smartbuild.com"}
                    className="form-control border-start-0"
                  />
                </div>
              </div>
            )}

            {/* 4. Password (Common to all roles) */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label small fw-semibold mb-0" style={{ color: "var(--text-navy)" }}>
                  <i className="bi bi-key text-primary me-1"></i>
                  {t("password", "Password")} <span className="text-danger">*</span>
                </label>
                {activeRole !== "Worker" && (
                  <span className="small text-muted" style={{ fontSize: "0.75rem", cursor: "pointer" }}>
                    {t("forgotPassword", "Forgot?")}
                  </span>
                )}
              </div>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0">
                  <i className="bi bi-lock text-muted"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-control border-start-0 border-end-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-group-text bg-transparent border-start-0"
                  style={{ cursor: "pointer" }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"} text-muted`}></i>
                </button>
              </div>
            </div>

            {/* 5. Interactive Security Math CAPTCHA */}
            <div
              className="p-3 rounded-3 border"
              style={{
                background: "var(--bg-alt, #edf3f7)",
                borderColor: "var(--border-color, #e2ebf0)"
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="small fw-semibold mb-0 d-flex align-items-center gap-1.5" style={{ color: "var(--text-navy)" }}>
                  <i className="bi bi-shield-check text-info"></i>
                  <span>{t("captchaPrompt", "Security Check:")}</span>
                </label>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="btn btn-sm btn-link p-0 text-decoration-none text-muted"
                  title="Generate new calculation"
                >
                  <i className={`bi bi-arrow-clockwise d-inline-block ${captchaSpin ? "spin-animation" : ""}`}></i>
                  <span className="ms-1 small">{t("refresh", "New")}</span>
                </button>
              </div>

              <div className="d-flex align-items-center gap-2">
                <div
                  className="px-3 py-1.5 rounded-2 fw-bold text-center user-select-none shadow-sm"
                  style={{
                    background: "var(--bg-card, #ffffff)",
                    color: "var(--color-primary, #0fa8c4)",
                    fontSize: "1.05rem",
                    letterSpacing: "2px",
                    border: "1px dashed var(--border-color, #cbd5e1)"
                  }}
                >
                  {numA} + {numB} = ?
                </div>

                <input
                  type="number"
                  required
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder={t("captchaPlaceholder", "Answer")}
                  className="form-control text-center fw-bold"
                  style={{ maxWidth: "120px" }}
                />
              </div>
            </div>

            {/* 6. Remember Me Checkbox */}
            <div className="d-flex align-items-center justify-content-between pt-1">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label small text-muted" htmlFor="rememberMe">
                  {t("rememberMe", "Remember my session")}
                </label>
              </div>
            </div>

            {/* 7. Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2.5 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 mt-2"
              style={{
                background: "linear-gradient(135deg, #0FA8C4 0%, #082B3A 100%)",
                border: "none",
                fontSize: "0.95rem"
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>{t("signingIn", "Verifying credentials...")}</span>
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>
                    {t("signIn", "Sign In")}
                    {activeRole === "Worker" ? ` (${t("workerRole", "Worker")})` : activeRole === "Engineer" ? ` (${t("engineerRole", "Engineer")})` : ` (${t("adminRole", "Administrator")})`}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-4 pt-3 border-top text-center">
            <div className="text-muted small mb-2" style={{ fontSize: "0.75rem" }}>
              {t("needAssistance", "Need system access or credentials assistance?")}
            </div>
            <div className="d-flex justify-content-center gap-2 flex-wrap" style={{ fontSize: "0.725rem" }}>
              <span className="badge bg-light text-dark border">Admin: admin@smartbuild.com</span>
              <span className="badge bg-light text-dark border">Eng: ENG-001</span>
              <span className="badge bg-light text-dark border">Worker: WRK-001 / Worker@123</span>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="text-center text-muted small mt-4">
          <i className="bi bi-shield-check text-success me-1"></i>
          {isMarathi
            ? "सुरक्षित एसएसएल कूटबद्धीकरण व बँक-दर्जा डेटा सुरक्षा"
            : "Protected by TLS encryption & dual-factor verification"}
        </div>
      </div>

      {/* Inline styles for custom animations */}
      <style>{`
        .spin-animation {
          animation: spinAround 0.5s ease;
        }
        @keyframes spinAround {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-shake {
          animation: shakeCard 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shakeCard {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(4px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
          40%, 60% { transform: translate3d(6px, 0, 0); }
        }
      `}</style>
    </div>
  );
}
