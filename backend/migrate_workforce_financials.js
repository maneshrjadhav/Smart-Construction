// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// SAFE NON-DESTRUCTIVE DATABASE MIGRATION: WORKFORCE, ENGINEER & PAYMENTS
// ======================================================================

require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const pool = require("./database");

async function runMigration() {
    const conn = await pool.getConnection();
    try {
        console.log("==================================================");
        console.log("Starting Safe Non-Destructive Migration...");
        console.log("Preserving all existing data and tables.");
        console.log("==================================================");

        // ----------------------------------------------------
        // 1. EXTEND 'workers' TABLE
        // ----------------------------------------------------
        const [workerCols] = await conn.query("DESCRIBE workers");
        const existingWorkerCols = workerCols.map(c => c.Field.toLowerCase());

        const newWorkerCols = [
            { name: "profile_photo", sql: "ADD COLUMN profile_photo TEXT NULL" },
            { name: "dob", sql: "ADD COLUMN dob DATE NULL" },
            { name: "gender", sql: "ADD COLUMN gender VARCHAR(20) NULL" },
            { name: "alternate_phone", sql: "ADD COLUMN alternate_phone VARCHAR(20) NULL" },
            { name: "address", sql: "ADD COLUMN address TEXT NULL" },
            { name: "emergency_contact_name", sql: "ADD COLUMN emergency_contact_name VARCHAR(150) NULL" },
            { name: "emergency_contact_phone", sql: "ADD COLUMN emergency_contact_phone VARCHAR(20) NULL" },
            { name: "blood_group", sql: "ADD COLUMN blood_group VARCHAR(10) NULL" },
            { name: "worker_type", sql: "ADD COLUMN worker_type VARCHAR(50) DEFAULT 'Skilled'" },
            { name: "trade", sql: "ADD COLUMN trade VARCHAR(100) NULL" },
            { name: "designation", sql: "ADD COLUMN designation VARCHAR(100) NULL" },
            { name: "joining_date", sql: "ADD COLUMN joining_date DATE NULL" },
            { name: "employment_type", sql: "ADD COLUMN employment_type VARCHAR(50) DEFAULT 'Daily Wage'" },
            { name: "experience", sql: "ADD COLUMN experience VARCHAR(100) NULL" },
            { name: "previous_employer", sql: "ADD COLUMN previous_employer VARCHAR(150) NULL" },
            { name: "engineer_id", sql: "ADD COLUMN engineer_id INT NULL" },
            { name: "work_area", sql: "ADD COLUMN work_area VARCHAR(150) NULL" },
            { name: "shift", sql: "ADD COLUMN shift VARCHAR(50) DEFAULT 'General'" },
            { name: "assignment_date", sql: "ADD COLUMN assignment_date DATE NULL" },
            { name: "assignment_status", sql: "ADD COLUMN assignment_status VARCHAR(50) DEFAULT 'Active'" },
            { name: "wage_type", sql: "ADD COLUMN wage_type VARCHAR(50) DEFAULT 'Daily'" },
            { name: "overtime_rate", sql: "ADD COLUMN overtime_rate DECIMAL(12,2) DEFAULT 0.00" },
            { name: "overtime_eligible", sql: "ADD COLUMN overtime_eligible TINYINT(1) DEFAULT 1" },
            { name: "payment_method", sql: "ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash'" },
            { name: "bank_name", sql: "ADD COLUMN bank_name VARCHAR(150) NULL" },
            { name: "account_number", sql: "ADD COLUMN account_number VARCHAR(100) NULL" },
            { name: "ifsc_code", sql: "ADD COLUMN ifsc_code VARCHAR(50) NULL" },
            { name: "upi_id", sql: "ADD COLUMN upi_id VARCHAR(100) NULL" },
            { name: "payment_status", sql: "ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Paid'" }
        ];

        for (const col of newWorkerCols) {
            if (!existingWorkerCols.includes(col.name.toLowerCase())) {
                console.log(`Adding column '${col.name}' to workers table...`);
                await conn.query(`ALTER TABLE workers ${col.sql}`);
                console.log(`✓ Added '${col.name}' to workers`);
            } else {
                console.log(`✓ workers.${col.name} already exists`);
            }
        }

        // ----------------------------------------------------
        // 2. EXTEND 'attendance' TABLE
        // ----------------------------------------------------
        const [attCols] = await conn.query("DESCRIBE attendance");
        const existingAttCols = attCols.map(c => c.Field.toLowerCase());

        const newAttCols = [
            { name: "project_id", sql: "ADD COLUMN project_id INT NULL" },
            { name: "engineer_id", sql: "ADD COLUMN engineer_id INT NULL" },
            { name: "check_in", sql: "ADD COLUMN check_in VARCHAR(20) NULL" },
            { name: "check_out", sql: "ADD COLUMN check_out VARCHAR(20) NULL" },
            { name: "working_hours", sql: "ADD COLUMN working_hours DECIMAL(5,2) DEFAULT 8.00" },
            { name: "remarks", sql: "ADD COLUMN remarks TEXT NULL" }
        ];

        for (const col of newAttCols) {
            if (!existingAttCols.includes(col.name.toLowerCase())) {
                console.log(`Adding column '${col.name}' to attendance table...`);
                await conn.query(`ALTER TABLE attendance ${col.sql}`);
                console.log(`✓ Added '${col.name}' to attendance`);
            } else {
                console.log(`✓ attendance.${col.name} already exists`);
            }
        }

        // ----------------------------------------------------
        // 3. EXTEND 'materials' TABLE
        // ----------------------------------------------------
        const [matCols] = await conn.query("DESCRIBE materials");
        const existingMatCols = matCols.map(c => c.Field.toLowerCase());

        if (!existingMatCols.includes("project_id")) {
            console.log("Adding column 'project_id' to materials table...");
            await conn.query("ALTER TABLE materials ADD COLUMN project_id INT NULL");
            console.log("✓ Added 'project_id' to materials");
        } else {
            console.log("✓ materials.project_id already exists");
        }

        // ----------------------------------------------------
        // 4. CREATE 'engineer_allocations' TABLE
        // ----------------------------------------------------
        await conn.query(`
            CREATE TABLE IF NOT EXISTS engineer_allocations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                engineer_id INT NOT NULL,
                allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                amount_paid_to_engineer DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                notes TEXT NULL,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_alloc_proj (project_id),
                INDEX idx_alloc_eng (engineer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✓ Checked/created 'engineer_allocations' table");

        // ----------------------------------------------------
        // 5. CREATE 'worker_payments' TABLE
        // ----------------------------------------------------
        await conn.query(`
            CREATE TABLE IF NOT EXISTS worker_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_code VARCHAR(50) NOT NULL UNIQUE,
                worker_id INT NOT NULL,
                worker_name VARCHAR(150) NOT NULL,
                engineer_id INT NOT NULL,
                project_id INT NOT NULL,
                payment_date DATE NOT NULL,
                salary_period VARCHAR(50) NULL,
                working_days DECIMAL(6,2) NOT NULL DEFAULT 0.00,
                daily_wage DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                overtime_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                deductions DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                net_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                payment_status VARCHAR(50) NOT NULL DEFAULT 'Paid',
                payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
                reference_number VARCHAR(100) NULL,
                remarks TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_wp_worker (worker_id),
                INDEX idx_wp_eng (engineer_id),
                INDEX idx_wp_proj (project_id),
                INDEX idx_wp_date (payment_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✓ Checked/created 'worker_payments' table");

        // ----------------------------------------------------
        // 6. CREATE 'worker_work_history' TABLE
        // ----------------------------------------------------
        await conn.query(`
            CREATE TABLE IF NOT EXISTS worker_work_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                worker_id INT NOT NULL,
                project_id INT NULL,
                engineer_id INT NULL,
                work_role VARCHAR(100) NULL,
                work_area VARCHAR(150) NULL,
                shift VARCHAR(50) DEFAULT 'General',
                start_date DATE NOT NULL,
                end_date DATE NULL,
                status VARCHAR(50) DEFAULT 'Active',
                remarks TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_wwh_worker (worker_id),
                INDEX idx_wwh_proj (project_id),
                INDEX idx_wwh_eng (engineer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✓ Checked/created 'worker_work_history' table");

        // ----------------------------------------------------
        // 7. CREATE 'worker_documents' TABLE
        // ----------------------------------------------------
        await conn.query(`
            CREATE TABLE IF NOT EXISTS worker_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                worker_id INT NOT NULL,
                document_name VARCHAR(200) NOT NULL,
                document_type VARCHAR(100) NOT NULL,
                issue_date DATE NULL,
                expiry_date DATE NULL,
                file_url TEXT NULL,
                file_name VARCHAR(255) NULL,
                file_size INT NULL,
                status VARCHAR(50) DEFAULT 'Valid',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_wdoc_worker (worker_id),
                INDEX idx_wdoc_expiry (expiry_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✓ Checked/created 'worker_documents' table");

        // ----------------------------------------------------
        // 8. CREATE 'project_expenses' TABLE
        // ----------------------------------------------------
        await conn.query(`
            CREATE TABLE IF NOT EXISTS project_expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                expense_category VARCHAR(100) NOT NULL,
                amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                expense_date DATE NOT NULL,
                approved_by INT NULL,
                description TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_pe_proj (project_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✓ Checked/created 'project_expenses' table");

        // ----------------------------------------------------
        // 9. BACKFILL INITIAL WORK HISTORY FOR EXISTING WORKERS
        // ----------------------------------------------------
        const [workers] = await conn.query("SELECT id, role, project_id, engineer_id, created_at FROM workers");
        for (const w of workers) {
            const [history] = await conn.query("SELECT id FROM worker_work_history WHERE worker_id = ? LIMIT 1", [w.id]);
            if (history.length === 0) {
                const startDate = w.created_at ? new Date(w.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
                await conn.query(`
                    INSERT INTO worker_work_history (worker_id, project_id, engineer_id, work_role, start_date, status, remarks)
                    VALUES (?, ?, ?, ?, ?, 'Active', 'Initial system migration record')
                `, [w.id, w.project_id || null, w.engineer_id || null, w.role || 'Worker', startDate]);
            }
        }
        console.log("✓ Synchronized baseline work history for existing workers");

        // ----------------------------------------------------
        // 10. BACKFILL BASELINE ALLOCATIONS FOR ASSIGNED ENGINEERS
        // ----------------------------------------------------
        // If an engineer is assigned to a project and has no allocation, create a baseline allocation record
        const [assignedEngineers] = await conn.query(`
            SELECT e.id AS engineer_id, e.project_id, p.budget
            FROM engineers e
            JOIN projects p ON p.id = e.project_id
            WHERE e.project_id IS NOT NULL
        `);

        for (const ae of assignedEngineers) {
            const [existingAlloc] = await conn.query(`
                SELECT id FROM engineer_allocations
                WHERE project_id = ? AND engineer_id = ?
                LIMIT 1
            `, [ae.project_id, ae.engineer_id]);

            if (existingAlloc.length === 0) {
                // Give a conservative baseline allocation (e.g., 20% of project budget or 100,000)
                const defaultAlloc = Math.min(100000, Number(ae.budget || 500000) * 0.2);
                await conn.query(`
                    INSERT INTO engineer_allocations (project_id, engineer_id, allocated_amount, amount_paid_to_engineer, notes)
                    VALUES (?, ?, ?, ?, 'Initial baseline project allocation')
                `, [ae.project_id, ae.engineer_id, defaultAlloc, defaultAlloc]);
                console.log(`✓ Initialized baseline allocation for Engineer ID ${ae.engineer_id} on Project ID ${ae.project_id}`);
            }
        }

        console.log("==================================================");
        console.log("Safe Migration Completed Successfully!");
        console.log("All existing data and tables preserved.");
        console.log("==================================================");

    } catch (err) {
        console.error("Migration failed:", err);
        throw err;
    } finally {
        conn.release();
    }
}

runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));

