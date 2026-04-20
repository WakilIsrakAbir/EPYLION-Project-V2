// let toastTimeout;
// let openTabs = [];
// let activeTabId = null;

// function initDashboard() {
//     showDashboardHome();
// }

// // --- DASHBOARD ACTIONS ---
// function showDashboardHome() {
//     activeTabId = 'dashboard';
//     document.getElementById('listView').classList.add('hidden');
//     document.getElementById('listView').classList.remove('flex');
//     document.getElementById('detailedView').classList.add('hidden');
//     document.getElementById('detailedView').classList.remove('flex');

//     document.getElementById('dashboardHomeView').classList.remove('hidden');
//     document.getElementById('dashboardHomeView').classList.add('flex');

//     // Deactivate all sidebar items
//     document.querySelectorAll('.submenu-link').forEach(link => {
//         link.className = 'submenu-link block py-2 pl-6 pr-4 text-gray-400 hover:text-white transition-colors';
//     });

//     renderTabs();
//     closeSidebarMobile();
// }

// // --- TAB & DATA LOADING LOGIC ---
// function loadMenuData(dataKey, menuName, filterToApply = 'All') {
//     // Hide Dashboard and Detailed View
//     document.getElementById('dashboardHomeView').classList.add('hidden');
//     document.getElementById('dashboardHomeView').classList.remove('flex');
//     document.getElementById('detailedView').classList.add('hidden');
//     document.getElementById('detailedView').classList.remove('flex');

//     // Show List View
//     document.getElementById('listView').classList.remove('hidden');
//     document.getElementById('listView').classList.add('flex');

//     // Add tab if not already open
//     if (!openTabs.find(tab => tab.id === dataKey)) {
//         openTabs.push({
//             id: dataKey,
//             title: menuName
//         });
//     }
//     activeTabId = dataKey;

//     // Render the tabs at the top
//     renderTabs();

//     // Hide all tables, show target table
//     document.querySelectorAll('.data-table-container').forEach(t => {
//         t.classList.add('hidden');
//         t.classList.remove('block');
//     });

//     const targetTable = document.getElementById('table_' + dataKey);
//     if (targetTable) {
//         targetTable.classList.remove('hidden');
//         targetTable.classList.add('block');
//     }

//     // Update Sidebar visually
//     document.querySelectorAll('.submenu-link').forEach(link => {
//         link.className = 'submenu-link block py-2 pl-6 pr-4 text-gray-400 hover:text-white transition-colors';
//         if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(dataKey)) {
//             link.className = 'submenu-link block py-2 pl-6 pr-4 text-activeBlue bg-sidebarHover border-l-2 border-activeBlue';

//             // Auto-open the parent menu dropdown
//             const parentUl = link.closest('ul');
//             if (parentUl) {
//                 parentUl.classList.remove('hidden');
//                 parentUl.classList.add('block');
//                 const header = parentUl.previousElementSibling;
//                 if (header) {
//                     header.classList.add('bg-sidebarActive', 'text-white');
//                     header.classList.remove('hover:bg-sidebarDark');
//                     const icon = header.querySelector('i');
//                     if (icon) {
//                         icon.classList.remove('fa-chevron-left');
//                         icon.classList.add('fa-chevron-down');
//                     }
//                 }
//             }
//         }
//     });

//     // Automatically apply filter if provided (e.g. from Dashboard click)
//     setTimeout(() => {
//         const filterMap = {
//             'All': 'filter-all',
//             'Pending': 'filter-pending',
//             'Completed': 'filter-completed',
//             'Draft': 'filter-draft'
//         };
//         const targetBtn = document.querySelector(`.${filterMap[filterToApply]}`);
//         if (targetBtn) {
//             activateFilter(filterToApply, targetBtn);
//         }
//     }, 50);

//     showToast(`Loading: ${menuName}`);
//     closeSidebarMobile();
// }

// // Render dynamic tabs in the list view
// function renderTabs() {
//     const container = document.getElementById('dynamicTabsWrapper');
//     if (!container) return;

//     container.innerHTML = ''; // clear current tabs

//     openTabs.forEach(tab => {
//         const isActive = tab.id === activeTabId;

//         // Create Tab Element
//         const tabEl = document.createElement('div');
//         tabEl.className = `nav-tab px-4 py-2 border border-gray-200 border-b-0 rounded-t cursor-pointer flex items-center shrink-0 transition-colors ${isActive ? 'bg-white font-semibold text-gray-700 active-tab' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`;
//         tabEl.onclick = () => loadMenuData(tab.id, tab.title); // Clicking a tab switches to it

//         // Content with close button
//         tabEl.innerHTML = `
//             ${tab.title} 
//             <i class="fas fa-times ml-2 text-[10px] text-gray-400 hover:text-red-500 cursor-pointer" onclick="closeTab(event, '${tab.id}')"></i>
//         `;

//         container.appendChild(tabEl);
//     });

//     // Update static dashboard tab styling
//     const dashTab = document.getElementById('dashboardTabItem');
//     if (dashTab) {
//         if (activeTabId === 'dashboard') {
//             dashTab.className = 'nav-tab px-4 py-2 bg-white border border-gray-200 border-b-0 rounded-t font-semibold text-gray-700 cursor-pointer shrink-0 transition-colors active-tab';
//         } else {
//             dashTab.className = 'nav-tab px-4 py-2 bg-gray-50 border border-gray-200 border-b-0 rounded-t text-gray-600 hover:bg-gray-100 cursor-pointer shrink-0 transition-colors';
//         }
//     }
// }

// function closeTab(event, tabIdToClose) {
//     event.stopPropagation(); // prevent clicking the tab itself

//     openTabs = openTabs.filter(tab => tab.id !== tabIdToClose);

//     if (openTabs.length === 0) {
//         // If no tabs left, go back to dashboard
//         showDashboardHome();
//     } else if (activeTabId === tabIdToClose) {
//         // If we closed the currently active tab, switch to the last available tab
//         const lastTab = openTabs[openTabs.length - 1];
//         loadMenuData(lastTab.id, lastTab.title);
//     } else {
//         // If we closed a background tab, just re-render tabs
//         renderTabs();
//     }
// }

// // --- FILTER LOGIC ---
// function activateFilter(filterType, clickedBtnElement = null) {
//     // If button element not explicitly passed, find it
//     if (!clickedBtnElement) {
//         const filterMap = {
//             'All': 'filter-all',
//             'Pending': 'filter-pending',
//             'Completed': 'filter-completed',
//             'Draft': 'filter-draft'
//         };
//         clickedBtnElement = document.querySelector(`.${filterMap[filterType]}`);
//     }

//     if (clickedBtnElement) {
//         document.querySelectorAll('.filter-btn').forEach(btn => {
//             btn.className = `filter-btn px-3 py-1.5 bg-[#f4f5f7] text-gray-600 border border-gray-300 hover:bg-gray-200 rounded-sm whitespace-nowrap shadow-sm font-medium transition-colors ${btn.classList.contains('filter-all') ? 'filter-all' : btn.classList.contains('filter-pending') ? 'filter-pending' : btn.classList.contains('filter-completed') ? 'filter-completed' : 'filter-draft'}`;
//             const icon = btn.querySelector('i');
//             if (icon) icon.className = 'fas fa-list mr-1 text-gray-400';
//         });

//         clickedBtnElement.className = `filter-btn px-3 py-1.5 bg-green-700 text-white border border-green-800 rounded-sm whitespace-nowrap shadow-sm font-medium transition-colors ${clickedBtnElement.classList.contains('filter-all') ? 'filter-all' : clickedBtnElement.classList.contains('filter-pending') ? 'filter-pending' : clickedBtnElement.classList.contains('filter-completed') ? 'filter-completed' : 'filter-draft'}`;
//         const activeIcon = clickedBtnElement.querySelector('i');
//         if (activeIcon) activeIcon.className = 'fas fa-list mr-1 text-white';
//     }

//     // Apply visibility filtering to active table
//     const activeTable = document.querySelector('.data-table-container.block');
//     if (activeTable) {
//         const rows = activeTable.querySelectorAll('tbody tr');
//         let count = 0;
//         rows.forEach(row => {
//             const statusSpan = row.querySelector('span[class*="bg-"]');
//             const statusText = statusSpan ? statusSpan.textContent.toLowerCase() : '';
//             let show = false;

//             if (filterType === 'All') show = true;
//             else if (filterType === 'Pending' && (statusText.includes('pending') || statusText.includes('awaiting') || statusText.includes('review') || statusText.includes('inactive') || statusText.includes('discrepancy'))) show = true;
//             else if (filterType === 'Completed' && (statusText.includes('completed') || statusText.includes('approved') || statusText.includes('confirmed') || statusText.includes('success') || statusText.includes('endorsed') || statusText.includes('active') || statusText.includes('acknowledged') || statusText.includes('matched'))) show = true;
//             else if (filterType === 'Draft' && statusText.includes('draft')) show = true;

//             row.style.display = show ? '' : 'none';
//             if (show) count++;
//         });

//         const countDisplay = document.getElementById('totalItemsText');
//         if (countDisplay) {
//             countDisplay.textContent = `Showing ${count} item(s)`;
//         }
//     }
//     showToast('Filter Applied: ' + filterType);
// }

// // --- VIEWS TOGGLE ---
// function openDetailedView(id = 'Details') {
//     document.getElementById('listView').classList.add('hidden');
//     document.getElementById('listView').classList.remove('flex');

//     document.getElementById('detailedView').classList.remove('hidden');
//     document.getElementById('detailedView').classList.add('flex');

//     // Build the detailed tabs to look like it corresponds to the item opened
//     const detailTabsContainer = document.getElementById('detailTabsContainer');
//     if (detailTabsContainer) {
//         detailTabsContainer.innerHTML = `
//             <button onclick="closeDetailedView()" class="px-3 py-1.5 bg-white border border-gray-200 border-b-0 rounded-t text-activeBlue hover:bg-gray-50 flex items-center shadow-sm shrink-0">
//                 Close 
//             </button>
            
//             <div class="nav-tab px-4 py-2 bg-gray-50 border border-gray-200 border-b-0 rounded-t text-gray-600 hover:bg-gray-100 cursor-pointer shrink-0 transition-colors" onclick="showDashboardHome()">Dashboard</div>
//             <div class="nav-tab active-tab px-4 py-2 bg-white border border-gray-200 border-b-0 rounded-t font-semibold text-gray-700 cursor-pointer flex items-center shrink-0 transition-colors">
//                 Details for ${id} <i class="fas fa-times ml-2 text-[10px] text-gray-400 hover:text-red-500 cursor-pointer" onclick="closeDetailedView()"></i>
//             </div>
//         `;
//     }

//     showToast(`Loading details for: ${id}`);
// }

// function closeDetailedView() {
//     document.getElementById('detailedView').classList.add('hidden');
//     document.getElementById('detailedView').classList.remove('flex');
//     document.getElementById('listView').classList.remove('hidden');
//     document.getElementById('listView').classList.add('flex');
// }

// // --- UTILITIES ---
// function showToast(message) {
//     const toast = document.getElementById('toast');
//     if (!toast) return;
//     document.getElementById('toastMessage').textContent = message;
//     toast.classList.remove('opacity-0', 'translate-y-2');
//     clearTimeout(toastTimeout);
//     toastTimeout = setTimeout(() => {
//         toast.classList.add('opacity-0', 'translate-y-2');
//     }, 2000);
// }

// function toggleSubmenu(headerElement, menuId) {
//     const menu = document.getElementById(menuId);
//     const icon = headerElement.querySelector('i');
//     if (menu.classList.contains('hidden')) {
//         menu.classList.remove('hidden');
//         menu.classList.add('block');
//         headerElement.classList.add('bg-sidebarActive', 'text-white');
//         headerElement.classList.remove('hover:bg-sidebarDark');
//         icon.classList.remove('fa-chevron-left');
//         icon.classList.add('fa-chevron-down');
//     } else {
//         menu.classList.add('hidden');
//         menu.classList.remove('block');
//         headerElement.classList.remove('bg-sidebarActive', 'text-white');
//         headerElement.classList.add('hover:bg-sidebarDark');
//         icon.classList.remove('fa-chevron-down');
//         icon.classList.add('fa-chevron-left');
//     }
// }

// function toggleSidebar() {
//     const sidebar = document.getElementById('sidebar');
//     const overlay = document.getElementById('mobileOverlay');
//     sidebar.classList.toggle('-translate-x-full');
//     sidebar.classList.toggle('md:w-0');
//     sidebar.classList.toggle('md:translate-x-0');
//     if (window.innerWidth < 768) overlay.classList.toggle('hidden');
// }

// function closeSidebarMobile() {
//     if (window.innerWidth < 768) {
//         const sidebar = document.getElementById('sidebar');
//         sidebar.classList.add('-translate-x-full');
//         sidebar.classList.remove('translate-x-0');
//         document.getElementById('mobileOverlay').classList.add('hidden');
//     }
// }