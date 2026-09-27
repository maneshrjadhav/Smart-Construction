// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER NOTIFICATIONS & ACTIVITY CENTER PAGE
// ======================================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatDate } from "../utils/dateFormatter";

export default function WorkerNotifications() {
  const { t, isMarathi } = useLanguage();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL"); // ALL | UNREAD | Payment | Attendance | Document | Site

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      try {
        const res = await api.get("/workers/me/notifications");
        if (res.data.success) {
          setNotifications(res.data.notifications || []);
        } else {
          toastError(t("error", "Error"), res.data.error || "Failed to load notifications.");
        }
      } catch (err) {
        console.error("Notifications fetch error:", err);
        toastError(t("error", "Error"), err.response?.data?.error || "Could not load system notifications.");
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, [t, toastError]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toastSuccess(
      isMarathi ? "यशस्वी" : "Success",
      isMarathi ? "सर्व सूचना वाचल्या म्हणून चिन्हांकित केल्या." : "All notifications marked as read."
    );
  };

  const handleToggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === "ALL") return true;
    if (activeCategory === "UNREAD") return !n.read;
    return n.category === activeCategory;
  });

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-semibold">{t("loading", "Loading system notifications...")}</div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div
        className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)" }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative" style={{ zIndex: 1 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-bell-fill fs-3"></i>
              <h2 className="h4 fw-bold mb-0 text-white">
                {isMarathi ? "माझ्या सूचना व अलर्ट केंद्र" : "Notifications & Site Alerts"}
              </h2>
              {unreadCount > 0 && (
                <span className="badge bg-danger rounded-pill px-2.5 py-1">
                  {unreadCount} {isMarathi ? "नवीन" : "new"}
                </span>
              )}
            </div>
            <p className="text-white-50 mb-0 small">
              {isMarathi
                ? "हजेरी नोंद, मजुरी वाटप, कागदपत्र मुदत आणि साइट अपडेट्स"
                : "Live alerts for attendance, payments, document expiration, and site supervision"}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-light btn-sm text-dark fw-semibold rounded-pill px-3 shadow-sm"
                onClick={handleMarkAllAsRead}
              >
                <i className="bi bi-check2-all me-1"></i>
                {isMarathi ? "सर्व वाचले म्हणून नोंदवा" : "Mark All as Read"}
              </button>
            )}
            <Link to="/worker-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-arrow-left me-1"></i> {isMarathi ? "डॅशबोर्ड" : "Dashboard"}
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex align-items-center gap-2 flex-wrap border-bottom pb-2">
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeCategory === "ALL" ? "btn-primary shadow-sm" : "btn-light text-muted"}`}
          onClick={() => setActiveCategory("ALL")}
        >
          {isMarathi ? "सर्व" : "All"} ({notifications.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeCategory === "UNREAD" ? "btn-danger shadow-sm" : "btn-light text-muted"}`}
          onClick={() => setActiveCategory("UNREAD")}
        >
          {isMarathi ? "न वाचलेले" : "Unread"} ({unreadCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeCategory === "Payment" ? "btn-success shadow-sm" : "btn-light text-muted"}`}
          onClick={() => setActiveCategory("Payment")}
        >
          <i className="bi bi-cash me-1"></i>
          {isMarathi ? "पेमेंट्स" : "Payments"}
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeCategory === "Attendance" ? "btn-info shadow-sm" : "btn-light text-muted"}`}
          onClick={() => setActiveCategory("Attendance")}
        >
          <i className="bi bi-calendar2-check me-1"></i>
          {isMarathi ? "हजेरी" : "Attendance"}
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeCategory === "Document" ? "btn-warning shadow-sm" : "btn-light text-muted"}`}
          onClick={() => setActiveCategory("Document")}
        >
          <i className="bi bi-folder2 me-1"></i>
          {isMarathi ? "कागदपत्रे" : "Documents"}
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeCategory === "Site" ? "btn-secondary shadow-sm" : "btn-light text-muted"}`}
          onClick={() => setActiveCategory("Site")}
        >
          <i className="bi bi-buildings me-1"></i>
          {isMarathi ? "साइट / अभियंता" : "Site / Engineer"}
        </button>
      </div>

      {/* Notifications List */}
      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4" style={{ background: "var(--bg-card)" }}>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-bell-slash fs-1 d-block mb-2 opacity-50"></i>
            {isMarathi ? "या श्रेणीत कोणतीही सूचना नाही." : "No notifications found in this category."}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredNotifications.map((n) => {
              let iconClass = "bi-info-circle text-primary bg-primary-subtle";
              if (n.category === "Payment") iconClass = "bi-cash-coin text-success bg-success-subtle";
              if (n.category === "Attendance") iconClass = "bi-calendar2-check text-info bg-info-subtle";
              if (n.category === "Document") iconClass = "bi-exclamation-triangle text-warning bg-warning-subtle";
              if (n.category === "Site") iconClass = "bi-geo-alt text-danger bg-danger-subtle";

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-3 border transition-all ${
                    n.read ? "bg-white border-light-subtle opacity-75" : "bg-light border-primary-subtle shadow-sm"
                  }`}
                  style={{ background: n.read ? "var(--bg-card)" : "var(--bg-alt)" }}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center p-2.5 flex-shrink-0 ${iconClass}`}
                      style={{ width: "42px", height: "42px" }}
                    >
                      <i className={`bi ${iconClass.split(" ")[0]} fs-5`}></i>
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <h6 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>{n.title}</h6>
                          {!n.read && (
                            <span className="badge bg-primary-subtle text-primary small">New</span>
                          )}
                        </div>
                        <small className="text-muted">{formatDate(n.date)}</small>
                      </div>

                      <p className="text-muted small mb-2">{n.message}</p>

                      <div className="d-flex align-items-center gap-3">
                        {n.link && (
                          <Link to={n.link} className="btn btn-outline-primary btn-sm rounded-pill px-3 py-0.5 small">
                            {isMarathi ? "तपशील पाहा" : "View Details"} <i className="bi bi-arrow-right ms-1"></i>
                          </Link>
                        )}
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-muted p-0 text-decoration-none"
                          onClick={() => handleToggleRead(n.id)}
                        >
                          {n.read ? (isMarathi ? "न वाचलेले म्हणून चिन्हांकित करा" : "Mark as unread") : (isMarathi ? "वाचले म्हणून चिन्हांकित करा" : "Mark as read")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

