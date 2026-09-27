// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER PAYMENT MANAGEMENT ROUTER (ENGINEER -> WORKER PAYMENT FLOW)
// ======================================================================

const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");
const { getAuthScope } = require("../utils/scopeHelper");

const router = express.Router();
router.use(authenticateToken);

/**
 * Generate sequential payment code: WPAY-001, WPAY-002, ...
 */
async function generatePaymentCode(connection) {
    const [rows] = await connection.query(`
        SELECT payment_code 
        FROM worker_payments 
        WHERE payment_code LIKE 'WPAY-%'
    `);

    let maxNum = 0;
    for (const r of rows) {
        if (!r.payment_code) continue;
        const match = String(r.payment_code).match(/WPAY-(\d+)/i);
        if (match) {
            const val = parseInt(match[1], 10);
            if (!isNaN(val) && val > maxNum) maxNum = val;
        }
    }
    const nextNum = maxNum + 1;
    return `WPAY-${String(nextNum).padStart(3, "0")}`;
}

// ======================================================================
// 1. GET WORKER PAYMENTS (SCOPED)
// ======================================================================
router.get("/worker-payments", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        let query = `
            SELECT 
                p.id,
                p.payment_code,
                p.worker_id,
                w.worker_code,
                w.name AS worker_name,
                w.trade AS worker_trade,
                w.phone AS worker_phone,
                p.engineer_id,
                e.full_name AS engineer_name,
                e.engineer_code,
                p.project_id,
                pr.name AS project_name,
                pr.project_code,
                p.payment_date,
                p.salary_period,
                p.working_days,
                p.daily_wage,
                p.overtime_amount,
                p.deductions,
                p.gross_amount,
                p.net_amount,
                p.amount_paid,
                p.remaining_amount,
                p.payment_status,
                p.payment_method,
                p.reference_number,
                p.remarks,
                p.created_at,
                p.updated_at
            FROM worker_payments p
            JOIN workers w ON w.id = p.worker_id
            JOIN engineers e ON e.id = p.engineer_id
            JOIN projects pr ON pr.id = p.project_id
        `;

        const whereClauses = [];
        const params = [];

        // Engineer scoping
        if (scope.isEngineer) {
            if (scope.engineer) {
                whereClauses.push(`p.engineer_id = ?`);
                params.push(scope.engineer.id);
            } else {
                return res.json({ success: true, count: 0, payments: [] });
            }
        }

        // Optional query filters
        if (req.query.projectId) {
            whereClauses.push(`p.project_id = ?`);
            params.push(req.query.projectId);
        }
        if (req.query.workerId) {
            whereClauses.push(`p.worker_id = ?`);
            params.push(req.query.workerId);
        }
        if (req.query.status) {
            whereClauses.push(`p.payment_status = ?`);
            params.push(req.query.status);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ` + whereClauses.join(" AND ");
        }

        query += ` ORDER BY p.payment_date DESC, p.id DESC`;

        const [payments] = await db.query(query, params);

        res.json({
            success: true,
            count: payments.length,
            payments
        });
    } catch (error) {
        console.error("Get worker payments error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch worker payments." });
    }
});

// ======================================================================
// 2. RECORD WORKER PAYMENT (DISBURSED BY ENGINEER)
// ======================================================================
router.post("/worker-payments", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        const {
            worker_id,
            payment_date,
            salary_period,
            working_days,
            daily_wage,
            overtime_amount,
            deductions,
            amount_paid,
            payment_method,
            reference_number,
            remarks
        } = req.body;

        if (!worker_id) {
            return res.status(400).json({ success: false, error: "Worker selection is required." });
        }

        // Fetch worker details to identify project and supervisor
        const [workerRows] = await db.query(`
            SELECT w.*, p.name AS project_name, p.budget AS project_budget
            FROM workers w
            LEFT JOIN projects p ON p.id = w.project_id
            WHERE w.id = ?
        `, [worker_id]);

        if (workerRows.length === 0) {
            return res.status(404).json({ success: false, error: "Worker record not found." });
        }
        const worker = workerRows[0];

        // Determine responsible engineer and project
        let effectiveEngineerId;
        let effectiveProjectId;

        if (scope.isEngineer) {
            if (!scope.engineer || !scope.projectId) {
                return res.status(403).json({ success: false, error: "You do not have an active project assigned." });
            }
            // Ensure worker belongs to engineer's project
            if (worker.project_id && worker.project_id !== scope.projectId) {
                return res.status(403).json({
                    success: false,
                    error: "Access Denied: You cannot record payments for workers outside your assigned project."
                });
            }
            effectiveEngineerId = scope.engineer.id;
            effectiveProjectId = scope.projectId;
        } else {
            // Administrator recording on behalf of worker's assigned engineer/project
            effectiveEngineerId = worker.engineer_id || (req.body.engineer_id ? Number(req.body.engineer_id) : 1);
            effectiveProjectId = worker.project_id || (req.body.project_id ? Number(req.body.project_id) : 1);
        }

        // Server-side financial calculations (DO NOT trust frontend math)
        const days = working_days !== undefined ? Number(working_days) : 0;
        const wage = daily_wage !== undefined ? Number(daily_wage) : Number(worker.daily_wage || 0);
        const overtime = overtime_amount !== undefined ? Number(overtime_amount) : 0;
        const deduct = deductions !== undefined ? Number(deductions) : 0;

        const basePay = days > 0 ? (days * wage) : (Number(req.body.gross_amount) || wage);
        const gross = basePay + overtime;
        const net = Math.max(0, gross - deduct);
        const paid = amount_paid !== undefined ? Number(amount_paid) : net;
        const remaining = Math.max(0, net - paid);

        let paymentStatus = "Paid";
        if (remaining > 0 && paid > 0) paymentStatus = "Partially Paid";
        else if (paid === 0 && net > 0) paymentStatus = "Pending";
        else if (remaining === 0) paymentStatus = "Paid";

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // REQUIREMENT 12 & 25: Check Engineer's Remaining Allocation Balance
            // Prevent negative balance
            const [allocRows] = await connection.query(`
                SELECT allocated_amount 
                FROM engineer_allocations 
                WHERE engineer_id = ? AND project_id = ?
                FOR UPDATE
            `, [effectiveEngineerId, effectiveProjectId]);

            const allocatedAmount = allocRows.length > 0 ? Number(allocRows[0].allocated_amount) : 0;

            const [paidRows] = await connection.query(`
                SELECT COALESCE(SUM(amount_paid), 0) AS total_paid 
                FROM worker_payments 
                WHERE engineer_id = ? AND project_id = ?
            `, [effectiveEngineerId, effectiveProjectId]);

            const currentlyPaid = Number(paidRows[0].total_paid);
            const remainingAllocation = Math.max(0, allocatedAmount - currentlyPaid);

            if (allocatedAmount > 0 && paid > remainingAllocation) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: `Payment exceeds remaining engineer budget! Your allocated budget is ₹${allocatedAmount.toLocaleString()}, already disbursed ₹${currentlyPaid.toLocaleString()}, remaining balance is ₹${remainingAllocation.toLocaleString()}. Attempted payment: ₹${paid.toLocaleString()}.`
                });
            }

            const paymentCode = await generatePaymentCode(connection);
            const effectivePaymentDate = payment_date || new Date().toISOString().split("T")[0];
            const effectivePeriod = salary_period || `${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`;

            const [result] = await connection.query(`
                INSERT INTO worker_payments (
                    payment_code,
                    worker_id,
                    worker_name,
                    engineer_id,
                    project_id,
                    payment_date,
                    salary_period,
                    working_days,
                    daily_wage,
                    overtime_amount,
                    deductions,
                    gross_amount,
                    net_amount,
                    amount_paid,
                    remaining_amount,
                    payment_status,
                    payment_method,
                    reference_number,
                    remarks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                paymentCode,
                worker.id,
                worker.name,
                effectiveEngineerId,
                effectiveProjectId,
                effectivePaymentDate,
                effectivePeriod,
                days,
                wage,
                overtime,
                deduct,
                gross,
                net,
                paid,
                remaining,
                paymentStatus,
                payment_method || worker.payment_method || "Cash",
                reference_number || null,
                remarks || null
            ]);

            // Update worker's latest payment status
            await connection.query(
                "UPDATE workers SET payment_status = ? WHERE id = ?",
                [paymentStatus, worker.id]
            );

            await connection.commit();

            const [createdRows] = await db.query(`
                SELECT p.*, w.name AS worker_name, e.full_name AS engineer_name, pr.name AS project_name
                FROM worker_payments p
                JOIN workers w ON w.id = p.worker_id
                JOIN engineers e ON e.id = p.engineer_id
                JOIN projects pr ON pr.id = p.project_id
                WHERE p.id = ?
            `, [result.insertId]);

            res.status(201).json({
                success: true,
                message: `Payment of ₹${paid.toLocaleString()} recorded for ${worker.name} (Code: ${paymentCode}).`,
                payment: createdRows[0]
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Record worker payment error:", error);
        res.status(500).json({ success: false, error: "Failed to record payment." });
    }
});

// ======================================================================
// 3. GET PAYMENT SUMMARY
// ======================================================================
router.get("/summary", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        let whereClause = "";
        const params = [];
        if (scope.isEngineer && scope.engineer) {
            whereClause = "WHERE engineer_id = ?";
            params.push(scope.engineer.id);
        }

        const [totals] = await db.query(`
            SELECT 
                COALESCE(SUM(amount_paid), 0) AS total_paid,
                COALESCE(SUM(remaining_amount), 0) AS total_pending,
                COUNT(*) AS total_transactions,
                COUNT(DISTINCT worker_id) AS distinct_workers_paid
            FROM worker_payments
            ${whereClause}
        `, params);

        res.json({
            success: true,
            summary: totals[0]
        });
    } catch (error) {
        console.error("Get payment summary error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch payment summary." });
    }
});

module.exports = router;

