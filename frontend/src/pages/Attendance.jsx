import React, { useState, useEffect } from "react";
import { attendanceService } from "../services/attendanceService";
import { workerService } from "../services/workerService";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import { formatDate } from "../utils/dateFormatter";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [workers, setWorkers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [workersRes, attRes] = await Promise.all([
        workerService.getWorkers().catch(() => ({ workers: [] })),
        attendanceService.getAttendance().catch(() => ({ attendance: [] })),
      ]);

      const workerList = workersRes.workers || [];
      setWorkers(workerList);

      // Build map of worker_id -> status for selectedDate
      const recordsForDate = {};
      const allAtt = attRes.attendance || [];
      allAtt.forEach((item) => {
        const itemDate = (item.date || "").split("T")[0];
        if (itemDate === selectedDate) {
          recordsForDate[item.worker_id] = item.status;
        }
      });

      // Default unmarked workers to 'Present'
      workerList.forEach((w) => {
        if (!recordsForDate[w.id]) {
          recordsForDate[w.id] = "Present";
        }
      });

      setAttendanceRecords(recordsForDate);
    } catch (err) {
      toastError("Load Error", "Unable to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleStatusChange = (workerId, newStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [workerId]: newStatus,
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const records = workers.map((w) => ({
        worker_id: w.id,
        worker_name: w.name,
        status: attendanceRecords[w.id] || "Present",
      }));

      const res = await attendanceService.saveAttendance({
        date: selectedDate,
        records,
      });

      if (res.success) {
        toastSuccess("Saved", `Attendance for ${formatDate(selectedDate)} successfully saved.`);
      }
    } catch (err) {
      toastError("Save Error", err.response?.data?.error || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  // Metric calculations
  const totalWorkers = workers.length;
  let presentCount = 0;
  let absentCount = 0;
  let onLeaveCount = 0;

  Object.values(attendanceRecords).forEach((status) => {
    const s = (status || "").toLowerCase();
    if (s === "present") presentCount++;
    else if (s === "absent") absentCount++;
    else if (s === "on leave" || s === "leave") onLeaveCount++;
  });

  return (
    <div>
      <PageHeader
        title="Workforce Attendance"
        subtitle="Digital muster roll to track daily jobsite labor turnout, absences, and site readiness."
        actions={
          <div className="d-flex align-items-center gap-2">
            <input
              type="date"
              className="form-control form-control-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: "auto", borderRadius: "8px" }}
            />
            <button
              type="button"
              className="btn-saas-primary"
              onClick={handleSaveAttendance}
              disabled={saving || loading}
            >
              <i className="bi bi-check2-all"></i> {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        }
      />

      {/* 4 Cards: Total Workers, Present, Absent, On Leave */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-people-fill"
            label="Total Workers"
            value={String(totalWorkers).padStart(2, "0")}
            footer="Registered Workforce"
            colorBg="#eff6ff"
            colorIcon="#3b82f6"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-person-check-fill"
            label="Present"
            value={String(presentCount).padStart(2, "0")}
            footer="On Jobsite"
            colorBg="#ecfdf5"
            colorIcon="#10b981"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-person-x-fill"
            label="Absent"
            value={String(absentCount).padStart(2, "0")}
            footer="Unscheduled Absence"
            colorBg="#fee2e2"
            colorIcon="#ef4444"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-person-dash-fill"
            label="On Leave"
            value={String(onLeaveCount).padStart(2, "0")}
            footer="Approved Site Leave"
            colorBg="#f3e8ff"
            colorIcon="#8b5cf6"
          />
        </div>
      </div>

      <div className="saas-card mb-4">
        <div className="saas-card-header">
          <div>
            <h3 className="saas-card-title">Daily Muster Roll: {formatDate(selectedDate)}</h3>
            <div className="saas-card-sub">Mark presence status for each registered worker</div>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading attendance records..." />
        ) : workers.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-people fs-2 d-block mb-2"></i>
            No registered workers available to mark attendance. Add workers in Workforce first.
          </div>
        ) : (
          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Worker Code</th>
                  <th>Full Name</th>
                  <th>Trade / Role</th>
                  <th>Status on {formatDate(selectedDate)}</th>
                  <th className="text-end">Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => {
                  const currentStatus = attendanceRecords[w.id] || "Present";
                  return (
                    <tr key={w.id}>
                      <td>
                        <span className="badge bg-light text-navy border">
                          {w.worker_code || `WRK-${w.id}`}
                        </span>
                      </td>
                      <td>
                        <strong className="text-navy">{w.name}</strong>
                      </td>
                      <td>{w.role}</td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          {["Present", "Absent", "On Leave"].map((st) => (
                            <button
                              key={st}
                              type="button"
                              className={`btn btn-sm ${
                                currentStatus === st
                                  ? st === "Present"
                                    ? "btn-success"
                                    : st === "Absent"
                                    ? "btn-danger"
                                    : "btn-warning"
                                  : "btn-outline-secondary"
                              }`}
                              style={{ fontWeight: 600, fontSize: "12px" }}
                              onClick={() => handleStatusChange(w.id, st)}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="text-end">
                        <span
                          className={`app-badge ${
                            currentStatus === "Present"
                              ? "badge-active"
                              : currentStatus === "Absent"
                              ? "badge-absent"
                              : "badge-pending"
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

