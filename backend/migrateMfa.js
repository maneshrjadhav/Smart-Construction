require('dotenv').config({ path: __dirname + '/.env' });
const pool = require('./database');

async function migrateMfa() {
    try {
        console.log("Checking users table for MFA columns...");
        const [columns] = await pool.query("SHOW COLUMNS FROM users");
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('mfa_enabled')) {
            console.log("Adding column mfa_enabled to users table...");
            await pool.query("ALTER TABLE users ADD COLUMN mfa_enabled TINYINT(1) DEFAULT 0");
            console.log("✓ Added mfa_enabled");
        } else {
            console.log("✓ Column mfa_enabled already exists");
        }

        if (!columnNames.includes('mfa_secret')) {
            console.log("Adding column mfa_secret to users table...");
            await pool.query("ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255) NULL");
            console.log("✓ Added mfa_secret");
        } else {
            console.log("✓ Column mfa_secret already exists");
        }

        if (!columnNames.includes('mfa_verified_at')) {
            console.log("Adding column mfa_verified_at to users table...");
            await pool.query("ALTER TABLE users ADD COLUMN mfa_verified_at DATETIME NULL");
            console.log("✓ Added mfa_verified_at");
        } else {
            console.log("✓ Column mfa_verified_at already exists");
        }

        if (!columnNames.includes('mfa_recovery_codes')) {
            console.log("Adding column mfa_recovery_codes to users table...");
            await pool.query("ALTER TABLE users ADD COLUMN mfa_recovery_codes TEXT NULL");
            console.log("✓ Added mfa_recovery_codes");
        } else {
            console.log("✓ Column mfa_recovery_codes already exists");
        }

        console.log("MFA migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrateMfa();

