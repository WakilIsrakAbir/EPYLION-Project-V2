// ==========================================================
// CORE: Init, Permissions, Navigation
// ==========================================================
function initDashboard() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }
    document.getElementById('displayUsername').innerText = `${localStorage.getItem('username')} (${localStorage.getItem('role')})`;
    applyPermissions(localStorage.getItem('role'));
    loadUploadedFiles();

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

function applyPermissions(role) {
    const sidebarManageUsers = document.getElementById('sidebarManageUsers');
    const sidebarDataManagement = document.getElementById('sidebarDataManagement');
    if (role === 'Admin') { if (sidebarManageUsers) sidebarManageUsers.classList.remove('hidden'); }
    else { if (sidebarManageUsers) sidebarManageUsers.classList.add('hidden'); }
    if (role === 'Viewer' || role === 'Approver') { if (sidebarDataManagement) sidebarDataManagement.classList.add('hidden'); }
    else { if (sidebarDataManagement) sidebarDataManagement.classList.remove('hidden'); }
    const uploadArea = document.getElementById('uploadArea');
    if (role === 'Viewer') { if (uploadArea) uploadArea.style.display = 'none'; }
    else { if (uploadArea) uploadArea.style.display = 'flex'; }
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
