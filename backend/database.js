const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Local / Render database path
const dbPath =
    process.env.DB_PATH ||
    path.join(__dirname, "../database/smart_construction.db");

// Make sure database folder exists
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

console.log("=================================");
console.log("SQLite Database");
console.log(`Database: ${dbPath}`);
console.log("=================================");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("SQLite Connection Failed:", err.message);
    } else {
        console.log("SQLite Database Connected");
    }
});

/*
|--------------------------------------------------------------------------
| MySQL-style query compatibility
|--------------------------------------------------------------------------
| Existing project files may use:
|
| pool.query(sql, params)
|
| So we provide a similar interface for SQLite.
*/

const database = {
    query(sql, params = []) {
        return new Promise((resolve, reject) => {

            const trimmedSql = sql.trim().toLowerCase();

            // SELECT
            if (
                trimmedSql.startsWith("select") ||
                trimmedSql.startsWith("pragma")
            ) {
                db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve([rows, []]);
                    }
                });

                return;
            }

            // INSERT / UPDATE / DELETE
            db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve([
                        {
                            affectedRows: this.changes,
                            insertId: this.lastID,
                            changes: this.changes
                        },
                        []
                    ]);
                }
            });
        });
    },

    execute(sql, params = []) {
        return this.query(sql, params);
    },

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    },

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    close() {
        return new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
};

module.exports = database;