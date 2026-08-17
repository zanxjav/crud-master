// =========================================================
// CRUD MASTER - DATA CRUD ENGINE
// Uses localStorage for the master template stage.
// Firebase can replace this storage layer later.
// =========================================================

const STORAGE_KEY = "crud_master_data";
const ACTIVITY_KEY = "crud_master_activity";
const PAGE_SIZE = 8;

let currentPage = 1;
let editingId = null;
let initialized = false;

const $ = (id) => document.getElementById(id);

function readData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : [];
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Failed to read CRUD data:", error);
        return [];
    }
}

function writeData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function readActivities() {
    try {
        const raw = localStorage.getItem(ACTIVITY_KEY);
        const data = raw ? JSON.parse(raw) : [];
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Failed to read activities:", error);
        return [];
    }
}

function writeActivity(type, message, record = null) {
    const activities = readActivities();

    activities.unshift({
        id: crypto.randomUUID(),
        type,
        message,
        recordId: record?.id || null,
        createdAt: new Date().toISOString()
    });

    writeActivities(activities.slice(0, 50));
}

function writeActivities(activities) {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities));
}

function createId() {
    const time = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `DATA-${time}-${random}`;
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function showToast(type, title, message) {
    const container = $("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon = type === "success" ? "✓" : type === "error" ? "!" : "i";

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button type="button" class="toast-close" aria-label="Close">×</button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => toast.remove());
    container.appendChild(toast);

    window.setTimeout(() => toast.remove(), 3500);
}

function getFilteredData() {
    const search = ($("dataSearch")?.value || "").trim().toLowerCase();
    const status = $("statusFilter")?.value || "all";

    return readData()
        .filter((record) => {
            if (status !== "all" && record.status !== status) return false;

            if (!search) return true;

            return [
                record.id,
                record.name,
                record.category,
                record.status,
                record.description
            ].some((value) => String(value || "").toLowerCase().includes(search));
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderTable() {
    const body = $("dataTableBody");
    const info = $("paginationInfo");
    const controls = $("paginationControls");

    if (!body || !info || !controls) return;

    const data = getFilteredData();
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));

    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const visible = data.slice(start, start + PAGE_SIZE);

    if (!visible.length) {
        body.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty">
                    No data found. Click <strong>Add Data</strong> to create your first record.
                </td>
            </tr>
        `;
    } else {
        body.innerHTML = visible.map((record) => `
            <tr>
                <td>${escapeHtml(record.id)}</td>
                <td><strong>${escapeHtml(record.name)}</strong></td>
                <td>${escapeHtml(record.category)}</td>
                <td>
                    <span class="badge ${record.status === "active" ? "badge-success" : "badge-neutral"}">
                        ${escapeHtml(capitalize(record.status))}
                    </span>
                </td>
                <td>${formatDate(record.createdAt)}</td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="table-action view" data-action="view" data-id="${escapeHtml(record.id)}" title="View">○</button>
                        <button type="button" class="table-action edit" data-action="edit" data-id="${escapeHtml(record.id)}" title="Edit">✎</button>
                        <button type="button" class="table-action delete" data-action="delete" data-id="${escapeHtml(record.id)}" title="Delete">×</button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    const first = data.length ? start + 1 : 0;
    const last = Math.min(start + visible.length, data.length);
    info.textContent = `${first}–${last} of ${data.length} records`;

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const controls = $("paginationControls");
    if (!controls) return;

    if (totalPages <= 1) {
        controls.innerHTML = "";
        return;
    }

    const buttons = [];

    buttons.push(`
        <button type="button" class="pagination-button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous">‹</button>
    `);

    for (let page = 1; page <= totalPages; page += 1) {
        if (totalPages > 7 && page > 3 && page < totalPages - 2) {
            if (page === 4) buttons.push(`<span class="pagination-info">…</span>`);
            continue;
        }

        buttons.push(`
            <button type="button" class="pagination-button ${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>
        `);
    }

    buttons.push(`
        <button type="button" class="pagination-button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="Next">›</button>
    `);

    controls.innerHTML = buttons.join("");
}

function capitalize(value = "") {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function openModal(mode = "add", id = null) {
    const modal = $("dataModal");
    const form = $("dataForm");
    if (!modal || !form) return;

    const title = $("dataModalTitle");
    const saveButton = $("dataSaveButton");
    const fields = ["dataName", "dataCategory", "dataStatus", "dataDescription"];

    form.reset();
    editingId = null;

    fields.forEach((fieldId) => {
        const field = $(fieldId);
        if (field) field.disabled = false;
    });

    saveButton.hidden = mode === "view";
    $("dataModalCancel").textContent = mode === "view" ? "Close" : "Cancel";

    if (mode === "add") {
        title.textContent = "Add New Data";
        $("dataStatus").value = "active";
    } else {
        const record = readData().find((item) => item.id === id);
        if (!record) return;

        editingId = record.id;
        title.textContent = mode === "edit" ? "Edit Data" : "View Data";

        $("dataId").value = record.id;
        $("dataName").value = record.name;
        $("dataCategory").value = record.category;
        $("dataStatus").value = record.status;
        $("dataDescription").value = record.description || "";

        if (mode === "view") {
            fields.forEach((fieldId) => {
                const field = $(fieldId);
                if (field) field.disabled = true;
            });
        }
    }

    modal.hidden = false;
    document.body.style.overflow = "hidden";

    if (mode !== "view") {
        $("dataName").focus();
    }
}

function closeModal() {
    const modal = $("dataModal");
    if (!modal) return;

    modal.hidden = true;
    document.body.style.overflow = "";
    editingId = null;
}

function handleSubmit(event) {
    event.preventDefault();

    const name = $("dataName").value.trim();
    const category = $("dataCategory").value.trim();
    const status = $("dataStatus").value;
    const description = $("dataDescription").value.trim();

    if (!name || !category) {
        showToast("error", "Validation error", "Name and category are required.");
        return;
    }

    const data = readData();
    const now = new Date().toISOString();

    if (editingId) {
        const index = data.findIndex((record) => record.id === editingId);
        if (index === -1) return;

        data[index] = {
            ...data[index],
            name,
            category,
            status,
            description,
            updatedAt: now
        };

        writeData(data);
        writeActivity("update", `Updated ${name}`, data[index]);
        showToast("success", "Data updated", `${name} was updated successfully.`);
    } else {
        const record = {
            id: createId(),
            name,
            category,
            status,
            description,
            createdAt: now,
            updatedAt: now
        };

        data.unshift(record);
        writeData(data);
        writeActivity("create", `Added ${name}`, record);
        showToast("success", "Data added", `${name} was added successfully.`);
    }

    closeModal();
    currentPage = 1;
    renderTable();
    notifyDataChanged();
}

function deleteRecord(id) {
    const data = readData();
    const record = data.find((item) => item.id === id);
    if (!record) return;

    const confirmed = window.confirm(
        `Delete "${record.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    writeData(data.filter((item) => item.id !== id));
    writeActivity("delete", `Deleted ${record.name}`, record);

    showToast("success", "Data deleted", `${record.name} was removed.`);

    renderTable();
    notifyDataChanged();
}

function notifyDataChanged() {
    window.dispatchEvent(new CustomEvent("crud:data-changed"));
}

function initializeCrud() {
    if (initialized) return;
    initialized = true;

    $("addDataButton")?.addEventListener("click", () => openModal("add"));
    $("dataModalClose")?.addEventListener("click", closeModal);
    $("dataModalCancel")?.addEventListener("click", closeModal);
    $("dataForm")?.addEventListener("submit", handleSubmit);

    $("dataSearch")?.addEventListener("input", () => {
        currentPage = 1;
        renderTable();
    });

    $("statusFilter")?.addEventListener("change", () => {
        currentPage = 1;
        renderTable();
    });

    $("dataTableBody")?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (action === "view") openModal("view", id);
        if (action === "edit") openModal("edit", id);
        if (action === "delete") deleteRecord(id);
    });

    $("paginationControls")?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-page]");
        if (!button || button.disabled) return;

        const page = Number(button.dataset.page);
        if (!Number.isFinite(page) || page < 1) return;

        currentPage = page;
        renderTable();
    });

    $("dataModal")?.addEventListener("click", (event) => {
        if (event.target.id === "dataModal") closeModal();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !$("dataModal")?.hidden) {
            closeModal();
        }
    });

    window.addEventListener("crud:open-add", () => openModal("add"));

    renderTable();
}

export {
    initializeCrud,
    readData,
    readActivities,
    formatDate,
    formatDateTime
};
