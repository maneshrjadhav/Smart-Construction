import React, { useState, useEffect, useMemo } from "react";
import { workerService } from "../services/workerService";
import { engineerService } from "../services/engineerService";
import { projectService } from "../services/projectService";
import { attendanceService } from "../services/attendanceService";
import { paymentService } from "../services/paymentService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isAdmin, isEngineer } from "../utils/permissions";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import WorkerDetailsDrawer from "../components/WorkerDetailsDrawer";
import EngineerDetailsDrawer from "../components/EngineerDetailsDrawer";
import PaymentModal from "../components/PaymentModal";
import AllocationModal from "../components/AllocationModal";
import { formatCurrency, formatValue } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateFormatter";

export default function Workforce() {
  const { currentUser } = useAuth();
  const userIsAdmin = isAdmin(currentUser);
  const userIsEngineer = isEngineer(currentUser);
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState("workers"); // 'workers' | 'engineers'
  const [workers, setWorkers] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Multi-Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterEngineer, setFilterEngineer] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [filterWorkerType, setFilterWorkerType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("");

  // Drawers & Modals
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [showWorkerDrawer, setShowWorkerDrawer] = useState(false);

  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [showEngineerDrawer, setShowEngineerDrawer] = useState(false);

  const [paymentWorker, setPaymentWorker] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [showAllocationModal, setShowAllocationModal] = useState(false);

  // Worker Create/Edit Modal
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerModalMode, setWorkerModalMode] = useState("create");
  const [currentWorker, setCurrentWorker] = useState(null);
  const [workerForm, setWorkerForm] = useState({
    name: "",
    trade: "Mason",
    role: "Mason",
    worker_type: "Skilled",
    phone: "",
    alternate_phone: "",
    email: "",
    dob: "",
    gender: "Male",
    blood_group: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    employment_type: "Daily Wage",
    designation: "Site Mason",
    joining_date: new Date().toISOString().split("T")[0],
    experience: "3 years",
    previous_employer: "",
    work_area: "Site Main",
    shift: "General",
    wage_type: "Daily",
    daily_wage: "650",
    salary: "16900",
    overtime_rate: "80",
    payment_method: "Cash",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
    status: "Active"
  });
  const [submittingWorker, setSubmittingWorker] = useState(false);

  // Engineer Create Modal (Admin Only)
  const [showEngineerModal, setShowEngineerModal] = useState(false);
  const [engineerForm, setEngineerForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    qualification: "",
    experience: "",
    designation: "Site Engineer",
    joining_date: new Date().toISOString().split("T")[0],
    project_id: "",
    status: "Active"
  });
  const [submittingEngineer, setSubmittingEngineer] = useState(false);
  const [engineerCredentialsModal, setEngineerCredentialsModal] = useState(null);
  const [workerCredentialsModal, setWorkerCredentialsModal] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  // Delete / Archive Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split("T")[0];

      const [workersRes, projectsRes, attRes] = await Promise.all([
        workerService.getWorkers().catch(() => ({ workers: [] })),
        projectService.getProjects().catch(() => ({ projects: [] })),
        attendanceService.getAttendance().catch(() => ({ attendance: [] }))
      ]);

      if (workersRes.workers) setWorkers(workersRes.workers);
      if (projectsRes.projects) setProjects(projectsRes.projects);
      if (attRes.attendance) {
        const todayLogs = attRes.attendance.filter((a) => (a.date || "").split("T")[0] === todayStr);
        setAttendanceToday(todayLogs);
      }

      if (userIsAdmin) {
        const engRes = await engineerService.getEngineers().catch(() => ({ engineers: [] }));
        if (engRes.engineers) setEngineers(engRes.engineers);
      }
    } catch (err) {
      toastError("Load Error", "Unable to load workforce records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userIsAdmin]);

  // Handle Worker Submit
  const handleWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!workerForm.name || !workerForm.phone || !workerForm.daily_wage) {
      toastError("Validation Error", "Worker Name, Phone, and Daily Wage are required.");
      return;
    }

    try {
      setSubmittingWorker(true);
      if (workerModalMode === "create") {
        const res = await workerService.createWorker(workerForm);
        if (res.success) {
          toastSuccess("Worker Enrolled", res.message || "Worker added successfully.");
          setShowWorkerModal(false);
          if (res.credentials) {
            setWorkerCredentialsModal(res.credentials);
          }
          loadData();
        }
      } else {
        const res = await workerService.updateWorker(currentWorker.id, workerForm);
        if (res.success) {
          toastSuccess("Worker Updated", res.message || "Worker profile updated.");
          setShowWorkerModal(false);
          loadData();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save worker record.";
      toastError("Worker Error", msg);
    } finally {
      setSubmittingWorker(false);
    }
  };

  // Handle Engineer Submit (Administrator Only)
  const handleEngineerSubmit = async (e) => {
    e.preventDefault();
    if (!engineerForm.full_name || !engineerForm.email || !engineerForm.phone || !engineerForm.project_id) {
      toastError("Validation Error", "Engineer Full Name, Email, Phone, and Assigned Project are required.");
      return;
    }

    try {
      setSubmittingEngineer(true);
      const res = await engineerService.createEngineer(engineerForm);
      if (res.success) {
        toastSuccess("Engineer Enrolled", res.message || "Engineer profile registered successfully.");
        setShowEngineerModal(false);
        const assignedProj = projects.find((p) => String(p.id) === String(engineerForm.project_id));
        setEngineerCredentialsModal({
          engineerCode: res.engineer?.engineer_code || "ENG",
          fullName: res.engineer?.full_name || engineerForm.full_name,
          email: res.engineer?.email || engineerForm.email,
          phone: res.engineer?.phone || engineerForm.phone,
          designation: res.engineer?.designation || engineerForm.designation,
          projectName: res.engineer?.project_name || assignedProj?.name || "Assigned Project",
          smsStatus: res.smsStatus,
          temporaryPassword: res.temporaryPassword || "Dispatched via SMS"
        });
        loadData();
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to create engineer.";
      toastError("Engineer Enrollment Failed", msg);
    } finally {
      setSubmittingEngineer(false);
    }
  };

  // Handle Resend Credentials for Engineer
  const handleResendCredentials = async (eng) => {
    try {
      setResendingId(eng.id);
      const res = await engineerService.resendCredentials(eng.id);
      if (res.success) {
        toastSuccess("Credentials Dispatched", `New temporary credentials generated and dispatched via SMS to ${eng.full_name}.`);
        setEngineerCredentialsModal({
          engineerCode: eng.engineer_code,
          fullName: eng.full_name,
          email: eng.email,
          phone: eng.phone,
          designation: eng.designation,
          projectName: eng.project_name,
          smsStatus: res.smsStatus,
          isResend: true
        });
      }
    } catch (err) {
      toastError("Resend Failed", err.response?.data?.error || "Could not dispatch credentials.");
    } finally {
      setResendingId(null);
    }
  };

  // Handle Archive / Deactivate
  const handleArchiveConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.type === "worker") {
        await workerService.deleteWorker(deleteTarget.id);
        toastSuccess("Archived", "Worker deactivated and archived. Historical records preserved.");
      } else {
        await engineerService.deleteEngineer(deleteTarget.id);
        toastSuccess("Engineer Deactivated", "Engineer status updated to Inactive.");
      }
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toastError("Action Failed", err.response?.data?.error || "Failed to archive record.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (w.name || "").toLowerCase().includes(term) ||
        (w.worker_code || "").toLowerCase().includes(term) ||
        (w.phone || "").toLowerCase().includes(term) ||
        (w.trade || "").toLowerCase().includes(term);

      const matchProject = !filterProject || String(w.project_id) === String(filterProject);
      const matchEngineer = !filterEngineer || String(w.engineer_id) === String(filterEngineer);
      const matchSkill = !filterSkill || (w.trade || w.role || "").toLowerCase() === filterSkill.toLowerCase();
      const matchType = !filterWorkerType || (w.worker_type || "").toLowerCase() === filterWorkerType.toLowerCase();
      const matchStatus = !filterStatus || (w.status || "").toLowerCase() === filterStatus.toLowerCase();
      const matchPay = !filterPaymentStatus || (w.payment_status || "").toLowerCase() === filterPaymentStatus.toLowerCase();

      return matchSearch && matchProject && matchEngineer && matchSkill && matchType && matchStatus && matchPay;
    });
  }, [workers, searchTerm, filterProject, filterEngineer, filterSkill, filterWorkerType, filterStatus, filterPaymentStatus]);

  // Filtered Engineers
  const filteredEngineers = useMemo(() => {
    return engineers.filter((eng) => {
      const term = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        (eng.full_name || "").toLowerCase().includes(term) ||
        (eng.engineer_code || "").toLowerCase().includes(term) ||
        (eng.email || "").toLowerCase().includes(term) ||
        (eng.phone || "").toLowerCase().includes(term)
      );
    });
  }, [engineers, searchTerm]);

  // Top Summary Statistics
  const totalWorkersCount = workers.length;
  const activeWorkersCount = workers.filter((w) => w.status === "Active").length;
  const presentTodayCount = attendanceToday.filter((a) => (a.status || "").toLowerCase() === "present").length;
  const onLeaveCount = workers.filter((w) => w.status === "On Leave").length;
  const totalPendingPayments = workers.reduce((acc, w) => acc + Number(w.pending_payment || 0), 0);
  const totalWorkerPayments = workers.reduce((acc, w) => acc + Number(w.total_paid || 0), 0);

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Page Header with Strict Role Permission Logic */}
      <PageHeader
        title="Workforce Management"
        subtitle="Manage workers, project assignments, attendance records and payments."
        actions={
          <div className="d-flex align-items-center gap-2">
            {/* REQUIREMENT: The 'Add Worker' option must be available ONLY to Engineers */}
            {/* Administrator can VIEW all workers, but Administrator must NOT have the 'Add Worker' option */}
            {userIsEngineer && (
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2 fw-bold px-3 py-2"
                style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                onClick={() => {
                  setWorkerModalMode("create");
                  setCurrentWorker(null);
                  setWorkerForm({
                    name: "",
                    trade: "Mason",
                    role: "Mason",
                    worker_type: "Skilled",
                    phone: "",
                    alternate_phone: "",
                    email: "",
                    dob: "",
                    gender: "Male",
                    blood_group: "",
                    address: "",
                    emergency_contact_name: "",
                    emergency_contact_phone: "",
                    employment_type: "Daily Wage",
                    designation: "Site Mason",
                    joining_date: new Date().toISOString().split("T")[0],
                    experience: "3 years",
                    previous_employer: "",
                    work_area: "Site Main",
                    shift: "General",
                    wage_type: "Daily",
                    daily_wage: "650",
                    salary: "16900",
                    overtime_rate: "80",
                    payment_method: "Cash",
                    bank_name: "",
                    account_number: "",
                    ifsc_code: "",
                    upi_id: "",
                    status: "Active"
                  });
                  setShowWorkerModal(true);
                }}
              >
                <i className="bi bi-person-plus-fill"></i> + Add Worker
              </button>
            )}

            {/* Administrator Actions */}
            {userIsAdmin && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-primary fw-bold"
                  onClick={() => setShowAllocationModal(true)}
                >
                  <i className="bi bi-wallet2 me-1"></i> Allocate Budget
                </button>
                <button
                  type="button"
                  className="btn btn-primary fw-bold d-flex align-items-center gap-1"
                  style={{ backgroundColor: "#0f172a", borderColor: "#0f172a" }}
                  onClick={() => {
                    setEngineerForm({
                      full_name: "",
                      email: "",
                      phone: "",
                      address: "",
                      qualification: "B.Tech Civil Engineering",
                      experience: "3+ Years",
                      designation: "Site Engineer",
                      joining_date: new Date().toISOString().split("T")[0],
                      project_id: projects[0]?.id || "",
                      status: "Active"
                    });
                    setShowEngineerModal(true);
                  }}
                >
                  <i className="bi bi-person-plus me-1"></i> + Add Engineer
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-primary">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Total Workers</small>
            <div className="fs-4 fw-bold text-navy">{totalWorkersCount}</div>
            <small className="text-muted">Registered Roster</small>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-success">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Active Workers</small>
            <div className="fs-4 fw-bold text-success">{activeWorkersCount}</div>
            <small className="text-muted">On Active Sites</small>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-info">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Present Today</small>
            <div className="fs-4 fw-bold text-info">{presentTodayCount}</div>
            <small className="text-muted">Attendance Marked</small>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-secondary">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">On Leave</small>
            <div className="fs-4 fw-bold text-secondary">{onLeaveCount}</div>
            <small className="text-muted">Planned Absence</small>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-warning">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Pending Pay</small>
            <div className="fs-4 fw-bold text-warning">{formatCurrency(totalPendingPayments)}</div>
            <small className="text-muted">Unpaid Balances</small>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white border-start border-4 border-dark">
            <small className="text-muted fw-bold text-uppercase d-block mb-1">Total Disbursed</small>
            <div className="fs-4 fw-bold text-dark">{formatCurrency(totalWorkerPayments)}</div>
            <small className="text-muted">Paid to Workforce</small>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex align-items-center gap-2 border-bottom mb-4">
        <button
          type="button"
          className={`btn border-0 py-2 px-3 fw-bold ${
            activeTab === "workers" ? "border-bottom border-3 border-info text-info bg-white" : "text-muted"
          }`}
          onClick={() => setActiveTab("workers")}
          style={{ borderRadius: 0 }}
        >
          <i className="bi bi-people me-1"></i> Site Workers ({workers.length})
        </button>

        {userIsAdmin && (
          <button
            type="button"
            className={`btn border-0 py-2 px-3 fw-bold ${
              activeTab === "engineers" ? "border-bottom border-3 border-info text-info bg-white" : "text-muted"
            }`}
            onClick={() => setActiveTab("engineers")}
            style={{ borderRadius: 0 }}
          >
            <i className="bi bi-person-gear me-1"></i> Site Engineers ({engineers.length})
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-lg-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={`Search ${activeTab === "workers" ? "workers by name, ID, trade or phone..." : "engineers by name, email or code..."}`}
            />
          </div>

          {activeTab === "workers" && (
            <>
              {userIsAdmin && (
                <div className="col-md-2 col-sm-4">
                  <select
                    className="form-select form-select-sm"
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                  >
                    <option value="">All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {userIsAdmin && (
                <div className="col-md-2 col-sm-4">
                  <select
                    className="form-select form-select-sm"
                    value={filterEngineer}
                    onChange={(e) => setFilterEngineer(e.target.value)}
                  >
                    <option value="">All Engineers</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>{eng.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-md-2 col-sm-4">
                <select
                  className="form-select form-select-sm"
                  value={filterSkill}
                  onChange={(e) => setFilterSkill(e.target.value)}
                >
                  <option value="">All Trades</option>
                  {["Mason", "Carpenter", "Electrician", "Plumber", "Painter", "Welder", "Helper", "Operator", "Other"].map((tr) => (
                    <option key={tr} value={tr}>{tr}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-1 col-sm-4">
                <select
                  className="form-select form-select-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>

              <div className="col-md-1 col-sm-4">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary w-100"
                  title="Reset Filters"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterProject("");
                    setFilterEngineer("");
                    setFilterSkill("");
                    setFilterWorkerType("");
                    setFilterStatus("");
                    setFilterPaymentStatus("");
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise"></i> Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Data Table Content */}
      {loading ? (
        <LoadingState message="Loading workforce portfolio..." />
      ) : activeTab === "workers" ? (
        filteredWorkers.length === 0 ? (
          <EmptyState
            icon="bi-people"
            title="No site workers found"
            message={userIsEngineer ? "No workers enrolled matching your criteria. Add workers to your project below." : "No workers enrolled in the company roster matching your query."}
            actionLabel={userIsEngineer ? "+ Add Worker" : null}
            onAction={userIsEngineer ? () => setShowWorkerModal(true) : null}
          />
        ) : (
          <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Worker ID</th>
                    <th>Worker Name</th>
                    <th>Skill / Trade</th>
                    <th>Assigned Engineer</th>
                    <th>Assigned Project</th>
                    <th>Daily Wage</th>
                    <th>Payment Status</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <span className="badge bg-light text-navy border fw-bold">
                          {w.worker_code || `WRK-${w.id}`}
                        </span>
                      </td>
                      <td>
                        <strong className="d-block text-navy">{w.name}</strong>
                        <small className="text-muted">{w.phone}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{w.trade || w.role}</span>
                        <small className="d-block text-muted" style={{ fontSize: "0.75rem" }}>{w.worker_type || "Skilled"}</small>
                      </td>
                      <td>{formatValue(w.engineer_name || "Unassigned")}</td>
                      <td>
                        <span className="fw-semibold text-dark">{formatValue(w.project_name)}</span>
                      </td>
                      <td className="fw-bold text-success">{formatCurrency(w.daily_wage)} / day</td>
                      <td>
                        <span className={`badge ${
                          w.payment_status === "Paid" ? "bg-success" :
                          w.payment_status === "Partially Paid" ? "bg-warning text-dark" : "bg-danger"
                        }`}>
                          {w.payment_status || "Paid"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {/* View Full Dossier */}
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            title="View Worker Details Dossier"
                            onClick={() => {
                              setSelectedWorkerId(w.id);
                              setShowWorkerDrawer(true);
                            }}
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {/* Engineer: Disburse Payment */}
                          {userIsEngineer && (
                            <button
                              type="button"
                              className="btn btn-outline-success"
                              title="Record / Disburse Payment"
                              onClick={() => {
                                setPaymentWorker(w);
                                setShowPaymentModal(true);
                              }}
                            >
                              <i className="bi bi-cash-coin"></i>
                            </button>
                          )}

                          {/* Edit Worker */}
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Edit Worker Profile"
                            onClick={() => {
                              setCurrentWorker(w);
                              setWorkerModalMode("edit");
                              setWorkerForm({
                                name: w.name || "",
                                trade: w.trade || w.role || "Mason",
                                role: w.role || "Worker",
                                worker_type: w.worker_type || "Skilled",
                                phone: w.phone || "",
                                alternate_phone: w.alternate_phone || "",
                                email: w.email || "",
                                dob: w.dob ? String(w.dob).split("T")[0] : "",
                                gender: w.gender || "Male",
                                blood_group: w.blood_group || "",
                                address: w.address || "",
                                emergency_contact_name: w.emergency_contact_name || "",
                                emergency_contact_phone: w.emergency_contact_phone || "",
                                employment_type: w.employment_type || "Daily Wage",
                                designation: w.designation || "",
                                joining_date: w.joining_date ? String(w.joining_date).split("T")[0] : "",
                                experience: w.experience || "",
                                previous_employer: w.previous_employer || "",
                                work_area: w.work_area || "Site Main",
                                shift: w.shift || "General",
                                wage_type: w.wage_type || "Daily",
                                daily_wage: String(w.daily_wage || 0),
                                salary: String(w.salary || 0),
                                overtime_rate: String(w.overtime_rate || 0),
                                payment_method: w.payment_method || "Cash",
                                bank_name: w.bank_name || "",
                                account_number: w.account_number || "",
                                ifsc_code: w.ifsc_code || "",
                                upi_id: w.upi_id || "",
                                status: w.status || "Active"
                              });
                              setShowWorkerModal(true);
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          {/* Soft Archive / Deactivate */}
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Deactivate / Archive Worker"
                            onClick={() => setDeleteTarget({ type: "worker", id: w.id })}
                          >
                            <i className="bi bi-archive"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ENGINEERS TAB (Administrator Only) */
        filteredEngineers.length === 0 ? (
          <EmptyState
            icon="bi-person-gear"
            title="No site engineers found"
            message="No site engineers registered matching your search query."
            actionLabel="Add Engineer"
            onAction={() => setShowEngineerModal(true)}
          />
        ) : (
          <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Engineer Code</th>
                    <th>Full Name</th>
                    <th>Contact</th>
                    <th>Designation</th>
                    <th>Assigned Project</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEngineers.map((eng) => (
                    <tr key={eng.id}>
                      <td>
                        <span className="badge bg-light text-navy border fw-bold">{eng.engineer_code}</span>
                      </td>
                      <td>
                        <strong className="d-block text-navy">{eng.full_name}</strong>
                        <small className="text-muted">{eng.email}</small>
                      </td>
                      <td>{formatValue(eng.phone)}</td>
                      <td>{eng.designation || "Site Engineer"}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {eng.project_name || "Unassigned"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={eng.status || "Active"} />
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            title="View Engineer Profile & Performance"
                            onClick={() => {
                              setSelectedEngineer(eng);
                              setShowEngineerDrawer(true);
                            }}
                          >
                            <i className="bi bi-eye"></i> Details
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="View Assigned Workers"
                            onClick={() => {
                              setFilterEngineer(eng.id);
                              setActiveTab("workers");
                            }}
                          >
                            <i className="bi bi-people"></i> Workers
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-info"
                            title="Generate and Resend Credentials via SMS"
                            disabled={resendingId === eng.id}
                            onClick={() => handleResendCredentials(eng)}
                          >
                            {resendingId === eng.id ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <><i className="bi bi-send"></i> Resend SMS</>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Deactivate / Archive Engineer"
                            onClick={() => setDeleteTarget({ type: "engineer", id: eng.id })}
                          >
                            <i className="bi bi-archive"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Worker Details Drawer (8 Tabs) */}
      <WorkerDetailsDrawer
        show={showWorkerDrawer}
        onClose={() => setShowWorkerDrawer(false)}
        workerId={selectedWorkerId}
        onWorkerUpdated={loadData}
      />

      {/* Engineer Details Drawer (7 Tabs) */}
      <EngineerDetailsDrawer
        show={showEngineerDrawer}
        onClose={() => setShowEngineerDrawer(false)}
        engineer={selectedEngineer}
      />

      {/* Record Worker Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        worker={paymentWorker}
        onPaymentRecorded={() => {
          loadData();
        }}
      />

      {/* Administrator Allocate Budget Modal */}
      <AllocationModal
        show={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
        onAllocationSaved={() => {
          loadData();
        }}
        projects={projects}
        engineers={engineers}
      />

      {/* Add / Edit Worker Modal (For Engineer) */}
      {showWorkerModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15,23,42,0.6)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
              <div className="modal-header text-white p-4" style={{ backgroundColor: "#0f172a" }}>
                <div>
                  <span className="badge bg-info text-dark mb-1">
                    {workerModalMode === "create" ? "New Workforce Enrollment" : "Update Worker Profile"}
                  </span>
                  <h5 className="modal-title fw-bold mb-0">
                    {workerModalMode === "create" ? "Enroll Worker to Your Site Project" : `Edit Worker: ${currentWorker?.name}`}
                  </h5>
                  <small className="text-white-50">
                    {workerModalMode === "create"
                      ? "Worker ID will be sequentially auto-generated (WRK-xxx). Worker will be bound to your assigned project."
                      : `Worker ID: ${currentWorker?.worker_code}`}
                  </small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowWorkerModal(false)} disabled={submittingWorker}></button>
              </div>

              <form onSubmit={handleWorkerSubmit}>
                <div className="modal-body p-4 bg-light">
                  {/* Section 1: Personal Info */}
                  <div className="bg-white p-3 rounded-3 shadow-sm border mb-3">
                    <h6 className="fw-bold text-navy mb-3">1. Personal Information</h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label small fw-bold">Full Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Ramesh Patil"
                          value={workerForm.name}
                          onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold">Mobile Number *</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="e.g. 9876543210"
                          value={workerForm.phone}
                          onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold">Alternate Contact</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="e.g. 9123456780"
                          value={workerForm.alternate_phone}
                          onChange={(e) => setWorkerForm({ ...workerForm, alternate_phone: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Gender</label>
                        <select
                          className="form-select"
                          value={workerForm.gender}
                          onChange={(e) => setWorkerForm({ ...workerForm, gender: e.target.value })}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Date of Birth</label>
                        <input
                          type="date"
                          className="form-control"
                          value={workerForm.dob}
                          onChange={(e) => setWorkerForm({ ...workerForm, dob: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Blood Group</label>
                        <select
                          className="form-select"
                          value={workerForm.blood_group}
                          onChange={(e) => setWorkerForm({ ...workerForm, blood_group: e.target.value })}
                        >
                          <option value="">Select Blood Group</option>
                          {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Email (Optional)</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="worker@example.com"
                          value={workerForm.email}
                          onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold">Emergency Contact Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Next of Kin / Relative Name"
                          value={workerForm.emergency_contact_name}
                          onChange={(e) => setWorkerForm({ ...workerForm, emergency_contact_name: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold">Emergency Contact Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Emergency Phone Number"
                          value={workerForm.emergency_contact_phone}
                          onChange={(e) => setWorkerForm({ ...workerForm, emergency_contact_phone: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold">Permanent Address</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Full residential address, district, state..."
                          value={workerForm.address}
                          onChange={(e) => setWorkerForm({ ...workerForm, address: e.target.value })}
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Employment Details */}
                  <div className="bg-white p-3 rounded-3 shadow-sm border mb-3">
                    <h6 className="fw-bold text-navy mb-3">2. Employment &amp; Trade Details</h6>
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Worker Classification</label>
                        <select
                          className="form-select"
                          value={workerForm.worker_type}
                          onChange={(e) => setWorkerForm({ ...workerForm, worker_type: e.target.value })}
                        >
                          <option value="Skilled">Skilled</option>
                          <option value="Semi-skilled">Semi-skilled</option>
                          <option value="Unskilled">Unskilled</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Primary Trade / Skill</label>
                        <select
                          className="form-select"
                          value={workerForm.trade}
                          onChange={(e) => setWorkerForm({ ...workerForm, trade: e.target.value, role: e.target.value })}
                        >
                          {["Mason", "Carpenter", "Electrician", "Plumber", "Painter", "Welder", "Helper", "Operator", "Other"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Site Designation</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Lead Mason"
                          value={workerForm.designation}
                          onChange={(e) => setWorkerForm({ ...workerForm, designation: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Employment Basis</label>
                        <select
                          className="form-select"
                          value={workerForm.employment_type}
                          onChange={(e) => setWorkerForm({ ...workerForm, employment_type: e.target.value })}
                        >
                          <option value="Daily Wage">Daily Wage</option>
                          <option value="Contract">Contract</option>
                          <option value="Permanent">Permanent</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Joining Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={workerForm.joining_date}
                          onChange={(e) => setWorkerForm({ ...workerForm, joining_date: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Total Experience</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 5 Years"
                          value={workerForm.experience}
                          onChange={(e) => setWorkerForm({ ...workerForm, experience: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Work Area / Section</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Tower A - Level 3"
                          value={workerForm.work_area}
                          onChange={(e) => setWorkerForm({ ...workerForm, work_area: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Shift</label>
                        <select
                          className="form-select"
                          value={workerForm.shift}
                          onChange={(e) => setWorkerForm({ ...workerForm, shift: e.target.value })}
                        >
                          <option value="Morning">Morning</option>
                          <option value="General">General</option>
                          <option value="Evening">Evening</option>
                          <option value="Night">Night</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Wage & Payment Details */}
                  <div className="bg-white p-3 rounded-3 shadow-sm border">
                    <h6 className="fw-bold text-navy mb-3">3. Compensation &amp; Bank Account</h6>
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Daily Wage (₹) *</label>
                        <input
                          type="number"
                          className="form-control fw-bold text-success"
                          placeholder="e.g. 750"
                          value={workerForm.daily_wage}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWorkerForm({
                              ...workerForm,
                              daily_wage: val,
                              salary: String(Number(val) * 26)
                            });
                          }}
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Overtime Rate (₹/hr)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 90"
                          value={workerForm.overtime_rate}
                          onChange={(e) => setWorkerForm({ ...workerForm, overtime_rate: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Preferred Payment Method</label>
                        <select
                          className="form-select"
                          value={workerForm.payment_method}
                          onChange={(e) => setWorkerForm({ ...workerForm, payment_method: e.target.value })}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Bank">Bank Transfer</option>
                          <option value="UPI">UPI</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Status</label>
                        <select
                          className="form-select"
                          value={workerForm.status}
                          onChange={(e) => setWorkerForm({ ...workerForm, status: e.target.value })}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Terminated">Terminated</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Bank Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. State Bank of India"
                          value={workerForm.bank_name}
                          onChange={(e) => setWorkerForm({ ...workerForm, bank_name: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Account Number</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Bank Account Number"
                          value={workerForm.account_number}
                          onChange={(e) => setWorkerForm({ ...workerForm, account_number: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">IFSC Code</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. SBIN0001234"
                          value={workerForm.ifsc_code}
                          onChange={(e) => setWorkerForm({ ...workerForm, ifsc_code: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">UPI ID</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="worker@upi"
                          value={workerForm.upi_id}
                          onChange={(e) => setWorkerForm({ ...workerForm, upi_id: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-white border-top p-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setShowWorkerModal(false)} disabled={submittingWorker}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                    disabled={submittingWorker}
                  >
                    {submittingWorker ? "Enrolling Worker..." : (workerModalMode === "create" ? "Save & Assign Worker" : "Update Profile")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ADD ENGINEER MODAL (ADMINISTRATOR ONLY)
      ========================================================= */}
      {showEngineerModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="modal-header text-white p-3 px-4 d-flex align-items-center justify-content-between"
                style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: "36px", height: "36px", backgroundColor: "rgba(39, 196, 232, 0.2)" }}
                  >
                    <i className="bi bi-person-badge-fill text-info fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold m-0 text-white">Enroll Site Engineer</h5>
                    <small className="text-white-50" style={{ fontSize: "12px" }}>
                      Sequential ID &amp; temporary credentials will be auto-generated and dispatched via SMS
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEngineerModal(false)}
                  disabled={submittingEngineer}
                ></button>
              </div>

              <form onSubmit={handleEngineerSubmit}>
                <div className="modal-body p-4 bg-light" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  {/* Informational Callout */}
                  <div
                    className="p-3 mb-4 rounded-3 border d-flex align-items-start gap-3"
                    style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}
                  >
                    <i className="bi bi-shield-lock-fill text-primary fs-4 mt-1"></i>
                    <div>
                      <strong className="d-block text-primary small mb-1">
                        Automated Credentials &amp; Mandatory Security
                      </strong>
                      <p className="mb-0 text-muted small" style={{ lineHeight: "1.5" }}>
                        The engineer will be assigned a unique code (e.g. <code>ENG-001</code>) and an 8+ character temporary password.
                        Credentials are automatically dispatched to the engineer's mobile phone via SMS.
                        The engineer is required to establish their own personal password upon their first login.
                      </p>
                    </div>
                  </div>

                  {/* Section 1: Personal & Contact Information */}
                  <div className="bg-white p-3 rounded-3 shadow-sm border mb-3">
                    <h6 className="fw-bold text-navy mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-person text-info"></i> 1. Personal &amp; Contact Details
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-navy">Full Legal Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Rajesh Sharma"
                          value={engineerForm.full_name}
                          onChange={(e) => setEngineerForm({ ...engineerForm, full_name: e.target.value })}
                          required
                          autoFocus
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-navy">Official Email Address *</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="engineer@smartconstruction.in"
                          value={engineerForm.email}
                          onChange={(e) => setEngineerForm({ ...engineerForm, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-navy">Mobile Number (For SMS Credentials) *</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light text-muted small">+91</span>
                          <input
                            type="tel"
                            className="form-control"
                            placeholder="9876543210"
                            value={engineerForm.phone}
                            onChange={(e) => setEngineerForm({ ...engineerForm, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-navy">Joining Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={engineerForm.joining_date}
                          onChange={(e) => setEngineerForm({ ...engineerForm, joining_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-navy">Residential / Permanent Address</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Residential address, city, state, pin code..."
                          value={engineerForm.address}
                          onChange={(e) => setEngineerForm({ ...engineerForm, address: e.target.value })}
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Project Assignment & Professional Qualifications */}
                  <div className="bg-white p-3 rounded-3 shadow-sm border">
                    <h6 className="fw-bold text-navy mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-briefcase text-info"></i> 2. Project Assignment &amp; Qualifications
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-navy">Assigned Construction Project *</label>
                        <select
                          className="form-select fw-bold text-primary"
                          value={engineerForm.project_id}
                          onChange={(e) => setEngineerForm({ ...engineerForm, project_id: e.target.value })}
                          required
                        >
                          <option value="">Select Construction Project...</option>
                          {projects.map((proj) => (
                            <option key={proj.id} value={proj.id}>
                              {proj.name} ({proj.project_code || `PRJ-${proj.id}`})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-navy">Designation / Role *</label>
                        <select
                          className="form-select"
                          value={engineerForm.designation}
                          onChange={(e) => setEngineerForm({ ...engineerForm, designation: e.target.value })}
                        >
                          <option value="Site Engineer">Site Engineer</option>
                          <option value="Senior Site Engineer">Senior Site Engineer</option>
                          <option value="Structural Engineer">Structural Engineer</option>
                          <option value="QA/QC Site Engineer">QA/QC Site Engineer</option>
                          <option value="Project Engineer">Project Engineer</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-navy">Highest Qualification</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. B.Tech Civil Engineering"
                          value={engineerForm.qualification}
                          onChange={(e) => setEngineerForm({ ...engineerForm, qualification: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-navy">Relevant Site Experience</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 4+ Years Commercial High-Rise"
                          value={engineerForm.experience}
                          onChange={(e) => setEngineerForm({ ...engineerForm, experience: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-white border-top p-3 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => setShowEngineerModal(false)}
                    disabled={submittingEngineer}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold d-flex align-items-center gap-2"
                    style={{ backgroundColor: "#0f172a", borderColor: "#0f172a" }}
                    disabled={submittingEngineer}
                  >
                    {submittingEngineer ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Generating Credentials &amp; Sending SMS...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-check"></i>
                        Enroll Engineer &amp; Dispatch SMS
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ENGINEER CREDENTIALS SUCCESS & SMS DISPATCH MODAL
      ========================================================= */}
      {engineerCredentialsModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="modal-header text-white p-3 px-4 d-flex align-items-center justify-content-between"
                style={{ background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center bg-white"
                    style={{ width: "36px", height: "36px", color: "#047857" }}
                  >
                    <i className="bi bi-check2-circle fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold m-0 text-white">
                      {engineerCredentialsModal.isResend ? "Credentials Re-Dispatched" : "Engineer Enrolled Successfully"}
                    </h5>
                    <small className="text-white-50" style={{ fontSize: "11px" }}>
                      SMS Delivery Confirmed &amp; Security Protocol Activated
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEngineerCredentialsModal(null)}
                ></button>
              </div>

              <div className="modal-body p-4 bg-light">
                <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <div>
                      <small className="text-muted text-uppercase fw-bold" style={{ fontSize: "10px" }}>Engineer ID</small>
                      <div className="fs-5 fw-bolder font-monospace text-primary">
                        {engineerCredentialsModal.engineerCode}
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1">
                      <i className="bi bi-check-circle-fill me-1"></i> SMS Dispatched
                    </span>
                  </div>

                  <div className="row g-2 small mb-3">
                    <div className="col-6">
                      <span className="text-muted d-block">Full Name:</span>
                      <strong className="text-dark">{engineerCredentialsModal.fullName}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Designation:</span>
                      <strong className="text-dark">{engineerCredentialsModal.designation}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Assigned Project:</span>
                      <strong className="text-dark">{engineerCredentialsModal.projectName}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Mobile Phone:</span>
                      <strong className="text-dark">{engineerCredentialsModal.phone}</strong>
                    </div>
                    <div className="col-12">
                      <span className="text-muted d-block">Login Email:</span>
                      <strong className="text-dark">{engineerCredentialsModal.email}</strong>
                    </div>
                  </div>

                  {engineerCredentialsModal.temporaryPassword && (
                    <div className="p-2 rounded-2 bg-light border d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: "10px" }}>TEMPORARY PASSWORD</small>
                        <span className="font-monospace fw-bold text-navy">
                          {engineerCredentialsModal.temporaryPassword}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          navigator.clipboard.writeText(engineerCredentialsModal.temporaryPassword);
                          toastSuccess("Copied", "Temporary password copied to clipboard.");
                        }}
                      >
                        <i className="bi bi-clipboard"></i> Copy
                      </button>
                    </div>
                  )}

                  <div className="alert alert-warning py-2 px-3 mb-0 small border-0" style={{ fontSize: "11px" }}>
                    <i className="bi bi-info-circle-fill me-1"></i>
                    <strong>Mandatory First-Login Password Change:</strong> The engineer will be forced to change this temporary password upon signing in at <code>/login</code>.
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 py-2 fw-bold small"
                    onClick={() => {
                      const text = `Smart Construction - Site Engineer Credentials\nID: ${engineerCredentialsModal.engineerCode}\nName: ${engineerCredentialsModal.fullName}\nEmail: ${engineerCredentialsModal.email}\nPhone: ${engineerCredentialsModal.phone}\nProject: ${engineerCredentialsModal.projectName}${engineerCredentialsModal.temporaryPassword ? `\nTemporary Password: ${engineerCredentialsModal.temporaryPassword}` : ""}`;
                      navigator.clipboard.writeText(text);
                      toastSuccess("Copied", "Full engineer credential summary copied to clipboard.");
                    }}
                  >
                    <i className="bi bi-clipboard-check me-1"></i> Copy Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-success w-100 py-2 fw-bold small"
                    onClick={() => setEngineerCredentialsModal(null)}
                  >
                    Done &amp; View Roster
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          WORKER CREDENTIALS SUCCESS & SMS DISPATCH MODAL
      ========================================================= */}
      {workerCredentialsModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="modal-header text-white p-3 px-4 d-flex align-items-center justify-content-between"
                style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center bg-white"
                    style={{ width: "36px", height: "36px", color: "#0284c7" }}
                  >
                    <i className="bi bi-person-check-fill fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold m-0 text-white">Worker Enrolled Successfully</h5>
                    <small className="text-white-50" style={{ fontSize: "11px" }}>
                      Worker Credentials Generated &amp; Dispatched via SMS
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setWorkerCredentialsModal(null)}
                ></button>
              </div>

              <div className="modal-body p-4 bg-light">
                <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <div>
                      <small className="text-muted text-uppercase fw-bold" style={{ fontSize: "10px" }}>Worker ID</small>
                      <div className="fs-5 fw-bolder font-monospace text-primary">
                        {workerCredentialsModal.workerId}
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1">
                      <i className="bi bi-chat-left-dots-fill me-1"></i> SMS Dispatched
                    </span>
                  </div>

                  <div className="row g-2 small mb-3">
                    <div className="col-6">
                      <span className="text-muted d-block">Worker Name:</span>
                      <strong className="text-dark">{workerCredentialsModal.name}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Login Mobile:</span>
                      <strong className="text-dark">{workerCredentialsModal.phone}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Assigned Project:</span>
                      <strong className="text-dark">{workerCredentialsModal.projectName}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Supervising Engineer:</span>
                      <strong className="text-dark">{workerCredentialsModal.assignedEngineer}</strong>
                    </div>
                  </div>

                  {workerCredentialsModal.temporaryPassword && (
                    <div className="p-2 rounded-2 bg-light border d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: "10px" }}>TEMPORARY PASSWORD</small>
                        <span className="font-monospace fw-bold text-navy">
                          {workerCredentialsModal.temporaryPassword}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          navigator.clipboard.writeText(workerCredentialsModal.temporaryPassword);
                          toastSuccess("Copied", "Worker temporary password copied to clipboard.");
                        }}
                      >
                        <i className="bi bi-clipboard"></i> Copy
                      </button>
                    </div>
                  )}

                  <div className="alert alert-info py-2 px-3 mb-0 small border-0" style={{ fontSize: "11px" }}>
                    <i className="bi bi-shield-check me-1"></i>
                    <strong>Worker Portal Sign-in:</strong> Worker logs in with their Worker ID / Mobile Number and temporary password. They will be prompted to secure their account on first sign-in.
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 py-2 fw-bold small"
                    onClick={() => {
                      const text = `Smart Construction - Worker Credentials\nWorker ID: ${workerCredentialsModal.workerId}\nName: ${workerCredentialsModal.name}\nLogin: ${workerCredentialsModal.phone}\nProject: ${workerCredentialsModal.projectName}\nTemporary Password: ${workerCredentialsModal.temporaryPassword}`;
                      navigator.clipboard.writeText(text);
                      toastSuccess("Copied", "Worker credentials copied to clipboard.");
                    }}
                  >
                    <i className="bi bi-clipboard-check me-1"></i> Copy Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary w-100 py-2 fw-bold small"
                    style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                    onClick={() => setWorkerCredentialsModal(null)}
                  >
                    Done &amp; Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Archive / Soft Delete */}
      <ConfirmModal
        show={Boolean(deleteTarget)}
        title="Confirm Deactivation / Archive"
        message="Are you sure you want to deactivate this record? In order to maintain financial and compliance integrity, the record will be archived rather than permanently deleted."
        confirmText="Deactivate & Archive"
        confirmVariant="danger"
        isConfirming={isDeleting}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
