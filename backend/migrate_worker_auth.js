// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// DATABASE MIGRATION: WORKER AUTHENTICATION & USER LINKING
// ======================================================================

const bcrypt = require("bcryptjs");
const db = require("./database");

async function migrateWorkerAuth() {
  console.log("--------------------------------------------------");
  console.log("Starting Worker Auth Migration...");
  console.log("--------------------------------------------------");

  const connection = await db.getConnection();
  try {
    // 1. Check if user_id column exists in workers table
    const [workerCols] = await connection.query("DESCRIBE workers");
    const hasUserId = workerCols.some(c => c.Field === "user_id");

    if (!hasUserId) {
      console.log("Adding 'user_id' column to 'workers' table...");
      await connection.query(`
        ALTER TABLE workers 
        ADD COLUMN user_id INT NULL UNIQUE AFTER id
      `);
      console.log("✓ 'user_id' column added to 'workers'");
    } else {
      console.log("✓ 'user_id' column already exists in 'workers'");
    }

    // 2. Fetch all workers
    const [workers] = await connection.query(`
      SELECT id, worker_code, name, phone, email, status, user_id 
      FROM workers
    `);
    console.log(`Found ${workers.length} workers in database.`);

    const defaultPasswordHash = await bcrypt.hash("Worker@123", 10);

    for (const w of workers) {
      if (w.user_id) {
        // Verify user account exists
        const [existingUser] = await connection.query(
          "SELECT id, email, role FROM users WHERE id = ?",
          [w.user_id]
        );
        if (existingUser.length > 0) {
          console.log(`Worker ${w.worker_code} (${w.name}) already linked to user id ${w.user_id}`);
          continue;
        }
      }

      // Generate a clean email/username for worker login
      const cleanCode = (w.worker_code || `WRK-${String(w.id).padStart(3, '0')}`).toLowerCase().replace(/[^a-z0-9]/g, '');
      const candidateEmail = w.email && w.email.trim() ? w.email.trim().toLowerCase() : `${cleanCode}@smartbuild.local`;

      // Check if candidate email already exists in users
      const [existingByEmail] = await connection.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
        [candidateEmail]
      );

      let userId;
      if (existingByEmail.length > 0) {
        userId = existingByEmail[0].id;
        console.log(`Reusing existing user id ${userId} for ${w.worker_code}`);
      } else {
        const [userResult] = await connection.query(`
          INSERT INTO users (
            name, email, password, role, status, mfa_enabled, must_change_password
          ) VALUES (?, ?, ?, 'Worker', 'Active', 0, 0)
        `, [
          w.name || `Worker ${w.worker_code}`,
          candidateEmail,
          defaultPasswordHash
        ]);
        userId = userResult.insertId;
        console.log(`Created new user id ${userId} (${candidateEmail}) for ${w.worker_code}`);
      }

      // Link worker to user
      await connection.query(
        "UPDATE workers SET user_id = ? WHERE id = ?",
        [userId, w.id]
      );
      console.log(`✓ Linked worker ${w.worker_code} to user ${userId}`);
    }

    // 3. Ensure role column in users can hold 'Worker'
    console.log("Migration for worker auth completed successfully!");
    console.log("Default credentials for workers: Password = Worker@123");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    connection.release();
  }
}

migrateWorkerAuth()
  .then(() => {
    console.log("ALL DONE!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FAILED:", err);
    process.exit(1);
  });

