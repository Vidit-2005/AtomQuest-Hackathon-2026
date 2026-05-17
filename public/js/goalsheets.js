// Goal Sheets List & Detail pages
async function renderGoalSheets() {
  const el = document.getElementById('pageContent');
  try {
    const sheets = await API.getGoalSheets();
    const role = window.currentUser.role;
    let html = `<div class="page-header"><h1>${role === 'admin' ? 'All Goal Sheets' : 'My Goal Sheets'}</h1>
      <div class="header-actions">`;
    if (role === 'employee') html += `<button class="btn btn-primary" onclick="createMyGoalSheet()">+ New Goal Sheet</button>`;
    html += `</div></div>`;

    if (sheets.length === 0) {
      html += `<div class="empty-state"><div class="empty-icon">📋</div><h3>No Goal Sheets</h3><p>No goal sheets found.</p></div>`;
    } else {
      html += `<div class="table-container"><table><thead><tr>
        <th>Employee</th><th>Department</th><th>Cycle</th><th>Status</th><th>Submitted</th><th>Action</th>
      </tr></thead><tbody>`;
      for (const s of sheets) {
        html += `<tr>
          <td style="font-weight:600">${s.employee_name}</td>
          <td>${s.department || '—'}</td>
          <td>${s.cycle_name}</td>
          <td>${statusBadge(s.status)}</td>
          <td style="color:var(--text-secondary);font-size:13px">${formatDate(s.submitted_at)}</td>
          <td><button class="btn btn-ghost btn-sm" onclick="navigate('goalsheet-detail',{id:${s.id}})">View</button>
          ${role === 'admin' && s.status === 'approved' ? `<button class="btn btn-warning btn-sm" onclick="unlockSheet(${s.id})">Unlock</button>` : ''}</td>
        </tr>`;
      }
      html += `</tbody></table></div>`;
    }
    el.innerHTML = html;
  } catch (e) { el.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}

async function unlockSheet(id) {
  if (!confirm('Unlock this goal sheet?')) return;
  try { await API.unlockSheet(id); toast('Unlocked', 'success'); renderGoalSheets(); } catch (e) { toast(e.message, 'error'); }
}

async function renderGoalSheetDetail(params) {
  const el = document.getElementById('pageContent');
  const id = params?.id || window._navParams?.id;
  if (!id) { navigate('goalsheets'); return; }
  try {
    const sheet = await API.getGoalSheet(id);
    const role = window.currentUser.role;
    const isOwner = sheet.employee_id === window.currentUser.id;
    const isManager = role === 'manager' || role === 'admin';
    const canEdit = isOwner && (sheet.status === 'draft' || sheet.status === 'returned');
    const canApprove = isManager && sheet.status === 'submitted';
    const canLogAchievements = isOwner && sheet.status === 'approved';
    const canCheckin = isManager && sheet.status === 'approved';

    const totalW = sheet.goals.reduce((s, g) => s + g.weightage, 0);

    let html = `<div class="page-header">
      <div><button class="btn btn-ghost btn-sm" onclick="navigate('${role === 'manager' ? 'team' : 'goalsheets'}')" style="margin-bottom:8px">← Back</button>
        <h1>${sheet.employee_name}'s Goals</h1>
        <p style="color:var(--text-secondary);font-size:14px;margin-top:4px">${sheet.cycle_name} · ${sheet.department}</p>
      </div>
      <div class="header-actions">
        ${statusBadge(sheet.status)}
        ${canEdit && sheet.goals.length > 0 ? `<button class="btn btn-success" onclick="submitMySheet(${id})" ${Math.abs(totalW - 100) > 0.01 ? 'disabled title="Weightage must equal 100%"' : ''}>Submit for Approval</button>` : ''}
        ${canApprove ? `<button class="btn btn-success" onclick="approveSheet(${id})">✓ Approve</button><button class="btn btn-danger" onclick="showReturnModal(${id})">↩ Return</button>` : ''}
      </div></div>`;

    if (sheet.return_comment && sheet.status === 'returned') {
      html += `<div style="background:var(--danger-bg);border:1px solid var(--danger);border-radius:var(--radius-md);padding:16px;margin-bottom:20px;font-size:14px">
        <strong>Returned:</strong> ${sheet.return_comment}</div>`;
    }

    // Weightage summary
    html += `<div class="card" style="margin-bottom:20px"><div class="card-header"><h3>Weightage: ${totalW}% / 100%</h3>
      <span style="font-size:13px;color:var(--text-secondary)">${sheet.goals.length} of 8 goals</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(totalW, 100)}%;background:${Math.abs(totalW - 100) < 0.01 ? 'var(--success)' : 'var(--gradient-1)'}"></div></div></div>`;

    // Goals list
    if (canEdit) html += `<button class="btn btn-primary" onclick="showGoalModal(${id})" style="margin-bottom:16px" ${sheet.goals.length >= 8 ? 'disabled' : ''}>+ Add Goal</button>`;

    if (sheet.goals.length === 0) {
      html += `<div class="empty-state"><div class="empty-icon">🎯</div><h3>No Goals Yet</h3><p>Add goals to your sheet.</p></div>`;
    } else {
      html += `<div class="goal-list">`;
      for (const g of sheet.goals) {
        const goalAchievements = sheet.achievements.filter(a => a.goal_id === g.id);
        html += `<div class="goal-item">
          <div class="goal-item-header">
            <div>
              <h4>${g.title} ${g.is_shared ? '<span style="font-size:11px;color:var(--accent-2)">🔗 Shared</span>' : ''}</h4>
              <p style="font-size:13px;color:var(--text-secondary);margin-top:4px">${g.description || ''}</p>
            </div>
            <div style="display:flex;gap:6px">
              ${canEdit && !g.is_shared ? `<button class="btn btn-ghost btn-sm" onclick="showGoalModal(${id},${g.id})">✏️</button>` : ''}
              ${canEdit ? `<button class="btn btn-ghost btn-sm" onclick="deleteGoal(${g.id},${id})" style="color:var(--danger)">🗑</button>` : ''}
              ${canApprove ? `<button class="btn btn-ghost btn-sm" onclick="showGoalModal(${id},${g.id},true)">✏️ Edit</button>` : ''}
            </div>
          </div>
          <div class="goal-item-meta">
            <div class="goal-meta-item">Thrust Area: <span>${g.thrust_area}</span></div>
            <div class="goal-meta-item">UoM: <span>${shortUom(g.uom_type)}</span></div>
            <div class="goal-meta-item">Target: <span>${g.target_value}</span></div>
            <div class="goal-meta-item">Weight: <span>${g.weightage}%</span></div>
          </div>`;

        // Show achievements if approved
        if (sheet.status === 'approved') {
          html += `<div class="achievement-grid">`;
          for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
            const a = goalAchievements.find(x => x.quarter === q);
            html += `<div class="achievement-cell${canLogAchievements ? ' clickable" onclick="showAchievementModal(' + g.id + ',\'' + q + '\',' + id + ',' + JSON.stringify(g.uom_type).replace(/"/g, '&quot;') + ')"' : '"'} style="${canLogAchievements ? 'cursor:pointer' : ''}">
              <div class="quarter-label">${q}</div>
              <div class="achievement-value">${a ? a.actual_value : '—'}</div>
              ${a ? `<div class="achievement-score">${Math.round((a.progress_score || 0) * 100)}%</div>` : ''}
              ${a ? statusBadge(a.status) : ''}
            </div>`;
          }
          html += `</div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;
    }

    // Check-in section for managers
    if (canCheckin) {
      html += `<div class="card" style="margin-top:24px"><div class="card-header"><h3>Manager Check-in</h3></div>
        <div class="quarter-tabs">${['Q1','Q2','Q3','Q4'].map(q => `<div class="quarter-tab" onclick="showCheckinModal(${id},'${q}')">${q}</div>`).join('')}</div>`;
      if (sheet.checkins.length > 0) {
        for (const ci of sheet.checkins) {
          html += `<div class="checkin-card"><div class="manager-name">${ci.manager_name} — ${ci.quarter}</div>
            <div class="checkin-comment">${ci.comment || 'No comment'}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:8px">${formatDate(ci.completed_at)}</div></div>`;
        }
      } else {
        html += `<p style="color:var(--text-secondary);font-size:14px">No check-ins recorded yet. Click a quarter above.</p>`;
      }
      html += `</div>`;
    }

    // Show checkins for employee too
    if (isOwner && sheet.checkins.length > 0) {
      html += `<div class="card" style="margin-top:24px"><div class="card-header"><h3>Manager Check-ins</h3></div>`;
      for (const ci of sheet.checkins) {
        html += `<div class="checkin-card"><div class="manager-name">${ci.manager_name} — ${ci.quarter}</div>
          <div class="checkin-comment">${ci.comment || 'No comment'}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px">${formatDate(ci.completed_at)}</div></div>`;
      }
      html += `</div>`;
    }

    el.innerHTML = html;
  } catch (e) { el.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
}

async function submitMySheet(id) {
  try { await API.submitSheet(id); toast('Submitted for approval!', 'success'); renderGoalSheetDetail({ id }); } catch (e) { toast(e.message, 'error'); }
}

async function approveSheet(id) {
  if (!confirm('Approve this goal sheet?')) return;
  try { await API.approveSheet(id); toast('Approved!', 'success'); renderGoalSheetDetail({ id }); } catch (e) { toast(e.message, 'error'); }
}

function showReturnModal(sheetId) {
  showModal(`<h2>Return for Rework</h2>
    <div class="form-group"><label>Comment</label><textarea class="form-control" id="returnComment" placeholder="Reason for return..."></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="returnSheet(${sheetId})">Return</button>
    </div>`);
}

async function returnSheet(id) {
  const comment = document.getElementById('returnComment').value;
  try { await API.returnSheet(id, comment); closeModal(); toast('Returned', 'info'); renderGoalSheetDetail({ id }); } catch (e) { toast(e.message, 'error'); }
}

async function deleteGoal(goalId, sheetId) {
  if (!confirm('Delete this goal?')) return;
  try { await API.deleteGoal(goalId); toast('Deleted', 'success'); renderGoalSheetDetail({ id: sheetId }); } catch (e) { toast(e.message, 'error'); }
}
