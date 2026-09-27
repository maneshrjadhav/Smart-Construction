require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const pool = require("./database");

async function migrate() {
    const conn = await pool.getConnection();
    try {
        console.log("==================================================");
        console.log("Running Safe Non-Destructive Database Migration...");
        console.log("==================================================");

        // 1. Inspect engineers table columns
        const [engCols] = await conn.query("DESCRIBE engineers");
        const engColNames = engCols.map(c => c.Field);

        if (!engColNames.includes("email")) {
            console.log("Adding email column to engineers table...");
            await conn.query("ALTER TABLE engineers ADD COLUMN email VARCHAR(150) NULL AFTER full_name");
            console.log("✓ Added email column to engineers");
        } else {
            console.log("✓ engineers.email column exists");
        }

        if (!engColNames.includes("must_change_password")) {
            console.log("Adding must_change_password column to engineers table...");
            await conn.query("ALTER TABLE engineers ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0");
            console.log("✓ Added must_change_password column to engineers");
        } else {
            console.log("✓ engineers.must_change_password column exists");
        }

        if (!engColNames.includes("last_login")) {
            console.log("Adding last_login column to engineers table...");
            await conn.query("ALTER TABLE engineers ADD COLUMN last_login DATETIME NULL");
            console.log("✓ Added last_login column to engineers");
        } else {
            console.log("✓ engineers.last_login column exists");
        }

        // 2. Inspect users table columns
        const [userCols] = await conn.query("DESCRIBE users");
        const userColNames = userCols.map(c => c.Field);

        if (!userColNames.includes("must_change_password")) {
            console.log("Adding must_change_password column to users table...");
            await conn.query("ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0");
            console.log("✓ Added must_change_password column to users");
        } else {
            console.log("✓ users.must_change_password column exists");
        }

        // 3. Inspect MFA columns in users table
        if (!userColNames.includes("mfa_enabled")) {
            await conn.query("ALTER TABLE users ADD COLUMN mfa_enabled TINYINT(1) NOT NULL DEFAULT 0");
            console.log("✓ Added mfa_enabled column to users");
        }
        if (!userColNames.includes("mfa_secret")) {
            await conn.query("ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255) NULL");
            console.log("✓ Added mfa_secret column to users");
        }
        if (!userColNames.includes("mfa_verified_at")) {
            await conn.query("ALTER TABLE users ADD COLUMN mfa_verified_at DATETIME NULL");
            console.log("✓ Added mfa_verified_at column to users");
        }
        if (!userColNames.includes("mfa_recovery_codes")) {
            await conn.query("ALTER TABLE users ADD COLUMN mfa_recovery_codes TEXT NULL");
            console.log("✓ Added mfa_recovery_codes column to users");
        }

        console.log("==================================================");
        console.log("Safe Database Migration Completed Successfully!");
        console.log("All existing users and data were preserved.");
        console.log("==================================================");
    } catch (err) {
        console.error("Migration error:", err.message);
        throw err;
    } finally {
        conn.release();
    }
}

migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
