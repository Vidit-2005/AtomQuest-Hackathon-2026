// Layout & Navigation
let currentPage = 'dashboard';

function getNavItems() {
  const r = window.currentUser.role;
  const items = [{ id: 'dashboard', icon: '📊', label: 'Dashboard' }];
  if (r === 'employee' || r === 'manager') items.push({ id: 'goalsheets', icon: '🎯', label: 'Goal Sheets' });
  if (r === 'manager') items.push({ id: 'team', icon: '👥', label: 'Team Review' });
  if (r === 'admin') {
    items.push({ id: 'goalsheets', icon: '🎯', label: 'All Goal Sheets' });
    items.push({ id: 'cycles', icon: '🔄', label: 'Cycles' });
    items.push({ id: 'users', icon: '👥', label: 'Users' });
  }
  items.push({ id: 'reports', icon: '📋', label: 'Reports' });
  if (r === 'admin') items.push({ id: 'audit', icon: '📜', label: 'Audit Log' });
  return items;
}

function renderApp() {
  const u = window.currentUser;
  const initials = u.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
  const navItems = getNavItems();

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <h2>🎯 GoalTracker</h2>
          <span class="cycle-badge" id="cycleBadge">Loading...</span>
        </div>
        <nav class="sidebar-nav">
          ${navItems.map(n => `<div class="nav-item${currentPage === n.id ? ' active' : ''}" data-page="${n.id}"><span class="nav-icon">${n.icon}</span>${n.label}</div>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">${initials}</div>
            <div><div class="user-name">${u.full_name}</div><div class="user-role">${u.role}</div></div>
          </div>
          <button class="btn btn-ghost btn-sm btn-block" id="logoutBtn">Sign Out</button>
        </div>
      </aside>
      <main class="main-content" id="mainContent"><div class="fade-in" id="pageContent"></div></main>
    </div>`;

  document.querySelectorAll('.nav-item').forEach(el => el.onclick = () => navigate(el.dataset.page));
  document.getElementById('logoutBtn').onclick = async () => { await API.logout(); window.currentUser = null; renderLogin(); };
  loadCycleBadge();
}

async function loadCycleBadge() {
  try {
    const c = await API.getActiveCycle();
    document.getElementById('cycleBadge').textContent = c ? c.name : 'No Active Cycle';
  } catch { document.getElementById('cycleBadge').textContent = '—'; }
}

function navigate(page, params) {
  currentPage = page;
  window._navParams = params;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  const pageEl = document.getElementById('pageContent');
  pageEl.className = 'fade-in';
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'goalsheets': renderGoalSheets(); break;
    case 'goalsheet-detail': renderGoalSheetDetail(params); break;
    case 'team': renderTeamReview(); break;
    case 'cycles': renderCycles(); break;
    case 'users': renderUsers(); break;
    case 'reports': renderReports(); break;
    case 'audit': renderAuditLog(); break;
    default: renderDashboard();
  }
}
