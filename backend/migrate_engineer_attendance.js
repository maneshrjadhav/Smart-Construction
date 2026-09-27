// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// DATABASE MIGRATION: ENGINEER ATTENDANCE TABLE
// ======================================================================

const db = require("./database");

async function migrateEngineerAttendance() {
  console.log("--------------------------------------------------");
  console.log("Starting Engineer Attendance Table Migration...");
  console.log("--------------------------------------------------");

  const connection = await db.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS engineer_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        engineer_id INT NOT NULL,
        project_id INT NULL,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Present',
        check_in VARCHAR(20) NULL,
        check_out VARCHAR(20) NULL,
        working_hours DECIMAL(5,2) NULL DEFAULT 8.00,
        remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_engineer_date (engineer_id, date),
        INDEX idx_eng_att_engineer (engineer_id),
        INDEX idx_eng_att_project (project_id),
        INDEX idx_eng_att_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("✓ 'engineer_attendance' table verified/created successfully.");

    // Check if we should backfill sample attendance for existing engineers
    const [existingAtt] = await connection.query("SELECT COUNT(*) AS cnt FROM engineer_attendance");
    if (existingAtt[0].cnt === 0) {
      console.log("Backfilling realistic attendance for existing engineers...");
      const [engineers] = await connection.query("SELECT id, project_id FROM engineers WHERE status = 'Active'");
      
      const today = new Date();
      for (const eng of engineers) {
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const isSunday = d.getDay() === 0;
          const status = isSunday ? "Holiday" : (i === 4 ? "Half Day" : "Present");
          const checkIn = isSunday ? null : "08:55";
          const checkOut = isSunday ? null : (status === "Half Day" ? "13:30" : "18:05");
          const hours = isSunday ? 0 : (status === "Half Day" ? 4.5 : 9.1);

          await connection.query(`
            INSERT IGNORE INTO engineer_attendance 
            (engineer_id, project_id, date, status, check_in, check_out, working_hours, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            eng.id,
            eng.project_id || 1,
            dateStr,
            status,
            checkIn,
            checkOut,
            hours,
            isSunday ? "Weekly site holiday" : "Regular site supervision"
          ]);
        }
      }
      console.log("✓ Sample attendance generated for existing engineers.");
    }
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    connection.release();
  }
}

migrateEngineerAttendance()
  .then(() => {
    console.log("Engineer Attendance migration finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });

