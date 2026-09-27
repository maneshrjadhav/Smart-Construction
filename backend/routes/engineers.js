const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { sendEngineerCredentials } = require("../services/smsService");

const router = express.Router();

/* =========================================================
   GENERATE CRYPTOGRAPHICALLY SECURE TEMPORARY PASSWORD
========================================================= */
function generateSecureTemporaryPassword() {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%*";

    // Ensure at least one character from each set
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

    // Modern Fisher-Yates shuffle using crypto.randomInt
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
}

/* =========================================================
   GENERATE UNIQUE SEQUENTIAL ENGINEER ID (ENG-001, ENG-002, ...)
========================================================= */
async function generateEngineerCode(connection) {
    const [rows] = await connection.query(`
        SELECT engineer_code
        FROM engineers
        WHERE engineer_code LIKE 'ENG-%'
    `);

    let maxNumber = 0;
    for (const row of rows) {
        if (!row.engineer_code) continue;
        const match = String(row.engineer_code).match(/ENG-(\d+)/i);
        if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
            }
        }
    }

    const nextNumber = maxNumber + 1;
    return `ENG-${String(nextNumber).padStart(3, "0")}`;
}

/* =========================================================
   GET ALL ENGINEERS (ADMINISTRATOR ONLY)
========================================================= */
router.get("/", authenticateToken, requireRole(["Administrator"]), async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                e.id,
                e.engineer_code,
                e.user_id,
                e.full_name,
                e.email,
                e.phone,
                e.address,
                e.qualification,
                e.experience,
                e.designation,
                e.joining_date,
                e.project_id,
                p.name AS project_name,
                e.status,
                e.must_change_password,
                e.created_at
            FROM engineers e
            LEFT JOIN projects p ON p.id = e.project_id
            ORDER BY e.id DESC
        `);

        res.json({
            success: true,
            count: rows.length,
            engineers: rows
        });
    } catch (error) {
        console.error("GET ENGINEERS ERROR:", error);
        res.status(500).json({
            success: false,
            error: "Unable to load engineers.",
            details: error.message
        });
    }
});

/* =========================================================
   GET SINGLE ENGINEER (ADMINISTRATOR ONLY)
========================================================= */
router.get("/:id", authenticateToken, requireRole(["Administrator"]), async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                e.id,
                e.engineer_code,
                e.user_id,
                e.full_name,
                e.email,
                e.phone,
                e.address,
                e.qualification,
                e.experience,
                e.designation,
                e.joining_date,
                e.project_id,
                p.name AS project_name,
                e.status,
                e.must_change_password,
                e.created_at
            FROM engineers e
            LEFT JOIN projects p ON p.id = e.project_id
            WHERE e.id = ?
            LIMIT 1
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Engineer not found."
            });
        }

        res.json({
            success: true,
            engineer: rows[0]
        });
    } catch (error) {
        console.error("GET ENGINEER ERROR:", error);
        res.status(500).json({
            success: false,
            error: "Unable to load engineer.",
            details: error.message
        });
    }
});

/* =========================================================
   CREATE ENGINEER (ADMINISTRATOR ONLY)
   - Auto-generates cryptographically secure temporary password
   - Auto-generates ENG-XXX identifier
   - Sets must_change_password = 1
   - Sends credentials through SMS service / safe dev simulation
========================================================= */
router.post("/", authenticateToken, requireRole(["Administrator"]), async (req, res) => {
    const connection = await db.getConnection();

    try {
        const {
            full_name,
            email,
            phone,
            address,
            qualification,
            experience,
            designation,
            joining_date,
            project_id,
            status
        } = req.body;

        /* REQUIRED FIELDS */
        if (
            !full_name ||
            !email ||
            !phone ||
            !qualification ||
            !designation ||
            !joining_date ||
            !project_id
        ) {
            return res.status(400).json({
                success: false,
                error: "Please fill all required engineer fields (Full Name, Email, Phone, Designation, Qualification, Project, Joining Date)."
            });
        }

        const cleanName = String(full_name).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPhone = String(phone).trim();
        const cleanQualification = String(qualification).trim();
        const cleanDesignation = String(designation).trim();

        /* CHECK EMAIL DUPLICATION IN USERS TABLE */
        const [existingUser] = await connection.query(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
            [cleanEmail]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                error: "This email address is already registered in the system."
            });
        }

        /* CHECK PROJECT EXISTENCE */
        const [projectRows] = await connection.query(
            "SELECT id, name FROM projects WHERE id = ? LIMIT 1",
            [Number(project_id)]
        );

        if (projectRows.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Selected construction project does not exist."
            });
        }

        await connection.beginTransaction();

        /* AUTOMATIC UNIQUE ENGINEER ID GENERATION */
        const engineerCode = await generateEngineerCode(connection);

        /* AUTOMATIC CRYPTOGRAPHICALLY SECURE TEMPORARY PASSWORD */
        const temporaryPassword = generateSecureTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        /* CREATE LOGIN USER IN USERS TABLE (Compatible with existing MySQL schema) */
        const [userResult] = await connection.query(`
            INSERT INTO users (
                name,
                email,
                password,
                role,
                status,
                must_change_password
            )
            VALUES (?, ?, ?, 'Engineer', ?, 1)
        `, [
            cleanName,
            cleanEmail,
            hashedPassword,
            status || "Active"
        ]);

        const newUserId = userResult.insertId;

        /* CREATE RECORD IN ENGINEERS TABLE */
        const [engineerResult] = await connection.query(`
            INSERT INTO engineers (
                engineer_code,
                user_id,
                full_name,
                email,
                phone,
                address,
                qualification,
                experience,
                designation,
                joining_date,
                project_id,
                status,
                must_change_password
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            engineerCode,
            newUserId,
            cleanName,
            cleanEmail,
            cleanPhone,
            address ? String(address).trim() : null,
            cleanQualification,
            experience ? String(experience).trim() : null,
            cleanDesignation,
            joining_date,
            Number(project_id),
            status || "Active"
        ]);

        await connection.commit();

        /* SEND SMS CREDENTIAL DELIVERY */
        const smsResult = await sendEngineerCredentials({
            phone: cleanPhone,
            engineerId: engineerCode,
            email: cleanEmail,
            temporaryPassword,
            projectName: projectRows[0].name
        });

        /* SUCCESS RESPONSE
           Note: We return engineer info and SMS delivery status.
           We include temporaryPassword only in this one-time creation payload for delivery verification,
           never persisting it plaintext in database or subsequent queries.
        */
        res.status(201).json({
            success: true,
            message: "Engineer created successfully.",
            engineer: {
                id: engineerResult.insertId,
                engineer_code: engineerCode,
                full_name: cleanName,
                email: cleanEmail,
                phone: cleanPhone,
                designation: cleanDesignation,
                qualification: cleanQualification,
                project_id: Number(project_id),
                project_name: projectRows[0].name,
                status: status || "Active",
                must_change_password: 1
            },
            temporaryPassword,
            smsStatus: smsResult
        });

    } catch (error) {
        try {
            await connection.rollback();
        } catch (_) {}

        console.error("CREATE ENGINEER ERROR:", error);
        res.status(500).json({
            success: false,
            error: "Unable to create engineer.",
            details: error.message
        });
    } finally {
        connection.release();
    }
});

/* =========================================================
   RESEND CREDENTIALS (ADMINISTRATOR ONLY)
   Requirement 9:
   1. Generate a NEW secure temporary password.
   2. Hash it.
   3. Update the user's password.
   4. Set must_change_password = TRUE.
   5. Send the new credentials through SMS.
   6. Show success/failure status.
========================================================= */
router.post("/:id/resend-credentials", authenticateToken, requireRole(["Administrator"]), async (req, res) => {
    const connection = await db.getConnection();

    try {
        const engineerId = req.params.id;

        // Fetch engineer and associated user
        const [rows] = await connection.query(`
            SELECT
                e.id,
                e.engineer_code,
                e.user_id,
                e.full_name,
                e.email,
                e.phone,
                p.name AS project_name
            FROM engineers e
            LEFT JOIN projects p ON p.id = e.project_id
            WHERE e.id = ?
            LIMIT 1
        `, [engineerId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Engineer not found."
            });
        }

        const engineer = rows[0];

        if (!engineer.phone || !engineer.email) {
            return res.status(400).json({
                success: false,
                error: "Engineer has no phone or email registered to receive credentials."
            });
        }

        // 1. Generate new secure temporary password
        const newTempPassword = generateSecureTemporaryPassword();

        // 2. Hash it
        const hashedPassword = await bcrypt.hash(newTempPassword, 10);

        await connection.beginTransaction();

        // 3. Update the user's password & set must_change_password = 1
        if (engineer.user_id) {
            await connection.query(`
                UPDATE users
                SET password = ?,
                    must_change_password = 1
                WHERE id = ?
            `, [hashedPassword, engineer.user_id]);
        } else {
            // If for some reason user_id was null, match by email
            await connection.query(`
                UPDATE users
                SET password = ?,
                    must_change_password = 1
                WHERE LOWER(email) = LOWER(?) AND role = 'Engineer'
            `, [hashedPassword, engineer.email]);
        }

        // 4. Set must_change_password = 1 in engineers table
        await connection.query(`
            UPDATE engineers
            SET must_change_password = 1
            WHERE id = ?
        `, [engineer.id]);

        await connection.commit();

        // 5. Send new credentials through SMS service
        const smsResult = await sendEngineerCredentials({
            phone: engineer.phone,
            engineerId: engineer.engineer_code,
            email: engineer.email,
            temporaryPassword: newTempPassword,
            projectName: engineer.project_name
        });

        // 6. Return response
        res.json({
            success: true,
            message: "New credentials generated and dispatched via SMS.",
            engineerId: engineer.engineer_code,
            email: engineer.email,
            phone: engineer.phone,
            temporaryPassword: newTempPassword,
            smsStatus: smsResult
        });

    } catch (error) {
        try {
            await connection.rollback();
        } catch (_) {}

        console.error("RESEND CREDENTIALS ERROR:", error);
        res.status(500).json({
            success: false,
            error: "Failed to resend engineer credentials.",
            details: error.message
        });
    } finally {
        connection.release();
    }
});

/* =========================================================
   DELETE ENGINEER (ADMINISTRATOR ONLY)
========================================================= */
router.delete("/:id", authenticateToken, requireRole(["Administrator"]), async (req, res) => {
    const connection = await db.getConnection();

    try {
        const [engineerRows] = await connection.query(`
            SELECT user_id
            FROM engineers
            WHERE id = ?
            LIMIT 1
        `, [req.params.id]);

        if (engineerRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Engineer not found."
            });
        }

        await connection.beginTransaction();

        await connection.query("DELETE FROM engineers WHERE id = ?", [req.params.id]);

        if (engineerRows[0].user_id) {
            await connection.query(
                "DELETE FROM users WHERE id = ? AND role = 'Engineer'",
                [engineerRows[0].user_id]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Engineer deleted successfully."
        });

    } catch (error) {
        try {
            await connection.rollback();
        } catch (_) {}

        console.error("DELETE ENGINEER ERROR:", error);
        res.status(500).json({
            success: false,
            error: "Unable to delete engineer.",
            details: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;