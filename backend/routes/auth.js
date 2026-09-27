const express = require("express");
const path = require("path");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { generateSecret, generateURI, verifySync } = require("otplib");
const qrcode = require("qrcode");

require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const db = require("../database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "smart_construction_super_secret_2026";

// =====================================================
// WHATSAPP SETTINGS & HELPER
// =====================================================

let adminNotificationEnabled = true;

async function sendAdminLoginWhatsApp() {
    if (!adminNotificationEnabled) {
        console.log("WhatsApp notifications are OFF.");
        return;
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const recipient = process.env.WHATSAPP_RECIPIENT;

    if (!phoneNumberId || !accessToken || !recipient) {
        console.error("WhatsApp configuration is missing in .env");
        return;
    }

    try {
        const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
        await axios.post(
            url,
            {
                messaging_product: "whatsapp",
                to: recipient,
                type: "template",
                template: {
                    name: "admin_login_success",
                    language: {
                        code: "en_US"
                    }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log("WhatsApp login notification sent.");
    } catch (error) {
        console.error(
            "WhatsApp notification failed:",
            error.response?.data || error.message
        );
    }
}

// Helper to build session JWT and user response
async function buildSessionPayload(userId) {
    const [rows] = await db.query(
        "SELECT id, name, email, role, status, must_change_password, mfa_enabled, mfa_verified_at FROM users WHERE id = ? LIMIT 1",
        [userId]
    );
    if (!rows.length) return null;
    const user = rows[0];

    let engineerData = null;
    if (user.role === "Engineer") {
        const [engRows] = await db.query(
            "SELECT id, engineer_code, designation, phone, project_id, must_change_password FROM engineers WHERE user_id = ? LIMIT 1",
            [user.id]
        );
        if (engRows.length > 0) engineerData = engRows[0];
    }

    let workerData = null;
    if (user.role === "Worker") {
        const [wRows] = await db.query(
            `SELECT w.id, w.worker_code, w.name, w.phone, w.email, w.project_id, w.engineer_id,
                    w.trade, w.role, w.designation, w.daily_wage, w.status,
                    p.name AS project_name, e.full_name AS engineer_name
             FROM workers w
             LEFT JOIN projects p ON p.id = w.project_id
             LEFT JOIN engineers e ON e.id = w.engineer_id
             WHERE w.user_id = ? LIMIT 1`,
            [user.id]
        );
        if (wRows.length > 0) workerData = wRows[0];
    }

    const mustChange = user.role === "Engineer" && Boolean(
        user.must_change_password ||
        (engineerData && engineerData.must_change_password)
    );

    let token;
    if (user.role === "Administrator") {
        token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, mustChangePassword: false },
            JWT_SECRET,
            { expiresIn: "8h" }
        );
        return {
            token,
            mustChangePassword: false,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                mustChangePassword: false,
                mfaEnabled: Boolean(user.mfa_enabled)
            }
        };
    } else if (user.role === "Worker") {
        const mustChange = Boolean(user.must_change_password);
        token = jwt.sign(
            {
                id: user.id,
                workerProfileId: workerData ? workerData.id : null,
                workerId: workerData ? workerData.worker_code : null,
                email: user.email,
                role: "Worker",
                projectId: workerData ? workerData.project_id : null,
                engineerId: workerData ? workerData.engineer_id : null,
                mustChangePassword: mustChange
            },
            JWT_SECRET,
            { expiresIn: "8h" }
        );
        return {
            token,
            mustChangePassword: mustChange,
            user: {
                id: user.id,
                name: workerData ? workerData.name : user.name,
                email: user.email,
                role: "Worker",
                workerProfileId: workerData ? workerData.id : null,
                workerId: workerData ? workerData.worker_code : null,
                phone: workerData ? workerData.phone : null,
                trade: workerData ? workerData.trade : null,
                designation: workerData ? workerData.designation : null,
                projectId: workerData ? workerData.project_id : null,
                projectName: workerData ? workerData.project_name : null,
                engineerId: workerData ? workerData.engineer_id : null,
                engineerName: workerData ? workerData.engineer_name : null,
                dailyWage: workerData ? workerData.daily_wage : null,
                mustChangePassword: mustChange,
                mfaEnabled: Boolean(user.mfa_enabled)
            }
        };
    } else {
        token = jwt.sign(
            {
                id: user.id,
                engineerProfileId: engineerData ? engineerData.id : null,
                engineerId: engineerData ? engineerData.engineer_code : null,
                email: user.email,
                role: user.role,
                projectId: engineerData ? engineerData.project_id : null,
                mustChangePassword: mustChange
            },
            JWT_SECRET,
            { expiresIn: "8h" }
        );
        return {
            token,
            mustChangePassword: mustChange,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                engineerId: engineerData ? engineerData.engineer_code : null,
                projectId: engineerData ? engineerData.project_id : null,
                designation: engineerData ? engineerData.designation : null,
                mustChangePassword: mustChange,
                mfaEnabled: Boolean(user.mfa_enabled)
            }
        };
    }
}

// =====================================================
// DEVICE & NOTIFICATION ROUTES
// =====================================================

router.post("/register-device", (req, res) => {
    return res.json({
        success: true,
        message: "Device registration is not required for WhatsApp notifications."
    });
});

router.post("/notification-setting", (req, res) => {
    adminNotificationEnabled = req.body.enabled !== false;
    return res.json({
        success: true,
        enabled: adminNotificationEnabled
    });
});

// =====================================================
// LOGIN (STEP 1: CREDENTIAL VERIFICATION)
// =====================================================

router.post("/login", async (req, res) => {
    try {
        const { email, password, role, engineerId, workerId, identifier } = req.body;

        if (!password || !role) {
            return res.status(400).json({
                success: false,
                error: "Password and role are required."
            });
        }

        const selectedRole = String(role).toLowerCase().trim();
        let databaseRole;

        if (selectedRole === "admin" || selectedRole === "administrator") {
            databaseRole = "Administrator";
            if (!email) {
                return res.status(400).json({ success: false, error: "Email is required for administrator login." });
            }
        } else if (selectedRole === "engineer") {
            databaseRole = "Engineer";
            if (!email) {
                return res.status(400).json({ success: false, error: "Email is required for engineer login." });
            }
        } else if (selectedRole === "worker") {
            databaseRole = "Worker";
        } else {
            return res.status(401).json({
                success: false,
                error: "Invalid role selected."
            });
        }

        // -------------------------------------------------
        // ADMINISTRATOR
        // -------------------------------------------------
        if (databaseRole === "Administrator") {
            const [rows] = await db.query(
                `SELECT id, name, email, password, role, status, mfa_enabled, mfa_secret
                 FROM users
                 WHERE LOWER(email) = LOWER(?) AND role = 'Administrator'
                 LIMIT 1`,
                [email.trim()]
            );

            if (!rows.length) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid email, password or role."
                });
            }

            const user = rows[0];

            if (user.status && user.status.toLowerCase() !== "active") {
                return res.status(403).json({
                    success: false,
                    error: "This account is inactive."
                });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid email, password or role."
                });
            }

            // MFA check
            const mfaSessionToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role, mfaPending: true },
                JWT_SECRET,
                { expiresIn: "10m" }
            );

            if (user.mfa_enabled && user.mfa_secret) {
                return res.json({
                    success: true,
                    mfaRequired: true,
                    mfaSessionToken,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            } else {
                const session = await buildSessionPayload(user.id);
                await sendAdminLoginWhatsApp();
                return res.json({
                    success: true,
                    message: "Administrator login successful.",
                    token: session.token,
                    user: session.user
                });
            }
        }

        // -------------------------------------------------
        // SITE ENGINEER
        // -------------------------------------------------
        if (databaseRole === "Engineer") {
            if (!engineerId) {
                return res.status(400).json({
                    success: false,
                    error: "Engineer ID is required."
                });
            }

            const cleanEngineerId = String(engineerId).trim().toUpperCase();

            const [rows] = await db.query(
                `SELECT
                    u.id, u.name, u.email, u.password, u.role, u.status, u.mfa_enabled, u.mfa_secret, u.must_change_password,
                    e.id AS engineer_profile_id, e.engineer_code, e.project_id, e.designation, e.must_change_password AS eng_must_change
                 FROM users u
                 INNER JOIN engineers e ON e.user_id = u.id
                 WHERE LOWER(u.email) = LOWER(?)
                   AND u.role = 'Engineer'
                   AND e.engineer_code = ?
                 LIMIT 1`,
                [email.trim(), cleanEngineerId]
            );

            if (!rows.length) {
                return res.status(401).json({
                    success: false,
                    error: "Engineer ID, email or password is incorrect."
                });
            }

            const user = rows[0];

            if (user.status && user.status.toLowerCase() !== "active") {
                return res.status(403).json({
                    success: false,
                    error: "This engineer account is inactive."
                });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    error: "Engineer ID, email or password is incorrect."
                });
            }

            const mustChange = Boolean(user.must_change_password || user.eng_must_change);

            const mfaSessionToken = jwt.sign(
                {
                    id: user.id,
                    engineerProfileId: user.engineer_profile_id,
                    engineerId: user.engineer_code,
                    email: user.email,
                    role: user.role,
                    projectId: user.project_id,
                    mustChangePassword: mustChange,
                    mfaPending: true
                },
                JWT_SECRET,
                { expiresIn: "10m" }
            );

            if (user.mfa_enabled && user.mfa_secret) {
                return res.json({
                    success: true,
                    mfaRequired: true,
                    mfaSessionToken,
                    mustChangePassword: mustChange,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        engineerId: user.engineer_code,
                        projectId: user.project_id,
                        designation: user.designation,
                        mustChangePassword: mustChange
                    }
                });
            } else {
                const session = await buildSessionPayload(user.id);
                if (user.engineer_code) {
                    await db.query("UPDATE engineers SET last_login = NOW() WHERE user_id = ?", [user.id]);
                }
                return res.json({
                    success: true,
                    message: "Engineer login successful.",
                    token: session.token,
                    mustChangePassword: session.mustChangePassword,
                    user: session.user
                });
            }
        }

        // -------------------------------------------------
        // WORKER
        // -------------------------------------------------
        if (databaseRole === "Worker") {
            const rawIdentifier = (workerId || identifier || email || req.body.phone || "").trim();
            if (!rawIdentifier) {
                return res.status(400).json({
                    success: false,
                    error: "Worker ID (e.g. WRK-001) or Registered Mobile / Email is required."
                });
            }

            const [rows] = await db.query(
                `SELECT 
                    u.id, u.name, u.email, u.password, u.role, u.status, u.mfa_enabled, u.mfa_secret,
                    w.id AS worker_profile_id, w.worker_code, w.phone, w.project_id, w.engineer_id, w.trade
                 FROM users u
                 INNER JOIN workers w ON w.user_id = u.id
                 WHERE (
                     UPPER(w.worker_code) = UPPER(?) 
                     OR LOWER(u.email) = LOWER(?) 
                     OR w.phone = ?
                 )
                 LIMIT 1`,
                [rawIdentifier, rawIdentifier, rawIdentifier]
            );

            if (!rows.length) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid Worker ID, mobile/email, or password."
                });
            }

            const user = rows[0];

            if (user.status && user.status.toLowerCase() !== "active") {
                return res.status(403).json({
                    success: false,
                    error: "This worker account is currently inactive."
                });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid Worker ID, mobile/email, or password."
                });
            }

            const session = await buildSessionPayload(user.id);
            return res.json({
                success: true,
                message: "Worker login successful.",
                token: session.token,
                mustChangePassword: session.mustChangePassword,
                user: session.user
            });
        }

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            error: "Login failed. Please try again."
        });
    }
});

// =====================================================
// MFA SETUP: GENERATE SECRET, QR CODE & RECOVERY CODES
// =====================================================

router.post("/mfa/generate", async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.substring(7).trim()
            : req.body.mfaSessionToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "Authorization token or session token required."
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: "Session expired. Please log in again."
            });
        }

        const [rows] = await db.query(
            "SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1",
            [decoded.id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        const user = rows[0];

        // 1. Generate RFC 6238 TOTP Secret
        const secret = generateSecret();

        // 2. Generate OTP Auth URI
        const otpAuthUri = generateURI({
            secret,
            label: user.email,
            issuer: "SmartBuild"
        });

        // 3. Generate QR Code Data URL
        const qrCode = await qrcode.toDataURL(otpAuthUri, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 260
        });

        // 4. Generate 8 single-use recovery codes (XXXX-XXXX format)
        const recoveryCodes = Array.from({ length: 8 }, () => {
            const p1 = crypto.randomBytes(2).toString("hex").toUpperCase();
            const p2 = crypto.randomBytes(2).toString("hex").toUpperCase();
            return `${p1}-${p2}`;
        });

        // Format secret in 4-character chunks for manual entry
        const formattedSecret = secret.match(/.{1,4}/g)?.join(" ") || secret;

        // Sign a setup token containing secret and recovery codes
        const setupToken = jwt.sign(
            { userId: user.id, secret, recoveryCodes },
            JWT_SECRET,
            { expiresIn: "15m" }
        );

        return res.json({
            success: true,
            secret,
            formattedSecret,
            otpAuthUri,
            qrCode,
            recoveryCodes,
            setupToken
        });

    } catch (error) {
        console.error("MFA Generate Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate MFA setup credentials."
        });
    }
});

// =====================================================
// MFA SETUP: VERIFY CODE & ACTIVATE MFA
// =====================================================

router.post("/mfa/verify-setup", async (req, res) => {
    try {
        const { setupToken, code } = req.body;

        if (!setupToken || !code) {
            return res.status(400).json({
                success: false,
                error: "Setup token and 6-digit authentication code are required."
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(setupToken, JWT_SECRET);
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: "Setup session expired. Please start setup again."
            });
        }

        const { userId, secret, recoveryCodes } = decoded;

        // Verify the 6-digit TOTP code
        const cleanedCode = String(code).replace(/\s+/g, "");
        const verifyResult = verifySync({
            secret,
            token: cleanedCode
        });

        if (!verifyResult || !verifyResult.valid) {
            return res.status(400).json({
                success: false,
                error: "Invalid 6-digit verification code. Please check your authenticator app and try again."
            });
        }

        // Hash recovery codes before storing in database
        const hashedRecoveryCodes = await Promise.all(
            recoveryCodes.map(async (rc) => {
                const hash = await bcrypt.hash(rc.toUpperCase(), 10);
                return {
                    hash,
                    used: false,
                    createdAt: new Date().toISOString()
                };
            })
        );

        // Update user record in database
        await db.query(
            `UPDATE users
             SET mfa_enabled = 1,
                 mfa_secret = ?,
                 mfa_verified_at = NOW(),
                 mfa_recovery_codes = ?
             WHERE id = ?`,
            [secret, JSON.stringify(hashedRecoveryCodes), userId]
        );

        const session = await buildSessionPayload(userId);
        if (!session) {
            return res.status(404).json({ success: false, error: "User record not found." });
        }

        if (session.user.role === "Administrator") {
            await sendAdminLoginWhatsApp();
        } else if (session.user.role === "Engineer" && session.user.engineerId) {
            await db.query(
                "UPDATE engineers SET last_login = NOW() WHERE user_id = ?",
                [userId]
            );
        }

        return res.json({
            success: true,
            message: "Two-factor authentication successfully enabled!",
            token: session.token,
            mustChangePassword: session.mustChangePassword,
            user: session.user
        });

    } catch (error) {
        console.error("MFA Verify Setup Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to verify and activate MFA."
        });
    }
});

// =====================================================
// MFA LOGIN: VERIFY 6-DIGIT TOTP CODE
// =====================================================

router.post("/mfa/verify", async (req, res) => {
    try {
        const { mfaSessionToken, code } = req.body;

        if (!mfaSessionToken || !code) {
            return res.status(400).json({
                success: false,
                error: "MFA session token and 6-digit verification code are required."
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(mfaSessionToken, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: "MFA session expired. Please log in again."
            });
        }

        const [rows] = await db.query(
            "SELECT id, name, email, role, status, mfa_enabled, mfa_secret FROM users WHERE id = ? LIMIT 1",
            [decoded.id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        const user = rows[0];

        if (!user.mfa_enabled || !user.mfa_secret) {
            return res.status(400).json({
                success: false,
                error: "Two-factor authentication is not enabled on this account."
            });
        }

        const cleanedCode = String(code).replace(/\s+/g, "");
        const verifyResult = verifySync({
            secret: user.mfa_secret,
            token: cleanedCode
        });

        if (!verifyResult || !verifyResult.valid) {
            return res.status(401).json({
                success: false,
                error: "Invalid 6-digit verification code. Please try again."
            });
        }

        const session = await buildSessionPayload(user.id);

        if (session.user.role === "Administrator") {
            await sendAdminLoginWhatsApp();
        } else if (session.user.role === "Engineer" && session.user.engineerId) {
            await db.query(
                "UPDATE engineers SET last_login = NOW() WHERE user_id = ?",
                [user.id]
            );
        }

        return res.json({
            success: true,
            message: "Authentication successful.",
            token: session.token,
            mustChangePassword: session.mustChangePassword,
            user: session.user
        });

    } catch (error) {
        console.error("MFA Verify Error:", error);
        return res.status(500).json({
            success: false,
            error: "MFA verification failed."
        });
    }
});

// =====================================================
// MFA LOGIN: VERIFY RECOVERY CODE
// =====================================================

router.post("/mfa/verify-recovery", async (req, res) => {
    try {
        const { mfaSessionToken, recoveryCode } = req.body;

        if (!mfaSessionToken || !recoveryCode) {
            return res.status(400).json({
                success: false,
                error: "MFA session token and recovery code are required."
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(mfaSessionToken, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: "MFA session expired. Please log in again."
            });
        }

        const [rows] = await db.query(
            "SELECT id, name, email, role, status, mfa_enabled, mfa_recovery_codes FROM users WHERE id = ? LIMIT 1",
            [decoded.id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        const user = rows[0];

        if (!user.mfa_enabled || !user.mfa_recovery_codes) {
            return res.status(400).json({
                success: false,
                error: "No recovery codes found for this account."
            });
        }

        let codesList = [];
        try {
            codesList = JSON.parse(user.mfa_recovery_codes);
        } catch (e) {
            return res.status(500).json({
                success: false,
                error: "Invalid recovery codes configuration."
            });
        }

        const cleanedInput = String(recoveryCode).trim().toUpperCase();
        let matchedIndex = -1;

        for (let i = 0; i < codesList.length; i++) {
            if (!codesList[i].used) {
                const match = await bcrypt.compare(cleanedInput, codesList[i].hash);
                if (match) {
                    matchedIndex = i;
                    break;
                }
            }
        }

        if (matchedIndex === -1) {
            return res.status(401).json({
                success: false,
                error: "Invalid or already used recovery code."
            });
        }

        // Mark the recovery code as used
        codesList[matchedIndex].used = true;
        codesList[matchedIndex].usedAt = new Date().toISOString();

        await db.query(
            "UPDATE users SET mfa_recovery_codes = ? WHERE id = ?",
            [JSON.stringify(codesList), user.id]
        );

        const remainingCodes = codesList.filter(c => !c.used).length;

        const session = await buildSessionPayload(user.id);

        if (session.user.role === "Administrator") {
            await sendAdminLoginWhatsApp();
        } else if (session.user.role === "Engineer" && session.user.engineerId) {
            await db.query(
                "UPDATE engineers SET last_login = NOW() WHERE user_id = ?",
                [user.id]
            );
        }

        return res.json({
            success: true,
            message: `Recovery code accepted. You have ${remainingCodes} recovery codes remaining.`,
            remainingRecoveryCodes: remainingCodes,
            token: session.token,
            mustChangePassword: session.mustChangePassword,
            user: session.user
        });

    } catch (error) {
        console.error("Recovery Code Verify Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to verify recovery code."
        });
    }
});

// =====================================================
// MFA SETUP: SKIP SETUP (DIRECT ACCESS)
// =====================================================

router.post("/mfa/skip-setup", async (req, res) => {
    try {
        const { mfaSessionToken } = req.body;

        if (!mfaSessionToken) {
            return res.status(400).json({
                success: false,
                error: "MFA session token is required."
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(mfaSessionToken, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: "Session expired. Please log in again."
            });
        }

        const session = await buildSessionPayload(decoded.id);
        if (!session) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        if (session.user.role === "Administrator") {
            await sendAdminLoginWhatsApp();
        } else if (session.user.role === "Engineer" && session.user.engineerId) {
            await db.query(
                "UPDATE engineers SET last_login = NOW() WHERE user_id = ?",
                [decoded.id]
            );
        }

        return res.json({
            success: true,
            message: "Login successful.",
            token: session.token,
            mustChangePassword: session.mustChangePassword,
            user: session.user
        });

    } catch (error) {
        console.error("Skip MFA Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to skip MFA setup."
        });
    }
});

// =====================================================
// MFA STATUS
// =====================================================

router.get("/mfa/status", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, mfa_enabled, mfa_verified_at, mfa_recovery_codes FROM users WHERE id = ? LIMIT 1",
            [req.user.id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        const user = rows[0];
        let remainingCodes = 0;
        if (user.mfa_recovery_codes) {
            try {
                const parsed = JSON.parse(user.mfa_recovery_codes);
                remainingCodes = parsed.filter(c => !c.used).length;
            } catch (e) {}
        }

        return res.json({
            success: true,
            mfaEnabled: Boolean(user.mfa_enabled),
            verifiedAt: user.mfa_verified_at,
            remainingRecoveryCodes: remainingCodes
        });
    } catch (error) {
        console.error("MFA Status Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch MFA status."
        });
    }
});

// =====================================================
// MFA DISABLE (PASSWORD REQUIRED)
// =====================================================

router.post("/mfa/disable", authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                error: "Password is required to disable two-factor authentication."
            });
        }

        const [rows] = await db.query(
            "SELECT id, password FROM users WHERE id = ? LIMIT 1",
            [req.user.id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        const isMatch = await bcrypt.compare(password, rows[0].password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: "Incorrect password."
            });
        }

        await db.query(
            `UPDATE users
             SET mfa_enabled = 0,
                 mfa_secret = NULL,
                 mfa_verified_at = NULL,
                 mfa_recovery_codes = NULL
             WHERE id = ?`,
            [req.user.id]
        );

        return res.json({
            success: true,
            message: "Two-factor authentication has been disabled."
        });

    } catch (error) {
        console.error("Disable MFA Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to disable MFA."
        });
    }
});

// =====================================================
// REGENERATE RECOVERY CODES (PASSWORD + TOTP REQUIRED)
// =====================================================

router.post("/mfa/regenerate-recovery", authenticateToken, async (req, res) => {
    try {
        const { password, code } = req.body;

        if (!password || !code) {
            return res.status(400).json({
                success: false,
                error: "Password and 6-digit authentication code are required."
            });
        }

        const [rows] = await db.query(
            "SELECT id, password, mfa_enabled, mfa_secret FROM users WHERE id = ? LIMIT 1",
            [req.user.id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        const user = rows[0];
        if (!user.mfa_enabled || !user.mfa_secret) {
            return res.status(400).json({
                success: false,
                error: "Two-factor authentication is not enabled."
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: "Incorrect password."
            });
        }

        const cleanedCode = String(code).replace(/\s+/g, "");
        const verifyResult = verifySync({
            secret: user.mfa_secret,
            token: cleanedCode
        });

        if (!verifyResult || !verifyResult.valid) {
            return res.status(401).json({
                success: false,
                error: "Invalid 6-digit authentication code."
            });
        }

        const recoveryCodes = Array.from({ length: 8 }, () => {
            const p1 = crypto.randomBytes(2).toString("hex").toUpperCase();
            const p2 = crypto.randomBytes(2).toString("hex").toUpperCase();
            return `${p1}-${p2}`;
        });

        const hashedRecoveryCodes = await Promise.all(
            recoveryCodes.map(async (rc) => {
                const hash = await bcrypt.hash(rc.toUpperCase(), 10);
                return {
                    hash,
                    used: false,
                    createdAt: new Date().toISOString()
                };
            })
        );

        await db.query(
            "UPDATE users SET mfa_recovery_codes = ? WHERE id = ?",
            [JSON.stringify(hashedRecoveryCodes), user.id]
        );

        return res.json({
            success: true,
            message: "Recovery codes regenerated successfully.",
            recoveryCodes
        });

    } catch (error) {
        console.error("Regenerate Recovery Codes Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to regenerate recovery codes."
        });
    }
});

// =====================================================
// PROFILE DETAILS
// =====================================================

router.get("/profile/:id", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, name, email, role, status, mfa_enabled, mfa_verified_at, created_at FROM users WHERE id = ? LIMIT 1",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        const user = rows[0];
        let engineerData = null;
        let workerData = null;

        if (user.role === "Engineer") {
            const [engRows] = await db.query(
                "SELECT engineer_code, designation, phone, project_id FROM engineers WHERE user_id = ? LIMIT 1",
                [user.id]
            );
            if (engRows.length > 0) engineerData = engRows[0];
        } else if (user.role === "Worker") {
            const [wRows] = await db.query(
                `SELECT w.id, w.worker_code, w.name, w.phone, w.email, w.project_id, w.engineer_id,
                        w.trade, w.role, w.designation, w.daily_wage, w.status,
                        p.name AS project_name, e.full_name AS engineer_name
                 FROM workers w
                 LEFT JOIN projects p ON p.id = w.project_id
                 LEFT JOIN engineers e ON e.id = w.engineer_id
                 WHERE w.user_id = ? LIMIT 1`,
                [user.id]
            );
            if (wRows.length > 0) workerData = wRows[0];
        }

        return res.json({
            success: true,
            user: { ...user, engineer: engineerData, worker: workerData }
        });
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        return res.status(500).json({ success: false, error: "Failed to fetch profile." });
    }
});

// =====================================================
// CHANGE PASSWORD - MYSQL + BCRYPT
// =====================================================

router.put("/change-password/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: "Current password and new password are required."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: "New password must contain at least 6 characters."
            });
        }

        const [rows] = await db.query(
            "SELECT id, password, role FROM users WHERE id = ? LIMIT 1",
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "User account not found."
            });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: "Current password does not match our records."
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        if (user.role === "Engineer") {
            await db.query(
                "UPDATE engineers SET must_change_password = 0 WHERE user_id = ?",
                [userId]
            );
        }

        return res.json({
            success: true,
            message: "Password updated successfully."
        });

    } catch (error) {
        console.error("Change Password Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to update password."
        });
    }
});

// =====================================================
// FIRST LOGIN PASSWORD CHANGE - MANDATORY FOR SITE ENGINEERS
// Requirement 14: POST /api/auth/first-login-change-password
// =====================================================
router.post("/first-login-change-password", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: "Current temporary password, new password, and confirmation password are all required."
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: "New password and confirmation password do not match."
            });
        }

        if (newPassword === currentPassword) {
            return res.status(400).json({
                success: false,
                error: "Your new password must be different from your temporary password."
            });
        }

        // Password complexity verification:
        // - Minimum 8 characters
        // - Uppercase
        // - Lowercase
        // - Number
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: "New password must be at least 8 characters long."
            });
        }
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: "New password must contain at least one uppercase letter (A-Z)."
            });
        }
        if (!/[a-z]/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: "New password must contain at least one lowercase letter (a-z)."
            });
        }
        if (!/[0-9]/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: "New password must contain at least one numeric digit (0-9)."
            });
        }

        const [rows] = await db.query(
            "SELECT id, password, role FROM users WHERE id = ? LIMIT 1",
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "User account not found."
            });
        }

        const user = rows[0];

        // Verify current temporary password matches bcrypt hash
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: "Current temporary password does not match our records."
            });
        }

        // Hash new password using bcrypt
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear must_change_password in users table
        await db.query(
            "UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?",
            [hashedPassword, userId]
        );

        // Clear must_change_password in engineers table
        await db.query(
            "UPDATE engineers SET must_change_password = 0 WHERE user_id = ?",
            [userId]
        );

        // Issue refreshed JWT and payload with mustChangePassword = false
        const session = await buildSessionPayload(userId);

        return res.json({
            success: true,
            message: "Password updated successfully. Your account is now fully secured.",
            token: session.token,
            mustChangePassword: false,
            user: session.user
        });

    } catch (error) {
        console.error("First Login Change Password Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to update password.",
            details: error.message
        });
    }
});

module.exports = router;