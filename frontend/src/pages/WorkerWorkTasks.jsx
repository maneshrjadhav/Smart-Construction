// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER TASKS & WORK ASSIGNMENT HISTORY PAGE
// ======================================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatDate } from "../utils/dateFormatter";

export default function WorkerWorkTasks() {
  const { t, isMarathi } = useLanguage();
  const { error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState("tasks"); // 'tasks' | 'history'
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [taskFilter, setTaskFilter] = useState("ALL");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tasksRes, histRes] = await Promise.all([
          api.get("/workers/me/tasks"),
          api.get("/workers/me/work-history"),
        ]);

        if (tasksRes.data.success) {
          setTasks(tasksRes.data.tasks || []);
        }
        if (histRes.data.success) {
          setHistory(histRes.data.workHistory || []);
        }
      } catch (err) {
        console.error("Tasks/History load error:", err);
        toastError(t("error", "Error"), err.response?.data?.error || "Failed to load tasks and history.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [t, toastError]);

  const filteredTasks = taskFilter === "ALL"
    ? tasks
    : tasks.filter((t) => (t.status || "Pending") === taskFilter);

  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-semibold">{t("loading", "Loading tasks and work history...")}</div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div
        className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4b6cb7 0%, #182848 100%)" }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative" style={{ zIndex: 1 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-check2-square fs-3"></i>
              <h2 className="h4 fw-bold mb-0 text-white">
                {isMarathi ? "माझी कामे व कामाचा इतिहास" : "My Work & Assigned Tasks"}
              </h2>
            </div>
            <p className="text-white-50 mb-0 small">
              {isMarathi ? "साइटवरील नेमलेली दैनंदिन कामे व प्रकल्प कार्यकाळ इतिहास" : "Assigned site tasks, daily operations, and project assignment timeline"}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/worker-dashboard" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-arrow-left me-1"></i> {isMarathi ? "डॅशबोर्ड" : "Dashboard"}
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="d-flex align-items-center gap-2 border-bottom pb-2">
        <button
          type="button"
          className={`btn rounded-pill px-4 fw-semibold ${activeTab === "tasks" ? "btn-primary shadow-sm" : "btn-light text-muted"}`}
          onClick={() => setActiveTab("tasks")}
        >
          <i className="bi bi-list-task me-1.5"></i>
          {isMarathi ? "आजची कामे व टास्क" : "Assigned Tasks"} ({tasks.length})
        </button>
        <button
          type="button"
          className={`btn rounded-pill px-4 fw-semibold ${activeTab === "history" ? "btn-primary shadow-sm" : "btn-light text-muted"}`}
          onClick={() => setActiveTab("history")}
        >
          <i className="bi bi-clock-history me-1.5"></i>
          {isMarathi ? "कामाचा इतिहास व टाइमलाइन" : "Work History Timeline"} ({history.length})
        </button>
      </div>

      {/* TAB 1: ASSIGNED TASKS */}
      {activeTab === "tasks" && (
        <div className="d-flex flex-column gap-4">
          {/* Task Metrics */}
          <div className="row g-3">
            <div className="col-sm-4">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-warning" style={{ background: "var(--bg-card)" }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <small className="text-muted fw-bold text-uppercase d-block mb-1">
                      {isMarathi ? "चालू कामे" : "In Progress"}
                    </small>
                    <div className="fs-3 fw-bold text-warning">{inProgressCount}</div>
                  </div>
                  <div className="rounded-circle p-2.5 bg-warning-subtle text-warning">
                    <i className="bi bi-hourglass-split fs-4"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-4">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-secondary" style={{ background: "var(--bg-card)" }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <small className="text-muted fw-bold text-uppercase d-block mb-1">
                      {isMarathi ? "प्रलंबित कामे" : "Pending Tasks"}
                    </small>
                    <div className="fs-3 fw-bold text-secondary">{pendingCount}</div>
                  </div>
                  <div className="rounded-circle p-2.5 bg-secondary-subtle text-secondary">
                    <i className="bi bi-clock fs-4"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-4">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 border-start border-4 border-success" style={{ background: "var(--bg-card)" }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <small className="text-muted fw-bold text-uppercase d-block mb-1">
                      {isMarathi ? "पूर्ण झालेली कामे" : "Completed Tasks"}
                    </small>
                    <div className="fs-3 fw-bold text-success">{completedCount}</div>
                  </div>
                  <div className="rounded-circle p-2.5 bg-success-subtle text-success">
                    <i className="bi bi-check2-circle fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "var(--bg-card)" }}>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-card-checklist fs-5 text-primary"></i>
                <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
                  {isMarathi ? "साइट टास्क सूची" : "Site Operations Task Queue"}
                </h5>
              </div>

              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${taskFilter === "ALL" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setTaskFilter("ALL")}
                >
                  {isMarathi ? "सर्व" : "All"} ({tasks.length})
                </button>
                <button
                  type="button"
                  className={`btn ${taskFilter === "In Progress" ? "btn-warning text-dark" : "btn-outline-secondary"}`}
                  onClick={() => setTaskFilter("In Progress")}
                >
                  {isMarathi ? "चालू" : "In Progress"} ({inProgressCount})
                </button>
                <button
                  type="button"
                  className={`btn ${taskFilter === "Pending" ? "btn-secondary" : "btn-outline-secondary"}`}
                  onClick={() => setTaskFilter("Pending")}
                >
                  {isMarathi ? "प्रलंबित" : "Pending"} ({pendingCount})
                </button>
                <button
                  type="button"
                  className={`btn ${taskFilter === "Completed" ? "btn-success" : "btn-outline-secondary"}`}
                  onClick={() => setTaskFilter("Completed")}
                >
                  {isMarathi ? "पूर्ण" : "Completed"} ({completedCount})
                </button>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-check2-all fs-1 d-block mb-2 text-success opacity-50"></i>
                {isMarathi ? "या फिल्टर अंतर्गत कोणतीही कामे शिल्लक नाहीत." : "No tasks found matching current filter."}
              </div>
            ) : (
              <div className="row g-3">
                {filteredTasks.map((tItem) => {
                  let priorityBadge = <span className="badge bg-secondary">Normal</span>;
                  if (tItem.priority === "High") priorityBadge = <span className="badge bg-danger">High Priority</span>;
                  if (tItem.priority === "Medium") priorityBadge = <span className="badge bg-warning text-dark">Medium Priority</span>;

                  let statusBadge = <span className="badge bg-secondary">Pending</span>;
                  if (tItem.status === "In Progress") statusBadge = <span className="badge bg-warning text-dark">In Progress</span>;
                  if (tItem.status === "Completed") statusBadge = <span className="badge bg-success">Completed</span>;

                  return (
                    <div key={tItem.id} className="col-md-6 col-lg-4">
                      <div className="card h-100 border border-light-subtle shadow-sm rounded-3 p-3.5" style={{ background: "var(--bg-alt)" }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          {priorityBadge}
                          {statusBadge}
                        </div>
                        <h6 className="fw-bold mb-1" style={{ color: "var(--text-navy)" }}>{tItem.task_name}</h6>
                        <p className="text-muted small mb-3">
                          Site / Project: <strong>{tItem.project || "Assigned Site"}</strong>
                        </p>
                        <div className="mt-auto pt-2 border-top d-flex align-items-center justify-content-between small text-muted">
                          <span>
                            <i className="bi bi-calendar-event me-1 text-primary"></i>
                            Due: {formatDate(tItem.due_date)}
                          </span>
                          {tItem.assigned_to && (
                            <span className="badge bg-light text-dark border">
                              {tItem.assigned_to}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WORK HISTORY TIMELINE */}
      {activeTab === "history" && (
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "var(--bg-card)" }}>
          <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
            <i className="bi bi-clock-history fs-5 text-primary"></i>
            <h5 className="fw-bold mb-0" style={{ color: "var(--text-navy)" }}>
              {isMarathi ? "प्रकल्प कार्यकाळ इतिहास टाइमलाइन" : "Work Assignment Career Timeline"}
            </h5>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-folder-x fs-1 d-block mb-2 opacity-50"></i>
              {isMarathi ? "कोणताही कार्यकाळ इतिहास उपलब्ध नाही." : "No past work history recorded yet."}
            </div>
          ) : (
            <div className="position-relative ps-4 ps-md-5 border-start border-3 border-primary ms-3 ms-md-4 my-2">
              {history.map((h, idx) => {
                return (
                  <div key={h.id || idx} className="position-relative mb-4">
                    {/* Circle marker */}
                    <div
                      className="position-absolute rounded-circle bg-primary border border-3 border-white shadow-sm"
                      style={{
                        width: "18px",
                        height: "18px",
                        left: "-34px",
                        top: "4px",
                      }}
                    ></div>

                    <div className="card border-0 shadow-sm rounded-3 p-3.5" style={{ background: "var(--bg-alt)" }}>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                        <h6 className="fw-bold mb-0 text-primary fs-6">
                          {h.project_name || "Construction Project"}
                        </h6>
                        <span className={`badge ${h.status === "Active" ? "bg-success" : "bg-secondary"}`}>
                          {h.status || "Completed"}
                        </span>
                      </div>

                      <div className="row g-2 small text-muted mb-2">
                        <div className="col-sm-6">
                          <i className="bi bi-person-badge me-1"></i>
                          Role: <strong className="text-dark">{h.work_role || "Worker"}</strong>
                        </div>
                        <div className="col-sm-6">
                          <i className="bi bi-geo-alt me-1"></i>
                          Area: <strong className="text-dark">{h.work_area || "Site Main"}</strong>
                        </div>
                        <div className="col-sm-6">
                          <i className="bi bi-clock me-1"></i>
                          Shift: <strong className="text-dark">{h.shift || "General"}</strong>
                        </div>
                        <div className="col-sm-6">
                          <i className="bi bi-person-gear me-1"></i>
                          Engineer: <strong className="text-dark">{h.engineer_name || "Site Engineer"}</strong>
                        </div>
                        <div className="col-12">
                          <i className="bi bi-calendar-range me-1"></i>
                          Period: <strong>{formatDate(h.start_date)}</strong>
                          {h.end_date ? ` to ${formatDate(h.end_date)}` : " — Present"}
                        </div>
                      </div>

                      {h.remarks && (
                        <div className="bg-light p-2 rounded small text-muted fst-italic">
                          "{h.remarks}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

