import React, { useState, useEffect } from "react";
import { projectService } from "../services/projectService";
import { workerService } from "../services/workerService";
import { taskService } from "../services/taskService";
import { payrollService } from "../services/payrollService";
import { materialService } from "../services/materialService";
import { progressService } from "../services/progressService";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import { formatCurrency, formatValue } from "../utils/currencyFormatter";
import { formatDate } from "../utils/dateFormatter";

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Reports() {
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const { error: toastError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, wRes, tRes, payRes, mRes] = await Promise.all([
        projectService.getProjects().catch(() => ({ projects: [] })),
        workerService.getWorkers().catch(() => ({ workers: [] })),
        taskService.getTasks().catch(() => ({ tasks: [] })),
        payrollService.getPayroll().catch(() => ({ payroll: [] })),
        materialService.getMaterials().catch(() => ({ materials: [] })),
      ]);

      if (pRes.projects) setProjects(pRes.projects);
      if (wRes.workers) setWorkers(wRes.workers);
      if (tRes.tasks) setTasks(tRes.tasks);
      if (payRes.payroll) setPayroll(payRes.payroll);
      if (mRes.materials) setMaterials(mRes.materials);
    } catch (err) {
      toastError("Load Error", "Unable to aggregate analytics dossier.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingState message="Compiling executive project metrics and charts..." />;
  }

  // Summary Metrics
  const totalProjects = projects.length;
  const totalWorkers = workers.length;
  const totalTasks = tasks.length;
  const totalPayroll = payroll.reduce((sum, p) => sum + (Number(p.total_salary) || 0), 0);
  const totalMaterialsValue = materials.reduce(
    (sum, m) => sum + (Number(m.total_value) || Number(m.quantity) * Number(m.unit_price) || 0),
    0
  );

  // Chart 1: Project Progress (Bar Chart)
  const projectLabels = projects.slice(0, 6).map((p) => p.name);
  const projectProgressData = projects.slice(0, 6).map((p) => Number(p.progress) || 0);

  const projectChartData = {
    labels: projectLabels.length > 0 ? projectLabels : ["No Projects"],
    datasets: [
      {
        label: "Completion Progress (%)",
        data: projectProgressData.length > 0 ? projectProgressData : [0],
        backgroundColor: "rgba(15, 168, 196, 0.75)",
        borderColor: "#0FA8C4",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  // Chart 2: Task Status (Doughnut Chart)
  const pendingTasks = tasks.filter((t) => (t.status || "").toLowerCase() === "pending").length;
  const inProgressTasks = tasks.filter((t) => (t.status || "").toLowerCase() === "in progress").length;
  const completedTasks = tasks.filter((t) => (t.status || "").toLowerCase() === "completed").length;

  const taskDoughnutData = {
    labels: ["Completed", "In Progress", "Pending"],
    datasets: [
      {
        data: [completedTasks, inProgressTasks, pendingTasks],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
        borderWidth: 2,
        borderColor: "#FFFFFF",
      },
    ],
  };

  return (
    <div>
      <PageHeader
        title="Executive Analytics &amp; Reports"
        subtitle="Holistic cross-module intelligence across project budgets, workforce velocity, and inventory valuation."
        actions={
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => window.print()}
              style={{ fontWeight: 600, borderRadius: "8px" }}
            >
              <i className="bi bi-printer me-1"></i> Print / Export PDF
            </button>
            <button type="button" className="btn-saas-primary btn-sm" onClick={loadData}>
              <i className="bi bi-arrow-clockwise"></i> Refresh Metrics
            </button>
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-sm-6">
          <StatCard
            icon="bi-buildings-fill"
            label="Total Projects"
            value={String(totalProjects).padStart(2, "0")}
            footer="Active Portfolio"
            colorBg="#eff6ff"
            colorIcon="#3b82f6"
          />
        </div>
        <div className="col-xl-3 col-sm-6">
          <StatCard
            icon="bi-people-fill"
            label="Total Workers"
            value={String(totalWorkers).padStart(2, "0")}
            footer="Registered Personnel"
            colorBg="#f3e8ff"
            colorIcon="#8b5cf6"
          />
        </div>
        <div className="col-xl-3 col-sm-6">
          <StatCard
            icon="bi-check2-square"
            label="Total Tasks"
            value={String(totalTasks).padStart(2, "0")}
            footer={`${completedTasks} Finished`}
            colorBg="#fef3c7"
            colorIcon="#f59e0b"
          />
        </div>
        <div className="col-xl-3 col-sm-6">
          <StatCard
            icon="bi-wallet2"
            label="Total Payroll"
            value={formatCurrency(totalPayroll)}
            footer="Wage Disbursements"
            colorBg="#ecfdf5"
            colorIcon="#10b981"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="saas-card h-100 mb-0">
            <div className="saas-card-header">
              <div>
                <h3 className="saas-card-title">Project Progress Overview</h3>
                <div className="saas-card-sub">Real-time completion percentage per jobsite</div>
              </div>
            </div>
            <div style={{ minHeight: "260px" }}>
              <Bar
                data={projectChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: (v) => `${v}%`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="saas-card h-100 mb-0">
            <div className="saas-card-header">
              <div>
                <h3 className="saas-card-title">Task Health Breakdown</h3>
                <div className="saas-card-sub">Status distribution of scheduled duties</div>
              </div>
            </div>
            <div style={{ minHeight: "260px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Doughnut
                data={taskDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Portfolio Performance Table */}
      <div className="saas-card mb-0">
        <div className="saas-card-header">
          <div>
            <h3 className="saas-card-title">Project Performance Dossier</h3>
            <div className="saas-card-sub">Site financial commitments and milestones</div>
          </div>
        </div>

        <div className="app-table-container">
          <table className="app-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Project</th>
                <th>Site Engineer</th>
                <th>Budget</th>
                <th>Milestone Progress</th>
                <th>Target Completion</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="badge bg-light text-navy border">
                      {p.projectCode || p.project_code || `PRJ-${p.id}`}
                    </span>
                  </td>
                  <td>
                    <strong className="text-navy">{p.name}</strong>
                    <div className="small text-muted">{p.location}</div>
                  </td>
                  <td>{formatValue(p.engineer, "Unassigned")}</td>
                  <td className="fw-bold">{formatCurrency(p.budget)}</td>
                  <td style={{ minWidth: "120px" }}>
                    <div className="d-flex justify-content-between small fw-bold mb-1">
                      <span>{p.progress || 0}%</span>
                    </div>
                    <div className="progress" style={{ height: "6px" }}>
                      <div
                        className="progress-bar bg-info"
                        style={{ width: `${p.progress || 0}%` }}
                      ></div>
                    </div>
                  </td>
                  <td>{formatDate(p.completionDate || p.completion_date)}</td>
                  <td>
                    <span className="badge bg-light text-navy border">{p.status || "In Progress"}</span>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No project records available to summarize.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

