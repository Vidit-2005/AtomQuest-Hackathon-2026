// UI Utilities
function toast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function showModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

function statusBadge(s) {
  const labels = { draft: 'Draft', submitted: 'Pending', returned: 'Returned', approved: 'Approved', locked: 'Locked', not_started: 'Not Started', on_track: 'On Track', completed: 'Completed' };
  return `<span class="badge badge-${s}">${labels[s] || s}</span>`;
}

function uomLabel(u) {
  const m = { numeric_min: '📈 Numeric (Higher=Better)', numeric_max: '📉 Numeric (Lower=Better)', percentage_min: '📈 % (Higher=Better)', percentage_max: '📉 % (Lower=Better)', timeline: '📅 Timeline', zero: '🎯 Zero-Based' };
  return m[u] || u;
}

function shortUom(u) {
  const m = { numeric_min: 'Num ↑', numeric_max: 'Num ↓', percentage_min: '% ↑', percentage_max: '% ↓', timeline: 'Date', zero: 'Zero' };
  return m[u] || u;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
