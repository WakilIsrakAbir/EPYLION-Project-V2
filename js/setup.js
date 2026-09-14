// ==========================================================
// SETUP: Dynamic Dropdown Master Management Module
// Connected to MongoDB API (/api/dropdowns) with Zero Regression
// ==========================================================

const DROPDOWN_STORAGE_KEY = 'tps_dropdown_master_cache';

// In-memory cache for ultra-fast and synchronous dropdown generation
let dropdownMasterCache = {
    units: [
        { _id: 'u1', type: 'UNIT', name: 'EFL', status: 'ACTIVE' },
        { _id: 'u2', type: 'UNIT', name: 'EKL', status: 'ACTIVE' },
        { _id: 'u3', type: 'UNIT', name: 'Ext', status: 'ACTIVE' },
        { _id: 'u4', type: 'UNIT', name: 'Outside', status: 'ACTIVE' }
    ],
    processes: [
        { _id: 'p1', type: 'PROCESS', name: 'Solid', status: 'ACTIVE' },
        { _id: 'p2', type: 'PROCESS', name: 'Dyeing Wash', status: 'ACTIVE' },
        { _id: 'p3', type: 'PROCESS', name: 'HTR', status: 'ACTIVE' },
        { _id: 'p4', type: 'PROCESS', name: 'Pluvia', status: 'ACTIVE' },
        { _id: 'p5', type: 'PROCESS', name: 'SB', status: 'ACTIVE' },
        { _id: 'p6', type: 'PROCESS', name: 'WH', status: 'ACTIVE' },
        { _id: 'p7', type: 'PROCESS', name: 'DF', status: 'ACTIVE' }
    ]
};

// Initialize cache from localStorage if available
try {
    const cached = localStorage.getItem(DROPDOWN_STORAGE_KEY);
    if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.units) && Array.isArray(parsed.processes)) {
            dropdownMasterCache = parsed;
        }
    }
} catch (e) {
    console.error('Error reading dropdown cache from localStorage:', e);
}

/**
 * Fetch fresh dropdown master list from backend database
 */
async function fetchDropdownMaster(silent = false) {
    try {
        const base = typeof API_BASE !== 'undefined' ? API_BASE : 'https://abir-backend-api.onrender.com';
        const res = await fetch(`${base}/api/dropdowns`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);

        const data = await res.json();
        dropdownMasterCache = {
            units: Array.isArray(data.units) ? data.units : [],
            processes: Array.isArray(data.processes) ? data.processes : []
        };

        // Persist to local cache for instant dropdown building
        localStorage.setItem(DROPDOWN_STORAGE_KEY, JSON.stringify(dropdownMasterCache));

        renderSetupTables();
        return dropdownMasterCache;
    } catch (err) {
        console.warn('Could not fetch dropdowns from server, using cached/default options:', err.message);
        renderSetupTables();
        return dropdownMasterCache;
    }
}

/**
 * Build dynamic options for Dyeing Plan <select> elements
 * 
 * CRITICAL BUSINESS RULE (ZERO REGRESSION):
 * Renders all ACTIVE options. If an existing row has a saved value (even if marked as HIDDEN),
 * it is ALWAYS included and selected so that existing records in the database are never lost.
 * 
 * @param {'unit' | 'process'} type 
 * @param {string} currentValue 
 * @returns {string} HTML string of <option> elements
 */
function buildDynamicOptions(type, currentValue) {
    const isUnit = type.toLowerCase() === 'unit';
    const list = isUnit ? (dropdownMasterCache.units || []) : (dropdownMasterCache.processes || []);
    const val = (currentValue !== undefined && currentValue !== null) ? String(currentValue).trim() : '';

    let optionsHtml = `<option value="" ${!val ? 'selected' : ''}>Select</option>`;

    // Filter active items
    const activeItems = list.filter(it => it.status === 'ACTIVE');
    const isValInActive = activeItems.some(it => it.name.toLowerCase() === val.toLowerCase());

    // If an existing saved value is present from DB but NOT in the active list (e.g. marked as HIDDEN or legacy custom),
    // always render it first so that existing database records are preserved!
    if (val && !isValInActive) {
        optionsHtml += `<option value="${escapeHtml(val)}" selected>${escapeHtml(val)}</option>`;
    }

    // Render active items
    activeItems.forEach(item => {
        const isSelected = val && item.name.toLowerCase() === val.toLowerCase();
        optionsHtml += `<option value="${escapeHtml(item.name)}" ${isSelected ? 'selected' : ''}>${escapeHtml(item.name)}</option>`;
    });

    return optionsHtml;
}

/**
 * Render the side-by-side Setup tables matching the reference UI mockup
 */
function renderSetupTables() {
    const units = dropdownMasterCache.units || [];
    const processes = dropdownMasterCache.processes || [];

    // Update count badges
    const unitBadge = document.getElementById('unitItemCountBadge');
    if (unitBadge) unitBadge.textContent = `${units.length} items`;

    const procBadge = document.getElementById('processItemCountBadge');
    if (procBadge) procBadge.textContent = `${processes.length} items`;

    // Render unit table
    renderMasterTableBody('unit', units);

    // Render process table
    renderMasterTableBody('process', processes);
}

function renderMasterTableBody(type, items) {
    const tbody = document.getElementById(`${type}SetupTableBody`);
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-8 px-3 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">No items found. Add one above.</td></tr>`;
        return;
    }

    let html = '';
    items.forEach((item, index) => {
        const isActive = item.status === 'ACTIVE';
        
        // Clean, balanced status badge with dot indicator
        const statusBadge = isActive
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                 <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
               </span>`
            : `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                 <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Hidden
               </span>`;

        // Action buttons
        const toggleIcon = isActive ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
        const toggleTitle = isActive ? 'Hide from dropdown' : 'Unhide / Make active';

        html += `
        <tr class="border-b border-slate-100/80 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
            <td class="py-2.5 px-3 text-xs text-slate-400 dark:text-slate-500 text-center font-medium w-12">${index + 1}</td>
            <td class="py-2.5 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(item.name)}</td>
            <td class="py-2.5 px-3 text-center w-28">${statusBadge}</td>
            <td class="py-2.5 px-3 text-center w-28">
                <div class="inline-flex items-center justify-center gap-1">
                    <!-- Edit Button -->
                    <button type="button" onclick="handleEditDropdownItem('${type}', '${item._id}', '${escapeHtml(item.name)}')" 
                        class="w-7 h-7 rounded-md text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 inline-flex items-center justify-center text-xs transition-colors" 
                        title="Edit name">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <!-- Hide / Unhide Toggle Button -->
                    <button type="button" onclick="toggleDropdownItemStatus('${type}', '${item._id}', '${item.status}')" 
                        class="w-7 h-7 rounded-md text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 inline-flex items-center justify-center text-xs transition-colors" 
                        title="${toggleTitle}">
                        <i class="${toggleIcon}"></i>
                    </button>
                    <!-- Delete Button -->
                    <button type="button" onclick="deleteDropdownItem('${type}', '${item._id}', '${escapeHtml(item.name)}')" 
                        class="w-7 h-7 rounded-md text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center justify-center text-xs transition-colors" 
                        title="Delete item">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;
}

/**
 * Handle adding a new item via API
 */
async function handleAddDropdownItem(event, type) {
    event.preventDefault();
    const input = document.getElementById(`${type}InputNew`);
    if (!input) return;

    const val = input.value.trim();
    if (!val) {
        if (typeof showToast === 'function') showToast('Please enter an item name.', true);
        return;
    }

    const apiType = type.toUpperCase();
    const base = typeof API_BASE !== 'undefined' ? API_BASE : 'https://abir-backend-api.onrender.com';

    try {
        const res = await fetch(`${base}/api/dropdowns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: apiType, name: val })
        });

        const data = await res.json();

        if (res.ok) {
            input.value = '';
            if (typeof showToast === 'function') showToast(data.message || `"${val}" added successfully!`);
            await fetchDropdownMaster();
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Failed to add item.', true);
        }
    } catch (err) {
        console.error('Error adding dropdown item:', err);
        if (typeof showToast === 'function') showToast('Server connection error.', true);
    }
}

/**
 * Handle renaming an item via API
 */
async function handleEditDropdownItem(type, id, currentName) {
    const newName = prompt(`Edit ${type} name:`, currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;

    const base = typeof API_BASE !== 'undefined' ? API_BASE : 'https://abir-backend-api.onrender.com';

    try {
        const res = await fetch(`${base}/api/dropdowns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim() })
        });

        const data = await res.json();
        if (res.ok) {
            if (typeof showToast === 'function') showToast(data.message || `Updated to "${newName.trim()}".`);
            await fetchDropdownMaster();
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Failed to update item.', true);
        }
    } catch (err) {
        console.error('Error editing dropdown item:', err);
        if (typeof showToast === 'function') showToast('Server connection error.', true);
    }
}

/**
 * Handle toggle between ACTIVE and HIDDEN
 */
async function toggleDropdownItemStatus(type, id, currentStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
    const base = typeof API_BASE !== 'undefined' ? API_BASE : 'https://abir-backend-api.onrender.com';

    try {
        const res = await fetch(`${base}/api/dropdowns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();
        if (res.ok) {
            const statusMsg = newStatus === 'ACTIVE' ? 'is now Active' : 'is now Hidden';
            if (typeof showToast === 'function') showToast(data.message || `Option ${statusMsg}.`);
            await fetchDropdownMaster();
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Failed to update status.', true);
        }
    } catch (err) {
        console.error('Error toggling status:', err);
        if (typeof showToast === 'function') showToast('Server connection error.', true);
    }
}

/**
 * Handle safe deletion with backend usage verification
 */
async function deleteDropdownItem(type, id, name) {
    const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) return;

    const base = typeof API_BASE !== 'undefined' ? API_BASE : 'https://abir-backend-api.onrender.com';

    try {
        const res = await fetch(`${base}/api/dropdowns/${id}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        if (res.ok) {
            if (typeof showToast === 'function') {
                showToast(data.message || `"${name}" removed.`, data.action === 'hidden');
            }
            await fetchDropdownMaster();
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Failed to delete item.', true);
        }
    } catch (err) {
        console.error('Error deleting dropdown item:', err);
        if (typeof showToast === 'function') showToast('Server connection error.', true);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initial fetch on script load
document.addEventListener('DOMContentLoaded', () => {
    fetchDropdownMaster(true);
});
