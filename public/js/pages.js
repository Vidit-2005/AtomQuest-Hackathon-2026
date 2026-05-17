// Team Review, Cycles, Users, Reports, Audit pages

async function renderTeamReview() {
  const el = document.getElementById('pageContent');
  try {
    const sheets = await API.getGoalSheets();
    const teamSheets = sheets.filter(s => s.employee_id !== window.currentUser.id);
    let html = `<div class="page-header"><h1>Team Review</h1></div>`;
    if (teamSheets.length === 0) {
      html += `<div class="empty-state"><div class="empty-icon">👥</div><h3>No Team Goal Sheets</h3><p>Your team members haven't created goal sheets yet.</p></div>`;
    } else {
      html += `<div class="table-container"><table><thead><tr><th>Employee</th><th>Department</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>`;
      for (const s of teamSheets) {
        html += `<tr><td style="font-weight:600">${s.employee_name}</td><td>${s.department}</td><td>${statusBadge(s.status)}</td>
          <td style="font-size:13px;color:var(--text-secondary)">${formatDate(s.submitted_at)}</td>
          <td><button class="btn btn-ghost btn-sm" onclick="navigate('goalsheet-detail',{id:${s.id}})">Review</button></td></tr>`;
      }
      html += `</tbody></table></div>`;
    }
    el.innerHTML = html;
  } catch (e) { el.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}

async function renderCycles() {
  const el = document.getElementById('pageContent');
  try {
    const cycles = await API.getCycles();
    let html = `<div class="page-header"><h1>Cycle Management</h1>
      <button class="btn btn-primary" onclick="showCycleModal()">+ New Cycle</button></div>`;
    html += `<div class="table-container"><table><thead><tr><th>Name</th><th>Year</th><th>Goal Setting</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Status</th><th>Action</th></tr></thead><tbody>`;
    for (const c of cycles) {
      html += `<tr><td style="font-weight:600">${c.name}</td><td>${c.year}</td>
        <td style="font-size:12px">${formatDate(c.goal_setting_start)}<br>${formatDate(c.goal_setting_end)}</td>
        <td style="font-size:12px">${formatDate(c.q1_start)}<br>${formatDate(c.q1_end)}</td>
        <td style="font-size:12px">${formatDate(c.q2_start)}<br>${formatDate(c.q2_end)}</td>
        <td style="font-size:12px">${formatDate(c.q3_start)}<br>${formatDate(c.q3_end)}</td>
        <td style="font-size:12px">${formatDate(c.q4_start)}<br>${formatDate(c.q4_end)}</td>
        <td>${c.is_active ? '<span class="badge badge-approved">Active</span>' : '<span class="badge badge-draft">Inactive</span>'}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="toggleCycle(${c.id})">${c.is_active ? 'Deactivate' : 'Activate'}</button></td></tr>`;
    }
    html += `</tbody></table></div>`;
    el.innerHTML = html;
  } catch (e) { el.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}

function showCycleModal() {
  showModal(`<h2>Create Cycle</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="form-group"><label>Name</label><input class="form-control" id="cName" value="FY 2026-27"></div>
      <div class="form-group"><label>Year</label><input class="form-control" id="cYear" type="number" value="2026"></div>
      <div class="form-group"><label>Goal Setting Start</label><input class="form-control" id="cGSS" type="date" value="2026-05-01"></div>
      <div class="form-group"><label>Goal Setting End</label><input class="form-control" id="cGSE" type="date" value="2026-06-30"></div>
      <div class="form-group"><label>Q1 Start</label><input class="form-control" id="cQ1S" type="date" value="2026-07-01"></div>
      <div class="form-group"><label>Q1 End</label><input class="form-control" id="cQ1E" type="date" value="2026-07-31"></div>
      <div class="form-group"><label>Q2 Start</label><input class="form-control" id="cQ2S" type="date" value="2026-10-01"></div>
      <div class="form-group"><label>Q2 End</label><input class="form-control" id="cQ2E" type="date" value="2026-10-31"></div>
      <div class="form-group"><label>Q3 Start</label><input class="form-control" id="cQ3S" type="date" value="2027-01-01"></div>
      <div class="form-group"><label>Q3 End</label><input class="form-control" id="cQ3E" type="date" value="2027-01-31"></div>
      <div class="form-group"><label>Q4 Start</label><input class="form-control" id="cQ4S" type="date" value="2027-03-01"></div>
      <div class="form-group"><label>Q4 End</label><input class="form-control" id="cQ4E" type="date" value="2027-04-30"></div>
    </div>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveCycle()">Create</button></div>`);
}

async function saveCycle() {
  try {
    await API.createCycle({
      name: document.getElementById('cName').value, year: parseInt(document.getElementById('cYear').value),
      goal_setting_start: document.getElementById('cGSS').value, goal_setting_end: document.getElementById('cGSE').value,
      q1_start: document.getElementById('cQ1S').value, q1_end: document.getElementById('cQ1E').value,
      q2_start: document.getElementById('cQ2S').value, q2_end: document.getElementById('cQ2E').value,
      q3_start: document.getElementById('cQ3S').value, q3_end: document.getElementById('cQ3E').value,
      q4_start: document.getElementById('cQ4S').value, q4_end: document.getElementById('cQ4E').value,
    });
    closeModal(); toast('Cycle created!', 'success'); renderCycles();
  } catch (e) { toast(e.message, 'error'); }
}

async function toggleCycle(id) {
  try { await API.toggleCycle(id); toast('Updated', 'success'); renderCycles(); loadCycleBadge(); } catch (e) { toast(e.message, 'error'); }
}

async function renderUsers() {
  const el = document.getElementById('pageContent');
  try {
    const users = await API.getUsers();
    let html = `<div class="page-header"><h1>Users</h1></div>`;
    html += `<div class="table-container"><table><thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Department</th><th>Manager</th></tr></thead><tbody>`;
    for (const u of users) {
      const mgr = users.find(x => x.id === u.manager_id);
      html += `<tr><td style="font-weight:600">${u.full_name}</td><td>${u.username}</td><td>${u.email || '—'}</td>
        <td><span class="badge badge-${u.role === 'admin' ? 'locked' : u.role === 'manager' ? 'submitted' : 'draft'}">${u.role}</span></td>
        <td>${u.department || '—'}</td><td>${mgr ? mgr.full_name : '—'}</td></tr>`;
    }
    html += `</tbody></table></div>`;
    el.innerHTML = html;
  } catch (e) { el.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}

async function renderReports() {
  const el = document.getElementById('pageContent');
  let html = `<div class="page-header"><h1>Reports</h1>
    <div class="header-actions"><a href="/api/reports/achievement/csv" class="btn btn-primary" download>📥 Export CSV</a></div></div>`;

  html += `<div class="quarter-tabs" style="margin-bottom:24px">
    <div class="quarter-tab active" onclick="showReportTab('achievement',this)">Achievement Report</div>
    <div class="quarter-tab" onclick="showReportTab('completion',this)">Completion Dashboard</div>
  </div>
  <div id="reportContent"><p style="color:var(--text-secondary)">Loading...</p></div>`;
  el.innerHTML = html;
  showReportTab('achievement');
}

async function showReportTab(tab, tabEl) {
  document.querySelectorAll('.quarter-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');
  else document.querySelector('.quarter-tab').classList.add('active');
  const rc = document.getElementById('reportContent');

  if (tab === 'achievement') {
    try {
      const data = await API.getAchievementReport();
      if (data.length === 0) { rc.innerHTML = '<p style="color:var(--text-secondary)">No data available.</p>'; return; }
      let html = `<div class="table-container"><table><thead><tr><th>Employee</th><th>Dept</th><th>Goal</th><th>UoM</th><th>Target</th><th>Weight</th><th>Quarter</th><th>Actual</th><th>Progress</th><th>Status</th></tr></thead><tbody>`;
      for (const r of data) {
        html += `<tr><td>${r.full_name}</td><td>${r.department}</td><td style="max-width:200px">${r.goal_title}</td>
          <td>${shortUom(r.uom_type)}</td><td>${r.target_value}</td><td>${r.weightage}%</td>
          <td>${r.quarter || '—'}</td><td>${r.actual_value || '—'}</td>
          <td>${r.progress_score != null ? Math.round(r.progress_score * 100) + '%' : '—'}</td>
          <td>${r.status ? statusBadge(r.status) : '—'}</td></tr>`;
      }
      html += `</tbody></table></div>`;
      rc.innerHTML = html;
    } catch (e) { rc.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
  } else {
    try {
      const { cycle, data } = await API.getCompletionReport();
      if (!data || data.length === 0) { rc.innerHTML = '<p style="color:var(--text-secondary)">No data.</p>'; return; }
      let html = `<div class="table-container"><table><thead><tr><th>Employee</th><th>Dept</th><th>Goal Status</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr></thead><tbody>`;
      for (const r of data) {
        const gs = r.goal_status ? statusBadge(r.goal_status) : '<span class="badge badge-draft">Not Started</span>';
        html += `<tr><td style="font-weight:600">${r.full_name}</td><td>${r.department}</td><td>${gs}</td>
          <td>${r.q1_checkin ? '✅' : '—'}</td><td>${r.q2_checkin ? '✅' : '—'}</td>
          <td>${r.q3_checkin ? '✅' : '—'}</td><td>${r.q4_checkin ? '✅' : '—'}</td></tr>`;
      }
      html += `</tbody></table></div>`;
      rc.innerHTML = html;
    } catch (e) { rc.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
  }
}

async function renderAuditLog() {
  const el = document.getElementById('pageContent');
  try {
    const logs = await API.getAuditLogs();
    let html = `<div class="page-header"><h1>Audit Log</h1></div>`;
    if (logs.length === 0) {
      html += `<p style="color:var(--text-secondary)">No audit logs yet.</p>`;
    } else {
      html += `<div class="card"><div style="max-height:600px;overflow-y:auto">`;
      for (const l of logs) {
        html += `<div class="audit-log-item">
          <span class="audit-action">${l.action}</span>
          <div style="flex:1"><span style="font-weight:600">${l.user_name || 'System'}</span>
            <span style="color:var(--text-secondary)"> — ${l.details || ''}</span></div>
          <span class="audit-time">${formatDate(l.created_at)}</span>
        </div>`;
      }
      html += `</div></div>`;
    }
    el.innerHTML = html;
  } catch (e) { el.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}
