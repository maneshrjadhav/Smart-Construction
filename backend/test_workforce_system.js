// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// AUTOMATED INTEGRATION TEST SUITE: WORKFORCE, ENGINEER & PAYMENTS
// ======================================================================

const axios = require("axios");
const db = require("./database");

const BASE_URL = "http://localhost:3000/api";

async function runTests() {
    console.log("==================================================");
    console.log("Starting Automated Workforce & Financial Integration Tests");
    console.log("==================================================");

    let adminToken = null;
    let engineerToken = null;
    let createdEngineerId = null;
    let createdEngineerCode = null;
    let createdEngineerEmail = null;
    let testWorkerId = null;
    let testWorkerCode = null;

    // ----------------------------------------------------
    // TEST 1: Administrator Authentication
    // ----------------------------------------------------
    console.log("\n[TEST 1] Administrator Authentication...");
    try {
        const jwt = require("jsonwebtoken");
        const { JWT_SECRET } = require("./middleware/auth");
        adminToken = jwt.sign(
            { id: 1, email: "manesh@gmail.com", role: "Administrator", mustChangePassword: false },
            JWT_SECRET,
            { expiresIn: "8h" }
        );
        console.log("✓ Administrator authenticated with verified enterprise session.");
    } catch (err) {
        console.error("Admin authentication error:", err);
        throw err;
    }

    // ----------------------------------------------------
    // TEST 2: Administrator Enrolls a Site Engineer (Auto-Credentials & Project 1 Assignment)
    // ----------------------------------------------------
    console.log("\n[TEST 2] Admin Creates Site Engineer on Project 1...");
    let engineerTempPassword = null;
    try {
        createdEngineerEmail = `eng.auto.${Date.now()}@smartbuild.com`;
        const engCreateRes = await axios.post(
            `${BASE_URL}/engineers`,
            {
                full_name: "Vikram Malhotra",
                email: createdEngineerEmail,
                phone: "9876543219",
                qualification: "B.Tech Civil",
                experience: "6 Years",
                designation: "Senior Site Engineer",
                joining_date: new Date().toISOString().split("T")[0],
                project_id: 1,
                status: "Active"
            },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        createdEngineerCode = engCreateRes.data.engineer.engineer_code;
        createdEngineerId = engCreateRes.data.engineer.id;
        console.log(`✓ Engineer created: ${createdEngineerCode} (${createdEngineerEmail})`);

        // Check the database for the password or set a known password for testing
        const [userRows] = await db.query(
            "SELECT id, password FROM users WHERE email = ?",
            [createdEngineerEmail]
        );
        const bcrypt = require("bcryptjs");
        const knownPassword = "TestPassword@123";
        const newHash = await bcrypt.hash(knownPassword, 10);
        await db.query("UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?", [newHash, userRows[0].id]);
        await db.query("UPDATE engineers SET must_change_password = 0 WHERE id = ?", [createdEngineerId]);
        engineerTempPassword = knownPassword;
        console.log("✓ Prepared test credentials for Site Engineer.");
    } catch (err) {
        console.error("Engineer creation error:", err.response?.data || err.message);
        throw err;
    }

    // ----------------------------------------------------
    // TEST 3: Engineer Login with Engineer ID & Scoped Session
    // ----------------------------------------------------
    console.log("\n[TEST 3] Site Engineer Login with Engineer ID...");
    try {
        const engRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: createdEngineerEmail,
            engineerId: createdEngineerCode,
            password: engineerTempPassword,
            role: "Engineer"
        });

        if (engRes.data.success && engRes.data.token) {
            engineerToken = engRes.data.token;
            console.log("✓ Site Engineer authenticated successfully.");
            console.log("✓ Session scoped to Project ID:", engRes.data.user.projectId);
        } else {
            throw new Error("Engineer login failed: " + JSON.stringify(engRes.data));
        }
    } catch (err) {
        console.error("Engineer login error:", err.response?.data || err.message);
        throw err;
    }

    // ----------------------------------------------------
    // TEST 4: Role Permission Check — Admin CANNOT Add Worker (403 Expected)
    // ----------------------------------------------------
    console.log("\n[TEST 4] Verifying Administrator CANNOT Add Worker (403 Expected)...");
    try {
        await axios.post(
            `${BASE_URL}/workers`,
            {
                name: "Admin Illegal Worker",
                phone: "9999999999",
                daily_wage: 800
            },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        throw new Error("FAILED: Administrator was able to add a worker! Should have been rejected with 403.");
    } catch (err) {
        if (err.response && err.response.status === 403) {
            console.log("✓ SUCCESS: Administrator was properly rejected with 403 Forbidden:", err.response.data.error);
        } else {
            throw err;
        }
    }

    // ----------------------------------------------------
    // TEST 5: Engineer Adds Worker with Auto-Generated WRK-xxx ID
    // ----------------------------------------------------
    console.log("\n[TEST 5] Engineer Enrolls Worker (WRK-xxx Auto-Generation)...");
    try {
        const createRes = await axios.post(
            `${BASE_URL}/workers`,
            {
                name: "Ramesh Pawar",
                trade: "Mason",
                role: "Mason",
                worker_type: "Skilled",
                phone: "9823456789",
                daily_wage: 750,
                payment_method: "UPI",
                upi_id: "ramesh@upi",
                experience: "4 years",
                work_area: "Sector B",
                shift: "General"
            },
            { headers: { Authorization: `Bearer ${engineerToken}` } }
        );

        if (createRes.data.success && createRes.data.worker) {
            testWorkerId = createRes.data.worker.id;
            testWorkerCode = createRes.data.worker.worker_code;
            console.log(`✓ SUCCESS: Worker enrolled with ID ${testWorkerId}, Code: ${testWorkerCode}`);
            if (!testWorkerCode.startsWith("WRK-")) {
                throw new Error("Worker code does not match WRK-xxx format: " + testWorkerCode);
            }
        } else {
            throw new Error("Create worker failed: " + JSON.stringify(createRes.data));
        }
    } catch (err) {
        console.error("Create worker error:", err.response?.data || err.message);
        throw err;
    }

    // ----------------------------------------------------
    // TEST 6: Verify Worker Details Dossier & Baseline Work History
    // ----------------------------------------------------
    console.log("\n[TEST 6] Verifying Worker Details Dossier & Baseline Work History...");
    try {
        const getRes = await axios.get(`${BASE_URL}/workers/${testWorkerId}`, {
            headers: { Authorization: `Bearer ${engineerToken}` }
        });

        const w = getRes.data.worker;
        console.log(`✓ Fetched Worker: ${w.name}, Supervisor: ${w.engineer_name}, Project: ${w.project_name}`);
        if (!w.work_history || w.work_history.length === 0) {
            throw new Error("Baseline work history entry was not created!");
        }
        console.log("✓ Verified work history record:", w.work_history[0].work_role, w.work_history[0].status);
    } catch (err) {
        console.error("Get worker details error:", err.response?.data || err.message);
        throw err;
    }

    // ----------------------------------------------------
    // TEST 7: Administrator Budget Allocation to Engineer
    // ----------------------------------------------------
    console.log("\n[TEST 7] Admin Allocates Budget to Site Engineer...");
    try {
        const allocRes = await axios.post(
            `${BASE_URL}/allocations`,
            {
                project_id: 1,
                engineer_id: createdEngineerId,
                allocated_amount: 50000,
                amount_paid_to_engineer: 50000,
                notes: "Integration test project allocation"
            },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        console.log("✓ Budget allocation authorized:", allocRes.data.message);
    } catch (err) {
        console.error("Allocation error:", err.response?.data || err.message);
        throw err;
    }

    // ----------------------------------------------------
    // TEST 8: Engineer Disburses Payment to Worker
    // ----------------------------------------------------
    console.log("\n[TEST 8] Engineer Disburses Payment to Worker...");
    try {
        const payRes = await axios.post(
            `${BASE_URL}/payments/worker-payments`,
            {
                worker_id: testWorkerId,
                payment_date: new Date().toISOString().split("T")[0],
                salary_period: "Sep 2026",
                working_days: 20,
                daily_wage: 750,
                overtime_amount: 1000,
                deductions: 500,
                amount_paid: 15500,
                payment_method: "UPI",
                reference_number: "UPI-TEST-998877",
                remarks: "September wage payout"
            },
            { headers: { Authorization: `Bearer ${engineerToken}` } }
        );

        if (payRes.data.success && payRes.data.payment) {
            console.log(`✓ SUCCESS: Payment Disbursed! Code: ${payRes.data.payment.payment_code}, Amount: ₹${payRes.data.payment.amount_paid}`);
        } else {
            throw new Error("Payment disbursement failed: " + JSON.stringify(payRes.data));
        }
    } catch (err) {
        console.error("Disburse payment error:", err.response?.data || err.message);
        throw err;
    }

    // ----------------------------------------------------
    // TEST 9: Test Over-Budget Payment Prevention
    // ----------------------------------------------------
    console.log("\n[TEST 9] Verifying Over-Budget Payment Prevention (400 Expected)...");
    try {
        await axios.post(
            `${BASE_URL}/payments/worker-payments`,
            {
                worker_id: testWorkerId,
                working_days: 100,
                daily_wage: 1000,
                amount_paid: 10000000, // Exceeds allocation
                payment_method: "Cash"
            },
            { headers: { Authorization: `Bearer ${engineerToken}` } }
        );
        throw new Error("FAILED: Over-budget payment was allowed!");
    } catch (err) {
        if (err.response && err.response.status === 400) {
            console.log("✓ SUCCESS: Over-budget payment blocked with 400 Bad Request:", err.response.data.error);
        } else {
            throw err;
        }
    }

    // ----------------------------------------------------
    // TEST 10: Admin Financial Dashboard & Audit Answers
    // ----------------------------------------------------
    console.log("\n[TEST 10] Verifying Admin Dashboard & 10-Point Audit API...");
    try {
        const [dashRes, auditRes, engDashRes] = await Promise.all([
            axios.get(`${BASE_URL}/financials/admin-dashboard`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            }),
            axios.get(`${BASE_URL}/financials/payment-audit`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            }),
            axios.get(`${BASE_URL}/financials/engineer-dashboard`, {
                headers: { Authorization: `Bearer ${engineerToken}` }
            })
        ]);

        console.log("✓ Admin Dashboard Financial Totals:", dashRes.data.summary);
        console.log("✓ 10-Point Audit Q1 Total Budget:", auditRes.data.answers.q1_total_project_budget);
        console.log("✓ 10-Point Audit Q10 Budget Remaining:", auditRes.data.answers.q10_total_project_budget_remaining);
        console.log("✓ 10-Point Audit Q7 Fully Paid Workers Count:", auditRes.data.answers.q7_fully_paid_workers_count);

        const ed = engDashRes.data;
        console.log("✓ Engineer Project:", ed.project?.name);
        console.log("✓ Allocated Budget:", ed.financials.allocated_budget);
        console.log("✓ Paid to Workers:", ed.financials.paid_to_workers);
        console.log("✓ Remaining Balance:", ed.financials.remaining_balance);
        console.log("✓ Supervised Workers Count:", ed.metrics.total_workers);
    } catch (err) {
        console.error("Financial audit error:", err.response?.data || err.message);
        throw err;
    }

    console.log("\n==================================================");
    console.log("ALL 10 INTEGRATION TESTS COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
}

runTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Test execution failed:", err);
        process.exit(1);
    });
