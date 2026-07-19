// ==========================================================
// PAGINATION, FILTERS & TABLE RENDERING
// ==========================================================
function renderMainTable() {
        const tbody = document.getElementById('mainTableBody');
        const buyerFilterContainer = document.getElementById('buyerFilterContainer');
        const emptyState = document.getElementById('emptyState');
        const dataTableWrapper = document.getElementById('dataTableContentWrapper');
        const paginationControls = document.getElementById('paginationControls');
        const thead = document.querySelector('#dataTableContent thead');

        let data = Object.values(groupedData).filter(g => g.mergedItems && g.mergedItems.length > 0);

        data = data.filter(g => {
            const status = (g.generalInfo && g.generalInfo.OrderStatus) ? g.generalInfo.OrderStatus : 'On Process';
            if (activeMainTab === 'All') return status === 'Completed';
            return status !== 'Completed';
        });

        if (activeMainTab === 'All') {
            buyerFilterContainer.classList.add('hidden');
            dataTableWrapper.classList.remove('hidden');
            emptyState.classList.add('hidden');

            data.sort((a, b) => {
                let dateA = new Date((a.generalInfo && a.generalInfo.CompletedDate) ? a.generalInfo.CompletedDate : 0).getTime();
                let dateB = new Date((b.generalInfo && b.generalInfo.CompletedDate) ? b.generalInfo.CompletedDate : 0).getTime();
                return dateA - dateB;
            });

            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-gray-500 font-medium">No completed orders found.</td></tr>`;
                paginationControls.classList.add('hidden');
                return;
            }

            if (thead.dataset.currentTab !== 'All') {
                thead.innerHTML = `
                <tr class="bg-gray-800 text-white text-[11px] font-bold border-b border-gray-700">
                    <th class="p-2 border-r border-gray-700 text-center w-[120px]">
                        <button onclick="downloadCompletedList()" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded shadow text-[10px]"><i class="fas fa-file-excel mr-1"></i> EXCEL</button>
                    </th>
                    <th class="p-2 border-r border-gray-700">Order/Booking No.</th>
                    <th class="p-2 border-r border-gray-700 text-center">Completed Date</th>
                    <th class="p-2">Buyer</th>
                </tr>
                <tr class="bg-white border-b border-gray-300">
                    <th class="p-1 border-r border-gray-300 bg-white"></th>
                    <th class="p-1 border-r border-gray-300 bg-white"><input type="text" class="header-search" oninput="filterByColumn(1, this.value)" placeholder="Search No..."></th>
                    <th class="p-1 border-r border-gray-300 bg-white"><input type="text" class="header-search" oninput="filterByColumn('compDate', this.value)" placeholder="Search Date..."></th>
                    <th class="p-1 border-r border-gray-300 bg-white"><input type="text" class="header-search" oninput="filterByColumn(3, this.value)" placeholder="Search Buyer..."></th>
                </tr>
            `;
                thead.dataset.currentTab = 'All';

                const searchInputs = document.querySelectorAll('#dataTableContent thead .header-search');
                if (searchInputs[0] && colFilters[1]) searchInputs[0].value = colFilters[1];
                if (searchInputs[1] && colFilters['compDate']) searchInputs[1].value = colFilters['compDate'];
                if (searchInputs[2] && colFilters[3]) searchInputs[2].value = colFilters[3];
            }

            for (let col in colFilters) {
                const searchVal = colFilters[col];
                if (!searchVal) continue;

                data = data.filter(d => {
                    const displayBuyer = d.buyers.size > 0 ? Array.from(d.buyers).join(', ') : 'N/A';
                    const compDateStr = (d.generalInfo && d.generalInfo.CompletedDate) ? formatDateDisplay(d.generalInfo.CompletedDate) : 'N/A';

                    if (col == 1) return String(d.bookingNo).toLowerCase().includes(searchVal);
                    if (col === 'compDate') return String(compDateStr).toLowerCase().includes(searchVal);
                    if (col == 3) return String(displayBuyer).toLowerCase().includes(searchVal);
                    return true;
                });
            }

            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-gray-500 font-medium"><i class="fas fa-search text-3xl mb-3 text-gray-300 block"></i>No matching data found in Completed list.</td></tr>`;
                paginationControls.classList.add('hidden');
                return;
            }

            paginationControls.classList.remove('hidden');
            const totalPages = Math.ceil(data.length / rowsPerPage);
            if (currentPage > totalPages) currentPage = totalPages;
            if (currentPage < 1) currentPage = 1;
            const start = (currentPage - 1) * rowsPerPage;
            const pagedData = data.slice(start, start + rowsPerPage);

            let htmlContent = '';
            pagedData.forEach(d => {
                const displayBuyer = d.buyers.size > 0 ? Array.from(d.buyers).join(', ') : 'N/A';
                const compDateStr = (d.generalInfo && d.generalInfo.CompletedDate) ? formatDateDisplay(d.generalInfo.CompletedDate) : 'N/A';

                htmlContent += `
            <tr class="hover:bg-gray-50 border-b border-gray-200 bg-white transition-colors">
                <td class="p-2 border-r border-gray-200 text-center">
                    <button onclick="openDetailedView('${encodeURIComponent(d.bookingNo)}')" class="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-600 hover:text-white transition shadow-sm" title="View/Edit"><i class="fas fa-eye"></i></button>
                </td>
                <td class="p-2 border-r border-gray-200 text-gray-800 font-bold">${d.bookingNo}</td>
                <td class="p-2 border-r border-gray-200 text-center text-gray-600 font-medium">${compDateStr}</td>
                <td class="p-2 border-r border-gray-200 font-medium text-gray-600">${displayBuyer}</td>
            </tr>`;
            });
            tbody.innerHTML = htmlContent;
            updatePaginationUI(start, start + pagedData.length, data.length, totalPages);
            return;
        }

        if (thead.dataset.currentTab !== 'Active') {
            thead.innerHTML = `
            <tr class="text-gray-700 text-[11px] font-bold border-b border-gray-300">
                <th class="p-2 border-r border-gray-300 text-center w-[50px] bg-tableHeader">Manage</th>
                <th class="p-2 border-r border-gray-300 bg-tableHeader">Order/Booking No.</th>
                <th class="p-2 border-r border-gray-300 text-center bg-tableHeader">Booking Date</th>
                <th class="p-2 border-r border-gray-300 bg-tableHeader text-blue-700">Buyer</th>
                <th class="p-2 border-r border-gray-300 bg-tableHeader w-[700px]">Status</th>
            </tr>
            <tr class="bg-white border-b border-gray-300">
                <th class="p-1 border-r border-gray-300 bg-white"></th>
                <th class="p-1 border-r border-gray-300 bg-white"><input type="text" class="header-search" oninput="filterByColumn(1, this.value)" placeholder="Search No..."></th>
                <th class="p-1 border-r border-gray-300 bg-white"><input type="text" class="header-search" oninput="filterByColumn(2, this.value)" placeholder="Search Date..."></th>
                <th class="p-1 border-r border-gray-300 bg-white"><input type="text" class="header-search" oninput="filterByColumn(3, this.value)" placeholder="Search Buyer..."></th>
                <th class="p-1 border-r border-gray-300 bg-white"><input type="text" class="header-search" oninput="filterByColumn(4, this.value)" placeholder="Search Status..."></th>
            </tr>
        `;
            thead.dataset.currentTab = 'Active';

            document.querySelectorAll('.header-search').forEach((input, index) => {
                const colIndex = index + 1;
                if (colFilters[colIndex]) {
                    input.value = colFilters[colIndex];
                }
            });
        }

        if (activeMainTab === 'Pending') data = data.filter(d => d.isPending);
        else if (activeMainTab === 'Confirm') data = data.filter(d => d.isConfirm);
        else if (activeMainTab === 'Tentative') data = data.filter(d => d.isTentative);

        const buyersSet = new Set();
        data.forEach(d => { d.buyers.forEach(b => { if (b && b !== 'N/A') buyersSet.add(b); }); });

        if (data.length === 0 || buyersSet.size === 0) {
            dataTableWrapper.classList.add('hidden');
            paginationControls.classList.add('hidden');
            buyerFilterContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.innerHTML = `<i class="fas fa-folder-open text-4xl mb-3 text-gray-300"></i><p>No ${activeMainTab} data available.</p>`;
            tbody.innerHTML = '';
            return;
        }

        renderBuyerTabs(Array.from(buyersSet));
        buyerFilterContainer.classList.remove('hidden');

        if (activeBuyer === '' && buyersSet.size > 0) {
            activeBuyer = Array.from(buyersSet)[0];
            renderBuyerTabs(Array.from(buyersSet));
        }

        if (activeBuyer !== '') {
            const searchB = activeBuyer.toLowerCase().trim();
            data = data.filter(d => { const bArr = Array.from(d.buyers).map(x => x.toLowerCase().trim()); return bArr.includes(searchB); });
        }

        for (let col in colFilters) {
            const searchVal = colFilters[col]; if (!searchVal) continue;
            data = data.filter(d => {
                const displayBuyer = d.buyers.size > 0 ? Array.from(d.buyers).join(', ') : 'N/A';
                if (col == 1) return String(d.bookingNo).toLowerCase().includes(searchVal);
                if (col == 2) return String(d.bookingDate).toLowerCase().includes(searchVal);
                if (col == 3) return String(displayBuyer).toLowerCase().includes(searchVal);
                if (col == 4) return String(d.status).toLowerCase().includes(searchVal);
                return true;
            });
        }

        dataTableWrapper.classList.remove('hidden'); emptyState.classList.add('hidden');
        if (data.length === 0) {
            paginationControls.classList.add('hidden');
            tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-gray-500 bg-white border-b border-gray-200"><i class="fas fa-search text-3xl mb-3 text-gray-300 block"></i>No matching data found in ${activeMainTab} list.</td></tr>`;
            return;
        }

        paginationControls.classList.remove('hidden');
        const totalPages = Math.ceil(data.length / rowsPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const start = (currentPage - 1) * rowsPerPage;
        const pagedData = data.slice(start, start + rowsPerPage);

        let htmlContent = '';
        pagedData.forEach(d => {
            const displayBuyer = d.buyers.size > 0 ? Array.from(d.buyers).join(', ') : 'N/A';
            htmlContent += `
        <tr class="hover:bg-blue-50 border-b border-gray-200 transition-colors">
            <td class="p-2 border-r border-gray-200 text-center"><button onclick="openDetailedView('${encodeURIComponent(d.bookingNo)}')" class="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-600 hover:text-white transition shadow-sm"><i class="fas fa-eye"></i></button></td>
            <td class="p-2 border-r border-gray-200 text-blue-700 font-bold">${d.bookingNo}</td>
            <td class="p-2 border-r border-gray-200 text-center">${d.bookingDate}</td>
            <td class="p-2 border-r border-gray-200 font-medium text-gray-800">${displayBuyer}</td>
            <td class="p-2 border-r border-gray-200 text-gray-600 font-medium">${d.status}</td>
        </tr>
    `;
        });
        tbody.innerHTML = htmlContent;
        updatePaginationUI(start, start + pagedData.length, data.length, totalPages);
}

function updatePaginationUI(start, end, total, totalPages) {
    document.getElementById('pageInfo').innerText = `Showing ${total === 0 ? 0 : start + 1}-${end} of ${total}`;
    const btnContainer = document.getElementById('pageButtons'); btnContainer.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = `px-3 py-1.5 border border-gray-300 rounded font-medium text-xs transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`;
    prev.innerHTML = '<i class="fas fa-chevron-left mr-1 text-[10px]"></i> Prev';
    prev.onclick = () => { if (currentPage > 1) { currentPage--; renderMainTable(); } };

    const next = document.createElement('button');
    next.className = `px-3 py-1.5 border border-gray-300 rounded font-medium text-xs transition-colors ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`;
    next.innerHTML = 'Next <i class="fas fa-chevron-right ml-1 text-[10px]"></i>';
    next.onclick = () => { if (currentPage < totalPages) { currentPage++; renderMainTable(); } };

    btnContainer.appendChild(prev);
    const pageText = document.createElement('span'); pageText.className = "px-3 py-1 font-semibold text-gray-700 hidden sm:inline-block";
    pageText.innerText = `Page ${totalPages === 0 ? 0 : currentPage} of ${totalPages}`;
    btnContainer.appendChild(pageText); btnContainer.appendChild(next);
}

function changeRowsPerPage() { rowsPerPage = parseInt(document.getElementById('rowsPerPage').value); currentPage = 1; renderMainTable(); }

