// =========================================================
// CRUD MASTER - DATA CRUD ENGINE V3
// CRUD + IMAGE UPLOAD + MULTIPLE IMAGE PREVIEW
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

let pageSize =
    Number(localStorage.getItem(PAGE_SIZE_KEY)) || 8;

// Temporary images selected in modal
let selectedImages = [];


// =========================================================
// DOM HELPER
// =========================================================

const $ = (id) => document.getElementById(id);


// =========================================================
// STORAGE
// =========================================================

function readData() {

    try {

        const raw = localStorage.getItem(STORAGE_KEY);

        const data = raw
            ? JSON.parse(raw)
            : [];

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "Failed to read CRUD data:",
            error
        );

        return [];

    }

}


function writeData(data) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}


function readActivities() {

    try {

        const raw =
            localStorage.getItem(ACTIVITY_KEY);

        const data =
            raw ? JSON.parse(raw) : [];

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "Failed to read activities:",
            error
        );

        return [];

    }

}


function writeActivities(activities) {

    localStorage.setItem(
        ACTIVITY_KEY,
        JSON.stringify(activities)
    );

}


// =========================================================
// ACTIVITY
// =========================================================

function writeActivity(
    type,
    message,
    record = null
) {

    const activities =
        readActivities();

    activities.unshift({

        id: createId("ACT"),

        type,

        message,

        recordId:
            record?.id || null,

        createdAt:
            new Date().toISOString()

    });

    writeActivities(
        activities.slice(0, 100)
    );

}


// =========================================================
// ID
// =========================================================

function createId(prefix = "DATA") {

    const time =
        Date.now()
            .toString(36)
            .toUpperCase();

    const random =
        Math.random()
            .toString(36)
            .slice(2, 7)
            .toUpperCase();

    return `${prefix}-${time}-${random}`;

}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHtml(value = "") {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =========================================================
// DATE
// =========================================================

function formatDate(value) {

    if (!value) return "—";

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


function formatDateTime(value) {

    if (!value) return "—";

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


function getDateOnly(value) {

    if (!value) return "";

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    const y =
        date.getFullYear();

    const m =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const d =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${y}-${m}-${d}`;

}


// =========================================================
// TOAST
// =========================================================

function showToast(
    type,
    title,
    message
) {

    const container =
        $("toastContainer");

    if (!container) return;

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    const icon =
        type === "success"
            ? "✓"
            : type === "error"
                ? "!"
                : type === "warning"
                    ? "!"
                    : "i";

    toast.innerHTML = `

        <div class="toast-icon">
            ${icon}
        </div>

        <div class="toast-content">

            <div class="toast-title">
                ${escapeHtml(title)}
            </div>

            <div class="toast-message">
                ${escapeHtml(message)}
            </div>

        </div>

        <button
            type="button"
            class="toast-close"
            aria-label="Close"
        >
            ×
        </button>

    `;

    toast
        .querySelector(
            ".toast-close"
        )
        .addEventListener(
            "click",
            () => toast.remove()
        );

    container.appendChild(
        toast
    );

    window.setTimeout(
        () => toast.remove(),
        3500
    );

}


// =========================================================
// IMAGE HELPERS
// =========================================================

function normalizeImages(record) {

    if (
        Array.isArray(record?.images)
    ) {

        return record.images
            .filter(
                image =>
                    typeof image === "string" &&
                    image.length > 0
            );

    }

    // Compatibility with old
    // single-image records

    if (
        typeof record?.image === "string" &&
        record.image.length > 0
    ) {

        return [record.image];

    }

    return [];

}


function readImageFiles(files) {

    return new Promise(
        (resolve, reject) => {

            const fileArray =
                Array.from(files || []);

            if (!fileArray.length) {

                resolve([]);

                return;

            }

            const results = [];

            let completed = 0;

            fileArray.forEach(
                (file, index) => {

                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        completed++;

                        if (
                            completed ===
                            fileArray.length
                        ) {

                            resolve(results);

                        }

                        return;

                    }

                    const reader =
                        new FileReader();

                    reader.onload =
                        () => {

                            results[index] =
                                reader.result;

                            completed++;

                            if (
                                completed ===
                                fileArray.length
                            ) {

                                resolve(
                                    results.filter(Boolean)
                                );

                            }

                        };

                    reader.onerror =
                        () => {

                            reject(
                                new Error(
                                    `Failed to read ${file.name}`
                                )
                            );

                        };

                    reader.readAsDataURL(
                        file
                    );

                });

        }
    );

}


function renderImagePreview() {

    const container =
        $("imagePreview");

    if (!container) return;

    if (!selectedImages.length) {

        container.innerHTML = `

            <div class="image-preview-empty">

                <span>🖼️</span>

                <p>
                    No images selected
                </p>

            </div>

        `;

        return;

    }

    container.innerHTML =
        selectedImages
            .map(
                (image, index) => `

                    <div
                        class="image-preview-item"
                        data-image-index="${index}"
                    >

                        <img
                            src="${image}"
                            alt="Preview ${index + 1}"
                        >

                        <button
                            type="button"
                            class="image-preview-remove"
                            data-remove-image="${index}"
                            title="Remove image"
                        >
                            ×
                        </button>

                    </div>

                `
            )
            .join("");

}


function clearSelectedImages() {

    selectedImages = [];

    const input =
        $("dataImages");

    if (input) {

        input.value = "";

    }

    renderImagePreview();

}


async function handleImageSelection(
    files
) {

    const fileArray =
        Array.from(files || []);

    if (!fileArray.length) return;

    const imageFiles =
        fileArray.filter(
            file =>
                file.type.startsWith(
                    "image/"
                )
        );

    if (!imageFiles.length) {

        showToast(
            "error",
            "Invalid image",
            "Please select image files only."
        );

        return;

    }

    try {

        const newImages =
            await readImageFiles(
                imageFiles
            );

        selectedImages.push(
            ...newImages
        );

        renderImagePreview();

        showToast(
            "success",
            "Images selected",
            `${newImages.length} image${newImages.length === 1 ? "" : "s"} added.`
        );

    } catch (error) {

        console.error(error);

        showToast(
            "error",
            "Image error",
            "Failed to load one or more images."
        );

    }

}


// =========================================================
// DATA STATS
// =========================================================

function updateDataStats() {

    const data =
        readData();

    const today =
        getDateOnly(
            new Date().toISOString()
        );

    const active =
        data.filter(
            record =>
                record.status === "active"
        ).length;

    const inactive =
        data.filter(
            record =>
                record.status === "inactive"
        ).length;

    const todayCount =
        data.filter(
            record =>
                getDateOnly(
                    record.createdAt
                ) === today
        ).length;

    if ($("dataStatTotal")) {

        $("dataStatTotal")
            .textContent =
            data.length;

    }

    if ($("dataStatActive")) {

        $("dataStatActive")
            .textContent =
            active;

    }

    if ($("dataStatInactive")) {

        $("dataStatInactive")
            .textContent =
            inactive;

    }

    if ($("dataStatToday")) {

        $("dataStatToday")
            .textContent =
            todayCount;

    }

}


// =========================================================
// CATEGORY FILTER
// =========================================================

function populateCategoryFilter(
    data
) {

    const select =
        $("categoryFilter");

    if (!select) return;

    const current =
        select.value;

    const categories =
        [
            ...new Set(
                data
                    .map(
                        record =>
                            String(
                                record.category ||
                                ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );

    select.innerHTML =

        `<option value="all">
            All Categories
        </option>` +

        categories
            .map(
                category => `
                    <option value="${escapeHtml(category)}">
                        ${escapeHtml(category)}
                    </option>
                `
            )
            .join("");

    select.value =
        categories.includes(current)
            ? current
            : "all";

}


// =========================================================
// FILTER
// =========================================================

function getFilteredData() {

    const search =
        (
            $("dataSearch")
                ?.value || ""
        )
            .trim()
            .toLowerCase();

    const status =
        $("statusFilter")
            ?.value || "all";

    const category =
        $("categoryFilter")
            ?.value || "all";

    const from =
        $("dateFromFilter")
            ?.value || "";

    const to =
        $("dateToFilter")
            ?.value || "";

    const filtered =
        readData().filter(
            record => {

                if (
                    status !== "all" &&
                    record.status !== status
                ) {
                    return false;
                }

                if (
                    category !== "all" &&
                    String(
                        record.category || ""
                    ) !== category
                ) {
                    return false;
                }

                const createdDate =
                    getDateOnly(
                        record.createdAt
                    );

                if (
                    from &&
                    createdDate < from
                ) {
                    return false;
                }

                if (
                    to &&
                    createdDate > to
                ) {
                    return false;
                }

                if (!search) {

                    return true;

                }

                return [

                    record.id,
                    record.name,
                    record.category,
                    record.status,
                    record.description

                ].some(
                    value =>
                        String(
                            value || ""
                        )
                            .toLowerCase()
                            .includes(search)
                );

            }
        );

    return filtered.sort(
        (a, b) =>
            compareRecords(
                a,
                b,
                sortField,
                sortDirection
            )
    );

}


// =========================================================
// SORT
// =========================================================

function compareRecords(
    a,
    b,
    field,
    direction
) {

    let left =
        a?.[field] ?? "";

    let right =
        b?.[field] ?? "";

    if (
        field === "createdAt" ||
        field === "updatedAt"
    ) {

        left =
            new Date(left).getTime() || 0;

        right =
            new Date(right).getTime() || 0;

    } else {

        left =
            String(left)
                .toLowerCase();

        right =
            String(right)
                .toLowerCase();

    }

    let result = 0;

    if (left < right) result = -1;

    if (left > right) result = 1;

    return direction === "asc"
        ? result
        : -result;

}


// =========================================================
// TABLE
// =========================================================

function renderTable() {

    const body =
        $("dataTableBody");

    const info =
        $("paginationInfo");

    const controls =
        $("paginationControls");

    if (
        !body ||
        !info ||
        !controls
    ) {
        return;
    }

    const allData =
        readData();

    populateCategoryFilter(
        allData
    );

    updateDataStats();

    const data =
        getFilteredData();

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                data.length /
                pageSize
            )
        );

    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;

    }

    const start =
        (
            currentPage - 1
        ) *
        pageSize;

    const visible =
        data.slice(
            start,
            start + pageSize
        );

    const visibleIds =
        new Set(
            visible.map(
                record =>
                    record.id
            )
        );

    selectedIds.forEach(
        id => {

            if (
                !allData.some(
                    record =>
                        record.id === id
                )
            ) {

                selectedIds.delete(id);

            }

        }
    );


    // -------------------------------------------------------
    // EMPTY
    // -------------------------------------------------------

    if (!visible.length) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="table-empty"
                >

                    <div
                        class="empty-table-state"
                    >

                        <div
                            class="empty-icon"
                        >
                            ○
                        </div>

                        <strong>
                            No data found
                        </strong>

                        <span>
                            Try changing your filters
                            or add a new record.
                        </span>

                    </div>

                </td>

            </tr>

        `;

    } else {

        body.innerHTML =
            visible
                .map(
                    record => {

                        const images =
                            normalizeImages(
                                record
                            );

                        return `

                            <tr>

                                <td
                                    class="checkbox-column"
                                >

                                    <input
                                        type="checkbox"
                                        class="table-checkbox row-checkbox"
                                        data-id="${escapeHtml(record.id)}"
                                        ${
                                            selectedIds.has(
                                                record.id
                                            )
                                                ? "checked"
                                                : ""
                                        }
                                    >

                                </td>

                                <td>

                                    <span
                                        class="record-id"
                                    >
                                        ${escapeHtml(record.id)}
                                    </span>

                                </td>

                                <td>

                                    <div
                                        class="record-name-cell"
                                    >

                                        ${
                                            images.length
                                                ? `
                                                    <img
                                                        src="${images[0]}"
                                                        class="record-thumbnail"
                                                        alt=""
                                                    >
                                                `
                                                : ""
                                        }

                                        <strong>
                                            ${escapeHtml(record.name)}
                                        </strong>

                                    </div>

                                </td>

                                <td>
                                    ${escapeHtml(record.category)}
                                </td>

                                <td>

                                    <button
                                        type="button"
                                        class="status-badge ${
                                            record.status ===
                                            "active"
                                                ? "status-active"
                                                : "status-inactive"
                                        }"
                                        data-action="toggle-status"
                                        data-id="${escapeHtml(record.id)}"
                                        title="Toggle status"
                                    >

                                        <span></span>

                                        ${escapeHtml(
                                            capitalize(
                                                record.status
                                            )
                                        )}

                                    </button>

                                </td>

                                <td>
                                    ${formatDate(
                                        record.createdAt
                                    )}
                                </td>

                                <td>

                                    <div
                                        class="table-actions"
                                    >

                                        <button
                                            type="button"
                                            class="table-action view"
                                            data-action="view"
                                            data-id="${escapeHtml(record.id)}"
                                            title="View"
                                        >
                                            ○
                                        </button>

                                        <button
                                            type="button"
                                            class="table-action edit"
                                            data-action="edit"
                                            data-id="${escapeHtml(record.id)}"
                                            title="Edit"
                                        >
                                            ✎
                                        </button>

                                        <button
                                            type="button"
                                            class="table-action delete"
                                            data-action="delete"
                                            data-id="${escapeHtml(record.id)}"
                                            title="Delete"
                                        >
                                            ×
                                        </button>

                                    </div>

                                </td>

                            </tr>

                        `;

                    }
                )
                .join("");

    }


    const first =
        data.length
            ? start + 1
            : 0;

    const last =
        Math.min(
            start + visible.length,
            data.length
        );

    info.textContent =
        `${first}–${last} of ${data.length} records`;

    const summary =
        $("dataSummaryText");

    if (summary) {

        summary.textContent =
            `${data.length} matching record${data.length === 1 ? "" : "s"} • ${allData.length} total`;

    }

    updateSelectAllState(
        visibleIds
    );

    updateBulkBar();

    renderPagination(
        totalPages
    );

    updateSortIndicators();

}


// =========================================================
// PAGINATION
// =========================================================

function renderPagination(
    totalPages
) {

    const controls =
        $("paginationControls");

    if (!controls) return;

    if (totalPages <= 1) {

        controls.innerHTML = "";

        return;

    }

    const pages =
        buildPageList(
            totalPages,
            currentPage
        );

    controls.innerHTML = `

        <button
            type="button"
            class="pagination-button"
            data-page="${currentPage - 1}"
            ${currentPage === 1 ? "disabled" : ""}
        >
            ‹
        </button>

        ${pages
            .map(
                page =>
                    page === "…"
                        ? `
                            <span
                                class="pagination-ellipsis"
                            >
                                …
                            </span>
                        `
                        : `
                            <button
                                type="button"
                                class="pagination-button ${
                                    page === currentPage
                                        ? "active"
                                        : ""
                                }"
                                data-page="${page}"
                            >
                                ${page}
                            </button>
                        `
            )
            .join("")}

        <button
            type="button"
            class="pagination-button"
            data-page="${currentPage + 1}"
            ${currentPage === totalPages ? "disabled" : ""}
        >
            ›
        </button>

    `;

}


function buildPageList(
    total,
    current
) {

    if (total <= 7) {

        return Array.from(
            {
                length: total
            },
            (_, i) =>
                i + 1
        );

    }

    if (
        current > 5 &&
        current < total - 3
    ) {

        return [
            1,
            "…",
            current,
            "…",
            total
        ];

    }

    if (
        current >= total - 3
    ) {

        return [
            1,
            "…",
            total - 2,
            total - 1,
            total
        ];

    }

    return [
        1,
        2,
        3,
        "…",
        total
    ];

}


// =========================================================
// SORT INDICATORS
// =========================================================

function updateSortIndicators() {

    document
        .querySelectorAll(
            ".table-sort"
        )
        .forEach(
            button => {

                const span =
                    button.querySelector(
                        "span"
                    );

                const field =
                    button.dataset.sort;

                button.classList.toggle(
                    "sorted",
                    field === sortField
                );

                if (span) {

                    span.textContent =
                        field === sortField

                            ? (
                                sortDirection ===
                                "asc"
                                    ? "↑"
                                    : "↓"
                            )

                            : "↕";

                }

            }
        );

}


// =========================================================
// SELECT
// =========================================================

function updateSelectAllState(
    visibleIds = new Set()
) {

    const checkbox =
        $("selectAllData");

    if (!checkbox) return;

    const ids =
        [...visibleIds];

    const selectedVisible =
        ids.filter(
            id =>
                selectedIds.has(id)
        ).length;

    checkbox.checked =
        ids.length > 0 &&
        selectedVisible === ids.length;

    checkbox.indeterminate =
        selectedVisible > 0 &&
        selectedVisible < ids.length;

}


function updateBulkBar() {

    const bar =
        $("bulkActionsBar");

    const count =
        $("selectedCount");

    if (!bar || !count) return;

    count.textContent =
        selectedIds.size;

    bar.hidden =
        selectedIds.size === 0;

}


function getVisibleData() {

    const data =
        getFilteredData();

    const start =
        (
            currentPage - 1
        ) *
        pageSize;

    return data.slice(
        start,
        start + pageSize
    );

}


function selectVisibleRows(
    checked
) {

    const visible =
        getVisibleData();

    visible.forEach(
        record => {

            if (checked) {

                selectedIds.add(
                    record.id
                );

            } else {

                selectedIds.delete(
                    record.id
                );

            }

        }
    );

    renderTable();

}


// =========================================================
// OPEN DATA MODAL
// =========================================================

function openModal(
    mode = "add",
    id = null
) {

    const modal =
        $("dataModal");

    const form =
        $("dataForm");

    if (!modal || !form) return;

    const title =
        $("dataModalTitle");

    const saveButton =
        $("dataSaveButton");

    const fields = [

        "dataName",
        "dataCategory",
        "dataStatus",
        "dataDescription"

    ];


    // Reset

    form.reset();

    editingId = null;

    clearSelectedImages();


    fields.forEach(
        fieldId => {

            const field =
                $(fieldId);

            if (field) {

                field.disabled =
                    false;

            }

        }
    );


    if (saveButton) {

        saveButton.hidden =
            mode === "view";

    }


    const cancelButton =
        $("dataModalCancel");

    if (cancelButton) {

        cancelButton.textContent =
            mode === "view"
                ? "Close"
                : "Cancel";

    }


    // -------------------------------------------------------
    // ADD
    // -------------------------------------------------------

    if (mode === "add") {

        title.textContent =
            "Add New Data";

        $("dataStatus").value =
            "active";

    }


    // -------------------------------------------------------
    // EDIT / VIEW
    // -------------------------------------------------------

    else {

        const record =
            readData().find(
                item =>
                    item.id === id
            );

        if (!record) return;

        editingId =
            record.id;

        title.textContent =
            mode === "edit"
                ? "Edit Data"
                : "View Data";

        $("dataId").value =
            record.id;

        $("dataName").value =
            record.name || "";

        $("dataCategory").value =
            record.category || "";

        $("dataStatus").value =
            record.status || "active";

        $("dataDescription").value =
            record.description || "";

        selectedImages =
            normalizeImages(
                record
            );

        renderImagePreview();


        if (mode === "view") {

            fields.forEach(
                fieldId => {

                    const field =
                        $(fieldId);

                    if (field) {

                        field.disabled =
                            true;

                    }

                }
            );

            const imageInput =
                $("dataImages");

            if (imageInput) {

                imageInput.disabled =
                    true;

            }

        }

    }


    // -------------------------------------------------------
    // OPEN
    // -------------------------------------------------------

    modal.hidden =
        false;

    document.body.style.overflow =
        "hidden";


    // Focus

    if (
        mode !== "view" &&
        $("dataName")
    ) {

        setTimeout(
            () =>
                $("dataName").focus(),
            100
        );

    }

}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeModal() {

    const modal =
        $("dataModal");

    if (!modal) return;

    modal.hidden =
        true;

    document.body.style.overflow =
        "";

    editingId =
        null;

    clearSelectedImages();

}


// =========================================================
// SUBMIT
// =========================================================

function handleSubmit(
    event
) {

    event.preventDefault();

    const name =
        $("dataName")
            .value
            .trim();

    const category =
        $("dataCategory")
            .value
            .trim();

    const status =
        $("dataStatus")
            .value;

    const description =
        $("dataDescription")
            .value
            .trim();


    if (
        name.length < 2
    ) {

        showToast(
            "error",
            "Validation error",
            "Name must contain at least 2 characters."
        );

        return;

    }


    if (!category) {

        showToast(
            "error",
            "Validation error",
            "Category is required."
        );

        return;

    }


    const data =
        readData();

    const now =
        new Date().toISOString();


    // -------------------------------------------------------
    // EDIT
    // -------------------------------------------------------

    if (editingId) {

        const index =
            data.findIndex(
                record =>
                    record.id ===
                    editingId
            );

        if (index === -1) return;

        const oldRecord =
            data[index];

        data[index] = {

            ...oldRecord,

            name,

            category,

            status,

            description,

            images:
                [...selectedImages],

            // Keep compatibility
            image:
                selectedImages[0] || "",

            updatedAt:
                now

        };

        writeData(data);

        writeActivity(
            "update",
            `Updated ${name}`,
            data[index]
        );

        showToast(
            "success",
            "Data updated",
            `${name} was updated successfully.`
        );

    }


    // -------------------------------------------------------
    // CREATE
    // -------------------------------------------------------

    else {

        const record = {

            id:
                createId(),

            name,

            category,

            status,

            description,

            images:
                [...selectedImages],

            image:
                selectedImages[0] || "",

            createdAt:
                now,

            updatedAt:
                now

        };

        data.unshift(
            record
        );

        writeData(
            data
        );

        writeActivity(
            "create",
            `Added ${name}`,
            record
        );

        showToast(
            "success",
            "Data added",
            `${name} was added successfully.`
        );

    }


    closeModal();

    currentPage =
        1;

    renderTable();

    notifyDataChanged();

}


// =========================================================
// DELETE
// =========================================================

function deleteRecord(
    id
) {

    const data =
        readData();

    const record =
        data.find(
            item =>
                item.id === id
        );

    if (!record) return;

    if (
        !window.confirm(
            `Delete "${record.name}"? This action cannot be undone.`
        )
    ) {
        return;
    }

    writeData(
        data.filter(
            item =>
                item.id !== id
        )
    );

    selectedIds.delete(
        id
    );

    writeActivity(
        "delete",
        `Deleted ${record.name}`,
        record
    );

    showToast(
        "success",
        "Data deleted",
        `${record.name} was removed.`
    );

    renderTable();

    notifyDataChanged();

}


// =========================================================
// TOGGLE STATUS
// =========================================================

function toggleStatus(
    id
) {

    const data =
        readData();

    const index =
        data.findIndex(
            item =>
                item.id === id
        );

    if (index === -1) return;

    const record =
        data[index];

    record.status =
        record.status === "active"
            ? "inactive"
            : "active";

    record.updatedAt =
        new Date().toISOString();

    writeData(
        data
    );

    writeActivity(
        "update",
        `${capitalize(record.status)} ${record.name}`,
        record
    );

    showToast(
        "success",
        "Status updated",
        `${record.name} is now ${capitalize(record.status)}.`
    );

    renderTable();

    notifyDataChanged();

}


// =========================================================
// BULK STATUS
// =========================================================

function bulkUpdateStatus(
    status
) {

    if (!selectedIds.size)
        return;

    const data =
        readData();

    let changed = 0;

    data.forEach(
        record => {

            if (
                selectedIds.has(
                    record.id
                ) &&
                record.status !== status
            ) {

                record.status =
                    status;

                record.updatedAt =
                    new Date().toISOString();

                changed++;

            }

        }
    );

    writeData(
        data
    );

    writeActivity(
        "update",
        `${capitalize(status)} ${changed} selected record${changed === 1 ? "" : "s"}`
    );

    selectedIds.clear();

    showToast(
        "success",
        "Bulk update complete",
        `${changed} record${changed === 1 ? "" : "s"} updated.`
    );

    renderTable();

    notifyDataChanged();

}


// =========================================================
// BULK DELETE
// =========================================================

function bulkDelete() {

    if (!selectedIds.size)
        return;

    const ids =
        new Set(
            selectedIds
        );

    if (
        !window.confirm(
            `Delete ${ids.size} selected record${ids.size === 1 ? "" : "s"}? This action cannot be undone.`
        )
    ) {
        return;
    }

    const data =
        readData();

    const removed =
        data.filter(
            record =>
                ids.has(record.id)
        );

    writeData(
        data.filter(
            record =>
                !ids.has(record.id)
        )
    );

    writeActivity(
        "delete",
        `Deleted ${removed.length} selected record${removed.length === 1 ? "" : "s"}`
    );

    selectedIds.clear();

    showToast(
        "success",
        "Records deleted",
        `${removed.length} record${removed.length === 1 ? "" : "s"} removed.`
    );

    renderTable();

    notifyDataChanged();

}


// =========================================================
// CSV EXPORT
// =========================================================

function exportCsv() {

    const data =
        getFilteredData();

    if (!data.length) {

        showToast(
            "warning",
            "Nothing to export",
            "There are no matching records."
        );

        return;

    }

    const headers = [

        "ID",
        "Name",
        "Category",
        "Status",
        "Description",
        "Image Count",
        "Created At",
        "Updated At"

    ];

    const rows =
        data.map(
            record => [

                record.id,

                record.name,

                record.category,

                record.status,

                record.description || "",

                normalizeImages(record)
                    .length,

                record.createdAt,

                record.updatedAt

            ]
        );

    const csv =
        [
            headers,
            ...rows
        ]
            .map(
                row =>
                    row
                        .map(
                            csvEscape
                        )
                        .join(",")
            )
            .join("\r\n");

    const blob =
        new Blob(
            [
                "\uFEFF" + csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        `crud-master-export-${getDateOnly(
            new Date()
        )}.csv`;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );

    showToast(
        "success",
        "Export complete",
        `${data.length} record${data.length === 1 ? "" : "s"} exported.`
    );

}


function csvEscape(
    value
) {

    const text =
        String(
            value ?? ""
        );

    return /[",\r\n]/.test(
        text
    )

        ? `"${text.replaceAll(
            '"',
            '""'
        )}"`

        : text;

}


// =========================================================
// CSV PARSER
// =========================================================

function parseCsv(
    text
) {

    const rows = [];

    let row = [];

    let cell = "";

    let quoted = false;

    for (
        let i = 0;
        i < text.length;
        i += 1
    ) {

        const char =
            text[i];

        const next =
            text[i + 1];


        if (
            char === '"' &&
            quoted &&
            next === '"'
        ) {

            cell += '"';

            i += 1;

            continue;

        }


        if (
            char === '"'
        ) {

            quoted =
                !quoted;

            continue;

        }


        if (
            char === "," &&
            !quoted
        ) {

            row.push(
                cell
            );

            cell = "";

            continue;

        }


        if (
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !quoted
        ) {

            if (
                char === "\r" &&
                next === "\n"
            ) {

                i += 1;

            }

            row.push(
                cell
            );

            cell = "";

            if (
                row.some(
                    value =>
                        value.trim() !== ""
                )
            ) {

                rows.push(
                    row
                );

            }

            row = [];

            continue;

        }

        cell += char;

    }


    if (
        cell.length ||
        row.length
    ) {

        row.push(
            cell
        );

        if (
            row.some(
                value =>
                    value.trim() !== ""
            )
        ) {

            rows.push(
                row
            );

        }

    }

    return rows;

}


// =========================================================
// CSV IMPORT
// =========================================================

async function importCsv(
    file
) {

    if (!file) return;

    try {

        const text =
            await file.text();

        const rows =
            parseCsv(text);

        if (
            rows.length < 2
        ) {

            throw new Error(
                "CSV has no data rows."
            );

        }

        const headers =
            rows[0].map(
                h =>
                    h
                        .trim()
                        .toLowerCase()
            );

        const indexOf =
            (names) =>
                names
                    .map(
                        name =>
                            headers.indexOf(
                                name
                            )
                    )
                    .find(
                        index =>
                            index >= 0
                    ) ?? -1;

        const nameIndex =
            indexOf(["name"]);

        const categoryIndex =
            indexOf(["category"]);

        const statusIndex =
            indexOf(["status"]);

        const descriptionIndex =
            indexOf([
                "description"
            ]);

        if (
            nameIndex < 0 ||
            categoryIndex < 0
        ) {

            throw new Error(
                "CSV must contain Name and Category columns."
            );

        }

        const data =
            readData();

        const now =
            new Date().toISOString();

        let imported = 0;

        rows
            .slice(1)
            .forEach(
                row => {

                    const name =
                        String(
                            row[nameIndex] ||
                            ""
                        ).trim();

                    const category =
                        String(
                            row[
                                categoryIndex
                            ] || ""
                        ).trim();

                    if (
                        !name ||
                        !category
                    ) {
                        return;
                    }

                    const rawStatus =
                        String(
                            statusIndex >= 0
                                ? row[
                                    statusIndex
                                ]
                                : "active"
                        )
                            .trim()
                            .toLowerCase();

                    const status =
                        rawStatus ===
                        "inactive"
                            ? "inactive"
                            : "active";

                    data.unshift({

                        id:
                            createId(),

                        name,

                        category,

                        status,

                        description:
                            String(
                                descriptionIndex >= 0
                                    ? row[
                                        descriptionIndex
                                    ] || ""
                                    : ""
                            ).trim(),

                        images: [],

                        image: "",

                        createdAt:
                            now,

                        updatedAt:
                            now

                    });

                    imported++;

                }
            );

        writeData(
            data
        );

        writeActivity(
            "create",
            `Imported ${imported} record${imported === 1 ? "" : "s"}`
        );

        currentPage =
            1;

        showToast(
            "success",
            "Import complete",
            `${imported} record${imported === 1 ? "" : "s"} imported.`
        );

        renderTable();

        notifyDataChanged();

    } catch (error) {

        console.error(
            error
        );

        showToast(
            "error",
            "Import failed",
            error.message ||
            "Invalid CSV file."
        );

    }

}


// =========================================================
// CLEAR FILTERS
// =========================================================

function clearFilters() {

    [
        "dataSearch",
        "dateFromFilter",
        "dateToFilter"

    ].forEach(
        id => {

            if ($(id)) {

                $(id).value =
                    "";

            }

        }
    );

    if ($("statusFilter")) {

        $("statusFilter").value =
            "all";

    }

    if ($("categoryFilter")) {

        $("categoryFilter").value =
            "all";

    }

    currentPage =
        1;

    renderTable();

}


// =========================================================
// DATA CHANGE EVENT
// =========================================================

function notifyDataChanged() {

    window.dispatchEvent(
        new CustomEvent(
            "crud:data-changed"
        )
    );

}


// =========================================================
// CAPITALIZE
// =========================================================

function capitalize(
    value = ""
) {

    return (
        value.charAt(0)
        .toUpperCase() +
        value.slice(1)
    );

}


// =========================================================
// INITIALIZE
// =========================================================

function initializeCrud() {

    if (initialized)
        return;

    initialized = true;


    // -------------------------------------------------------
    // PAGE SIZE
    // -------------------------------------------------------

    if (
        $("pageSizeSelect")
    ) {

        $("pageSizeSelect")
            .value =
            String(pageSize);

        $("pageSizeSelect")
            .addEventListener(
                "change",
                event => {

                    pageSize =
                        Number(
                            event.target.value
                        ) || 8;

                    localStorage.setItem(
                        PAGE_SIZE_KEY,
                        String(pageSize)
                    );

                    currentPage =
                        1;

                    selectedIds.clear();

                    renderTable();

                }
            );

    }


    // -------------------------------------------------------
    // ADD BUTTON
    // -------------------------------------------------------

    $("addDataButton")
        ?.addEventListener(
            "click",
            () =>
                openModal("add")
        );


    // -------------------------------------------------------
    // MODAL
    // -------------------------------------------------------

    $("dataModalClose")
        ?.addEventListener(
            "click",
            closeModal
        );

    $("dataModalCancel")
        ?.addEventListener(
            "click",
            closeModal
        );


    $("dataForm")
        ?.addEventListener(
            "submit",
            handleSubmit
        );


    // -------------------------------------------------------
    // IMAGE INPUT
    // -------------------------------------------------------

    $("dataImages")
        ?.addEventListener(
            "change",
            event => {

                handleImageSelection(
                    event.target.files
                );

            }
        );


    // -------------------------------------------------------
    // IMAGE REMOVE
    // -------------------------------------------------------

    $("imagePreview")
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-remove-image]"
                    );

                if (!button)
                    return;

                const index =
                    Number(
                        button.dataset
                            .removeImage
                    );

                if (
                    Number.isNaN(index)
                ) {
                    return;
                }

                selectedImages.splice(
                    index,
                    1
                );

                renderImagePreview();

            }
        );


    // -------------------------------------------------------
    // EXPORT / IMPORT
    // -------------------------------------------------------

    $("exportDataButton")
        ?.addEventListener(
            "click",
            exportCsv
        );


    $("importDataButton")
        ?.addEventListener(
            "click",
            () =>
                $("importDataInput")
                    ?.click()
        );


    $("importDataInput")
        ?.addEventListener(
            "change",
            event => {

                importCsv(
                    event.target.files?.[0]
                );

                event.target.value =
                    "";

            }
        );


    // -------------------------------------------------------
    // FILTERS
    // -------------------------------------------------------

    $("clearDataFilters")
        ?.addEventListener(
            "click",
            clearFilters
        );


    [
        "dataSearch",
        "dateFromFilter",
        "dateToFilter"

    ].forEach(
        id => {

            $(id)?.addEventListener(
                "input",
                () => {

                    currentPage =
                        1;

                    renderTable();

                }
            );

        }
    );


    $("statusFilter")
        ?.addEventListener(
            "change",
            () => {

                currentPage =
                    1;

                renderTable();

            }
        );


    $("categoryFilter")
        ?.addEventListener(
            "change",
            () => {

                currentPage =
                    1;

                renderTable();

            }
        );


    // -------------------------------------------------------
    // BULK
    // -------------------------------------------------------

    $("selectAllData")
        ?.addEventListener(
            "change",
            event =>
                selectVisibleRows(
                    event.target.checked
                )
        );


    $("bulkActivateButton")
        ?.addEventListener(
            "click",
            () =>
                bulkUpdateStatus(
                    "active"
                )
        );


    $("bulkDeactivateButton")
        ?.addEventListener(
            "click",
            () =>
                bulkUpdateStatus(
                    "inactive"
                )
        );


    $("bulkDeleteButton")
        ?.addEventListener(
            "click",
            bulkDelete
        );


    // -------------------------------------------------------
    // SORT
    // -------------------------------------------------------

    document
        .querySelectorAll(
            ".table-sort"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const field =
                            button.dataset.sort;

                        if (
                            sortField === field
                        ) {

                            sortDirection =
                                sortDirection ===
                                "asc"
                                    ? "desc"
                                    : "asc";

                        } else {

                            sortField =
                                field;

                            sortDirection =
                                field ===
                                "createdAt"
                                    ? "desc"
                                    : "asc";

                        }

                        currentPage =
                            1;

                        renderTable();

                    }
                );

            }
        );


    // -------------------------------------------------------
    // ROW CHECKBOX
    // -------------------------------------------------------

    $("dataTableBody")
        ?.addEventListener(
            "change",
            event => {

                const checkbox =
                    event.target.closest(
                        ".row-checkbox"
                    );

                if (!checkbox)
                    return;

                const id =
                    checkbox.dataset.id;

                if (
                    checkbox.checked
                ) {

                    selectedIds.add(
                        id
                    );

                } else {

                    selectedIds.delete(
                        id
                    );

                }

                updateBulkBar();

                updateSelectAllState(
                    new Set(
                        getVisibleData()
                            .map(
                                record =>
                                    record.id
                            )
                    )
                );

            }
        );


    // -------------------------------------------------------
    // TABLE ACTIONS
    // -------------------------------------------------------

    $("dataTableBody")
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button)
                    return;

                const action =
                    button.dataset.action;

                const id =
                    button.dataset.id;

                if (
                    action === "view"
                ) {

                    openModal(
                        "view",
                        id
                    );

                }

                if (
                    action === "edit"
                ) {

                    openModal(
                        "edit",
                        id
                    );

                }

                if (
                    action === "delete"
                ) {

                    deleteRecord(
                        id
                    );

                }

                if (
                    action ===
                    "toggle-status"
                ) {

                    toggleStatus(
                        id
                    );

                }

            }
        );


    // -------------------------------------------------------
    // PAGINATION
    // -------------------------------------------------------

    $("paginationControls")
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-page]"
                    );

                if (
                    !button ||
                    button.disabled
                ) {
                    return;
                }

                const page =
                    Number(
                        button.dataset.page
                    );

                if (
                    !Number.isFinite(
                        page
                    ) ||
                    page < 1
                ) {
                    return;
                }

                currentPage =
                    page;

                renderTable();

            }
        );


    // -------------------------------------------------------
    // MODAL BACKDROP
    // -------------------------------------------------------

    $("dataModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "dataModal"
                ) {

                    closeModal();

                }

            }
        );


    // -------------------------------------------------------
    // ESCAPE
    // -------------------------------------------------------

    document
        .addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape" &&
                    !$("dataModal")?.hidden
                ) {

                    closeModal();

                }

            }
        );


    // -------------------------------------------------------
    // QUICK ADD
    // -------------------------------------------------------

    window.addEventListener(
        "crud:open-add",
        () =>
            openModal("add")
    );


    // -------------------------------------------------------
    // INITIAL RENDER
    // -------------------------------------------------------

    renderTable();

}


// =========================================================
// EXPORT
// =========================================================

export {

    initializeCrud,

    readData,

    readActivities,

    formatDate,

    formatDateTime

};