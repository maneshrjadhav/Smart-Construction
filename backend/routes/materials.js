const express = require("express");
const db = require("../database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);


// ================= GET ALL MATERIALS =================

router.get("/", async (req, res) => {
    try {

        const [materials] = await db.query(`
            SELECT
                id,
                name,
                category,
                quantity,
                unit,
                unit_price,
                total_value,
                created_at
            FROM materials
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            count: materials.length,
            materials: materials
        });

    } catch (error) {

        console.error("Get materials error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to fetch materials."
        });
    }
});


// ================= ADD MATERIAL =================

router.post("/", async (req, res) => {
    try {

        console.log("MATERIAL RECEIVED:", req.body);

        const {
            name,
            material_name,
            category,
            quantity,
            unit,
            unit_price,
            price
        } = req.body;


        const materialName =
            name || material_name;

        const materialPrice =
            Number(unit_price || price || 0);

        const materialQuantity =
            Number(quantity);


        if (
            !materialName ||
            isNaN(materialQuantity) ||
            materialQuantity < 0 ||
            isNaN(materialPrice) ||
            materialPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                error: "Material name, quantity and unit price are required."
            });
        }


        const totalValue =
            materialQuantity * materialPrice;


        const [result] = await db.query(`
            INSERT INTO materials
            (
                name,
                category,
                quantity,
                unit,
                unit_price,
                total_value
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            materialName,
            category || "Other",
            materialQuantity,
            unit || "Pieces",
            materialPrice,
            totalValue
        ]);


        const [materials] = await db.query(`
            SELECT
                id,
                name,
                category,
                quantity,
                unit,
                unit_price,
                total_value,
                created_at
            FROM materials
            WHERE id = ?
        `, [result.insertId]);


        console.log("MATERIAL ADDED:", materials[0]);


        res.status(201).json({
            success: true,
            message: "Material added successfully.",
            material: materials[0]
        });

    } catch (error) {

        console.error("Add material error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to add material."
        });
    }
});


// ================= UPDATE MATERIAL =================

router.put("/:id", async (req, res) => {
    try {
        const [existing] = await db.query(`SELECT * FROM materials WHERE id = ?`, [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: "Material not found." });
        }

        const current = existing[0];
        const name = req.body.name !== undefined ? req.body.name : (req.body.material_name || current.name);
        const category = req.body.category !== undefined ? req.body.category : current.category;
        const quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : current.quantity;
        const unit = req.body.unit !== undefined ? req.body.unit : current.unit;
        const unit_price = req.body.unit_price !== undefined ? Number(req.body.unit_price) : current.unit_price;
        const total_value = quantity * unit_price;

        await db.query(`
            UPDATE materials
            SET name = ?, category = ?, quantity = ?, unit = ?, unit_price = ?, total_value = ?
            WHERE id = ?
        `, [name, category, quantity, unit, unit_price, total_value, req.params.id]);

        const [updated] = await db.query(`SELECT * FROM materials WHERE id = ?`, [req.params.id]);

        res.json({
            success: true,
            message: "Material updated successfully.",
            material: updated[0]
        });
    } catch (error) {
        console.error("Update material error:", error);
        res.status(500).json({ success: false, error: "Failed to update material." });
    }
});


// ================= DELETE MATERIAL =================

router.delete("/:id", async (req, res) => {
    try {

        const [materials] = await db.query(
            `SELECT * FROM materials WHERE id = ?`,
            [req.params.id]
        );


        if (materials.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Material not found."
            });
        }


        await db.query(
            `DELETE FROM materials WHERE id = ?`,
            [req.params.id]
        );


        res.json({
            success: true,
            message: "Material deleted successfully."
        });

    } catch (error) {

        console.error("Delete material error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to delete material."
        });
    }
});


module.exports = router;