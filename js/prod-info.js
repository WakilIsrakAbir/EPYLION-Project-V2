// ==========================================================
// PRODUCT INFO: Product Info Page (Color-wise Report)
// ==========================================================

let piCurrentPage = 1;
let piRowsPerPage = 10;
let piSearchQuery = "";
let piGroupedData = {};
let piTotalFromServer = 0;
let piTotalPagesFromServer = 0;

// Metric rules for color-wise report (same as demo)
const piMetricRules = [
  {
    label: "Allowance",
    source: "knitting",
    fields: ["Allowance", "Allowance %", "Allow"],
    mode: "average",
    percent: true,
  },
  {
    label: "Allocated Qty",
    source: "knitting",
    fields: ["Allocated Qty", "Allocated Qty ", "AllocatedQty", "Alloc Qty"],
    mode: "sum",
  },
  {
    label: "Yarn bala.",
    source: "knitting",
    fields: ["Yarn bala.", "Yarn Bala", "YarnBala", "Yarn Balance"],
    mode: "sum",
  },
  {
    label: "Knit Prod.",
    source: "knitting",
    fields: ["Knit Prod.", "KnitProd", "Knit Production", "Knit Prod"],
    mode: "sum",
  },
  {
    label: "Knit. Bala.",
    source: "knitting",
    fields: [
      "Knit. Bala.",
      "KnitBala",
      "Knit Bala",
      "Knit Balance",
      "Knit. Bal.",
    ],
    mode: "sum",
  },
  {
    label: "Dyeing ok",
    source: "dyeing",
    fields: [
      "Dyeing ok",
      "Dyeing Prod.",
      "DyeingProd",
      "Dyeing Prod",
      "Dyeing Production",
    ],
    mode: "sum",
  },
  {
    label: "Dyeing Bal.",
    source: "dyeing",
    fields: [
      "Dyeing Bal.",
      "Dyeing Bala.",
      "DyeingBala",
      "Dyeing Balance",
      "Dye Bal",
    ],
    mode: "sum",
  },
  {
    label: "RequiredQtyKgs",
    source: "delivery",
    fields: ["RequiredQtyKgs", "Required Qty Kgs", "Required Qty", "Req Qty"],
    mode: "sum",
  },
  {
    label: "NetReceivedQtyKgs",
    source: "delivery",
    fields: [
      "NetReceivedQtyKgs",
      "Net Received Qty Kgs",
      "Net Received Qty",
      "Received Qty",
    ],
    mode: "sum",
  },
  {
    label: "NetDeliveryQtyKgs",
    source: "delivery",
    fields: [
      "NetDeliveryQtyKgs",
      "Net Delivery Qty Kgs",
      "NetDeliveryQty",
      "Delivery Qty",
      "DeliveryQty",
    ],
    mode: "sum",
  },
  {
    label: "Deli. Bala.",
    source: "delivery",
    fields: [
      "Deli. Bala.",
      "Deli. Bal.",
      "DeliBal",
      "Deli Bal.",
      "Delivery Balance",
      "Deli Bal",
    ],
    mode: "sum",
  },
  { label: "RFD", source: "delivery", fields: ["RFD"], mode: "sum" },
  {
    label: "Slowmoving",
    source: "delivery",
    fields: ["Slowmoving", "Slow Moving", "SlowMoving"],
    mode: "sum",
  },
  {
    label: "FF Stock",
    source: "delivery",
    fields: ["FF Stock", "FFStock", "FF_Stock"],
    mode: "sum",
  },
];

// ==========================================
// Show Product Info page
// ==========================================
async function showProductInfo() {
  localStorage.setItem("activePage", JSON.stringify({ page: "productInfo" }));

  hideAllCoreViews();

  const piSection = document.getElementById("productInfoSection");
  if (piSection) piSection.classList.remove("hidden");

  document.getElementById("piDetailedView").classList.add("hidden");
  document.getElementById("piListView").classList.remove("hidden");
  document.getElementById("piSearchInput").value = "";

  piSearchQuery = "";
  piCurrentPage = 1;
  setActiveSidebarMenu("menu-prod-info");
  closeSidebarMobile();

  const piLoader = document.getElementById("piLoadingSpinner");
  if (piLoader) piLoader.classList.remove("hidden");

  await fetchProductInfoData();

  if (piLoader) piLoader.classList.add("hidden");

  renderProductInfoTable();
}

// Hide product info when navigating to other pages
const piOriginalDashboard = showDashboardHome;
showDashboardHome = function () {
  const pi = document.getElementById("productInfoSection");
  if (pi) pi.classList.add("hidden");
  piOriginalDashboard();
};

const piOriginalDataMgt = showDataManagementView;
showDataManagementView = function () {
  const pi = document.getElementById("productInfoSection");
  if (pi) pi.classList.add("hidden");
  piOriginalDataMgt();
};

const piOriginalLoadMenu = loadMenuData;
loadMenuData = async function (dept, title, mode) {
  const pi = document.getElementById("productInfoSection");
  if (pi) pi.classList.add("hidden");
  await piOriginalLoadMenu(dept, title, mode);
};

// ==========================================
// Fetch paginated order list from server
// ==========================================
async function fetchProductInfoData() {
  try {
    const search = piSearchQuery || "";
    const res = await fetch(
      `${API_BASE}/api/orders/all-list?page=${piCurrentPage}&limit=${piRowsPerPage}&search=${encodeURIComponent(search)}`,
    );
    if (!res.ok) return;
    const data = await res.json();

    piGroupedData = {};
    piTotalFromServer = data.total || 0;
    piTotalPagesFromServer = data.totalPages || 0;

    data.orders.forEach((order) => {
      piGroupedData[order.orderNo] = {
        bookingNo: order.orderNo,
        buyer: order.buyer || "N/A",
      };
    });
  } catch (error) {
    console.error("Error fetching Product Info data:", error);
  }
}

// ==========================================
// Search handler
// ==========================================
function filterPIList() {
  piSearchQuery = document
    .getElementById("piSearchInput")
    .value.trim()
    .toLowerCase();
  piCurrentPage = 1;
  refreshPIPage();
}

// ==========================================
// Rows per page change handler
// ==========================================
function changePIRowsPerPage() {
  piRowsPerPage = parseInt(document.getElementById("piRowsPerPage").value);
  piCurrentPage = 1;
  refreshPIPage();
}

// ==========================================
// Render order list table
// ==========================================
function renderProductInfoTable() {
  const tbody = document.getElementById("piTableBody");
  if (!tbody) return;

  if (!piGroupedData || Object.keys(piGroupedData).length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="p-10 text-center text-gray-500"><i class="fas fa-folder-open text-3xl mb-3 block text-gray-300"></i> No orders found.</td></tr>`;
    document.getElementById("piPageInfo").innerText = "Showing 0-0 of 0";
    document.getElementById("piPageButtons").innerHTML = "";
    return;
  }

  let dataList = Object.values(piGroupedData);
  const total = piTotalFromServer;
  const totalPages = piTotalPagesFromServer;
  const start = (piCurrentPage - 1) * piRowsPerPage;

  let html = "";
  dataList.forEach((d) => {
    html += `
                <tr class="hover:bg-blue-50 dark:hover:bg-[#1e2330] border-b border-gray-100 dark:border-[#2a3346] transition-colors">
                    <td class="p-3 border-r border-gray-200 dark:border-[#2a3346] text-center">
                        <button onclick="viewPIDetails('${encodeURIComponent(d.bookingNo)}')" class="bg-blue-100 text-blue-600 px-3 py-1 rounded shadow-sm hover:bg-blue-600 hover:text-white transition"><i class="fas fa-eye"></i></button>
                    </td>
                    <td class="p-3 border-r border-gray-200 dark:border-[#2a3346] font-bold text-gray-800 dark:text-gray-200">${d.bookingNo}</td>
                    <td class="p-3 text-gray-600 dark:text-gray-400 uppercase text-[11px]">${d.buyer}</td>
                </tr>
            `;
  });
  tbody.innerHTML = html;

  // Pagination info
  document.getElementById("piPageInfo").innerText =
    `Showing ${total === 0 ? 0 : start + 1}-${Math.min(start + piRowsPerPage, total)} of ${total}`;

  // Pagination buttons
  const btnContainer = document.getElementById("piPageButtons");
  btnContainer.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.className = `px-3 py-1 border border-gray-300 rounded ${piCurrentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50 cursor-pointer"}`;
  prevBtn.innerHTML = '<i class="fas fa-chevron-left text-[10px]"></i>';
  prevBtn.onclick = () => {
    if (piCurrentPage > 1) {
      piCurrentPage--;
      refreshPIPage();
    }
  };

  const nextBtn = document.createElement("button");
  nextBtn.className = `px-3 py-1 border border-gray-300 rounded ${piCurrentPage >= totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50 cursor-pointer"}`;
  nextBtn.innerHTML = '<i class="fas fa-chevron-right text-[10px]"></i>';
  nextBtn.onclick = () => {
    if (piCurrentPage < totalPages) {
      piCurrentPage++;
      refreshPIPage();
    }
  };

  btnContainer.appendChild(prevBtn);
  btnContainer.appendChild(nextBtn);
}

// ==========================================
// Re-fetch and re-render helper
// ==========================================
async function refreshPIPage() {
  const piLoader = document.getElementById("piLoadingSpinner");
  if (piLoader) piLoader.classList.remove("hidden");
  await fetchProductInfoData();
  if (piLoader) piLoader.classList.add("hidden");
  renderProductInfoTable();
}

// ==========================================
// Parse numeric value safely
// ==========================================
function piParseNum(val) {
  if (val === undefined || val === null || val === "-" || val === "")
    return null;
  const clean = String(val).replace(/,/g, "").replace(/%/g, "").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

// ==========================================
// Get field value from item using multiple possible field names
// ==========================================
function piGetField(item, fieldNames) {
  for (const f of fieldNames) {
    if (item[f] !== undefined && item[f] !== null && item[f] !== "")
      return item[f];
  }
  // Case-insensitive fuzzy match
  const itemKeys = Object.keys(item);
  for (const f of fieldNames) {
    const normF = f.toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = itemKeys.find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === normF,
    );
    if (found && item[found] !== undefined && item[found] !== null)
      return item[found];
  }
  return null;
}

// ==========================================
// View detailed color-wise report
// ==========================================
async function viewPIDetails(encodedBookingNo) {
  const bookingNo = decodeURIComponent(encodedBookingNo);

  document.getElementById("piListView").classList.add("hidden");
  document.getElementById("piDetailedView").classList.remove("hidden");

  // Show loading in report area
  const reportBody = document.getElementById("piReportBody");
  const reportHead = document.getElementById("piReportHead");
  reportBody.innerHTML =
    '<tr><td colspan="2" class="p-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-3 block"></i>Loading report data...</td></tr>';
  reportHead.innerHTML = "";

  let buyer = "N/A";
  let rawKnittingItems = [];
  let rawDyeingItems = [];
  let rawDeliveryItems = [];

  try {
    const res = await fetch(
      `${API_BASE}/api/orders/${encodeURIComponent(bookingNo)}?dept=knitting`,
    );
    if (res.ok) {
      const result = await res.json();
      const order = result.order;
      buyer = order.buyer || "N/A";
      rawKnittingItems = order.knittingItems || [];
      rawDyeingItems = order.dyeingItems || [];
      rawDeliveryItems = order.deliveryItems || [];
    }
  } catch (e) {
    console.error("Error fetching PI detail:", e);
    reportBody.innerHTML =
      '<tr><td colspan="2" class="p-8 text-center text-red-500"><i class="fas fa-exclamation-triangle text-2xl mb-3 block"></i>Error loading data. Please try again.</td></tr>';
    return;
  }

  // Extract unique colors from all items
  const colorMap = new Map(); // key (lowercase) -> display label
  const getColor = (item) => {
    return (
      item.Color ||
      item.Colour ||
      item["Fab Color"] ||
      item.color ||
      item.colour ||
      ""
    );
  };

  [rawKnittingItems, rawDyeingItems, rawDeliveryItems].forEach((items) => {
    items.forEach((item) => {
      const color = String(getColor(item)).trim();
      if (!color) return;
      const ck = color.toLowerCase().replace(/\s+/g, " ");
      if (!colorMap.has(ck)) colorMap.set(ck, color);
    });
  });

  const colors = [...colorMap.entries()].map(([key, label]) => ({
    key,
    label,
  }));

  if (colors.length === 0) {
    reportHead.innerHTML = `<tr><th class="p-3 text-left bg-blue-50 text-blue-800 font-bold border border-gray-300">Booking No.</th><th class="p-3 text-center border border-gray-300 font-bold text-blue-700">${bookingNo}</th><th class="p-3 text-left bg-blue-50 text-blue-800 font-bold border border-gray-300">Buyer</th><th class="p-3 text-center border border-gray-300 font-bold">${buyer}</th></tr>`;
    reportBody.innerHTML =
      '<tr><td colspan="4" class="p-8 text-center text-gray-400"><i class="fas fa-info-circle text-2xl mb-3 block"></i>No color data available for this order.</td></tr>';
    return;
  }

  // Build color-indexed data for each metric
  const getItemsBySource = (source) => {
    if (source === "knitting") return rawKnittingItems;
    if (source === "dyeing") return rawDyeingItems;
    if (source === "delivery") return rawDeliveryItems;
    return [];
  };

  const metricResults = piMetricRules.map((metric) => {
    const items = getItemsBySource(metric.source);
    const colorValues = colors.map((c) => {
      const matchingItems = items.filter((item) => {
        const color = String(getColor(item))
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");
        return color === c.key;
      });
      if (matchingItems.length === 0) return null;

      let sum = 0,
        count = 0;
      matchingItems.forEach((item) => {
        const val = piParseNum(piGetField(item, metric.fields));
        if (val !== null) {
          sum += val;
          count++;
        }
      });

      if (count === 0) return null;
      return metric.mode === "average" ? sum / count : sum;
    });

    // Total calculation
    const presentValues = colorValues.filter(
      (v) => v !== null && Number.isFinite(v),
    );
    let total = null;
    if (presentValues.length > 0) {
      total =
        metric.mode === "average"
          ? presentValues.reduce((a, b) => a + b, 0) / presentValues.length
          : presentValues.reduce((a, b) => a + b, 0);
    }

    return {
      label: metric.label,
      values: colorValues,
      total,
      percent: metric.percent || false,
    };
  });

  // Build colgroup
  const colgroup = document.getElementById("piReportColgroup");
  colgroup.innerHTML = `<col style="width:145px">${colors.map(() => '<col style="width:110px">').join("")}<col style="width:110px">`;

  // Build header
  const colSpan = Math.max(1, colors.length - 1);
  reportHead.innerHTML = `
            <tr>
                <th class="p-2 text-center bg-white text-blue-700 font-extrabold border border-gray-300">Booking No.</th>
                <th class="p-2 text-center border border-gray-300 font-extrabold text-blue-700">${bookingNo}</th>
                <th class="p-2 text-center bg-white text-blue-700 font-extrabold border border-gray-300">Buyer</th>
                <th class="p-2 text-center border border-gray-300 font-extrabold text-blue-700" colspan="${colSpan}">${buyer}</th>
            </tr>
            <tr class="bg-green-50/50">
                <th class="p-0 border border-gray-300 text-gray-900 align-middle">
                    <div class="mx-auto w-[120px] text-left p-2 font-extrabold">Color</div>
                </th>
                ${colors.map((c) => `<th class="p-2 text-center font-extrabold border border-gray-300 text-gray-900">${c.label}</th>`).join("")}
                <th class="p-2 text-center font-extrabold border border-gray-300 text-gray-900">Total</th>
            </tr>
        `;

  // Build body rows
  const formatVal = (val, percent) => {
    if (val === null || !Number.isFinite(val))
      return '<span class="text-gray-300">0</span>';
    const displayVal = percent ? val * 100 : val;
    const text = displayVal.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: percent ? 1 : 0,
    });
    return percent ? text + "%" : text;
  };

  reportBody.innerHTML = metricResults
    .map((r) => {
      return `<tr>
                <td class="p-0 border border-gray-300 bg-gray-50 align-middle">
                    <div class="mx-auto w-[120px] text-left p-2 font-bold whitespace-normal leading-tight text-xs">${r.label}</div>
                </td>
                ${r.values.map((v) => `<td class="p-2 text-center border border-gray-300 text-sm">${formatVal(v, r.percent)}</td>`).join("")}
                <td class="p-2 text-center border border-gray-300 font-black text-sm">${formatVal(r.total, r.percent)}</td>
            </tr>`;
    })
    .join("");

  // Store data for Excel download
  window._piCurrentReport = {
    bookingNo,
    buyer,
    colors,
    metricResults,
  };

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================
// Back to list
// ==========================================
function closePIDetails() {
  document.getElementById("piDetailedView").classList.add("hidden");
  document.getElementById("piListView").classList.remove("hidden");
}

// ==========================================
// Download report as Excel
// ==========================================
function downloadPIExcel() {
  if (!window._piCurrentReport) {
    showToast("No report data available to download.");
    return;
  }

  const { bookingNo, buyer, colors, metricResults } = window._piCurrentReport;

  const wsData = [
    ["Product Info Report"],
    [],
    ["Booking No.", bookingNo, "", "Buyer", buyer],
    [],
    ["Color", ...colors.map((c) => c.label), "Total"],
  ];

  metricResults.forEach((r) => {
    const row = [r.label];
    r.values.forEach((v) => {
      if (v === null || !Number.isFinite(v)) {
        row.push(0);
      } else {
        row.push(r.percent ? parseFloat((v * 100).toFixed(2)) + "%" : v);
      }
    });
    // Total
    if (r.total === null || !Number.isFinite(r.total)) {
      row.push(0);
    } else {
      row.push(
        r.percent ? parseFloat((r.total * 100).toFixed(2)) + "%" : r.total,
      );
    }
    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = [{ wch: 20 }, ...colors.map(() => ({ wch: 15 })), { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Product_Info");
  XLSX.writeFile(wb, `Product_Info_${bookingNo}.xlsx`);

  showToast(`Excel downloaded: Product_Info_${bookingNo}.xlsx`);
}
