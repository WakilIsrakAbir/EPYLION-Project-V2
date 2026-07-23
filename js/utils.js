// ==========================================================
// UTILS: Helper Functions
// ==========================================================
function getColData(row, keys) {
    for (let k of keys) {
        let norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (let rk in row) {
            if (rk.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) {
                let val = row[rk];
                return (val === undefined || val === null) ? '' : val;
            }
        }
    }
    return '';
}
function formatDateDisplay(dateStr) {
        if (!dateStr || dateStr === '-' || dateStr === 'N/A') return dateStr;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function formatExcelDate(val) {
        if (!val || val === 'N/A') return 'N/A';
        if (typeof val === 'number') {
            const d = new Date(Math.round((val - 25569) * 86400 * 1000));
            return formatDateDisplay(d);
        }
        if (typeof val === 'string') {
            const parsed = new Date(val);
            if (!isNaN(parsed.getTime())) return formatDateDisplay(val);
        }
        return val;
    }

    function hasBuyerPermission(buyersSetOrArray) {
        let userPerms = null;
        try { userPerms = JSON.parse(localStorage.getItem('permissions')); } catch(e){}
        const type = userPerms?.buyers?.accessType || 'all';
        const ids = userPerms?.buyers?.buyerIds || [];
        
        if (type === 'all') return true;
        if (type === 'none') return false;
        
        const arr = buyersSetOrArray instanceof Set ? Array.from(buyersSetOrArray) : buyersSetOrArray;
        if (!arr || arr.length === 0) return ids.includes('general');
        
        return arr.some(b => {
            const id = String(b).toLowerCase().replace(/[^a-z0-9]/g, '');
            return ids.includes(id);
        });
    }
