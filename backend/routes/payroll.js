const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

// Enforce Administrator role for all Payroll endpoints
router.use(authenticateToken);
router.use(requireRole(["Administrator"]));

// ================= GET ALL PAYROLL =================

router.get("/", async (req, res) => {
    try {

        const [payroll] = await db.query(`
            SELECT
                id,
                worker_name,
                salary_month,
                working_days,
                daily_wage,
                total_salary,
                status,
                created_at
            FROM payroll
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            count: payroll.length,
            payroll: payroll
        });

    } catch (error) {

        console.error("Get payroll error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to fetch payroll."
        });
    }
});


// ================= ADD PAYROLL =================

router.post("/", async (req, res) => {
    try {

        console.log("PAYROLL RECEIVED:", req.body);

        const {
            worker_name,
            salary_month,
            working_days,
            daily_wage,
            total_salary,
            status
        } = req.body;


        if (
            !worker_name ||
            !salary_month ||
            !working_days ||
            !daily_wage
        ) {
            return res.status(400).json({
                success: false,
                error: "Worker, month, working days and daily wage are required."
            });
        }


        const calculatedSalary =
            Number(working_days) * Number(daily_wage);

        const finalSalary =
            Number(total_salary) || calculatedSalary;


        const [result] = await db.query(`
            INSERT INTO payroll
            (
                worker_name,
                salary_month,
                working_days,
                daily_wage,
                total_salary,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            worker_name,
            salary_month,
            Number(working_days),
            Number(daily_wage),
            finalSalary,
            status || "Pending"
        ]);


        const [payroll] = await db.query(`
            SELECT
                id,
                worker_name,
                salary_month,
                working_days,
                daily_wage,
                total_salary,
                status,
                created_at
            FROM payroll
            WHERE id = ?
        `, [result.insertId]);


        console.log("PAYROLL ADDED:", payroll[0]);


        res.status(201).json({
            success: true,
            message: "Payroll added successfully.",
            payroll: payroll[0]
        });

    } catch (error) {

        console.error("Add payroll error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to add payroll."
        });
    }
});


// ================= UPDATE PAYROLL =================

router.put("/:id", async (req, res) => {
    try {
        const [existing] = await db.query(`SELECT * FROM payroll WHERE id = ?`, [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: "Payroll record not found." });
        }

        const current = existing[0];
        const worker_name = req.body.worker_name !== undefined ? req.body.worker_name : current.worker_name;
        const salary_month = req.body.salary_month !== undefined ? req.body.salary_month : current.salary_month;
        const working_days = req.body.working_days !== undefined ? Number(req.body.working_days) : current.working_days;
        const daily_wage = req.body.daily_wage !== undefined ? Number(req.body.daily_wage) : current.daily_wage;
        const total_salary = req.body.total_salary !== undefined ? Number(req.body.total_salary) : (working_days * daily_wage);
        const status = req.body.status !== undefined ? req.body.status : current.status;

        await db.query(`
            UPDATE payroll
            SET worker_name = ?, salary_month = ?, working_days = ?, daily_wage = ?, total_salary = ?, status = ?
            WHERE id = ?
        `, [worker_name, salary_month, working_days, daily_wage, total_salary, status, req.params.id]);

        const [updated] = await db.query(`SELECT * FROM payroll WHERE id = ?`, [req.params.id]);

        res.json({
            success: true,
            message: "Payroll updated successfully.",
            payroll: updated[0]
        });
    } catch (error) {
        console.error("Update payroll error:", error);
        res.status(500).json({ success: false, error: "Failed to update payroll." });
    }
});


// ================= DELETE PAYROLL =================

router.delete("/:id", async (req, res) => {
    try {

        const [payroll] = await db.query(
            `SELECT * FROM payroll WHERE id = ?`,
            [req.params.id]
        );


        if (payroll.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Payroll record not found."
            });
        }


        await db.query(
            `DELETE FROM payroll WHERE id = ?`,
            [req.params.id]
        );


        res.json({
            success: true,
            message: "Payroll deleted successfully."
        });

    } catch (error) {

        console.error("Delete payroll error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to delete payroll."
        });
    }
});


module.exports = router;