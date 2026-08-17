// =========================================================
// CRUD MASTER - DASHBOARD DATA
// =========================================================

import { readData, readActivities, formatDateTime } from "./crud.js";

let initialized = false;

const $ = (id) => document.getElementById(id);

function isToday(value) {
    const date = new Date(value);
    const today = new Date();

    return date.getFullYear() === today.getFullYear()
        && date.getMonth() === today.getMonth()
        && date.getDate() === today.getDate();
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderStats() {
    const data = readData();
    const activities = readActivities();

    const total = data.length;
    const active = data.filter((item) => item.status === "active").length;
    const today = data.filter((item) => isToday(item.createdAt)).length;

    $("totalData") && ($("totalData").textContent = total);
    $("activeData") && ($("activeData").textContent = active);
    $("todayData") && ($("todayData").textContent = today);
    $("activityData") && ($("activityData").textContent = activities.length);
}

function renderLatestData() {
    const body = $("latestDataTable");
    if (!body) return;

    const latest = [...readData()]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (!latest.length) {
        body.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">No data available</td>
            </tr>
        `;
        return;
    }

    body.innerHTML = latest.map((record) => `
        <tr>
            <td>${escapeHtml(record.id)}</td>
            <td><strong>${escapeHtml(record.name)}</strong></td>
            <td>${escapeHtml(record.category)}</td>
            <td>
                <span class="badge ${record.status === "active" ? "badge-success" : "badge-neutral"}">
                    ${escapeHtml(record.status === "active" ? "Active" : "Inactive")}
                </span>
            </td>
            <td>${escapeHtml(new Date(record.createdAt).toLocaleDateString("en-GB"))}</td>
        </tr>
    `).join("");
}

function renderActivity() {
    const container = $("recentActivity");
    if (!container) return;

    const activities = readActivities().slice(0, 6);

    if (!activities.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">○</div>
                <h4>No activity yet</h4>
                <p>Recent system activity will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = activities.map((activity) => `
        <div class="activity-item">
            <div class="activity-icon">${activity.type === "delete" ? "×" : activity.type === "update" ? "✎" : "+"}</div>
            <div class="activity-content">
                <strong>${escapeHtml(activity.message)}</strong>
                <span>${escapeHtml(formatDateTime(activity.createdAt))}</span>
            </div>
        </div>
    `).join("");
}

function refreshDashboard() {
    renderStats();
    renderLatestData();
    renderActivity();
}

function initializeDashboard() {
    if (initialized) return;
    initialized = true;

    window.addEventListener("crud:data-changed", refreshDashboard);
    refreshDashboard();
}

export {
    initializeDashboard,
    refreshDashboard
};
