// ==========================================================
// GLOBAL VARIABLES & STATE
// ==========================================================
let groupedData = {};
let openTabs = [];
let activeTabId = 'dashboard';
let activeUploadCategory = 'General';
let isReportMode = false;

let currentPage = 1;
let rowsPerPage = 10;

let activeMainTab = 'Pending';
let activeBuyer = '';
let colFilters = {};
let currentViewIndex = null;
let toastTimeout;

// Plan vs Actual Tracking state
let actualDeptKey = '';
let actualCurrentPage = 1;
let actualRowsPerPage = 10;
let actualColFilters = {};
let actualTrackingData = [];
let actualActiveTab = 'Pending'; // 'Pending' or 'Complete'
let actualActiveBuyer = ''; // '' means all buyers
let actualFilterStart = ''; // date range filter start
let actualFilterEnd = ''; // date range filter end
let actualTotalFromServer = 0;
let actualTotalPagesFromServer = 0;
let actualBuyersFromServer = [];
let actualSearchQuery = '';

