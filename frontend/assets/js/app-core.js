/**
 * ===================================================================
 * SMART CONSTRUCTION MANAGEMENT SYSTEM - CORE SAAS JAVASCRIPT
 * ===================================================================
 */

// 1. DATA FORMATTERS

/**
 * Formats any ISO date or date string into standard human-readable format: "03 Sep 2026"
 * Never returns raw ISO strings or "Invalid Date".
 */
function formatDate(dateInput) {
    if (!dateInput) return "—";
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return "—";

        const day = String(d.getDate()).padStart(2, "0");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[d.getMonth()];
        const year = d.getFullYear();

        return `${day} ${month} ${year}`;
    } catch (_) {
        return "—";
    }
}

/**
 * Formats numbers into Indian Rupee currency: "₹50,000"
 * Never returns NaN, undefined, or null.
 */
function formatCurrency(val) {
    if (val === null || val === undefined || isNaN(Number(val))) return "—";
    const num = Math.round(Number(val));
    return "₹" + num.toLocaleString("en-IN");
}

/**
 * Formats percentage: "78%"
 */
function formatPercent(val) {
    if (val === null || val === undefined || isNaN(Number(val))) return "—";
    const num = parseFloat(val);
    return (num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)) + "%";
}

/**
 * Sanitizes empty/null/undefined values to a clean dash "—"
 */
function formatValue(val, fallback = "—") {
    if (val === null || val === undefined || val === "" || String(val).toLowerCase() === "null" || String(val).toLowerCase() === "undefined" || String(val) === "NaN") {
        return fallback;
    }
    return String(val);
}

// 2. TOAST NOTIFICATION SYSTEM (Replaces browser alert)

function showToast(title, message, type = "info", duration = 4000) {
    let container = document.getElementById("appToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "appToastContainer";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `app-toast toast-${type}`;

    let iconClass = "bi-info-circle-fill";
    if (type === "success") iconClass = "bi-check-circle-fill";
    if (type === "error") iconClass = "bi-x-circle-fill";
    if (type === "warning") iconClass = "bi-exclamation-triangle-fill";

    toast.innerHTML = `
        <i class="bi ${iconClass} app-toast-icon"></i>
        <div class="app-toast-body">
            <div class="app-toast-title">${title}</div>
            <div class="app-toast-message">${message}</div>
        </div>
        <button type="button" class="app-toast-close" onclick="this.parentElement.remove()">
            <i class="bi bi-x"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// 3. AUTHENTICATION & USER HELPERS

function getAuthUser() {
    try {
        const raw = localStorage.getItem("smartConstructionUser");
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem("smartConstructionToken") || "";
}

function requireAuth(allowedRoles = []) {
    const user = getAuthUser();
    const token = getAuthToken();

    if (!user || !token) {
        window.location.href = "/login.html";
        return null;
    }

    if (allowedRoles.length > 0) {
        const userRole = (user.role || "").toLowerCase();
        const hasPermission = allowedRoles.some(r => r.toLowerCase() === userRole);
        if (!hasPermission) {
            // If Engineer visits admin-only dashboard, redirect to engineer dashboard
            if (userRole === "engineer") {
                window.location.href = "/engineer-dashboard.html";
            } else {
                window.location.href = "/dashboard.html";
            }
            return null;
        }
    }

    return user;
}

function logout() {
    localStorage.removeItem("smartConstructionToken");
    localStorage.removeItem("smartConstructionUser");
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/login.html";
}

// 4. SIDEBAR & TOPBAR INITIALIZATION

function initAppNavigation(activePageId) {
    const user = getAuthUser();
    const isEngineer = user && (user.role || "").toLowerCase() === "engineer";

    // Set active link in sidebar
    if (activePageId) {
        document.querySelectorAll(".sidebar-nav-item").forEach(el => {
            el.classList.remove("active");
            if (el.getAttribute("data-page") === activePageId) {
                el.classList.add("active");
            }
        });
    }

    // Role badge & user name in topbar
    const nameEl = document.getElementById("topbarUserName");
    const roleEl = document.getElementById("topbarUserRole");
    const avatarEl = document.getElementById("topbarAvatar");

    if (user) {
        if (nameEl) nameEl.textContent = user.name || "User";
        if (roleEl) roleEl.textContent = user.role || "Administrator";
        if (avatarEl) {
            const initials = (user.name || "SC").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            avatarEl.textContent = initials;
        }
    }

    // Hide Administrator-only sections if logged in as Engineer
    if (isEngineer) {
        document.querySelectorAll(".admin-only-feature").forEach(el => {
            el.style.display = "none";
        });
    }

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById("mobileToggleBtn");
    const sidebar = document.querySelector(".app-sidebar");
    let backdrop = document.querySelector(".sidebar-backdrop");

    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.className = "sidebar-backdrop";
        document.body.appendChild(backdrop);
    }

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("sidebar-open");
            backdrop.classList.toggle("active");
        });

        backdrop.addEventListener("click", () => {
            sidebar.classList.remove("sidebar-open");
            backdrop.classList.remove("active");
        });
    }
}

// 5. UNIFIED SIDEBAR HTML TEMPLATE GENERATOR
function renderSidebarHTML(activePage, isEngineer = false) {
    const dashboardHref = isEngineer ? "engineer-dashboard.html" : "dashboard.html";
    const dashboardTitle = isEngineer ? "Engineer Dashboard" : "Dashboard";

    return `
        <div class="sidebar-brand">
            <div class="sc-logo-badge">SC</div>
            <div class="sidebar-brand-text">
                <strong>Smart Construction</strong>
                <small>Project Management</small>
            </div>
        </div>

        <div class="sidebar-category">Main Menu</div>
        <a href="${dashboardHref}" class="sidebar-nav-item ${activePage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
            <i class="bi bi-grid-1x2-fill"></i>
            <span>${dashboardTitle}</span>
        </a>
        <a href="projects.html" class="sidebar-nav-item ${activePage === 'projects' ? 'active' : ''}" data-page="projects">
            <i class="bi bi-buildings"></i>
            <span>Projects</span>
        </a>
        <a href="workers.html" class="sidebar-nav-item ${activePage === 'workers' ? 'active' : ''}" data-page="workers">
            <i class="bi bi-people"></i>
            <span>Workforce</span>
        </a>
        <a href="tasks.html" class="sidebar-nav-item ${activePage === 'tasks' ? 'active' : ''}" data-page="tasks">
            <i class="bi bi-check2-square"></i>
            <span>Tasks</span>
        </a>
        <a href="attendance.html" class="sidebar-nav-item ${activePage === 'attendance' ? 'active' : ''}" data-page="attendance">
            <i class="bi bi-calendar-check"></i>
            <span>Attendance</span>
        </a>

        <div class="sidebar-category">Operations</div>
        <a href="payroll.html" class="sidebar-nav-item ${activePage === 'payroll' ? 'active' : ''}" data-page="payroll">
            <i class="bi bi-wallet2"></i>
            <span>Payroll &amp; Salary</span>
        </a>
        <a href="materials.html" class="sidebar-nav-item ${activePage === 'materials' ? 'active' : ''}" data-page="materials">
            <i class="bi bi-box-seam"></i>
            <span>Materials</span>
        </a>

        <div class="sidebar-category">Monitoring</div>
        <a href="issues.html" class="sidebar-nav-item ${activePage === 'issues' ? 'active' : ''}" data-page="issues">
            <i class="bi bi-exclamation-triangle"></i>
            <span>Site Issues</span>
        </a>
        <a href="progress.html" class="sidebar-nav-item ${activePage === 'progress' ? 'active' : ''}" data-page="progress">
            <i class="bi bi-bar-chart-line"></i>
            <span>Daily Progress</span>
        </a>
        <a href="reports.html" class="sidebar-nav-item ${activePage === 'reports' ? 'active' : ''}" data-page="reports">
            <i class="bi bi-file-earmark-bar-graph"></i>
            <span>Reports</span>
        </a>

        <div class="sidebar-category">System</div>
        <a href="account_settings.html" class="sidebar-nav-item ${activePage === 'account-settings' ? 'active' : ''}" data-page="account-settings">
            <i class="bi bi-person-gear"></i>
            <span>Account Settings</span>
        </a>
        <a href="javascript:void(0)" onclick="logout()" class="sidebar-nav-item logout-item">
            <i class="bi bi-box-arrow-right"></i>
            <span>Logout</span>
        </a>
    `;
}

