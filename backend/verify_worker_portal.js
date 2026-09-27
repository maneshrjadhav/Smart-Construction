// ======================================================================
// SMART CONSTRUCTION MANAGEMENT SYSTEM
// E2E VERIFICATION SUITE FOR WORKER PORTAL UPGRADE
// ======================================================================

const http = require("http");
const jwt = require("jsonwebtoken");
const db = require("./database");

const JWT_SECRET = process.env.JWT_SECRET || "smart-construction-secret-key-2026";
const BASE_URL = "http://127.0.0.1:3000";

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json || data,
        });
      });
    });

    req.on("error", (err) => reject(err));

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("STARTING WORKER PORTAL UPGRADE E2E VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Locate a worker in the database
    const [workers] = await db.query(`
      SELECT w.*, u.id AS user_id, u.email, u.role 
      FROM workers w
      JOIN users u ON u.id = w.user_id
      LIMIT 1
    `);

    if (workers.length === 0) {
      console.error("No worker found in database for testing.");
      process.exit(1);
    }

    const testWorker = workers[0];
    console.log(`Found Test Worker: ${testWorker.name} (Code: ${testWorker.worker_code}, User ID: ${testWorker.user_id})`);

    // Create JWT Token for test worker
    const workerToken = jwt.sign(
      {
        id: testWorker.user_id,
        role: "Worker",
        name: testWorker.name,
        email: testWorker.email,
        workerProfileId: testWorker.id,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    const authHeader = { Authorization: `Bearer ${workerToken}` };

    // TEST 1: GET /api/workers/me
    const meRes = await makeRequest("GET", "/api/workers/me", authHeader);
    assert(
      meRes.statusCode === 200 && meRes.data.success && meRes.data.worker,
      "GET /api/workers/me returns 200 with worker dossier"
    );

    // TEST 2: GET /api/workers/me/attendance
    const attRes = await makeRequest("GET", "/api/workers/me/attendance", authHeader);
    assert(
      attRes.statusCode === 200 && attRes.data.success && Array.isArray(attRes.data.attendance),
      "GET /api/workers/me/attendance returns 200 with attendance array"
    );

    // TEST 3: GET /api/workers/me/payments
    const payRes = await makeRequest("GET", "/api/workers/me/payments", authHeader);
    assert(
      payRes.statusCode === 200 && payRes.data.success && Array.isArray(payRes.data.payments),
      "GET /api/workers/me/payments returns 200 with payments ledger"
    );

    // TEST 4: GET /api/workers/me/work-history
    const histRes = await makeRequest("GET", "/api/workers/me/work-history", authHeader);
    assert(
      histRes.statusCode === 200 && histRes.data.success && Array.isArray(histRes.data.workHistory),
      "GET /api/workers/me/work-history returns 200 with timeline history"
    );

    // TEST 5: GET /api/workers/me/documents
    const docRes = await makeRequest("GET", "/api/workers/me/documents", authHeader);
    assert(
      docRes.statusCode === 200 && docRes.data.success && Array.isArray(docRes.data.documents),
      "GET /api/workers/me/documents returns 200 with documents vault"
    );

    // TEST 6: GET /api/workers/me/tasks
    const taskRes = await makeRequest("GET", "/api/workers/me/tasks", authHeader);
    assert(
      taskRes.statusCode === 200 && taskRes.data.success && Array.isArray(taskRes.data.tasks),
      "GET /api/workers/me/tasks returns 200 with assigned site tasks"
    );

    // TEST 7: GET /api/workers/me/notifications
    const notifRes = await makeRequest("GET", "/api/workers/me/notifications", authHeader);
    assert(
      notifRes.statusCode === 200 && notifRes.data.success && Array.isArray(notifRes.data.notifications),
      "GET /api/workers/me/notifications returns 200 with aggregated live alerts"
    );

    // TEST 8: GET /api/workers/me/project
    const projRes = await makeRequest("GET", "/api/workers/me/project", authHeader);
    assert(
      projRes.statusCode === 200 && projRes.data.success,
      "GET /api/workers/me/project returns 200 with project details"
    );

    // TEST 9: GET /api/workers/me/engineer
    const engRes = await makeRequest("GET", "/api/workers/me/engineer", authHeader);
    assert(
      engRes.statusCode === 200 && engRes.data.success,
      "GET /api/workers/me/engineer returns 200 with supervising engineer & attendance log"
    );

    // TEST 10: Role-Based Authorization Isolation (Worker cannot access Admin financials)
    const adminFinRes = await makeRequest("GET", "/api/financials/admin-dashboard", authHeader);
    assert(
      adminFinRes.statusCode === 403,
      "Security Enforcement: Worker is rejected with 403 on Admin Financial Dashboard",
      `Received status ${adminFinRes.statusCode}`
    );

    // TEST 11: SPA Direct Routing (Must serve HTML index without 404 for all worker routes)
    const spaRoutes = [
      "/worker-dashboard",
      "/worker/profile",
      "/worker/attendance",
      "/worker/payments",
      "/worker/work-history",
      "/worker/documents",
      "/worker/project",
      "/worker/engineer",
      "/worker/notifications",
      "/worker/account-settings",
    ];

    for (const route of spaRoutes) {
      const spaRes = await makeRequest("GET", route);
      const isHtml = typeof spaRes.data === "string" && spaRes.data.includes("<html");
      assert(
        spaRes.statusCode === 200 && isHtml,
        `Direct SPA URL Navigation: ${route} serves 200 OK HTML`,
        `Received status ${spaRes.statusCode}`
      );
    }

    console.log("==================================================");
    console.log(`E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runTests();

