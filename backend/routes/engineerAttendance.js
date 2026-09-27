// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// ENGINEER ATTENDANCE ROUTER (ROLE-SCOPED & ENFORCED)
// ======================================================================

const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");
const { getAuthScope } = require("../utils/scopeHelper");

const router = express.Router();
router.use(authenticateToken);

/**
 * 1. GET /api/engineer-attendance
 * - Administrator: sees all engineers' attendance with multi-filters and summary counts.
 * - Engineer: sees ONLY their own attendance history.
 * - Worker: redirected/scoped or returns assigned engineer's attendance.
 */
router.get("/", async (req, res) => {
    try {
        const scope = await getAuthScope(req);
        if (!scope.isAuthenticated) {
            return res.status(401).json({ success: false, error: "Authentication required." });
        }

        const { engineer_id, project_id, status, date, from_date, to_date } = req.query;

        let query = `
            SELECT 
                ea.id,
                ea.engineer_id,
                ea.project_id,
                ea.date,
                ea.status,
                ea.check_in,
                ea.check_out,
                ea.working_hours,
                ea.remarks,
                ea.created_at,
                ea.updated_at,
                e.full_name AS engineer_name,
                e.engineer_code,
                e.phone AS engineer_phone,
                e.designation AS engineer_designation,
                p.name AS project_name,
                p.project_code
            FROM engineer_attendance ea
            JOIN engineers e ON e.id = ea.engineer_id
            LEFT JOIN projects p ON p.id = ea.project_id
            WHERE 1=1
        `;

        const params = [];

        // Scope enforcement
        if (scope.isEngineer) {
            if (!scope.engineer) {
                return res.json({ success: true, count: 0, attendance: [], summary: {} });
            }
            query += ` AND ea.engineer_id = ?`;
            params.push(scope.engineer.id);
        } else if (scope.isWorker) {
            if (!scope.worker || !scope.worker.engineer_id) {
                return res.json({ success: true, count: 0, attendance: [], summary: {} });
            }
            query += ` AND ea.engineer_id = ?`;
            params.push(scope.worker.engineer_id);
        } else if (scope.isAdmin) {
            // Optional admin filters
            if (engineer_id) {
                query += ` AND ea.engineer_id = ?`;
                params.push(Number(engineer_id));
            }
            if (project_id) {
                query += ` AND ea.project_id = ?`;
                params.push(Number(project_id));
            }
        }

        if (status) {
            query += ` AND ea.status = ?`;
            params.push(status);
        }

        if (date) {
            query += ` AND ea.date = ?`;
            params.push(date);
        }

        if (from_date) {
            query += ` AND ea.date >= ?`;
            params.push(from_date);
        }

        if (to_date) {
            query += ` AND ea.date <= ?`;
            params.push(to_date);
        }

        query += ` ORDER BY ea.date DESC, ea.id DESC`;

        const [rows] = await db.query(query, params);

        // Compute summary counts
        const summary = {
            total: rows.length,
            present: rows.filter(r => r.status === "Present").length,
            halfDay: rows.filter(r => r.status === "Half Day").length,
            absent: rows.filter(r => r.status === "Absent").length,
            leave: rows.filter(r => r.status === "Leave").length,
            holiday: rows.filter(r => r.status === "Holiday").length
        };

        res.json({
            success: true,
            count: rows.length,
            summary,
            attendance: rows
        });
    } catch (error) {
        console.error("GET engineer attendance error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch engineer attendance records." });
    }
});

/**
 * 2. GET /api/engineer-attendance/today
 * Returns today's attendance record for the authenticated engineer.
 */
router.get("/today", async (req, res) => {
    try {
        const scope = await getAuthScope(req);
        if (!scope.isEngineer || !scope.engineer) {
            return res.status(403).json({ success: false, error: "Only Site Engineers can query own today status." });
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const [rows] = await db.query(`
            SELECT ea.*, p.name AS project_name
            FROM engineer_attendance ea
            LEFT JOIN projects p ON p.id = ea.project_id
            WHERE ea.engineer_id = ? AND ea.date = ?
            LIMIT 1
        `, [scope.engineer.id, todayStr]);

        if (rows.length > 0) {
            res.json({ success: true, marked: true, record: rows[0] });
        } else {
            res.json({
                success: true,
                marked: false,
                record: {
                    date: todayStr,
                    status: "Not Marked",
                    check_in: null,
                    check_out: null,
                    working_hours: null
                }
            });
        }
    } catch (error) {
        console.error("GET today engineer attendance error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch today's attendance." });
    }
});

/**
 * 3. POST /api/engineer-attendance
 * - Engineer marks their own attendance for a date.
 * - Admin can perform correction workflow.
 */
router.post("/", async (req, res) => {
    try {
        const scope = await getAuthScope(req);
        if (!scope.isAuthenticated) {
            return res.status(401).json({ success: false, error: "Authentication required." });
        }

        const { date, status, check_in, check_out, working_hours, remarks, engineer_id } = req.body;

        const effectiveDate = date || new Date().toISOString().split("T")[0];
        const effectiveStatus = status || "Present";

        let targetEngineerId;
        let targetProjectId;

        if (scope.isEngineer) {
            if (!scope.engineer) {
                return res.status(400).json({ success: false, error: "No active engineer profile found." });
            }
            targetEngineerId = scope.engineer.id;
            targetProjectId = scope.projectId || scope.engineer.project_id || null;
        } else if (scope.isAdmin) {
            if (!engineer_id) {
                return res.status(400).json({ success: false, error: "Engineer ID required for administrator action." });
            }
            targetEngineerId = Number(engineer_id);
            const [engRows] = await db.query("SELECT project_id FROM engineers WHERE id = ? LIMIT 1", [targetEngineerId]);
            if (engRows.length === 0) {
                return res.status(404).json({ success: false, error: "Engineer not found." });
            }
            targetProjectId = engRows[0].project_id || null;
        } else {
            return res.status(403).json({ success: false, error: "Workers cannot mark engineer attendance." });
        }

        // Calculate hours if check_in and check_out provided
        let calcHours = working_hours !== undefined && working_hours !== null ? Number(working_hours) : null;
        if (calcHours === null && check_in && check_out) {
            const [inH, inM] = check_in.split(":").map(Number);
            const [outH, outM] = check_out.split(":").map(Number);
            if (!isNaN(inH) && !isNaN(outH)) {
                const diffMin = (outH * 60 + (outM || 0)) - (inH * 60 + (inM || 0));
                calcHours = Math.max(0, Number((diffMin / 60).toFixed(2)));
            }
        }
        if (calcHours === null) {
            calcHours = effectiveStatus === "Present" ? 8.0 : (effectiveStatus === "Half Day" ? 4.5 : 0.0);
        }

        await db.query(`
            INSERT INTO engineer_attendance (
                engineer_id, project_id, date, status, check_in, check_out, working_hours, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                project_id = VALUES(project_id),
                status = VALUES(status),
                check_in = VALUES(check_in),
                check_out = VALUES(check_out),
                working_hours = VALUES(working_hours),
                remarks = VALUES(remarks)
        `, [
            targetEngineerId,
            targetProjectId,
            effectiveDate,
            effectiveStatus,
            check_in || null,
            check_out || null,
            calcHours,
            remarks || null
        ]);

        const [updatedRows] = await db.query(`
            SELECT ea.*, e.full_name AS engineer_name, e.engineer_code, p.name AS project_name
            FROM engineer_attendance ea
            JOIN engineers e ON e.id = ea.engineer_id
            LEFT JOIN projects p ON p.id = ea.project_id
            WHERE ea.engineer_id = ? AND ea.date = ?
            LIMIT 1
        `, [targetEngineerId, effectiveDate]);

        res.json({
            success: true,
            message: `Attendance marked as ${effectiveStatus} for ${effectiveDate}.`,
            record: updatedRows[0]
        });
    } catch (error) {
        console.error("POST engineer attendance error:", error);
        res.status(500).json({ success: false, error: "Failed to record engineer attendance." });
    }
});

module.exports = router;

