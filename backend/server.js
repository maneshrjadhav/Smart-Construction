// =====================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// SERVER
// =====================================================

require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");
const path = require("path");


// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/auth");
const projectsRoutes = require("./routes/projects");
const workersRoutes = require("./routes/workers");
const engineersRoutes = require("./routes/engineers");
const tasksRoutes = require("./routes/tasks");
const attendanceRoutes = require("./routes/attendance");
const payrollRoutes = require("./routes/payroll");
const materialsRoutes = require("./routes/materials");
const issuesRoutes = require("./routes/issues");
const progressRoutes = require("./routes/progress");
const allocationsRoutes = require("./routes/allocations");
const paymentsRoutes = require("./routes/payments");
const financialsRoutes = require("./routes/financials");
const engineerAttendanceRoutes = require("./routes/engineerAttendance");


// =====================================================
// APP
// =====================================================

const app = express();

const PORT =
    process.env.PORT || 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// =====================================================
// FRONTEND & STATIC ASSETS
// =====================================================

const fs = require("fs");
const distPath = path.join(__dirname, "../frontend/dist");
const frontendPath = path.join(__dirname, "../frontend");

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}
app.use(express.static(frontendPath));


// =====================================================
// API HOME
// =====================================================

app.get(
    "/api",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Smart Construction Management System API",

            status:
                "running",

            port:
                PORT

        });

    }
);


// =====================================================
// AUTH API
// =====================================================

app.use(
    "/api/auth",
    authRoutes
);


// =====================================================
// PROJECTS API
// =====================================================

app.use(
    "/api/projects",
    projectsRoutes
);


// =====================================================
// WORKERS API
// =====================================================

app.use(
    "/api/workers",
    workersRoutes
);


// =====================================================
// ENGINEERS API
// ADMINISTRATOR MANAGES ENGINEERS
// =====================================================

app.use(
    "/api/engineers",
    engineersRoutes
);


// =====================================================
// TASKS API
// =====================================================

app.use(
    "/api/tasks",
    tasksRoutes
);


// =====================================================
// ATTENDANCE API
// =====================================================

app.use(
    "/api/attendance",
    attendanceRoutes
);


// =====================================================
// PAYROLL API
// =====================================================

app.use(
    "/api/payroll",
    payrollRoutes
);


// =====================================================
// MATERIALS API
// =====================================================

app.use(
    "/api/materials",
    materialsRoutes
);


// =====================================================
// SITE ISSUES API
// =====================================================

app.use(
    "/api/issues",
    issuesRoutes
);


// =====================================================
// DAILY PROGRESS API
// =====================================================

app.use(
    "/api/progress",
    progressRoutes
);


// =====================================================
// ALLOCATIONS, PAYMENTS & FINANCIALS API
// =====================================================

app.use(
    "/api/allocations",
    allocationsRoutes
);

app.use(
    "/api/payments",
    paymentsRoutes
);

app.use(
    "/api/financials",
    financialsRoutes
);

app.use(
    "/api/engineer-attendance",
    engineerAttendanceRoutes
);


// =====================================================
// FRONTEND PAGES
// =====================================================

// =====================================================
// FRONTEND PAGES (Clean URLs & .html URLs)
// =====================================================

// SPA Fallback: React Router handles routing in frontend
app.use((req, res, next) => {
    if (req.method !== "GET" || req.originalUrl.startsWith("/api/")) {
        return next();
    }
    const distIndex = path.join(distPath, "index.html");
    if (fs.existsSync(distIndex)) {
        return res.sendFile(distIndex);
    }
    const legacyIndex = path.join(frontendPath, "index.html");
    if (fs.existsSync(legacyIndex)) {
        return res.sendFile(legacyIndex);
    }
    next();
});


// =====================================================
// API 404
// =====================================================

app.use(
    (req, res, next) => {

        if (
            req.originalUrl.startsWith(
                "/api/"
            )
        ) {

            return res
                .status(404)
                .json({

                    success: false,

                    error:
                        "API endpoint not found"

                });

        }

        next();

    }
);


// =====================================================
// FRONTEND 404
// =====================================================

app.use(
    (req, res) => {

        res.status(404).send(`

            <!DOCTYPE html>

            <html>

            <head>

                <title>
                    404 - Page Not Found
                </title>

                <style>

                    body {
                        font-family: Arial, sans-serif;
                        background: #f5f8fa;
                        text-align: center;
                        padding: 80px;
                        color: #123;
                    }

                    h1 {
                        font-size: 40px;
                        margin-bottom: 10px;
                    }

                    p {
                        color: #71808a;
                    }

                    a {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 22px;
                        background: #159fc1;
                        color: white;
                        text-decoration: none;
                        border-radius: 7px;
                    }

                </style>

            </head>

            <body>

                <h1>
                    404
                </h1>

                <p>
                    Page not found.
                </p>

                <p>
                    Smart Construction Management System
                </p>

                <a href="/login">
                    Go to Login
                </a>

            </body>

            </html>

        `);

    }
);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "================================="
        );

        console.error(
            "SERVER ERROR"
        );

        console.error(
            err
        );

        console.error(
            "================================="
        );


        if (
            res.headersSent
        ) {

            return next(err);

        }


        res
            .status(500)
            .json({

                success: false,

                error:
                    "Internal server error"

            });

    }
);


// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "================================="
        );

        console.log(
            " SMART CONSTRUCTION MANAGEMENT"
        );

        console.log(
            "================================="
        );

        console.log(
            `Server running on http://localhost:${PORT}`
        );

        console.log(
            `Login: http://localhost:${PORT}/login`
        );

        console.log(
            `Dashboard: http://localhost:${PORT}/dashboard`
        );

        console.log(
            `Workers: http://localhost:${PORT}/workers`
        );

        console.log(
            `Engineers API: http://localhost:${PORT}/api/engineers`
        );

        console.log(
            `API: http://localhost:${PORT}/api`
        );

        console.log(
            "================================="
        );

        console.log("");

    }
);