// ==========================================================
// TRACKING REPORT: Department Reports
// ==========================================================
function loadTrackingReport(deptKey) {
    reportActualDeptKey = deptKey;
    const deptNames = { yd: 'YD', knitting: 'Knitting', dyeing: 'Dyeing', finishing: 'Finishing', delivery: 'Delivery', deliveryfloor: 'Delivery (Floor)' };
    const deptName = deptNames[deptKey] || deptKey;
    
    document.getElementById('actualReportPageHeader').innerText = deptName + ' Tracking Report';
    
    // Highlight sidebar
    setActiveSidebarMenu('menu-' + deptKey + '-actual-report');

    hideAllCoreViews();
    if (document.getElementById('planVsActualReportView')) document.getElementById('planVsActualReportView').classList.remove('hidden');
    
    const permsStr = localStorage.getItem('permissions');
    if (permsStr) {
        try {
            const permissions = JSON.parse(permsStr);
            if (permissions && permissions.downloads) {
                const d = permissions.downloads;
                const deptMap = { yd: 'YD', knitting: 'Knitting', dyeing: 'Dyeing', finishing: 'Finishing', delivery: 'Delivery', deliveryfloor: 'DeliveryFloor' };
                const key = 'tracking' + deptMap[deptKey];
                
                const toggleBtn = (id, hasPerm) => {
                    const btn = document.getElementById(id);
                    if (btn) btn.style.display = hasPerm ? '' : 'none';
                };
                
                toggleBtn('btnTrackingPendingExcel', d[key]);
                toggleBtn('btnTrackingPendingPdf', d[key]);
                toggleBtn('btnTrackingCompleteExcel', d[key]);
                toggleBtn('btnTrackingCompletePdf', d[key]);
            }
        } catch(e) {}
    }
    
    const uniqueId = `trackingReport_${deptKey}`;
    activeTabId = uniqueId;
    const menuTitle = deptName + ' Trck. Rep.';
    if (!openTabs.find(tab => tab.id === uniqueId)) openTabs.push({ id: uniqueId, title: menuTitle, dept: deptKey, mode: 'trackingReport' });
    renderTabs();
    if(typeof closeSidebarMobile === 'function') closeSidebarMobile();
}

async function downloadTrackingReport(statusType, formatType) {
    if (!reportActualDeptKey) return;
    
    // Show loading
    const btn = window.event ? window.event.currentTarget : null;
    let btnText = '';
    if (btn) {
        btnText = btn.innerHTML;
        btn.innerHTML = '<div class="inline-flex relative justify-center items-center w-4 h-4 mr-2 align-middle"><div class="absolute w-full h-full rounded-full border-2 border-white/30"></div><div class="absolute w-full h-full rounded-full border-2 border-transparent border-t-white border-r-white animate-spin"></div><div class="absolute w-2 h-2 rounded-full border-2 border-transparent border-b-white border-l-white animate-[spin_1.5s_linear_infinite_reverse]"></div></div> Loading...';
        btn.disabled = true;
    }

    if (formatType === 'Excel') {
        // Server-side Excel generation — direct download
        try {
            const res = await fetch(`${API_BASE}/api/orders/tracking-download/${reportActualDeptKey}?status=${statusType}`);
            if (!res.ok) {
                showToast('No data found for this report.');
                if (btn) { btn.innerHTML = btnText; btn.disabled = false; }
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const deptNames = { yd: 'YD', knitting: 'Knitting', dyeing: 'Dyeing', finishing: 'Finishing', delivery: 'Delivery', deliveryfloor: 'Delivery_Floor' };
            const deptName = deptNames[reportActualDeptKey] || reportActualDeptKey;
            a.download = `${deptName}_${statusType}_Tracking_Report.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Download error:', e);
            showToast('Download failed. Try again.');
        }
        if (btn) { btn.innerHTML = btnText; btn.disabled = false; }
    } else if (formatType === 'PDF') {
        // For PDF, still fetch data client-side and generate
        const previousDeptKey = actualDeptKey;
        actualDeptKey = reportActualDeptKey;
        await fetchAllActualTrackingDataForReport();
        
        let dataToExport = actualTrackingData.filter(d => {
            if (statusType === 'Pending') {
                return !d.actualEnd || d.actualEnd.trim() === '';
            } else {
                return d.actualEnd && d.actualEnd.trim() !== '';
            }
        });

        let headers = ['SL', 'Order/Booking No.', 'Buyer', 'Plan Start', 'Plan End', 'Actual Start', 'Actual End', 'Start Result', 'End Result', 'Fail Reason', 'Related Dept.'];
        
        let exportRows = dataToExport.map((d, idx) => {
            let startRes = '—';
            if (d.actualStart && d.planStart) {
                startRes = new Date(d.actualStart) <= new Date(d.planStart) ? 'Pass' : 'Fail';
            }
            let endRes = '—';
            if (d.actualEnd && d.planEnd) {
                endRes = new Date(d.actualEnd) <= new Date(d.planEnd) ? 'Pass' : 'Fail';
            }
            return [idx + 1, d.orderNo, d.buyer, formatDateDisplay(d.planStart), formatDateDisplay(d.planEnd), formatDateDisplay(d.actualStart), formatDateDisplay(d.actualEnd), startRes, endRes, d.failReason, d.relatedDept];
        });

        const deptNames2 = { yd: 'YD', knitting: 'Knitting', dyeing: 'Dyeing', finishing: 'Finishing', delivery: 'Delivery', deliveryfloor: 'Delivery (Floor)' };
        const deptName = deptNames2[reportActualDeptKey] || reportActualDeptKey;
        const fileName = `${deptName}_${statusType}_Tracking_Report`;

        let printDiv = document.createElement('div');
        printDiv.style.padding = '20px';
        printDiv.style.fontFamily = 'Arial, sans-serif';
        printDiv.innerHTML = `
            <h2 style="text-align:center; font-size: 18px; margin-bottom: 20px; color: #333;">${deptName} - ${statusType} Tracking Report</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                    <tr style="background-color: #2563eb; color: white;">
                        ${headers.map(h => `<th style="padding: 6px; border: 1px solid #ddd; text-align: left;">${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${exportRows.map(r => `
                        <tr>
                            ${r.map(cell => `<td style="padding: 6px; border: 1px solid #ddd; text-align: left;">${cell}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.body.appendChild(printDiv);
        
        const opt = {
            margin: 0.5,
            filename: `${fileName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(printDiv).save().then(() => {
            document.body.removeChild(printDiv);
            if (btn) { btn.innerHTML = btnText; btn.disabled = false; }
        });

        actualDeptKey = previousDeptKey;
    }
}

// ===== PLAN VS ACTUAL TRACKING FUNCTIONS =====

