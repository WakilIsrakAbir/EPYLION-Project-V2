// ==========================================================
// DETAILED VIEW: Order Detail Form
// ==========================================================
function openDetailedView(encodedBookingNo) {
    const bookingNo = decodeURIComponent(encodedBookingNo);
    let data = groupedData[bookingNo];
    if (!data) return;

    currentViewIndex = bookingNo;
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('detailedView').classList.remove('hidden');

    const setSafeVal = (id, val) => {
        document.getElementById(id).value = (val !== undefined && val !== null && val !== '') ? val : '';
    };

    setSafeVal('detEWO', data.generalInfo.EWO);
    setSafeVal('detBookingNo', data.bookingNo);
    setSafeVal('detBookingDate', data.bookingDate);
    setSafeVal('detBuyer', data.buyers.size > 0 ? Array.from(data.buyers).join(', ') : 'N/A');
    setSafeVal('detBuyerTeam', data.buyerTeam);
    setSafeVal('detOrderQty', data.generalInfo.OrderQty);
    setSafeVal('detBookingUnit', data.generalInfo.BookingUnit);
    setSafeVal('detUnit', data.generalInfo.Unit);
    setSafeVal('detFinalConf', data.generalInfo.FinalConf);
    setSafeVal('detOrderStatus', data.generalInfo.OrderStatus || 'On Process');
    setSafeVal('detEventDay', data.generalInfo.EventDay);
    setSafeVal('detShip1', data.generalInfo.Ship1);
    setSafeVal('detShipLast', data.generalInfo.ShipLast);
    setSafeVal('detYarnDate', data.generalInfo.YarnDate);
    setSafeVal('detDeliStart', data.generalInfo.DeliStart);
    setSafeVal('detDeliEnd', data.generalInfo.DeliEnd);
    setSafeVal('detKnitStart', data.generalInfo.KnitStart);
    setSafeVal('detKnitEnd', data.generalInfo.KnitEnd);
    setSafeVal('detDyeStart', data.generalInfo.DyeStart);
    setSafeVal('detDyeEnd', data.generalInfo.DyeEnd);
    setSafeVal('detFabNotes', data.generalInfo.FabNotes);

    const itemBody = document.getElementById('detFabricItemsBody');
    let itemHtml = '';
    const currentDept = activeTabId.replace('_report', '');

    data.mergedItems.forEach((item) => {
        let rowClass = "hover:bg-blue-50 border-b border-gray-200 transition-colors fabric-row bg-white";
        let encodedItemData = encodeURIComponent(JSON.stringify(item.itemData || {}));

        itemHtml += `<tr class="${rowClass}" data-itemid="${item.itemId}" data-itemdata="${encodedItemData}">`;

        if (currentDept === 'knitting') {
            
            const leftCols = ['Color', 'FabricConstruction', 'GSM'];
            leftCols.forEach(c => {
                let val = item.itemData[c];
                itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px]">${val !== undefined && val !== null ? val : ''}</td>`;
            });

            
            let yarnDateVal = item.yarnDate || '';
            itemHtml += `
                <td class="p-2 border-r border-gray-300 dark:border-[#2a3346] text-center bg-yellow-50 dark:bg-yellow-900/10"><input type="date" class="row-yarn-date p-1 border border-yellow-300 dark:border-yellow-700/50 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none dark:bg-[#151921] dark:text-yellow-100" value="${yarnDateVal}" onchange="autoFillYarnDate(this)"></td>
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-start-date p-1 border border-gray-300 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none" value="${item.startDate || ''}" onchange="enforceEndDateMin(this, 'row-end-date')"></td>
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-end-date p-1 border border-gray-300 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none" value="${item.endDate || ''}" ${item.startDate ? `min="${item.startDate}"` : ''} onchange="checkEndDateValid(this, 'row-start-date')"></td>
                <td class="p-2 border-r border-gray-300 text-center">
                    <select class="row-plan-type p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none cursor-pointer">
                        <option value="" ${!item.planType ? 'selected' : ''}>Select</option>
                        <option value="Confirm" ${item.planType === 'Confirm' ? 'selected' : ''}>Confirm</option>
                        <option value="Tentative" ${item.planType === 'Tentative' ? 'selected' : ''}>Tentative</option>
                    </select>
                </td>
                <td class="p-2 border-r border-gray-300"><input type="text" class="row-limitation w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Limitation" value="${item.limitation || ''}"></td>
                <td class="p-2 border-r border-gray-300"><input type="text" class="row-remarks w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Notes" value="${item.remarks || ''}"></td>
            `;

            
            const rightCols = ['GreyReq', 'KnitProd', 'KnitBala', 'YarnReq', 'AllocatedQty', 'YarnBala', 'Allowance'];
            rightCols.forEach(c => {
                let val = item.itemData[c];
                itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px]">${val !== undefined && val !== null ? val : ''}</td>`;
            });
        }
        else if (currentDept === 'dyeing') {
            
            itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px]">${item.itemData['Color'] || ''}</td>`;

            let unitVal = item.itemData['Unit'] || '';
            itemHtml += `<td class="p-2 border-r border-gray-300 text-center min-w-[100px]">
                <select class="row-unit p-1 border border-gray-300 rounded text-[10px] w-full focus:border-blue-500 outline-none cursor-pointer">
                    <option value="" ${!unitVal ? 'selected' : ''}>Select</option>
                    <option value="EFL" ${unitVal === 'EFL' ? 'selected' : ''}>EFL</option>
                    <option value="EKL" ${unitVal === 'EKL' ? 'selected' : ''}>EKL</option>
                    <option value="Ext" ${unitVal === 'Ext' ? 'selected' : ''}>Ext</option>
                    <option value="Outside" ${unitVal === 'Outside' ? 'selected' : ''}>Outside</option>
                </select>
            </td>`;

            let processVal = item.itemData['ProcessName'] || item.itemData['Process Name'] || '';
            itemHtml += `<td class="p-2 border-r border-gray-300 text-center min-w-[110px]">
                <select class="row-process p-1 border border-gray-300 rounded text-[10px] w-full focus:border-blue-500 outline-none cursor-pointer">
                    <option value="" ${!processVal ? 'selected' : ''}>Select</option>
                    <option value="Solid" ${processVal === 'Solid' ? 'selected' : ''}>Solid</option>
                    <option value="Dyeing Wash" ${processVal === 'Dyeing Wash' ? 'selected' : ''}>Dyeing Wash</option>
                    <option value="HTR" ${processVal === 'HTR' ? 'selected' : ''}>HTR</option>
                    <option value="Pluvia" ${processVal === 'Pluvia' ? 'selected' : ''}>Pluvia</option>
                    <option value="SB" ${processVal === 'SB' ? 'selected' : ''}>SB</option>
                    <option value="WH" ${processVal === 'WH' ? 'selected' : ''}>WH</option>
                    <option value="DF" ${processVal === 'DF' ? 'selected' : ''}>DF</option>
                </select>
            </td>`;

            let knitPlan = { start: '', end: '', type: '', limit: '', remark: '' };
            if (data.dbData && data.dbData.knitting) {
                let myColor = String(item.itemData.Color || '').trim().toLowerCase();
                const kItem = data.dbData.knitting.find(k => k.itemData && String(k.itemData.Color || '').trim().toLowerCase() === myColor);
                if (kItem) {
                    knitPlan.start = kItem.startDate || '';
                    knitPlan.end = kItem.endDate || '';
                    knitPlan.type = kItem.planType || '';
                    knitPlan.limit = kItem.limitation || '';
                    knitPlan.remark = kItem.remarks || '';
                }
            }

            itemHtml += `
                <td class="p-2 border-r border-gray-300 text-center text-gray-500 bg-gray-50 min-w-[80px] knit-start" data-val="${knitPlan.start}">${formatDateDisplay(knitPlan.start)}</td>
                <td class="p-2 border-r border-gray-300 text-center text-gray-500 bg-gray-50 min-w-[80px] knit-end" data-val="${knitPlan.end}">${formatDateDisplay(knitPlan.end)}</td>
                <td class="p-2 border-r border-gray-300 text-center text-gray-500 bg-gray-50 min-w-[80px] font-semibold knit-type" data-val="${knitPlan.type}">${knitPlan.type}</td>
                <td class="p-2 border-r border-gray-300 text-center text-gray-500 bg-gray-50 min-w-[100px]">${knitPlan.limit}</td>
                <td class="p-2 border-r border-gray-300 text-center text-gray-500 bg-gray-50 min-w-[100px]">${knitPlan.remark}</td>
            `;

            itemHtml += `
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-start-date p-1 border border-gray-300 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none" value="${item.startDate || ''}" onchange="enforceEndDateMin(this, 'row-end-date')"></td>
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-end-date p-1 border border-gray-300 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none" value="${item.endDate || ''}" ${item.startDate ? `min="${item.startDate}"` : ''} onchange="checkEndDateValid(this, 'row-start-date')"></td>
                <td class="p-2 border-r border-gray-300 text-center">
                    <select class="row-plan-type p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none cursor-pointer">
                        <option value="" ${!item.planType ? 'selected' : ''}>Select</option>
                        <option value="Confirm" ${item.planType === 'Confirm' ? 'selected' : ''}>Confirm</option>
                        <option value="Tentative" ${item.planType === 'Tentative' ? 'selected' : ''}>Tentative</option>
                    </select>
                </td>
                <td class="p-2 border-r border-gray-300"><input type="text" class="row-limitation w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Limitation" value="${item.limitation || ''}"></td>
                <td class="p-2 border-r border-gray-300"><input type="text" class="row-remarks w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Notes" value="${item.remarks || ''}"></td>
            `;

            const numCols = ['BPQty', 'DyeingProd', 'DyeingBala', 'KnitProd', 'KnitBala'];
            numCols.forEach(c => {
                let val = item.itemData[c];
                itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px]">${val !== undefined && val !== null ? val : ''}</td>`;
            });
        }
        else if (currentDept === 'delivery') {
            itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px]">${item.itemData['Color'] || ''}</td>`;
            itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px]">${item.itemData['FabricConstruction'] || ''}</td>`;
            itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px]">${item.itemData['GSM'] || ''}</td>`;

            let knitPlan = { start: '', end: '' };
            let dyePlan = { start: '', end: '', type: '' };

            if (data.dbData) {
                let myColor = String(item.itemData.Color || '').trim().toLowerCase();
                let myConst = String(item.itemData.FabricConstruction || '').trim().toLowerCase();

                if (data.dbData.knitting) {
                    const kItem = data.dbData.knitting.find(k => k.itemData && String(k.itemData.Color || '').trim().toLowerCase() === myColor && String(k.itemData.FabricConstruction || '').trim().toLowerCase() === myConst);
                    if (kItem) { knitPlan.start = kItem.startDate || ''; knitPlan.end = kItem.endDate || ''; }
                }
                if (data.dbData.dyeing) {
                    const dItem = data.dbData.dyeing.find(d => d.itemData && String(d.itemData.Color || '').trim().toLowerCase() === myColor);
                    if (dItem) { dyePlan.start = dItem.startDate || ''; dyePlan.end = dItem.endDate || ''; dyePlan.type = dItem.planType || ''; }
                }
            }

            // Generate Floor Dates
            let floorStart = item.floorStartDate || '';
            let floorEnd = item.floorEndDate || '';
            let floorPlanType = item.floorPlanType || '';

            if (!item.floorStartDate && dyePlan.start) {
                let d = new Date(dyePlan.start);
                d.setDate(d.getDate() + 7);
                floorStart = d.toISOString().split('T')[0];
            }
            if (!item.floorEndDate && dyePlan.end) {
                let d = new Date(dyePlan.end);
                d.setDate(d.getDate() + 7);
                floorEnd = d.toISOString().split('T')[0];
            }
            if (!item.floorPlanType) {
                floorPlanType = 'Tentative';
            }

            itemHtml += `
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-floor-start p-1 border border-gray-300 rounded text-[10px] w-[110px] focus:border-blue-500 outline-none bg-blue-50" value="${floorStart}" onchange="enforceEndDateMin(this, 'row-floor-end')"></td>
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-floor-end p-1 border border-gray-300 rounded text-[10px] w-[110px] focus:border-blue-500 outline-none bg-blue-50" value="${floorEnd}" ${floorStart ? `min="${floorStart}"` : ''} onchange="checkEndDateValid(this, 'row-floor-start')"></td>
                <td class="p-2 border-r border-gray-300 text-center">
                    <select class="row-floor-plan p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none cursor-pointer">
                        <option value="" ${!floorPlanType ? 'selected' : ''}>Select</option>
                        <option value="Confirm" ${floorPlanType === 'Confirm' ? 'selected' : ''}>Confirm</option>
                        <option value="Tentative" ${floorPlanType === 'Tentative' ? 'selected' : ''}>Tentative</option>
                    </select>
                </td>
            `;

            itemHtml += `
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-start-date p-1 border border-gray-300 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none" value="${item.startDate || ''}" onchange="enforceEndDateMin(this, 'row-end-date')"></td>
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-end-date p-1 border border-gray-300 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none" value="${item.endDate || ''}" ${item.startDate ? `min="${item.startDate}"` : ''} onchange="checkEndDateValid(this, 'row-start-date')"></td>
                <td class="p-2 border-r border-gray-300 text-center">
                    <select class="row-plan-type p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none cursor-pointer">
                        <option value="" ${!item.planType ? 'selected' : ''}>Select</option>
                        <option value="Confirm" ${item.planType === 'Confirm' ? 'selected' : ''}>Confirm</option>
                        <option value="Tentative" ${item.planType === 'Tentative' ? 'selected' : ''}>Tentative</option>
                    </select>
                </td>
                <td class="p-2 border-r border-gray-300"><input type="text" class="row-limitation w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Limitation" value="${item.limitation || ''}"></td>
                <td class="p-2 border-r border-gray-300"><input type="text" class="row-remarks w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Notes" value="${item.remarks || ''}"></td>
            `;

            itemHtml += `
                <td class="p-2 border-r border-gray-300 text-center text-gray-500 bg-gray-50 min-w-[80px] dye-start" data-val="${dyePlan.start}">${formatDateDisplay(dyePlan.start)}</td>
                <td class="p-2 border-r border-gray-300 text-center text-gray-500 bg-gray-50 min-w-[80px] dye-end" data-val="${dyePlan.end}">${formatDateDisplay(dyePlan.end)}</td>
                <td class="p-2 border-r border-gray-300 text-center text-gray-500 bg-gray-50 min-w-[80px] font-semibold dye-type" data-val="${dyePlan.type}">${dyePlan.type}</td>
                <td class="p-2 border-r border-gray-300 text-center text-gray-500 bg-gray-50 min-w-[80px] knit-start" data-val="${knitPlan.start}">${formatDateDisplay(knitPlan.start)}</td>
                <td class="p-2 border-r border-gray-300 text-center text-gray-500 bg-gray-50 min-w-[80px] knit-end" data-val="${knitPlan.end}">${formatDateDisplay(knitPlan.end)}</td>
            `;

            const numCols = ['RequiredQtyKgs', 'NetReceivedQtyKgs', 'NetDeliveryQtyKgs', 'RFD', 'Slowmoving', 'FFStock'];
            numCols.forEach(c => {
                let val = item.itemData[c];
                itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px]">${val !== undefined && val !== null ? val : ''}</td>`;
            });
        }
        else if (currentDept === 'yd') {
            const leftCols = ['Booking Type', 'YDB', 'YD Booking Date'];
            leftCols.forEach(c => {
                let val = item.itemData[c];
                itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px]">${val !== undefined && val !== null ? val : ''}</td>`;
            });

            itemHtml += `
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-start-date p-1 border border-gray-300 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none" value="${item.startDate || ''}" onchange="enforceEndDateMin(this, 'row-end-date')"></td>
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-end-date p-1 border border-gray-300 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none" value="${item.endDate || ''}" ${item.startDate ? `min="${item.startDate}"` : ''} onchange="checkEndDateValid(this, 'row-start-date')"></td>
                <td class="p-2 border-r border-gray-300 text-center">
                    <select class="row-plan-type p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none cursor-pointer">
                        <option value="" ${!item.planType ? 'selected' : ''}>Select</option>
                        <option value="Confirm" ${item.planType === 'Confirm' ? 'selected' : ''}>Confirm</option>
                        <option value="Tentative" ${item.planType === 'Tentative' ? 'selected' : ''}>Tentative</option>
                    </select>
                </td>
                <td class="p-2 border-r border-gray-300"><input type="text" class="row-limitation w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Limitation" value="${item.limitation || ''}"></td>
                <td class="p-2 border-r border-gray-300"><input type="text" class="row-remarks w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Remarks" value="${item.remarks || ''}"></td>
            `;

            const rightCols = ['YD REQ.', 'DYED', 'YD BALANCE', 'YD Delivered', 'YD DELIVERY BALANCE', 'Barrier Qty.', 'Workable Qty.'];
            rightCols.forEach(c => {
                let val = item.itemData[c];
                let className = c === 'YD DELIVERY BALANCE' ? 'text-red-600 font-bold' : '';
                itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] ${className}">${val !== undefined && val !== null ? val : ''}</td>`;
            });
        }
        else {
            let cols = ['OrderNo', 'Color', 'RequiredQtyKgs', 'Buyer', 'Unit', 'ProcessName', 'GreyReq', 'KnitProd', 'KnitBala', 'BPQty', 'DyeingProd', 'DyeingBala', 'NetReceivedQtyKgs', 'NetDeliveryQtyKgs', 'RFD', 'Slowmoving', 'FFStock'];

            cols.forEach(c => {
                let val = item.itemData[c];
                itemHtml += `<td class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px]">${val !== undefined && val !== null ? val : ''}</td>`;
            });

            itemHtml += `
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-start-date p-1 border border-gray-300 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none" value="${item.startDate || ''}" onchange="enforceEndDateMin(this, 'row-end-date')"></td>
                <td class="p-2 border-r border-gray-300 text-center"><input type="date" class="row-end-date p-1 border border-gray-300 rounded text-[10px] w-[90px] focus:border-blue-500 outline-none" value="${item.endDate || ''}" ${item.startDate ? `min="${item.startDate}"` : ''} onchange="checkEndDateValid(this, 'row-start-date')"></td>
                <td class="p-2 border-r border-gray-300 text-center">
                    <select class="row-plan-type p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none cursor-pointer">
                        <option value="" ${!item.planType ? 'selected' : ''}>Select</option>
                        <option value="Confirm" ${item.planType === 'Confirm' ? 'selected' : ''}>Confirm</option>
                        <option value="Tentative" ${item.planType === 'Tentative' ? 'selected' : ''}>Tentative</option>
                    </select>
                </td>
                <td class="p-2 border-r border-gray-300"><input type="text" class="row-limitation w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Limitation" value="${item.limitation || ''}"></td>
                <td class="p-2 border-r border-gray-300"><input type="text" class="row-remarks w-full p-1 border border-gray-300 rounded text-[10px] focus:border-blue-500 outline-none" placeholder="Notes" value="${item.remarks || ''}"></td>
            `;
        }

        itemHtml += `</tr>`;
    });
    itemBody.innerHTML = itemHtml;

    const userRole = localStorage.getItem('role');
    const isAdmin = userRole ? (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'approver') : false;

    document.querySelectorAll('#detFabricItemsBody .fabric-row').forEach(row => {
        const planSelect = row.querySelector('.row-plan-type');
        const startInput = row.querySelector('.row-start-date');
        const endInput = row.querySelector('.row-end-date');

        const isConfirmed = planSelect && planSelect.value === 'Confirm';

        if (isConfirmed && !isAdmin) {
            if (planSelect) planSelect.disabled = true;
            if (startInput) startInput.disabled = true;
            if (endInput) endInput.disabled = true;
        }

        if (currentDept === 'delivery') {
            const dyeStart = row.querySelector('.dye-start')?.dataset.val;
            if (!dyeStart || dyeStart === '-' || dyeStart === '') {
                if (planSelect) planSelect.disabled = true;
                if (startInput) startInput.disabled = true;
                if (endInput) endInput.disabled = true;
            }
        }
    });

    if (currentDept === 'dyeing') {
        const unitInputs = document.querySelectorAll('#detFabricItemsBody .row-unit');
        const processInputs = document.querySelectorAll('#detFabricItemsBody .row-process');

        const checkAndToggleRow = (row) => {
            const unitVal = row.querySelector('.row-unit').value;
            const processVal = row.querySelector('.row-process').value;

            const isReady = unitVal !== '' && unitVal !== 'Select' && processVal !== '' && processVal !== 'Select';

            const inputsToToggle = row.querySelectorAll('.row-start-date, .row-end-date, .row-plan-type, .row-limitation, .row-remarks');

            inputsToToggle.forEach(inp => {
                if (!isReady) {
                    inp.disabled = true;
                    inp.classList.add('bg-gray-100', 'cursor-not-allowed');
                } else {
                    const planSelect = row.querySelector('.row-plan-type');
                    const isConfirmed = planSelect && planSelect.value === 'Confirm';

                    if (isConfirmed && !isAdmin && (inp.classList.contains('row-start-date') || inp.classList.contains('row-end-date') || inp.classList.contains('row-plan-type'))) {
                        inp.disabled = true;
                    } else {
                        inp.disabled = false;
                        inp.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
            });
        };

        document.querySelectorAll('#detFabricItemsBody .fabric-row').forEach(row => checkAndToggleRow(row));

        unitInputs.forEach((input, index) => {
            input.addEventListener('change', function () {
                const newVal = this.value;
                checkAndToggleRow(this.closest('tr'));
                if (index === 0) {
                    unitInputs.forEach((otherInput, idx) => {
                        if (idx !== 0) {
                            otherInput.value = newVal;
                            checkAndToggleRow(otherInput.closest('tr'));
                        }
                    });
                }
            });
        });

        processInputs.forEach((input, index) => {
            input.addEventListener('change', function () {
                const newVal = this.value;
                checkAndToggleRow(this.closest('tr'));
                if (index === 0) {
                    processInputs.forEach((otherInput, idx) => {
                        if (idx !== 0) {
                            otherInput.value = newVal;
                            checkAndToggleRow(otherInput.closest('tr'));
                        }
                    });
                }
            });
        });
    }

    
    if (currentDept === 'knitting' || currentDept === 'dyeing' || currentDept === 'delivery') {
        const startDateInputs = document.querySelectorAll('#detFabricItemsBody .row-start-date');
        const endDateInputs = document.querySelectorAll('#detFabricItemsBody .row-end-date');
        const planTypeInputs = document.querySelectorAll('#detFabricItemsBody .row-plan-type');

        const isValidStartDate = (row, newStart) => {
            const endVal = row.querySelector('.row-end-date').value;
            if (newStart && endVal && new Date(newStart) > new Date(endVal)) {
                showToast("Start Date cannot be greater than End Date!");
                return false;
            }
            if (currentDept === 'dyeing' && newStart) {
                const knitStart = row.querySelector('.knit-start').dataset.val;
                const knitEnd = row.querySelector('.knit-end').dataset.val;
                const knitType = row.querySelector('.knit-type').dataset.val;

                if (!knitStart && !knitEnd && (!knitType || knitType === 'Select' || knitType === '')) {
                    showToast("Cannot set Dyeing plan because Knitting plan is blank!");
                    return false;
                }

                if (knitStart && new Date(newStart).setHours(0, 0, 0, 0) < new Date(knitStart).setHours(0, 0, 0, 0)) {
                    showToast("Dyeing Start Date cannot be less than Knitting Start Date!");
                    return false;
                }
            }
            return true;
        };

        const isValidEndDate = (row, newEnd) => {
            const startVal = row.querySelector('.row-start-date').value;
            if (startVal && newEnd && new Date(startVal) > new Date(newEnd)) {
                showToast("Start Date cannot be greater than End Date!");
                return false;
            }
            if (currentDept === 'dyeing' && newEnd) {
                const knitStart = row.querySelector('.knit-start').dataset.val;
                const knitEnd = row.querySelector('.knit-end').dataset.val;
                const knitType = row.querySelector('.knit-type').dataset.val;

                if (!knitStart && !knitEnd && (!knitType || knitType === 'Select' || knitType === '')) {
                    showToast("Cannot set Dyeing plan because Knitting plan is blank!");
                    return false;
                }

                if (knitEnd && new Date(newEnd).setHours(0, 0, 0, 0) < new Date(knitEnd).setHours(0, 0, 0, 0)) {
                    showToast("Dyeing End Date cannot be less than Knitting End Date!");
                    return false;
                }
            }
            return true;
        };

        const isValidPlanType = (row, startVal, endVal, planTypeVal) => {
            if ((planTypeVal === 'Confirm' || planTypeVal === 'Tentative') && (!startVal || !endVal)) {
                showToast("Start and End dates are required to set Plan Type.");
                return false;
            }
            if (currentDept === 'dyeing' && planTypeVal) {
                const knitStart = row.querySelector('.knit-start').dataset.val;
                const knitEnd = row.querySelector('.knit-end').dataset.val;
                const knitType = String(row.querySelector('.knit-type').dataset.val || "").trim();

                if (!knitStart && !knitEnd && (!knitType || knitType === 'Select' || knitType === '')) {
                    showToast("Cannot set Dyeing plan because Knitting plan is blank!");
                    return false;
                }

                if (planTypeVal === 'Confirm' && knitType === 'Tentative') {
                    showToast("Cannot confirm Dyeing when Knitting is Tentative.");
                    return false;
                }

                if (planTypeVal === 'Confirm') {
                    const finalConf = document.getElementById('detFinalConf').value.trim().toLowerCase();

                    if (finalConf === 'no') {
                        showToast("Cannot confirm Dyeing because Final Confirmation is 'No'.");
                        return false;
                    }
                }
            }

            if (currentDept === 'delivery' && planTypeVal) {
                const dyeType = String(row.querySelector('.dye-type').dataset.val || "").trim();

                if (planTypeVal === 'Confirm' && (dyeType === 'Tentative' || dyeType === '-' || dyeType === '')) {
                    showToast("Cannot confirm Delivery when Dyeing is Tentative or blank.");
                    return false;
                }
            }

            return true;
        };

        startDateInputs.forEach((input, index) => {
            input.addEventListener('change', function () {
                const newVal = this.value;
                const row = this.closest('tr');
                const endVal = row.querySelector('.row-end-date').value;
                const planTypeInput = row.querySelector('.row-plan-type');

                if (!isValidStartDate(row, newVal)) { this.value = ""; return; }
                if (!isValidPlanType(row, newVal, endVal, planTypeInput.value)) planTypeInput.value = "";

                if (index === 0) {
                    startDateInputs.forEach((otherInput, idx) => {
                        if (idx !== 0) {
                            const otherRow = otherInput.closest('tr');
                            if (isValidStartDate(otherRow, newVal)) {
                                otherInput.value = newVal;
                                const otherPlan = otherRow.querySelector('.row-plan-type');
                                if (!isValidPlanType(otherRow, newVal, otherRow.querySelector('.row-end-date').value, otherPlan.value)) otherPlan.value = "";
                            } else {
                                otherInput.value = "";
                            }
                        }
                    });
                }
            });
        });

        endDateInputs.forEach((input, index) => {
            input.addEventListener('change', function () {
                const newVal = this.value;
                const row = this.closest('tr');
                const startVal = row.querySelector('.row-start-date').value;
                const planTypeInput = row.querySelector('.row-plan-type');

                if (!isValidEndDate(row, newVal)) { this.value = ""; return; }
                if (!isValidPlanType(row, startVal, newVal, planTypeInput.value)) planTypeInput.value = "";

                if (index === 0) {
                    endDateInputs.forEach((otherInput, idx) => {
                        if (idx !== 0) {
                            const otherRow = otherInput.closest('tr');
                            if (isValidEndDate(otherRow, newVal)) {
                                otherInput.value = newVal;
                                const otherPlan = otherRow.querySelector('.row-plan-type');
                                if (!isValidPlanType(otherRow, otherRow.querySelector('.row-start-date').value, newVal, otherPlan.value)) otherPlan.value = "";
                            } else {
                                otherInput.value = "";
                            }
                        }
                    });
                }
            });
        });

        planTypeInputs.forEach((input, index) => {
            input.addEventListener('change', function () {
                const newVal = this.value;
                const row = this.closest('tr');
                const startVal = row.querySelector('.row-start-date').value;
                const endVal = row.querySelector('.row-end-date').value;

                if (!isValidPlanType(row, startVal, endVal, newVal)) {
                    this.value = "";
                    this.selectedIndex = 0;
                    return;
                }

                if (index === 0) {
                    planTypeInputs.forEach((otherInput, idx) => {
                        if (idx !== 0) {
                            if (newVal === "") {
                                otherInput.value = "";
                                otherInput.selectedIndex = 0;
                            } else {
                                const otherRow = otherInput.closest('tr');
                                const otherStart = otherRow.querySelector('.row-start-date').value;
                                const otherEnd = otherRow.querySelector('.row-end-date').value;
                                if (isValidPlanType(otherRow, otherStart, otherEnd, newVal)) {
                                    otherInput.value = newVal;
                                } else {
                                    otherInput.value = "";
                                    otherInput.selectedIndex = 0;
                                }
                            }
                        }
                    });
                }
            });
        });

        const floorStartInputs = document.querySelectorAll('#detFabricItemsBody .row-floor-start');
        const floorEndInputs = document.querySelectorAll('#detFabricItemsBody .row-floor-end');
        const floorPlanInputs = document.querySelectorAll('#detFabricItemsBody .row-floor-plan');

        if (floorStartInputs.length > 0) {
            floorStartInputs.forEach((input, index) => {
                input.addEventListener('change', function () {
                    if (index === 0) {
                        const newVal = this.value;
                        floorStartInputs.forEach((otherInput, idx) => {
                            if (idx !== 0) otherInput.value = newVal;
                        });
                    }
                });
            });

            floorEndInputs.forEach((input, index) => {
                input.addEventListener('change', function () {
                    if (index === 0) {
                        const newVal = this.value;
                        floorEndInputs.forEach((otherInput, idx) => {
                            if (idx !== 0) otherInput.value = newVal;
                        });
                    }
                });
            });

            floorPlanInputs.forEach((input, index) => {
                input.addEventListener('change', function () {
                    if (index === 0) {
                        const newVal = this.value;
                        floorPlanInputs.forEach((otherInput, idx) => {
                            if (idx !== 0) otherInput.value = newVal;
                        });
                    }
                });
            });
        }
    }
}

function closeDetailedView() {
    document.getElementById('detailedView').classList.add('hidden');
    document.getElementById('listView').classList.remove('hidden');
    currentViewIndex = null;
}

