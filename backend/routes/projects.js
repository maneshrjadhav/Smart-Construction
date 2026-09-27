const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");
const { getAuthScope } = require("../utils/scopeHelper");

const router = express.Router();
router.use(authenticateToken);

// =====================================================
// GET ALL PROJECTS (SCOPED)
// =====================================================
router.get("/", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        let query = `
            SELECT
                id,
                project_code AS projectCode,
                name,
                location,
                engineer,
                budget,
                start_date AS startDate,
                completion_date AS completionDate,
                progress,
                status,
                created_at AS createdAt
            FROM projects
        `;

        const params = [];

        // Engineer scoping: can only see assigned project
        if (scope.isEngineer) {
            if (scope.projectId) {
                query += ` WHERE id = ?`;
                params.push(scope.projectId);
            } else {
                return res.json({ success: true, count: 0, projects: [] });
            }
        }

        query += ` ORDER BY id DESC`;

        const [projects] = await db.query(query, params);

        res.json({
            success: true,
            count: projects.length,
            projects
        });

    } catch (error) {
        console.error("Get projects error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch projects"
        });
    }
});


// =====================================================
// GET SINGLE PROJECT
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        if (scope.isEngineer && scope.projectId && Number(req.params.id) !== Number(scope.projectId)) {
            return res.status(403).json({
                success: false,
                error: "Access Denied: You are not authorized to view this project."
            });
        }

        const [projects] = await db.query(`
            SELECT
                id,
                project_code AS projectCode,
                name,
                location,
                engineer,
                budget,
                start_date AS startDate,
                completion_date AS completionDate,
                progress,
                status,
                created_at AS createdAt
            FROM projects
            WHERE id = ?
        `, [req.params.id]);

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Project not found"
            });
        }

        res.json({
            success: true,
            project: projects[0]
        });

    } catch (error) {
        console.error("Get single project error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch project"
        });
    }
});


// =====================================================
// CREATE PROJECT (ADMINISTRATOR ONLY)
// =====================================================
router.post("/", async (req, res) => {
    try {
        const scope = await getAuthScope(req);
        if (!scope.isAdmin) {
            return res.status(403).json({
                success: false,
                error: "Access Denied: Only Administrators can create projects."
            });
        }

        const {
            name,
            project_name,
            location,
            engineer,
            budget,
            startDate,
            start_date,
            completionDate,
            completion_date,
            progress,
            status
        } = req.body;

        const projectName = name || project_name;

        if (!projectName) {
            return res.status(400).json({
                success: false,
                error: "Project name is required"
            });
        }

        // Generate project code
        const [lastProject] = await db.query(`
            SELECT id
            FROM projects
            ORDER BY id DESC
            LIMIT 1
        `);

        const nextId =
            lastProject.length > 0
                ? lastProject[0].id + 1
                : 1;

        const projectCode =
            "PRJ-" + String(nextId).padStart(3, "0");

        const [result] = await db.query(`
            INSERT INTO projects
            (
                project_code,
                name,
                location,
                engineer,
                budget,
                start_date,
                completion_date,
                progress,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            projectCode,
            projectName,
            location || null,
            engineer || null,
            Number(budget) || 0,
            startDate || start_date || null,
            completionDate || completion_date || null,
            Number(progress) || 0,
            status || "Pending"
        ]);

        const [projects] = await db.query(`
            SELECT
                id,
                project_code AS projectCode,
                name,
                location,
                engineer,
                budget,
                start_date AS startDate,
                completion_date AS completionDate,
                progress,
                status,
                created_at AS createdAt
            FROM projects
            WHERE id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project: projects[0]
        });

    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create project"
        });
    }
});


// =====================================================
// UPDATE PROJECT
// =====================================================
router.put("/:id", async (req, res) => {
    try {
        const scope = await getAuthScope(req);

        const [existingProjects] = await db.query(
            `SELECT * FROM projects WHERE id = ?`,
            [req.params.id]
        );

        if (existingProjects.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Project not found"
            });
        }

        const existing = existingProjects[0];

        // Engineer can only update their assigned project and cannot change budget
        if (scope.isEngineer) {
            if (Number(req.params.id) !== Number(scope.projectId)) {
                return res.status(403).json({
                    success: false,
                    error: "Access Denied: You cannot modify another project."
                });
            }
        }

        const name = scope.isAdmin ? (req.body.name ?? existing.name) : existing.name;
        const location = scope.isAdmin ? (req.body.location ?? existing.location) : existing.location;
        const engineer = scope.isAdmin ? (req.body.engineer ?? existing.engineer) : existing.engineer;
        // REQUIREMENT: Engineer CANNOT change project budget
        const budget = scope.isAdmin ? (req.body.budget !== undefined ? Number(req.body.budget) : existing.budget) : existing.budget;
        const startDate = req.body.startDate ?? existing.start_date;
        const completionDate = req.body.completionDate ?? existing.completion_date;
        const progress = req.body.progress ?? existing.progress;
        const status = req.body.status ?? existing.status;

        await db.query(`
            UPDATE projects
            SET
                name = ?,
                location = ?,
                engineer = ?,
                budget = ?,
                start_date = ?,
                completion_date = ?,
                progress = ?,
                status = ?
            WHERE id = ?
        `, [
            name,
            location,
            engineer,
            budget,
            startDate,
            completionDate,
            Number(progress) || 0,
            status,
            req.params.id
        ]);

        const [projects] = await db.query(`
            SELECT
                id,
                project_code AS projectCode,
                name,
                location,
                engineer,
                budget,
                start_date AS startDate,
                completion_date AS completionDate,
                progress,
                status,
                created_at AS createdAt
            FROM projects
            WHERE id = ?
        `, [req.params.id]);

        res.json({
            success: true,
            message: "Project updated successfully",
            project: projects[0]
        });

    } catch (error) {
        console.error("Update project error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update project"
        });
    }
});


// =====================================================
// DELETE PROJECT (ADMINISTRATOR ONLY)
// =====================================================
router.delete("/:id", async (req, res) => {
    try {
        const scope = await getAuthScope(req);
        if (!scope.isAdmin) {
            return res.status(403).json({
                success: false,
                error: "Access Denied: Only Administrators can delete projects."
            });
        }

        const [projects] = await db.query(
            `SELECT * FROM projects WHERE id = ?`,
            [req.params.id]
        );

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Project not found"
            });
        }

        await db.query(
            `DELETE FROM projects WHERE id = ?`,
            [req.params.id]
        );

        res.json({
            success: true,
            message: "Project deleted successfully"
        });

    } catch (error) {
        console.error("Delete project error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete project"
        });
    }
});

module.exports = router;