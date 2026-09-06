// ==========================================================
// PLAN VS ACTUAL TRACKING FILTER
// Multi-criteria filtering for Plan Vs Actual Tracking
// ==========================================================

const pvatfConfigs = {
    yd: { title: "YD Plan Tracking Filter" },
    knitting: { title: "Knitting Plan Tracking Filter" },
    dyeing: { title: "Dyeing Plan Tracking Filter" },
    delivery: { title: "Delivery Plan Tracking Filter" },
    deliveryfloor: { title: "Delivery Plan (Floor) Tracking Filter" }
};

const PVATF_HEADERS = [
    'SL',
    'Order/Booking No.',
    'Buyer',
    'Plan Start',
    'Plan End',
    'Actual Start',
    'Actual End',
    'Start Result',
    'End Result',
    'Fail Reason',
    'Related Dept.'
];

let pvatfCurrentDept = 'knitting';
let pvatfAllRows = [];
let pvatfFilteredRows = [];
let pvatfLoading = false;

// Format date to "1-Aug"
function formatPvatfDisplayDate(dateStr) {
    if (!dateStr || dateStr === '-' || dateStr === 'N/A') return '';
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function showPlanVsActualTrackingFilter(deptKey) {
    if (!pvatfConfigs[deptKey]) deptKey = 'knitting';
    pvatfCurrentDept = deptKey;

    localStorage.setItem(
        'activePage',
        JSON.stringify({ page: 'planVsActualTrackingFilter', dept: deptKey })
    );

    if (typeof hideAllCoreViews === 'function') {
        hideAllCoreViews();
    }

    const view = document.getElementById('planVsActualTrackingFilterView');
    if (view) view.classList.remove('hidden');

    const uniqueId = `planTrackingFilter_${deptKey}`;
    activeTabId = uniqueId;
    const menuTitle = pvatfConfigs[deptKey].title;

    if (typeof openTabs !== 'undefined') {
        if (!openTabs.find(tab => tab.id === uniqueId)) {
            openTabs.push({
                id: uniqueId,
                title: menuTitle,
                dept: deptKey,
                mode: 'planTrackingFilter'
            });
        }
        renderTabs();
    }

    const titleEl = document.getElementById('pvatfTitle');
    if (titleEl) titleEl.innerText = menuTitle;

    if (typeof setActiveSidebarMenu === 'function') {
        setActiveSidebarMenu(`menu-${deptKey}-actualfilter`);
    }

    // Default dates: first day of current month to today
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const fmt = d => {
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mm}-${dd}`;
    };

    const fromInput = document.getElementById('pvatfFromDate');
    const toInput = document.getElementById('pvatfToDate');

    if (fromInput && toInput) {
        fromInput.value = fmt(firstDay);
        toInput.value = fmt(today);
        toInput.min = fmt(firstDay);
    }

    fetchPlanVsActualTrackingFilterData(deptKey);
    if (typeof closeSidebarMobile === 'function') closeSidebarMobile();
}

function syncPvatfToMinDate() {
    const fromInput = document.getElementById('pvatfFromDate');
    const toInput = document.getElementById('pvatfToDate');
    if (!fromInput || !toInput) return;

    const fromVal = fromInput.value || '';
    toInput.min = fromVal;

    // Native browser calendar will disable dates before From.
    // If To is earlier than new From, auto correct to From.
    if (fromVal && toInput.value && toInput.value < fromVal) {
        toInput.value = fromVal;
    }
}

async function fetchPlanVsActualTrackingFilterData(deptKey) {
    pvatfLoading = true;
    pvatfAllRows = [];
    pvatfFilteredRows = [];

    const previewBtn = document.getElementById('pvatfPreviewBtn');
    if (previewBtn) {
        previewBtn.disabled = true;
        previewBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
    }

    try {
        const dbDeptKey = deptKey === 'deliveryfloor' ? 'delivery' : deptKey;
        const res = await fetch(`${API_BASE}/api/orders/tracking/${deptKey}?all=true`);
        if (!res.ok) throw new Error('Failed to fetch tracking data');
        const data = await res.json();

        const { planDocs = [], orderMap = {} } = data;

        planDocs.forEach(plan => {
            const deptItems = plan[dbDeptKey];

            let startDates = [], endDates = [];
            let planStart = '';
            let planEnd = '';

            if (deptItems && Array.isArray(deptItems) && deptItems.length > 0) {
                if (deptKey === 'deliveryfloor') {
                    const floorItems = deptItems.filter(item => item.floorPlanType === 'Confirm' || item.floorPlanType === 'Tentative');
                    if (floorItems.length > 0) {
                        startDates = floorItems.map(item => item.floorStartDate).filter(d => d && d !== '' && d !== '-');
                        endDates = floorItems.map(item => item.floorEndDate).filter(d => d && d !== '' && d !== '-');
                    }
                } else {
                    startDates = deptItems.map(item => item.startDate).filter(d => d && d !== '' && d !== '-');
                    endDates = deptItems.map(item => item.endDate).filter(d => d && d !== '' && d !== '-');
                }

                if (startDates.length > 0) { startDates.sort(); planStart = startDates[0]; }
                if (endDates.length > 0) { endDates.sort(); planEnd = endDates[endDates.length - 1]; }
            }

            // Fallback to Order general info
            if (!planStart && !planEnd) {
                const oInfo = orderMap[plan.orderNo] || {};
                if (deptKey === 'knitting') { planStart = oInfo.knitStart || ''; planEnd = oInfo.knitEnd || ''; }
                else if (deptKey === 'dyeing') { planStart = oInfo.dyeStart || ''; planEnd = oInfo.dyeEnd || ''; }
                else if (deptKey === 'delivery' || deptKey === 'deliveryfloor') { planStart = oInfo.deliStart || ''; planEnd = oInfo.deliEnd || ''; }
            }

            const actualKey = (deptKey === 'deliveryfloor' ? 'delivery' : deptKey) + 'Actual';
            let actualStart = '';
            let actualEnd = '';
            let failReason = '';
            let relatedDept = '';

            if (plan[actualKey]) {
                actualStart = plan[actualKey].actualStart || '';
                actualEnd = plan[actualKey].actualEnd || '';
                failReason = plan[actualKey].failReason || plan[actualKey].remarks || '';
                relatedDept = plan[actualKey].relatedDept || '';
            }

            const orderInfo = orderMap[plan.orderNo] || {};
            let displayBuyer = orderInfo.buyer || '';
            if (!displayBuyer && plan.uploadedItems && plan.uploadedItems[0] && plan.uploadedItems[0].Buyer) {
                displayBuyer = String(plan.uploadedItems[0].Buyer).trim();
            }
            if (!displayBuyer && deptItems && deptItems.length > 0) {
                for (let it of deptItems) {
                    if (it.itemData && it.itemData.Buyer) {
                        displayBuyer = String(it.itemData.Buyer).trim();
                        break;
                    }
                }
            }
            if (!displayBuyer || displayBuyer.toLowerCase() === 'undefined') displayBuyer = 'N/A';

            pvatfAllRows.push({
                orderNo: plan.orderNo,
                buyer: displayBuyer,
                planStart: planStart,
                planEnd: planEnd,
                actualStart: actualStart,
                actualEnd: actualEnd,
                failReason: failReason,
                relatedDept: relatedDept
            });
        });

        populatePvatfBuyers();
    } catch (err) {
        console.error('Error in Plan Vs Actual Tracking Filter:', err);
        showToast('Failed to load tracking filter data');
        populatePvatfBuyers();
    } finally {
        pvatfLoading = false;
        if (previewBtn) {
            previewBtn.disabled = false;
            previewBtn.innerHTML = '<i class="fas fa-eye mr-2"></i>Preview';
        }
    }
}

function populatePvatfBuyers() {
    const box = document.getElementById('pvatfBuyerOptions');
    const allCb = document.getElementById('pvatfBuyerAll');
    if (!box || !allCb) return;

    const buyers = [...new Set(
        pvatfAllRows.map(r => String(r.buyer || '').trim()).filter(b => b && b !== 'N/A' && b !== 'undefined')
    )].sort((a, b) => a.localeCompare(b));

    allCb.checked = true;
    box.innerHTML = buyers.map(b => `
        <label class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-gray-700 text-xs">
            <input type="checkbox" class="pvatfBuyerChoice rounded border-gray-300" value="${b.replace(/"/g, '&quot;')}">
            <span>${b}</span>
        </label>
    `).join('');

    box.querySelectorAll('.pvatfBuyerChoice').forEach(cb => {
        cb.addEventListener('change', () => {
            const anyChecked = box.querySelectorAll('.pvatfBuyerChoice:checked').length > 0;
            allCb.checked = !anyChecked;
            refreshPvatfBuyerLabel();
        });
    });

    refreshPvatfBuyerLabel();
}

function getSelectedPvatfBuyers() {
    const allCb = document.getElementById('pvatfBuyerAll');
    if (!allCb || allCb.checked) return [];
    return [...document.querySelectorAll('.pvatfBuyerChoice:checked')].map(x => x.value);
}

function refreshPvatfBuyerLabel() {
    const label = document.getElementById('pvatfBuyerLabel');
    if (!label) return;
    const selected = getSelectedPvatfBuyers();
    if (selected.length === 0) {
        label.textContent = 'All Buyers';
    } else if (selected.length <= 2) {
        label.textContent = selected.join(', ');
    } else {
        label.textContent = `${selected.length} Buyers Selected`;
    }
    label.title = selected.length ? selected.join(', ') : 'All Buyers';
}

function previewPlanVsActualTrackingFilter() {
    if (pvatfLoading) return;

    const from = document.getElementById('pvatfFromDate')?.value || '';
    const to = document.getElementById('pvatfToDate')?.value || '';
    const type = document.getElementById('pvatfDateType')?.value || 'planStart';

    if (!from || !to) {
        showToast('Please select both From and To dates.');
        return;
    }
    if (from > to) {
        showToast('From date cannot be later than To date.');
        return;
    }

    const selectedBuyers = getSelectedPvatfBuyers();
    const buyerSet = new Set(selectedBuyers.map(b => b.toLowerCase()));

    const rows = pvatfAllRows.filter(r => {
        const d = r[type];
        if (!d || d < from || d > to) return false;
        if (buyerSet.size > 0 && !buyerSet.has(String(r.buyer || '').toLowerCase())) return false;
        return true;
    });

    if (rows.length === 0) {
        showToast('No matching tracking data found.');
        return;
    }

    pvatfFilteredRows = rows.map(r => {
        const startRes = typeof getActualTrackingResult === 'function'
            ? getActualTrackingResult(r.actualStart, r.planStart)
            : '';
        const endRes = typeof getActualTrackingResult === 'function'
            ? getActualTrackingResult(r.actualEnd, r.planEnd)
            : '';

        return {
            ...r,
            startResult: startRes,
            endResult: endRes
        };
    });

    renderPvatfPreviewModal(from, to, type, selectedBuyers);
}

function renderPvatfPreviewModal(from, to, type, selectedBuyers) {
    const title = document.getElementById('pvatfModalTitle');
    const meta = document.getElementById('pvatfModalMeta');
    const thead = document.getElementById('pvatfThead');
    const tbody = document.getElementById('pvatfTbody');

    const typeLabels = {
        planStart: 'Plan Start Date',
        planEnd: 'Plan End Date',
        actualStart: 'Actual Start Date',
        actualEnd: 'Actual End Date'
    };

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);

    if (title) title.textContent = pvatfConfigs[pvatfCurrentDept].title;
    if (meta) {
        const buyerText = selectedBuyers.length ? selectedBuyers.join(', ') : 'All Buyers';
        meta.textContent = `${typeLabels[type] || 'Plan Start Date'}: ${from} to ${to} | Buyer: ${buyerText} | Rows: ${pvatfFilteredRows.length}`;
    }

    if (thead) {
        thead.innerHTML = '<tr>' + PVATF_HEADERS.map(h => `<th class="p-2 border border-gray-300 whitespace-nowrap text-center">${esc(h)}</th>`).join('') + '</tr>';
    }

    if (tbody) {
        tbody.innerHTML = pvatfFilteredRows.map((r, i) => {
            let startBadge = '—';
            if (r.startResult === 'Pass') {
                startBadge = '<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">Pass</span>';
            } else if (r.startResult === 'Fail') {
                startBadge = '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-[10px]">Fail</span>';
            }

            let endBadge = '—';
            if (r.endResult === 'Pass') {
                endBadge = '<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">Pass</span>';
            } else if (r.endResult === 'Fail') {
                endBadge = '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-[10px]">Fail</span>';
            }

            return `<tr>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${i + 1}</td>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${esc(r.orderNo)}</td>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${esc(r.buyer)}</td>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${esc(formatPvatfDisplayDate(r.planStart))}</td>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${esc(formatPvatfDisplayDate(r.planEnd))}</td>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${esc(formatPvatfDisplayDate(r.actualStart))}</td>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${esc(formatPvatfDisplayDate(r.actualEnd))}</td>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${startBadge}</td>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${endBadge}</td>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${esc(r.failReason || '')}</td>
                <td class="p-2 border border-gray-300 text-center whitespace-nowrap">${esc(r.relatedDept || '')}</td>
            </tr>`;
        }).join('');
    }

    const modal = document.getElementById('pvatfModal');
    if (modal) modal.classList.remove('hidden');
}

function closePlanVsActualTrackingFilterModal() {
    const modal = document.getElementById('pvatfModal');
    if (modal) modal.classList.add('hidden');
}

function exportPlanVsActualTrackingFilterExcel() {
    if (!pvatfFilteredRows || pvatfFilteredRows.length === 0) {
        showToast('Please preview data first before saving to Excel.');
        return;
    }

    if (typeof XLSX === 'undefined') {
        showToast('Excel library not loaded.');
        return;
    }

    const parseExcelDate = (v) => {
        if (!v || v === '-' || v === 'N/A') return '';
        const d = new Date(v + (v.includes('T') ? '' : 'T00:00:00'));
        return isNaN(d.getTime()) ? v : d;
    };

    const excelOrderNo = (v) => {
        const s = String(v ?? '').trim().replace(/,/g, '');
        return /^\d+$/.test(s) && s.length <= 15 ? Number(s) : String(v ?? '').trim();
    };

    const matrix = [PVATF_HEADERS];

    pvatfFilteredRows.forEach((r, i) => {
        matrix.push([
            i + 1,
            excelOrderNo(r.orderNo),
            r.buyer || '',
            parseExcelDate(r.planStart),
            parseExcelDate(r.planEnd),
            parseExcelDate(r.actualStart),
            parseExcelDate(r.actualEnd),
            r.startResult || '',
            r.endResult || '',
            r.failReason || '',
            r.relatedDept || ''
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(matrix, { cellDates: true });
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let R = 1; R <= range.e.r; R++) {
        const orderCell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })];
        if (orderCell && orderCell.t === 'n') orderCell.z = '0';

        for (let C = 3; C <= 6; C++) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && cell.v instanceof Date) {
                cell.t = 'd';
                cell.z = 'd-mmm';
            }
        }
    }

    ws['!cols'] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 25 },
        { wch: 13 },
        { wch: 13 },
        { wch: 13 },
        { wch: 13 },
        { wch: 12 },
        { wch: 12 },
        { wch: 40 },
        { wch: 25 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tracking Filter');
    const safeTitle = pvatfConfigs[pvatfCurrentDept].title.replace(/\s+/g, '_');
    XLSX.writeFile(wb, `${safeTitle}.xlsx`, { cellDates: true });
}

// Global click handler to close buyer dropdown when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    const fromInput = document.getElementById('pvatfFromDate');
    if (fromInput) {
        fromInput.addEventListener('change', syncPvatfToMinDate);
        fromInput.addEventListener('input', syncPvatfToMinDate);
    }

    const buyerBtn = document.getElementById('pvatfBuyerBtn');
    const buyerDrop = document.getElementById('pvatfBuyerDropdown');
    const buyerAll = document.getElementById('pvatfBuyerAll');

    if (buyerBtn && buyerDrop) {
        buyerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            buyerDrop.classList.toggle('hidden');
        });

        buyerDrop.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    if (buyerAll) {
        buyerAll.addEventListener('change', () => {
            if (buyerAll.checked) {
                document.querySelectorAll('.pvatfBuyerChoice').forEach(x => x.checked = false);
            } else if (!document.querySelector('.pvatfBuyerChoice:checked')) {
                buyerAll.checked = true;
            }
            refreshPvatfBuyerLabel();
        });
    }

    document.addEventListener('click', () => {
        if (buyerDrop) buyerDrop.classList.add('hidden');
    });
});
