// Modals for Goal, Achievement, Check-in
async function showGoalModal(sheetId, goalId, isManagerEdit) {
  let goal = null;
  if (goalId) {
    const sheet = await API.getGoalSheet(sheetId);
    goal = sheet.goals.find(g => g.id === goalId);
  }
  const isEdit = !!goal;
  showModal(`<h2>${isEdit ? 'Edit' : 'Add'} Goal</h2>
    <div class="form-group"><label>Thrust Area</label>
      <select class="form-control" id="gThrustArea" ${goal?.is_shared && !isManagerEdit ? 'disabled' : ''}>
        <option value="">Select...</option>
        ${['Revenue Growth','Customer Satisfaction','Operational Excellence','People Development','Innovation','Cost Optimization','Quality','Compliance'].map(t => `<option value="${t}" ${goal?.thrust_area === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select></div>
    <div class="form-group"><label>Goal Title</label>
      <input class="form-control" id="gTitle" value="${goal?.title || ''}" placeholder="e.g., Increase quarterly sales by 15%" ${goal?.is_shared && !isManagerEdit ? 'readonly' : ''}></div>
    <div class="form-group"><label>Description</label>
      <textarea class="form-control" id="gDesc" placeholder="Detailed description...">${goal?.description || ''}</textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="form-group"><label>Unit of Measurement</label>
        <select class="form-control" id="gUom">
          <option value="">Select...</option>
          <option value="numeric_min" ${goal?.uom_type==='numeric_min'?'selected':''}>Numeric (Higher=Better)</option>
          <option value="numeric_max" ${goal?.uom_type==='numeric_max'?'selected':''}>Numeric (Lower=Better)</option>
          <option value="percentage_min" ${goal?.uom_type==='percentage_min'?'selected':''}>% (Higher=Better)</option>
          <option value="percentage_max" ${goal?.uom_type==='percentage_max'?'selected':''}>% (Lower=Better)</option>
          <option value="timeline" ${goal?.uom_type==='timeline'?'selected':''}>Timeline (Date)</option>
          <option value="zero" ${goal?.uom_type==='zero'?'selected':''}>Zero-Based</option>
        </select></div>
      <div class="form-group"><label>Target Value</label>
        <input class="form-control" id="gTarget" value="${goal?.target_value || ''}" placeholder="e.g., 500000" ${goal?.is_shared && !isManagerEdit ? 'readonly' : ''}></div>
    </div>
    <div class="form-group"><label>Weightage (%)</label>
      <input class="form-control" id="gWeight" type="number" min="10" max="100" step="5" value="${goal?.weightage || 10}"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveGoal(${sheetId}, ${goalId || 'null'})">${isEdit ? 'Update' : 'Add'} Goal</button>
    </div>`);
}

async function saveGoal(sheetId, goalId) {
  const data = {
    goal_sheet_id: sheetId,
    thrust_area: document.getElementById('gThrustArea').value,
    title: document.getElementById('gTitle').value,
    description: document.getElementById('gDesc').value,
    uom_type: document.getElementById('gUom').value,
    target_value: document.getElementById('gTarget').value,
    weightage: parseFloat(document.getElementById('gWeight').value),
  };
  if (!data.thrust_area || !data.title || !data.uom_type || !data.target_value || !data.weightage) {
    toast('Fill all required fields', 'error'); return;
  }
  if (data.weightage < 10) { toast('Minimum weightage is 10%', 'error'); return; }
  try {
    if (goalId) await API.updateGoal(goalId, data);
    else await API.createGoal(data);
    closeModal(); toast(goalId ? 'Updated!' : 'Goal added!', 'success');
    renderGoalSheetDetail({ id: sheetId });
  } catch (e) { toast(e.message, 'error'); }
}

function showAchievementModal(goalId, quarter, sheetId, uomType) {
  const isDate = uomType === 'timeline';
  showModal(`<h2>Log ${quarter} Achievement</h2>
    <div class="form-group"><label>Actual ${isDate ? 'Completion Date' : 'Value'}</label>
      <input class="form-control" id="aValue" type="${isDate ? 'date' : 'number'}" step="any" placeholder="${isDate ? '' : 'Enter actual value'}"></div>
    <div class="form-group"><label>Status</label>
      <select class="form-control" id="aStatus">
        <option value="not_started">Not Started</option>
        <option value="on_track">On Track</option>
        <option value="completed">Completed</option>
      </select></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveAchievement(${goalId},'${quarter}',${sheetId})">Save</button>
    </div>`);
}

async function saveAchievement(goalId, quarter, sheetId) {
  const actualValue = document.getElementById('aValue').value;
  const status = document.getElementById('aStatus').value;
  if (!actualValue) { toast('Enter actual value', 'error'); return; }
  try {
    await API.saveAchievement({ goal_id: goalId, quarter, actual_value: actualValue, status });
    closeModal(); toast('Achievement saved!', 'success');
    renderGoalSheetDetail({ id: sheetId });
  } catch (e) { toast(e.message, 'error'); }
}

function showCheckinModal(sheetId, quarter) {
  showModal(`<h2>${quarter} Check-in</h2>
    <div class="form-group"><label>Check-in Comment</label>
      <textarea class="form-control" id="ciComment" rows="4" placeholder="Document your discussion with the employee..."></textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveCheckin(${sheetId},'${quarter}')">Save Check-in</button>
    </div>`);
}

async function saveCheckin(sheetId, quarter) {
  const comment = document.getElementById('ciComment').value;
  if (!comment) { toast('Enter a comment', 'error'); return; }
  try {
    await API.saveCheckin({ goal_sheet_id: sheetId, quarter, comment });
    closeModal(); toast('Check-in saved!', 'success');
    renderGoalSheetDetail({ id: sheetId });
  } catch (e) { toast(e.message, 'error'); }
}
