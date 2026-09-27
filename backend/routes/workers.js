// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// WORKFORCE & WORKER MANAGEMENT ROUTER
// ======================================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");
const { getAuthScope } = require("../utils/scopeHelper");
const { sendWorkerCredentials } = require("../services/smsService");

const router = express.Router();
router.use(authenticateToken);

/**
 * Generate sequential, unique Worker ID (WRK-001, WRK-002, ...)
 */
async function generateWorkerCode(connection) {
    const [rows] = await connection.query(`
        SELECT worker_code 
        FROM workers 
        WHERE worker_code LIKE 'WRK-%'
    `);

    let maxNum = 0;
    for (const r of rows) {
        if (!r.worker_code) continue;
        const match = String(r.worker_code).match(/WRK-(\d+)/i);
        if (match) {
            const val = parseInt(match[1], 10);
            if (!isNaN(val) && val > maxNum) maxNum = val;
        }
    }
    const nextNum = maxNum + 1;
    return `WRK-${String(nextNum).padStart(3, "0")}`;
}

/**
 * Generate cryptographically secure temporary password
 */
function generateSecureTemporaryPassword() {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%*";

    const chars = [
        uppercase[crypto.randomInt(0, uppercase.length)],
        lowercase[crypto.randomInt(0, lowercase.length)],
        numbers[crypto.randomInt(0, numbers.length)],
        symbols[crypto.randomInt(0, symbols.length)],
    ];

    const allChars = uppercase + lowercase + numbers + symbols;
    const totalLength = 10;
    while (chars.length < totalLength) {
        chars.push(allChars[crypto.randomInt(0, allChars.length)]);
    }

    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
}

// ======================================================================
// 1. GET ALL WORKERS (SCOPED)
// ======================================================================
router.get("/", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        let query = `
            SELECT 
                w.id,
                w.worker_code,
                w.name,
                w.profile_photo,
                w.dob,
                w.gender,
                w.phone,
                w.alternate_phone,
                w.email,
                w.address,
                w.emergency_contact_name,
                w.emergency_contact_phone,
                w.blood_group,
                w.worker_type,
                w.trade,
                w.role,
                w.designation,
                w.joining_date,
                w.employment_type,
                w.experience,
                w.previous_employer,
                w.project_id,
                p.name AS project_name,
                p.project_code,
                w.engineer_id,
                e.full_name AS engineer_name,
                e.engineer_code,
                w.work_area,
                w.shift,
                w.assignment_date,
                w.assignment_status,
                w.wage_type,
                w.daily_wage,
                w.salary,
                w.overtime_rate,
                w.overtime_eligible,
                w.payment_method,
                w.bank_name,
                w.account_number,
                w.ifsc_code,
                w.upi_id,
                w.status,
                w.payment_status,
                w.created_at,
                COALESCE((SELECT SUM(amount_paid) FROM worker_payments WHERE worker_id = w.id), 0) AS total_paid,
                COALESCE((SELECT SUM(remaining_amount) FROM worker_payments WHERE worker_id = w.id), 0) AS pending_payment
            FROM workers w
            LEFT JOIN projects p ON p.id = w.project_id
            LEFT JOIN engineers e ON e.id = w.engineer_id
        `;

        const params = [];

        // Scoping: Engineer can ONLY see workers assigned to their project or supervised by them
        if (scope.isEngineer) {
            if (scope.projectId) {
                query += ` WHERE (w.project_id = ? OR w.engineer_id = ?)`;
                params.push(scope.projectId, scope.engineer ? scope.engineer.id : 0);
            } else if (scope.engineer) {
                query += ` WHERE w.engineer_id = ?`;
                params.push(scope.engineer.id);
            } else {
                return res.json({ success: true, count: 0, workers: [] });
            }
        }

        query += ` ORDER BY w.id DESC`;

        const [workers] = await db.query(query, params);

        res.json({
            success: true,
            count: workers.length,
            workers
        });
    } catch (error) {
        console.error("Get workers error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch workers roster."
        });
    }
});

// ======================================================================
// 2. ADD WORKER (STRICTLY ENGINEER ONLY)
// ======================================================================
router.post("/", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        // REQUIREMENT: The "Add Worker" option must be available ONLY to Engineers.
        // Administrator must NOT have the Add Worker option / permission.
        if (!scope.isEngineer) {
            return res.status(403).json({
                success: false,
                error: "Access Denied: Only Site Engineers can add workers to the workforce."
            });
        }

        if (!scope.engineer || !scope.projectId) {
            return res.status(400).json({
                success: false,
                error: "You are not assigned to an active project. Contact an Administrator to assign your project before adding workers."
            });
        }

        const {
            name,
            profile_photo,
            dob,
            gender,
            phone,
            alternate_phone,
            email,
            address,
            emergency_contact_name,
            emergency_contact_phone,
            blood_group,
            worker_type,
            trade,
            role,
            designation,
            joining_date,
            employment_type,
            experience,
            previous_employer,
            work_area,
            shift,
            wage_type,
            daily_wage,
            salary,
            overtime_rate,
            overtime_eligible,
            payment_method,
            bank_name,
            account_number,
            ifsc_code,
            upi_id,
            status
        } = req.body;

        if (!name || !phone || daily_wage === undefined || daily_wage === null) {
            return res.status(400).json({
                success: false,
                error: "Worker Full Name, Mobile Number, and Daily Wage are required."
            });
        }

        const assignedProjectId = scope.projectId;
        const assignedEngineerId = scope.engineer.id;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const workerCode = await generateWorkerCode(connection);

            const effectiveTrade = trade || role || "Other";
            const effectiveRole = role || trade || "Worker";
            const effectiveJoiningDate = joining_date || new Date().toISOString().split("T")[0];

            // Generate cryptographically secure temporary password
            const temporaryPassword = generateSecureTemporaryPassword();
            const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, 10);
            const cleanCode = workerCode.toLowerCase().replace(/[^a-z0-9]/g, "");
            const workerEmail = email && email.trim() ? email.trim().toLowerCase() : `${cleanCode}@smartbuild.local`;

            const [userResult] = await connection.query(`
                INSERT INTO users (
                    name, email, password, role, status, mfa_enabled, must_change_password
                ) VALUES (?, ?, ?, 'Worker', 'Active', 0, 1)
            `, [
                name.trim(),
                workerEmail,
                temporaryPasswordHash
            ]);
            const newUserId = userResult.insertId;

            const [result] = await connection.query(`
                INSERT INTO workers (
                    worker_code,
                    user_id,
                    name,
                    profile_photo,
                    dob,
                    gender,
                    phone,
                    alternate_phone,
                    email,
                    address,
                    emergency_contact_name,
                    emergency_contact_phone,
                    blood_group,
                    worker_type,
                    trade,
                    role,
                    designation,
                    joining_date,
                    employment_type,
                    experience,
                    previous_employer,
                    project_id,
                    engineer_id,
                    work_area,
                    shift,
                    assignment_date,
                    assignment_status,
                    wage_type,
                    daily_wage,
                    salary,
                    overtime_rate,
                    overtime_eligible,
                    payment_method,
                    bank_name,
                    account_number,
                    ifsc_code,
                    upi_id,
                    status,
                    payment_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                workerCode,
                newUserId,
                name.trim(),
                profile_photo || null,
                dob || null,
                gender || "Male",
                phone.trim(),
                alternate_phone || null,
                email || null,
                address || null,
                emergency_contact_name || null,
                emergency_contact_phone || null,
                blood_group || null,
                worker_type || "Skilled",
                effectiveTrade,
                effectiveRole,
                designation || effectiveRole,
                effectiveJoiningDate,
                employment_type || "Daily Wage",
                experience || null,
                previous_employer || null,
                assignedProjectId,
                assignedEngineerId,
                work_area || "Site Main",
                shift || "General",
                effectiveJoiningDate,
                "Active",
                wage_type || "Daily",
                Number(daily_wage) || 0,
                Number(salary) || (Number(daily_wage) * 26),
                Number(overtime_rate) || 0,
                overtime_eligible !== undefined ? (overtime_eligible ? 1 : 0) : 1,
                payment_method || "Cash",
                bank_name || null,
                account_number || null,
                ifsc_code || null,
                upi_id || null,
                status || "Active",
                "Paid"
            ]);

            const newWorkerId = result.insertId;

            // Automatically record baseline Work History
            await connection.query(`
                INSERT INTO worker_work_history (
                    worker_id,
                    project_id,
                    engineer_id,
                    work_role,
                    work_area,
                    shift,
                    start_date,
                    status,
                    remarks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', 'Initial project enrollment by site engineer')
            `, [
                newWorkerId,
                assignedProjectId,
                assignedEngineerId,
                effectiveTrade,
                work_area || "Site Main",
                shift || "General",
                effectiveJoiningDate
            ]);

            await connection.commit();

            const [createdRows] = await db.query(`
                SELECT 
                    w.*,
                    p.name AS project_name,
                    p.project_code,
                    e.full_name AS engineer_name,
                    e.engineer_code
                FROM workers w
                LEFT JOIN projects p ON p.id = w.project_id
                LEFT JOIN engineers e ON e.id = w.engineer_id
                WHERE w.id = ?
            `, [newWorkerId]);

            const createdWorker = createdRows[0];

            // Send worker credentials via SMS service / safe simulation
            const smsResult = await sendWorkerCredentials({
                phone: phone.trim(),
                workerId: workerCode,
                name: name.trim(),
                temporaryPassword,
                projectName: createdWorker?.project_name || "Assigned Project",
                engineerName: createdWorker?.engineer_name || scope.engineer?.full_name || "Site Engineer"
            });

            res.status(201).json({
                success: true,
                message: `Worker ${workerCode} enrolled and assigned to your project successfully.`,
                worker: createdWorker,
                credentials: {
                    workerId: workerCode,
                    identifier: workerCode,
                    name: name.trim(),
                    phone: phone.trim(),
                    email: workerEmail,
                    temporaryPassword,
                    projectName: createdWorker?.project_name || "Assigned Project",
                    assignedEngineer: createdWorker?.engineer_name || scope.engineer?.full_name || "Site Engineer",
                    smsStatus: smsResult
                }
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Add worker error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to add worker. Please verify details."
        });
    }
});

// ======================================================================
// 2.5 WORKER SELF-SERVICE ENDPOINTS (/me)
// ======================================================================

/**
 * Helper to resolve the authenticated worker's database ID
 */
async function resolveCurrentWorker(req) {
    if (!req.user) return null;
    if (req.user.workerProfileId) {
        const [rows] = await db.query("SELECT * FROM workers WHERE id = ? LIMIT 1", [req.user.workerProfileId]);
        if (rows.length > 0) return rows[0];
    }
    const [rows] = await db.query("SELECT * FROM workers WHERE user_id = ? LIMIT 1", [req.user.id]);
    return rows.length > 0 ? rows[0] : null;
}

// GET /api/workers/me (Worker's own complete profile and dashboard data)
router.get("/me", async (req, res) => {
    try {
        const worker = await resolveCurrentWorker(req);
        if (!worker) {
            return res.status(404).json({
                success: false,
                error: "Worker profile not found for the authenticated user."
            });
        }

        // Fetch detailed profile with project and engineer
        const [fullRows] = await db.query(`
            SELECT 
                w.*,
                p.name AS project_name,
                p.project_code,
                p.location AS project_location,
                e.full_name AS engineer_name,
                e.engineer_code,
                e.phone AS engineer_phone,
                e.email AS engineer_email
            FROM workers w
            LEFT JOIN projects p ON p.id = w.project_id
            LEFT JOIN engineers e ON e.id = w.engineer_id
            WHERE w.id = ?
        `, [worker.id]);

        const workerProfile = fullRows[0] || worker;

        // Fetch related relations in parallel
        const [
            [workHistory],
            [attendanceHistory],
            [paymentHistory],
            [documents]
        ] = await Promise.all([
            db.query(`
                SELECT h.*, p.name AS project_name, e.full_name AS engineer_name
                FROM worker_work_history h
                LEFT JOIN projects p ON p.id = h.project_id
                LEFT JOIN engineers e ON e.id = h.engineer_id
                WHERE h.worker_id = ?
                ORDER BY h.start_date DESC, h.id DESC
            `, [worker.id]),

            db.query(`
                SELECT a.*, p.name AS project_name
                FROM attendance a
                LEFT JOIN projects p ON p.id = a.project_id
                WHERE a.worker_id = ?
                ORDER BY a.date DESC
                LIMIT 60
            `, [worker.id]),

            db.query(`
                SELECT p.*, e.full_name AS engineer_name, pr.name AS project_name
                FROM worker_payments p
                LEFT JOIN engineers e ON e.id = p.engineer_id
                LEFT JOIN projects pr ON pr.id = p.project_id
                WHERE p.worker_id = ?
                ORDER BY p.payment_date DESC, p.id DESC
            `, [worker.id]),

            db.query(`
                SELECT * 
                FROM worker_documents
                WHERE worker_id = ?
                ORDER BY id DESC
            `, [worker.id])
        ]);

        // Calculate document expiry alerts
        const todayStr = new Date().toISOString().split("T")[0];
        const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const enrichedDocs = documents.map(doc => {
            let status = doc.status || "Valid";
            if (doc.expiry_date) {
                const exp = String(doc.expiry_date).split("T")[0];
                if (exp < todayStr) status = "Expired";
                else if (exp <= thirtyDaysAhead) status = "Expiring Soon";
            }
            return { ...doc, computed_status: status };
        });

        // Compute payment summary
        const totalPaid = paymentHistory.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);
        const totalPending = paymentHistory.reduce((acc, p) => acc + Number(p.remaining_amount || 0), 0);

        // Compute monthly attendance & earnings
        const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
        const thisMonthAttendance = attendanceHistory.filter(a => String(a.date).startsWith(currentMonthPrefix));
        const daysPresent = thisMonthAttendance.filter(a => a.status === "Present").length;
        const daysHalfDay = thisMonthAttendance.filter(a => a.status === "Half Day").length;
        const effectiveDaysWorked = daysPresent + (daysHalfDay * 0.5);
        const dailyWage = Number(workerProfile.daily_wage || 0);
        const estimatedMonthEarnings = effectiveDaysWorked * dailyWage;

        // Today's attendance
        const todayRecord = attendanceHistory.find(a => String(a.date).split("T")[0] === todayStr) || null;

        // Fetch assigned site engineer's attendance records (Worker can only view their assigned engineer)
        let assignedEngineerAttendance = [];
        if (workerProfile.engineer_id) {
            const [engAtt] = await db.query(`
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
                    e.full_name AS engineer_name,
                    e.engineer_code,
                    p.name AS project_name
                FROM engineer_attendance ea
                JOIN engineers e ON e.id = ea.engineer_id
                LEFT JOIN projects p ON p.id = ea.project_id
                WHERE ea.engineer_id = ?
                ORDER BY ea.date DESC
                LIMIT 14
            `, [workerProfile.engineer_id]);
            assignedEngineerAttendance = engAtt;
        }

        res.json({
            success: true,
            worker: workerProfile,
            workHistory,
            attendanceHistory,
            paymentHistory,
            documents: enrichedDocs,
            assignedEngineerAttendance,
            summary: {
                totalPaid,
                totalPending,
                daysPresent,
                daysHalfDay,
                effectiveDaysWorked,
                dailyWage,
                estimatedMonthEarnings,
                todayAttendance: todayRecord ? {
                    status: todayRecord.status,
                    shift: todayRecord.shift,
                    workArea: todayRecord.work_area
                } : { status: "Not Marked", shift: workerProfile.shift || "General", workArea: workerProfile.work_area || "Site" }
            }
        });
    } catch (error) {
        console.error("Get worker self profile error:", error);
        res.status(500).json({ success: false, error: "Failed to load worker profile." });
    }
});

// GET /api/workers/me/attendance
router.get("/me/attendance", async (req, res) => {
    try {
        const worker = await resolveCurrentWorker(req);
        if (!worker) return res.status(404).json({ success: false, error: "Worker not found." });

        const [records] = await db.query(`
            SELECT a.*, p.name AS project_name
            FROM attendance a
            LEFT JOIN projects p ON p.id = a.project_id
            WHERE a.worker_id = ?
            ORDER BY a.date DESC
        `, [worker.id]);

        res.json({ success: true, count: records.length, attendance: records });
    } catch (error) {
        console.error("Worker attendance error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch attendance." });
    }
});

// GET /api/workers/me/payments
router.get("/me/payments", async (req, res) => {
    try {
        const worker = await resolveCurrentWorker(req);
        if (!worker) return res.status(404).json({ success: false, error: "Worker not found." });

        const [payments] = await db.query(`
            SELECT p.*, e.full_name AS engineer_name, pr.name AS project_name
            FROM worker_payments p
            LEFT JOIN engineers e ON e.id = p.engineer_id
            LEFT JOIN projects pr ON pr.id = p.project_id
            WHERE p.worker_id = ?
            ORDER BY p.payment_date DESC, p.id DESC
        `, [worker.id]);

        const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);
        const totalPending = payments.reduce((acc, p) => acc + Number(p.remaining_amount || 0), 0);

        res.json({ success: true, totalPaid, totalPending, count: payments.length, payments });
    } catch (error) {
        console.error("Worker payments error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch payment records." });
    }
});

// GET /api/workers/me/work-history
router.get("/me/work-history", async (req, res) => {
    try {
        const worker = await resolveCurrentWorker(req);
        if (!worker) return res.status(404).json({ success: false, error: "Worker not found." });

        const [history] = await db.query(`
            SELECT h.*, p.name AS project_name, e.full_name AS engineer_name
            FROM worker_work_history h
            LEFT JOIN projects p ON p.id = h.project_id
            LEFT JOIN engineers e ON e.id = h.engineer_id
            WHERE h.worker_id = ?
            ORDER BY h.start_date DESC, h.id DESC
        `, [worker.id]);

        res.json({ success: true, count: history.length, workHistory: history });
    } catch (error) {
        console.error("Worker work history error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch work history." });
    }
});

// GET /api/workers/me/documents
router.get("/me/documents", async (req, res) => {
    try {
        const worker = await resolveCurrentWorker(req);
        if (!worker) return res.status(404).json({ success: false, error: "Worker not found." });

        const [documents] = await db.query(`
            SELECT * FROM worker_documents
            WHERE worker_id = ?
            ORDER BY id DESC
        `, [worker.id]);

        res.json({ success: true, count: documents.length, documents });
    } catch (error) {
        console.error("Worker documents error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch documents." });
    }
});

// GET /api/workers/me/tasks
router.get("/me/tasks", async (req, res) => {
    try {
        const worker = await resolveCurrentWorker(req);
        if (!worker) return res.status(404).json({ success: false, error: "Worker not found." });

        let projectName = "";
        if (worker.project_id) {
            const [pRows] = await db.query("SELECT name FROM projects WHERE id = ?", [worker.project_id]);
            if (pRows.length > 0) projectName = pRows[0].name;
        }

        const [tasks] = await db.query(`
            SELECT t.* 
            FROM tasks t
            WHERE LOWER(t.assigned_to) LIKE LOWER(?)
               OR LOWER(t.assigned_to) LIKE LOWER(?)
               OR (t.project = ? AND t.project IS NOT NULL AND t.project != '')
               OR (? != '' AND LOWER(t.project) LIKE LOWER(?))
            ORDER BY 
                CASE 
                    WHEN t.status = 'In Progress' THEN 1 
                    WHEN t.status = 'Pending' THEN 2 
                    ELSE 3 
                END,
                t.due_date ASC, t.id DESC
        `, [
            `%${worker.name}%`,
            `%${worker.worker_code}%`,
            String(worker.project_id || ""),
            projectName,
            `%${projectName}%`
        ]);

        res.json({ success: true, count: tasks.length, tasks });
    } catch (error) {
        console.error("Worker tasks error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch assigned tasks." });
    }
});

// GET /api/workers/me/notifications
router.get("/me/notifications", async (req, res) => {
    try {
        const worker = await resolveCurrentWorker(req);
        if (!worker) return res.status(404).json({ success: false, error: "Worker not found." });

        const [
            [recentAtt],
            [recentPay],
            [docs],
            [engineerAtt],
            [projRows]
        ] = await Promise.all([
            db.query("SELECT * FROM attendance WHERE worker_id = ? ORDER BY date DESC LIMIT 5", [worker.id]),
            db.query("SELECT * FROM worker_payments WHERE worker_id = ? ORDER BY payment_date DESC LIMIT 5", [worker.id]),
            db.query("SELECT * FROM worker_documents WHERE worker_id = ?", [worker.id]),
            worker.engineer_id ? db.query("SELECT * FROM engineer_attendance WHERE engineer_id = ? ORDER BY date DESC LIMIT 3", [worker.engineer_id]) : [[]],
            worker.project_id ? db.query("SELECT * FROM projects WHERE id = ?", [worker.project_id]) : [[]]
        ]);

        const notifications = [];
        let notifId = 1;

        for (const p of recentPay) {
            notifications.push({
                id: `pay-${p.id || notifId++}`,
                category: "Payment",
                type: "success",
                title: `Payment Disbursed: ₹${Number(p.amount_paid || 0).toLocaleString("en-IN")}`,
                message: `Payment voucher ${p.payment_code || ""} for ${p.salary_period || "recent period"} has been processed via ${p.payment_method || "Cash"}.`,
                date: p.payment_date || p.created_at,
                read: false,
                link: "/worker/payments"
            });
        }

        for (const a of recentAtt) {
            const statusType = a.status === "Present" ? "success" : a.status === "Half Day" ? "warning" : "danger";
            const dateStr = String(a.date).split("T")[0];
            notifications.push({
                id: `att-${a.id || notifId++}`,
                category: "Attendance",
                type: statusType,
                title: `Attendance Recorded: ${a.status}`,
                message: `Your attendance for ${dateStr} was marked as ${a.status}${a.working_hours ? ` (${a.working_hours} hrs)` : ""}.`,
                date: a.date,
                read: true,
                link: "/worker/attendance"
            });
        }

        const todayStr = new Date().toISOString().split("T")[0];
        const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        for (const d of docs) {
            if (d.expiry_date) {
                const exp = String(d.expiry_date).split("T")[0];
                if (exp < todayStr) {
                    notifications.push({
                        id: `doc-exp-${d.id || notifId++}`,
                        category: "Document",
                        type: "danger",
                        title: `Document Expired: ${d.document_name}`,
                        message: `Your document "${d.document_name}" expired on ${exp}. Please contact your site engineer to renew it.`,
                        date: d.expiry_date,
                        read: false,
                        link: "/worker/documents"
                    });
                } else if (exp <= thirtyDaysAhead) {
                    notifications.push({
                        id: `doc-soon-${d.id || notifId++}`,
                        category: "Document",
                        type: "warning",
                        title: `Document Expiring Soon: ${d.document_name}`,
                        message: `Your document "${d.document_name}" will expire on ${exp}.`,
                        date: todayStr,
                        read: false,
                        link: "/worker/documents"
                    });
                }
            }
        }

        if (engineerAtt.length > 0) {
            const latestEng = engineerAtt[0];
            const engDate = String(latestEng.date).split("T")[0];
            if (engDate === todayStr && latestEng.status === "Present") {
                notifications.push({
                    id: `eng-${latestEng.id || notifId++}`,
                    category: "Site",
                    type: "info",
                    title: "Site Engineer On-Site Today",
                    message: `Supervising Engineer logged check-in at ${latestEng.check_in || "Site"}.`,
                    date: latestEng.date,
                    read: true,
                    link: "/worker/engineer"
                });
            }
        }

        if (projRows.length > 0) {
            const pr = projRows[0];
            notifications.push({
                id: `proj-${pr.id || notifId++}`,
                category: "Project",
                type: "info",
                title: `Active Site Assignment: ${pr.name}`,
                message: `You are assigned to ${pr.name} (${pr.project_code || ""}) at ${pr.location || "Site"}. Progress: ${pr.progress || 0}%.`,
                date: pr.created_at || todayStr,
                read: true,
                link: "/worker/project"
            });
        }

        notifications.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        res.json({ success: true, count: notifications.length, notifications });
    } catch (error) {
        console.error("Worker notifications error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch notifications." });
    }
});

// GET /api/workers/me/project
router.get("/me/project", async (req, res) => {
    try {
        const worker = await resolveCurrentWorker(req);
        if (!worker) return res.status(404).json({ success: false, error: "Worker not found." });

        if (!worker.project_id) {
            return res.json({
                success: true,
                project: null,
                message: "No project currently assigned to this worker."
            });
        }

        const [projRows] = await db.query(`
            SELECT 
                p.*,
                e.full_name AS engineer_name,
                e.engineer_code,
                e.phone AS engineer_phone,
                e.email AS engineer_email
            FROM projects p
            LEFT JOIN engineers e ON e.id = ?
            WHERE p.id = ?
        `, [worker.engineer_id || 0, worker.project_id]);

        if (projRows.length === 0) {
            return res.status(404).json({ success: false, error: "Project not found." });
        }

        const project = projRows[0];
        res.json({
            success: true,
            project: {
                ...project,
                workerTrade: worker.trade || worker.role,
                workerShift: worker.shift,
                workerArea: worker.work_area
            }
        });
    } catch (error) {
        console.error("Worker project error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch project details." });
    }
});

// GET /api/workers/me/engineer
router.get("/me/engineer", async (req, res) => {
    try {
        const worker = await resolveCurrentWorker(req);
        if (!worker) return res.status(404).json({ success: false, error: "Worker not found." });

        if (!worker.engineer_id) {
            return res.json({
                success: true,
                engineer: null,
                attendance: [],
                message: "No supervising engineer assigned."
            });
        }

        const [engRows] = await db.query(`
            SELECT 
                e.*,
                p.name AS project_name,
                p.project_code
            FROM engineers e
            LEFT JOIN projects p ON p.id = e.project_id
            WHERE e.id = ?
        `, [worker.engineer_id]);

        if (engRows.length === 0) {
            return res.status(404).json({ success: false, error: "Supervising engineer record not found." });
        }

        const engineer = engRows[0];

        const [attendance] = await db.query(`
            SELECT ea.*, p.name AS project_name
            FROM engineer_attendance ea
            LEFT JOIN projects p ON p.id = ea.project_id
            WHERE ea.engineer_id = ?
            ORDER BY ea.date DESC
            LIMIT 30
        `, [worker.engineer_id]);

        const todayStr = new Date().toISOString().split("T")[0];
        const todayRecord = attendance.find(a => String(a.date).split("T")[0] === todayStr) || null;

        res.json({
            success: true,
            engineer,
            todayStatus: todayRecord ? {
                status: todayRecord.status,
                check_in: todayRecord.check_in,
                check_out: todayRecord.check_out,
                working_hours: todayRecord.working_hours,
                remarks: todayRecord.remarks
            } : { status: "Not Marked", check_in: "--:--", check_out: "--:--" },
            attendance
        });
    } catch (error) {
        console.error("Worker engineer error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch supervising engineer information." });
    }
});

// ======================================================================
// 3. GET SINGLE WORKER DETAILS (COMPLETE PROFILE, HISTORY, PAYMENTS)
// ======================================================================
router.get("/:id", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        const [rows] = await db.query(`
            SELECT 
                w.*,
                p.name AS project_name,
                p.project_code,
                p.location AS project_location,
                e.full_name AS engineer_name,
                e.engineer_code,
                e.phone AS engineer_phone,
                e.email AS engineer_email
            FROM workers w
            LEFT JOIN projects p ON p.id = w.project_id
            LEFT JOIN engineers e ON e.id = w.engineer_id
            WHERE w.id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: "Worker record not found." });
        }

        const worker = rows[0];

        // Authorization check for Engineer
        if (scope.isEngineer) {
            const isAssigned = (scope.projectId && worker.project_id === scope.projectId) ||
                               (scope.engineer && worker.engineer_id === scope.engineer.id);
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    error: "Access Denied: This worker does not belong to your assigned project."
                });
            }
        }

        // Fetch related relations in parallel
        const [
            [workHistory],
            [attendanceHistory],
            [paymentHistory],
            [documents]
        ] = await Promise.all([
            db.query(`
                SELECT h.*, p.name AS project_name, e.full_name AS engineer_name
                FROM worker_work_history h
                LEFT JOIN projects p ON p.id = h.project_id
                LEFT JOIN engineers e ON e.id = h.engineer_id
                WHERE h.worker_id = ?
                ORDER BY h.start_date DESC, h.id DESC
            `, [worker.id]),

            db.query(`
                SELECT a.*, p.name AS project_name
                FROM attendance a
                LEFT JOIN projects p ON p.id = a.project_id
                WHERE a.worker_id = ?
                ORDER BY a.date DESC
                LIMIT 30
            `, [worker.id]),

            db.query(`
                SELECT p.*, e.full_name AS engineer_name, pr.name AS project_name
                FROM worker_payments p
                LEFT JOIN engineers e ON e.id = p.engineer_id
                LEFT JOIN projects pr ON pr.id = p.project_id
                WHERE p.worker_id = ?
                ORDER BY p.payment_date DESC, p.id DESC
            `, [worker.id]),

            db.query(`
                SELECT * 
                FROM worker_documents
                WHERE worker_id = ?
                ORDER BY id DESC
            `, [worker.id])
        ]);

        // Calculate document expiry alerts
        const todayStr = new Date().toISOString().split("T")[0];
        const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const enrichedDocs = documents.map(doc => {
            let status = doc.status || "Valid";
            if (doc.expiry_date) {
                const exp = String(doc.expiry_date).split("T")[0];
                if (exp < todayStr) status = "Expired";
                else if (exp <= thirtyDaysAhead) status = "Expiring Soon";
            }
            return { ...doc, computed_status: status };
        });

        // Compute payment summary
        const totalPaid = paymentHistory.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);
        const totalPending = paymentHistory.reduce((acc, p) => acc + Number(p.remaining_amount || 0), 0);

        res.json({
            success: true,
            worker: {
                ...worker,
                total_paid: totalPaid,
                pending_payment: totalPending,
                work_history: workHistory,
                attendance: attendanceHistory,
                payments: paymentHistory,
                documents: enrichedDocs
            }
        });
    } catch (error) {
        console.error("Get worker details error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch worker details." });
    }
});

// ======================================================================
// 4. UPDATE WORKER
// ======================================================================
router.put("/:id", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        const [existingRows] = await db.query("SELECT * FROM workers WHERE id = ?", [req.params.id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ success: false, error: "Worker not found." });
        }
        const current = existingRows[0];

        // Engineer can only edit workers within their assigned project
        if (scope.isEngineer) {
            const isAssigned = (scope.projectId && current.project_id === scope.projectId) ||
                               (scope.engineer && current.engineer_id === scope.engineer.id);
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    error: "Access Denied: You can only edit workers assigned to your project."
                });
            }
        }

        const b = req.body;
        const name = b.name !== undefined ? b.name : current.name;
        const phone = b.phone !== undefined ? b.phone : current.phone;
        const trade = b.trade !== undefined ? b.trade : current.trade;
        const role = b.role !== undefined ? b.role : current.role;
        const worker_type = b.worker_type !== undefined ? b.worker_type : current.worker_type;
        const designation = b.designation !== undefined ? b.designation : current.designation;
        const daily_wage = b.daily_wage !== undefined ? Number(b.daily_wage) : current.daily_wage;
        const salary = b.salary !== undefined ? Number(b.salary) : current.salary;
        const status = b.status !== undefined ? b.status : current.status;
        const shift = b.shift !== undefined ? b.shift : current.shift;
        const work_area = b.work_area !== undefined ? b.work_area : current.work_area;
        const project_id = (scope.isAdmin && b.project_id !== undefined) ? b.project_id : current.project_id;
        const engineer_id = (scope.isAdmin && b.engineer_id !== undefined) ? b.engineer_id : current.engineer_id;

        await db.query(`
            UPDATE workers SET
                name = ?,
                profile_photo = ?,
                dob = ?,
                gender = ?,
                phone = ?,
                alternate_phone = ?,
                email = ?,
                address = ?,
                emergency_contact_name = ?,
                emergency_contact_phone = ?,
                blood_group = ?,
                worker_type = ?,
                trade = ?,
                role = ?,
                designation = ?,
                employment_type = ?,
                experience = ?,
                previous_employer = ?,
                project_id = ?,
                engineer_id = ?,
                work_area = ?,
                shift = ?,
                wage_type = ?,
                daily_wage = ?,
                salary = ?,
                overtime_rate = ?,
                overtime_eligible = ?,
                payment_method = ?,
                bank_name = ?,
                account_number = ?,
                ifsc_code = ?,
                upi_id = ?,
                status = ?
            WHERE id = ?
        `, [
            name,
            b.profile_photo !== undefined ? b.profile_photo : current.profile_photo,
            b.dob !== undefined ? b.dob : current.dob,
            b.gender !== undefined ? b.gender : current.gender,
            phone,
            b.alternate_phone !== undefined ? b.alternate_phone : current.alternate_phone,
            b.email !== undefined ? b.email : current.email,
            b.address !== undefined ? b.address : current.address,
            b.emergency_contact_name !== undefined ? b.emergency_contact_name : current.emergency_contact_name,
            b.emergency_contact_phone !== undefined ? b.emergency_contact_phone : current.emergency_contact_phone,
            b.blood_group !== undefined ? b.blood_group : current.blood_group,
            worker_type,
            trade,
            role,
            designation,
            b.employment_type !== undefined ? b.employment_type : current.employment_type,
            b.experience !== undefined ? b.experience : current.experience,
            b.previous_employer !== undefined ? b.previous_employer : current.previous_employer,
            project_id,
            engineer_id,
            work_area,
            shift,
            b.wage_type !== undefined ? b.wage_type : current.wage_type,
            daily_wage,
            salary,
            b.overtime_rate !== undefined ? Number(b.overtime_rate) : current.overtime_rate,
            b.overtime_eligible !== undefined ? (b.overtime_eligible ? 1 : 0) : current.overtime_eligible,
            b.payment_method !== undefined ? b.payment_method : current.payment_method,
            b.bank_name !== undefined ? b.bank_name : current.bank_name,
            b.account_number !== undefined ? b.account_number : current.account_number,
            b.ifsc_code !== undefined ? b.ifsc_code : current.ifsc_code,
            b.upi_id !== undefined ? b.upi_id : current.upi_id,
            status,
            req.params.id
        ]);

        // If project changed, log in work history
        if (project_id && project_id !== current.project_id) {
            await db.query(`
                INSERT INTO worker_work_history (
                    worker_id, project_id, engineer_id, work_role, work_area, shift, start_date, status, remarks
                ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'Active', 'Project reassignment')
            `, [req.params.id, project_id, engineer_id, trade || role, work_area, shift]);
        }

        const [updatedRows] = await db.query("SELECT * FROM workers WHERE id = ?", [req.params.id]);

        res.json({
            success: true,
            message: "Worker profile updated successfully.",
            worker: updatedRows[0]
        });
    } catch (error) {
        console.error("Update worker error:", error);
        res.status(500).json({ success: false, error: "Failed to update worker." });
    }
});

// ======================================================================
// 5. DEACTIVATE / ARCHIVE WORKER (SOFT DELETE)
// ======================================================================
router.delete("/:id", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        const [existing] = await db.query("SELECT * FROM workers WHERE id = ?", [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: "Worker not found." });
        }

        if (scope.isEngineer) {
            const isAssigned = (scope.projectId && existing[0].project_id === scope.projectId) ||
                               (scope.engineer && existing[0].engineer_id === scope.engineer.id);
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    error: "Access Denied: You cannot modify a worker outside your project."
                });
            }
        }

        // Soft deactivation to preserve financial and attendance history
        await db.query(
            "UPDATE workers SET status = 'Inactive', assignment_status = 'Inactive' WHERE id = ?",
            [req.params.id]
        );

        res.json({
            success: true,
            message: "Worker has been deactivated and archived. Historical records preserved."
        });
    } catch (error) {
        console.error("Deactivate worker error:", error);
        res.status(500).json({ success: false, error: "Failed to deactivate worker." });
    }
});

// ======================================================================
// 6. WORKER DOCUMENTS (ADD, LIST, DELETE)
// ======================================================================
router.post("/:id/documents", async (req, res) => {
    try {
        const { document_name, document_type, issue_date, expiry_date, file_url, file_name } = req.body;
        if (!document_name || !document_type) {
            return res.status(400).json({ success: false, error: "Document Name and Type are required." });
        }

        const [result] = await db.query(`
            INSERT INTO worker_documents (
                worker_id, document_name, document_type, issue_date, expiry_date, file_url, file_name, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Valid')
        `, [
            req.params.id,
            document_name,
            document_type,
            issue_date || null,
            expiry_date || null,
            file_url || null,
            file_name || null
        ]);

        res.status(201).json({
            success: true,
            message: "Document uploaded successfully.",
            document_id: result.insertId
        });
    } catch (error) {
        console.error("Add document error:", error);
        res.status(500).json({ success: false, error: "Failed to upload document." });
    }
});

router.get("/:id/documents", async (req, res) => {
    try {
        const [docs] = await db.query(
            "SELECT * FROM worker_documents WHERE worker_id = ? ORDER BY id DESC",
            [req.params.id]
        );

        const todayStr = new Date().toISOString().split("T")[0];
        const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const enriched = docs.map(d => {
            let status = d.status || "Valid";
            if (d.expiry_date) {
                const exp = String(d.expiry_date).split("T")[0];
                if (exp < todayStr) status = "Expired";
                else if (exp <= thirtyDaysAhead) status = "Expiring Soon";
            }
            return { ...d, computed_status: status };
        });

        res.json({ success: true, count: enriched.length, documents: enriched });
    } catch (error) {
        console.error("Get documents error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch documents." });
    }
});

router.delete("/:id/documents/:docId", async (req, res) => {
    try {
        await db.query(
            "DELETE FROM worker_documents WHERE id = ? AND worker_id = ?",
            [req.params.docId, req.params.id]
        );
        res.json({ success: true, message: "Document removed." });
    } catch (error) {
        console.error("Delete document error:", error);
        res.status(500).json({ success: false, error: "Failed to remove document." });
    }
});

// ======================================================================
// 7. WORKER WORK HISTORY TIMELINE
// ======================================================================
router.get("/:id/work-history", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT h.*, p.name AS project_name, p.project_code, e.full_name AS engineer_name
            FROM worker_work_history h
            LEFT JOIN projects p ON p.id = h.project_id
            LEFT JOIN engineers e ON e.id = h.engineer_id
            WHERE h.worker_id = ?
            ORDER BY h.start_date DESC, h.id DESC
        `, [req.params.id]);

        res.json({ success: true, count: rows.length, history: rows });
    } catch (error) {
        console.error("Get work history error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch work history." });
    }
});

module.exports = router;