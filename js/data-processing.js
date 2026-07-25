// ==========================================================
// DATA PROCESSING: Fetch from paginated API (Approach A)
// ==========================================================

const API_BASE = "https://abir-backend-api.onrender.com";

// Called after mutations — triggers re-fetch on next navigation
function markDataDirty() {
  /* no-op with server-side approach */
}

function generateItemId(itemData, tabId) {
  if (!itemData) return Date.now().toString();
  const currentDept = tabId.replace("_report", "");
  let bNo = String(
    itemData.OrderNo !== undefined && itemData.OrderNo !== null
      ? itemData.OrderNo
      : "N/A",
  ).trim();
  let color = String(
    itemData.Color !== undefined && itemData.Color !== null
      ? itemData.Color
      : "N/A",
  ).trim();

  if (currentDept === "knitting" || currentDept === "delivery") {
    let fabConst = String(
      itemData.FabricConstruction !== undefined &&
        itemData.FabricConstruction !== null
        ? itemData.FabricConstruction
        : "N/A",
    ).trim();
    let gsm = String(
      itemData.GSM !== undefined && itemData.GSM !== null
        ? itemData.GSM
        : "N/A",
    ).trim();
    return `${bNo}_${color}_${fabConst}_${gsm}`
      .toLowerCase()
      .replace(/\s+/g, "");
  } else if (currentDept === "yd") {
    let type = String(
      itemData["Booking Type"] !== undefined &&
        itemData["Booking Type"] !== null
        ? itemData["Booking Type"]
        : "N/A",
    ).trim();
    let ydb = String(
      itemData.YDB !== undefined && itemData.YDB !== null
        ? itemData.YDB
        : "N/A",
    ).trim();
    return `${bNo}_${type}_${ydb}`.toLowerCase().replace(/\s+/g, "");
  } else {
    let procName = String(
      itemData.ProcessName !== undefined && itemData.ProcessName !== null
        ? itemData.ProcessName
        : "N/A",
    ).trim();
    return `${bNo}_${color}_${procName}`.toLowerCase().replace(/\s+/g, "");
  }
}

function activateMainTab(tabName) {
  activeMainTab = tabName;
  const tabs = ["Pending", "Confirm", "Tentative", "All"];
  tabs.forEach((t) => {
    const btn = document.getElementById("btn" + t);
    if (btn) {
      if (t === tabName)
        btn.className =
          "bg-[#313644] text-white px-3 sm:px-6 py-1.5 sm:py-2 font-bold rounded-sm cursor-pointer shadow-sm uppercase tracking-wide transition-colors text-[10px] sm:text-[13px] flex-1 sm:flex-none text-center";
      else
        btn.className =
          "bg-white text-gray-800 border border-gray-300 px-3 sm:px-6 py-1.5 sm:py-2 font-bold rounded-sm cursor-pointer shadow-sm hover:bg-gray-50 uppercase tracking-wide transition-colors text-[10px] sm:text-[13px] flex-1 sm:flex-none text-center";
    }
  });
  activeBuyer = "";
  document
    .querySelectorAll(".buyer-tab")
    .forEach((t) => t.classList.remove("active"));
  currentPage = 1;
  // Fetch from server with new status filter
  fetchAndProcessData();
}

async function searchGlobalBooking() {
  const searchVal = document.getElementById("globalBookingSearch").value.trim();
  if (!searchVal) {
    showToast("Please enter a Booking No. to search");
    return;
  }

  // Search via API
  const currentDept = activeTabId.replace("_report", "");
  try {
    const res = await fetch(
      `${API_BASE}/api/orders?dept=${currentDept}&status=${activeMainTab === "All" ? "Completed" : activeMainTab}&search=${encodeURIComponent(searchVal)}&limit=1`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.orders && data.orders.length > 0) {
        const order = data.orders[0];
        showToast(`Found "${order.orderNo}" — opening...`);
        openDetailedView(encodeURIComponent(order.orderNo));
      } else {
        // Try other statuses
        for (const status of ["Pending", "Confirm", "Tentative", "Completed"]) {
          if (status === activeMainTab) continue;
          const r2 = await fetch(
            `${API_BASE}/api/orders?dept=${currentDept}&status=${status}&search=${encodeURIComponent(searchVal)}&limit=1`,
          );
          if (r2.ok) {
            const d2 = await r2.json();
            if (d2.orders && d2.orders.length > 0) {
              activeMainTab = status === "Completed" ? "All" : status;
              showToast(`Found "${d2.orders[0].orderNo}" in ${status} list!`);
              activateMainTab(activeMainTab);
              return;
            }
          }
        }
        showToast(`Booking "${searchVal}" not found in this department!`);
      }
    }
  } catch (e) {
    console.error("Search error:", e);
    showToast("Search failed. Try again.");
  }
}

function clearGlobalSearch() {
  document.getElementById("globalBookingSearch").value = "";
  activateMainTab("Pending");
  showToast("Search cleared. Showing Pending List.");
}

// ==========================================================
// MAIN DATA FETCH: Now uses paginated /api/orders endpoint
// No more Excel download/parse! Server returns ready data.
// ==========================================================
async function fetchAndProcessData(isSilent = false) {
  const currentDept = activeTabId.replace("_report", "");

  if (!isSilent) {
    document.getElementById("loadingData").classList.remove("hidden");
  }

  try {
    if (isReportMode) {
      await fetchReportData(currentDept);
    } else {
      await fetchOrderList(currentDept);
    }
  } catch (e) {
    console.error("Error processing data:", e);
  }

  document.getElementById("loadingData").classList.add("hidden");
}

// Fetch paginated order list for Order Management view
async function fetchOrderList(currentDept) {
  const status = activeMainTab === "All" ? "Completed" : activeMainTab;
  const searchParams = new URLSearchParams({
    dept: currentDept,
    status: status,
    page: currentPage,
    limit: rowsPerPage,
  });
  if (activeBuyer) searchParams.set("buyer", activeBuyer);

  // Single API call — returns orders + buyers for current status
  const ordersRes = await fetch(`${API_BASE}/api/orders?${searchParams}`).catch(
    (e) => null,
  );

  let ordersData = { orders: [], total: 0, page: 1, totalPages: 0, buyers: [] };
  if (ordersRes && ordersRes.ok) {
    ordersData = await ordersRes.json();
  }

  let allBuyers = ordersData.buyers || [];

  // Apply buyer permissions
  let userPerms = null;
  try {
    userPerms = JSON.parse(localStorage.getItem("permissions"));
  } catch (e) {}
  if (userPerms && userPerms.buyers && userPerms.buyers.accessType !== "all") {
    const ids = userPerms.buyers.buyerIds || [];
    allBuyers = allBuyers.filter((b) => {
      const id = String(b)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      return ids.includes(id);
    });
  }

  // Build groupedData compatible structure for renderMainTable
  groupedData = {};
  ordersData.orders.forEach((order) => {
    groupedData[order.orderNo] = {
      bookingNo: order.orderNo,
      buyers: new Set([order.buyer || "N/A"]),
      bookingDate: order.bookingDate
        ? formatDateDisplay(order.bookingDate)
        : "N/A",
      status: order.status || "N/A",
      generalInfo: {
        OrderStatus: status === "Completed" ? "Completed" : "On Process",
      },
      mergedItems: [{ planType: status }], // Stub so filtering works
      isPending: status === "Pending",
      isConfirm: status === "Confirm",
      isTentative: status === "Tentative",
    };
  });

  // Render buyer tabs
  renderBuyerTabs(allBuyers);

  // Render table with server-side pagination info
  renderMainTableFromAPI(ordersData, status);
}

// Render main table from API response (server-side pagination)
function renderMainTableFromAPI(data, status) {
  const tbody = document.getElementById("mainTableBody");
  const emptyState = document.getElementById("emptyState");
  const dataTableWrapper = document.getElementById("dataTableContentWrapper");
  const paginationControls = document.getElementById("paginationControls");
  const thead = document.querySelector("#dataTableContent thead");
  const buyerFilterContainer = document.getElementById("buyerFilterContainer");

  if (status === "Completed") {
    buyerFilterContainer.classList.add("hidden");
    dataTableWrapper.classList.remove("hidden");
    emptyState.classList.add("hidden");

    if (data.orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-gray-500 font-medium">No completed orders found.</td></tr>`;
      paginationControls.classList.add("hidden");
      return;
    }

    if (thead.dataset.currentTab !== "All") {
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
            </tr>`;
      thead.dataset.currentTab = "All";
    }

    let html = "";
    data.orders.forEach((o) => {
      html += `
            <tr class="hover:bg-gray-50 border-b border-gray-200 bg-white transition-colors">
                <td class="p-2 border-r border-gray-200 text-center">
                    <button onclick="openDetailedView('${encodeURIComponent(o.orderNo)}')" class="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-600 hover:text-white transition shadow-sm" title="View/Edit"><i class="fas fa-eye"></i></button>
                </td>
                <td class="p-2 border-r border-gray-200 text-gray-800 font-bold">${o.orderNo}</td>
                <td class="p-2 border-r border-gray-200 text-center text-gray-600 font-medium">${o.bookingDate ? formatDateDisplay(o.bookingDate) : "N/A"}</td>
                <td class="p-2 border-r border-gray-200 font-medium text-gray-600">${o.buyer || "N/A"}</td>
            </tr>`;
    });
    tbody.innerHTML = html;

    paginationControls.classList.remove("hidden");
    updatePaginationUI(
      (data.page - 1) * data.limit,
      Math.min(data.page * data.limit, data.total),
      data.total,
      data.totalPages,
    );
    return;
  }

  // Active list (Pending/Confirm/Tentative)
  if (thead.dataset.currentTab !== "Active") {
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
        </tr>`;
    thead.dataset.currentTab = "Active";
  }

  buyerFilterContainer.classList.remove("hidden");

  if (data.orders.length === 0) {
    dataTableWrapper.classList.remove("hidden");
    emptyState.classList.add("hidden");
    paginationControls.classList.add("hidden");
    tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-gray-500 bg-white border-b border-gray-200"><i class="fas fa-search text-3xl mb-3 text-gray-300 block"></i>No ${activeMainTab} data found.</td></tr>`;
    return;
  }

  dataTableWrapper.classList.remove("hidden");
  emptyState.classList.add("hidden");
  paginationControls.classList.remove("hidden");

  let html = "";
  data.orders.forEach((o) => {
    html += `
        <tr class="hover:bg-blue-50 border-b border-gray-200 transition-colors">
            <td class="p-2 border-r border-gray-200 text-center"><button onclick="openDetailedView('${encodeURIComponent(o.orderNo)}')" class="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-600 hover:text-white transition shadow-sm"><i class="fas fa-eye"></i></button></td>
            <td class="p-2 border-r border-gray-200 text-blue-700 font-bold">${o.orderNo}</td>
            <td class="p-2 border-r border-gray-200 text-center">${o.bookingDate ? formatDateDisplay(o.bookingDate) : "N/A"}</td>
            <td class="p-2 border-r border-gray-200 font-medium text-gray-800">${o.buyer || "N/A"}</td>
            <td class="p-2 border-r border-gray-200 text-gray-600 font-medium">${o.status || "N/A"}</td>
        </tr>`;
  });
  tbody.innerHTML = html;

  updatePaginationUI(
    (data.page - 1) * data.limit,
    Math.min(data.page * data.limit, data.total),
    data.total,
    data.totalPages,
  );
}

// Fetch report data (Confirm + Tentative with full items)
async function fetchReportData(currentDept) {
  try {
    const res = await fetch(
      `${API_BASE}/api/orders/report/${currentDept}?page=1&limit=2000`,
    );
    if (!res || !res.ok) return;
    const data = await res.json();

    const cardCombinedReport = document.getElementById("cardCombinedReport");
    const reportEmpty = document.getElementById("reportEmptyState");
    const cardsGrid = document.getElementById("reportCardsGrid");
    const titleEl = document.getElementById("combinedReportTitle");
    const btnTextEl = document.getElementById("combinedReportBtnText");

    if (titleEl)
      titleEl.innerText = `Updated ${currentDept.toUpperCase()} Report`;
    if (btnTextEl)
      btnTextEl.innerText = `Download ${currentDept.toUpperCase()} Data`;

    const hasData = data.orders && data.orders.length > 0;

    if (cardCombinedReport)
      cardCombinedReport.style.display = hasData ? "flex" : "none";

    if (!hasData) {
      if (cardsGrid) cardsGrid.style.display = "none";
      if (reportEmpty) {
        reportEmpty.classList.remove("hidden");
        reportEmpty.style.display = "flex";
      }
    } else {
      if (cardsGrid) cardsGrid.style.display = "grid";
      if (reportEmpty) {
        reportEmpty.classList.add("hidden");
        reportEmpty.style.display = "none";
      }

      // Store report data for export
      groupedData = {};
      data.orders.forEach((order) => {
        const planData = data.planMap[order.orderNo];
        const itemsField = `${currentDept}Items`;
        groupedData[order.orderNo] = {
          bookingNo: order.orderNo,
          buyers: new Set([order.buyer || "N/A"]),
          generalInfo: {},
          dbData: planData || null,
          mergedItems:
            planData && planData[currentDept] ? planData[currentDept] : [],
          isConfirm: true,
        };
      });
    }
  } catch (e) {
    console.error("Report fetch error:", e);
  }
}

function exportCombinedReportToExcel() {
  if (!groupedData || Object.keys(groupedData).length === 0) {
    showToast("No data available to export!");
    return;
  }

  const currentDeptLower = activeTabId.replace("_report", "");
  const currentDept = currentDeptLower.toUpperCase();
  let allRows = [];

  Object.values(groupedData).forEach((group) => {
    if (group.mergedItems) {
      group.mergedItems.forEach((item) => {
        if (item.planType === "Confirm" || item.planType === "Tentative") {
          let rowData = { ...(item.itemData || {}) };
          rowData["Plan Start Date"] = formatDateDisplay(item.startDate) || "";
          rowData["Plan End Date"] = formatDateDisplay(item.endDate) || "";
          rowData["Plan Type"] = item.planType || "";
          rowData["Limitation"] = item.limitation || "";
          rowData["Remarks"] = item.remarks || "";
          allRows.push(rowData);
        }
      });
    }
  });

  if (allRows.length === 0) {
    showToast(
      `No Confirm or Tentative data found to export for ${currentDept}!`,
    );
    return;
  }

  showToast(`Generating Excel file for Updated ${currentDept} Report...`);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(allRows);
  formatExcelWorksheet(ws);
  XLSX.utils.book_append_sheet(wb, ws, `${currentDept}_Report`);

  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `${currentDept}_Updated_Report_${dateStr}.xlsx`);
}

function renderBuyerTabs(buyers) {
  const container = document.getElementById("buyerFilterContainer");
  container.innerHTML = "";
  buyers.forEach((b) => {
    const btn = document.createElement("div");
    btn.className = `buyer-tab ${activeBuyer !== "" && activeBuyer.toLowerCase() === b.toLowerCase() ? "active" : ""}`;
    btn.innerText = b;
    btn.onclick = () => activateBuyerFilter(b);
    container.appendChild(btn);
  });
}

function activateBuyerFilter(buyer) {
  activeBuyer = buyer;
  document.querySelectorAll(".buyer-tab").forEach((t) => {
    if (t.innerText.toLowerCase() === buyer.toLowerCase())
      t.classList.add("active");
    else t.classList.remove("active");
  });
  currentPage = 1;
  fetchAndProcessData(true);
}

function filterByColumn(colIndex, val) {
  colFilters[colIndex] = String(val).toLowerCase().trim();
  currentPage = 1;
  // For server-side filtering, trigger a search via the search param
  // For now, use client-side filtering on the current page (search still works via API)
  fetchAndProcessData(true);
}
