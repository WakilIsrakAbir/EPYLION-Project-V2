// ==========================================================
// ORDER STATUS: Order Status Page
// ==========================================================

    let osCurrentPage = 1;
    let osRowsPerPage = 10;
    let osSearchQuery = '';
    let osGroupedData = {}; 
    let cachedOSFilesStr = "";
    let cachedOSRawData = [];

    async function showOrderStatus() {
        localStorage.setItem('activePage', JSON.stringify({ page: 'orderStatus' }));

        hideAllCoreViews();
        
        const osSection = document.getElementById('orderStatusSection');
        if (osSection) osSection.classList.remove('hidden');

        document.getElementById('osDetailedView').classList.add('hidden');
        document.getElementById('osListView').classList.remove('hidden');
        document.getElementById('osSearchInput').value = '';

        osSearchQuery = '';
        osCurrentPage = 1;
        setActiveSidebarMenu('menu-order-status');
        closeSidebarMobile();

        const osLoader = document.getElementById('osLoadingSpinner');
        if (osLoader) osLoader.classList.remove('hidden');

        await fetchAllDataForOS();

        if (osLoader) osLoader.classList.add('hidden');

        renderOrderStatusTable();
    }

        const originalDashboard = showDashboardHome;
        showDashboardHome = function () {
            const os = document.getElementById('orderStatusSection');
            if (os) os.classList.add('hidden');
            const pva = document.getElementById('planVsActualView');
            if (pva) pva.classList.add('hidden');
            originalDashboard();
        };

        const originalDataMgt = showDataManagementView;
        showDataManagementView = function () {
            const os = document.getElementById('orderStatusSection');
            if (os) os.classList.add('hidden');
            const pva = document.getElementById('planVsActualView');
            if (pva) pva.classList.add('hidden');
            originalDataMgt();
        };

        const originalLoadMenu = loadMenuData;
        loadMenuData = async function (dept, title, mode) {
            const os = document.getElementById('orderStatusSection');
            if (os) os.classList.add('hidden');
            const pva = document.getElementById('planVsActualView');
            if (pva) pva.classList.add('hidden');
            await originalLoadMenu(dept, title, mode);
        };

    async function fetchAllDataForOS() {
        try {
            const res = await fetch(`https://abir-backend-api.onrender.com/api/files/all?t=${Date.now()}`);
            if (!res.ok) return;
            const allFiles = await res.json();

            allFiles.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const latestFilesMap = new Map();
            allFiles.forEach(f => latestFilesMap.set(f.originalName, f));
            const latestFiles = Array.from(latestFilesMap.values());

            const readFiles = async (fileList) => {
                let raw = [];
                for (let i = 0; i < fileList.length; i++) {
                    let file = fileList[i];
                    try {
                        const fRes = await fetch(`https://abir-backend-api.onrender.com/uploads/${file.savedName}?t=${Date.now()}`);
                        if (!fRes.ok) continue;
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

            const currentOSFilesStr = JSON.stringify(latestFiles.map(f => ({ n: f.originalName, d: f.createdAt })));
            
            let allRawData = [];
            if (currentOSFilesStr === cachedOSFilesStr && cachedOSRawData.length > 0) {
                allRawData = cachedOSRawData;
            } else {
                allRawData = await readFiles(latestFiles);
                cachedOSRawData = allRawData;
                cachedOSFilesStr = currentOSFilesStr;
            }

            osGroupedData = {};

            const initGroup = (bNo) => {
                let bNoStr = String(bNo);
                if (!osGroupedData[bNoStr]) {
                    osGroupedData[bNoStr] = {
                        bookingNo: bNoStr.startsWith('Unknown_Booking_') ? 'N/A' : bNoStr,
                        buyers: new Set(),
                        excelItems: [],
                        mergedItems: [],
                        dbData: null,
                        status: 'N/A'
                    };
                }
            };

            allRawData.forEach((row, index) => {
                let bNoVal = getColData(row, ['BookingNo', 'OrderNo', 'EWO', 'Booking', 'Order No', 'Booking No']);
                let bNo = String(bNoVal !== '' ? bNoVal : 'Unknown_Booking_' + index).trim();
                initGroup(bNo);

                let buyerVal = getColData(row, ['Buyer', 'BuyerName', 'Customer']);
                let buyer = String(buyerVal).trim().toUpperCase().replace(/\s+/g, ' ');
                if (buyer && buyer !== 'UNDEFINED' && buyer !== 'N/A' && buyer !== 'GENERAL') {
                    osGroupedData[bNo].buyers.add(buyer);
                }

                osGroupedData[bNo].excelItems.push(row);

                let color = getColData(row, ['Color', 'Colour', 'Fab Color']);
                let constr = getColData(row, ['FabricConstruction', 'Construction', 'Fab Const', 'Fabric']);

                if (color || constr) {
                    let existingItem = osGroupedData[bNo].mergedItems.find(m => {
                        let eColor = getColData(m.itemData, ['Color', 'Colour', 'Fab Color']);
                        let eConstr = getColData(m.itemData, ['FabricConstruction', 'Construction', 'Fab Const', 'Fabric']);
                        return String(eColor).trim().toLowerCase() === String(color).trim().toLowerCase() &&
                            String(eConstr).trim().toLowerCase() === String(constr).trim().toLowerCase();
                    });
                    if (!existingItem) {
                        osGroupedData[bNo].mergedItems.push({ itemData: { ...row } });
                    }
                    else {
                        Object.keys(row).forEach(k => {
                            if (row[k] !== undefined && row[k] !== '' && row[k] !== null) {
                                if (!existingItem.itemData[k] || existingItem.itemData[k] === '') {
                                    existingItem.itemData[k] = row[k];
                                } else {
                                    let existingNum = parseFloat(String(existingItem.itemData[k]).replace(/,/g, ''));
                                    let newNum = parseFloat(String(row[k]).replace(/,/g, ''));
                                    if (!isNaN(existingNum) && !isNaN(newNum)) {
                                        existingItem.itemData[k] = Math.max(existingNum, newNum); 
                                    }
                                }
                            }
                        });
                    }
                }
            });

            try {
                const datesRes = await fetch(`https://abir-backend-api.onrender.com/api/files/all-dates?t=${Date.now()}`);
                if (datesRes.ok) {
                    const savedPlans = await datesRes.json();
                    savedPlans.forEach(plan => {
                        if (osGroupedData[plan.orderNo]) {
                            osGroupedData[plan.orderNo].dbData = plan;
                        }
                    });
                }
            } catch (e) { }

            Object.keys(osGroupedData).forEach(bNo => {
                if (!hasBuyerPermission(osGroupedData[bNo].buyers)) {
                    delete osGroupedData[bNo];
                }
            });

        } catch (error) {
            console.error("Error fetching OS data:", error);
        }
    }

    function filterOSList() {
        osSearchQuery = document.getElementById('osSearchInput').value.trim().toLowerCase();
        osCurrentPage = 1;
        renderOrderStatusTable();
    }

    function changeOSRowsPerPage() {
        osRowsPerPage = parseInt(document.getElementById('osRowsPerPage').value);
        osCurrentPage = 1;
        renderOrderStatusTable();
    }

    function renderOrderStatusTable() {
        const tbody = document.getElementById('osTableBody');
        if (!tbody) return;

        if (!osGroupedData || Object.keys(osGroupedData).length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="p-10 text-center text-gray-500"><i class="fas fa-folder-open text-3xl mb-3 block text-gray-300"></i> No orders found. Please upload data.</td></tr>`;
            document.getElementById('osPageInfo').innerText = "Showing 0-0 of 0";
            document.getElementById('osPageButtons').innerHTML = '';
            return;
        }

        let dataList = Object.values(osGroupedData);
        if (osSearchQuery !== '') {
            dataList = dataList.filter(d => {
                const bNoMatch = String(d.bookingNo).toLowerCase().includes(osSearchQuery);
                const buyersArr = Array.from(d.buyers || []).map(b => b.toLowerCase());
                const buyerMatch = buyersArr.some(b => b.includes(osSearchQuery));
                return bNoMatch || buyerMatch;
            });
        }

        const total = dataList.length;
        if (total === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="p-10 text-center text-gray-500">No matching orders found.</td></tr>`;
            document.getElementById('osPageInfo').innerText = "Showing 0-0 of 0";
            document.getElementById('osPageButtons').innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(total / osRowsPerPage);
        if (osCurrentPage > totalPages) osCurrentPage = totalPages;
        const start = (osCurrentPage - 1) * osRowsPerPage;
        const pagedData = dataList.slice(start, start + osRowsPerPage);

        let html = '';
        pagedData.forEach(d => {
            const displayBuyer = d.buyers && d.buyers.size > 0 ? Array.from(d.buyers).join(', ') : 'Unknown';
            html += `
                <tr class="hover:bg-blue-50 dark:hover:bg-[#1e2330] border-b border-gray-100 dark:border-[#2a3346] transition-colors">
                    <td class="p-3 border-r border-gray-200 dark:border-[#2a3346] text-center">
                        <button onclick="viewOSDetails('${encodeURIComponent(d.bookingNo)}')" class="bg-blue-100 text-blue-600 px-3 py-1 rounded shadow-sm hover:bg-blue-600 hover:text-white transition"><i class="fas fa-eye"></i></button>
                    </td>
                    <td class="p-3 border-r border-gray-200 dark:border-[#2a3346] font-bold text-gray-800 dark:text-gray-200">${d.bookingNo}</td>
                    <td class="p-3 text-gray-600 dark:text-gray-400">${displayBuyer}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

        document.getElementById('osPageInfo').innerText = `Showing ${start + 1}-${Math.min(start + osRowsPerPage, total)} of ${total}`;
        const btnContainer = document.getElementById('osPageButtons');
        btnContainer.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = `px-3 py-1 border border-gray-300 rounded ${osCurrentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'}`;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left text-[10px]"></i>';
        prevBtn.onclick = () => { if (osCurrentPage > 1) { osCurrentPage--; renderOrderStatusTable(); } };

        const nextBtn = document.createElement('button');
        nextBtn.className = `px-3 py-1 border border-gray-300 rounded ${osCurrentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'}`;
        nextBtn.innerHTML = '<i class="fas fa-chevron-right text-[10px]"></i>';
        nextBtn.onclick = () => { if (osCurrentPage < totalPages) { osCurrentPage++; renderOrderStatusTable(); } };

        btnContainer.appendChild(prevBtn);
        btnContainer.appendChild(nextBtn);
    }

    window.viewOSDetails = async function(encodedBookingNo) {
        const bookingNo = decodeURIComponent(encodedBookingNo);
        
        const l = document.getElementById('osLoadingSpinner');
        if (l) l.classList.remove('hidden');
        try {
            await fetchAllDataForOS();
        } catch (e) {
            console.error("Failed to fetch latest OS data on JIT sync:", e);
        }
        if (l) l.classList.add('hidden');

        const orderData = osGroupedData[bookingNo];
        if (!orderData) return;

        document.getElementById('osListView').classList.add('hidden');
        document.getElementById('osDetailedView').classList.remove('hidden');

        let allocatedQty = 0, yarnBala = 0, knitProd = 0, knitBala = 0;
        let dyeingProd = 0, dyeingBala = 0;
        let netDeliveryQty = 0, slowMoving = 0, deliBal = 0, rfd = 0;

        const parseNumValue = (val) => {
            if (val === undefined || val === null || val === '-') return 0;
            const clean = String(val).replace(/,/g, '').trim();
            const num = parseFloat(clean);
            return isNaN(num) ? 0 : num;
        };

        let totalsPerFile = {};
        const rawItems = orderData.excelItems || [];

        rawItems.forEach(item => {
            let fIdx = item._fileIndex !== undefined ? item._fileIndex : 'unknown';
            if (!totalsPerFile[fIdx]) {
                totalsPerFile[fIdx] = { alloc: 0, yarn: 0, kProd: 0, kBala: 0, dProd: 0, dBala: 0, del: 0, slow: 0, deliBal: 0, rfd: 0 };
            }
            let t = totalsPerFile[fIdx];

            if (item['Allocated Qty '] !== undefined) t.alloc += parseNumValue(item['Allocated Qty ']);
            else if (item['AllocatedQty'] !== undefined) t.alloc += parseNumValue(item['AllocatedQty']);

            if (item['Yarn bala.'] !== undefined) t.yarn += parseNumValue(item['Yarn bala.']);
            else if (item['YarnBala'] !== undefined) t.yarn += parseNumValue(item['YarnBala']);

            if (item['Knit Prod.'] !== undefined) t.kProd += parseNumValue(item['Knit Prod.']);
            else if (item['KnitProd'] !== undefined) t.kProd += parseNumValue(item['KnitProd']);

            if (item['Knit. Bala.'] !== undefined) t.kBala += parseNumValue(item['Knit. Bala.']);
            else if (item['KnitBala'] !== undefined) t.kBala += parseNumValue(item['KnitBala']);

            if (item['Dyeing Prod.'] !== undefined) t.dProd += parseNumValue(item['Dyeing Prod.']);
            else if (item['DyeingProd'] !== undefined) t.dProd += parseNumValue(item['DyeingProd']);

            if (item['Dyeing Bala.'] !== undefined) t.dBala += parseNumValue(item['Dyeing Bala.']);
            else if (item['DyeingBala'] !== undefined) t.dBala += parseNumValue(item['DyeingBala']);

            if (item['NetDeliveryQtyKgs'] !== undefined) t.del += parseNumValue(item['NetDeliveryQtyKgs']);
            else if (item['NetDeliveryQty'] !== undefined) t.del += parseNumValue(item['NetDeliveryQty']);

            if (item['Slowmoving'] !== undefined) t.slow += parseNumValue(item['Slowmoving']);

            if (item['Deli. Bal.'] !== undefined) t.deliBal += parseNumValue(item['Deli. Bal.']);
            else if (item['DeliBal'] !== undefined) t.deliBal += parseNumValue(item['DeliBal']);

            if (item['RFD'] !== undefined) t.rfd += parseNumValue(item['RFD']);
        });

        Object.values(totalsPerFile).forEach(t => {
            allocatedQty = Math.max(allocatedQty, t.alloc);
            yarnBala = Math.max(yarnBala, t.yarn);
            knitProd = Math.max(knitProd, t.kProd);
            knitBala = Math.max(knitBala, t.kBala);
            dyeingProd = Math.max(dyeingProd, t.dProd);
            dyeingBala = Math.max(dyeingBala, t.dBala);
            netDeliveryQty = Math.max(netDeliveryQty, t.del);
            slowMoving = Math.max(slowMoving, t.slow);
            deliBal = Math.max(deliBal, t.deliBal);
            rfd = Math.max(rfd, t.rfd);
        });

        const displayBuyer = orderData.buyers && orderData.buyers.size > 0 ? Array.from(orderData.buyers).join(', ') : 'Unknown';
        const formatDisplay = (num) => num === 0 ? '0' : num.toLocaleString();

        if (document.getElementById('osRepBookingNo')) document.getElementById('osRepBookingNo').innerText = bookingNo;
        if (document.getElementById('osRepBuyer')) document.getElementById('osRepBuyer').innerText = displayBuyer;
        if (document.getElementById('osRepAllocatedQty')) document.getElementById('osRepAllocatedQty').innerText = formatDisplay(allocatedQty);
        if (document.getElementById('osRepYarnBala')) document.getElementById('osRepYarnBala').innerText = formatDisplay(yarnBala);
        if (document.getElementById('osRepKnitProd')) document.getElementById('osRepKnitProd').innerText = formatDisplay(knitProd);
        if (document.getElementById('osRepDyeingProd')) document.getElementById('osRepDyeingProd').innerText = formatDisplay(dyeingProd);
        if (document.getElementById('osRepNetDeliveryQty')) document.getElementById('osRepNetDeliveryQty').innerText = formatDisplay(netDeliveryQty);
        if (document.getElementById('osRepSlowmoving')) document.getElementById('osRepSlowmoving').innerText = formatDisplay(slowMoving);
        if (document.getElementById('osRepKnitBala')) document.getElementById('osRepKnitBala').innerText = formatDisplay(knitBala);
        if (document.getElementById('osRepDyeingBala')) document.getElementById('osRepDyeingBala').innerText = formatDisplay(dyeingBala);
        if (document.getElementById('osRepDeliBal')) document.getElementById('osRepDeliBal').innerText = formatDisplay(deliBal);
        if (document.getElementById('osRepRFD')) document.getElementById('osRepRFD').innerText = formatDisplay(rfd);

        const itemsBody = document.getElementById('osDetailedItemsBody');
        if (!itemsBody) return;
        itemsBody.innerHTML = '';

        if (orderData.dbData) {
            let knitStarts = [], knitEnds = [], knitTypes = new Set();
            let dyeStarts = [], dyeEnds = [], dyeTypes = new Set();
            let deliStarts = [], deliEnds = [], deliTypes = new Set();
            let deliFloorStarts = [], deliFloorEnds = [], deliFloorTypes = new Set();

            // Extract ALL knitting plan dates from dbData directly (not filtered by mergedItems)
            if (orderData.dbData.knitting && Array.isArray(orderData.dbData.knitting)) {
                orderData.dbData.knitting.forEach(kItem => {
                    if (kItem.startDate && kItem.startDate !== '' && kItem.startDate !== '-') knitStarts.push(kItem.startDate);
                    if (kItem.endDate && kItem.endDate !== '' && kItem.endDate !== '-') knitEnds.push(kItem.endDate);
                    if (kItem.planType) knitTypes.add(kItem.planType);
                });
            }

            // Extract ALL dyeing plan dates from dbData directly
            if (orderData.dbData.dyeing && Array.isArray(orderData.dbData.dyeing)) {
                orderData.dbData.dyeing.forEach(dItem => {
                    if (dItem.startDate && dItem.startDate !== '' && dItem.startDate !== '-') dyeStarts.push(dItem.startDate);
                    if (dItem.endDate && dItem.endDate !== '' && dItem.endDate !== '-') dyeEnds.push(dItem.endDate);
                    if (dItem.planType) dyeTypes.add(dItem.planType);
                });
            }

            // Extract ALL delivery plan dates from dbData directly
            if (orderData.dbData.delivery && Array.isArray(orderData.dbData.delivery)) {
                orderData.dbData.delivery.forEach(delItem => {
                    if (delItem.startDate && delItem.startDate !== '' && delItem.startDate !== '-') deliStarts.push(delItem.startDate);
                    if (delItem.endDate && delItem.endDate !== '' && delItem.endDate !== '-') deliEnds.push(delItem.endDate);
                    if (delItem.planType) deliTypes.add(delItem.planType);
                    if (delItem.floorStartDate && delItem.floorStartDate !== '' && delItem.floorStartDate !== '-') deliFloorStarts.push(delItem.floorStartDate);
                    if (delItem.floorEndDate && delItem.floorEndDate !== '' && delItem.floorEndDate !== '-') deliFloorEnds.push(delItem.floorEndDate);
                    if (delItem.floorPlanType) deliFloorTypes.add(delItem.floorPlanType);
                });
            }

            const getMinDate = (dates) => {
                const valid = dates.filter(d => d && d !== '-');
                if (!valid.length) return '-';
                valid.sort(); return valid[0];
            };
            const getMaxDate = (dates) => {
                const valid = dates.filter(d => d && d !== '-');
                if (!valid.length) return '-';
                valid.sort(); return valid[valid.length - 1];
            };
            const getAggType = (types) => {
                if (types.has('Tentative')) return 'Tentative';
                if (types.has('Confirm')) return 'Confirm';
                return '-';
            };

            let kStart = getMinDate(knitStarts), kEnd = getMaxDate(knitEnds), kType = getAggType(knitTypes);
            let dStart = getMinDate(dyeStarts), dEnd = getMaxDate(dyeEnds), dType = getAggType(dyeTypes);
            let delStart = getMinDate(deliStarts), delEnd = getMaxDate(deliEnds), delType = getAggType(deliTypes);
            let delFloorStart = getMinDate(deliFloorStarts), delFloorEnd = getMaxDate(deliFloorEnds), delFloorType = getAggType(deliFloorTypes);

            itemsBody.innerHTML = `
                <tr class="border-b border-gray-100 dark:border-[#2a3346] hover:bg-gray-50 dark:hover:bg-[#1e2330]">
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-blue-700 font-medium">${formatDateDisplay(kStart)}</td>
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-blue-700 font-medium">${formatDateDisplay(kEnd)}</td>
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-blue-900 font-bold bg-blue-50/30">${kType}</td>
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-green-700 font-medium">${formatDateDisplay(dStart)}</td>
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-green-700 font-medium">${formatDateDisplay(dEnd)}</td>
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-green-900 font-bold bg-green-50/30">${dType}</td>
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-orange-700 font-medium">${formatDateDisplay(delStart)}</td>
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-orange-700 font-medium">${formatDateDisplay(delEnd)}</td>
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-orange-900 font-bold bg-orange-50/30">${delType}</td>
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-orange-700 font-medium">${formatDateDisplay(delFloorStart)}</td>
                    <td class="px-2 py-2 border-r dark:border-[#2a3346] text-orange-700 font-medium">${formatDateDisplay(delFloorEnd)}</td>
                    <td class="px-2 py-2 text-orange-900 font-bold bg-orange-50/30">${delFloorType}</td>
                </tr>`;
        } else {
            itemsBody.innerHTML = `<tr><td colspan="12" class="p-4 text-gray-500">No planning data available for this order.</td></tr>`;
        }
    }

    function closeOSDetails() {
        document.getElementById('osDetailedView').classList.add('hidden');
        document.getElementById('osListView').classList.remove('hidden');
    }


        function downloadOSDetailedPDF() {
            const element = document.getElementById('osPrintableArea');
            const bookingNo = document.getElementById('osRepBookingNo').innerText || 'Details';

            const opt = {
                margin: 0.3,
                filename: `Order_Status_${bookingNo}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(opt).from(element).save();
        }

        function downloadOSDetailedExcel() {
            const bookingNo = document.getElementById('osRepBookingNo').innerText || 'N_A';

            const wsData = [
                ['Detailed Plan Status - Order Status'],
                [],
                ['Booking No.', bookingNo, 'Buyer', document.getElementById('osRepBuyer').innerText, 'Allocated Qty', document.getElementById('osRepAllocatedQty').innerText, 'Yarn bala.', document.getElementById('osRepYarnBala').innerText],
                ['Knit Prod.', document.getElementById('osRepKnitProd').innerText, 'Dyeing Prod.', document.getElementById('osRepDyeingProd').innerText, 'NetDeliveryQtyKgs', document.getElementById('osRepNetDeliveryQty').innerText, 'Slowmoving', document.getElementById('osRepSlowmoving').innerText],
                ['Knit. Bala.', document.getElementById('osRepKnitBala').innerText, 'Dyeing Bala.', document.getElementById('osRepDyeingBala').innerText, 'Deli. Bal.', document.getElementById('osRepDeliBal').innerText, 'RFD', document.getElementById('osRepRFD').innerText],
                [],
                ['Fabric Item Planning Breakdown Summary'],
                ['Knit Start', 'Knit End', 'Knit Type', 'Dye Start', 'Dye End', 'Dye Type', 'Deli Start', 'Deli End', 'Deli Type']
            ];

            const tbody = document.getElementById('osDetailedItemsBody');
            if (tbody) {
                const rows = tbody.getElementsByTagName('tr');
                for (let i = 0; i < rows.length; i++) {
                    let rowData = [];
                    const cells = rows[i].getElementsByTagName('td');
                    for (let j = 0; j < cells.length; j++) {
                        if (cells.length === 1) { rowData.push(cells[j].innerText); break; }
                        rowData.push(cells[j].innerText);
                    }
                    wsData.push(rowData);
                }
            }

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Detailed_Status");
            XLSX.writeFile(wb, `Order_Status_${bookingNo}.xlsx`);
        }
    
// ===== TRACKING REPORT FUNCTIONS =====

let reportActualDeptKey = '';

