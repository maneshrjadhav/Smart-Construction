import React, { useState, useEffect, useMemo } from "react";
import { engineerAttendanceService } from "../services/engineerAttendanceService";
import { engineerService } from "../services/engineerService";
import { projectService } from "../services/projectService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { formatDate } from "../utils/dateFormatter";

export default function EngineerAttendance() {
  const { currentUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const { t, isMarathi } = useLanguage();

  const [attendance, setAttendance] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterEngineer, setFilterEngineer] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterEngineer) params.engineer_id = filterEngineer;
      if (filterProject) params.project_id = filterProject;
      if (filterStatus) params.status = filterStatus;

      const [attRes, engRes, projRes] = await Promise.all([
        engineerAttendanceService.getAttendance(params).catch(() => ({ attendance: [] })),
        engineerService.getEngineers().catch(() => ({ engineers: [] })),
        projectService.getProjects().catch(() => ({ projects: [] }))
      ]);

      setAttendance(attRes.attendance || []);
      setEngineers(engRes.engineers || []);
      setProjects(projRes.projects || []);
    } catch (err) {
      toastError("Load Error", "Unable to load engineer attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [filterDate, filterEngineer, filterProject, filterStatus]);

  // Client-side text search filter
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return attendance;
    const term = searchTerm.toLowerCase();
    return attendance.filter((r) => {
      return (
        (r.engineer_name || "").toLowerCase().includes(term) ||
        (r.engineer_code || "").toLowerCase().includes(term) ||
        (r.project_name || "").toLowerCase().includes(term) ||
        (r.remarks || "").toLowerCase().includes(term)
      );
    });
  }, [attendance, searchTerm]);

  // Today statistics
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = useMemo(() => {
    return attendance.filter((r) => (r.date || "").split("T")[0] === todayStr);
  }, [attendance, todayStr]);

  const totalEngineers = engineers.length;
  const presentToday = todayRecords.filter((r) => r.status === "Present").length;
  const halfDayToday = todayRecords.filter((r) => r.status === "Half Day").length;
  const onLeaveToday = todayRecords.filter((r) => r.status === "Leave").length;
  const absentToday = todayRecords.filter((r) => r.status === "Absent").length;
  const attendanceRate = totalEngineers > 0
    ? Math.round(((presentToday + (halfDayToday * 0.5)) / totalEngineers) * 100)
    : 0;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1"><i className="bi bi-check-circle-fill me-1"></i>Present</span>;
      case "Half Day":
        return <span className="badge bg-warning-subtle text-warning border border-warning fw-bold px-2 py-1"><i className="bi bi-clock-history me-1"></i>Half Day</span>;
      case "Leave":
        return <span className="badge bg-info-subtle text-info border border-info fw-bold px-2 py-1"><i className="bi bi-calendar2-minus me-1"></i>On Leave</span>;
      case "Absent":
        return <span className="badge bg-danger-subtle text-danger border border-danger fw-bold px-2 py-1"><i className="bi bi-x-circle-fill me-1"></i>Absent</span>;
      case "Holiday":
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary fw-bold px-2 py-1"><i className="bi bi-sun me-1"></i>Site Holiday</span>;
      default:
        return <span className="badge bg-light text-dark border fw-bold px-2 py-1">{status || "Pending"}</span>;
    }
  };

  const handleExportCSV = () => {
    if (!filteredRecords.length) {
      toastError("No Data", "No attendance records available to export.");
      return;
    }

    const headers = ["Engineer Code", "Engineer Name", "Project", "Date", "Status", "Check In", "Check Out", "Working Hours", "Remarks"];
    const rows = filteredRecords.map((r) => [
      r.engineer_code || "",
      `"${(r.engineer_name || "").replace(/"/g, '""')}"`,
      `"${(r.project_name || "").replace(/"/g, '""')}"`,
      r.date ? r.date.split("T")[0] : "",
      r.status || "",
      r.check_in || "",
      r.check_out || "",
      r.working_hours || "",
      `"${(r.remarks || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Engineer_Attendance_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess("Export Complete", "Engineer attendance CSV exported successfully.");
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      <PageHeader
        title={isMarathi ? "साइट अभियंता उपस्थिती नोंदवही" : "Engineer Attendance Roster"}
        subtitle={isMarathi ? "साइट अभियंत्यांची दैनिक उपस्थिती, वेळ नोंदी आणि रजेचा तपशील" : "Daily check-in, check-out timestamps, working hours and leave records for site engineering staff."}
        actions={
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-1 fw-bold"
              onClick={loadAttendance}
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
            <button
              type="button"
              className="btn btn-outline-primary d-flex align-items-center gap-1 fw-bold"
              onClick={handleExportCSV}
            >
              <i className="bi bi-download"></i> Export CSV
            </button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-primary">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Total Engineers</small>
            <div className="fs-4 fw-bold text-navy">{totalEngineers}</div>
            <small className="text-muted">Registered Roster</small>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-success">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Present Today</small>
            <div className="fs-4 fw-bold text-success">{presentToday}</div>
            <small className="text-muted">On Site Active</small>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-warning">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Half Day Today</small>
            <div className="fs-4 fw-bold text-warning">{halfDayToday}</div>
            <small className="text-muted">Partial Duty</small>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-info">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">On Leave</small>
            <div className="fs-4 fw-bold text-info">{onLeaveToday}</div>
            <small className="text-muted">Approved Absence</small>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-danger">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Absent Today</small>
            <div className="fs-4 fw-bold text-danger">{absentToday}</div>
            <small className="text-muted">Unreported</small>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-dark">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Today's Rate</small>
            <div className="fs-4 fw-bold text-dark">{attendanceRate}%</div>
            <small className="text-muted">Engineering Coverage</small>
          </div>
        </div>
      </div>

      {/* Multi-filter Toolbar */}
      <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-lg-3 col-md-6">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by engineer, ID, project or notes..."
            />
          </div>

          <div className="col-lg-2 col-md-3 col-sm-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted">
                <i className="bi bi-calendar"></i>
              </span>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                title="Filter by Date"
              />
            </div>
          </div>

          <div className="col-lg-2 col-md-3 col-sm-6">
            <select
              className="form-select form-select-sm"
              value={filterEngineer}
              onChange={(e) => setFilterEngineer(e.target.value)}
            >
              <option value="">All Engineers</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.full_name} ({eng.engineer_code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-2 col-md-3 col-sm-6">
            <select
              className="form-select form-select-sm"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-2 col-md-3 col-sm-6">
            <select
              className="form-select form-select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Half Day">Half Day</option>
              <option value="Leave">On Leave</option>
              <option value="Absent">Absent</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>

          <div className="col-lg-1 col-md-2 col-sm-4">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              title="Reset Filters"
              onClick={() => {
                setSearchTerm("");
                setFilterDate("");
                setFilterEngineer("");
                setFilterProject("");
                setFilterStatus("");
              }}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      {loading ? (
        <LoadingState message="Loading engineer attendance records..." />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          icon="bi-person-check"
          title="No attendance records found"
          message="No site engineer attendance logs matched your filter criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchTerm("");
            setFilterDate("");
            setFilterEngineer("");
            setFilterProject("");
            setFilterStatus("");
          }}
        />
      ) : (
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Engineer Code</th>
                  <th>Full Name &amp; Role</th>
                  <th>Assigned Project</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Working Hours</th>
                  <th>Remarks / Site Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="badge bg-light text-navy border fw-bold font-monospace">
                        {r.engineer_code || "ENG"}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: "#0f172a",
                            fontSize: "12px"
                          }}
                        >
                          {(r.engineer_name || "E").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong className="d-block text-navy">{r.engineer_name}</strong>
                          <small className="text-muted">{r.designation || "Site Engineer"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {r.project_name || "Unassigned"}
                      </span>
                    </td>
                    <td className="fw-semibold">
                      {r.date ? formatDate(r.date) : "N/A"}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>
                      {r.check_in ? (
                        <span className="text-success fw-bold font-monospace">
                          <i className="bi bi-box-arrow-in-right me-1"></i>{r.check_in}
                        </span>
                      ) : (
                        <span className="text-muted">--</span>
                      )}
                    </td>
                    <td>
                      {r.check_out ? (
                        <span className="text-secondary fw-bold font-monospace">
                          <i className="bi bi-box-arrow-right me-1"></i>{r.check_out}
                        </span>
                      ) : (
                        <span className="text-muted">--</span>
                      )}
                    </td>
                    <td>
                      {r.working_hours ? (
                        <span className="badge bg-light text-dark border fw-bold">
                          {r.working_hours} hrs
                        </span>
                      ) : (
                        <span className="text-muted">--</span>
                      )}
                    </td>
                    <td>
                      <span className="text-muted fst-italic">
                        {r.remarks || "No site notes provided"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

