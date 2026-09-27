// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// ENTERPRISE SAAS LANDING PAGE (16-SECTIONS, BILINGUAL, THEME ADAPTIVE)
// ======================================================================

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import LanguageSelector from "../components/LanguageSelector";
import ThemeToggle from "../components/ThemeToggle";
import Construction3DHero from "../components/Construction3DHero";
import heroImg from "../assets/hero-construction.jpg";

export default function Landing() {
  const { t, isMarathi } = useLanguage();
  const { isDark } = useTheme();
  const [heroMode, setHeroMode] = useState("photo"); // 'photo' or '3d'
  const [openFaq, setOpenFaq] = useState(0);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // 16 Sections Data
  const stats = [
    { value: "120+", label: isMarathi ? "सक्रिय बांधकाम प्रकल्प" : "Active Construction Sites", icon: "bi-buildings" },
    { value: "15,000+", label: isMarathi ? "नोंदणीकृत कारागीर व कामगार" : "Verified Workforce Roster", icon: "bi-people" },
    { value: "₹85Cr+", label: isMarathi ? "सुरक्षित मजुरी वाटप तपासणी" : "Audited Wage Disbursements", icon: "bi-cash-coin" },
    { value: "99.99%", label: isMarathi ? "अविरत प्रणाली उपलब्धता" : "High-Availability SLA", icon: "bi-shield-check" }
  ];

  const roleArchitecture = [
    {
      role: t("adminRole", "Administrator"),
      badge: isMarathi ? "मुख्यालय नियंत्रण" : "HQ Operations",
      color: "#082B3A",
      bgGradient: "linear-gradient(135deg, #082B3A, #0FA8C4)",
      icon: "bi-shield-shaded",
      desc: isMarathi
        ? "सर्व प्रकल्पांचे एकत्रित आर्थिक लेजर, अभियंत्यांना निधी वाटप, ऑडिट ट्रॅक आणि संपूर्ण कंपनीची डिजिटल सुरक्षितता."
        : "Portfolio-wide governance, engineer budget allocation, contractor oversight, payment audit compliance, and system-wide security.",
      features: isMarathi
        ? ["अभियंत्यांना बजेट वाटप", "१०-मुद्दे पेमेंट ऑडिट अहवाल", "प्रकल्प खर्च विश्लेषण", "MFA व डेटा गोपनीयता"]
        : ["Allocate Engineer Budgets", "10-Point Payment Audits", "Portfolio Expense Analytics", "MFA & Role Governance"]
    },
    {
      role: t("engineerRole", "Site Engineer"),
      badge: isMarathi ? "फील्ड सुपरव्हिजन" : "Jobsite Console",
      color: "#0FA8C4",
      bgGradient: "linear-gradient(135deg, #0FA8C4, #27C4E8)",
      icon: "bi-cone-striped",
      desc: isMarathi
        ? "साइटवरील कामगारांची नोंदणी, दैनंदिन हजेरी भरणे, मंजूर निधीतून मजुरीचे व्हाउचर्स देणे आणि कामाची प्रगती नोंदवणे."
        : "Enrolls site workers (exclusive permission), marks daily attendance, issues worker payment vouchers from assigned funds, and reports daily progress.",
      features: isMarathi
        ? ["केवळ अभियंत्यांना कामगार जोडण्याची मुभा", "कामगारांना मजुरी वाटप व्हाउचर्स", "मटेरियल व कामगार हजेरी ट्रॅकिंग", "दैनिक प्रगती व सुरक्षितता नोंदी"]
        : ["Exclusive 'Add Worker' Authority", "Issue WPAY-xxx Payment Vouchers", "Attendance & Material Logs", "Daily Milestone Verification"]
    },
    {
      role: t("workerRole", "Worker Portal"),
      badge: isMarathi ? "पारदर्शक कामगार पोर्टल" : "Field Worker Self-Service",
      color: "#10B981",
      bgGradient: "linear-gradient(135deg, #059669, #10B981)",
      icon: "bi-person-badge",
      desc: isMarathi
        ? "कामगारांसाठी स्वतःची हजेरी, रोजंदारी दर, महिन्याची एकूण कमाई, मिळालेल्या मजुरीच्या पावत्या आणि कागदपत्रे पाहण्याची सोय."
        : "Transparent self-service view for every worker: view today's attendance, daily wage rate, month earnings, payment vouchers, and official documents.",
      features: isMarathi
        ? ["WRK-xxx आयडी द्वारे सोपे लॉगिन", "दैनंदिन हजेरी व रोजंदारी तपासणी", "सर्व पेमेंट व्हाउचर्स व पावत्या", "आधार व बँक कागदपत्रे संच"]
        : ["Secure Login via WRK-xxx ID", "Real-time Attendance Status", "Payment Voucher History", "Official ID & Document Vault"]
    }
  ];

  const platformModules = [
    {
      icon: "bi-people-fill",
      title: isMarathi ? "कामगार दल व डिजिटल डॉसियर" : "Workforce Dossier System",
      desc: isMarathi
        ? "अनुक्रमिक WRK-xxx आयडी, कौशल्यांचे वर्गीकरण, आपत्कालीन संपर्क आणि संपूर्ण कार्य इतिहास एकाच ठिकाणी."
        : "Sequential WRK-xxx identifiers, trade skills categorization, emergency contacts, wage configurations, and verified work history."
    },
    {
      icon: "bi-cash-stack",
      title: isMarathi ? "दुहेरी नियंत्रण आर्थिक लेजर" : "Dual-Control Payment Ledger",
      desc: isMarathi
        ? "प्रशासक अभियंत्याला निधी देतात; अभियंता कामगाराला मजुरी देतो. शिल्लक रकमेची काटेकोर स्वयंचलित पडताळणी."
        : "Admin allocates budget to engineers; engineers disburse payments to workers. Real-time balance checks prevent overspending."
    },
    {
      icon: "bi-calendar2-check-fill",
      title: isMarathi ? "बायोमेट्रिक-सुसंगत हजेरी" : "Daily Attendance & Muster Roll",
      desc: isMarathi
        ? "उपस्थित, अनुपस्थित, अर्धा दिवस व ओव्हरटाइम नोंदी. मासिक पगाराशी थेट स्वयंचलित जोडणी."
        : "Mark present, absent, half-day, and overtime hours. Directly connected to automated monthly payroll calculations."
    },
    {
      icon: "bi-box-seam-fill",
      title: isMarathi ? "मटेरियल व साठा व्यवस्थापन" : "Material Inventory & Restock",
      desc: isMarathi
        ? "सिमेंट, स्टील, वाळू व इतर साहित्याचा साठा, वापर आणि किमान मर्यादा अलर्ट्स."
        : "Track cement, TMT steel, aggregates, and hardware with dynamic reorder thresholds and site consumption logs."
    },
    {
      icon: "bi-graph-up-arrow",
      title: isMarathi ? "दैनिक प्रगती व माइलस्टोन्स" : "Daily Progress & Handover",
      desc: isMarathi
        ? "दररोज पूर्ण झालेल्या कामाची टक्केवारी, छायाचित्रे आणि अभियंत्यांचे तांत्रिक शेरे."
        : "Document daily output, percentage progress against targets, deployed labor gangs, and engineering inspection logs."
    },
    {
      icon: "bi-shield-exclamation",
      title: isMarathi ? "साइट सुरक्षा व समस्या निवारण" : "Hazard & Safety Protocols",
      desc: isMarathi
        ? "अपघात टाळण्यासाठी त्वरित समस्या नोंदणी, तीव्रता वर्गवारी आणि निवारण कार्यप्रवाह."
        : "Capture near-misses, equipment hazards, and safety risks with structured resolution escalation."
    }
  ];

  const faqs = [
    {
      q: isMarathi ? "प्रणालीमध्ये कामगार कसा जोडला जातो?" : "How are workers registered in the system?",
      a: isMarathi
        ? "केवळ अधिकृत साइट अभियंताच नवीन कामगार जोडू शकतात. प्रशासकाला थेट कामगार जोडण्याची परवानगी नसते. अभियंता माहिती भरताच कामगाराचा युनिक आयडी (उदा. WRK-001) आणि पोर्टल लॉगिन स्वयंचलित तयार होते."
        : "Only assigned Site Engineers have the authority to add workers. Administrators are restricted to auditing. When an engineer enrolls a worker, a sequential WRK-xxx ID and portal login are automatically provisioned."
    },
    {
      q: isMarathi ? "पैशांचे व्यवहार सुरक्षित व नियंत्रित कसे राहतात?" : "How is financial payment safety enforced?",
      a: isMarathi
        ? "प्रणालीमध्ये दुहेरी नियंत्रण आहे: १. प्रशासक अभियंत्याला ठरावीक बजेट मंजूर करतो. २. अभियंता त्या मंजूर रकमेतूनच कामगारांना मजुरी देतो. शिल्लक संपल्यास अभियंता पैसे देऊ शकत नाही."
        : "The platform enforces dual-control financial discipline: HQ Administrators allocate specific funds to Site Engineers. Engineers disburse payments to workers strictly within their available balance, with server-side transaction locks."
    },
    {
      q: isMarathi ? "कामगार स्वतःचा पगार व हजेरी कसा पाहू शकतात?" : "Can workers check their own attendance and wage payout?",
      a: isMarathi
        ? "होय, कामगार त्यांच्या WRK-xxx आयडी किंवा मोबाईल नंबरने कामगार पोर्टलवर लॉगिन करून आजची हजेरी, रोजंदारी दर, महिन्याची कमाई आणि व्हाउचर्स पाहू शकतात."
        : "Yes! Field workers can log into their dedicated Worker Portal using their WRK-xxx ID or mobile phone to view today's attendance, daily wage rate, monthly earnings, and official payment vouchers."
    },
    {
      q: isMarathi ? "मराठी व इंग्रजी भाषा कशी बदलावी?" : "How do I switch between English and Marathi?",
      a: isMarathi
        ? "पृष्ठावरील उजव्या कोपऱ्यातील '🌐 भाषा' बटनावर क्लिक करून तात्काळ इंग्रजी किंवा मराठी भाषा निवडता येते. सर्व फॉर्म, व्हाउचर्स व बटणे निवडलेल्या भाषेत बदलतात."
        : "Use the global Language Selector in the top navigation or page header to toggle between English and Marathi. The entire interface, tables, forms, and status badges translate instantly."
    }
  ];

  return (
    <div
      style={{
        background: "var(--bg-page, #f4f8fb)",
        color: "var(--text-navy, #0f172a)",
        minHeight: "100vh",
        transition: "background 0.3s ease, color 0.3s ease"
      }}
    >
      {/* ==================================================== */}
      {/* SECTION 1: GLOBAL TOP NAVIGATION BAR                 */}
      {/* ==================================================== */}
      <nav
        className="navbar navbar-expand-lg sticky-top border-bottom px-3 px-md-5 py-2.5"
        style={{
          background: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--border-color)",
          zIndex: 1040
        }}
      >
        <div className="container-fluid d-flex justify-content-between align-items-center">
          {/* Brand Logo */}
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2.5 m-0">
            <div
              className="d-flex align-items-center justify-content-center text-white fw-bold rounded-3 shadow-sm"
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #0FA8C4, #27C4E8)",
                color: "#082B3A",
                fontSize: "18px"
              }}
            >
              <i className="bi bi-buildings-fill"></i>
            </div>
            <div>
              <div className="fw-bolder tracking-wide" style={{ fontSize: "1.05rem", color: "var(--text-navy)" }}>
                {t("brandName", "SmartBuild Pro")}
              </div>
              <div className="text-muted small" style={{ fontSize: "0.72rem" }}>
                {isMarathi ? "बांधकाम ईआरपी प्रणाली" : "Construction ERP"}
              </div>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="d-none d-lg-flex align-items-center gap-4">
            <a href="#roles" onClick={scrollTo("roles")} className="text-decoration-none fw-semibold small text-muted hover-navy">
              {isMarathi ? "भूमिका रचना" : "Roles Architecture"}
            </a>
            <a href="#features" onClick={scrollTo("features")} className="text-decoration-none fw-semibold small text-muted hover-navy">
              {isMarathi ? "वैशिष्ट्ये" : "Modules"}
            </a>
            <a href="#financial" onClick={scrollTo("financial")} className="text-decoration-none fw-semibold small text-muted hover-navy">
              {isMarathi ? "आर्थिक लेजर" : "Financial Ledger"}
            </a>
            <a href="#security" onClick={scrollTo("security")} className="text-decoration-none fw-semibold small text-muted hover-navy">
              {isMarathi ? "सुरक्षा" : "Security"}
            </a>
            <a href="#faq" onClick={scrollTo("faq")} className="text-decoration-none fw-semibold small text-muted hover-navy">
              {isMarathi ? "प्रश्न उत्तरे" : "FAQ"}
            </a>
          </div>

          {/* Right Controls: I18n, Theme, and Login CTA */}
          <div className="d-flex align-items-center gap-2.5">
            <LanguageSelector />
            <ThemeToggle />
            <Link
              to="/login"
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, #0FA8C4, #082B3A)",
                color: "#ffffff",
                border: "none",
                fontSize: "0.85rem"
              }}
            >
              <span>{t("signIn", "Sign In")}</span>
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>
      </nav>

      {/* ==================================================== */}
      {/* SECTION 2: HERO SECTION                              */}
      {/* ==================================================== */}
      <header className="position-relative overflow-hidden py-5 py-lg-6">
        <div className="container py-4">
          <div className="row align-items-center g-5">
            {/* Left Headline */}
            <motion.div
              className="col-lg-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill mb-3 small border shadow-sm"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                <span className="badge bg-primary rounded-pill px-2">2026</span>
                <span className="fw-semibold text-primary">{t("landingHeroBadge", "Next-Gen Construction Operating System")}</span>
              </div>

              <h1 className="display-4 fw-extrabold mb-3" style={{ lineHeight: 1.18, color: "var(--text-navy)" }}>
                {t("landingHeroTitle", "Build Smarter. Manage Better. Build Together.")}
              </h1>

              <p className="lead text-muted mb-4" style={{ fontSize: "1.1rem", lineHeight: 1.6 }}>
                {t(
                  "landingHeroSubtitle",
                  "The unified operating system for high-performance construction teams. Connect headquarters, site engineers, and field workforce seamlessly with verified financial ledgers, instant attendance, and multilingual transparency."
                )}
              </p>

              {/* Action Buttons */}
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <Link
                  to="/login"
                  className="btn btn-lg fw-bold px-4 py-2.5 rounded-pill shadow d-flex align-items-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #0FA8C4 0%, #082B3A 100%)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "0.95rem"
                  }}
                >
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>{t("accessConsole", "Access System Portal")}</span>
                </Link>

                <a
                  href="#features"
                  onClick={scrollTo("features")}
                  className="btn btn-lg btn-outline-secondary px-4 py-2.5 rounded-pill fw-semibold"
                  style={{ fontSize: "0.95rem" }}
                >
                  {t("explorePlatform", "Explore Live Platform")}
                </a>
              </div>

              {/* Quick Trust Meta */}
              <div className="d-flex align-items-center gap-4 mt-4 pt-2 text-muted small">
                <span className="d-flex align-items-center gap-1.5">
                  <i className="bi bi-check-circle-fill text-success"></i>
                  {isMarathi ? "दुहेरी नियंत्रण लेजर" : "Dual-Control Ledger"}
                </span>
                <span className="d-flex align-items-center gap-1.5">
                  <i className="bi bi-check-circle-fill text-success"></i>
                  {isMarathi ? "इंग्रजी व मराठी" : "English & Marathi"}
                </span>
                <span className="d-flex align-items-center gap-1.5">
                  <i className="bi bi-check-circle-fill text-success"></i>
                  {isMarathi ? "बँक दर्जा सुरक्षा" : "Bank-Grade Security"}
                </span>
              </div>
            </motion.div>

            {/* Right Interactive Visual */}
            <motion.div
              className="col-lg-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="card border-0 shadow-lg rounded-4 overflow-hidden position-relative"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                {/* Visual View Switcher */}
                <div className="position-absolute top-0 end-0 m-3 z-3 d-flex gap-1.5 p-1 rounded-pill bg-dark bg-opacity-75 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setHeroMode("photo")}
                    className={`btn btn-xs py-1 px-2.5 rounded-pill text-white small ${heroMode === "photo" ? "btn-info text-dark fw-bold" : "btn-link text-white text-decoration-none"}`}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Jobsite View
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroMode("3d")}
                    className={`btn btn-xs py-1 px-2.5 rounded-pill text-white small ${heroMode === "3d" ? "btn-info text-dark fw-bold" : "btn-link text-white text-decoration-none"}`}
                    style={{ fontSize: "0.75rem" }}
                  >
                    3D Blueprint
                  </button>
                </div>

                <div style={{ height: "420px", position: "relative" }}>
                  {heroMode === "photo" ? (
                    <img
                      src={heroImg}
                      alt="Construction Operations"
                      className="w-100 h-100 object-fit-cover"
                    />
                  ) : (
                    <Construction3DHero />
                  )}
                </div>

                {/* Floating Metric Pill */}
                <div
                  className="position-absolute bottom-0 start-0 m-3 p-3 rounded-3 shadow-lg border backdrop-blur d-flex align-items-center gap-3"
                  style={{
                    background: "rgba(15, 23, 42, 0.85)",
                    color: "#ffffff",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    zIndex: 2
                  }}
                >
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-success text-white" style={{ width: "38px", height: "38px" }}>
                    <i className="bi bi-shield-check fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold small">{isMarathi ? "प्रमाणित हिशेब तपासणी" : "Cryptographically Audited"}</div>
                    <div className="text-white-50" style={{ fontSize: "0.75rem" }}>
                      {isMarathi ? "शून्य त्रुटी लेजर पडताळणी" : "Zero-drift voucher verification"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ==================================================== */}
      {/* SECTION 3: TRUST STATS & METRICS TICKER             */}
      {/* ==================================================== */}
      <section className="py-4 border-top border-bottom" style={{ background: "var(--bg-alt)", borderColor: "var(--border-color)" }}>
        <div className="container">
          <div className="row g-4 text-center">
            {stats.map((s, idx) => (
              <div key={idx} className="col-6 col-md-3">
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi ${s.icon} fs-3 text-primary mb-1`}></i>
                  <div className="display-6 fw-extrabold mb-0" style={{ color: "var(--text-navy)" }}>{s.value}</div>
                  <div className="text-muted small fw-semibold mt-1">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION 4: 3-TIER ROLE ARCHITECTURE                  */}
      {/* ==================================================== */}
      <section id="roles" className="py-5 py-lg-6">
        <div className="container py-4">
          <div className="text-center max-w-700 mx-auto mb-5" style={{ maxWidth: "680px" }}>
            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 fw-bold mb-2">
              {isMarathi ? "३-स्तरीय सुरक्षा मॉडेल" : "Granular Role Architecture"}
            </span>
            <h2 className="display-6 fw-bold mb-3" style={{ color: "var(--text-navy)" }}>
              {isMarathi ? "प्रत्येक भूमिकेसाठी स्वतंत्र व सुरक्षित पोर्टल" : "Engineered with Strict Role Separation"}
            </h2>
            <p className="text-muted">
              {isMarathi
                ? "मुख्यालय प्रशासक, साइट अभियंते आणि क्षेत्रीय कामगारांसाठी स्वतंत्र प्रवेश मर्यादा व विशेषाधिकार."
                : "Cryptographically enforced permissions preventing privilege escalation across administrators, engineers, and workers."}
            </p>
          </div>

          <div className="row g-4">
            {roleArchitecture.map((item, idx) => (
              <div key={idx} className="col-12 col-md-4">
                <div
                  className="card h-100 border-0 shadow-sm rounded-4 p-4 d-flex flex-column justify-content-between"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
                >
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm"
                        style={{ width: "48px", height: "48px", background: item.bgGradient }}
                      >
                        <i className={`bi ${item.icon} fs-4`}></i>
                      </div>
                      <span className="badge bg-light text-dark border px-2.5 py-1 small">{item.badge}</span>
                    </div>

                    <h3 className="h5 fw-bold mb-2" style={{ color: "var(--text-navy)" }}>{item.role}</h3>
                    <p className="text-muted small mb-4">{item.desc}</p>

                    <div className="border-top pt-3">
                      <div className="fw-semibold small mb-2" style={{ color: "var(--text-navy)" }}>
                        {isMarathi ? "प्रमुख अधिकार:" : "Key Privileges:"}
                      </div>
                      <ul className="list-unstyled mb-0 d-flex flex-column gap-2 small text-muted">
                        {item.features.map((f, fIdx) => (
                          <li key={fIdx} className="d-flex align-items-center gap-2">
                            <i className="bi bi-check2-circle text-primary"></i>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <Link
                      to="/login"
                      className="btn btn-outline-primary w-100 btn-sm rounded-pill fw-semibold"
                    >
                      {isMarathi ? `${item.role} म्हणून प्रवेश` : `Enter as ${item.role}`}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION 5: FINANCIAL LEDGER & BUDGET ENFORCEMENT     */}
      {/* ==================================================== */}
      <section id="financial" className="py-5 py-lg-6" style={{ background: "var(--bg-alt)" }}>
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1.5 fw-bold mb-2">
                {isMarathi ? "दुहेरी नियंत्रण आर्थिक शिस्त" : "Financial Integrity"}
              </span>
              <h2 className="display-6 fw-bold mb-3" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "बजेट वाटप ते कामगार मजुरी व्हाउचर" : "Dual-Control Budgeting & Zero Overspending"}
              </h2>
              <p className="text-muted mb-4">
                {isMarathi
                  ? "मुख्यालय प्रशासक साइट अभियंत्यांना टप्प्याटप्प्याने निधी मंजूर करतो. अभियंता केवळ मंजूर शिल्लक रकमेतूनच कामगारांना अधिकृत मजुरी व्हाउचर्स (WPAY-xxx) जारी करू शकतो."
                  : "HQ allocates budget tranches to Site Engineers with purpose notes. Site Engineers can disburse wages only against positive verified balances, ensuring zero unauthorized deficits."}
              </p>

              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <div className="fw-bold d-flex align-items-center gap-2" style={{ color: "var(--text-navy)" }}>
                    <i className="bi bi-bank text-primary"></i>
                    <span>{isMarathi ? "१. प्रशासक निधी वाटप (Admin Allocation)" : "1. Admin Allocation to Engineers"}</span>
                  </div>
                  <div className="text-muted small mt-1">
                    {isMarathi ? "प्रकल्पाच्या टप्प्यानुसार अभियंत्याकडे निधी वर्ग केला जातो." : "Tranche funds assigned directly to site engineer's operational account."}
                  </div>
                </div>

                <div className="p-3 rounded-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <div className="fw-bold d-flex align-items-center gap-2" style={{ color: "var(--text-navy)" }}>
                    <i className="bi bi-receipt text-success"></i>
                    <span>{isMarathi ? "२. मजुरी व्हाउचर जारी करणे (WPAY-xxx)" : "2. Issue Verified WPAY-xxx Vouchers"}</span>
                  </div>
                  <div className="text-muted small mt-1">
                    {isMarathi ? "प्रत्येक व्हाउचरावर तारीख, मोड, रक्कम व शेरा नोंदवून लेजर अपडेट होते." : "Cryptographically tracked voucher records amount, payment mode, date, and audit trail."}
                  </div>
                </div>

                <div className="p-3 rounded-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <div className="fw-bold d-flex align-items-center gap-2" style={{ color: "var(--text-navy)" }}>
                    <i className="bi bi-file-earmark-check text-info"></i>
                    <span>{isMarathi ? "३. १०-मुद्दे पेमेंट ऑडिट अहवाल" : "3. Real-Time 10-Point Audit Reports"}</span>
                  </div>
                  <div className="text-muted small mt-1">
                    {isMarathi ? "एकूण निधी, खर्च, शिल्लक आणि बाकी मजुरीचे स्वयंचलित गणित." : "Instant mathematical reconciliation of all allocations, payments, and worker balances."}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div
                className="card border-0 shadow-lg rounded-4 p-4"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
              >
                <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                  <span className="fw-bold" style={{ color: "var(--text-navy)" }}>
                    {isMarathi ? "थेट लेजर ऑडिट पूर्वावलोकन" : "Live Financial Ledger Preview"}
                  </span>
                  <span className="badge bg-success rounded-pill">Verified Balance</span>
                </div>

                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light">
                    <div>
                      <small className="text-muted d-block">{t("totalAllocatedBudget", "HQ Allocated Budget")}</small>
                      <strong className="fs-5 text-primary">₹500,000.00</strong>
                    </div>
                    <i className="bi bi-arrow-down-right-circle text-primary fs-3"></i>
                  </div>

                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light">
                    <div>
                      <small className="text-muted d-block">{t("totalPaidToWorkers", "Disbursed to Workforce")}</small>
                      <strong className="fs-5 text-success">₹142,500.00</strong>
                    </div>
                    <span className="badge bg-success-subtle text-success">28 Vouchers</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light">
                    <div>
                      <small className="text-muted d-block">{t("remainingEngineerBalance", "Remaining Engineer Fund")}</small>
                      <strong className="fs-5 text-info">₹357,500.00</strong>
                    </div>
                    <span className="badge bg-info-subtle text-info">Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION 6: PLATFORM CORE MODULES                    */}
      {/* ==================================================== */}
      <section id="features" className="py-5 py-lg-6">
        <div className="container py-4">
          <div className="text-center max-w-700 mx-auto mb-5" style={{ maxWidth: "680px" }}>
            <span className="badge bg-info-subtle text-info rounded-pill px-3 py-1.5 fw-bold mb-2">
              {isMarathi ? "संपूर्ण ईआरपी कार्यप्रणाली" : "Complete ERP Suite"}
            </span>
            <h2 className="display-6 fw-bold mb-3" style={{ color: "var(--text-navy)" }}>
              {isMarathi ? "बांधकाम प्रकल्पासाठी सर्व आवश्यक मॉड्यूल्स" : "Engineered for Complete Field Operations"}
            </h2>
          </div>

          <div className="row g-4">
            {platformModules.map((m, idx) => (
              <div key={idx} className="col-12 col-md-6 col-lg-4">
                <div
                  className="card h-100 border-0 shadow-sm rounded-4 p-4"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
                >
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center text-primary mb-3"
                    style={{ width: "46px", height: "46px", background: "rgba(15, 168, 196, 0.12)" }}
                  >
                    <i className={`bi ${m.icon} fs-4`}></i>
                  </div>
                  <h3 className="h6 fw-bold mb-2" style={{ color: "var(--text-navy)" }}>{m.title}</h3>
                  <p className="text-muted small mb-0">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION 7-12: SECURITY, MOBILE FIRST & AUDITING     */}
      {/* ==================================================== */}
      <section id="security" className="py-5 py-lg-6" style={{ background: "var(--bg-alt)" }}>
        <div className="container py-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-1.5 fw-bold mb-2">
                {isMarathi ? "बँकिंग दर्जाची सुरक्षा" : "Enterprise Security"}
              </span>
              <h2 className="display-6 fw-bold mb-3" style={{ color: "var(--text-navy)" }}>
                {t("featSecurityTitle", "Bank-Grade Operational Security")}
              </h2>
              <p className="text-muted mb-4">
                {t(
                  "featSecurityDesc",
                  "RFC 6238 TOTP two-factor authentication, single-use recovery codes, math CAPTCHA, and bcrypt password hashing."
                )}
              </p>

              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle p-2 bg-primary text-white mt-1">
                    <i className="bi bi-shield-lock"></i>
                  </div>
                  <div>
                    <h4 className="h6 fw-bold mb-1" style={{ color: "var(--text-navy)" }}>TOTP Two-Factor Authentication</h4>
                    <p className="text-muted small mb-0">Google Authenticator and Microsoft Authenticator support with recovery codes.</p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle p-2 bg-primary text-white mt-1">
                    <i className="bi bi-calculator"></i>
                  </div>
                  <div>
                    <h4 className="h6 fw-bold mb-1" style={{ color: "var(--text-navy)" }}>Dynamic Math CAPTCHA</h4>
                    <p className="text-muted small mb-0">Protects login endpoints against automated brute-force attacks.</p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle p-2 bg-primary text-white mt-1">
                    <i className="bi bi-key"></i>
                  </div>
                  <div>
                    <h4 className="h6 fw-bold mb-1" style={{ color: "var(--text-navy)" }}>Bcrypt Hash Storage</h4>
                    <p className="text-muted small mb-0">Passwords never stored in plain text; salted with individual cost factors.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div
                className="p-4 rounded-4 shadow-lg border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
              >
                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                  <div className="fw-bold" style={{ color: "var(--text-navy)" }}>Security & Compliance Score</div>
                  <span className="badge bg-success rounded-pill px-3 py-1">Grade A+ Audit</span>
                </div>

                <div className="d-flex flex-column gap-3">
                  {[
                    { label: "Token Cryptography", value: "HS256 JWT Signed", pass: true },
                    { label: "Role Scoping", value: "Live MySQL Enforcement", pass: true },
                    { label: "Worker Creation Lock", value: "Engineer-Only Restricted", pass: true },
                    { label: "Budget Overrun Prevention", value: "Server-Side Pre-Check", pass: true },
                    { label: "Language Consistency", value: "100% English & Marathi", pass: true }
                  ].map((chk, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center small">
                      <span className="text-muted">{chk.label}</span>
                      <span className="fw-semibold d-flex align-items-center gap-1.5" style={{ color: "var(--text-navy)" }}>
                        <i className="bi bi-check-circle-fill text-success"></i>
                        {chk.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION 13-14: TESTIMONIALS & TRUST                  */}
      {/* ==================================================== */}
      <section className="py-5 py-lg-6">
        <div className="container py-4">
          <div className="text-center max-w-700 mx-auto mb-5" style={{ maxWidth: "680px" }}>
            <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-1.5 fw-bold mb-2">
              {isMarathi ? "क्षेत्रीय अनुभव" : "Industry Trust"}
            </span>
            <h2 className="display-6 fw-bold mb-3" style={{ color: "var(--text-navy)" }}>
              {isMarathi ? "प्रकल्प अभियंते व कंत्राटदारांचे मत" : "Trusted by Infrastructure Leaders"}
            </h2>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
                <div className="text-warning mb-3">
                  <i className="bi bi-star-fill"></i> <i className="bi bi-star-fill"></i> <i className="bi bi-star-fill"></i> <i className="bi bi-star-fill"></i> <i className="bi bi-star-fill"></i>
                </div>
                <p className="text-muted mb-4">
                  "SmartBuild Pro transformed our site operations. The engineer-to-worker payment vouchers eliminated discrepancies. Our workers can check their attendance directly in Marathi without confusion."
                </p>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: "42px", height: "42px" }}>
                    GE
                  </div>
                  <div>
                    <div className="fw-bold small" style={{ color: "var(--text-navy)" }}>Ganesh Ekambe</div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Lead Site Engineer, Maharashtra Infrastructure</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "var(--bg-card)" }}>
                <div className="text-warning mb-3">
                  <i className="bi bi-star-fill"></i> <i className="bi bi-star-fill"></i> <i className="bi bi-star-fill"></i> <i className="bi bi-star-fill"></i> <i className="bi bi-star-fill"></i>
                </div>
                <p className="text-muted mb-4">
                  "The 10-point payment audit and real-time budget balances provide complete control. Our project managers allocate budgets and see disbursements live without manual spreadsheet errors."
                </p>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: "42px", height: "42px" }}>
                    MJ
                  </div>
                  <div>
                    <div className="fw-bold small" style={{ color: "var(--text-navy)" }}>Manesh Jadhav</div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>Managing Director, Smart Construction Enterprise</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION 15: FREQUENTLY ASKED QUESTIONS (FAQ)         */}
      {/* ==================================================== */}
      <section id="faq" className="py-5 py-lg-6" style={{ background: "var(--bg-alt)" }}>
        <div className="container py-4">
          <div className="text-center max-w-700 mx-auto mb-5" style={{ maxWidth: "680px" }}>
            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 fw-bold mb-2">
              {isMarathi ? "वारंवार विचारले जाणारे प्रश्न" : "Frequently Asked Questions"}
            </span>
            <h2 className="display-6 fw-bold mb-3" style={{ color: "var(--text-navy)" }}>
              {isMarathi ? "प्रणालीबाबत नेहमी विचारले जाणारे प्रश्न" : "Clear Answers to Common Operational Questions"}
            </h2>
          </div>

          <div className="max-w-800 mx-auto d-flex flex-column gap-3" style={{ maxWidth: "760px" }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="card border-0 shadow-sm rounded-3 overflow-hidden cursor-pointer"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                >
                  <div className="p-3.5 d-flex align-items-center justify-content-between">
                    <h3 className="h6 fw-bold mb-0" style={{ color: "var(--text-navy)" }}>{faq.q}</h3>
                    <i className={`bi ${isOpen ? "bi-chevron-up text-primary" : "bi-chevron-down text-muted"}`}></i>
                  </div>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-0 text-muted small border-top pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION 16: ENTERPRISE FOOTER                       */}
      {/* ==================================================== */}
      <footer className="py-5 border-top" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <div className="container">
          <div className="row g-4 justify-content-between mb-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  className="d-flex align-items-center justify-content-center text-white fw-bold rounded-2"
                  style={{ width: "34px", height: "34px", background: "linear-gradient(135deg, #0FA8C4, #27C4E8)", color: "#082B3A" }}
                >
                  <i className="bi bi-buildings-fill"></i>
                </div>
                <strong className="fs-5" style={{ color: "var(--text-navy)" }}>{t("brandName", "SmartBuild Pro")}</strong>
              </div>
              <p className="text-muted small mb-3">
                {t("tagline", "Enterprise Construction Management & Workforce ERP")}
              </p>
              <div className="d-flex align-items-center gap-2">
                <LanguageSelector compact={true} />
                <ThemeToggle compact={true} />
              </div>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <div className="fw-bold small mb-2" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "पोर्टल प्रवेश" : "Portal Access"}
              </div>
              <ul className="list-unstyled d-flex flex-column gap-1.5 small text-muted">
                <li><Link to="/login" className="text-decoration-none text-muted">{t("adminTab", "Administrator")}</Link></li>
                <li><Link to="/login" className="text-decoration-none text-muted">{t("engineerTab", "Site Engineer")}</Link></li>
                <li><Link to="/login" className="text-decoration-none text-muted">{t("workerTab", "Worker Portal")}</Link></li>
              </ul>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <div className="fw-bold small mb-2" style={{ color: "var(--text-navy)" }}>
                {isMarathi ? "कायदेशीर" : "Legal & Safety"}
              </div>
              <ul className="list-unstyled d-flex flex-column gap-1.5 small text-muted">
                <li><span className="text-muted">{t("privacyPolicy", "Privacy Policy")}</span></li>
                <li><span className="text-muted">{t("termsOfService", "Terms of Service")}</span></li>
                <li><span className="text-muted">{t("securityAudit", "Security Whitepaper")}</span></li>
              </ul>
            </div>

            <div className="col-md-4 col-lg-3">
              <div className="fw-bold small mb-2" style={{ color: "var(--text-navy)" }}>
                {t("contactSupport", "24/7 Field Support")}
              </div>
              <p className="text-muted small mb-1">
                <i className="bi bi-envelope me-1.5 text-primary"></i> support@smartbuild.com
              </p>
              <p className="text-muted small mb-0">
                <i className="bi bi-geo-alt me-1.5 text-primary"></i> Maharashtra, India
              </p>
            </div>
          </div>

          <div className="border-top pt-4 d-flex flex-column flex-md-row align-items-center justify-content-between text-muted small gap-2">
            <div>{t("copyrightNotice", "© 2026 Smart Construction Management System. All rights reserved.")}</div>
            <div className="text-muted">{t("madeWithPride", "Designed for India's Infrastructure Growth")}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
