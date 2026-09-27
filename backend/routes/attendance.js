// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKER ATTENDANCE ROUTER (INTEGRATED & SCOPED)
// ======================================================================

const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");
const { getAuthScope } = require("../utils/scopeHelper");

const router = express.Router();
router.use(authenticateToken);

// ================= GET ATTENDANCE =================
router.get("/", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        let query = `
            SELECT
                a.id,
                a.date,
                a.worker_id,
                a.worker_name,
                w.worker_code,
                w.trade AS worker_trade,
                a.project_id,
                p.name AS project_name,
                a.engineer_id,
                e.full_name AS engineer_name,
                a.status,
                a.check_in,
                a.check_out,
                a.working_hours,
                a.remarks,
                a.created_at
            FROM attendance a
            LEFT JOIN workers w ON w.id = a.worker_id
            LEFT JOIN projects p ON p.id = a.project_id
            LEFT JOIN engineers e ON e.id = a.engineer_id
        `;

        const params = [];
        if (scope.isEngineer) {
            if (scope.projectId) {
                query += ` WHERE (a.project_id = ? OR a.engineer_id = ?)`;
                params.push(scope.projectId, scope.engineer ? scope.engineer.id : 0);
            } else if (scope.engineer) {
                query += ` WHERE a.engineer_id = ?`;
                params.push(scope.engineer.id);
            } else {
                return res.json({ success: true, count: 0, attendance: [] });
            }
        }

        query += ` ORDER BY a.date DESC, a.id DESC`;

        const [attendance] = await db.query(query, params);

        res.json({
            success: true,
            count: attendance.length,
            attendance
        });
    } catch (error) {
        console.error("Get attendance error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch attendance."
        });
    }
});


// ================= SAVE ATTENDANCE =================
router.post("/", async (req, res) => {
    try {
        const scope = await getAuthScope(req);
        const { date, records } = req.body;

        if (!date || !Array.isArray(records)) {
            return res.status(400).json({
                success: false,
                error: "Date and attendance records are required."
            });
        }

        const effectiveProjectId = scope.isEngineer ? scope.projectId : (req.body.project_id || null);
        const effectiveEngineerId = scope.isEngineer ? (scope.engineer ? scope.engineer.id : null) : (req.body.engineer_id || null);

        // Remove existing attendance for this date scoped to project if engineer
        if (scope.isEngineer && effectiveProjectId) {
            await db.query(
                `DELETE FROM attendance WHERE date = ? AND (project_id = ? OR worker_id IN (SELECT id FROM workers WHERE project_id = ?))`,
                [date, effectiveProjectId, effectiveProjectId]
            );
        } else {
            await db.query(
                `DELETE FROM attendance WHERE date = ?`,
                [date]
            );
        }

        // Insert new attendance records
        for (const record of records) {
            if (!record.worker_id || !record.worker_name || !record.status) {
                continue;
            }

            const checkIn = record.check_in || (record.status === "Present" ? "09:00" : null);
            const checkOut = record.check_out || (record.status === "Present" ? "18:00" : null);
            const workingHours = record.working_hours !== undefined ? Number(record.working_hours) : (record.status === "Present" ? 9 : (record.status === "Half Day" ? 4.5 : 0));

            await db.query(`
                INSERT INTO attendance
                (
                    date,
                    worker_id,
                    worker_name,
                    project_id,
                    engineer_id,
                    status,
                    check_in,
                    check_out,
                    working_hours,
                    remarks
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                date,
                record.worker_id,
                record.worker_name,
                effectiveProjectId || record.project_id || null,
                effectiveEngineerId || record.engineer_id || null,
                record.status,
                checkIn,
                checkOut,
                workingHours,
                record.remarks || null
            ]);
        }

        // Return saved attendance
        const [attendance] = await db.query(`
            SELECT
                id,
                date,
                worker_id,
                worker_name,
                project_id,
                engineer_id,
                status,
                check_in,
                check_out,
                working_hours,
                remarks,
                created_at
            FROM attendance
            WHERE date = ?
            ORDER BY id DESC
        `, [date]);

        res.status(201).json({
            success: true,
            message: "Attendance saved successfully.",
            attendance
        });

    } catch (error) {
        console.error("Save attendance error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to save attendance."
        });
    }
});

module.exports = router;