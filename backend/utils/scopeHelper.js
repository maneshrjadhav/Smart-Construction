// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// ROLE & ENGINEER / WORKER PROJECT SCOPE HELPER
// ======================================================================

const db = require("../database");

/**
 * Resolves the authenticated user's role and scopes.
 * For Engineers, queries the live engineer record from MySQL.
 * For Workers, queries the live worker record from MySQL.
 */
async function getAuthScope(req) {
    if (!req.user || !req.user.role) {
        return {
            isAuthenticated: false,
            isAdmin: false,
            isEngineer: false,
            isWorker: false,
            user: null,
            engineer: null,
            worker: null,
            projectId: null
        };
    }

    const role = String(req.user.role).trim().toLowerCase();
    const isAdmin = role === "administrator" || role === "admin";

    if (isAdmin) {
        return {
            isAuthenticated: true,
            isAdmin: true,
            isEngineer: false,
            isWorker: false,
            user: req.user,
            engineer: null,
            worker: null,
            projectId: null
        };
    }

    const isEngineer = role === "engineer";
    if (isEngineer) {
        let engineer = null;
        let projectId = null;
        const [engRows] = await db.query(
            `SELECT id, engineer_code, user_id, full_name, email, phone, project_id, status 
             FROM engineers 
             WHERE user_id = ? 
             LIMIT 1`,
            [req.user.id]
        );

        if (engRows.length > 0) {
            engineer = engRows[0];
            projectId = engineer.project_id || null;
        }

        return {
            isAuthenticated: true,
            isAdmin: false,
            isEngineer: true,
            isWorker: false,
            user: req.user,
            engineer,
            worker: null,
            projectId
        };
    }

    const isWorker = role === "worker";
    if (isWorker) {
        let worker = null;
        let projectId = null;
        const [workerRows] = await db.query(
            `SELECT id, worker_code, user_id, name, phone, email, project_id, engineer_id, daily_wage, status 
             FROM workers 
             WHERE user_id = ? 
             LIMIT 1`,
            [req.user.id]
        );

        if (workerRows.length > 0) {
            worker = workerRows[0];
            projectId = worker.project_id || null;
        }

        return {
            isAuthenticated: true,
            isAdmin: false,
            isEngineer: false,
            isWorker: true,
            user: req.user,
            worker,
            engineer: null,
            projectId
        };
    }

    return {
        isAuthenticated: true,
        isAdmin: false,
        isEngineer: false,
        isWorker: false,
        user: req.user,
        engineer: null,
        worker: null,
        projectId: null
    };
}

module.exports = {
    getAuthScope
};
