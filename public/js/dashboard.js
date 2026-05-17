// Dashboard Page
async function renderDashboard() {
  const el = document.getElementById('pageContent');
  const role = window.currentUser.role;
  try {
    const stats = await API.getStats();
    if (!stats.cycle) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><h3>No Active Cycle</h3><p>Ask admin to create a cycle.</p></div>'; return; }

    let html = `<div class="page-header"><h1>Dashboard</h1><span style="color:var(--text-secondary);font-size:14px">${stats.cycle.name}</span></div>`;

    if (role === 'admin') {
      html += `<div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${stats.totalEmployees}</div><div class="stat-label">Total Employees</div></div>
        <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">${stats.totalGoalSheets}</div><div class="stat-label">Goal Sheets Created</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${stats.approvedSheets}</div><div class="stat-label">Approved</div></div>
        <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-value">${stats.pendingSheets}</div><div class="stat-label">Pending Approval</div></div>
      </div>`;
      const pct = stats.totalEmployees > 0 ? Math.round((stats.approvedSheets / stats.totalEmployees) * 100) : 0;
      html += `<div class="card"><div class="card-header"><h3>Overall Progress</h3><span style="color:var(--accent);font-weight:700">${pct}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <p style="margin-top:12px;font-size:13px;color:var(--text-secondary)">${stats.approvedSheets} of ${stats.totalEmployees} employees have approved goal sheets</p></div>`;
    } else if (role === 'manager') {
      html += `<div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${stats.teamSize}</div><div class="stat-label">Team Members</div></div>
        <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-value">${stats.teamSubmitted}</div><div class="stat-label">Pending Your Approval</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${stats.teamApproved}</div><div class="stat-label">Approved</div></div>
        <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-value">${stats.teamSize > 0 ? Math.round((stats.teamApproved / stats.teamSize) * 100) : 0}%</div><div class="stat-label">Completion Rate</div></div>
      </div>`;
    } else {
      const sheet = stats.mySheet;
      if (sheet) {
        html += `<div class="stats-grid">
          <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">${statusBadge(sheet.status)}</div><div class="stat-label">Goal Sheet Status</div></div>
          <div class="stat-card"><div class="stat-icon">🎯</div><div class="stat-value">${stats.myGoals}/8</div><div class="stat-label">Goals Created</div></div>
          <div class="stat-card"><div class="stat-icon">⚖️</div><div class="stat-value">${stats.myWeightage}%</div><div class="stat-label">Weightage Used</div></div>
        </div>`;
        const wPct = Math.min(stats.myWeightage, 100);
        html += `<div class="card"><div class="card-header"><h3>Weightage Progress</h3><span style="color:${wPct === 100 ? 'var(--success)' : 'var(--warning)'};font-weight:700">${stats.myWeightage}% / 100%</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${wPct}%;background:${wPct === 100 ? 'var(--success)' : 'var(--gradient-1)'}"></div></div></div>`;
        html += `<div style="margin-top:20px"><button class="btn btn-primary" onclick="navigate('goalsheet-detail',{id:${sheet.id}})">View My Goal Sheet →</button></div>`;
      } else {
        html += `<div class="empty-state"><div class="empty-icon">🎯</div><h3>No Goal Sheet Yet</h3><p>Create your goal sheet for the current cycle.</p>
          <button class="btn btn-primary btn-lg" onclick="createMyGoalSheet()">Create Goal Sheet</button></div>`;
      }
    }
    el.innerHTML = html;
  } catch (e) { el.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}

async function createMyGoalSheet() {
  try {
    const data = await API.createGoalSheet();
    toast('Goal sheet created!', 'success');
    navigate('goalsheet-detail', { id: data.id });
  } catch (e) { toast(e.message, 'error'); }
}
