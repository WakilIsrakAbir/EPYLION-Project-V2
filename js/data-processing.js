// ==========================================================
// DATA PROCESSING: Fetch, Merge, Filter
// ==========================================================
// ==========================================================
let cachedGeneralFilesStr = "";
let cachedDeptFilesStr = {};
let cachedGeneralRawData = [];
let cachedDeptRawData = {};

function generateItemId(itemData, tabId) {
    if (!itemData) return Date.now().toString();
    const currentDept = tabId.replace('_report', '');
    let bNo = String(itemData.OrderNo !== undefined && itemData.OrderNo !== null ? itemData.OrderNo : 'N/A').trim();
    let color = String(itemData.Color !== undefined && itemData.Color !== null ? itemData.Color : 'N/A').trim();

    if (currentDept === 'knitting' || currentDept === 'delivery') {
        let fabConst = String(itemData.FabricConstruction !== undefined && itemData.FabricConstruction !== null ? itemData.FabricConstruction : 'N/A').trim();
        let gsm = String(itemData.GSM !== undefined && itemData.GSM !== null ? itemData.GSM : 'N/A').trim();
        return `${bNo}_${color}_${fabConst}_${gsm}`.toLowerCase().replace(/\s+/g, '');
    } else if (currentDept === 'yd') {
        let type = String(itemData['Booking Type'] !== undefined && itemData['Booking Type'] !== null ? itemData['Booking Type'] : 'N/A').trim();
        let ydb = String(itemData.YDB !== undefined && itemData.YDB !== null ? itemData.YDB : 'N/A').trim();
        return `${bNo}_${type}_${ydb}`.toLowerCase().replace(/\s+/g, '');
    } else {
        let procName = String(itemData.ProcessName !== undefined && itemData.ProcessName !== null ? itemData.ProcessName : 'N/A').trim();
        return `${bNo}_${color}_${procName}`.toLowerCase().replace(/\s+/g, '');
    }
}

function activateMainTab(tabName) {
    activeMainTab = tabName;
    const tabs = ['Pending', 'Confirm', 'Tentative', 'All'];
    tabs.forEach(t => {
        const btn = document.getElementById('btn' + t);
        if (btn) {
            if (t === tabName) btn.className = "bg-[#313644] text-white px-3 sm:px-6 py-1.5 sm:py-2 font-bold rounded-sm cursor-pointer shadow-sm uppercase tracking-wide transition-colors text-[10px] sm:text-[13px] flex-1 sm:flex-none text-center";
            else btn.className = "bg-white text-gray-800 border border-gray-300 px-3 sm:px-6 py-1.5 sm:py-2 font-bold rounded-sm cursor-pointer shadow-sm hover:bg-gray-50 uppercase tracking-wide transition-colors text-[10px] sm:text-[13px] flex-1 sm:flex-none text-center";
        }
    });
    activeBuyer = '';
    document.querySelectorAll('.buyer-tab').forEach(t => t.classList.remove('active'));
    currentPage = 1;
    renderMainTable();
}

function searchGlobalBooking() {
    const searchVal = document.getElementById('globalBookingSearch').value.trim();
    if (!searchVal) {
        showToast('Please enter a Booking No. to search');
        return;
    }

    const searchLower = searchVal.toLowerCase();
    let found = false;
    let foundList = '';
    let foundBuyer = '';
    let foundBookingExact = '';

    // First find all matches
    const allItems = Object.values(groupedData);
    let matchedItems = allItems.filter(g => {
        const bookingLower = g.bookingNo.toLowerCase();
        return bookingLower === searchLower || bookingLower.includes(searchLower);
    });

    if (matchedItems.length > 0) {
        found = true;
        
        // Prioritize exact match if available
        let targetGroup = matchedItems.find(g => g.bookingNo.toLowerCase() === searchLower);
        if (!targetGroup) {
            targetGroup = matchedItems[0]; // Fallback to the first partial match
        }
        
        foundBookingExact = targetGroup.bookingNo;
        
        // Determine which list it belongs to
        const status = (targetGroup.generalInfo && targetGroup.generalInfo.OrderStatus) ? targetGroup.generalInfo.OrderStatus : 'On Process';
        if (status === 'Completed') {
            foundList = 'All';
        } else if (targetGroup.isPending) {
            foundList = 'Pending';
        } else if (targetGroup.isConfirm) {
            foundList = 'Confirm';
        } else if (targetGroup.isTentative) {
            foundList = 'Tentative';
        }
        
        // Get buyer - uppercase normalize
        if (targetGroup.buyers && targetGroup.buyers.size > 0) {
            foundBuyer = Array.from(targetGroup.buyers)[0].toUpperCase().trim();
        }
    }

    if (!found) {
        showToast(`Booking "${searchVal}" not found in this department!`);
        return;
    }

    // First activate the correct list
    if (foundList) {
        activeMainTab = foundList;
        const tabs = ['Pending', 'Confirm', 'Tentative', 'All'];
        tabs.forEach(t => {
            const btn = document.getElementById('btn' + t);
            if (btn) {
                if (t === foundList) btn.className = "bg-[#313644] text-white px-3 sm:px-6 py-1.5 sm:py-2 font-bold rounded-sm cursor-pointer shadow-sm uppercase tracking-wide transition-colors text-[10px] sm:text-[13px] flex-1 sm:flex-none text-center";
                else btn.className = "bg-white text-gray-800 border border-gray-300 px-3 sm:px-6 py-1.5 sm:py-2 font-bold rounded-sm cursor-pointer shadow-sm hover:bg-gray-50 uppercase tracking-wide transition-colors text-[10px] sm:text-[13px] flex-1 sm:flex-none text-center";
            }
        });
    }

    // Set buyer filter
    if (foundBuyer) {
        activeBuyer = foundBuyer;
    }
    
    // Get filtered data to calculate correct page
    let data = Object.values(groupedData).filter(g => g.mergedItems && g.mergedItems.length > 0);
    
    // Filter by status
    data = data.filter(g => {
        const status = (g.generalInfo && g.generalInfo.OrderStatus) ? g.generalInfo.OrderStatus : 'On Process';
        if (activeMainTab === 'All') return status === 'Completed';
        return status !== 'Completed';
    });
    
    // Filter by main tab
    if (activeMainTab === 'Pending') data = data.filter(d => d.isPending);
    else if (activeMainTab === 'Confirm') data = data.filter(d => d.isConfirm);
    else if (activeMainTab === 'Tentative') data = data.filter(d => d.isTentative);
    
    // Filter by buyer
    if (activeBuyer !== '') {
        const searchB = activeBuyer.toLowerCase().trim();
        data = data.filter(d => {
            const bArr = Array.from(d.buyers).map(x => x.toLowerCase().trim());
            return bArr.includes(searchB);
        });
    }
    
    // Find which page the booking is on
    let foundIndex = -1;
    data.forEach((d, idx) => {
        if (d.bookingNo === foundBookingExact || d.bookingNo.toLowerCase() === searchLower) {
            foundIndex = idx;
        }
    });
    
    // Calculate correct page
    if (foundIndex >= 0) {
        currentPage = Math.floor(foundIndex / rowsPerPage) + 1;
    } else {
        currentPage = 1;
    }
    
    // Render table FIRST
    renderMainTable();
    
    // After table renders, FORCE buyer tab activation and highlight row
    setTimeout(() => {
        // FORCE buyer tabs visual update (re-render all tabs with correct active state)
        const buyerTabs = document.querySelectorAll('.buyer-tab');
        buyerTabs.forEach(tab => {
            const tabText = tab.innerText.toUpperCase().trim();
            if (tabText === foundBuyer.toUpperCase().trim()) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Highlight the matching row with yellow background
        const rows = document.querySelectorAll('#mainTableBody tr');
        let highlighted = false;
        rows.forEach(row => {
            const bookingCell = row.querySelector('td:nth-child(2)');
            if (bookingCell) {
                const cellText = bookingCell.innerText.trim();
                if (cellText === foundBookingExact || cellText.toLowerCase() === searchLower) {
                    // Apply yellow highlight
                    row.style.backgroundColor = '#fef08a';
                    row.style.transition = 'background-color 0.3s';
                    
                    // Scroll into view
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    highlighted = true;
                    
                    // Remove highlight after 4 seconds
                    setTimeout(() => {
                        row.style.backgroundColor = '';
                    }, 4000);
                }
            }
        });
        
        if (highlighted) {
            showToast(`✓ Found "${foundBookingExact}" in ${foundList} List under ${foundBuyer} buyer!`);
        } else {
            showToast(`Booking found in database but not displayed. Try different filters.`);
        }
    }, 500);
}

function clearGlobalSearch() {
    document.getElementById('globalBookingSearch').value = '';
    activateMainTab('Pending');
    showToast('Search cleared. Showing Pending List.');
}

async function fetchAndProcessData(isSilent = false) {
    if (!isSilent) {
        document.getElementById('loadingData').classList.remove('hidden');
    }

    const currentDept = activeTabId.replace('_report', '');

    try {
        const res = await fetch(`https://abir-backend-api.onrender.com/api/files/all`).catch(e => { console.error(e); return null; });

        let allFiles = [];
        if (res && res.ok) {
            allFiles = await res.json();
        }

        const targetCategory = currentDept === 'yd' ? 'YD' : currentDept.charAt(0).toUpperCase() + currentDept.slice(1);
        const generalFilesRaw = allFiles.filter(f => f.category === 'General' || !f.category);
        const deptFilesRaw = allFiles.filter(f => f.category === targetCategory);

        generalFilesRaw.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        deptFilesRaw.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        
        const getLatestFiles = (files) => {
            const latestFilesMap = new Map();
            files.forEach(f => latestFilesMap.set(f.originalName, f));
            return Array.from(latestFilesMap.values());
        };

        const generalFiles = getLatestFiles(generalFilesRaw);
        const deptFiles = getLatestFiles(deptFilesRaw);

        const currentGeneralFilesStr = JSON.stringify(generalFiles.map(f => ({ n: f.originalName, d: f.createdAt })));
        const currentDeptFilesStr = JSON.stringify(deptFiles.map(f => ({ n: f.originalName, d: f.createdAt })));

        const hasDeptFile = deptFiles.length > 0;

        const readFiles = async (fileList) => {
            let raw = [];
            for (let i = 0; i < fileList.length; i++) {
                let file = fileList[i];
                try {
                    const encodedName = encodeURIComponent(file.savedName);
                    const fRes = await fetch(`https://abir-backend-api.onrender.com/uploads/${encodedName}`);
                    if (!fRes.ok) {
                        console.error(`Failed to fetch file: ${file.originalName}`);
                        continue;
                    }
                    const ab = await fRes.arrayBuffer();
                    const wb = XLSX.read(ab, { type: 'array' });
                    let sheetData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
                    sheetData.forEach(row => {
                        row._fileIndex = i;
                        raw.push(row);
                    });
                } catch (e) { console.error("File read err:", e); }
            }
            return raw;
        };

        let generalRawData = [];
        if (currentGeneralFilesStr === cachedGeneralFilesStr && cachedGeneralRawData.length > 0) {
            generalRawData = cachedGeneralRawData;
        } else {
            generalRawData = await readFiles(generalFiles);
            cachedGeneralRawData = generalRawData;
            cachedGeneralFilesStr = currentGeneralFilesStr;
        }

        let deptRawData = [];
        if (currentDeptFilesStr === cachedDeptFilesStr[currentDept] && cachedDeptRawData[currentDept] && cachedDeptRawData[currentDept].length > 0) {
            deptRawData = cachedDeptRawData[currentDept];
        } else {
            deptRawData = await readFiles(deptFiles);
            cachedDeptRawData[currentDept] = deptRawData;
            cachedDeptFilesStr[currentDept] = currentDeptFilesStr;
        }

        groupedData = {};

        const initGroup = (bNo) => {
            let bNoStr = String(bNo);
            if (!groupedData[bNoStr]) {
                groupedData[bNoStr] = {
                    bookingNo: bNoStr.startsWith('Unknown_Booking_') ? 'N/A' : bNoStr,
                    buyers: new Set(),
                    generalInfo: {},
                    excelItems: [],
                    dbData: null,
                    status: 'N/A'
                };
            }
        };

        generalRawData.forEach((row, index) => {
            let bNoVal = getColData(row, ['BookingNo', 'OrderNo', 'EWO', 'Booking', 'Order No', 'Booking No']);
            let bNo = String(bNoVal !== '' ? bNoVal : 'Unknown_Booking_' + index).trim();

            let buyerVal = getColData(row, ['Buyer', 'BuyerName', 'Customer']);
            let buyer = String(buyerVal).trim().toUpperCase().replace(/\s+/g, ' ');

            initGroup(bNo);
            if (buyer && buyer !== 'UNDEFINED' && buyer !== 'N/A' && buyer !== 'GENERAL') {
                groupedData[bNo].buyers.add(buyer);
            }

            let dateVal = getColData(row, ['BookingReceiveDate', 'BookingDate', 'Date']);
            if (dateVal) groupedData[bNo].bookingDate = formatExcelDate(dateVal);

            let teamVal = getColData(row, ['BuyerTeam', 'Team']);
            if (teamVal) groupedData[bNo].buyerTeam = String(teamVal);

            let statusVal = getColData(row, ['Status']);
            if (statusVal) groupedData[bNo].status = String(statusVal);

            let ewo = getColData(row, ['OrderNo', 'EWO']);
            let orderQty = getColData(row, ['RequiredQtyKgs', 'Qty', 'Order Qty']);
            let bUnit = getColData(row, ['BookingUnit']);
            let unit = getColData(row, ['Unit']);
            let finalConf = getColData(row, ['FinalConfirmation', 'Status']);
            let eventDay = getColData(row, ['EventDay']);
            let ship1 = formatExcelDate(getColData(row, ['1stShipmentDate', 'Ship1']));
            let shipLast = formatExcelDate(getColData(row, ['LastShipmentDate', 'ShipLast']));
            let yarnDate = formatExcelDate(getColData(row, ['TAYarnDate', 'YarnDate']));
            let deliStart = formatExcelDate(getColData(row, ['TADeliStart', 'DeliStart']));
            let deliEnd = formatExcelDate(getColData(row, ['TADeliEnd', 'DeliEnd']));
            let knitStart = formatExcelDate(getColData(row, ['TAKnittingStart', 'KnitStart']));
            let knitEnd = formatExcelDate(getColData(row, ['TAKnittingEnd', 'KnitEnd']));
            let dyeStart = formatExcelDate(getColData(row, ['TADyeingStart', 'DyeStart']));
            let dyeEnd = formatExcelDate(getColData(row, ['TADyeingEnd', 'DyeEnd']));
            let fabNotes = getColData(row, ['FabricNotes', 'Notes']);

            if (Object.keys(groupedData[bNo].generalInfo).length === 0) {
                groupedData[bNo].generalInfo = { EWO: ewo, OrderQty: orderQty, BookingUnit: bUnit, Unit: unit, FinalConf: finalConf, EventDay: eventDay, Ship1: ship1, ShipLast: shipLast, YarnDate: yarnDate, DeliStart: deliStart, DeliEnd: deliEnd, KnitStart: knitStart, KnitEnd: knitEnd, DyeStart: dyeStart, DyeEnd: dyeEnd, FabNotes: fabNotes };
            } else {
                if (ewo) groupedData[bNo].generalInfo.EWO = ewo;
                if (orderQty) groupedData[bNo].generalInfo.OrderQty = orderQty;
                if (bUnit) groupedData[bNo].generalInfo.BookingUnit = bUnit;
                if (unit) groupedData[bNo].generalInfo.Unit = unit;
                if (finalConf) groupedData[bNo].generalInfo.FinalConf = finalConf;
                if (eventDay) groupedData[bNo].generalInfo.EventDay = eventDay;
                if (ship1 !== 'N/A') groupedData[bNo].generalInfo.Ship1 = ship1;
                if (shipLast !== 'N/A') groupedData[bNo].generalInfo.ShipLast = shipLast;
                if (yarnDate !== 'N/A') groupedData[bNo].generalInfo.YarnDate = yarnDate;
                if (deliStart !== 'N/A') groupedData[bNo].generalInfo.DeliStart = deliStart;
                if (deliEnd !== 'N/A') groupedData[bNo].generalInfo.DeliEnd = deliEnd;
                if (knitStart !== 'N/A') groupedData[bNo].generalInfo.KnitStart = knitStart;
                if (knitEnd !== 'N/A') groupedData[bNo].generalInfo.KnitEnd = knitEnd;
                if (dyeStart !== 'N/A') groupedData[bNo].generalInfo.DyeStart = dyeStart;
                if (dyeEnd !== 'N/A') groupedData[bNo].generalInfo.DyeEnd = dyeEnd;
                if (fabNotes) groupedData[bNo].generalInfo.FabNotes = fabNotes;
            }
        });

        deptRawData.forEach((row, index) => {
            let bNoVal = getColData(row, ['BookingNo', 'OrderNo', 'EWO', 'Booking', 'Order No', 'Booking No']);
            let bNo = String(bNoVal !== '' ? bNoVal : 'Unknown_Booking_' + index).trim();
            
            initGroup(bNo);
            
            if (groupedData[bNo]) {
                let buyerVal = getColData(row, ['Buyer', 'BuyerName', 'Customer']);
                let buyer = String(buyerVal).trim().toUpperCase().replace(/\s+/g, ' ');
                if (buyer && buyer !== 'UNDEFINED' && buyer !== 'N/A' && buyer !== 'GENERAL') {
                    groupedData[bNo].buyers.add(buyer);
                }

                groupedData[bNo].excelItems.push(row);
            }
        });

        try {
            let savedPlans = [];
            const orderNos = Object.keys(groupedData);
            
            if (orderNos.length > 0) {
                const datesRes = await fetch(`https://abir-backend-api.onrender.com/api/files/specific-dates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderNos: orderNos })
                });
                
                if (datesRes && datesRes.ok) {
                    savedPlans = await datesRes.json();
                }
            }

            if (savedPlans && savedPlans.length > 0) {
                savedPlans.forEach(plan => {
                    if (groupedData[plan.orderNo]) {
                        groupedData[plan.orderNo].dbData = plan;

                        groupedData[plan.orderNo].generalInfo.OrderStatus = plan[`${currentDept}Status`] || 'On Process';
                        groupedData[plan.orderNo].generalInfo.CompletedDate = plan[`${currentDept}CompletedDate`] || null;
                        
                        ['knitting', 'dyeing', 'finishing', 'delivery', 'yd'].forEach(dept => {
                            if (plan[dept] && Array.isArray(plan[dept])) {
                                plan[dept].forEach(item => {
                                    let rawB = item.itemData ? (item.itemData.Buyer || item.itemData.BuyerName || item.itemData.Customer || '') : '';
                                    let b = String(rawB).trim().toUpperCase().replace(/\s+/g, ' ');
                                    if (b && b !== 'UNDEFINED' && b !== 'N/A' && b !== 'GENERAL') {
                                        groupedData[plan.orderNo].buyers.add(b);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        } catch (e) { console.error("Error fetching db dates", e); }

        let preloadedPerms = null;
        try { preloadedPerms = JSON.parse(localStorage.getItem('permissions')); } catch(e){}

        // Apply Buyer Permissions globally
        Object.keys(groupedData).forEach(bNo => {
            if (!hasBuyerPermission(groupedData[bNo].buyers, preloadedPerms)) {
                delete groupedData[bNo];
            }
        });

        const globalBuyersList = new Set();

        Object.values(groupedData).forEach(group => {
            const mergedItemsMap = new Map();

            if (hasDeptFile) {
                const dbDepartmentItems = group.dbData && group.dbData[currentDept] ? group.dbData[currentDept] : [];

                const dbHistoryMap = new Map();
                let dbOccurrence = {};
                dbDepartmentItems.forEach(dbItem => {
                    if (dbItem.itemId) {
                        dbHistoryMap.set(dbItem.itemId, dbItem);
                    } else if (dbItem.itemData) {
                        let baseId = generateItemId(dbItem.itemData, currentDept);
                        let strictId = baseId;

                        if (currentDept === 'knitting' || currentDept === 'delivery' || currentDept === 'yd') {
                            dbOccurrence[baseId] = (dbOccurrence[baseId] || 0) + 1;
                            strictId = dbOccurrence[baseId] > 1 ? `${baseId}_${dbOccurrence[baseId]}` : baseId;
                        } else {
                            if (dbOccurrence[baseId]) return;
                            dbOccurrence[baseId] = 1;
                        }

                        dbItem.itemId = strictId;
                        dbHistoryMap.set(strictId, dbItem);
                    }
                });

                let excelOccurrence = {};
                let currentFileIndex = -1;

                let dyeingColorMap = new Map();
                if (currentDept === 'dyeing' && group.dbData && group.dbData.dyeing) {
                    group.dbData.dyeing.forEach(d => {
                        if (d.itemData && d.itemData.Color) {
                            dyeingColorMap.set(String(d.itemData.Color).trim().toLowerCase(), d);
                        }
                    });
                }

                group.excelItems.forEach(exItem => {
                    if (exItem._fileIndex !== currentFileIndex) {
                        excelOccurrence = {};

                        if (currentFileIndex !== -1) {
                            mergedItemsMap.clear();
                        }

                        currentFileIndex = exItem._fileIndex;
                    }

                    let dynamicItemData = {};
                    if (currentDept === 'knitting' || currentDept === 'delivery') {
                        dynamicItemData = {
                            OrderNo: getColData(exItem, ['BookingNo', 'OrderNo', 'EWO', 'Booking', 'Order No', 'Booking No']),
                            Color: getColData(exItem, ['Color', 'Colour', 'Fab Color']),
                            FabricConstruction: getColData(exItem, ['FabricConstruction', 'Construction', 'Fab Const', 'Fabric']),
                            GSM: getColData(exItem, ['GSM', 'G.S.M']),
                            RequiredQtyKgs: getColData(exItem, ['RequiredQtyKgs', 'Req Qty', 'Qty']),
                            Buyer: getColData(exItem, ['Buyer', 'BuyerName', 'Customer']),
                            Allowance: getColData(exItem, ['Allowance %', 'Allowance']),
                            YarnReq: getColData(exItem, ['Yarn req.', 'YarnReq']),
                            AllocatedQty: getColData(exItem, ['Allocated Qty', 'AllocatedQty']),
                            YarnBala: getColData(exItem, ['Yarn bala.', 'YarnBala']),
                            GreyReq: getColData(exItem, ['Grey Req.', 'GreyReq']),
                            KnitProd: getColData(exItem, ['Knit Prod.', 'KnitProd']),
                            KnitBala: getColData(exItem, ['Knit. Bala.', 'KnitBala']),
                            NetReceivedQtyKgs: getColData(exItem, ['NetReceivedQtyKgs', 'NetReceivedQty', 'ReceivedQty']),
                            NetDeliveryQtyKgs: getColData(exItem, ['NetDeliveryQtyKgs', 'NetDeliveryQty', 'DeliveryQty']),
                            DeliBal: getColData(exItem, ['Deli. Bal.', 'Deli Bal.', 'DeliBal', 'Delivery Balance']),
                            RFD: getColData(exItem, ['RFD']),
                            Slowmoving: getColData(exItem, ['Slowmoving']),
                            FFStock: getColData(exItem, ['FF Stock', 'FFStock'])
                        };

                        const deliBalStr = String(dynamicItemData.DeliBal || '').trim();
                        if (deliBalStr === '' || parseFloat(deliBalStr) === 0) {
                            const req = parseFloat(String(dynamicItemData.RequiredQtyKgs || '').replace(/,/g, '')) || 0;
                            const del = parseFloat(String(dynamicItemData.NetDeliveryQtyKgs || '').replace(/,/g, '')) || 0;
                            if (req > 0) {
                                dynamicItemData.DeliBal = req - del;
                            }
                        }
                    } else if (currentDept === 'yd') {
                        let ydBalanceKeys = [];
                        let typeKeys = [];
                        let dateKeys = [];
                        
                        for (let rk in exItem) {
                            let norm = rk.toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (norm === 'ydbalance' || norm === 'yddeliverybalance') ydBalanceKeys.push(rk);
                            if (norm === 'type' || norm === 'ydtype' || norm === 'yarntype' || norm === 'bookingtype') typeKeys.push(rk);
                            if (norm === 'date' || norm === 'ydbookingdate' || norm === 'bookingdate') dateKeys.push(rk);
                        }

                        let redBalanceVal = '';
                        let normalBalanceVal = '';
                        ydBalanceKeys.forEach(k => {
                            if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === 'yddeliverybalance') redBalanceVal = exItem[k];
                            else if (normalBalanceVal === '') normalBalanceVal = exItem[k];
                            else redBalanceVal = exItem[k]; 
                        });

                        dynamicItemData = {
                            OrderNo: getColData(exItem, ['BookingNo', 'OrderNo', 'EWO', 'Booking', 'Order No', 'Booking No']),
                            'Booking Type': typeKeys.length > 0 ? exItem[typeKeys[0]] : '',
                            YDB: getColData(exItem, ['YDB', 'YD B']),
                            'YD Booking Date': dateKeys.length > 0 ? formatExcelDate(exItem[dateKeys[0]]) : '',
                            'YD REQ.': getColData(exItem, ['YD REQ.', 'YD REQ', 'YD Req', 'Requirement']),
                            DYED: getColData(exItem, ['DYED', 'Dyed', 'Dye']),
                            'YD BALANCE': normalBalanceVal,
                            'YD Delivered': getColData(exItem, ['YD Delivered', 'Delivered', 'Delivery']),
                            'YD DELIVERY BALANCE': redBalanceVal !== '' ? redBalanceVal : getColData(exItem, ['YD Balance_1', 'YD Balance 2', 'Balance 2', 'YD Balance(Red)']),
                            'Barrier Qty.': getColData(exItem, ['Barrier Qty.', 'Barrier Qty', 'Barrier']),
                            'Workable Qty.': getColData(exItem, ['Workable Qty.', 'Workable Qty', 'Workable'])
                        };
                    } else {
                        dynamicItemData = {
                            OrderNo: getColData(exItem, ['BookingNo', 'OrderNo', 'EWO', 'Booking', 'Order No', 'Booking No']),
                            Color: getColData(exItem, ['Color', 'Colour', 'Fab Color']),
                            RequiredQtyKgs: getColData(exItem, ['RequiredQtyKgs', 'Req Qty', 'Qty']),
                            Buyer: getColData(exItem, ['Buyer', 'BuyerName', 'Customer']),
                            Unit: getColData(exItem, ['Unit']),
                            ProcessName: getColData(exItem, ['Process Name', 'ProcessName', 'Process']),
                            GreyReq: getColData(exItem, ['Grey Req.', 'GreyReq']),
                            KnitProd: getColData(exItem, ['Knit Prod.', 'KnitProd']),
                            KnitBala: getColData(exItem, ['Knit. Bala.', 'KnitBala']),
                            BPQty: getColData(exItem, ['BP Qty', 'BPQty']),
                            DyeingProd: getColData(exItem, ['Dyeing Prod.', 'DyeingProd']),
                            DyeingBala: getColData(exItem, ['Dyeing Bala.', 'DyeingBala']),
                            NetReceivedQtyKgs: getColData(exItem, ['NetReceivedQtyKgs', 'NetReceivedQty', 'ReceivedQty']),
                            NetDeliveryQtyKgs: getColData(exItem, ['NetDeliveryQtyKgs', 'NetDeliveryQty', 'DeliveryQty']),
                            RFD: getColData(exItem, ['RFD']),
                            Slowmoving: getColData(exItem, ['Slowmoving']),
                            FFStock: getColData(exItem, ['FF Stock', 'FFStock'])
                        };
                    }

                    let baseId = generateItemId(dynamicItemData, currentDept);
                    excelOccurrence[baseId] = (excelOccurrence[baseId] || 0) + 1;
                    let strictId = excelOccurrence[baseId] > 1 ? `${baseId}_${excelOccurrence[baseId]}` : baseId;

                    if (dbHistoryMap.has(strictId)) {
                        const oldDbItem = dbHistoryMap.get(strictId);

                        if (oldDbItem.itemData) {
                            if (oldDbItem.itemData.Unit) dynamicItemData.Unit = oldDbItem.itemData.Unit;
                            if (oldDbItem.itemData.ProcessName) {
                                dynamicItemData.ProcessName = oldDbItem.itemData.ProcessName;
                                dynamicItemData['Process Name'] = oldDbItem.itemData.ProcessName;
                            }
                        }

                        mergedItemsMap.set(strictId, {
                            itemId: strictId,
                            itemData: dynamicItemData,
                            startDate: oldDbItem.startDate || '',
                            endDate: oldDbItem.endDate || '',
                            planType: oldDbItem.planType || '',
                            limitation: oldDbItem.limitation || '',
                            remarks: oldDbItem.remarks || '',
                            floorStartDate: oldDbItem.floorStartDate || '',
                            floorEndDate: oldDbItem.floorEndDate || '',
                            floorPlanType: oldDbItem.floorPlanType || '',
                            yarnDate: oldDbItem.yarnDate || '',
                            source: 'Both'
                        });
                    } else {
                        let recoveredDbItem = null;
                        if (currentDept === 'dyeing') {
                            const myColor = String(dynamicItemData.Color || '').trim().toLowerCase();
                            recoveredDbItem = dyeingColorMap.get(myColor);
                        }

                        if (recoveredDbItem) {
                            if (recoveredDbItem.itemData) {
                                if (recoveredDbItem.itemData.Unit) dynamicItemData.Unit = recoveredDbItem.itemData.Unit;
                                if (recoveredDbItem.itemData.ProcessName) {
                                    dynamicItemData.ProcessName = recoveredDbItem.itemData.ProcessName;
                                    dynamicItemData['Process Name'] = recoveredDbItem.itemData.ProcessName;
                                }
                            }
                            mergedItemsMap.set(strictId, {
                                itemId: strictId,
                                itemData: dynamicItemData,
                                startDate: recoveredDbItem.startDate || '',
                                endDate: recoveredDbItem.endDate || '',
                                planType: recoveredDbItem.planType || '',
                                limitation: recoveredDbItem.limitation || '',
                                remarks: recoveredDbItem.remarks || '',
                                floorStartDate: recoveredDbItem.floorStartDate || '',
                                floorEndDate: recoveredDbItem.floorEndDate || '',
                                floorPlanType: recoveredDbItem.floorPlanType || '',
                                yarnDate: recoveredDbItem.yarnDate || '',
                                source: 'Recovered'
                            });
                        } else {
                            mergedItemsMap.set(strictId, {
                                itemId: strictId, itemData: dynamicItemData,
                                startDate: '', endDate: '', planType: '', limitation: '', remarks: '',
                                floorStartDate: '', floorEndDate: '', floorPlanType: '', yarnDate: '', source: 'Excel'
                            });
                        }
                    }
                });
            }



            group.mergedItems = Array.from(mergedItemsMap.values());

            group.isPending = false;
            group.isConfirm = false;
            group.isTentative = false;

            let totalItems = group.mergedItems.length;

            if (totalItems > 0) {
                let hasSelect = false;
                let hasTentative = false;
                let confirmCount = 0;

                group.mergedItems.forEach(item => {
                    if (!item.planType || item.planType === '' || item.planType === 'Select') {
                        hasSelect = true;
                    } else if (item.planType === 'Tentative') {
                        hasTentative = true;
                    } else if (item.planType === 'Confirm') {
                        confirmCount++;
                    }

                    let rawBuyer = item.itemData ? (item.itemData.Buyer || item.itemData.BuyerName || item.itemData['Buyer Name(s)'] || item.itemData.Customer || '') : '';
                    let b = String(rawBuyer).trim().toUpperCase().replace(/\s+/g, ' ');
                    if (b && b !== 'UNDEFINED' && b !== 'N/A' && b !== 'GENERAL') {
                        group.buyers.add(b);
                    }
                });

                if (hasSelect) {
                    group.isPending = true;
                } else if (hasTentative) {
                    group.isTentative = true;
                } else if (confirmCount === totalItems) {
                    group.isConfirm = true;
                } else {
                    group.isPending = true;
                }
            }

            if (totalItems > 0) {
                if (group.buyers.size === 0) group.buyers.add('GENERAL');
                group.buyers.forEach(b => {
                    globalBuyersList.add(b);
                });
            }
        });

        if (isReportMode) {
            let hasConfirmData = false;
            let hasTentativeData = false;

            
            Object.values(groupedData).forEach(group => {
                if (group.isConfirm) hasConfirmData = true;
                if (group.isTentative) hasTentativeData = true;
            });

            const cardCombinedReport = document.getElementById('cardCombinedReport');
            const reportEmpty = document.getElementById('reportEmptyState');
            const cardsGrid = document.getElementById('reportCardsGrid');

            const titleEl = document.getElementById('combinedReportTitle');
            const btnTextEl = document.getElementById('combinedReportBtnText');
            
            if (titleEl) titleEl.innerText = `Updated ${currentDept.toUpperCase()} Report`;
            if (btnTextEl) btnTextEl.innerText = `Download ${currentDept.toUpperCase()} Data`;

            if (cardCombinedReport) {
                cardCombinedReport.style.display = (hasConfirmData || hasTentativeData) ? 'flex' : 'none';
            }

            if (!hasConfirmData && !hasTentativeData) {
                if (cardsGrid) cardsGrid.style.display = 'none';
                if (reportEmpty) {
                    reportEmpty.classList.remove('hidden');
                    reportEmpty.style.display = 'flex';
                }
            } else {
                if (cardsGrid) cardsGrid.style.display = 'grid';
                if (reportEmpty) {
                    reportEmpty.classList.add('hidden');
                    reportEmpty.style.display = 'none';
                }
            }
        }

        if (!isReportMode) {
            renderBuyerTabs(Array.from(globalBuyersList));
            currentPage = 1;
            renderMainTable();
        }

        if (!isSilent) {
            document.getElementById('loadingData').classList.add('hidden');
        }

        document.getElementById('loadingData').classList.add('hidden');
    } catch (e) {
        console.error("Error processing data:", e);
        if (!isSilent) {
            document.getElementById('loadingData').classList.add('hidden');
        }
    }
}

function exportCombinedReportToExcel() {
    if (!groupedData || Object.keys(groupedData).length === 0) {
        showToast("No data available to export!");
        return;
    }

    const currentDeptLower = activeTabId.replace('_report', '');
    const currentDept = currentDeptLower.toUpperCase();
    const isDeliveryDept = (currentDeptLower === 'delivery');
    let allRows = [];

    Object.values(groupedData).forEach(group => {
        if (group.mergedItems) {
            group.mergedItems.forEach(item => {
                if (item.planType === 'Confirm' || item.planType === 'Tentative') {

                    if (isDeliveryDept) {
                        // For delivery: build row with proper column order including knitting/dyeing plan data
                        let knitPlan = { start: '', end: '', type: '' };
                        let dyePlan = { start: '', end: '', type: '' };

                        if (group.dbData) {
                            let myColor = String(item.itemData.Color || '').trim().toLowerCase();
                            let myConst = String(item.itemData.FabricConstruction || '').trim().toLowerCase();
                            let myGSM = String(item.itemData.GSM || '').trim().toLowerCase();

                            // Knitting plan lookup: match by Color + FabricConstruction + GSM
                            if (group.dbData.knitting && Array.isArray(group.dbData.knitting)) {
                                const kItem = group.dbData.knitting.find(k => k.itemData
                                    && String(k.itemData.Color || '').trim().toLowerCase() === myColor
                                    && String(k.itemData.FabricConstruction || '').trim().toLowerCase() === myConst
                                    && String(k.itemData.GSM || '').trim().toLowerCase() === myGSM);
                                if (kItem) {
                                    knitPlan.start = kItem.startDate || '';
                                    knitPlan.end = kItem.endDate || '';
                                    knitPlan.type = kItem.planType || '';
                                }
                            }

                            // Dyeing plan lookup: match by Color
                            if (group.dbData.dyeing && Array.isArray(group.dbData.dyeing)) {
                                const dItem = group.dbData.dyeing.find(d => d.itemData
                                    && String(d.itemData.Color || '').trim().toLowerCase() === myColor);
                                if (dItem) {
                                    dyePlan.start = dItem.startDate || '';
                                    dyePlan.end = dItem.endDate || '';
                                    dyePlan.type = dItem.planType || '';
                                }
                            }
                        }

                        // Build ordered row for delivery
                        let rowData = {};
                        rowData['OrderNo'] = item.itemData.OrderNo || '';
                        rowData['Color'] = item.itemData.Color || '';
                        rowData['FabricConstruction'] = item.itemData.FabricConstruction || '';
                        rowData['GSM'] = item.itemData.GSM || '';
                        rowData['RequiredQtyKgs'] = item.itemData.RequiredQtyKgs || '';
                        rowData['Buyer'] = item.itemData.Buyer || '';
                        rowData['KnitBala'] = item.itemData.KnitBala || '';
                        rowData['NetReceivedQtyKgs'] = item.itemData.NetReceivedQtyKgs || '';
                        rowData['NetDeliveryQtyKgs'] = item.itemData.NetDeliveryQtyKgs || '';
                        rowData['RFD'] = item.itemData.RFD || '';
                        rowData['Slowmoving'] = item.itemData.Slowmoving || '';
                        rowData['FFStock'] = item.itemData.FFStock || '';

                        // NEW: Knitting plan columns
                        rowData['Knit Start Date'] = formatDateDisplay(knitPlan.start) || '';
                        rowData['Knit End Date'] = formatDateDisplay(knitPlan.end) || '';
                        rowData['Knit Plan Type'] = knitPlan.type || '';

                        // NEW: Dyeing plan columns
                        rowData['Dyeing Start Date'] = formatDateDisplay(dyePlan.start) || '';
                        rowData['Dyeing End Date'] = formatDateDisplay(dyePlan.end) || '';
                        rowData['Dyeing Plan Type'] = dyePlan.type || '';

                        // Delivery plan columns
                        rowData['Delivery Plan Start'] = formatDateDisplay(item.startDate) || '';
                        rowData['Delivery Plan End'] = formatDateDisplay(item.endDate) || '';
                        rowData['Delivery Plan Type'] = item.planType || '';

                        // NEW: Floor planning columns
                        rowData['Delivery Plan Start (Floor)'] = formatDateDisplay(item.floorStartDate) || '';
                        rowData['Delivery Plan End (Floor)'] = formatDateDisplay(item.floorEndDate) || '';
                        rowData['Delivery Plan Type (Floor)'] = item.floorPlanType || '';

                        rowData['Limitation'] = item.limitation || '';
                        rowData['Remarks'] = item.remarks || '';

                        allRows.push(rowData);
                    } else {
                        // For all other departments: keep original behavior
                        let rowData = { ...item.itemData };

                        if (currentDept === 'KNITTING') {
                            rowData['Yarn Date'] = item.yarnDate ? formatDateDisplay(item.yarnDate) : '';
                        }

                        rowData['Plan Start Date'] = formatDateDisplay(item.startDate) || '';
                        rowData['Plan End Date'] = formatDateDisplay(item.endDate) || '';
                        rowData['Plan Type'] = item.planType || '';
                        rowData['Limitation'] = item.limitation || '';
                        rowData['Remarks'] = item.remarks || '';

                        allRows.push(rowData);
                    }
                }
            });
        }
    });


    if (allRows.length === 0) {
        showToast(`No Confirm or Tentative data found to export for ${currentDept}!`);
        return;
    }

    showToast(`Generating Excel file for Updated ${currentDept} Report...`);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(allRows);
    
    // Apply special formatting
    formatExcelWorksheet(ws);
    
    XLSX.utils.book_append_sheet(wb, ws, `${currentDept}_Report`);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${currentDept}_Updated_Report_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);
}

function renderBuyerTabs(buyers) {
    const container = document.getElementById('buyerFilterContainer');
    container.innerHTML = '';
    buyers.forEach(b => {
        const btn = document.createElement('div');
        btn.className = `buyer-tab ${activeBuyer !== '' && activeBuyer.toLowerCase() === b.toLowerCase() ? 'active' : ''}`;
        btn.innerText = b; btn.onclick = () => activateBuyerFilter(b);
        container.appendChild(btn);
    });
}

function activateBuyerFilter(buyer) {
    activeBuyer = buyer;
    document.querySelectorAll('.buyer-tab').forEach(t => {
        if (t.innerText.toLowerCase() === buyer.toLowerCase()) t.classList.add('active');
        else t.classList.remove('active');
    });
    currentPage = 1; renderMainTable();
}

function filterByColumn(colIndex, val) { colFilters[colIndex] = String(val).toLowerCase().trim(); currentPage = 1; renderMainTable(); }

