// ==========================================================
// UTILS: Helper Functions
// ==========================================================

// ===== PERFORMANCE: Cached column key lookup =====
// Old getColData was O(keys * columns) per call with repeated .toLowerCase().replace() 
// Called 1000s of times per page load — this was a massive bottleneck.
// New version: normalize once per unique key string, build a lookup map once per row object.
const _normCache = new Map();
function _norm(key) {
    if (_normCache.has(key)) return _normCache.get(key);
    const n = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    _normCache.set(key, n);
    return n;
}

const _rowMapCache = new WeakMap();
function _getRowMap(row) {
    if (_rowMapCache.has(row)) return _rowMapCache.get(row);
    const map = {};
    for (const rk in row) {
        map[_norm(rk)] = rk;
    }
    _rowMapCache.set(row, map);
    return map;
}

function getColData(row, keys) {
    const map = _getRowMap(row);
    for (const k of keys) {
        const actual = map[_norm(k)];
        if (actual !== undefined) {
            const val = row[actual];
            return (val === undefined || val === null) ? '' : val;
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

    function formatExcelWorksheet(ws) {
        if (!ws || !ws['!ref']) return;
        const range = XLSX.utils.decode_range(ws['!ref']);
        
        const headers = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
            headers[C] = cell ? String(cell.v).toLowerCase() : "";
        }
        
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = ws[cellRef];
                if (!cell || cell.v === undefined || cell.v === null || cell.v === '') continue;
                
                const headerLower = headers[C];
                const textCols = ['color', 'fabric construction', 'buyer', 'plan type'];
                const isText = textCols.some(t => headerLower.includes(t));
                const isDate = headerLower.includes('date') || headerLower === 'plan start' || headerLower === 'plan end' || headerLower === 'actual start' || headerLower === 'actual end';
                
                if (isText) {
                    cell.t = 's';
                    cell.v = String(cell.v);
                } else if (isDate) {
                    if (cell.v !== 'N/A' && cell.v !== 'Invalid Date' && cell.v !== '-') {
                        let d;
                        const numVal = Number(cell.v);
                        if (!isNaN(numVal) && numVal > 25569 && numVal < 60000) {
                            d = new Date(Math.round((numVal - 25569) * 86400 * 1000));
                        } else {
                            d = new Date(cell.v);
                        }
                        
                        if (!isNaN(d.getTime())) {
                            cell.t = 'd';
                            cell.v = d;
                            cell.z = 'dd/mm/yyyy';
                        } else {
                            cell.t = 's';
                            cell.v = String(cell.v);
                        }
                    } else {
                        cell.t = 's';
                    }
                } else {
                    if (cell.v !== 'N/A' && cell.v !== '-') {
                        const numStr = String(cell.v).replace(/,/g, '');
                        const num = Number(numStr);
                        if (!isNaN(num) && numStr.trim() !== '') {
                            cell.t = 'n';
                            cell.v = num;
                        } else {
                            cell.t = 's';
                            cell.v = String(cell.v);
                        }
                    } else {
                        cell.t = 's';
                    }
                }
            }
        }
    }
