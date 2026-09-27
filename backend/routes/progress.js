const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);


// ================= GET ALL PROGRESS =================

router.get("/", async (req, res) => {
    try {

        const [progress] = await db.query(`
            SELECT
                id,
                date,
                project,
                work_completed,
                progress_percent,
                workers_deployed,
                status,
                remarks,
                created_at
            FROM progress
            ORDER BY date DESC, id DESC
        `);

        res.json({
            success: true,
            count: progress.length,
            progress: progress
        });

    } catch (error) {

        console.error("Get progress error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to fetch progress."
        });
    }
});


// ================= ADD PROGRESS =================

router.post("/", async (req, res) => {
    try {

        console.log("PROGRESS RECEIVED:", req.body);

        const {
            date,
            project,
            work_completed,
            progress_percent,
            workers_deployed,
            status,
            remarks
        } = req.body;


        // Validation

        if (
            !date ||
            !project ||
            !work_completed ||
            progress_percent === undefined
        ) {
            return res.status(400).json({
                success: false,
                error: "Please fill all required progress details."
            });
        }


        const progressValue =
            Number(progress_percent);


        if (
            isNaN(progressValue) ||
            progressValue < 0 ||
            progressValue > 100
        ) {
            return res.status(400).json({
                success: false,
                error: "Progress must be between 0 and 100."
            });
        }


        // Insert progress report

        const [result] = await db.query(`
            INSERT INTO progress
            (
                date,
                project,
                work_completed,
                progress_percent,
                workers_deployed,
                status,
                remarks
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            date,
            project,
            work_completed,
            progressValue,
            Number(workers_deployed) || 0,
            status || "In Progress",
            remarks || ""
        ]);


        // Get created report

        const [progress] = await db.query(`
            SELECT
                id,
                date,
                project,
                work_completed,
                progress_percent,
                workers_deployed,
                status,
                remarks,
                created_at
            FROM progress
            WHERE id = ?
        `, [result.insertId]);


        console.log("PROGRESS ADDED:", progress[0]);


        res.status(201).json({
            success: true,
            message: "Daily progress saved successfully.",
            progress: progress[0]
        });

    } catch (error) {

        console.error("Add progress error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to save daily progress."
        });
    }
});


// ================= UPDATE PROGRESS =================

router.put("/:id", async (req, res) => {
    try {
        const [existing] = await db.query(`SELECT * FROM progress WHERE id = ?`, [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: "Progress report not found." });
        }

        const current = existing[0];
        const date = req.body.date !== undefined ? req.body.date : current.date;
        const project = req.body.project !== undefined ? req.body.project : current.project;
        const work_completed = req.body.work_completed !== undefined ? req.body.work_completed : current.work_completed;
        const progress_percent = req.body.progress_percent !== undefined ? Number(req.body.progress_percent) : current.progress_percent;
        const workers_deployed = req.body.workers_deployed !== undefined ? Number(req.body.workers_deployed) : current.workers_deployed;
        const status = req.body.status !== undefined ? req.body.status : current.status;
        const remarks = req.body.remarks !== undefined ? req.body.remarks : current.remarks;

        await db.query(`
            UPDATE progress
            SET date = ?, project = ?, work_completed = ?, progress_percent = ?, workers_deployed = ?, status = ?, remarks = ?
            WHERE id = ?
        `, [date, project, work_completed, progress_percent, workers_deployed, status, remarks, req.params.id]);

        const [updated] = await db.query(`SELECT * FROM progress WHERE id = ?`, [req.params.id]);

        res.json({
            success: true,
            message: "Progress report updated successfully.",
            progress: updated[0]
        });
    } catch (error) {
        console.error("Update progress error:", error);
        res.status(500).json({ success: false, error: "Failed to update daily progress." });
    }
});


// ================= DELETE PROGRESS =================

router.delete("/:id", async (req, res) => {
    try {

        const [progress] = await db.query(
            `SELECT * FROM progress WHERE id = ?`,
            [req.params.id]
        );


        if (progress.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Progress report not found."
            });
        }


        await db.query(
            `DELETE FROM progress WHERE id = ?`,
            [req.params.id]
        );


        res.json({
            success: true,
            message: "Progress report deleted successfully."
        });

    } catch (error) {

        console.error("Delete progress error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to delete progress."
        });
    }
});


module.exports = router;