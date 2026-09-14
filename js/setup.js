// ==========================================================
// SETUP: Dropdown Master Data Management
// ==========================================================

const DROPDOWN_STORAGE_KEY = 'tps_dropdown_master';

const DEFAULT_DROPDOWN_MASTER = {
    unit: [
        { id: 'u_1', name: 'EFL', status: 'active' },
        { id: 'u_2', name: 'EKL', status: 'active' },
        { id: 'u_3', name: 'Ext', status: 'active' },
        { id: 'u_4', name: 'Outside', status: 'active' }
    ],
    process: [
        { id: 'p_1', name: 'Solid', status: 'active' },
        { id: 'p_2', name: 'Dyeing Wash', status: 'active' },
        { id: 'p_3', name: 'HTR', status: 'active' },
        { id: 'p_4', name: 'Pluvia', status: 'active' },
        { id: 'p_5', name: 'SB', status: 'active' },
        { id: 'p_6', name: 'WH', status: 'active' },
        { id: 'p_7', name: 'DF', status: 'active' }
    ]
};

/**
 * Get dropdown master data from localStorage or initialize defaults
 */
function getDropdownMaster() {
    try {
        const stored = localStorage.getItem(DROPDOWN_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.unit && parsed.process) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error reading dropdown master from localStorage:', e);
    }

    // Initialize with default values if not present
    saveDropdownMaster(DEFAULT_DROPDOWN_MASTER);
    return JSON.parse(JSON.stringify(DEFAULT_DROPDOWN_MASTER));
}

/**
 * Save dropdown master data to localStorage
 */
function saveDropdownMaster(data) {
    try {
        localStorage.setItem(DROPDOWN_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving dropdown master to localStorage:', e);
    }
}

/**
 * Build dynamic options for <select> elements
 * Renders active options PLUS always renders the row's existing saved value
 * (even if marked as hidden) so existing database records are never lost.
 * 
 * @param {'unit' | 'process'} type
 * @param {string} currentValue
 * @returns {string} HTML string of <option> elements
 */
function buildDynamicOptions(type, currentValue) {
    const master = getDropdownMaster();
    const list = master[type] || [];
    const val = (currentValue !== undefined && currentValue !== null) ? String(currentValue).trim() : '';

    let optionsHtml = `<option value="" ${!val ? 'selected' : ''}>Select</option>`;

    // Active options
    const activeItems = list.filter(item => item.status === 'active');
    const isValInActive = activeItems.some(item => item.name.toLowerCase() === val.toLowerCase());

    // If there is an existing saved value from database that is NOT active (hidden or deleted),
    // always render it first so that existing database records are never lost.
    if (val && !isValInActive) {
        optionsHtml += `<option value="${val}" selected>${val} (Saved)</option>`;
    }

    // Render active items
    activeItems.forEach(item => {
        const isSelected = val && item.name.toLowerCase() === val.toLowerCase();
        optionsHtml += `<option value="${item.name}" ${isSelected ? 'selected' : ''}>${item.name}</option>`;
    });

    return optionsHtml;
}

/**
 * Render the setup tables for Units and Processes
 */
function renderSetupTables() {
    const master = getDropdownMaster();
    renderSetupTableForType('unit', master.unit || []);
    renderSetupTableForType('process', master.process || []);
}

function renderSetupTableForType(type, items) {
    const tbody = document.getElementById(`${type}SetupTableBody`);
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-3 px-3 text-center text-xs text-gray-400">No items configured yet.</td></tr>`;
        return;
    }

    let html = '';
    items.forEach((item, index) => {
        const isActive = item.status === 'active';
        const badgeClass = isActive 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
        const statusText = isActive ? 'Active' : 'Hidden';
        const toggleIcon = isActive ? 'fa-eye-slash' : 'fa-eye';
        const toggleTitle = isActive ? 'Hide from dropdown' : 'Make active';

        html += `
        <tr class="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="py-2 px-3 text-xs text-gray-500 dark:text-gray-400 text-center font-mono w-12">${index + 1}</td>
            <td class="py-2 px-3 text-xs font-semibold text-gray-800 dark:text-gray-200">${item.name}</td>
            <td class="py-2 px-3 text-center w-24">
                <span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeClass}">${statusText}</span>
            </td>
            <td class="py-2 px-3 text-center w-24 space-x-1">
                <button type="button" onclick="toggleDropdownItemStatus('${type}', '${item.id}')" 
                    class="p-1 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                    title="${toggleTitle}">
                    <i class="fa-solid ${toggleIcon}"></i>
                </button>
                <button type="button" onclick="deleteDropdownItem('${type}', '${item.id}')" 
                    class="p-1 text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" 
                    title="Delete option">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;
}

/**
 * Add a new dropdown option
 */
function handleAddDropdownItem(event, type) {
    event.preventDefault();
    const input = document.getElementById(`${type}InputNew`);
    if (!input) return;

    const val = input.value.trim();
    if (!val) {
        if (typeof showToast === 'function') showToast('Please enter a name.', true);
        return;
    }

    const master = getDropdownMaster();
    const list = master[type] || [];

    // Check for duplicates (case insensitive)
    const exists = list.some(item => item.name.toLowerCase() === val.toLowerCase());
    if (exists) {
        if (typeof showToast === 'function') showToast(`"${val}" already exists in the list!`, true);
        return;
    }

    const newItem = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: val,
        status: 'active'
    };

    list.push(newItem);
    master[type] = list;
    saveDropdownMaster(master);

    input.value = '';
    renderSetupTables();
    if (typeof showToast === 'function') showToast(`"${val}" added successfully!`);
}

/**
 * Toggle active / hidden status of a dropdown option
 */
function toggleDropdownItemStatus(type, id) {
    const master = getDropdownMaster();
    const list = master[type] || [];
    const item = list.find(it => it.id === id);

    if (item) {
        item.status = item.status === 'active' ? 'hidden' : 'active';
        master[type] = list;
        saveDropdownMaster(master);
        renderSetupTables();
        if (typeof showToast === 'function') {
            showToast(`"${item.name}" is now ${item.status}.`);
        }
    }
}

/**
 * Delete a dropdown option permanently
 */
function deleteDropdownItem(type, id) {
    const master = getDropdownMaster();
    const list = master[type] || [];
    const item = list.find(it => it.id === id);

    if (!item) return;

    const confirmed = confirm(`Are you sure you want to remove "${item.name}" from ${type} options? Existing saved database records will still keep their value.`);
    if (!confirmed) return;

    master[type] = list.filter(it => it.id !== id);
    saveDropdownMaster(master);
    renderSetupTables();
    if (typeof showToast === 'function') showToast(`"${item.name}" deleted.`);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    getDropdownMaster(); // Ensure defaults initialized
});
