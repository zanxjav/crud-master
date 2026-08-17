import { initializeCrud } from "./crud.js";
import { initializeDashboard } from "./dashboard.js";
import { initUsers } from "./users.js";
import { initReports } from "./report.js";
import { initProfile } from "./profile.js";
import { initSettings } from "./settings.js";

// =========================================================
// CRUD MASTER - MAIN APPLICATION
// =========================================================

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");


// =========================================================
// PAGE CONFIGURATION
// =========================================================

const pageConfig = {
    dashboard: {
        title: "Dashboard",
        subtitle: "Overview of your business"
    },

    data: {
        title: "Data Management",
        subtitle: "Manage your business data"
    },

    users: {
        title: "User Management",
        subtitle: "Manage system users and permissions"
    },

    reports: {
        title: "Reports",
        subtitle: "View reports and business analytics"
    },

    profile: {
        title: "Profile",
        subtitle: "Manage your personal information"
    },

    settings: {
        title: "Settings",
        subtitle: "Configure your system preferences"
    }
};


// =========================================================
// GET CURRENT PAGE
// =========================================================

function getCurrentPage() {
    const hash = window.location.hash.replace("#", "").trim();

    if (pageConfig[hash]) {
        return hash;
    }

    return "dashboard";
}


// =========================================================
// SHOW PAGE
// =========================================================

function showPage(pageName) {

    if (!pageConfig[pageName]) {
        pageName = "dashboard";
    }

    // Hide all pages
    pages.forEach((page) => {
        page.classList.remove("active");
        page.hidden = true;
    });

    // Show selected page
    const targetPage = document.getElementById(`${pageName}Page`);

    if (targetPage) {
        targetPage.hidden = false;
        targetPage.classList.add("active");
    }

    // Update navigation
    navItems.forEach((item) => {
        item.classList.toggle(
            "active",
            item.dataset.page === pageName
        );
    });

    // Update page title
    if (pageTitle) {
        pageTitle.textContent = pageConfig[pageName].title;
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = pageConfig[pageName].subtitle;
    }

    // Close sidebar on mobile
    closeSidebar();
}


// =========================================================
// ROUTER
// =========================================================

function handleRoute() {
    showPage(getCurrentPage());
}


// =========================================================
// SIDEBAR
// =========================================================

function openSidebar() {

    if (!sidebar) return;

    sidebar.classList.add("open");

    if (sidebarOverlay) {
        sidebarOverlay.hidden = false;
        sidebarOverlay.classList.add("visible");
    }

    document.body.classList.add("sidebar-open");
}


function closeSidebar() {

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (sidebarOverlay) {
        sidebarOverlay.hidden = true;
        sidebarOverlay.classList.remove("visible");
    }

    document.body.classList.remove("sidebar-open");
}


// Toggle
sidebarToggle?.addEventListener("click", () => {

    if (sidebar?.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }

});


// Close button
sidebarClose?.addEventListener(
    "click",
    closeSidebar
);


// Overlay
sidebarOverlay?.addEventListener(
    "click",
    closeSidebar
);


// =========================================================
// SIDEBAR NAVIGATION
// =========================================================

navItems.forEach((item) => {

    item.addEventListener("click", (event) => {

        const pageName = item.dataset.page;

        if (!pageName || !pageConfig[pageName]) {
            return;
        }

        event.preventDefault();

        window.location.hash = pageName;

        closeSidebar();

    });

});


// =========================================================
// HASH CHANGE
// =========================================================

window.addEventListener(
    "hashchange",
    handleRoute
);


// =========================================================
// QUICK ACTIONS
// =========================================================

document
    .querySelectorAll(".quick-action")
    .forEach((button) => {

        button.addEventListener("click", () => {

            const action = button.dataset.action;

            if (action === "users") {

                window.location.hash = "users";

            }

            else if (action === "reports") {

                window.location.hash = "reports";

            }

            else if (action === "settings") {

                window.location.hash = "settings";

            }

            else if (action === "add") {

                window.location.hash = "data";

                /*
                 * Tunggu router selesai mengganti halaman
                 * sebelum membuka modal.
                 */
                window.setTimeout(() => {

                    window.dispatchEvent(
                        new CustomEvent("crud:open-add")
                    );

                }, 50);

            }

        });

    });


// =========================================================
// PAGE LINK BUTTONS
// =========================================================

document
    .querySelectorAll("[data-page-link]")
    .forEach((button) => {

        button.addEventListener("click", (event) => {

            const pageName = button.dataset.pageLink;

            if (!pageName || !pageConfig[pageName]) {
                return;
            }

            event.preventDefault();

            window.location.hash = pageName;

        });

    });


// =========================================================
// NOTIFICATION BUTTON
// =========================================================

const notificationButton =
    document.getElementById("notificationButton");

notificationButton?.addEventListener(
    "click",
    () => {

        console.log(
            "Notification system is not connected yet."
        );

    }
);


// =========================================================
// LOGOUT BUTTON
// =========================================================

const logoutButton =
    document.getElementById("logoutButton");

logoutButton?.addEventListener(
    "click",
    () => {

        const confirmed = window.confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmed) {
            return;
        }

        console.log(
            "Logout system will be connected later."
        );

    }
);


// =========================================================
// GLOBAL ESCAPE KEY
// =========================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {
            closeSidebar();
        }

    }
);


// =========================================================
// WINDOW RESIZE
// =========================================================

window.addEventListener(
    "resize",
    () => {

        /*
         * Jangan biarkan sidebar mobile
         * tetap terbuka ketika kembali ke desktop.
         */
        if (window.innerWidth > 1100) {
            closeSidebar();
        }

    }
);


// =========================================================
// INITIALIZE APPLICATION
// =========================================================

function initializeApp() {

    console.log(
        "===================================="
    );

    console.log(
        "CRUD Master initialized."
    );

    console.log(
        "Current page:",
        getCurrentPage()
    );

    console.log(
        "===================================="
    );


    // Router
    handleRoute();


    // CRUD
    try {
        initializeCrud();
    } catch (error) {
        console.error(
            "CRUD initialization failed:",
            error
        );
    }


    // Dashboard
    try {
        initializeDashboard();
    } catch (error) {
        console.error(
            "Dashboard initialization failed:",
            error
        );
    }


    // Users
    try {
        initUsers();
    } catch (error) {
        console.error(
            "Users initialization failed:",
            error
        );
    }


    // Reports
    try {
        initReports();
    } catch (error) {
        console.error(
            "Reports initialization failed:",
            error
        );
    }


    // Profile
    try {
        initProfile();
    } catch (error) {
        console.error(
            "Profile initialization failed:",
            error
        );
    }


    // Settings
    try {
        initSettings();
    } catch (error) {
        console.error(
            "Settings initialization failed:",
            error
        );
    }

}


// =========================================================
// START
// =========================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp,
        { once: true }
    );

} else {

    initializeApp();

}