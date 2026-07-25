// ==========================================================
// SAVE PLANNING: Save Fabric Planning Data
// ==========================================================
async function saveFabricPlanning() {
        const bookingNo = currentViewIndex;
        if (!bookingNo) return;

        if (document.querySelectorAll('#detFabricItemsBody .fabric-row').length === 0) {
            showToast("No fabric items to save! Please upload department data first.");
            return;
        }

        const currentDept = activeTabId.replace('_report', '');

        const existingData = groupedData[bookingNo];
        if (!existingData) return;

        let validationFailed = false;

        const userRole = localStorage.getItem('role');
        const isAdmin = userRole ? (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'approver') : false;

        const checkDownstreamConfirm = (dept, itemId) => {
            if (!existingData.dbData) return false;
            const dbData = existingData.dbData;
            if (dept === 'dyeing' && dbData.delivery) {
                const del = dbData.delivery.find(d => d.itemId === itemId);
                return del && del.planType === 'Confirm';
            }
            if (dept === 'knitting' && dbData.dyeing) {
                const dye = dbData.dyeing.find(d => d.itemId === itemId);
                return dye && dye.planType === 'Confirm';
            }
            return false;
        };

        document.querySelectorAll('#detFabricItemsBody .fabric-row').forEach(row => {
            const itemId = row.dataset.itemid;
            const newPlanType = row.querySelector('.row-plan-type').value;
            const newStartDate = row.querySelector('.row-start-date').value;
            const newEndDate = row.querySelector('.row-end-date').value;
            const yarnDateElemVal = row.querySelector('.row-yarn-date');
            const newYarnDate = yarnDateElemVal ? yarnDateElemVal.value : '';

            let existingItem = existingData.mergedItems ? existingData.mergedItems.find(m => m.itemId === itemId) : null;
            let wasConfirmed = existingItem && existingItem.planType === 'Confirm';

            if (wasConfirmed && !isAdmin && newPlanType !== 'Confirm') {
                showToast("Save failed: Only Admin can change a Confirmed plan!");
                validationFailed = true;
            }

            if (!isAdmin && checkDownstreamConfirm(currentDept, itemId)) {
                let wasStartDate = existingItem ? existingItem.startDate : '';
                let wasEndDate = existingItem ? existingItem.endDate : '';
                let wasPlanType = existingItem ? existingItem.planType : '';

                if (newStartDate !== wasStartDate || newEndDate !== wasEndDate || newPlanType !== wasPlanType) {
                    showToast(`Save failed: Cannot change ${currentDept} because the next department is already Confirmed!`);
                    validationFailed = true;
                }
            }

            if (newStartDate && newEndDate) {
                if (new Date(newStartDate) > new Date(newEndDate)) {
                    showToast("Save failed: End date cant be less than start date.");
                    validationFailed = true;
                }
            }

            let floorStart = '', floorEnd = '';
            if (row.querySelector('.row-floor-start')) {
                floorStart = row.querySelector('.row-floor-start').value;
                floorEnd = row.querySelector('.row-floor-end').value;
            }

            if (floorStart && floorEnd) {
                if (new Date(floorStart) > new Date(floorEnd)) {
                    showToast("Save failed: End date cant be less than start date.");
                    validationFailed = true;
                }
            }

            if (newPlanType === 'Confirm' || newPlanType === 'Tentative') {
                if (!newStartDate || !newEndDate) {
                    showToast("Save failed: Plan Type selected without Start and End dates.");
                    validationFailed = true;
                }
            }

            if (currentDept === 'knitting') {
                if (newStartDate && newYarnDate) {
                    if (new Date(newStartDate).setHours(0, 0, 0, 0) < new Date(newYarnDate).setHours(0, 0, 0, 0)) {
                        showToast("Save failed: Knitting Planning Start Date cannot be less than Yarn Date!");
                        validationFailed = true;
                    }
                }
            }

            if (currentDept === 'dyeing') {
                const knitStartElem = row.querySelector('.knit-start');
                const knitEndElem = row.querySelector('.knit-end');

                const knitStart = knitStartElem && knitStartElem.dataset ? knitStartElem.dataset.val : "";
                const knitEnd = knitEndElem && knitEndElem.dataset ? knitEndElem.dataset.val : "";

                if (newStartDate && knitStart && knitStart !== '-' && new Date(newStartDate).setHours(0, 0, 0, 0) < new Date(knitStart).setHours(0, 0, 0, 0)) {
                    showToast("Save failed: Dyeing Start Date cannot be before Knitting Start Date!");
                    validationFailed = true;
                }
                if (newEndDate && knitEnd && knitEnd !== '-' && new Date(newEndDate).setHours(0, 0, 0, 0) < new Date(knitEnd).setHours(0, 0, 0, 0)) {
                    showToast("Save failed: Dyeing End Date cannot be before Knitting End Date!");
                    validationFailed = true;
                }
            }

            if (currentDept === 'delivery') {
                const dyeStartElem = row.querySelector('.dye-start');
                const dyeEndElem = row.querySelector('.dye-end');

                const dyeStart = dyeStartElem && dyeStartElem.dataset ? dyeStartElem.dataset.val : "";
                const dyeEnd = dyeEndElem && dyeEndElem.dataset ? dyeEndElem.dataset.val : "";

                const hasInput = (newStartDate || newEndDate || (newPlanType && newPlanType !== 'Select'));
                const isDyeingBlank = (!dyeStart || dyeStart === '-' || dyeStart === '');

                if (hasInput && isDyeingBlank) {
                    showToast("Save failed: Cannot input Delivery. Dyeing plan is missing!");
                    validationFailed = true;
                }

                if (newStartDate && dyeStart && dyeStart !== '-' && new Date(newStartDate).setHours(0, 0, 0, 0) < new Date(dyeStart).setHours(0, 0, 0, 0)) {
                    showToast("Save failed: Delivery Start Date cannot be before Dyeing Start Date!");
                    validationFailed = true;
                }
                if (newEndDate && dyeEnd && dyeEnd !== '-' && new Date(newEndDate).setHours(0, 0, 0, 0) < new Date(dyeEnd).setHours(0, 0, 0, 0)) {
                    showToast("Save failed: Delivery End Date cannot be before Dyeing End Date!");
                    validationFailed = true;
                }
            }
        });

        if (validationFailed) return;

        const currentStatus = document.getElementById('detOrderStatus').value;
        const prevStatus = existingData.generalInfo.OrderStatus || 'On Process';
        if (currentStatus === 'Completed' && prevStatus !== 'Completed') {
            if (!confirm(`Are you sure you want to mark order '${bookingNo}' as Completed? It will be moved to the Completed List.`)) {
                document.getElementById('detOrderStatus').value = 'On Process';
                return;
            }
        }

        const allItemsMap = new Map();
        if (existingData.mergedItems) {
            existingData.mergedItems.forEach(item => allItemsMap.set(item.itemId, item));
        }

        document.querySelectorAll('#detFabricItemsBody .fabric-row').forEach(row => {
            const id = row.dataset.itemid;
            const itemData = JSON.parse(decodeURIComponent(row.dataset.itemdata));

            const newPlanType = row.querySelector('.row-plan-type').value;
            const newStartDate = row.querySelector('.row-start-date') ? row.querySelector('.row-start-date').value : '';
            const newEndDate = row.querySelector('.row-end-date') ? row.querySelector('.row-end-date').value : '';
            const yarnDateElem = row.querySelector('.row-yarn-date');
            const newYarnDate = yarnDateElem ? yarnDateElem.value : '';
            const newLimitation = row.querySelector('.row-limitation') ? row.querySelector('.row-limitation').value : '';
            const newRemarks = row.querySelector('.row-remarks') ? row.querySelector('.row-remarks').value : '';

            let floorStart = '', floorEnd = '', floorPlan = '';
            if (row.querySelector('.row-floor-start')) {
                floorStart = row.querySelector('.row-floor-start').value;
                floorEnd = row.querySelector('.row-floor-end').value;
                floorPlan = row.querySelector('.row-floor-plan').value;
            }

            if (row.querySelector('.row-unit')) itemData.Unit = row.querySelector('.row-unit').value;
            if (row.querySelector('.row-process')) {
                let pVal = row.querySelector('.row-process').value;
                itemData.ProcessName = pVal;
                itemData['Process Name'] = pVal;
            }

            allItemsMap.set(id, {
                itemId: id, itemData: itemData,
                startDate: newStartDate, endDate: newEndDate,
                planType: newPlanType, limitation: newLimitation, remarks: newRemarks,
                floorStartDate: floorStart, floorEndDate: floorEnd, floorPlanType: floorPlan,
                yarnDate: newYarnDate
            });

            let target = existingData.mergedItems.find(m => m.itemId === id);
            if (target) {
                target.planType = newPlanType; target.startDate = newStartDate; target.endDate = newEndDate;
                target.limitation = newLimitation; target.remarks = newRemarks;
                target.floorStartDate = floorStart; target.floorEndDate = floorEnd; target.floorPlanType = floorPlan;
                target.yarnDate = newYarnDate;
            }
        });

        const fabricItemsArr = Array.from(allItemsMap.values());

        const compDate = currentStatus === 'Completed' ? new Date().toISOString() : null;
        if (existingData.generalInfo) {
            existingData.generalInfo.OrderStatus = currentStatus;
            existingData.generalInfo.CompletedDate = compDate;
        }

        const payload = {
            orderNo: bookingNo, department: currentDept, fabricItems: fabricItemsArr,
            orderStatus: currentStatus, completedDate: compDate
        };

        let hasSelect = false, hasTentative = false, confirmCount = 0;
        let totalItems = existingData.mergedItems.length;

        existingData.mergedItems.forEach(item => {
            if (!item.planType || item.planType === '' || item.planType === 'Select') hasSelect = true;
            else if (item.planType === 'Tentative') hasTentative = true;
            else if (item.planType === 'Confirm') confirmCount++;
        });

        existingData.isPending = false; existingData.isConfirm = false; existingData.isTentative = false;

        if (hasSelect) existingData.isPending = true;
        else if (hasTentative) existingData.isTentative = true;
        else if (confirmCount === totalItems && totalItems > 0) existingData.isConfirm = true;
        else existingData.isPending = true;

        renderMainTable();
        closeDetailedView();
        showToast(`Saving ${bookingNo}...`);

        try {
            const res = await fetch('https://abir-backend-api.onrender.com/api/files/save-dates', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast(`${bookingNo} Saved Successfully!`);
                if (!existingData.dbData) existingData.dbData = {};
                existingData.dbData[currentDept] = fabricItemsArr;
                existingData.dbData[`${currentDept}Status`] = currentStatus;
                existingData.dbData[`${currentDept}CompletedDate`] = compDate;
                markDataDirty(); // Invalidate cache so next navigation re-fetches
            } else showToast(`Failed to save ${bookingNo}!`);
        } catch (e) { showToast(`Server Error!`) }
    }

