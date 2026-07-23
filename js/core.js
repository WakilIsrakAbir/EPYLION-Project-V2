// ==========================================================
// CORE: Init, Permissions, Navigation
// ==========================================================
function initDashboard() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }
    document.getElementById('displayUsername').innerText = `${localStorage.getItem('username')} (${localStorage.getItem('role')})`;
    applyPermissions();
    loadUploadedFiles();
    startHeartbeat();

    const savedState = localStorage.getItem('activePage');
    if (savedState) {
        const state = JSON.parse(savedState);
        if (state.page === 'dashboard') {
            showDashboardHome();
        } else if (state.page === 'dataManagement') {
            showDataManagementView();
        } else if (state.page === 'menu') {
            loadMenuData(state.dept, state.title, state.mode);
        } else if (state.page === 'orderStatus') {
            showOrderStatus();
        } else if (state.page === 'actualTracking' && state.dept) {
            loadActualTracking(state.dept);
        } 
        else {
            showDashboardHome();
        }
    } else {
        showDashboardHome();
    }
}

function setActiveSidebarMenu(activeId) {
    const isDark = document.documentElement.classList.contains('dark');
    const textClass = isDark ? 'dm-text-light' : 'text-black';
    const removeTextClass = isDark ? 'text-black' : 'dm-text-light';

    document.querySelectorAll('.sidebar-menu-item').forEach(el => {
        el.classList.remove('bg-sidebarActive', 'text-black', 'dm-text-light', 'border-[#4CAF50]');
        el.classList.add('border-transparent');

        if (el.classList.contains('submenu-item')) {
            el.classList.add(textClass);
        }
    });

    const activeEl = document.getElementById(activeId);
    if (activeEl) {
        activeEl.classList.remove('border-transparent');
        activeEl.classList.add('bg-sidebarActive', textClass, 'border-[#4CAF50]');

        const parentMenu = activeEl.closest('ul');
        if (parentMenu && parentMenu.classList.contains('hidden')) {
            parentMenu.classList.remove('hidden');
            const chevron = parentMenu.previousElementSibling.querySelector('.fa-chevron-left');
            if (chevron) chevron.classList.add('-rotate-90');
        }
    }
}

function applyPermissions() {
    const role = localStorage.getItem('role');
    const permsStr = localStorage.getItem('permissions');
    let permissions = null;
    
    if (permsStr) {
        try {
            permissions = JSON.parse(permsStr);
        } catch(e) {}
    }

    const uploadArea = document.getElementById('uploadArea');
    const sidebarManageUsers = document.getElementById('sidebarManageUsers');
    const sidebarDataManagement = document.getElementById('sidebarDataManagement');

    if (permissions && permissions.menus) {
        const m = permissions.menus;

        // Toggle Main Menus
        if (m.manageUsers && m.manageUsers.view) sidebarManageUsers?.classList.remove('hidden');
        else sidebarManageUsers?.classList.add('hidden');

        if (m.dataManagement && m.dataManagement.view) sidebarDataManagement?.classList.remove('hidden');
        else sidebarDataManagement?.classList.add('hidden');

        // Toggle Order Management Submenus
        if (m.orderManagement) {
            ['yd', 'knitting', 'dyeing', 'finishing', 'delivery'].forEach(k => {
                const el = document.getElementById(`menu-${k}-manage`);
                if (el) m.orderManagement[k] ? el.parentElement.classList.remove('hidden') : el.parentElement.classList.add('hidden');
            });
        }
        
        // Toggle Reports Submenus
        if (m.reports) {
            ['yd', 'knitting', 'dyeing', 'finishing', 'delivery'].forEach(k => {
                const el = document.getElementById(`menu-${k}-report`);
                if (el) m.reports[k] ? el.parentElement.classList.remove('hidden') : el.parentElement.classList.add('hidden');
            });
            const os = document.getElementById('menu-order-status');
            if (os) m.reports.orderStatus ? os.parentElement.classList.remove('hidden') : os.parentElement.classList.add('hidden');
        }

        // Toggle Actual Tracking
        if (m.actualTracking) {
            ['yd', 'knitting', 'dyeing', 'finishing', 'delivery'].forEach(k => {
                const el = document.getElementById(`menu-${k}-actual`);
                if (el) m.actualTracking[k] ? el.parentElement.classList.remove('hidden') : el.parentElement.classList.add('hidden');
            });
        }

        // Toggle Tracking Reports
        if (m.trackingReports) {
            ['yd', 'knitting', 'dyeing', 'finishing', 'delivery'].forEach(k => {
                const el = document.getElementById(`menu-${k}-actual-report`);
                if (el) m.trackingReports[k] ? el.parentElement.classList.remove('hidden') : el.parentElement.classList.add('hidden');
            });
        }

        // Toggle Load Calculation
        if (m.loadCalculation) {
            const lDetailed = document.getElementById('menu-load-detailed');
            if (lDetailed) m.loadCalculation.detailed ? lDetailed.parentElement.classList.remove('hidden') : lDetailed.parentElement.classList.add('hidden');
            const lSummary = document.getElementById('menu-load-summary');
            if (lSummary) m.loadCalculation.summary ? lSummary.parentElement.classList.remove('hidden') : lSummary.parentElement.classList.add('hidden');
        }

        // Hide upload area if not allowed to upload anything
        let canUpload = false;
        if (m.dataManagement) {
            if (m.dataManagement.uploadGeneral || m.dataManagement.uploadYD || m.dataManagement.uploadKnitting || m.dataManagement.uploadDyeing || m.dataManagement.uploadFinishing || m.dataManagement.uploadDelivery) {
                canUpload = true;
            }
        }
        if (uploadArea) uploadArea.style.display = canUpload ? 'flex' : 'none';

    } else {
        // Fallback to legacy role checks
        if (role === 'Admin') { if (sidebarManageUsers) sidebarManageUsers.classList.remove('hidden'); }
        else { if (sidebarManageUsers) sidebarManageUsers.classList.add('hidden'); }
        if (role === 'Viewer' || role === 'Approver') { if (sidebarDataManagement) sidebarDataManagement.classList.add('hidden'); }
        else { if (sidebarDataManagement) sidebarDataManagement.classList.remove('hidden'); }
        if (role === 'Viewer') { if (uploadArea) uploadArea.style.display = 'none'; }
        else { if (uploadArea) uploadArea.style.display = 'flex'; }
    }
}

function startHeartbeat() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const sendHeartbeat = () => {
        fetch('https://abir-backend-api.onrender.com/api/auth/heartbeat', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.log('Heartbeat failed', err));
    };
    
    // Send immediately, then every 60 seconds
    sendHeartbeat();
    setInterval(sendHeartbeat, 60000);
}

function logout() { localStorage.clear(); window.location.href = 'login.html'; }
function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = msg;
    t.classList.remove('opacity-0', 'pointer-events-none');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => t.classList.add('opacity-0', 'pointer-events-none'), 3000);
}

function hideAllCoreViews() {
    const views = [
        'dashboardHomeView', 
        'dataManagementView', 
        'listView', 
        'detailedView', 
        'planVsActualReportView', 
        'planVsActualView',
        'orderStatusSection', 
        'loadCalculationView'
    ];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

function showDashboardHome() {
    localStorage.setItem('activePage', JSON.stringify({ page: 'dashboard' }));

    activeTabId = 'dashboard';
    hideAllCoreViews();
    document.getElementById('dashboardHomeView').classList.remove('hidden');
    renderTabs();
    closeSidebarMobile();
    setActiveSidebarMenu('menu-dashboard');
}

function showDataManagementView() {
    localStorage.setItem('activePage', JSON.stringify({ page: 'dataManagement' }));

    activeTabId = 'dataManagement';
    hideAllCoreViews();
    document.getElementById('dataManagementView').classList.remove('hidden');
    renderTabs();
    closeSidebarMobile();
    setActiveSidebarMenu('menu-data-mgmt');
}

async function loadMenuData(deptKey, menuName, mode = 'manage') {
    localStorage.setItem('activePage', JSON.stringify({ page: 'menu', dept: deptKey, title: menuName, mode: mode }));

    const uniqueId = mode === 'report' ? `${deptKey}_report` : deptKey;
    activeTabId = uniqueId;
    isReportMode = (mode === 'report');

    hideAllCoreViews();
    document.getElementById('listView').classList.remove('hidden');

    if (isReportMode) {
        document.getElementById('normalListContainer').classList.add('hidden');
        document.getElementById('reportActionContainer').classList.remove('hidden');
        document.getElementById('reportActionContainer').style.display = 'flex';
        document.getElementById('reportPageHeader').innerText = `${deptKey.charAt(0).toUpperCase() + deptKey.slice(1)} Department Reports`;
    } else {
        document.getElementById('normalListContainer').classList.remove('hidden');
        document.getElementById('reportActionContainer').classList.add('hidden');
        document.getElementById('reportActionContainer').style.display = 'none';
        activateMainTab('Pending');
    }

    if (!openTabs.find(tab => tab.id === uniqueId)) openTabs.push({ id: uniqueId, title: menuName, dept: deptKey, mode: mode });
    renderTabs();

    document.querySelectorAll('.header-search').forEach(inp => inp.value = '');
    colFilters = {};
    activeBuyer = '';

    if (!isReportMode) renderDynamicHeaders();
    setActiveSidebarMenu('menu-' + deptKey + '-' + mode);

    await fetchAndProcessData();
    closeSidebarMobile();
}

function setUploadCategory(cat) {
    activeUploadCategory = cat;
    document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab' + cat).classList.add('active');
    document.getElementById('currentUploadLabel').innerText = cat + ' Data';
    document.getElementById('directoryLabel').innerText = cat;
    loadUploadedFiles();
}
