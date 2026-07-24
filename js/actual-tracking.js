// ==========================================================
// ACTUAL TRACKING: Plan vs Actual
// ==========================================================
async function loadActualTracking(deptKey) {
    actualDeptKey = deptKey;
    const deptNames = { yd: 'YD', knitting: 'Knitting', dyeing: 'Dyeing', finishing: 'Finishing', delivery: 'Delivery', deliveryfloor: 'Delivery (Floor)' };
    const deptName = deptNames[deptKey] || deptKey;

    localStorage.setItem('activePage', JSON.stringify({ page: 'actualTracking', dept: deptKey }));

    hideAllCoreViews();

    // Show Plan vs Actual view
    const pvaView = document.getElementById('planVsActualView');
    if (pvaView) pvaView.classList.remove('hidden');
    
    const permsStr = localStorage.getItem('permissions');
    if (permsStr) {
        try {
            const permissions = JSON.parse(permsStr);
            if (permissions && permissions.actions) {
                const btn = document.getElementById('btnSaveActual');
                if (btn) {
                    const deptMap = { yd: 'YD', knitting: 'Knitting', dyeing: 'Dyeing', finishing: 'Finishing', delivery: 'Delivery', deliveryfloor: 'DeliveryFloor' };
                    const key = 'saveActual' + (deptMap[deptKey] || '');
                    btn.style.display = permissions.actions[key] ? '' : 'none';
                }
            }
        } catch(e) {}
    }

    const uniqueId = `actualTracking_${deptKey}`;
    activeTabId = uniqueId;
    const menuTitle = deptName + ' Tracking';
    if (!openTabs.find(tab => tab.id === uniqueId)) openTabs.push({ id: uniqueId, title: menuTitle, dept: deptKey, mode: 'actualTracking' });
    renderTabs();
    if (document.getElementById('actualViewTitle')) document.getElementById('actualViewTitle').innerText = `Plan Vs Actual - ${deptName}`;
    if (document.getElementById('actualDeptTitle')) document.getElementById('actualDeptTitle').innerText = deptName;

    actualCurrentPage = 1;
    actualColFilters = {};
    actualActiveTab = 'Pending';
    actualActiveBuyer = '';
    actualFilterStartMin = '';
    actualFilterStartMax = '';
    actualFilterEndMin = '';
    actualFilterEndMax = '';
    document.querySelectorAll('#actualDataTable .header-search').forEach(inp => inp.value = '');
    document.getElementById('actualFilterStartMin').value = '';
    document.getElementById('actualFilterStartMax').value = '';
    document.getElementById('actualFilterEndMin').value = '';
    document.getElementById('actualFilterEndMax').value = '';

    const th1 = document.getElementById('thDynamic1');
    const th2 = document.getElementById('thDynamic2');
    const ts1 = document.getElementById('thSearchDynamic1');
    const ts2 = document.getElementById('thSearchDynamic2');
    if (deptKey === 'knitting') {
        th1.innerText = 'Knit Prod.'; th2.innerText = 'Knit Bal.';
        th1.classList.remove('hidden'); th2.classList.remove('hidden');
        ts1.classList.remove('hidden'); ts2.classList.remove('hidden');
    } else if (deptKey === 'dyeing') {
        th1.innerText = 'Dyeing Prod.'; th2.innerText = 'Dyeing Bal.';
        th1.classList.remove('hidden'); th2.classList.remove('hidden');
        ts1.classList.remove('hidden'); ts2.classList.remove('hidden');
    } else if (deptKey === 'delivery' || deptKey === 'deliveryfloor') {
        th1.innerText = 'NetDeliveryQtyKgs'; th2.innerText = 'Deli. Bal.';
        th1.classList.remove('hidden'); th2.classList.remove('hidden');
        ts1.classList.remove('hidden'); ts2.classList.remove('hidden');
    } else {
        th1.classList.add('hidden'); th2.classList.add('hidden');
        ts1.classList.add('hidden'); ts2.classList.add('hidden');
    }

    // Reset tab buttons UI
    document.getElementById('btnActualPending').className = "bg-[#313644] text-white px-3 sm:px-6 py-1.5 sm:py-2 font-bold rounded-sm cursor-pointer shadow-sm uppercase tracking-wide transition-colors text-[10px] sm:text-[13px] text-center";
    document.getElementById('btnActualComplete').className = "bg-white text-gray-800 border border-gray-300 px-3 sm:px-6 py-1.5 sm:py-2 font-bold rounded-sm cursor-pointer shadow-sm hover:bg-gray-50 uppercase tracking-wide transition-colors text-[10px] sm:text-[13px] text-center";

    setActiveSidebarMenu('menu-' + deptKey + '-actual');
    closeSidebarMobile();

    const loader = document.getElementById('actualLoadingSpinner');
    if (loader) loader.classList.remove('hidden');

    await fetchActualTrackingData();

    if (loader) loader.classList.add('hidden');
    renderActualBuyerFilter();
    renderActualTable();
}

async function fetchActualTrackingData() {
    actualTrackingData = [];
    try {
        // Fetch all saved plan data from DB
        const datesRes = await fetch(`https://abir-backend-api.onrender.com/api/files/all-dates?t=${Date.now()}`);
        if (!datesRes.ok) return;
        const savedPlans = await datesRes.json();

        // Also fetch general file data for booking dates and buyer info
        const filesRes = await fetch(`https://abir-backend-api.onrender.com/api/files/all?t=${Date.now()}`);
        const allFiles = await filesRes.json();
        const generalFilesRaw = allFiles.filter(f => f.category === 'General' || !f.category);
        generalFilesRaw.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const latestFilesMap = new Map();
        generalFilesRaw.forEach(f => latestFilesMap.set(f.originalName, f));
        const generalFiles = Array.from(latestFilesMap.values());

        // Read general files for booking date & buyer info
        let generalDataMap = {};
        for (let file of generalFiles) {
            try {
                const fRes = await fetch(`https://abir-backend-api.onrender.com/uploads/${file.savedName}?t=${Date.now()}`);
                if (!fRes.ok) continue;
                const ab = await fRes.arrayBuffer();
                const wb = XLSX.read(ab, { type: 'array' });
                let sheetData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
                sheetData.forEach(row => {
                    let bNoVal = getColData(row, ['BookingNo', 'OrderNo', 'EWO', 'Booking', 'Order No', 'Booking No']);
                    let bNo = String(bNoVal !== '' ? bNoVal : '').trim();
                    if (!bNo) return;

                    let buyerVal = getColData(row, ['Buyer', 'BuyerName', 'Customer']);
                    let buyer = String(buyerVal).trim().toUpperCase().replace(/\s+/g, ' ');

                    let dateVal = getColData(row, ['BookingReceiveDate', 'BookingDate', 'Date']);
                    let bookingDate = formatExcelDate(dateVal);

                    if (!generalDataMap[bNo]) {
                        generalDataMap[bNo] = { buyers: new Set(), bookingDate: bookingDate };
                    }
                    if (buyer && buyer !== 'UNDEFINED' && buyer !== 'N/A' && buyer !== 'GENERAL') {
                        generalDataMap[bNo].buyers.add(buyer);
                    }
                    if (bookingDate && bookingDate !== 'N/A') generalDataMap[bNo].bookingDate = bookingDate;
                });
            } catch (e) { console.error('File read err:', e); }
        }

        let deptExtMap = {};
        let targetDeptName = actualDeptKey === 'knitting' ? 'Knitting' :
                             actualDeptKey === 'dyeing' ? 'Dyeing' :
                             (actualDeptKey === 'delivery' || actualDeptKey === 'deliveryfloor') ? 'Delivery' : null;

        if (targetDeptName) {
            const dFilesRaw = allFiles.filter(f => f.category === targetDeptName);
            dFilesRaw.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const latestDFilesMap = new Map();
            dFilesRaw.forEach(f => latestDFilesMap.set(f.originalName, f));
            const deptFiles = Array.from(latestDFilesMap.values());

            for (let file of deptFiles) {
                try {
                    const fRes = await fetch(`https://abir-backend-api.onrender.com/uploads/${file.savedName}?t=${Date.now()}`);
                    if (!fRes.ok) continue;
                    const ab = await fRes.arrayBuffer();
                    const wb = XLSX.read(ab, { type: 'array' });
                    let sheetData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
                    
                    sheetData.forEach(row => {
                        let bNoVal = getColData(row, ['BookingNo', 'OrderNo', 'EWO', 'Booking', 'Order No', 'Booking No']);
                        let bNo = String(bNoVal !== '' ? bNoVal : '').trim();
                        if (!bNo) return;
                        
                        if (!deptExtMap[bNo]) deptExtMap[bNo] = { prod: 0, bal: 0 };
                        
                        if (actualDeptKey === 'knitting') {
                            deptExtMap[bNo].prod += Number(getColData(row, ['Knit Prod.'])) || 0;
                            deptExtMap[bNo].bal += Number(getColData(row, ['Knit. Bala.', 'Knit Bal.'])) || 0;
                        } else if (actualDeptKey === 'dyeing') {
                            deptExtMap[bNo].prod += Number(getColData(row, ['Dyeing Prod.'])) || 0;
                            deptExtMap[bNo].bal += Number(getColData(row, ['Dyeing Bala.', 'Dyeing Bal.'])) || 0;
                        } else if (actualDeptKey === 'delivery' || actualDeptKey === 'deliveryfloor') {
                            deptExtMap[bNo].prod += Number(getColData(row, ['NetDeliveryQtyKgs', 'NetDeliveryQty', 'DeliveryQty'])) || 0;
                            let bal = Number(getColData(row, ['Deli. Bal.', 'Deli Bal.', 'DeliBal', 'Delivery Balance'])) || 0;
                            if (bal === 0) {
                                const req = Number(getColData(row, ['RequiredQtyKgs', 'Req Qty', 'Qty'])) || 0;
                                const del = Number(getColData(row, ['NetDeliveryQtyKgs', 'NetDeliveryQty', 'DeliveryQty'])) || 0;
                                if (req > 0) bal = req - del;
                            }
                            deptExtMap[bNo].bal += bal;
                        }
                    });
                } catch (e) { console.error('Dept File read err:', e); }
            }
        }

        let preloadedPerms = null;
        try { preloadedPerms = JSON.parse(localStorage.getItem('permissions')); } catch(e){}

        // Process saved plans - find orders with confirmed items in the target department
        savedPlans.forEach(plan => {
            const dbDeptKey = actualDeptKey === 'deliveryfloor' ? 'delivery' : actualDeptKey;
            const deptItems = plan[dbDeptKey];
            if (!deptItems || !Array.isArray(deptItems) || deptItems.length === 0) return;

            let startDates, endDates;
            
            if (actualDeptKey === 'deliveryfloor') {
                const floorItems = deptItems.filter(item => item.floorPlanType === 'Confirm' || item.floorPlanType === 'Tentative');
                if (floorItems.length === 0) return;
                
                startDates = floorItems.map(item => item.floorStartDate).filter(d => d && d !== '' && d !== '-');
                endDates = floorItems.map(item => item.floorEndDate).filter(d => d && d !== '' && d !== '-');
            } else {
                const allConfirm = deptItems.every(item => item.planType === 'Confirm');
                if (!allConfirm) return;
                
                startDates = deptItems.map(item => item.startDate).filter(d => d && d !== '' && d !== '-');
                endDates = deptItems.map(item => item.endDate).filter(d => d && d !== '' && d !== '-');
            }

            let planStart = '';
            let planEnd = '';
            if (startDates.length > 0) {
                startDates.sort();
                planStart = startDates[0]; // MIN
            }
            if (endDates.length > 0) {
                endDates.sort();
                planEnd = endDates[endDates.length - 1]; // MAX
            }

            // Get previously saved actual data
            const actualKey = actualDeptKey + 'Actual';
            let actualStart = '';
            let actualEnd = '';
            let failReason = '';
            let relatedDept = '';
            if (plan[actualKey]) {
                actualStart = plan[actualKey].actualStart || '';
                actualEnd = plan[actualKey].actualEnd || '';
                failReason = plan[actualKey].failReason || plan[actualKey].remarks || ''; // backward compat
                relatedDept = plan[actualKey].relatedDept || '';
            }

            // First try to get buyer from dept items (file data)
            let displayBuyer = 'N/A';
            let buyersFromItems = new Set();
            deptItems.forEach(item => {
                if (item.itemData && item.itemData.Buyer) {
                    let b = String(item.itemData.Buyer).trim();
                    if (b && b.toLowerCase() !== 'undefined' && b.toLowerCase() !== 'n/a') buyersFromItems.add(b);
                }
            });
            if (buyersFromItems.size > 0) {
                displayBuyer = Array.from(buyersFromItems).join(', ');
            }

            // Fallback to general data if not found in file, also get booking date
            let genInfo = generalDataMap[plan.orderNo];
            let bookingDate = 'N/A';
            if (genInfo) {
                if (displayBuyer === 'N/A') {
                    displayBuyer = genInfo.buyers.size > 0 ? Array.from(genInfo.buyers).join(', ') : 'N/A';
                }
                bookingDate = genInfo.bookingDate || 'N/A';
            }

            let extProd = '';
            let extBal = '';
            if (targetDeptName && deptExtMap[plan.orderNo]) {
                extProd = deptExtMap[plan.orderNo].prod;
                extBal = deptExtMap[plan.orderNo].bal;
            }

            if (!hasBuyerPermission(displayBuyer.split(','), preloadedPerms)) return;

            actualTrackingData.push({
                orderNo: plan.orderNo,
                buyer: displayBuyer,
                bookingDate: bookingDate,
                planStart: planStart,
                planEnd: planEnd,
                actualStart: actualStart,
                actualEnd: actualEnd,
                failReason: failReason,
                relatedDept: relatedDept,
                extProd: extProd,
                extBal: extBal
            });
        });

    } catch (e) {
        console.error('Error fetching actual tracking data:', e);
    }
}

function filterActualByColumn(colIndex, val) {
    actualColFilters[colIndex] = String(val).toLowerCase().trim();
    actualCurrentPage = 1;
    renderActualTable();
}

function switchActualTab(tab) {
    actualActiveTab = tab;
    actualCurrentPage = 1;
    const btnP = document.getElementById('btnActualPending');
    const btnC = document.getElementById('btnActualComplete');
    const activeClass = "bg-[#313644] text-white px-3 sm:px-6 py-1.5 sm:py-2 font-bold rounded-sm cursor-pointer shadow-sm uppercase tracking-wide transition-colors text-[10px] sm:text-[13px] text-center";
    const inactiveClass = "bg-white text-gray-800 border border-gray-300 px-3 sm:px-6 py-1.5 sm:py-2 font-bold rounded-sm cursor-pointer shadow-sm hover:bg-gray-50 uppercase tracking-wide transition-colors text-[10px] sm:text-[13px] text-center";
    btnP.className = tab === 'Pending' ? activeClass : inactiveClass;
    btnC.className = tab === 'Complete' ? activeClass : inactiveClass;
    renderActualTable();
}

function renderActualBuyerFilter() {
    const container = document.getElementById('actualBuyerFilterContainer');
    const buyerSet = new Set();
    actualTrackingData.forEach(d => {
        if (d.buyer && d.buyer !== 'N/A') {
            d.buyer.split(',').forEach(b => buyerSet.add(b.trim()));
        }
    });
    const buyers = Array.from(buyerSet).sort();
    if (buyers.length === 0) { container.innerHTML = ''; return; }

    let html = '';
    const allActive = actualActiveBuyer === '';
    html += `<div onclick="setActualBuyerFilter('')" class="${allActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-3 py-1 rounded cursor-pointer font-bold text-[10px] sm:text-[11px] whitespace-nowrap transition-colors shrink-0">ALL</div>`;
    buyers.forEach(b => {
        const isActive = actualActiveBuyer === b;
        html += `<div onclick="setActualBuyerFilter('${b.replace(/'/g, "\\'")}')" class="${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-3 py-1 rounded cursor-pointer font-bold text-[10px] sm:text-[11px] whitespace-nowrap transition-colors shrink-0">${b}</div>`;
    });
    container.innerHTML = html;
}

function setActualBuyerFilter(buyer) {
    actualActiveBuyer = buyer;
    actualCurrentPage = 1;
    renderActualBuyerFilter();
    renderActualTable();
}

function applyActualDateFilter() {
    actualFilterStartMin = document.getElementById('actualFilterStartMin').value;
    actualFilterStartMax = document.getElementById('actualFilterStartMax').value;
    actualFilterEndMin = document.getElementById('actualFilterEndMin').value;
    actualFilterEndMax = document.getElementById('actualFilterEndMax').value;
    actualCurrentPage = 1;
    renderActualTable();
}

function clearActualDateFilter() {
    actualFilterStartMin = '';
    actualFilterStartMax = '';
    actualFilterEndMin = '';
    actualFilterEndMax = '';
    document.getElementById('actualFilterStartMin').value = '';
    document.getElementById('actualFilterStartMax').value = '';
    document.getElementById('actualFilterEndMin').value = '';
    document.getElementById('actualFilterEndMax').value = '';
    actualCurrentPage = 1;
    renderActualTable();
}

function renderActualTable() {
    const tbody = document.getElementById('actualTableBody');
    const emptyState = document.getElementById('actualEmptyState');
    const tableWrapper = document.getElementById('actualTableWrapper');
    const paginationControls = document.getElementById('actualPaginationControls');

    if (actualTrackingData.length === 0) {
        tableWrapper.classList.add('hidden');
        paginationControls.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.style.display = 'flex';
        tbody.innerHTML = '';
        return;
    }

    let data = [...actualTrackingData];

    // Filter by tab: Pending = no actualEnd, Complete = has actualEnd
    if (actualActiveTab === 'Pending') {
        data = data.filter(d => !d.actualEnd || d.actualEnd === '');
    } else {
        data = data.filter(d => d.actualEnd && d.actualEnd !== '');
    }

    // Filter by buyer
    if (actualActiveBuyer) {
        data = data.filter(d => d.buyer && d.buyer.includes(actualActiveBuyer));
    }

    // Filter by date range (plan start/end)
    if (actualFilterStartMin) {
        const fs = new Date(actualFilterStartMin).setHours(0, 0, 0, 0);
        data = data.filter(d => {
            if (!d.planStart) return false;
            return new Date(d.planStart).setHours(0, 0, 0, 0) >= fs;
        });
    }
    if (actualFilterStartMax) {
        const fe = new Date(actualFilterStartMax).setHours(0, 0, 0, 0);
        data = data.filter(d => {
            if (!d.planStart) return false;
            return new Date(d.planStart).setHours(0, 0, 0, 0) <= fe;
        });
    }
    if (actualFilterEndMin) {
        const fs = new Date(actualFilterEndMin).setHours(0, 0, 0, 0);
        data = data.filter(d => {
            if (!d.planEnd) return false;
            return new Date(d.planEnd).setHours(0, 0, 0, 0) >= fs;
        });
    }
    if (actualFilterEndMax) {
        const fe = new Date(actualFilterEndMax).setHours(0, 0, 0, 0);
        data = data.filter(d => {
            if (!d.planEnd) return false;
            return new Date(d.planEnd).setHours(0, 0, 0, 0) <= fe;
        });
    }

    // Apply column filters
    for (let col in actualColFilters) {
        const searchVal = actualColFilters[col];
        if (!searchVal) continue;
        data = data.filter(d => {
            if (col == 1) return String(d.orderNo).toLowerCase().includes(searchVal);
            if (col == 2) return String(d.buyer).toLowerCase().includes(searchVal);
            return true;
        });
    }

    tableWrapper.classList.remove('hidden');
    emptyState.classList.add('hidden');
    emptyState.style.display = 'none';

    if (data.length === 0) {
        paginationControls.classList.add('hidden');
        let cols = (actualDeptKey === 'knitting' || actualDeptKey === 'dyeing' || actualDeptKey === 'delivery' || actualDeptKey === 'deliveryfloor') ? 13 : 11;
        tbody.innerHTML = `<tr><td colspan="${cols}" class="p-10 text-center text-gray-500 bg-white"><i class="fas fa-search text-3xl mb-3 text-gray-300 block"></i>No matching data found.</td></tr>`;
        return;
    }

    paginationControls.classList.remove('hidden');

    const totalPages = Math.ceil(data.length / actualRowsPerPage);
    if (actualCurrentPage > totalPages) actualCurrentPage = totalPages;
    if (actualCurrentPage < 1) actualCurrentPage = 1;
    const start = (actualCurrentPage - 1) * actualRowsPerPage;
    const pagedData = data.slice(start, start + actualRowsPerPage);

    let html = '';
    pagedData.forEach((d, idx) => {
        const sl = start + idx + 1;
        const encodedOrderNo = encodeURIComponent(d.orderNo);

        // Compute Pass/Fail for Start: actual <= plan = Pass (started on time or early)
        let startResultHtml = '<span class="text-gray-400 text-[10px]">\u2014</span>';
        if (d.actualStart && d.planStart) {
            const actualS = new Date(d.actualStart).setHours(0, 0, 0, 0);
            const planS = new Date(d.planStart).setHours(0, 0, 0, 0);
            if (actualS <= planS) {
                startResultHtml = '<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">Pass</span>';
            } else {
                startResultHtml = '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-[10px]">Fail</span>';
            }
        }

        // Compute Pass/Fail for End: actual <= plan = Pass (ended on time or early)
        let endResultHtml = '<span class="text-gray-400 text-[10px]">\u2014</span>';
        if (d.actualEnd && d.planEnd) {
            const actualE = new Date(d.actualEnd).setHours(0, 0, 0, 0);
            const planE = new Date(d.planEnd).setHours(0, 0, 0, 0);
            if (actualE <= planE) {
                endResultHtml = '<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">Pass</span>';
            } else {
                endResultHtml = '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-[10px]">Fail</span>';
            }
        }

        let dynColsHtml = '';
        if (actualDeptKey === 'knitting' || actualDeptKey === 'dyeing' || actualDeptKey === 'delivery' || actualDeptKey === 'deliveryfloor') {
            dynColsHtml = `
            <td class="p-2 border-r border-gray-200 text-center font-medium bg-yellow-50/30">${d.extProd !== '' ? d.extProd.toFixed(2) : ''}</td>
            <td class="p-2 border-r border-gray-200 text-center font-medium bg-yellow-50/30">${d.extBal !== '' ? d.extBal.toFixed(2) : ''}</td>
            `;
        }

        html += `
        <tr class="hover:bg-blue-50 border-b border-gray-200 transition-colors actual-row" data-orderno="${encodedOrderNo}">
            <td class="p-2 border-r border-gray-200 text-center font-bold text-gray-500">${sl}</td>
            <td class="p-2 border-r border-gray-200 text-blue-700 font-bold w-[100px] min-w-[100px] max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap" title="${d.orderNo}">${d.orderNo}</td>
            <td class="p-2 border-r border-gray-200 font-medium text-gray-800">${d.buyer}</td>
            ${dynColsHtml}
            <td class="p-2 border-r border-gray-200 text-center font-medium text-blue-700 bg-blue-50/30">${formatDateDisplay(d.planStart)}</td>
            <td class="p-2 border-r border-gray-200 text-center font-medium text-blue-700 bg-blue-50/30">${formatDateDisplay(d.planEnd)}</td>
            <td class="p-2 border-r border-gray-200 text-center">
                <input type="date" class="actual-start-date p-1 border border-gray-300 rounded text-[10px] w-[110px] focus:border-blue-500 outline-none" value="${d.actualStart || ''}" data-plan-start="${d.planStart}" onchange="enforceEndDateMin(this, 'actual-end-date'); updateActualResult(this)">
            </td>
            <td class="p-2 border-r border-gray-200 text-center">
                <input type="date" class="actual-end-date p-1 border border-gray-300 rounded text-[10px] w-[110px] focus:border-blue-500 outline-none" value="${d.actualEnd || ''}" data-plan-end="${d.planEnd}" ${d.actualStart ? `min="${d.actualStart}"` : ''} onchange="updateActualResult(this)">
            </td>
            <td class="p-2 border-r border-gray-200 text-center actual-start-result">${startResultHtml}</td>
            <td class="p-2 border-r border-gray-200 text-center actual-end-result">${endResultHtml}</td>
            <td class="p-2 border-r border-gray-200">
                <input type="text" class="actual-fail-reason w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Fail Reason..." value="${d.failReason || ''}">
            </td>
            <td class="p-2">
                <input type="text" class="actual-related-dept w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Related Dept..." value="${d.relatedDept || ''}">
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;

    // Update pagination
    updateActualPaginationUI(start, start + pagedData.length, data.length, totalPages);
}

function updateActualResult(inputEl) {
    const row = inputEl.closest('tr');
    const startInput = row.querySelector('.actual-start-date');
    const endInput = row.querySelector('.actual-end-date');
    const startResultCell = row.querySelector('.actual-start-result');
    const endResultCell = row.querySelector('.actual-end-result');

    const planStart = startInput.dataset.planStart;
    const planEnd = endInput.dataset.planEnd;
    const actualStart = startInput.value;
    const actualEnd = endInput.value;

    // Validation: Actual End can't be selected without Actual Start
    if (actualEnd && !actualStart) {
        showToast("Please select Actual Start date first!");
        endInput.value = '';
        endResultCell.innerHTML = '<span class="text-gray-400 text-[10px]">\u2014</span>';
        return;
    }

    // Validation: Actual End can't be less than Actual Start
    if (actualStart && actualEnd) {
        const aS = new Date(actualStart).setHours(0, 0, 0, 0);
        const aE = new Date(actualEnd).setHours(0, 0, 0, 0);
        if (aE < aS) {
            showToast("Actual End date cannot be before Actual Start date!");
            endInput.value = '';
            endResultCell.innerHTML = '<span class="text-gray-400 text-[10px]">\u2014</span>';
            return;
        }
    }

    // Compute Start Result: actual <= plan = Pass
    if (actualStart && planStart) {
        const aS = new Date(actualStart).setHours(0, 0, 0, 0);
        const pS = new Date(planStart).setHours(0, 0, 0, 0);
        if (aS <= pS) {
            startResultCell.innerHTML = '<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">Pass</span>';
        } else {
            startResultCell.innerHTML = '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-[10px]">Fail</span>';
        }
    } else {
        startResultCell.innerHTML = '<span class="text-gray-400 text-[10px]">\u2014</span>';
    }

    // Compute End Result: actual <= plan = Pass
    if (actualEnd && planEnd) {
        const aE = new Date(actualEnd).setHours(0, 0, 0, 0);
        const pE = new Date(planEnd).setHours(0, 0, 0, 0);
        if (aE <= pE) {
            endResultCell.innerHTML = '<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">Pass</span>';
        } else {
            endResultCell.innerHTML = '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-[10px]">Fail</span>';
        }
    } else {
        endResultCell.innerHTML = '<span class="text-gray-400 text-[10px]">\u2014</span>';
    }
}

function updateActualPaginationUI(start, end, total, totalPages) {
    document.getElementById('actualPageInfo').innerText = `Showing ${total === 0 ? 0 : start + 1}-${end} of ${total}`;
    const btnContainer = document.getElementById('actualPageButtons');
    btnContainer.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = `px-3 py-1.5 border border-gray-300 rounded font-medium text-xs transition-colors ${actualCurrentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`;
    prev.innerHTML = '<i class="fas fa-chevron-left mr-1 text-[10px]"></i> Prev';
    prev.onclick = () => { if (actualCurrentPage > 1) { actualCurrentPage--; renderActualTable(); } };

    const next = document.createElement('button');
    next.className = `px-3 py-1.5 border border-gray-300 rounded font-medium text-xs transition-colors ${actualCurrentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`;
    next.innerHTML = 'Next <i class="fas fa-chevron-right ml-1 text-[10px]"></i>';
    next.onclick = () => { if (actualCurrentPage < totalPages) { actualCurrentPage++; renderActualTable(); } };

    btnContainer.appendChild(prev);
    const pageText = document.createElement('span');
    pageText.className = 'px-3 py-1 font-semibold text-gray-700 hidden sm:inline-block';
    pageText.innerText = `Page ${totalPages === 0 ? 0 : actualCurrentPage} of ${totalPages}`;
    btnContainer.appendChild(pageText);
    btnContainer.appendChild(next);
}

function changeActualRowsPerPage() {
    actualRowsPerPage = parseInt(document.getElementById('actualRowsPerPage').value);
    actualCurrentPage = 1;
    renderActualTable();
}

async function saveActualData() {
    if (!actualDeptKey) return;

    const rows = document.querySelectorAll('#actualTableBody .actual-row');
    if (rows.length === 0) {
        showToast('No data to save!');
        return;
    }

    const actualKey = actualDeptKey + 'Actual';
    let savePayloads = [];
    let validationFailed = false;

    rows.forEach(row => {
        if (validationFailed) return;
        const orderNo = decodeURIComponent(row.dataset.orderno);
        const actualStart = row.querySelector('.actual-start-date').value;
        const actualEnd = row.querySelector('.actual-end-date').value;
        const failReason = row.querySelector('.actual-fail-reason').value;
        const relatedDept = row.querySelector('.actual-related-dept').value;

        // Compute results to check if Fail
        let startIsFail = false;
        let endIsFail = false;
        const planStart = row.querySelector('.actual-start-date').dataset.planStart;
        const planEnd = row.querySelector('.actual-end-date').dataset.planEnd;

        if (actualStart && planStart) {
            const aS = new Date(actualStart).setHours(0, 0, 0, 0);
            const pS = new Date(planStart).setHours(0, 0, 0, 0);
            if (aS > pS) startIsFail = true;
        }
        if (actualEnd && planEnd) {
            const aE = new Date(actualEnd).setHours(0, 0, 0, 0);
            const pE = new Date(planEnd).setHours(0, 0, 0, 0);
            if (aE > pE) endIsFail = true;
        }

        // Validation: If any result is Fail, Fail Reason and Related Dept are mandatory
        if ((startIsFail || endIsFail) && (!failReason.trim() || !relatedDept.trim())) {
            showToast(`Save failed for ${orderNo}: "Fail Reason" and "Related Dept." are mandatory when result is Fail!`);
            if (!failReason.trim()) row.querySelector('.actual-fail-reason').style.borderColor = 'red';
            if (!relatedDept.trim()) row.querySelector('.actual-related-dept').style.borderColor = 'red';
            validationFailed = true;
            return;
        }

        // Validation: actualEnd < actualStart
        if (actualStart && actualEnd) {
            if (new Date(actualEnd).setHours(0,0,0,0) < new Date(actualStart).setHours(0,0,0,0)) {
                showToast(`Save failed for ${orderNo}: Actual End cannot be before Actual Start!`);
                validationFailed = true;
                return;
            }
        }

        savePayloads.push({
            orderNo: orderNo,
            actualStart: actualStart,
            actualEnd: actualEnd,
            failReason: failReason,
            relatedDept: relatedDept
        });

        // Update local data too
        const localItem = actualTrackingData.find(d => d.orderNo === orderNo);
        if (localItem) {
            localItem.actualStart = actualStart;
            localItem.actualEnd = actualEnd;
            localItem.failReason = failReason;
            localItem.relatedDept = relatedDept;
        }
    });

    if (validationFailed) return;

    showToast('Saving actual tracking data...');

    let successCount = 0;
    let failCount = 0;

    for (let payload of savePayloads) {
        try {
            const res = await fetch('https://abir-backend-api.onrender.com/api/files/save-dates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderNo: payload.orderNo,
                    department: actualKey,
                    fabricItems: [],
                    actualData: {
                        actualStart: payload.actualStart,
                        actualEnd: payload.actualEnd,
                        failReason: payload.failReason,
                        relatedDept: payload.relatedDept
                    }
                })
            });
            if (res.ok) successCount++;
            else failCount++;
        } catch (e) {
            failCount++;
            console.error('Save error for', payload.orderNo, e);
        }
    }

    if (failCount === 0) {
        showToast(`All ${successCount} order(s) saved successfully!`);
    } else {
        showToast(`Saved ${successCount}, Failed ${failCount} order(s).`);
    }

    // Re-render to move items between tabs if actualEnd was added/removed
    renderActualTable();
}
