// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// FINANCIAL & AUDIT INTELLIGENCE ROUTER
// ======================================================================

const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");
const { getAuthScope } = require("../utils/scopeHelper");

const router = express.Router();
router.use(authenticateToken);

// ======================================================================
// 1. ADMINISTRATOR FINANCIAL DASHBOARD METRICS & CHARTS
// ======================================================================
router.get("/admin-dashboard", async (req, res) => {
    try {
        const scope = await getAuthScope(req);
        if (!scope.isAdmin) {
            return res.status(403).json({ success: false, error: "Access Denied: Administrator role required." });
        }

        // Parallel aggregation queries from real database tables
        const [
            [[{ total_projects, total_project_budget }]],
            [[{ total_engineers, active_engineers }]],
            [[{ total_workers, active_workers }]],
            [[{ total_allocated_to_engineers, total_paid_to_engineers }]],
            [[{ total_paid_to_workers, pending_worker_payments }]],
            [[{ material_expenses }]],
            [[{ other_expenses }]],
            [projectsSummary],
            [engineersSummary],
            [paymentStatusDistribution],
            [monthlyPayments]
        ] = await Promise.all([
            // Projects
            db.query(`
                SELECT 
                    COUNT(*) AS total_projects,
                    COALESCE(SUM(budget), 0) AS total_project_budget 
                FROM projects
            `),
            // Engineers
            db.query(`
                SELECT 
                    COUNT(*) AS total_engineers,
                    COALESCE(SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END), 0) AS active_engineers 
                FROM engineers
            `),
            // Workers
            db.query(`
                SELECT 
                    COUNT(*) AS total_workers,
                    COALESCE(SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END), 0) AS active_workers 
                FROM workers
            `),
            // Allocations
            db.query(`
                SELECT 
                    COALESCE(SUM(allocated_amount), 0) AS total_allocated_to_engineers,
                    COALESCE(SUM(amount_paid_to_engineer), 0) AS total_paid_to_engineers 
                FROM engineer_allocations
            `),
            // Worker Payments
            db.query(`
                SELECT 
                    COALESCE(SUM(amount_paid), 0) AS total_paid_to_workers,
                    COALESCE(SUM(remaining_amount), 0) AS pending_worker_payments 
                FROM worker_payments
            `),
            // Material Expenses
            db.query(`SELECT COALESCE(SUM(total_value), 0) AS material_expenses FROM materials`),
            // Other Expenses
            db.query(`SELECT COALESCE(SUM(amount), 0) AS other_expenses FROM project_expenses`),
            // Per-Project Financial Breakdown
            db.query(`
                SELECT 
                    p.id,
                    p.project_code,
                    p.name,
                    p.budget,
                    p.status,
                    COALESCE((SELECT SUM(allocated_amount) FROM engineer_allocations WHERE project_id = p.id), 0) AS total_allocated,
                    COALESCE((SELECT SUM(amount_paid) FROM worker_payments WHERE project_id = p.id), 0) AS total_paid_to_workers,
                    COALESCE((SELECT SUM(total_value) FROM materials WHERE project_id = p.id), 0) AS project_material_cost,
                    (
                        p.budget - 
                        COALESCE((SELECT SUM(amount_paid) FROM worker_payments WHERE project_id = p.id), 0) -
                        COALESCE((SELECT SUM(total_value) FROM materials WHERE project_id = p.id), 0)
                    ) AS remaining_budget
                FROM projects p
                ORDER BY p.id DESC
            `),
            // Per-Engineer Financial & Workforce Breakdown
            db.query(`
                SELECT 
                    e.id,
                    e.engineer_code,
                    e.full_name,
                    e.designation,
                    e.status,
                    p.name AS project_name,
                    COALESCE((SELECT SUM(allocated_amount) FROM engineer_allocations WHERE engineer_id = e.id), 0) AS allocated_amount,
                    COALESCE((SELECT SUM(amount_paid) FROM worker_payments WHERE engineer_id = e.id), 0) AS paid_to_workers,
                    (
                        COALESCE((SELECT SUM(allocated_amount) FROM engineer_allocations WHERE engineer_id = e.id), 0) -
                        COALESCE((SELECT SUM(amount_paid) FROM worker_payments WHERE engineer_id = e.id), 0)
                    ) AS remaining_balance,
                    (SELECT COUNT(*) FROM workers WHERE engineer_id = e.id OR (project_id = e.project_id AND e.project_id IS NOT NULL)) AS worker_count,
                    COALESCE((SELECT SUM(remaining_amount) FROM worker_payments WHERE engineer_id = e.id), 0) AS pending_worker_payments
                FROM engineers e
                LEFT JOIN projects p ON p.id = e.project_id
                ORDER BY e.id DESC
            `),
            // Worker Payment Status Distribution
            db.query(`
                SELECT 
                    COALESCE(payment_status, 'Paid') AS status,
                    COUNT(*) AS count,
                    COALESCE(SUM(amount_paid), 0) AS total_amount
                FROM worker_payments
                GROUP BY payment_status
            `),
            // Monthly Worker Payments (last 6 months)
            db.query(`
                SELECT 
                    DATE_FORMAT(payment_date, '%b %Y') AS month,
                    COALESCE(SUM(amount_paid), 0) AS amount
                FROM worker_payments
                GROUP BY DATE_FORMAT(payment_date, '%b %Y'), YEAR(payment_date), MONTH(payment_date)
                ORDER BY YEAR(payment_date) ASC, MONTH(payment_date) ASC
                LIMIT 6
            `)
        ]);

        const totalSpent = Number(total_paid_to_workers) + Number(material_expenses) + Number(other_expenses);
        const remainingProjectBudget = Math.max(0, Number(total_project_budget) - totalSpent);

        // Calculate Project Financial Utilization Percentage
        const enrichedProjects = projectsSummary.map(pr => {
            const budget = Number(pr.budget || 0);
            const spent = Number(pr.total_paid_to_workers || 0) + Number(pr.project_material_cost || 0);
            const util = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
            return {
                ...pr,
                spent,
                utilization_percentage: util
            };
        });

        res.json({
            success: true,
            summary: {
                total_projects: Number(total_projects),
                total_project_budget: Number(total_project_budget),
                total_engineers: Number(total_engineers),
                active_engineers: Number(active_engineers),
                total_workers: Number(total_workers),
                active_workers: Number(active_workers),
                total_allocated_to_engineers: Number(total_allocated_to_engineers),
                total_paid_to_engineers: Number(total_paid_to_engineers),
                total_paid_to_workers: Number(total_paid_to_workers),
                pending_worker_payments: Number(pending_worker_payments),
                material_expenses: Number(material_expenses),
                other_expenses: Number(other_expenses),
                total_spending: totalSpent,
                remaining_project_budget: remainingProjectBudget
            },
            charts: {
                budget_vs_spending: enrichedProjects.map(p => ({
                    name: p.name,
                    budget: Number(p.budget),
                    spending: p.spent,
                    allocated: Number(p.total_allocated)
                })),
                engineer_allocations: engineersSummary.map(e => ({
                    name: e.full_name,
                    allocated: Number(e.allocated_amount),
                    paid: Number(e.paid_to_workers),
                    remaining: Number(e.remaining_balance)
                })),
                worker_payment_status: paymentStatusDistribution,
                monthly_payments: monthlyPayments
            },
            projects_overview: enrichedProjects,
            engineers_overview: engineersSummary
        });
    } catch (error) {
        console.error("Admin financial dashboard error:", error);
        res.status(500).json({ success: false, error: "Failed to generate administrative financial portfolio." });
    }
});

// ======================================================================
// 2. ENGINEER DASHBOARD METRICS (SCOPED TO AUTHENTICATED ENGINEER)
// ======================================================================
router.get("/engineer-dashboard", async (req, res) => {
    try {
        const scope = await getAuthScope(req);
        if (!scope.isEngineer || !scope.engineer) {
            return res.status(403).json({ success: false, error: "Access Denied: Engineer role required." });
        }

        const engineerId = scope.engineer.id;
        const projectId = scope.projectId;

        const [
            [projectRows],
            [allocRows],
            [workerRows],
            [attendanceTodayRows],
            [pendingPaymentsRows],
            [openIssuesRows],
            [materialAlertRows],
            [tasksRows]
        ] = await Promise.all([
            // Assigned Project
            projectId ? db.query("SELECT * FROM projects WHERE id = ?", [projectId]) : [[]],
            // Allocation & Payments
            db.query(`
                SELECT 
                    COALESCE(SUM(allocated_amount), 0) AS allocated_amount,
                    COALESCE(SUM(amount_paid_to_engineer), 0) AS paid_to_engineer
                FROM engineer_allocations
                WHERE engineer_id = ? AND (project_id = ? OR ? IS NULL)
            `, [engineerId, projectId, projectId]),
            // Assigned Workers
            db.query(`
                SELECT 
                    w.*,
                    COALESCE((SELECT SUM(amount_paid) FROM worker_payments WHERE worker_id = w.id), 0) AS total_paid,
                    COALESCE((SELECT SUM(remaining_amount) FROM worker_payments WHERE worker_id = w.id), 0) AS pending_payment
                FROM workers w
                WHERE (w.project_id = ? OR w.engineer_id = ?)
                ORDER BY w.id DESC
            `, [projectId || 0, engineerId]),
            // Today's Attendance
            db.query(`
                SELECT COUNT(*) AS present_count 
                FROM attendance 
                WHERE (project_id = ? OR engineer_id = ?) AND date = CURDATE() AND status = 'Present'
            `, [projectId || 0, engineerId]),
            // Pending Worker Payments
            db.query(`
                SELECT 
                    COUNT(*) AS pending_count,
                    COALESCE(SUM(remaining_amount), 0) AS pending_total
                FROM worker_payments
                WHERE engineer_id = ? AND remaining_amount > 0
            `, [engineerId]),
            // Open Site Issues
            db.query(`
                SELECT COUNT(*) AS open_issues_count 
                FROM issues 
                WHERE status != 'Resolved'
            `),
            // Material Alerts
            db.query(`
                SELECT COUNT(*) AS low_stock_count 
                FROM materials 
                WHERE quantity < 20
            `),
            // Tasks
            db.query(`
                SELECT * 
                FROM tasks 
                ORDER BY due_date ASC 
                LIMIT 5
            `)
        ]);

        const project = projectRows.length > 0 ? projectRows[0] : null;
        const allocatedAmount = Number(allocRows[0]?.allocated_amount || 0);

        // Sum what this engineer paid to workers
        const [paidRows] = await db.query(`
            SELECT COALESCE(SUM(amount_paid), 0) AS total_paid_to_workers
            FROM worker_payments
            WHERE engineer_id = ?
        `, [engineerId]);

        const paidToWorkers = Number(paidRows[0].total_paid_to_workers);
        const remainingAllocation = Math.max(0, allocatedAmount - paidToWorkers);

        res.json({
            success: true,
            engineer: scope.engineer,
            project,
            financials: {
                project_budget: project ? Number(project.budget) : 0,
                allocated_budget: allocatedAmount,
                paid_to_workers: paidToWorkers,
                remaining_balance: remainingAllocation
            },
            metrics: {
                total_workers: workerRows.length,
                active_workers: workerRows.filter(w => w.status === "Active").length,
                present_today: attendanceTodayRows[0]?.present_count || 0,
                pending_worker_payments_count: pendingPaymentsRows[0]?.pending_count || 0,
                pending_worker_payments_total: Number(pendingPaymentsRows[0]?.pending_total || 0),
                open_issues_count: openIssuesRows[0]?.open_issues_count || 0,
                low_stock_count: materialAlertRows[0]?.low_stock_count || 0
            },
            workers: workerRows,
            tasks: tasksRows
        });
    } catch (error) {
        console.error("Engineer dashboard error:", error);
        res.status(500).json({ success: false, error: "Failed to load engineer dashboard data." });
    }
});

// ======================================================================
// 3. PAYMENT AUDIT TRAIL (ANSWERS ALL 10 AUDIT QUESTIONS)
// ======================================================================
router.get("/payment-audit", async (req, res) => {
    try {
        const scope = await getAuthScope(req);
        if (!scope.isAdmin) {
            return res.status(403).json({ success: false, error: "Access Denied: Payment audit is restricted to Administrators." });
        }

        const [
            [projects],
            [allocations],
            [engineerWorkers],
            [workerPaymentsLedger],
            [unpaidWorkersSummary]
        ] = await Promise.all([
            // 1 & 10: Total Project Budgets & Remaining
            db.query(`
                SELECT 
                    p.id, p.project_code, p.name, p.budget,
                    COALESCE((SELECT SUM(amount_paid) FROM worker_payments WHERE project_id = p.id), 0) AS total_paid_to_workers,
                    COALESCE((SELECT SUM(total_value) FROM materials WHERE project_id = p.id), 0) AS material_expenses,
                    (
                        p.budget - 
                        COALESCE((SELECT SUM(amount_paid) FROM worker_payments WHERE project_id = p.id), 0) -
                        COALESCE((SELECT SUM(total_value) FROM materials WHERE project_id = p.id), 0)
                    ) AS remaining_budget
                FROM projects p
            `),

            // 2, 3, 6: Engineer Allocations, Used/Received, and Paid to Workers
            db.query(`
                SELECT 
                    e.id AS engineer_id, e.engineer_code, e.full_name,
                    p.id AS project_id, p.name AS project_name,
                    COALESCE(a.allocated_amount, 0) AS allocated_amount,
                    COALESCE(a.amount_paid_to_engineer, 0) AS received_by_engineer,
                    COALESCE((SELECT SUM(amount_paid) FROM worker_payments WHERE engineer_id = e.id AND project_id = e.project_id), 0) AS paid_to_workers,
                    (
                        COALESCE(a.allocated_amount, 0) - 
                        COALESCE((SELECT SUM(amount_paid) FROM worker_payments WHERE engineer_id = e.id AND project_id = e.project_id), 0)
                    ) AS remaining_engineer_balance
                FROM engineers e
                LEFT JOIN projects p ON p.id = e.project_id
                LEFT JOIN engineer_allocations a ON a.engineer_id = e.id AND a.project_id = e.project_id
            `),

            // 4 & 5: Workers per Engineer & List
            db.query(`
                SELECT 
                    e.id AS engineer_id, e.full_name AS engineer_name,
                    w.id AS worker_id, w.worker_code, w.name AS worker_name, w.trade, w.daily_wage, w.status
                FROM workers w
                JOIN engineers e ON e.id = w.engineer_id
                ORDER BY e.full_name, w.name
            `),

            // 7, 8, 9: Full Worker Payment Ledger
            db.query(`
                SELECT 
                    wp.id, wp.payment_code, wp.payment_date, wp.salary_period,
                    w.worker_code, wp.worker_name,
                    e.engineer_code, e.full_name AS engineer_name,
                    pr.project_code, pr.name AS project_name,
                    wp.gross_amount, wp.net_amount, wp.amount_paid, wp.remaining_amount,
                    wp.payment_status, wp.payment_method, wp.reference_number
                FROM worker_payments wp
                JOIN workers w ON w.id = wp.worker_id
                JOIN engineers e ON e.id = wp.engineer_id
                JOIN projects pr ON pr.id = wp.project_id
                ORDER BY wp.payment_date DESC, wp.id DESC
            `),

            // Workers with Pending/Unpaid Balances
            db.query(`
                SELECT 
                    w.id, w.worker_code, w.name, w.trade, w.phone,
                    p.name AS project_name, e.full_name AS engineer_name,
                    COALESCE(SUM(wp.remaining_amount), 0) AS total_unpaid_balance
                FROM workers w
                JOIN worker_payments wp ON wp.worker_id = w.id
                LEFT JOIN projects p ON p.id = w.project_id
                LEFT JOIN engineers e ON e.id = w.engineer_id
                WHERE wp.remaining_amount > 0
                GROUP BY w.id, w.worker_code, w.name, w.trade, w.phone, p.name, e.full_name
                HAVING total_unpaid_balance > 0
            `)
        ]);

        const totalBudget = projects.reduce((acc, p) => acc + Number(p.budget), 0);
        const totalRemainingBudget = projects.reduce((acc, p) => acc + Number(p.remaining_budget), 0);
        const totalPaidToWorkers = workerPaymentsLedger.reduce((acc, p) => acc + Number(p.amount_paid), 0);
        const totalUnpaid = workerPaymentsLedger.reduce((acc, p) => acc + Number(p.remaining_amount), 0);

        res.json({
            success: true,
            answers: {
                q1_total_project_budget: totalBudget,
                q2_engineer_allocations: allocations.map(a => ({ engineer: a.full_name, project: a.project_name, allocated: Number(a.allocated_amount) })),
                q3_engineer_used_amount: allocations.map(a => ({ engineer: a.full_name, received: Number(a.received_by_engineer) })),
                q4_worker_count_per_engineer: allocations.map(a => ({
                    engineer: a.full_name,
                    count: engineerWorkers.filter(w => w.engineer_id === a.engineer_id).length
                })),
                q5_workers_assigned_per_engineer: engineerWorkers,
                q6_engineer_paid_to_workers: allocations.map(a => ({ engineer: a.full_name, paid: Number(a.paid_to_workers) })),
                q7_fully_paid_workers_count: workerPaymentsLedger.filter(p => p.payment_status === "Paid").length,
                q8_workers_with_pending_payments: unpaidWorkersSummary,
                q9_total_unpaid_balance: totalUnpaid,
                q10_total_project_budget_remaining: totalRemainingBudget
            },
            ledger: workerPaymentsLedger,
            engineer_allocations: allocations,
            projects_summary: projects
        });
    } catch (error) {
        console.error("Payment audit error:", error);
        res.status(500).json({ success: false, error: "Failed to generate payment audit trail." });
    }
});

module.exports = router;

