// =========================================================
// CRUD MASTER - MAIN APPLICATION
// =========================================================


// =========================================================
// 1. DOM ELEMENTS
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
// 2. PAGE CONFIGURATION
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
// 3. GET CURRENT PAGE
// =========================================================

function getCurrentPage() {

    const hash = window.location.hash.replace("#", "");

    if (pageConfig[hash]) {
        return hash;
    }

    return "dashboard";
}


// =========================================================
// 4. SHOW PAGE
// =========================================================

function showPage(pageName) {

    if (!pageConfig[pageName]) {
        pageName = "dashboard";
    }


    // -----------------------------------------
    // Hide all pages
    // -----------------------------------------

    pages.forEach((page) => {

        page.classList.remove("active");

        page.hidden = true;

    });


    // -----------------------------------------
    // Show selected page
    // -----------------------------------------

    const targetPage =
        document.getElementById(`${pageName}Page`);

    if (targetPage) {

        targetPage.hidden = false;

        targetPage.classList.add("active");

    }


    // -----------------------------------------
    // Update navigation
    // -----------------------------------------

    navItems.forEach((item) => {

        item.classList.remove("active");

        if (item.dataset.page === pageName) {
            item.classList.add("active");
        }

    });


    // -----------------------------------------
    // Update topbar
    // -----------------------------------------

    pageTitle.textContent =
        pageConfig[pageName].title;

    pageSubtitle.textContent =
        pageConfig[pageName].subtitle;


    // -----------------------------------------
    // Close mobile sidebar
    // -----------------------------------------

    closeSidebar();

}


// =========================================================
// 5. ROUTER
// =========================================================

function handleRoute() {

    const pageName = getCurrentPage();

    showPage(pageName);

}


// =========================================================
// 6. OPEN SIDEBAR
// =========================================================

function openSidebar() {

    sidebar.classList.add("open");

    sidebarOverlay.hidden = false;

    document.body.style.overflow = "hidden";

}


// =========================================================
// 7. CLOSE SIDEBAR
// =========================================================

function closeSidebar() {

    sidebar.classList.remove("open");

    sidebarOverlay.hidden = true;

    document.body.style.overflow = "";

}


// =========================================================
// 8. SIDEBAR TOGGLE
// =========================================================

if (sidebarToggle) {

    sidebarToggle.addEventListener(
        "click",
        openSidebar
    );

}


if (sidebarClose) {

    sidebarClose.addEventListener(
        "click",
        closeSidebar
    );

}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );

}


// =========================================================
// 9. NAVIGATION CLICK
// =========================================================

navItems.forEach((item) => {

    item.addEventListener("click", () => {

        const pageName = item.dataset.page;

        if (!pageName) {
            return;
        }

        window.location.hash = pageName;

    });

});


// =========================================================
// 10. HASH CHANGE
// =========================================================

window.addEventListener(
    "hashchange",
    handleRoute
);


// =========================================================
// 11. QUICK ACTIONS
// =========================================================

const quickActions =
    document.querySelectorAll(".quick-action");


quickActions.forEach((button) => {

    button.addEventListener("click", () => {

        const action =
            button.dataset.action;


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

        }

    });

});


// =========================================================
// 12. PAGE LINK BUTTONS
// =========================================================

const pageLinkButtons =
    document.querySelectorAll("[data-page-link]");


pageLinkButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const pageName =
            button.dataset.pageLink;

        if (!pageName) {
            return;
        }

        window.location.hash = pageName;

    });

});


// =========================================================
// 13. NOTIFICATION BUTTON
// =========================================================

const notificationButton =
    document.getElementById(
        "notificationButton"
    );


if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        () => {

            console.log(
                "Notification system will be added later."
            );

        }
    );

}


// =========================================================
// 14. LOGOUT BUTTON
// =========================================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            console.log(
                "Logout system will be connected to Firebase later."
            );

        }
    );

}


// =========================================================
// 15. INITIALIZE APPLICATION
// =========================================================

function initializeApp() {

    console.log(
        "CRUD Master initialized."
    );

    console.log(
        "Current page:",
        getCurrentPage()
    );

    handleRoute();

}


// =========================================================
// 16. START APPLICATION
// =========================================================

initializeApp();