const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);


// ================= GET ALL TASKS =================

router.get("/", async (req, res) => {
    try {
        const [tasks] = await db.query(`
            SELECT
                id,
                task_name,
                project,
                assigned_to,
                due_date,
                priority,
                status,
                created_at
            FROM tasks
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            count: tasks.length,
            tasks: tasks
        });

    } catch (error) {
        console.error("Get tasks error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to fetch tasks."
        });
    }
});


// ================= ADD TASK =================

router.post("/", async (req, res) => {
    try {

        console.log("TASK DATA RECEIVED:", req.body);

        const task_name =
            req.body.task_name ||
            req.body.name ||
            req.body.taskName;

        const project =
            req.body.project ||
            req.body.project_name;

        const assigned_to =
            req.body.assigned_to ||
            req.body.assignedTo;

        const due_date =
            req.body.due_date ||
            req.body.dueDate;

        const priority =
            req.body.priority || "Medium";

        const status =
            req.body.status || "Pending";


        if (!task_name || !project || !assigned_to || !due_date) {
            return res.status(400).json({
                success: false,
                error: "Please fill all required task details.",
                received: req.body
            });
        }


        // INSERT TASK

        const [result] = await db.query(`
            INSERT INTO tasks
            (
                task_name,
                project,
                assigned_to,
                due_date,
                priority,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            task_name,
            project,
            assigned_to,
            due_date,
            priority,
            status
        ]);


        // GET CREATED TASK

        const [tasks] = await db.query(`
            SELECT
                id,
                task_name,
                project,
                assigned_to,
                due_date,
                priority,
                status,
                created_at
            FROM tasks
            WHERE id = ?
        `, [result.insertId]);


        console.log("TASK ADDED:", tasks[0]);


        res.status(201).json({
            success: true,
            message: "Task added successfully.",
            task: tasks[0]
        });

    } catch (error) {

        console.error("Add task error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to add task."
        });
    }
});


// ================= UPDATE TASK =================

router.put("/:id", async (req, res) => {
    try {
        const [existing] = await db.query(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: "Task not found." });
        }

        const current = existing[0];
        const task_name = req.body.task_name !== undefined ? req.body.task_name : current.task_name;
        const project = req.body.project !== undefined ? req.body.project : current.project;
        const assigned_to = req.body.assigned_to !== undefined ? req.body.assigned_to : current.assigned_to;
        const due_date = req.body.due_date !== undefined ? req.body.due_date : current.due_date;
        const priority = req.body.priority !== undefined ? req.body.priority : current.priority;
        const status = req.body.status !== undefined ? req.body.status : current.status;

        await db.query(`
            UPDATE tasks
            SET task_name = ?, project = ?, assigned_to = ?, due_date = ?, priority = ?, status = ?
            WHERE id = ?
        `, [task_name, project, assigned_to, due_date, priority, status, req.params.id]);

        const [updated] = await db.query(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);

        res.json({
            success: true,
            message: "Task updated successfully.",
            task: updated[0]
        });
    } catch (error) {
        console.error("Update task error:", error);
        res.status(500).json({ success: false, error: "Failed to update task." });
    }
});


// ================= DELETE TASK =================

router.delete("/:id", async (req, res) => {
    try {

        const [tasks] = await db.query(
            `SELECT * FROM tasks WHERE id = ?`,
            [req.params.id]
        );


        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Task not found."
            });
        }


        await db.query(
            `DELETE FROM tasks WHERE id = ?`,
            [req.params.id]
        );


        res.json({
            success: true,
            message: "Task deleted successfully."
        });

    } catch (error) {

        console.error("Delete task error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to delete task."
        });
    }
});


module.exports = router;