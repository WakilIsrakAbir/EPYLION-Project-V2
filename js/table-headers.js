// ==========================================================
// TABLE HEADERS & DATE HELPERS
// ==========================================================
function renderDynamicHeaders() {
    document.querySelectorAll('.dynamic-th').forEach(e => e.remove());
    const currentDept = activeTabId.replace('_report', '');

    if (currentDept === 'knitting') {
        
        let leftCols = ['Color', 'FabricConstruction', 'GSM'];
        let rightCols = ['Grey Req.', 'Knit Prod.', 'Knit. Bala.', 'Yarn req.', 'Allocated Qty', 'Yarn bala.', 'Allowance %'];

        document.getElementById('planningHeaderText').innerText = 'Knitting Planning';
        document.getElementById('limitationHeaderText').innerText = 'Knitting Limitation';

        let leftHtml = leftCols.map(c => `<th class="p-2 border-r border-gray-300 dark:border-[#2a3346] text-center whitespace-normal min-w-[80px] dynamic-th">${c}</th>`).join('');
        leftHtml += `<th class="p-2 border-r border-gray-300 dark:border-[#2a3346] text-center whitespace-normal min-w-[90px] dynamic-th bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 font-bold">Yarn Date</th>`;
        let rightHtml = rightCols.map(c => `<th class="p-2 border-r border-gray-300 dark:border-[#2a3346] text-center whitespace-normal min-w-[80px] dynamic-th">${c}</th>`).join('');

        document.getElementById('planningHeaderText').insertAdjacentHTML('beforebegin', leftHtml);
        document.getElementById('mainHeaderRow').insertAdjacentHTML('beforeend', rightHtml);

        document.querySelector('#subHeaderRow th').insertAdjacentHTML('beforebegin', `<th class="border-r border-gray-300 dynamic-th" colspan="${leftCols.length + 1}"></th>`);
        document.querySelector('#subHeaderRow').insertAdjacentHTML('beforeend', `<th class="border-r border-gray-300 dynamic-th" colspan="${rightCols.length}"></th>`);
    }
    else if (currentDept === 'dyeing') {
        let leftCols = ['Color', 'Unit', 'Process Name'];

        let knitPlanningHtml = `
            <th class="p-2 border-r border-gray-300 text-center bg-gray-200 dynamic-th" colspan="2">Knitting Planning</th>
            <th class="p-2 border-r border-gray-300 text-center dynamic-th">Knitting Plan Type</th>
            <th class="p-2 border-r border-gray-300 text-center dynamic-th">Knitting Limitation</th>
            <th class="p-2 border-r border-gray-300 text-center dynamic-th">Remarks (Knitting)</th>
        `;

        let rightColsHtml = `
            <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">BP Qty</th>
            <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">Dyeing Prod.</th>
            <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">Dyeing Bala.</th>
            <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">Knit Prod.</th>
            <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">Knit. Bala.</th>
        `;

        document.getElementById('planningHeaderText').innerText = 'Dyeing Planning';
        document.getElementById('limitationHeaderText').innerText = 'Dyeing Limitation';

        let leftHtml = leftCols.map(c => `<th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">${c}</th>`).join('');

        document.getElementById('planningHeaderText').insertAdjacentHTML('beforebegin', leftHtml + knitPlanningHtml);
        document.getElementById('mainHeaderRow').insertAdjacentHTML('beforeend', rightColsHtml);

        let knitSubHtml = `
            <th class="p-1 border-r border-gray-300 text-center text-gray-600 dynamic-th">Start Date</th>
            <th class="p-1 border-r border-gray-300 text-center text-gray-600 dynamic-th">End Date</th>
            <th class="border-r border-gray-300 dynamic-th" colspan="3"></th>
        `;

        let dyeingSubHtml = `
            <th class="p-1 border-r border-gray-300 text-center text-gray-600 dynamic-th">Start Date</th>
            <th class="p-1 border-r border-gray-300 text-center text-gray-600 dynamic-th">End Date</th>
            <th class="border-r border-gray-300 dynamic-th" colspan="3"></th>
        `;

        let rightSubHtml = `
            <th class="border-r border-gray-300 dynamic-th" colspan="5"></th>
        `;

        document.querySelector('#subHeaderRow th').insertAdjacentHTML('beforebegin', `<th class="border-r border-gray-300 dynamic-th" colspan="${leftCols.length}"></th>` + knitSubHtml);
        document.querySelector('#subHeaderRow').insertAdjacentHTML('beforeend', rightSubHtml);
    }
    else if (currentDept === 'yd') {
        let leftCols = ['Booking Type', 'YDB', 'YD Booking Date'];
        let rightCols = ['YD REQ.', 'DYED', 'YD BALANCE', 'YD Delivered', 'YD DELIVERY BALANCE', 'Barrier Qty.', 'Workable Qty.'];

        document.getElementById('planningHeaderText').innerText = 'YD Planning';
        document.getElementById('limitationHeaderText').innerText = 'YD Remarks';

        let leftHtml = leftCols.map(c => `<th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">${c}</th>`).join('');
        let rightHtml = rightCols.map(c => {
            let className = c === 'YD DELIVERY BALANCE' ? 'text-red-600 font-bold' : '';
            return `<th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th ${className}">${c}</th>`;
        }).join('');

        document.getElementById('planningHeaderText').insertAdjacentHTML('beforebegin', leftHtml);
        document.getElementById('mainHeaderRow').insertAdjacentHTML('beforeend', rightHtml);

        document.querySelector('#subHeaderRow th').insertAdjacentHTML('beforebegin', `<th class="border-r border-gray-300 dynamic-th" colspan="${leftCols.length}"></th>`);
        document.querySelector('#subHeaderRow').insertAdjacentHTML('beforeend', `<th class="border-r border-gray-300 dynamic-th" colspan="${rightCols.length}"></th>`);
    }
    else {
        
        let mainCols = [];
        if (currentDept === 'delivery') {
            document.getElementById('planningHeaderText').innerText = 'Delivery Planning';
            document.getElementById('limitationHeaderText').innerText = 'Delivery Limitation';

            let leftHtml = `
                <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">Color</th>
                <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">FabricConstruction</th>
                <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">GSM</th>
                
                <th class="p-2 border-r border-gray-300 text-center bg-gray-200 dynamic-th" colspan="2">Delivery Planning (Floor)</th>
                <th class="p-2 border-r border-gray-300 text-center dynamic-th">Plan Type (Floor)</th>
            `;
            document.getElementById('planningHeaderText').insertAdjacentHTML('beforebegin', leftHtml);

            let rightHtml = `
                <th class="p-2 border-r border-gray-300 text-center bg-gray-200 dynamic-th" colspan="2">Dyeing Planning</th>
                <th class="p-2 border-r border-gray-300 text-center dynamic-th">Dyeing Plan Type</th>
                <th class="p-2 border-r border-gray-300 text-center bg-gray-200 dynamic-th" colspan="2">Knitting Planning</th>
                
                <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">RequiredQtyKgs</th>
                <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">NetReceivedQtyKgs</th>
                <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">NetDeliveryQtyKgs</th>
                <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">Deli. Bal.</th>
                <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">RFD</th>
                <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">Slowmoving</th>
                <th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">FF Stock</th>
            `;
            document.getElementById('mainHeaderRow').insertAdjacentHTML('beforeend', rightHtml);

            let floorSubHtml = `
                <th class="p-1 border-r border-gray-300 text-center text-gray-600 dynamic-th">Start Date</th>
                <th class="p-1 border-r border-gray-300 text-center text-gray-600 dynamic-th">End Date</th>
                <th class="border-r border-gray-300 dynamic-th"></th>
            `;
            let dyeingSubHtml = `
                <th class="p-1 border-r border-gray-300 text-center text-gray-600 dynamic-th">Start Date</th>
                <th class="p-1 border-r border-gray-300 text-center text-gray-600 dynamic-th">End Date</th>
                <th class="border-r border-gray-300 dynamic-th"></th>
            `;
            let knitSubHtml = `
                <th class="p-1 border-r border-gray-300 text-center text-gray-600 dynamic-th">Start Date</th>
                <th class="p-1 border-r border-gray-300 text-center text-gray-600 dynamic-th">End Date</th>
            `;

            document.querySelector('#subHeaderRow th').insertAdjacentHTML('beforebegin', `<th class="border-r border-gray-300 dynamic-th" colspan="3"></th>` + floorSubHtml);
            document.querySelector('#subHeaderRow').insertAdjacentHTML('beforeend', dyeingSubHtml + knitSubHtml + `<th class="border-r border-gray-300 dynamic-th" colspan="6"></th>`);

        } else {
            mainCols = ['OrderNo', 'Color', 'RequiredQtyKgs', 'Buyer', 'Unit', 'Process Name', 'Grey Req.', 'Knit Prod.', 'Knit. Bala.', 'BP Qty', 'Dyeing Prod.', 'Dyeing Bala.', 'NetReceivedQtyKgs', 'NetDeliveryQtyKgs', 'RFD', 'Slowmoving', 'FF Stock'];
            document.getElementById('planningHeaderText').innerText = 'Finishing Planning';
            document.getElementById('limitationHeaderText').innerText = 'Finishing Limitation';

            let mainHtml = mainCols.map(c => `<th class="p-2 border-r border-gray-300 text-center whitespace-normal min-w-[80px] dynamic-th">${c}</th>`).join('');
            let subHtml = `<th class="border-r border-gray-300 dynamic-th" colspan="${mainCols.length}"></th>`;

            document.getElementById('planningHeaderText').insertAdjacentHTML('beforebegin', mainHtml);
            document.querySelector('#subHeaderRow th').insertAdjacentHTML('beforebegin', subHtml);
        }
    }
}


function autoFillYarnDate(inputElem) {
    const currentDept = activeTabId.replace('_report', '');
    if (currentDept !== 'knitting') return;

    const tbody = document.getElementById('detFabricItemsBody');
    const yarnInputs = Array.from(tbody.querySelectorAll('.row-yarn-date'));
    if (yarnInputs.length === 0) return;

    // Only auto-fill if the changed input is the very first one
    if (inputElem === yarnInputs[0]) {
        const newValue = inputElem.value;
        for (let i = 1; i < yarnInputs.length; i++) {
            yarnInputs[i].value = newValue;
        }
    }
}

function enforceEndDateMin(startInput, endInputClass) {
    const row = startInput.closest('tr');
    if (!row) return;
    const endInput = row.querySelector('.' + endInputClass);
    if (endInput) {
        endInput.min = startInput.value;
        if (endInput.value && endInput.value < startInput.value) {
            endInput.value = startInput.value;
        }
    }
}

function checkEndDateValid(endInput, startInputClass) {
    const row = endInput.closest('tr');
    if (!row) return;
    const startInput = row.querySelector('.' + startInputClass);
    if (startInput && startInput.value && endInput.value) {
        if (endInput.value < startInput.value) {
            alert("End date cant be less than start date");
            endInput.value = startInput.value;
        }
    }
}
