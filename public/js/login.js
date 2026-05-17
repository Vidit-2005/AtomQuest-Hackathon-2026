// Pages - Login
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-container">
      <div class="login-card fade-in">
        <div class="login-logo">🎯</div>
        <h1>AtomQuest GoalTracker</h1>
        <p class="subtitle">Goal Setting & Tracking Portal</p>
        <div id="loginError" style="display:none;color:var(--danger);background:var(--danger-bg);padding:10px;border-radius:8px;font-size:13px;margin-bottom:16px;text-align:center"></div>
        <div class="form-group">
          <label>Username</label>
          <input class="form-control" id="loginUser" placeholder="Enter username" autocomplete="off">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input class="form-control" id="loginPass" type="password" placeholder="Enter password">
        </div>
        <button class="btn btn-primary btn-block btn-lg" id="loginBtn">Sign In</button>
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)">
          <p style="font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:12px">Demo Credentials</p>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="quickLogin('admin','admin123')">👑 Admin</button>
            <button class="btn btn-ghost btn-sm" onclick="quickLogin('manager1','manager123')">👔 Manager</button>
            <button class="btn btn-ghost btn-sm" onclick="quickLogin('emp1','emp123')">👤 Employee</button>
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('loginBtn').onclick = doLogin;
  document.getElementById('loginPass').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
}

async function quickLogin(u, p) {
  document.getElementById('loginUser').value = u;
  document.getElementById('loginPass').value = p;
  await doLogin();
}

async function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  const errEl = document.getElementById('loginError');
  if (!u || !p) { errEl.textContent = 'Please enter both fields'; errEl.style.display = 'block'; return; }
  try {
    const data = await API.login(u, p);
    window.currentUser = data.user;
    renderApp();
    navigate('dashboard');
  } catch (e) {
    errEl.textContent = e.message; errEl.style.display = 'block';
  }
}
