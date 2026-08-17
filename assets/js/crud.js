// =========================================================
// CRUD MASTER - DATA CRUD ENGINE V2
// Generic localStorage CRUD layer for the master template.
// Firebase can replace this storage layer later.
// =========================================================

const STORAGE_KEY = "crud_master_data";
const ACTIVITY_KEY = "crud_master_activity";
const PAGE_SIZE_KEY = "crud_master_page_size";

let currentPage = 1;
let editingId = null;
let initialized = false;
let sortField = "createdAt";
let sortDirection = "desc";
let selectedIds = new Set();
let pageSize = Number(localStorage.getItem(PAGE_SIZE_KEY)) || 8;

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

function writeActivities(activities) {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities));
}

function writeActivity(type, message, record = null) {
    const activities = readActivities();
    activities.unshift({
        id: createId("ACT"),
        type,
        message,
        recordId: record?.id || null,
        createdAt: new Date().toISOString()
    });
    writeActivities(activities.slice(0, 100));
}

function createId(prefix = "DATA") {
    const time = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `${prefix}-${time}-${random}`;
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
        day: "2-digit", month: "short", year: "numeric"
    }).format(date);
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    }).format(date);
}

function showToast(type, title, message) {
    const container = $("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✓" : type === "error" ? "!" : type === "warning" ? "!" : "i";
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button type="button" class="toast-close" aria-label="Close">×</button>`;
    toast.querySelector(".toast-close").addEventListener("click", () => toast.remove());
    container.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3500);
}

function getDateOnly(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function updateDataStats() {
    const data = readData();
    const today = getDateOnly(new Date().toISOString());
    const active = data.filter(r => r.status === "active").length;
    const inactive = data.filter(r => r.status === "inactive").length;
    const todayCount = data.filter(r => getDateOnly(r.createdAt) === today).length;
    $("dataStatTotal") && ($("dataStatTotal").textContent = data.length);
    $("dataStatActive") && ($("dataStatActive").textContent = active);
    $("dataStatInactive") && ($("dataStatInactive").textContent = inactive);
    $("dataStatToday") && ($("dataStatToday").textContent = todayCount);
}

function populateCategoryFilter(data) {
    const select = $("categoryFilter");
    if (!select) return;
    const current = select.value;
    const categories = [...new Set(data.map(r => String(r.category || "").trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    select.innerHTML = `<option value="all">All Categories</option>` + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    select.value = categories.includes(current) ? current : "all";
}

function getFilteredData() {
    const search = ($( "dataSearch")?.value || "").trim().toLowerCase();
    const status = $("statusFilter")?.value || "all";
    const category = $("categoryFilter")?.value || "all";
    const from = $("dateFromFilter")?.value || "";
    const to = $("dateToFilter")?.value || "";

    const filtered = readData().filter((record) => {
        if (status !== "all" && record.status !== status) return false;

        const createdDate = getDateOnly(record.createdAt);
        if (from && createdDate < from) return false;
        if (to && createdDate > to) return false;

        if (!search) return true;
        return [record.id, record.name, record.category, record.status, record.description]
            .some((value) => String(value || "").toLowerCase().includes(search));
    });

    return filtered.sort((a, b) => compareRecords(a, b, sortField, sortDirection));
}

function compareRecords(a, b, field, direction) {
    let left = a?.[field] ?? "";
    let right = b?.[field] ?? "";

    if (field === "createdAt" || field === "updatedAt") {
        left = new Date(left).getTime() || 0;
        right = new Date(right).getTime() || 0;
    } else {
        left = String(left).toLowerCase();
        right = String(right).toLowerCase();
    }

    let result = 0;
    if (left < right) result = -1;
    if (left > right) result = 1;
    return direction === "asc" ? result : -result;
}

function renderTable() {
    const body = $("dataTableBody");
    const info = $("paginationInfo");
    const controls = $("paginationControls");
    if (!body || !info || !controls) return;

    const data = getFilteredData();
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const visible = data.slice(start, start + pageSize);
    const visibleIds = new Set(visible.map((record) => record.id));

    selectedIds.forEach((id) => {
        if (!readData().some((record) => record.id === id)) selectedIds.delete(id);
    });

    if (!visible.length) {
        body.innerHTML = `
            <tr><td colspan="7" class="table-empty">
                <div class="empty-table-state">
                    <div class="empty-icon">○</div>
                    <strong>No data found</strong>
                    <span>Try changing your filters or add a new record.</span>
                </div>
            </td></tr>`;
    } else {
        body.innerHTML = visible.map((record) => `
            <tr>
                <td class="checkbox-column">
                    <input type="checkbox" class="table-checkbox row-checkbox" data-id="${escapeHtml(record.id)}" ${selectedIds.has(record.id) ? "checked" : ""} aria-label="Select ${escapeHtml(record.name)}">
                </td>
                <td><span class="record-id">${escapeHtml(record.id)}</span></td>
                <td><strong>${escapeHtml(record.name)}</strong></td>
                <td>${escapeHtml(record.category)}</td>
                <td>
                    <button type="button" class="status-badge ${record.status === "active" ? "status-active" : "status-inactive"}" data-action="toggle-status" data-id="${escapeHtml(record.id)}" title="Toggle status">
                        <span></span>${escapeHtml(capitalize(record.status))}
                    </button>
                </td>
                <td>${formatDate(record.createdAt)}</td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="table-action view" data-action="view" data-id="${escapeHtml(record.id)}" title="View">○</button>
                        <button type="button" class="table-action edit" data-action="edit" data-id="${escapeHtml(record.id)}" title="Edit">✎</button>
                        <button type="button" class="table-action delete" data-action="delete" data-id="${escapeHtml(record.id)}" title="Delete">×</button>
                    </div>
                </td>
            </tr>`).join("");
    }

    const first = data.length ? start + 1 : 0;
    const last = Math.min(start + visible.length, data.length);
    info.textContent = `${first}–${last} of ${data.length} records`;

    const summary = $("dataSummaryText");
    if (summary) summary.textContent = `${data.length} matching record${data.length === 1 ? "" : "s"} • ${readData().length} total`;

    updateSelectAllState(visibleIds);
    updateBulkBar();
    renderPagination(totalPages);
    updateSortIndicators();
}

function renderPagination(totalPages) {
    const controls = $("paginationControls");
    if (!controls) return;
    if (totalPages <= 1) {
        controls.innerHTML = "";
        return;
    }

    const pages = buildPageList(totalPages, currentPage);
    controls.innerHTML = `
        <button type="button" class="pagination-button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>‹</button>
        ${pages.map((page) => page === "…"
            ? `<span class="pagination-ellipsis">…</span>`
            : `<button type="button" class="pagination-button ${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>`).join("")}
        <button type="button" class="pagination-button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>›</button>`;
}

function buildPageList(total, current) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1, 2, 3];
    if (current > 5 && current < total - 3) return [1, "…", current, "…", total];
    if (current >= total - 3) return [1, "…", total - 2, total - 1, total];
    return [...pages, "…", total];
}

function capitalize(value = "") {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function updateSortIndicators() {
    document.querySelectorAll(".table-sort").forEach((button) => {
        const span = button.querySelector("span");
        const field = button.dataset.sort;
        button.classList.toggle("sorted", field === sortField);
        if (span) span.textContent = field === sortField ? (sortDirection === "asc" ? "↑" : "↓") : "↕";
    });
}

function updateSelectAllState(visibleIds = new Set()) {
    const checkbox = $("selectAllData");
    if (!checkbox) return;
    const ids = [...visibleIds];
    const selectedVisible = ids.filter((id) => selectedIds.has(id)).length;
    checkbox.checked = ids.length > 0 && selectedVisible === ids.length;
    checkbox.indeterminate = selectedVisible > 0 && selectedVisible < ids.length;
}

function updateBulkBar() {
    const bar = $("bulkActionsBar");
    const count = $("selectedCount");
    if (!bar || !count) return;
    count.textContent = selectedIds.size;
    bar.hidden = selectedIds.size === 0;
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
    fields.forEach((fieldId) => { const field = $(fieldId); if (field) field.disabled = false; });
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
        if (mode === "view") fields.forEach((fieldId) => { const field = $(fieldId); if (field) field.disabled = true; });
    }

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (mode !== "view") $("dataName").focus();
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

    if (name.length < 2) return showToast("error", "Validation error", "Name must contain at least 2 characters.");
    if (!category) return showToast("error", "Validation error", "Category is required.");

    const data = readData();
    const now = new Date().toISOString();

    if (editingId) {
        const index = data.findIndex((record) => record.id === editingId);
        if (index === -1) return;
        data[index] = { ...data[index], name, category, status, description, updatedAt: now };
        writeData(data);
        writeActivity("update", `Updated ${name}`, data[index]);
        showToast("success", "Data updated", `${name} was updated successfully.`);
    } else {
        const record = { id: createId(), name, category, status, description, createdAt: now, updatedAt: now };
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
    if (!window.confirm(`Delete "${record.name}"? This action cannot be undone.`)) return;

    writeData(data.filter((item) => item.id !== id));
    selectedIds.delete(id);
    writeActivity("delete", `Deleted ${record.name}`, record);
    showToast("success", "Data deleted", `${record.name} was removed.`);
    renderTable();
    notifyDataChanged();
}

function toggleStatus(id) {
    const data = readData();
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) return;
    const record = data[index];
    record.status = record.status === "active" ? "inactive" : "active";
    record.updatedAt = new Date().toISOString();
    writeData(data);
    writeActivity("update", `${capitalize(record.status)} ${record.name}`, record);
    showToast("success", "Status updated", `${record.name} is now ${capitalize(record.status)}.`);
    renderTable();
    notifyDataChanged();
}

function selectVisibleRows(checked) {
    const visible = getVisibleData();
    visible.forEach((record) => checked ? selectedIds.add(record.id) : selectedIds.delete(record.id));
    renderTable();
}

function getVisibleData() {
    const data = getFilteredData();
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
}

function bulkUpdateStatus(status) {
    if (!selectedIds.size) return;
    const data = readData();
    let changed = 0;
    data.forEach((record) => {
        if (selectedIds.has(record.id) && record.status !== status) {
            record.status = status;
            record.updatedAt = new Date().toISOString();
            changed += 1;
        }
    });
    writeData(data);
    writeActivity("update", `${capitalize(status)} ${changed} selected record${changed === 1 ? "" : "s"}`);
    selectedIds.clear();
    showToast("success", "Bulk update complete", `${changed} record${changed === 1 ? "" : "s"} updated.`);
    renderTable();
    notifyDataChanged();
}

function bulkDelete() {
    if (!selectedIds.size) return;
    const ids = new Set(selectedIds);
    if (!window.confirm(`Delete ${ids.size} selected record${ids.size === 1 ? "" : "s"}? This action cannot be undone.`)) return;
    const data = readData();
    const removed = data.filter((record) => ids.has(record.id));
    writeData(data.filter((record) => !ids.has(record.id)));
    writeActivity("delete", `Deleted ${removed.length} selected record${removed.length === 1 ? "" : "s"}`);
    selectedIds.clear();
    showToast("success", "Records deleted", `${removed.length} record${removed.length === 1 ? "" : "s"} removed.`);
    renderTable();
    notifyDataChanged();
}

function exportCsv() {
    const data = getFilteredData();
    if (!data.length) return showToast("warning", "Nothing to export", "There are no matching records.");
    const headers = ["ID", "Name", "Category", "Status", "Description", "Created At", "Updated At"];
    const rows = data.map((record) => [record.id, record.name, record.category, record.status, record.description || "", record.createdAt, record.updatedAt]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crud-master-export-${getDateOnly(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("success", "Export complete", `${data.length} record${data.length === 1 ? "" : "s"} exported.`);
}

function csvEscape(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];
        if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
        if (char === '"') { quoted = !quoted; continue; }
        if (char === "," && !quoted) { row.push(cell); cell = ""; continue; }
        if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && next === "\n") i += 1;
            row.push(cell); cell = "";
            if (row.some((value) => value.trim() !== "")) rows.push(row);
            row = [];
            continue;
        }
        cell += char;
    }
    if (cell.length || row.length) { row.push(cell); if (row.some((value) => value.trim() !== "")) rows.push(row); }
    return rows;
}

async function importCsv(file) {
    if (!file) return;
    try {
        const text = await file.text();
        const rows = parseCsv(text);
        if (rows.length < 2) throw new Error("CSV has no data rows.");
        const headers = rows[0].map((h) => h.trim().toLowerCase());
        const indexOf = (names) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
        const nameIndex = indexOf(["name"]);
        const categoryIndex = indexOf(["category"]);
        const statusIndex = indexOf(["status"]);
        const descriptionIndex = indexOf(["description"]);
        if (nameIndex < 0 || categoryIndex < 0) throw new Error("CSV must contain Name and Category columns.");

        const data = readData();
        const now = new Date().toISOString();
        let imported = 0;
        rows.slice(1).forEach((row) => {
            const name = String(row[nameIndex] || "").trim();
            const category = String(row[categoryIndex] || "").trim();
            if (!name || !category) return;
            const rawStatus = String(statusIndex >= 0 ? row[statusIndex] : "active").trim().toLowerCase();
            const status = rawStatus === "inactive" ? "inactive" : "active";
            data.unshift({
                id: createId(), name, category, status,
                description: String(descriptionIndex >= 0 ? row[descriptionIndex] || "" : "").trim(),
                createdAt: now, updatedAt: now
            });
            imported += 1;
        });
        writeData(data);
        writeActivity("create", `Imported ${imported} record${imported === 1 ? "" : "s"}`);
        currentPage = 1;
        showToast("success", "Import complete", `${imported} record${imported === 1 ? "" : "s"} imported.`);
        renderTable();
        notifyDataChanged();
    } catch (error) {
        console.error(error);
        showToast("error", "Import failed", error.message || "Invalid CSV file.");
    }
}

function clearFilters() {
    ["dataSearch", "dateFromFilter", "dateToFilter"].forEach((id) => { if ($(id)) $(id).value = ""; });
    if ($("statusFilter")) $("statusFilter").value = "all";
    currentPage = 1;
    renderTable();
}

function notifyDataChanged() {
    window.dispatchEvent(new CustomEvent("crud:data-changed"));
}

function initializeCrud() {
    if (initialized) return;
    initialized = true;

    if ($("pageSizeSelect")) {
        $("pageSizeSelect").value = String(pageSize);
        $("pageSizeSelect").addEventListener("change", (event) => {
            pageSize = Number(event.target.value) || 8;
            localStorage.setItem(PAGE_SIZE_KEY, String(pageSize));
            currentPage = 1;
            selectedIds.clear();
            renderTable();
        });
    }

    $("addDataButton")?.addEventListener("click", () => openModal("add"));
    $("dataModalClose")?.addEventListener("click", closeModal);
    $("dataModalCancel")?.addEventListener("click", closeModal);
    $("dataForm")?.addEventListener("submit", handleSubmit);
    $("exportDataButton")?.addEventListener("click", exportCsv);
    $("importDataButton")?.addEventListener("click", () => $("importDataInput")?.click());
    $("importDataInput")?.addEventListener("change", (event) => {
        importCsv(event.target.files?.[0]);
        event.target.value = "";
    });
    $("clearDataFilters")?.addEventListener("click", clearFilters);

    ["dataSearch", "dateFromFilter", "dateToFilter"].forEach((id) => {
        $(id)?.addEventListener("input", () => { currentPage = 1; renderTable(); });
    });
    $("statusFilter")?.addEventListener("change", () => { currentPage = 1; renderTable(); });
    $("categoryFilter")?.addEventListener("change", () => { currentPage = 1; renderTable(); });

    $("selectAllData")?.addEventListener("change", (event) => selectVisibleRows(event.target.checked));
    $("bulkActivateButton")?.addEventListener("click", () => bulkUpdateStatus("active"));
    $("bulkDeactivateButton")?.addEventListener("click", () => bulkUpdateStatus("inactive"));
    $("bulkDeleteButton")?.addEventListener("click", bulkDelete);

    document.querySelectorAll(".table-sort").forEach((button) => {
        button.addEventListener("click", () => {
            const field = button.dataset.sort;
            if (sortField === field) sortDirection = sortDirection === "asc" ? "desc" : "asc";
            else { sortField = field; sortDirection = field === "createdAt" ? "desc" : "asc"; }
            currentPage = 1;
            renderTable();
        });
    });

    $("dataTableBody")?.addEventListener("change", (event) => {
        const checkbox = event.target.closest(".row-checkbox");
        if (!checkbox) return;
        const id = checkbox.dataset.id;
        if (checkbox.checked) selectedIds.add(id); else selectedIds.delete(id);
        updateBulkBar();
        updateSelectAllState(new Set(getVisibleData().map((record) => record.id)));
    });

    $("dataTableBody")?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const action = button.dataset.action;
        const id = button.dataset.id;
        if (action === "view") openModal("view", id);
        if (action === "edit") openModal("edit", id);
        if (action === "delete") deleteRecord(id);
        if (action === "toggle-status") toggleStatus(id);
    });

    $("paginationControls")?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-page]");
        if (!button || button.disabled) return;
        const page = Number(button.dataset.page);
        if (!Number.isFinite(page) || page < 1) return;
        currentPage = page;
        renderTable();
    });

    $("dataModal")?.addEventListener("click", (event) => { if (event.target.id === "dataModal") closeModal(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !$("dataModal")?.hidden) closeModal(); });
    window.addEventListener("crud:open-add", () => openModal("add"));

    renderTable();
}

export { initializeCrud, readData, readActivities, formatDate, formatDateTime };
