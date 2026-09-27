const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "smart_construction",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();

        console.log("=================================");
        console.log("MySQL Database Connected");
        console.log(`Database: ${process.env.DB_NAME || "smart_construction"}`);
        console.log("=================================");

        connection.release();
    } catch (error) {
        console.error("MySQL Connection Failed:", error.message);
    }
}

testConnection();

module.exports = pool;