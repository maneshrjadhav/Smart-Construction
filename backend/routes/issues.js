const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);


// ================= GET ALL ISSUES =================

router.get("/", async (req, res) => {
    try {

        const [issues] = await db.query(`
            SELECT
                id,
                title,
                project,
                reported_by,
                priority,
                status,
                date,
                description,
                created_at
            FROM issues
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            count: issues.length,
            issues: issues
        });

    } catch (error) {

        console.error("Get issues error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to fetch issues."
        });
    }
});


// ================= ADD ISSUE =================

router.post("/", async (req, res) => {
    try {

        console.log("ISSUE RECEIVED:", req.body);

        const {
            title,
            project,
            reported_by,
            priority,
            status,
            date,
            description
        } = req.body;


        if (
            !title ||
            !project ||
            !reported_by ||
            !date ||
            !description
        ) {
            return res.status(400).json({
                success: false,
                error: "Please fill all required issue details."
            });
        }


        const [result] = await db.query(`
            INSERT INTO issues
            (
                title,
                project,
                reported_by,
                priority,
                status,
                date,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            title,
            project,
            reported_by,
            priority || "Medium",
            status || "Open",
            date,
            description
        ]);


        const [issues] = await db.query(`
            SELECT
                id,
                title,
                project,
                reported_by,
                priority,
                status,
                date,
                description,
                created_at
            FROM issues
            WHERE id = ?
        `, [result.insertId]);


        console.log("ISSUE ADDED:", issues[0]);


        res.status(201).json({
            success: true,
            message: "Issue reported successfully.",
            issue: issues[0]
        });

    } catch (error) {

        console.error("Add issue error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to add issue."
        });
    }
});


// ================= UPDATE ISSUE =================

router.put("/:id", async (req, res) => {
    try {
        const [existing] = await db.query(`SELECT * FROM issues WHERE id = ?`, [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: "Issue not found." });
        }

        const current = existing[0];
        const title = req.body.title !== undefined ? req.body.title : current.title;
        const project = req.body.project !== undefined ? req.body.project : current.project;
        const reported_by = req.body.reported_by !== undefined ? req.body.reported_by : current.reported_by;
        const priority = req.body.priority !== undefined ? req.body.priority : current.priority;
        const status = req.body.status !== undefined ? req.body.status : current.status;
        const date = req.body.date !== undefined ? req.body.date : current.date;
        const description = req.body.description !== undefined ? req.body.description : current.description;

        await db.query(`
            UPDATE issues
            SET title = ?, project = ?, reported_by = ?, priority = ?, status = ?, date = ?, description = ?
            WHERE id = ?
        `, [title, project, reported_by, priority, status, date, description, req.params.id]);

        const [updated] = await db.query(`SELECT * FROM issues WHERE id = ?`, [req.params.id]);

        res.json({
            success: true,
            message: "Issue updated successfully.",
            issue: updated[0]
        });
    } catch (error) {
        console.error("Update issue error:", error);
        res.status(500).json({ success: false, error: "Failed to update issue." });
    }
});


// ================= DELETE ISSUE =================

router.delete("/:id", async (req, res) => {
    try {

        const [issues] = await db.query(
            `SELECT * FROM issues WHERE id = ?`,
            [req.params.id]
        );


        if (issues.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Issue not found."
            });
        }


        await db.query(
            `DELETE FROM issues WHERE id = ?`,
            [req.params.id]
        );


        res.json({
            success: true,
            message: "Issue deleted successfully."
        });

    } catch (error) {

        console.error("Delete issue error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to delete issue."
        });
    }
});


module.exports = router;