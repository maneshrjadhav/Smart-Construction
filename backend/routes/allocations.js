// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// ENGINEER ALLOCATIONS ROUTER (PROJECT BUDGET -> ENGINEER ALLOCATION)
// ======================================================================

const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { getAuthScope } = require("../utils/scopeHelper");

const router = express.Router();
router.use(authenticateToken);

// ======================================================================
// 1. GET ALLOCATIONS (SCOPED: ADMIN SEES ALL, ENGINEER SEES OWN)
// ======================================================================
router.get("/", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        let query = `
            SELECT 
                a.id,
                a.project_id,
                p.name AS project_name,
                p.project_code,
                p.budget AS project_total_budget,
                a.engineer_id,
                e.full_name AS engineer_name,
                e.engineer_code,
                a.allocated_amount,
                a.amount_paid_to_engineer,
                a.notes,
                a.created_at,
                a.updated_at,
                COALESCE((
                    SELECT SUM(amount_paid) 
                    FROM worker_payments 
                    WHERE engineer_id = a.engineer_id AND project_id = a.project_id
                ), 0) AS total_paid_to_workers,
                (
                    a.allocated_amount - COALESCE((
                        SELECT SUM(amount_paid) 
                        FROM worker_payments 
                        WHERE engineer_id = a.engineer_id AND project_id = a.project_id
                    ), 0)
                ) AS remaining_allocation_balance
            FROM engineer_allocations a
            JOIN projects p ON p.id = a.project_id
            JOIN engineers e ON e.id = a.engineer_id
        `;

        const params = [];
        if (scope.isEngineer) {
            if (scope.engineer) {
                query += ` WHERE a.engineer_id = ?`;
                params.push(scope.engineer.id);
            } else {
                return res.json({ success: true, count: 0, allocations: [] });
            }
        }

        query += ` ORDER BY a.id DESC`;

        const [allocations] = await db.query(query, params);

        res.json({
            success: true,
            count: allocations.length,
            allocations
        });
    } catch (error) {
        console.error("Get allocations error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch allocations." });
    }
});

// ======================================================================
// 2. CREATE ALLOCATION (ADMINISTRATOR ONLY)
// ======================================================================
router.post("/", requireRole(["Administrator", "Admin"]), async (req, res) => {
    try {
        const { project_id, engineer_id, allocated_amount, amount_paid_to_engineer, notes } = req.body;

        if (!project_id || !engineer_id || allocated_amount === undefined) {
            return res.status(400).json({
                success: false,
                error: "Project, Engineer, and Allocated Amount are required."
            });
        }

        // Verify project existence and budget
        const [projRows] = await db.query("SELECT id, name, budget FROM projects WHERE id = ?", [project_id]);
        if (projRows.length === 0) {
            return res.status(404).json({ success: false, error: "Project not found." });
        }
        const project = projRows[0];

        // Check if allocation already exists for this engineer on this project
        const [existing] = await db.query(
            "SELECT id, allocated_amount FROM engineer_allocations WHERE project_id = ? AND engineer_id = ?",
            [project_id, engineer_id]
        );

        if (existing.length > 0) {
            // Update existing allocation
            const newAlloc = Number(allocated_amount);
            const newPaid = amount_paid_to_engineer !== undefined ? Number(amount_paid_to_engineer) : newAlloc;

            await db.query(`
                UPDATE engineer_allocations
                SET allocated_amount = ?, amount_paid_to_engineer = ?, notes = ?, updated_at = NOW()
                WHERE id = ?
            `, [newAlloc, newPaid, notes || null, existing[0].id]);

            return res.json({
                success: true,
                message: "Engineer allocation updated successfully.",
                allocation_id: existing[0].id
            });
        }

        const [result] = await db.query(`
            INSERT INTO engineer_allocations (
                project_id, engineer_id, allocated_amount, amount_paid_to_engineer, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            project_id,
            engineer_id,
            Number(allocated_amount),
            amount_paid_to_engineer !== undefined ? Number(amount_paid_to_engineer) : Number(allocated_amount),
            notes || null,
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: `Budget allocation of ₹${allocated_amount} assigned to engineer successfully.`,
            allocation_id: result.insertId
        });
    } catch (error) {
        console.error("Create allocation error:", error);
        res.status(500).json({ success: false, error: "Failed to record allocation." });
    }
});

// ======================================================================
// 3. UPDATE ALLOCATION (ADMINISTRATOR ONLY)
// ======================================================================
router.put("/:id", requireRole(["Administrator", "Admin"]), async (req, res) => {
    try {
        const { allocated_amount, amount_paid_to_engineer, notes } = req.body;
        const [existing] = await db.query("SELECT * FROM engineer_allocations WHERE id = ?", [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: "Allocation not found." });
        }

        await db.query(`
            UPDATE engineer_allocations SET
                allocated_amount = ?,
                amount_paid_to_engineer = ?,
                notes = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [
            allocated_amount !== undefined ? Number(allocated_amount) : existing[0].allocated_amount,
            amount_paid_to_engineer !== undefined ? Number(amount_paid_to_engineer) : existing[0].amount_paid_to_engineer,
            notes !== undefined ? notes : existing[0].notes,
            req.params.id
        ]);

        res.json({ success: true, message: "Allocation updated successfully." });
    } catch (error) {
        console.error("Update allocation error:", error);
        res.status(500).json({ success: false, error: "Failed to update allocation." });
    }
});

module.exports = router;

