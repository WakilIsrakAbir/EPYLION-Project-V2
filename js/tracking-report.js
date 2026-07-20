// ==========================================================
// TRACKING REPORT: Department Reports
// ==========================================================
function loadTrackingReport(deptKey) {
    reportActualDeptKey = deptKey;
    const deptNames = { yd: 'YD', knitting: 'Knitting', dyeing: 'Dyeing', finishing: 'Finishing', delivery: 'Delivery' };
    const deptName = deptNames[deptKey] || deptKey;
    
    document.getElementById('actualReportPageHeader').innerText = deptName + ' Tracking Report';
    
    // Highlight sidebar
    setActiveSidebarMenu('menu-' + deptKey + '-actual-report');

    hideAllCoreViews();
    if (document.getElementById('planVsActualReportView')) document.getElementById('planVsActualReportView').classList.remove('hidden');
    
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

    const previousDeptKey = actualDeptKey;
    actualDeptKey = reportActualDeptKey;
    
    await fetchActualTrackingData();
    
    let dataToExport = actualTrackingData.filter(d => {
        if (statusType === 'Pending') {
            return !d.actualEnd || d.actualEnd.trim() === '';
        } else {
            return d.actualEnd && d.actualEnd.trim() !== '';
        }
    });
    
    let headers = ['SL', 'Order/Booking No.', 'Buyer'];
    let dynCol1 = '';
    let dynCol2 = '';
    
    if (reportActualDeptKey === 'knitting') { dynCol1 = 'Knit Prod.'; dynCol2 = 'Knit Bal.'; }
    else if (reportActualDeptKey === 'dyeing') { dynCol1 = 'Dyeing Prod.'; dynCol2 = 'Dyeing Bal.'; }
    else if (reportActualDeptKey === 'delivery') { dynCol1 = 'NetDeliveryQtyKgs'; dynCol2 = 'Deli. Bal.'; }
    
    if (dynCol1) { headers.push(dynCol1); headers.push(dynCol2); }
    headers = headers.concat(['Plan Start', 'Plan End', 'Actual Start', 'Actual End', 'Start Result', 'End Result', 'Fail Reason', 'Related Dept.']);
    
    let exportRows = dataToExport.map((d, index) => {
        let row = [
            index + 1,
            d.orderNo,
            d.buyer
        ];
        if (dynCol1) {
            row.push(d.extProd !== '' ? Number(d.extProd).toFixed(2) : '');
            row.push(d.extBal !== '' ? Number(d.extBal).toFixed(2) : '');
        }
        
        let startResult = '';
        if (d.planStart && d.actualStart) {
            startResult = (new Date(d.actualStart) <= new Date(d.planStart)) ? 'Pass' : 'Fail';
        }
        let endResult = '';
        if (d.planEnd && d.actualEnd) {
            endResult = (new Date(d.actualEnd) <= new Date(d.planEnd)) ? 'Pass' : 'Fail';
        }

        row = row.concat([
            d.planStart ? new Date(d.planStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
            d.planEnd ? new Date(d.planEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
            d.actualStart ? new Date(d.actualStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
            d.actualEnd ? new Date(d.actualEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
            startResult,
            endResult,
            d.failReason,
            d.relatedDept
        ]);
        return row;
    });
    
    const deptNames = { yd: 'YD', knitting: 'Knitting', dyeing: 'Dyeing', finishing: 'Finishing', delivery: 'Delivery' };
    const deptName = deptNames[reportActualDeptKey] || reportActualDeptKey;
    const fileName = `${deptName}_${statusType}_Tracking_Report`;

    if (formatType === 'Excel') {
        let wsData = [headers].concat(exportRows);
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        
        if (btn) {
            btn.innerHTML = btnText;
            btn.disabled = false;
        }
    } else if (formatType === 'PDF') {
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
            if (btn) {
                btn.innerHTML = btnText;
                btn.disabled = false;
            }
        });
    }

    actualDeptKey = previousDeptKey;
}

// ===== PLAN VS ACTUAL TRACKING FUNCTIONS =====

