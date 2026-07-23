const BUYERS = [
    {id:'hm', name:'H&M'}, {id:'next', name:'NEXT'}, {id:'marks', name:'M&S'}, {id:'primark', name:'Primark'},
    {id:'cna', name:'C&A'}, {id:'zara', name:'Zara'}, {id:'target', name:'Target'}, {id:'walmart', name:'Walmart'},
    {id:'tesco', name:'Tesco'}, {id:'matalan', name:'Matalan'}, {id:'gap', name:'GAP'}, {id:'lidl', name:'Lidl'}
  ];
  
  const MENU_GROUPS = [
    {key:'dataManagement', title:'Data Management', icon:'fa-database', items:[
      ['view','View Data Management'], ['uploadGeneral','Upload General Data'], ['uploadYD','Upload YD Data'],
      ['uploadKnitting','Upload Knitting Data'], ['uploadDyeing','Upload Dyeing Data'], ['uploadFinishing','Upload Finishing Data'],
      ['uploadDelivery','Upload Delivery Data'], ['viewFiles','View Uploaded Files'], ['deleteFiles','Delete Uploaded Files'], ['wipeSystem','Wipe System Data']
    ]},
    {key:'orderManagement', title:'Order Management', icon:'fa-boxes-stacked', items:[
      ['yd','YD Plan'], ['knitting','Knitting Plan'], ['dyeing','Dyeing Plan'], ['finishing','Finishing Plan'], ['delivery','Delivery Plan']
    ]},
    {key:'reports', title:'Reports', icon:'fa-chart-column', items:[
      ['yd','YD Report'], ['knitting','Knitting Report'], ['dyeing','Dyeing Report'], ['finishing','Finishing Report'], ['delivery','Delivery Report'], ['orderStatus','Order Status']
    ]},
    {key:'actualTracking', title:'Plan vs Actual Tracking', icon:'fa-scale-balanced', items:[
      ['yd','YD'], ['knitting','Knitting'], ['dyeing','Dyeing'], ['finishing','Finishing'], ['delivery','Delivery']
    ]},
    {key:'trackingReports', title:'Tracking Reports', icon:'fa-file-waveform', items:[
      ['yd','YD'], ['knitting','Knitting'], ['dyeing','Dyeing'], ['finishing','Finishing'], ['delivery','Delivery']
    ]},
    {key:'loadCalculation', title:'Load Calculation', icon:'fa-calculator', items:[
      ['detailed','Detailed Load'], ['summary','Buyer-wise Summary'], ['knitting','Knitting Load'], ['dyeing','Dyeing Load'], ['delivery','Delivery Load']
    ]},
    {key:'manageUsers', title:'Manage Users', icon:'fa-users-gear', items:[
      ['view','View Users'], ['create','Create Users'], ['edit','Edit Users'], ['delete','Delete Users'], ['resetPassword','Reset Password'], ['changePermissions','Change Permissions']
    ]}
  ];
  
  const ACTION_GROUPS = [
    {title:'Planning Save Permissions', icon:'fa-floppy-disk', items:[
      ['saveYD','Save YD Planning'], ['saveKnitting','Save Knitting Planning'], ['saveDyeing','Save Dyeing Planning'],
      ['saveFinishing','Save Finishing Planning'], ['saveDelivery','Save Delivery Planning'], ['saveActual','Save Plan vs Actual']
    ]},
    {title:'Order Workflow Actions', icon:'fa-arrows-rotate', items:[
      ['confirmPlan','Move to Confirm'], ['tentativePlan','Move to Tentative'], ['completeOrder','Mark Order Completed'],
      ['reopenOrder','Reopen Completed Order'], ['changeOrderStatus','Change Order Status'], ['deletePlan','Delete Planning Data']
    ]},
    {title:'Data Editing Actions', icon:'fa-pen-to-square', items:[
      ['editDates','Edit Production Dates'], ['editActualQty','Edit Actual Quantity'], ['editRemarks','Edit Internal Remarks'],
      ['bulkUpdate','Bulk Update'], ['globalSearch','Global Booking Search']
    ]}
  ];
  
  const COLUMN_GROUPS = [
    {title:'General Order Columns', items:[
      ['bookingNo','Order / Booking No.'], ['bookingDate','Booking Date'], ['buyer','Buyer'], ['buyerTeam','Buyer Team'],
      ['orderQty','Order Quantity'], ['status','Status'], ['bookingUnit','Booking Unit'], ['finalConfirmation','Final Confirmation']
    ]},
    {title:'Shipment & Planning Columns', items:[
      ['eventDay','Event Day'], ['firstShipment','1st Shipment Date'], ['lastShipment','Last Shipment Date'],
      ['productionDate','Production Date'], ['planQty','Plan Quantity'], ['actualQty','Actual Quantity'], ['delayDays','Delay Days']
    ]},
    {title:'Sensitive / Internal Columns', items:[
      ['internalRemarks','Internal Remarks'], ['commercialInfo','Commercial Information'], ['uploadedBy','Uploaded By'],
      ['updatedBy','Updated By'], ['createdAt','Created At'], ['updatedAt','Updated At']
    ]}
  ];
  
  const DOWNLOAD_GROUPS = [
    {title:'Table & Report Export', items:[
      ['currentTable','Export Current Table'], ['confirmedData','Export Confirmed Data'], ['tentativeData','Export Tentative Data'],
      ['completedData','Export Completed Data'], ['combinedReport','Combined Report'], ['orderStatusPdf','Order Status PDF']
    ]},
    {title:'Load Calculation Downloads', items:[
      ['knittingLoad','Knitting Detailed Load'], ['dyeingLoad','Dyeing Detailed Load'], ['deliveryLoad','Delivery Detailed Load'],
      ['knittingSummary','Knitting Summary'], ['dyeingSummary','Dyeing Summary'], ['deliverySummary','Delivery Summary']
    ]},
    {title:'Download Formats', items:[['excel','Excel (.xlsx)'], ['pdf','PDF'], ['print','Print']]}
  ];
  
  function emptyPermissions() {
    const menus = {}; MENU_GROUPS.forEach(g => { menus[g.key] = {}; g.items.forEach(([k]) => menus[g.key][k] = false); });
    const actions = {}; ACTION_GROUPS.forEach(g => g.items.forEach(([k]) => actions[k] = false));
    const columns = {}; COLUMN_GROUPS.forEach(g => g.items.forEach(([k]) => columns[k] = false));
    const downloads = {}; DOWNLOAD_GROUPS.forEach(g => g.items.forEach(([k]) => downloads[k] = false));
    return { menus, actions, buyers:{accessType:'all', buyerIds:[]}, columns, downloads };
  }
  
  function makeTemplate(role) {
    const p = emptyPermissions();
    const setMenu = (group, values=true) => Object.keys(p.menus[group]).forEach(k => p.menus[group][k] = values);
    const setAllObj = (obj, value=true) => Object.keys(obj).forEach(k => obj[k] = value);
    if (role === 'Admin') {
      Object.keys(p.menus).forEach(k => setMenu(k)); setAllObj(p.actions); setAllObj(p.columns); setAllObj(p.downloads); p.buyers.accessType='all';
    } else if (role === 'Approver') {
      ['orderManagement','reports','actualTracking','trackingReports','loadCalculation'].forEach(setMenu);
      ['confirmPlan','tentativePlan','completeOrder','reopenOrder','changeOrderStatus','editDates','editActualQty','editRemarks','globalSearch'].forEach(k=>p.actions[k]=true);
      setAllObj(p.columns); setAllObj(p.downloads); p.downloads.currentTable=true; p.buyers.accessType='all';
    } else if (role === 'Planner') {
      ['orderManagement','reports','actualTracking','loadCalculation'].forEach(setMenu);
      p.menus.dataManagement.viewFiles=true;
      ['saveYD','saveKnitting','saveDyeing','saveFinishing','saveDelivery','saveActual','tentativePlan','editDates','editActualQty','editRemarks','globalSearch'].forEach(k=>p.actions[k]=true);
      Object.keys(p.columns).forEach(k=>p.columns[k]=true); ['commercialInfo','uploadedBy','updatedBy'].forEach(k=>p.columns[k]=false);
      ['currentTable','confirmedData','tentativeData','excel','print'].forEach(k=>p.downloads[k]=true); p.buyers.accessType='selected'; p.buyers.buyerIds=['hm','next','marks'];
    } else {
      ['reports','trackingReports'].forEach(setMenu);
      ['globalSearch'].forEach(k=>p.actions[k]=true);
      ['bookingNo','bookingDate','buyer','buyerTeam','orderQty','status','eventDay','firstShipment','lastShipment','planQty'].forEach(k=>p.columns[k]=true);
      p.buyers.accessType='selected'; p.buyers.buyerIds=['hm','next'];
    }
    return p;
  }
  
  let users = [];
  let createPermissions = makeTemplate('Viewer');
  let permissionDraft = null;
  let permissionTarget = null;
  let pendingEditPermissions = null;
  let toastTimeout;
  
  function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = msg;
    t.classList.remove('translate-x-[140%]');
    
    const icon = document.getElementById('toastIcon');
    if (isError) {
      t.classList.replace('bg-slate-900', 'bg-red-600');
      icon.className = 'fa-solid fa-triangle-exclamation text-white';
    } else {
      t.classList.replace('bg-red-600', 'bg-slate-900');
      icon.className = 'fa-solid fa-circle-check text-emerald-400';
    }
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        t.classList.add('translate-x-[140%]');
    }, 3000);
  }
  
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function escapeHtml(unsafe) { return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  function formatDate(dateStr) { 
      if (!dateStr || dateStr === 'Never') return 'Never';
      const d = new Date(dateStr); 
      return isNaN(d) ? dateStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); 
  }
  
  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');
    document.getElementById('themeIcon').className = isDark ? 'fa-solid fa-sun text-amber-400' : 'fa-solid fa-moon text-slate-600';
  }

  function togglePassword(id, btn) {
    const inp = document.getElementById(id);
    if (inp.type === 'password') { inp.type = 'text'; btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>'; }
    else { inp.type = 'password'; btn.innerHTML = '<i class="fa-regular fa-eye"></i>'; }
  }
  
  function logout() {
      localStorage.clear();
      window.location.href = 'login.html';
  }
  
  function checkAdminAndLoadUsers() {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const username = localStorage.getItem('username');
  
      if (!token) { window.location.href = 'login.html'; return; }
      if (role !== 'Admin') {
          alert('Access Denied! Only Admins can manage users.');
          window.location.href = 'index.html';
          return;
      }
  
      document.getElementById('displayUsername').innerText = username;
      document.getElementById('displayRole').innerText = role;
      document.getElementById('headerInitials').innerText = username ? username.charAt(0).toUpperCase() : 'A';
      
      const isDark = document.documentElement.classList.contains('dark');
      document.getElementById('themeIcon').className = isDark ? 'fa-solid fa-sun text-amber-400' : 'fa-solid fa-moon text-slate-600';
      
      loadUsers();
  }
  
  async function loadUsers(silent = false) {
    if (!silent) {
      document.getElementById('usersLoadingState').classList.remove('hidden');
      document.getElementById('usersErrorState').classList.add('hidden');
      document.getElementById('usersGrid').classList.add('hidden');
      document.getElementById('usersEmptyState').classList.add('hidden');
    }

    const token = localStorage.getItem('token');

    if (!token) return;

    try {
      const res = await fetch('https://abir-backend-api.onrender.com/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const rawUsers = await res.json();
      
      const now = Date.now();
      const liveThreshold = 2 * 60 * 1000; // 2 minutes

      users = rawUsers.map(u => {
        let isLive = false;
        if (u.lastActive) {
           isLive = (now - new Date(u.lastActive).getTime()) < liveThreshold;
        }

        return {
          id: u._id,
          username: u.username,
          role: u.role,
          status: u.status || 'active',
          createdAt: new Date(u.createdAt).toLocaleDateString(),
          lastLogin: u.lastActive ? new Date(u.lastActive).toLocaleString() : 'Never',
          isLive: isLive,
          passwordHint: u.password || 'Hidden',
          permissions: u.permissions || makeTemplate(u.role)
        };
      });

      renderUsers();
      updateDashboardStats();

      if (!silent) {
        document.getElementById('usersLoadingState').classList.add('hidden');
        document.getElementById('usersGrid').classList.remove('hidden');
      }

      if (!liveUpdateInterval) {
        liveUpdateInterval = setInterval(() => {
            loadUsers(true);
        }, 15000);
      }

    } catch (err) {
      console.error(err);
      if (!silent) {
        document.getElementById('usersLoadingState').classList.add('hidden');
        document.getElementById('usersErrorState').classList.remove('hidden');
      }
    }
  }
  
  function countTrue(obj) { return Object.values(obj).filter(Boolean).length; }
  function flattenMenuCount(menus) { return Object.values(menus).reduce((n,g)=>n+countTrue(g),0); }
  function totalMenuCount() { return MENU_GROUPS.reduce((n,g)=>n+g.items.length,0); }
  function totalActionCount() { return ACTION_GROUPS.reduce((n,g)=>n+g.items.length,0); }
  function totalColumnCount() { return COLUMN_GROUPS.reduce((n,g)=>n+g.items.length,0); }
  function totalDownloadCount() { return DOWNLOAD_GROUPS.reduce((n,g)=>n+g.items.length,0); }
  
  function permissionCounts(p) {
    return {menu:flattenMenuCount(p.menus), action:countTrue(p.actions), column:countTrue(p.columns), download:countTrue(p.downloads)};
  }
  
  function permissionSummaryHtml(p) {
    const c = permissionCounts(p);
    const buyerText = p.buyers.accessType === 'all' ? 'All buyers' : p.buyers.accessType === 'none' ? 'No buyer' : `${p.buyers.buyerIds.length} selected`;
    return `<div class="grid grid-cols-2 gap-2">
      <div><span class="text-slate-500">Menu access</span><p class="font-black">${c.menu}/${totalMenuCount()}</p></div>
      <div><span class="text-slate-500">Save/actions</span><p class="font-black">${c.action}/${totalActionCount()}</p></div>
      <div><span class="text-slate-500">Buyer access</span><p class="font-black">${buyerText}</p></div>
      <div><span class="text-slate-500">Downloads</span><p class="font-black">${c.download}/${totalDownloadCount()}</p></div>
    </div>`;
  }
  
  function updateCreatePermissionSummary() { document.getElementById('createPermissionSummary').innerHTML = permissionSummaryHtml(createPermissions); }
  
  function applyTemplateFromRole(scope) {
    const role = document.getElementById(scope === 'create' ? 'createRole' : 'editRole').value;
    if (scope === 'create') {
      document.getElementById('createTemplate').value = role;
      createPermissions = makeTemplate(role);
      updateCreatePermissionSummary();
    }
  }
  function applySelectedTemplate(scope) {
    if (scope !== 'create') return;
    const val = document.getElementById('createTemplate').value;
    if (val !== 'Custom') {
      createPermissions = makeTemplate(val);
      document.getElementById('createRole').value = val;
      updateCreatePermissionSummary();
      showToast(`${val} permission template applied.`);
    }
  }
  
  function updateDashboardStats() {
    document.getElementById('statTotal').textContent = users.length;
    const liveCount = users.filter(u => u.isLive).length;
    document.getElementById('statActive').textContent = liveCount;
    document.getElementById('statAdmins').textContent = users.filter(u=>u.role==='Admin').length;
    document.getElementById('statCustom').textContent = users.filter(u=>JSON.stringify(u.permissions)!==JSON.stringify(makeTemplate(u.role))).length;
    document.getElementById('statBuyerRestricted').textContent = users.filter(u=>u.permissions.buyers.accessType==='selected').length;
  }
  
  function buyerNames(p) {
    if (p.buyers.accessType==='all') return 'All buyers';
    if (p.buyers.accessType==='none') return 'No buyer access';
    return p.buyers.buyerIds.map(id=>BUYERS.find(b=>b.id===id)?.name).filter(Boolean).join(', ') || 'None selected';
  }
  
  function renderUsers() {
    const q = document.getElementById('userSearch').value.trim().toLowerCase();
    const role = document.getElementById('roleFilter').value;
    const status = document.getElementById('statusFilter').value;
    const filtered = users.filter(u => (!q || u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)) && (role==='all'||u.role===role) && (status==='all'||u.status===status));
    const root = document.getElementById('userDirectory');
    if (!filtered.length) {
      root.innerHTML = `<div class="lg:col-span-2 2xl:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#181c25]"><i class="fa-solid fa-users-slash text-4xl text-slate-300"></i><p class="mt-3 font-bold">No users matched your filter.</p></div>`;
      updateDashboardStats(); return;
    }
    root.innerHTML = filtered.map(user => {
      const c = permissionCounts(user.permissions);
      const initials = user.username.slice(0,2).toUpperCase();
      const isActive = user.status==='active';
      return `<article class="permission-card fade-in relative rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-[#181c25]">
        <div class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex gap-3 min-w-0">
              <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center font-black shrink-0 relative">
                ${initials}
                ${user.isLive ? '<span class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#181c25]"></span>' : ''}
              </div>
              <div class="min-w-0">
                <h3 class="font-black truncate" title="${escapeHtml(user.username)}">${escapeHtml(user.username)}</h3>
                <div class="flex flex-wrap items-center gap-1.5 mt-1">
                  <span class="role-pill text-[10px] font-black px-2 py-1 rounded-full" data-role="${user.role}">${user.role}</span>
                  <span class="text-[10px] font-bold px-2 py-1 rounded-full ${isActive?'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300':'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}">${isActive?'ACTIVE':'INACTIVE'}</span>
                </div>
              </div>
            </div>
            <button onclick="deleteUser('${user.id}', '${escapeHtml(user.username)}')" class="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30" title="Delete User"><i class="fa-solid fa-trash-can"></i></button>
          </div>
  
          <div class="grid grid-cols-4 gap-2 mt-4">
            <div class="rounded-lg bg-slate-50 p-2 text-center dark:bg-[#11151d]"><p class="text-[10px] text-slate-500">Menus</p><p class="font-black text-sm">${c.menu}</p></div>
            <div class="rounded-lg bg-slate-50 p-2 text-center dark:bg-[#11151d]"><p class="text-[10px] text-slate-500">Actions</p><p class="font-black text-sm">${c.action}</p></div>
            <div class="rounded-lg bg-slate-50 p-2 text-center dark:bg-[#11151d]"><p class="text-[10px] text-slate-500">Columns</p><p class="font-black text-sm">${c.column}</p></div>
            <div class="rounded-lg bg-slate-50 p-2 text-center dark:bg-[#11151d]"><p class="text-[10px] text-slate-500">Downloads</p><p class="font-black text-sm">${c.download}</p></div>
          </div>
  
          <div class="mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p class="text-[10px] uppercase font-black text-slate-400">Buyer Visibility</p>
            <p class="text-xs font-bold mt-1 truncate" title="${buyerNames(user.permissions)}"><i class="fa-solid fa-tags text-amber-500 mr-1"></i>${buyerNames(user.permissions)}</p>
          </div>
  
          <div class="mt-3 flex justify-between text-[11px] text-slate-500">
            <span>Created: ${formatDate(user.createdAt)}</span>
            <div class="flex items-center gap-2">
                <code class="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">${user.passwordHint}</code>
                <button onclick="navigator.clipboard.writeText('${user.passwordHint}'); showToast('Password copied');" class="hover:text-blue-500"><i class="fa-regular fa-copy"></i></button>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 border-t border-slate-200 dark:border-slate-800">
          <button onclick="openEditUser('${user.id}')" class="py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 border-r border-slate-200 dark:border-slate-800"><i class="fa-solid fa-pen mr-1"></i>Edit Profile</button>
          <button onclick="openPermissionBuilder('${user.id}')" class="py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"><i class="fa-solid fa-sliders mr-1"></i>Permissions</button>
        </div>
      </article>`;
    }).join('');
    updateDashboardStats();
  }
  
  async function createUser(event) {
    event.preventDefault();
    const username = document.getElementById('createUsername').value.trim();
    const password = document.getElementById('createPassword').value;
    const role = document.getElementById('createRole').value;
    const status = document.getElementById('createStatus').value;
    
    if (username.length < 3) return showToast('Username must contain at least 3 characters.', true);
    if (password.length < 6) return showToast('Password must contain at least 6 characters.', true);
    
    const btn = document.getElementById('createBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Creating...';
  
    try {
        const response = await fetch('https://abir-backend-api.onrender.com/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, password, role, status, 
                permissions: createPermissions 
            })
        });
  
        const data = await response.json();
        if (response.ok) {
            showToast('User Created Successfully!');
            event.target.reset(); 
            document.getElementById('createRole').value='Viewer'; 
            document.getElementById('createTemplate').value='Viewer';
            createPermissions=makeTemplate('Viewer'); 
            updateCreatePermissionSummary();
            loadUsers();
        } else {
            showToast(data.message || 'Failed to create user.', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast("Server error during creation.", true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
  }
  
  async function deleteUser(userId, username) {
      if (confirm(`Are you absolutely sure you want to delete '${username}'? This action cannot be undone.`)) {
          try {
              const response = await fetch(`https://abir-backend-api.onrender.com/api/auth/user/${userId}`, {
                  method: 'DELETE'
              });
              if (response.ok) {
                  showToast('User deleted successfully!');
                  loadUsers();
              } else {
                  showToast('Failed to delete user.', true);
              }
          } catch (error) {
              console.error('Error deleting user:', error);
              showToast('Server error during deletion.', true);
          }
      }
  }
  
  function openEditUser(id) {
    const u=users.find(x=>x.id===id); if(!u)return;
    document.getElementById('editUserId').value=id;
    document.getElementById('editUsername').value=u.username;
    document.getElementById('editRole').value=u.role;
    document.getElementById('editStatus').value=u.status;
    document.getElementById('editPassword').value='';
    document.getElementById('editUserSubtitle').textContent=`Editing ${u.username}`;
    pendingEditPermissions=clone(u.permissions);
    document.getElementById('editUserModal').classList.remove('hidden');
  }
  function closeEditUserModal(){document.getElementById('editUserModal').classList.add('hidden'); pendingEditPermissions=null;}
  
  function openPermissionBuilderForEditingUser(){ 
      permissionTarget='edit-buffer'; 
      permissionDraft=clone(pendingEditPermissions); 
      document.getElementById('permissionModalTitle').textContent='Edit User Permissions'; 
      renderPermissionBuilder(); 
      document.getElementById('permissionModal').classList.remove('hidden'); 
  }
  
  async function saveUserProfile(event){
    event.preventDefault(); 
    const id=document.getElementById('editUserId').value; 
    const u=users.find(x=>x.id===id); if(!u)return;
    const username=document.getElementById('editUsername').value.trim(); 
    const password=document.getElementById('editPassword').value;
    
    const payload = {
        username,
        role: document.getElementById('editRole').value,
        status: document.getElementById('editStatus').value,
        permissions: pendingEditPermissions ? pendingEditPermissions : u.permissions
    };
    if (password) payload.password = password;
  
    const btn = document.getElementById('editBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  
    try {
        const response = await fetch(`https://abir-backend-api.onrender.com/api/auth/user/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showToast('User profile updated.');
            closeEditUserModal();
            loadUsers();
        } else {
            showToast('Update failed. Backend may not support PUT /api/auth/user/:id', true);
        }
    } catch (e) {
        showToast('Server error during update.', true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
  }
  
  function openPermissionBuilder(target) {
    permissionTarget=target;
    if(target==='create') { 
        permissionDraft=clone(createPermissions); 
        document.getElementById('permissionModalTitle').textContent='Configure New User Permissions'; 
    } else { 
        const u=users.find(x=>x.id===target); if(!u)return; 
        permissionDraft=clone(u.permissions); 
        document.getElementById('permissionModalTitle').textContent=`Permissions: ${u.username}`; 
    }
    renderPermissionBuilder(); 
    document.getElementById('permissionModal').classList.remove('hidden');
  }
  
  function closePermissionBuilder(){document.getElementById('permissionModal').classList.add('hidden'); permissionDraft=null; permissionTarget=null;}
  
  async function savePermissionBuilder(){
    syncDraftFromDom();
    if(permissionTarget==='create'){
        createPermissions=clone(permissionDraft); 
        document.getElementById('createTemplate').value='Custom'; 
        updateCreatePermissionSummary();
        document.getElementById('permissionModal').classList.add('hidden'); 
        showToast('Permissions applied to new user form.');
    }
    else if(permissionTarget==='edit-buffer'){
        pendingEditPermissions=clone(permissionDraft);
        document.getElementById('permissionModal').classList.add('hidden'); 
    }
    else {
        const u=users.find(x=>x.id===permissionTarget); 
        if(u){
            const payload = { permissions: clone(permissionDraft) };
            try {
                const response = await fetch(`https://abir-backend-api.onrender.com/api/auth/user/${u.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if(response.ok) {
                    showToast('Permissions updated directly.');
                    loadUsers();
                } else {
                    showToast('Backend update failed.', true);
                }
            } catch(e) {
                showToast('Server error.', true);
            }
        }
        document.getElementById('permissionModal').classList.add('hidden');
    }
    permissionDraft=null; permissionTarget=null;
  }
  
  function showPermissionTab(tabId, btn) {
      document.querySelectorAll('.permission-tab').forEach(t => t.classList.add('hidden'));
      document.getElementById(`permissionTab-${tabId}`).classList.remove('hidden');
      document.querySelectorAll('.permission-nav').forEach(b => {
          b.classList.remove('active', 'bg-blue-600', 'text-white');
          b.classList.add('hover:bg-slate-200', 'dark:hover:bg-slate-800');
      });
      btn.classList.remove('hover:bg-slate-200', 'dark:hover:bg-slate-800');
      btn.classList.add('active', 'bg-blue-600', 'text-white');
  }
  
  function renderPermissionBuilder(){
    renderMenuPermissions(); renderActionPermissions(); renderBuyerPermissions(); renderColumnPermissions(); renderDownloadPermissions();
    showPermissionTab('menu', document.querySelector('.permission-nav[data-tab="menu"]'));
  }
  
  function switchRow(path, key, label, checked, description='') {
    const id=`perm-${path}-${key}`.replaceAll('.','-');
    return `<label class="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-700 cursor-pointer">
      <span class="min-w-0"><span class="block text-sm font-bold">${label}</span>${description?`<span class="block text-[11px] text-slate-500 mt-0.5">${description}</span>`:''}</span>
      <span class="switch"><input id="${id}" data-path="${path}" data-key="${key}" type="checkbox" ${checked?'checked':''} class="perm-checkbox"><span class="slider"></span></span>
    </label>`;
  }
  
  function renderMenuPermissions(){
    document.getElementById('permissionTab-menu').innerHTML=`<div><h3 class="font-black text-lg">Menu & Submenu Access</h3></div>`+MENU_GROUPS.map(g=>`
    <div class="permission-card rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="px-4 py-3 bg-slate-50 dark:bg-[#11151d] flex items-center justify-between"><h4 class="font-black text-sm"><i class="fa-solid ${g.icon} text-blue-500 w-5 mr-2"></i>${g.title}</h4></div>
      <div class="p-3 grid md:grid-cols-2 gap-2">${g.items.map(([k,l])=>switchRow(`menus.${g.key}`,k,l,permissionDraft.menus[g.key][k])).join('')}</div>
    </div>`).join('');
  }
  function renderActionPermissions(){
    document.getElementById('permissionTab-actions').innerHTML=`<div><h3 class="font-black text-lg">Save Data & Action Permissions</h3></div>`+ACTION_GROUPS.map(g=>`<div class="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"><div class="px-4 py-3 bg-slate-50 dark:bg-[#11151d]"><h4 class="font-black text-sm"><i class="fa-solid ${g.icon} text-emerald-500 w-5 mr-2"></i>${g.title}</h4></div><div class="p-3 grid md:grid-cols-2 gap-2">${g.items.map(([k,l])=>switchRow('actions',k,l,permissionDraft.actions[k])).join('')}</div></div>`).join('');
  }
  function buyerAccessChanged(val) {
      permissionDraft.buyers.accessType = val;
      document.getElementById('buyerSelectionPanel').className = val === 'selected' ? 'rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden' : 'hidden';
  }
  function setAllBuyers(check) {
      document.querySelectorAll('.buyer-checkbox').forEach(cb => cb.checked = check);
  }
  function renderBuyerPermissions(){
    const type=permissionDraft.buyers.accessType;
    document.getElementById('permissionTab-buyers').innerHTML=`
      <div><h3 class="font-black text-lg">Buyer-wise Data Visibility</h3></div>
      <div class="grid sm:grid-cols-3 gap-3">
        ${[['all','All Buyers','Full buyer visibility'],['selected','Selected Buyers','Only checked buyers'],['none','No Buyer Access','Hide buyer data']].map(([v,t,d])=>`<label class="rounded-xl border p-4 cursor-pointer ${type===v?'border-blue-500 bg-blue-50 dark:bg-blue-950/20':'border-slate-200 dark:border-slate-700'}"><input type="radio" name="buyerAccessType" value="${v}" ${type===v?'checked':''} onchange="buyerAccessChanged(this.value)" class="mr-2"><span class="font-black text-sm">${t}</span><p class="text-[11px] text-slate-500 mt-1">${d}</p></label>`).join('')}
      </div>
      <div id="buyerSelectionPanel" class="${type==='selected'?'':'hidden'} rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div class="p-3 bg-slate-50 dark:bg-[#11151d] flex flex-col sm:flex-row gap-2 justify-between"><div><h4 class="font-black text-sm">Select Buyers</h4></div><div class="flex gap-2"><button type="button" onclick="setAllBuyers(true)" class="px-3 py-1.5 rounded border text-xs font-bold">Select All</button><button type="button" onclick="setAllBuyers(false)" class="px-3 py-1.5 rounded border text-xs font-bold">Clear</button></div></div>
        <div class="p-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">${BUYERS.map(b=>`<label class="flex items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700"><input data-buyer-id="${b.id}" type="checkbox" ${permissionDraft.buyers.buyerIds.includes(b.id)?'checked':''} class="w-4 h-4 accent-blue-600 buyer-checkbox"><span class="font-bold text-sm">${b.name}</span></label>`).join('')}</div>
      </div>`;
  }
  function renderColumnPermissions(){
    document.getElementById('permissionTab-columns').innerHTML=`<div><h3 class="font-black text-lg">Table Column Visibility</h3></div>`+COLUMN_GROUPS.map(g=>`<div class="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"><div class="px-4 py-3 bg-slate-50 dark:bg-[#11151d]"><h4 class="font-black text-sm">${g.title}</h4></div><div class="p-3 grid md:grid-cols-2 gap-2">${g.items.map(([k,l])=>switchRow('columns',k,l,permissionDraft.columns[k])).join('')}</div></div>`).join('');
  }
  function renderDownloadPermissions(){
    document.getElementById('permissionTab-downloads').innerHTML=`<div><h3 class="font-black text-lg">Download & Export Permissions</h3></div>`+DOWNLOAD_GROUPS.map(g=>`<div class="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"><div class="px-4 py-3 bg-slate-50 dark:bg-[#11151d]"><h4 class="font-black text-sm">${g.title}</h4></div><div class="p-3 grid md:grid-cols-2 gap-2">${g.items.map(([k,l])=>switchRow('downloads',k,l,permissionDraft.downloads[k])).join('')}</div></div>`).join('');
  }
  
  function syncDraftFromDom() {
      document.querySelectorAll('.perm-checkbox').forEach(cb => {
          const path = cb.getAttribute('data-path');
          const key = cb.getAttribute('data-key');
          if (path.startsWith('menus.')) {
              const group = path.split('.')[1];
              permissionDraft.menus[group][key] = cb.checked;
          } else {
              permissionDraft[path][key] = cb.checked;
          }
      });
      if (permissionDraft.buyers.accessType === 'selected') {
          const arr = [];
          document.querySelectorAll('.buyer-checkbox').forEach(cb => {
              if (cb.checked) arr.push(cb.getAttribute('data-buyer-id'));
          });
          permissionDraft.buyers.buyerIds = arr;
      } else {
          permissionDraft.buyers.buyerIds = [];
      }
  }
  
  function setAllPermissions(val) {
      document.querySelectorAll('.perm-checkbox').forEach(cb => cb.checked = val);
  }
  
  updateCreatePermissionSummary();
