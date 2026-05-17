// API helper
const API = {
  async request(url, opts = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  login(username, password) { return this.request('/api/auth/login', { method: 'POST', body: { username, password } }); },
  logout() { return this.request('/api/auth/logout', { method: 'POST' }); },
  me() { return this.request('/api/auth/me'); },
  getStats() { return this.request('/api/dashboard/stats'); },
  getCycles() { return this.request('/api/cycles'); },
  getActiveCycle() { return this.request('/api/cycles/active'); },
  createCycle(data) { return this.request('/api/cycles', { method: 'POST', body: data }); },
  toggleCycle(id) { return this.request(`/api/cycles/${id}/toggle`, { method: 'PUT' }); },
  getUsers() { return this.request('/api/users'); },
  getTeam() { return this.request('/api/users/team'); },
  getGoalSheets() { return this.request('/api/goalsheets'); },
  createGoalSheet() { return this.request('/api/goalsheets', { method: 'POST' }); },
  getGoalSheet(id) { return this.request(`/api/goalsheets/${id}`); },
  submitSheet(id) { return this.request(`/api/goalsheets/${id}/submit`, { method: 'PUT' }); },
  approveSheet(id) { return this.request(`/api/goalsheets/${id}/approve`, { method: 'PUT' }); },
  returnSheet(id, comment) { return this.request(`/api/goalsheets/${id}/return`, { method: 'PUT', body: { comment } }); },
  unlockSheet(id) { return this.request(`/api/goalsheets/${id}/unlock`, { method: 'PUT' }); },
  createGoal(data) { return this.request('/api/goals', { method: 'POST', body: data }); },
  updateGoal(id, data) { return this.request(`/api/goals/${id}`, { method: 'PUT', body: data }); },
  deleteGoal(id) { return this.request(`/api/goals/${id}`, { method: 'DELETE' }); },
  shareGoal(goalId, employeeIds) { return this.request('/api/goals/share', { method: 'POST', body: { goal_id: goalId, employee_ids: employeeIds } }); },
  saveAchievement(data) { return this.request('/api/achievements', { method: 'POST', body: data }); },
  saveCheckin(data) { return this.request('/api/checkins', { method: 'POST', body: data }); },
  getAchievementReport() { return this.request('/api/reports/achievement'); },
  getCompletionReport() { return this.request('/api/reports/completion'); },
  getAuditLogs() { return this.request('/api/audit'); },
};
