// ==========================================================
// PAGINATION, FILTERS & TABLE RENDERING (Server-side pagination)
// ==========================================================

// renderMainTable is now a wrapper that triggers server-side fetch
function renderMainTable() {
    // With Approach A, rendering is done by fetchAndProcessData → renderMainTableFromAPI
    // This function is called by activateMainTab and other legacy code paths
    fetchAndProcessData(true);
}

function updatePaginationUI(start, end, total, totalPages) {
    document.getElementById('pageInfo').innerText = `Showing ${total === 0 ? 0 : start + 1}-${end} of ${total}`;
    const btnContainer = document.getElementById('pageButtons');
    btnContainer.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = `px-3 py-1.5 border border-gray-300 rounded font-medium text-xs transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`;
    prev.innerHTML = '<i class="fas fa-chevron-left mr-1 text-[10px]"></i> Prev';
    prev.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            fetchAndProcessData(true); // Server-side: fetch next page
        }
    };

    const next = document.createElement('button');
    next.className = `px-3 py-1.5 border border-gray-300 rounded font-medium text-xs transition-colors ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`;
    next.innerHTML = 'Next <i class="fas fa-chevron-right ml-1 text-[10px]"></i>';
    next.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchAndProcessData(true); // Server-side: fetch next page
        }
    };

    btnContainer.appendChild(prev);
    const pageText = document.createElement('span');
    pageText.className = "px-3 py-1 font-semibold text-gray-700 hidden sm:inline-block";
    pageText.innerText = `Page ${totalPages === 0 ? 0 : currentPage} of ${totalPages}`;
    btnContainer.appendChild(pageText);
    btnContainer.appendChild(next);
}

function changeRowsPerPage() {
    rowsPerPage = parseInt(document.getElementById('rowsPerPage').value);
    currentPage = 1;
    fetchAndProcessData(true); // Re-fetch with new limit
}
