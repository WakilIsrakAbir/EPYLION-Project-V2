// ==========================================================
// LOAD CALCULATION: Reports & Summaries
// ==========================================================
// ==========================================
// LOAD CALCULATION LOGIC
// ==========================================
const LOAD_MONTH_COUNT = 5;
let activeMainMenu = 'detailed';
let activeDetailedDepartment = 'knitting';
let activeSummaryDepartment = 'knitting';

let globalLoadData = { knitting: [], dyeing: [], delivery: [] };

const LOAD_REPORT_CONFIG = {
    knitting: {
        name: 'Knitting',
        pendingQtyField: 'KnitBala',
        columns: ['OrderNo', 'Color', 'FabricConstruction', 'GSM', 'Buyer', 'GreyReq', 'KnitProd', 'KnitBala']
    },
    dyeing: {
        name: 'Dyeing',
        pendingQtyField: 'DyeingBala',
        columns: ['OrderNo', 'Color', 'RequiredQtyKgs', 'Buyer', 'Unit', 'ProcessName', 'GreyReq', 'KnitProd', 'KnitBala', 'BPQty', 'DyeingProd', 'DyeingBala']
    },
    delivery: {
        name: 'Delivery',
        pendingQtyField: 'DeliBal',
        columns: ['OrderNo', 'Color', 'FabricConstruction', 'GSM', 'Buyer', 'RequiredQtyKgs', 'NetReceivedQtyKgs', 'NetDeliveryQtyKgs', 'DeliBal', 'RFD', 'Slowmoving']
    }
};

function showLoadCalculation(menuName) {
    localStorage.setItem('activePage', JSON.stringify({ page: 'loadCalculation', menu: menuName }));
    const uniqueId = `loadCalculation_${menuName}`;
    activeTabId = uniqueId;

    hideAllCoreViews();
    document.getElementById('loadCalculationView').classList.remove('hidden');
    
    activeMainMenu = menuName;

    const detailedMenu = document.getElementById('detailedMenu');
    const summaryMenu = document.getElementById('summaryMenu');
    const detailedButtons = document.getElementById('detailedButtons');
    const summaryButtons = document.getElementById('summaryButtons');

    detailedMenu.classList.toggle('hidden', menuName !== 'detailed');
    summaryMenu.classList.toggle('hidden', menuName !== 'summary');
    
    if (detailedButtons) detailedButtons.classList.toggle('hidden', menuName !== 'detailed');
    if (summaryButtons) summaryButtons.classList.toggle('hidden', menuName !== 'summary');

    const detailedLink = document.getElementById('menu-load-detailed');
    const summaryLink = document.getElementById('menu-load-summary');

    if(detailedLink) detailedLink.classList.toggle('active', menuName === 'detailed');
    if(summaryLink) summaryLink.classList.toggle('active', menuName === 'summary');

    const title = menuName === 'detailed' ? 'Detailed Load Download' : 'Buyer-wise Load Summary';
    const description = menuName === 'detailed' ? 'Download item-level Knitting, Dyeing and Delivery load reports.' : 'Download buyer-wise Knitting, Dyeing and Delivery load summaries.';

    const menuTitle = menuName === 'detailed' ? 'Detailed Load' : 'Load Summary';
    if (!openTabs.find(tab => tab.id === uniqueId)) openTabs.push({ id: uniqueId, title: menuTitle, dept: menuName, mode: 'loadCalculation' });
    renderTabs();

    if (document.getElementById('contentTabTitle')) document.getElementById('contentTabTitle').textContent = title;
    if (document.getElementById('pageMainTitle')) document.getElementById('pageMainTitle').textContent = title;
    if (document.getElementById('pageMainDescription')) document.getElementById('pageMainDescription').textContent = description;

    closeSidebarMobile();
    
    setActiveSidebarMenu(menuName === 'detailed' ? 'menu-load-detailed' : 'menu-load-summary');
    
    // fetch and render
    fetchLoadCalculationData().then(() => {
        if (document.getElementById('loadStartMonth').options.length === 0) {
            initLoadMonthSelector();
        }
        if (menuName === 'summary') {
            setSummaryDepartment(activeSummaryDepartment);
        } else {
            refreshCurrentView();
        }
    });
}

async function fetchLoadCalculationData() {
    if (Object.keys(groupedData).length === 0) {
        await fetchAndProcessData(true);
    }

    globalLoadData = { knitting: [], dyeing: [], delivery: [] };
    
    for (const bNo in groupedData) {
        const order = groupedData[bNo];
        if (!order.dbData) continue;
        
        ['knitting', 'dyeing', 'delivery'].forEach(dept => {
            if (order.dbData[dept] && Array.isArray(order.dbData[dept])) {
                order.dbData[dept].forEach(savedItem => {
                    if (savedItem.planType === 'Confirm' || savedItem.planType === 'Tentative') {
                        let latestItemData = savedItem.itemData;
                        if (order.mergedItems) {
                            const latestItem = order.mergedItems.find(m => m.itemId === savedItem.itemId);
                            if (latestItem) {
                                latestItemData = latestItem.itemData;
                            }
                        }

                        let row = { ...latestItemData };
                        row.OrderNo = bNo;
                        row.planStart = savedItem.startDate;
                        row.planEnd = savedItem.endDate;
                        row.planType = savedItem.planType;
                        
                        // Standardize values
                        row.Buyer = getColData(row, ['Buyer', 'BuyerName', 'Customer']);
                        row.Color = getColData(row, ['Color', 'Colour', 'Fab Color']);
                        row.FabricConstruction = getColData(row, ['FabricConstruction', 'Construction', 'Fab Const', 'Fabric']);
                        row.GSM = getColData(row, ['GSM', 'G S M']);
                        row.GreyReq = getColData(row, ['GreyReq', 'Grey Req', 'G. Req', 'Grey req']);
                        row.KnitProd = getColData(row, ['KnitProd', 'Knit Prod', 'K. Prod']);
                        row.KnitBala = getColData(row, ['KnitBala', 'Knit Bala', 'K. Bala', 'Knit. Bala.']);
                        row.DyeingProd = getColData(row, ['DyeingProd', 'Dyeing Prod', 'D. Prod']);
                        row.DyeingBala = getColData(row, ['DyeingBala', 'Dyeing Bala', 'D. Bala', 'Dyeing Bala.']);
                        row.DeliBal = getColData(row, ['DeliBal', 'Deli Bal', 'Deli. Bal.']);
                        row.RequiredQtyKgs = getColData(row, ['RequiredQtyKgs', 'RequiredQty', 'ReqQty']);
                        row.NetDeliveryQtyKgs = getColData(row, ['NetDeliveryQtyKgs', 'NetDeliveryQty', 'DeliveryQty']);
                        
                        if (!row.DeliBal || loadNumber(row.DeliBal) === 0) {
                            const req = loadNumber(row.RequiredQtyKgs);
                            const del = loadNumber(row.NetDeliveryQtyKgs);
                            if (req > 0) row.DeliBal = req - del;
                        }
                        
                        globalLoadData[dept].push(row);
                    }
                });
            }
        });
    }
}

function initLoadMonthSelector() {
    const select = document.getElementById('loadStartMonth');
    select.innerHTML = '';
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    for (let i = -12; i <= 24; i++) {
        const monthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
        const value = monthDate.getFullYear() + '-' + String(monthDate.getMonth() + 1).padStart(2, '0');
        const label = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '-');
        
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        if (i === 0) option.selected = true;
        select.appendChild(option);
    }
}

function parseLoadDate(value) {
    if (!value) return null;
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const text = String(value).trim();
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function startOfLoadDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function addLoadMonths(date, number) { return new Date(date.getFullYear(), date.getMonth() + number, 1); }
function loadMonthEnd(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
function minLoadDate(date1, date2) { return date1 <= date2 ? date1 : date2; }
function maxLoadDate(date1, date2) { return date1 >= date2 ? date1 : date2; }
function inclusiveLoadDays(startDate, endDate) { return Math.floor((startOfLoadDay(endDate) - startOfLoadDay(startDate)) / 86400000) + 1; }

function loadNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const cleaned = String(value).replace(/,/g, '').replace(/\s*Kg$/i, '').trim();
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : 0;
}

function getSelectedLoadMonths() {
    const selectedValue = document.getElementById('loadStartMonth').value;
    if(!selectedValue) return [];
    const [year, month] = selectedValue.split('-').map(Number);
    const firstMonth = new Date(year, month - 1, 1);
    return Array.from({ length: LOAD_MONTH_COUNT }, (_, index) => addLoadMonths(firstMonth, index));
}

function formatLoadMonthHeader(date) { return date.toLocaleDateString('en-US', { month: 'short' }); }
function formatSummaryMonthHeader(date) { return date.toLocaleDateString('en-US', { month: 'long' }); }
function formatLoadMonthYear(date) { return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '-'); }
function formatLoadDate(dateValue) {
    const date = parseLoadDate(dateValue);
    if (!date) return '';
    return date.getDate() + '-' + date.toLocaleDateString('en-US', { month: 'short' });
}

function calculateLoadAllocation(pendingQty, planStartValue, planEndValue, reportMonths) {
    const qty = Math.max(0, loadNumber(pendingQty));
    const planStart = parseLoadDate(planStartValue);
    const planEnd = parseLoadDate(planEndValue);
    const today = startOfLoadDay(new Date());

    const emptyResult = { leadDay: 0, loadPerDay: 0, monthlyLoads: new Array(LOAD_MONTH_COUNT).fill(0) };

    if (!planStart || !planEnd || qty <= 0) return emptyResult;

    if (planEnd <= today) {
        return {
            leadDay: 1,
            loadPerDay: Math.round(qty),
            monthlyLoads: reportMonths.map((_, index) => index === 0 ? Math.round(qty) : 0)
        };
    }

    const allocationStart = maxLoadDate(planStart, today);
    const leadDay = Math.max(1, inclusiveLoadDays(allocationStart, planEnd));

    const monthlyLoads = reportMonths.map(monthStart => {
        const currentMonthEnd = loadMonthEnd(monthStart);
        const previousMonthEnd = loadMonthEnd(addLoadMonths(monthStart, -1));
        const currentCutoff = minLoadDate(planEnd, currentMonthEnd);
        const previousCutoff = minLoadDate(planEnd, previousMonthEnd);
        
        const currentDays = Math.max(0, inclusiveLoadDays(allocationStart, currentCutoff));
        const previousDays = Math.max(0, inclusiveLoadDays(allocationStart, previousCutoff));

        const currentCumulative = Math.round(qty * currentDays / leadDay);
        const previousCumulative = Math.round(qty * previousDays / leadDay);

        return Math.max(0, currentCumulative - previousCumulative);
    });

    return {
        leadDay,
        loadPerDay: Math.round(qty / leadDay),
        monthlyLoads
    };
}

function buildReportData(department) {
    const config = LOAD_REPORT_CONFIG[department];
    const reportMonths = getSelectedLoadMonths();
    const sourceRows = globalLoadData[department] || [];

    const headers = [
        ...config.columns,
        `${config.name} Plan Start Date`,
        `${config.name} Plan End Date`,
        `${config.name} Plan Type`,
        'Lead Day',
        'L/Day',
        ...reportMonths.map(formatLoadMonthHeader)
    ];

    const rows = sourceRows
        .filter(row => row.planType === 'Confirm' || row.planType === 'Tentative')
        .filter(row => loadNumber(row[config.pendingQtyField]) > 0)
        .map(row => {
            const allocation = calculateLoadAllocation(row[config.pendingQtyField], row.planStart, row.planEnd, reportMonths);
            return {
                source: row,
                excelRow: [
                    ...config.columns.map(col => row[col] !== undefined && row[col] !== null ? row[col] : ''),
                    formatLoadDate(row.planStart),
                    formatLoadDate(row.planEnd),
                    row.planType || '',
                    allocation.leadDay,
                    allocation.loadPerDay,
                    ...allocation.monthlyLoads
                ],
                monthlyLoads: allocation.monthlyLoads
            };
        });

    return { config, reportMonths, headers, rows };
}

function buildSummaryData(department) {
    const detailData = buildReportData(department);
    const buyerMap = new Map();

    detailData.rows.forEach(detailRow => {
        const buyer = String(detailRow.source.Buyer || 'Unspecified').trim() || 'Unspecified';
        if (!buyerMap.has(buyer)) buyerMap.set(buyer, new Array(LOAD_MONTH_COUNT).fill(0));
        
        const buyerMonths = buyerMap.get(buyer);
        detailRow.monthlyLoads.forEach((value, index) => {
            buyerMonths[index] += loadNumber(value);
        });
    });

    const summaryRows = Array.from(buyerMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }))
        .map(([buyer, monthlyValues]) => ({ buyer, monthlyValues, total: monthlyValues.reduce((sum, val) => sum + val, 0) }));

    const grandMonthlyTotals = new Array(LOAD_MONTH_COUNT).fill(0);
    summaryRows.forEach(row => {
        row.monthlyValues.forEach((val, idx) => grandMonthlyTotals[idx] += val);
    });
    const grandTotal = grandMonthlyTotals.reduce((sum, val) => sum + val, 0);

    return {
        config: detailData.config,
        reportMonths: detailData.reportMonths,
        headers: ['Buyer', ...detailData.reportMonths.map(formatSummaryMonthHeader), 'Total [Kg]'],
        rows: summaryRows,
        grandMonthlyTotals,
        grandTotal
    };
}

function setSummaryDepartment(department) {
    activeSummaryDepartment = department;
    document.querySelectorAll('.department-tab').forEach(tab => {
        tab.className = 'department-tab px-4 py-2 rounded border text-xs font-bold bg-white text-gray-700 hover:bg-gray-50';
    });
    const activeBtn = document.getElementById('summaryBtn' + department.charAt(0).toUpperCase() + department.slice(1));
    if(activeBtn) {
        activeBtn.className = `department-tab px-4 py-2 rounded border text-xs font-bold active-${department}`;
    }
    refreshCurrentView();
}

function refreshCurrentView() {
    if (activeMainMenu === 'summary') {
        const data = buildSummaryData(activeSummaryDepartment);
        renderSummaryTable(data);
    }
}

function renderSummaryTable(data) {
    const table = document.getElementById('summaryPreviewTable');
    table.querySelector('thead').innerHTML = `<tr>${data.headers.map(h => `<th class="p-2 border text-center">${h}</th>`).join('')}</tr>`;
    
    const tbody = table.querySelector('tbody');
    if (data.rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${data.headers.length}" class="text-center p-4 text-slate-500">No load data available for this department.</td></tr>`;
        table.querySelector('tfoot').innerHTML = '';
        return;
    }

    tbody.innerHTML = data.rows.map(row => `
        <tr>
            <td class="p-2 border text-left font-semibold text-slate-700">${row.buyer}</td>
            ${row.monthlyValues.map(val => `<td class="p-2 border text-right">${val.toLocaleString()}</td>`).join('')}
            <td class="p-2 border text-right font-bold text-slate-800">${row.total.toLocaleString()}</td>
        </tr>
    `).join('');

    table.querySelector('tfoot').innerHTML = `
        <tr>
            <td class="p-2 border text-left">Grand Total</td>
            ${data.grandMonthlyTotals.map(val => `<td class="p-2 border text-right">${val.toLocaleString()}</td>`).join('')}
            <td class="p-2 border text-right">${data.grandTotal.toLocaleString()}</td>
        </tr>
    `;
}

function downloadLoadReport(department) {
    const { config, reportMonths, headers, rows } = buildReportData(department);
    if (!rows.length) { showToast(`No ${config.name} load data found.`); return; }

    const worksheetData = [headers, ...rows.map(row => row.excelRow)];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    worksheet['!autofilter'] = {
        ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: headers.length - 1 } })
    };
    worksheet['!cols'] = headers.map(header => {
        if (header.includes('Date') || header.includes('Construction') || header.includes('Process')) return { wch: 21 };
        return { wch: Math.max(10, Math.min(String(header).length + 3, 18)) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${config.name} Load`);
    const filename = `${config.name}_Load_${formatLoadMonthYear(reportMonths[0])}.xlsx`;
    XLSX.writeFile(workbook, filename);
}

function downloadLoadSummary(department) {
    const { config, reportMonths, headers, rows, grandMonthlyTotals, grandTotal } = buildSummaryData(department);
    if (!rows.length) { showToast(`No ${config.name} summary data found.`); return; }

    const worksheetData = [
        headers,
        ...rows.map(row => [row.buyer, ...row.monthlyValues, row.total]),
        ['Grand Total', ...grandMonthlyTotals, grandTotal]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!cols'] = [{ wch: 25 }, ...reportMonths.map(() => ({ wch: 15 })), { wch: 15 }];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${config.name} Summary`);
    const filename = `${config.name}_Summary_${formatLoadMonthYear(reportMonths[0])}.xlsx`;
    XLSX.writeFile(workbook, filename);
}

