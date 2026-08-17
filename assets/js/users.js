const USERS_KEY = "crud_master_users";
const PROFILE_KEY = "crud_master_profile";
let usersInitialized = false;
let editingUserId = null;

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[c]));

function getUsers(){
    try { const v = JSON.parse(localStorage.getItem(USERS_KEY)); return Array.isArray(v) ? v : seedUsers(); }
    catch { return seedUsers(); }
}
function saveUsers(users){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); window.dispatchEvent(new CustomEvent("users:data-changed")); }
function seedUsers(){
    const users = [
        {id:"USR-ADMIN", name:"Admin", email:"admin@example.com", role:"admin", status:"active", createdAt:new Date().toISOString()}
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users)); return users;
}
function toast(type,title,message){
    const c=$("toastContainer"); if(!c)return;
    const el=document.createElement("div"); el.className=`toast toast-${type}`;
    el.innerHTML=`<div class="toast-icon">${type==="success"?"✓":type==="error"?"!":"i"}</div><div class="toast-content"><div class="toast-title">${esc(title)}</div><div class="toast-message">${esc(message)}</div></div><button class="toast-close">×</button>`;
    el.querySelector(".toast-close").onclick=()=>el.remove(); c.appendChild(el); setTimeout(()=>el.remove(),3500);
}
function uid(){return "USR-"+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,6).toUpperCase()}
function renderUsers(){
    const body=$("usersTableBody"); if(!body)return;
    const q=($("userSearch")?.value||"").toLowerCase().trim(), role=$("userRoleFilter")?.value||"all", status=$("userStatusFilter")?.value||"all";
    const users=getUsers().filter(u=>(!q||[u.name,u.email,u.role].some(x=>String(x).toLowerCase().includes(q)))&&(role==="all"||u.role===role)&&(status==="all"||u.status===status));
    $("usersTotal") && ($("usersTotal").textContent=getUsers().length);
    $("usersActive") && ($("usersActive").textContent=getUsers().filter(u=>u.status==="active").length);
    $("usersAdmins") && ($("usersAdmins").textContent=getUsers().filter(u=>u.role==="admin").length);
    $("usersInactive") && ($("usersInactive").textContent=getUsers().filter(u=>u.status!=="active").length);
    body.innerHTML=users.length?users.map(u=>`<tr><td><div class="person-cell"><span class="mini-avatar">${esc((u.name||"?")[0].toUpperCase())}</span><div><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></div></div></td><td><span class="role-chip role-${esc(u.role)}">${esc(u.role[0].toUpperCase()+u.role.slice(1))}</span></td><td><button class="status-badge ${u.status==="active"?"status-active":"status-inactive"}" data-user-action="toggle" data-id="${esc(u.id)}"><span></span>${esc(u.status[0].toUpperCase()+u.status.slice(1))}</button></td><td>${new Date(u.createdAt).toLocaleDateString("en-GB")}</td><td><div class="table-actions"><button class="table-action edit" data-user-action="edit" data-id="${esc(u.id)}">✎</button><button class="table-action delete" data-user-action="delete" data-id="${esc(u.id)}">×</button></div></td></tr>`).join(""):`<tr><td colspan="5" class="table-empty"><div class="empty-table-state"><div class="empty-icon">○</div><strong>No users found</strong><span>Try another filter or add a user.</span></div></td></tr>`;
}
function openUserModal(user=null){
    editingUserId=user?.id||null; $("userModalTitle").textContent=user?"Edit User":"Add New User";
    $("userName").value=user?.name||""; $("userEmail").value=user?.email||""; $("userRole").value=user?.role||"staff"; $("userStatus").value=user?.status||"active"; $("userPassword").value="";
    $("userPassword").required=!user; $("userModal").hidden=false; document.body.classList.add("modal-open"); setTimeout(()=>$("userName")?.focus(),50);
}
function closeUserModal(){if($("userModal")){ $("userModal").hidden=true; document.body.classList.remove("modal-open");}}
function initUsers(){
    if(usersInitialized)return; usersInitialized=true; getUsers(); renderUsers();
    $("addUserButton")?.addEventListener("click",()=>openUserModal()); $("userModalClose")?.addEventListener("click",closeUserModal); $("userModalCancel")?.addEventListener("click",closeUserModal);
    $("userForm")?.addEventListener("submit",e=>{e.preventDefault(); const name=$("userName").value.trim(),email=$("userEmail").value.trim(),role=$("userRole").value,status=$("userStatus").value; if(!name||!email){toast("error","Missing information","Name and email are required.");return;} let users=getUsers(); if(users.some(u=>u.email.toLowerCase()===email.toLowerCase()&&u.id!==editingUserId)){toast("error","Duplicate email","That email is already in use.");return;} if(editingUserId){users=users.map(u=>u.id===editingUserId?{...u,name,email,role,status}:u);toast("success","User updated","The user has been updated.");}else{users.unshift({id:uid(),name,email,role,status,createdAt:new Date().toISOString()});toast("success","User created","The new user has been added.");} saveUsers(users); closeUserModal(); renderUsers();});
    ["userSearch","userRoleFilter","userStatusFilter"].forEach(id=>$(id)?.addEventListener("input",renderUsers));
    $("usersTableBody")?.addEventListener("click",e=>{const b=e.target.closest("button[data-user-action]");if(!b)return;const id=b.dataset.id,action=b.dataset.userAction;let users=getUsers();const user=users.find(u=>u.id===id);if(!user)return;if(action==="edit")openUserModal(user);if(action==="toggle"){user.status=user.status==="active"?"inactive":"active";saveUsers(users);renderUsers();toast("success","Status updated",`${user.name} is now ${user.status}.`);}if(action==="delete"){if(id==="USR-ADMIN"){toast("warning","Protected user","The default admin cannot be deleted.");return;}if(confirm(`Delete ${user.name}?`)){saveUsers(users.filter(u=>u.id!==id));renderUsers();toast("success","User deleted","The user was removed.");}}});
    window.addEventListener("users:data-changed",renderUsers);
}
export {initUsers,getUsers};
