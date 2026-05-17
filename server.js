const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'atomquest-hackathon-2026-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.session.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ─── AUTH ROUTES ─────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT id, username, full_name, email, role, department, manager_id FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.user = user;
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: req.session.user });
});

// ─── CYCLE ROUTES ────────────────────────────────────
app.get('/api/cycles', requireAuth, (req, res) => {
  const cycles = db.prepare('SELECT * FROM cycles ORDER BY year DESC').all();
  res.json(cycles);
});

app.get('/api/cycles/active', requireAuth, (req, res) => {
  const cycle = db.prepare('SELECT * FROM cycles WHERE is_active = 1').get();
  res.json(cycle);
});

app.post('/api/cycles', requireRole('admin'), (req, res) => {
  const { name, year, goal_setting_start, goal_setting_end, q1_start, q1_end, q2_start, q2_end, q3_start, q3_end, q4_start, q4_end } = req.body;
  const result = db.prepare(`INSERT INTO cycles (name, year, goal_setting_start, goal_setting_end, q1_start, q1_end, q2_start, q2_end, q3_start, q3_end, q4_start, q4_end) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(name, year, goal_setting_start, goal_setting_end, q1_start, q1_end, q2_start, q2_end, q3_start, q3_end, q4_start, q4_end);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/cycles/:id/toggle', requireRole('admin'), (req, res) => {
  const cycle = db.prepare('SELECT * FROM cycles WHERE id = ?').get(req.params.id);
  if (!cycle) return res.status(404).json({ error: 'Cycle not found' });
  db.prepare('UPDATE cycles SET is_active = 0').run(); // deactivate all
  db.prepare('UPDATE cycles SET is_active = ? WHERE id = ?').run(cycle.is_active ? 0 : 1, req.params.id);
  res.json({ success: true });
});

// ─── USERS ROUTES ────────────────────────────────────
app.get('/api/users', requireAuth, (req, res) => {
  const users = db.prepare('SELECT id, username, full_name, email, role, department, manager_id FROM users').all();
  res.json(users);
});

app.get('/api/users/team', requireRole('manager'), (req, res) => {
  const team = db.prepare('SELECT id, username, full_name, email, role, department FROM users WHERE manager_id = ?').all(req.session.user.id);
  res.json(team);
});

// ─── GOAL SHEET ROUTES ───────────────────────────────
app.get('/api/goalsheets', requireAuth, (req, res) => {
  const user = req.session.user;
  let sheets;
  if (user.role === 'admin') {
    sheets = db.prepare(`SELECT gs.*, u.full_name as employee_name, u.department, c.name as cycle_name FROM goal_sheets gs JOIN users u ON gs.employee_id = u.id JOIN cycles c ON gs.cycle_id = c.id ORDER BY gs.created_at DESC`).all();
  } else if (user.role === 'manager') {
    sheets = db.prepare(`SELECT gs.*, u.full_name as employee_name, u.department, c.name as cycle_name FROM goal_sheets gs JOIN users u ON gs.employee_id = u.id JOIN cycles c ON gs.cycle_id = c.id WHERE u.manager_id = ? OR gs.employee_id = ? ORDER BY gs.created_at DESC`).all(user.id, user.id);
  } else {
    sheets = db.prepare(`SELECT gs.*, u.full_name as employee_name, u.department, c.name as cycle_name FROM goal_sheets gs JOIN users u ON gs.employee_id = u.id JOIN cycles c ON gs.cycle_id = c.id WHERE gs.employee_id = ? ORDER BY gs.created_at DESC`).all(user.id);
  }
  res.json(sheets);
});

app.post('/api/goalsheets', requireAuth, (req, res) => {
  const user = req.session.user;
  const cycle = db.prepare('SELECT * FROM cycles WHERE is_active = 1').get();
  if (!cycle) return res.status(400).json({ error: 'No active cycle' });

  const existing = db.prepare('SELECT id FROM goal_sheets WHERE employee_id = ? AND cycle_id = ?').get(user.id, cycle.id);
  if (existing) return res.status(400).json({ error: 'Goal sheet already exists for this cycle' });

  const result = db.prepare('INSERT INTO goal_sheets (employee_id, cycle_id, status) VALUES (?, ?, ?)').run(user.id, cycle.id, 'draft');
  
  logAudit(user.id, 'CREATE_GOAL_SHEET', 'goal_sheet', result.lastInsertRowid, null, null, 'Created new goal sheet');
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/goalsheets/:id', requireAuth, (req, res) => {
  const sheet = db.prepare(`SELECT gs.*, u.full_name as employee_name, u.department, u.manager_id, c.name as cycle_name FROM goal_sheets gs JOIN users u ON gs.employee_id = u.id JOIN cycles c ON gs.cycle_id = c.id WHERE gs.id = ?`).get(req.params.id);
  if (!sheet) return res.status(404).json({ error: 'Not found' });

  const goals = db.prepare('SELECT * FROM goals WHERE goal_sheet_id = ? ORDER BY sort_order').all(req.params.id);
  const achievements = db.prepare(`SELECT a.* FROM achievements a JOIN goals g ON a.goal_id = g.id WHERE g.goal_sheet_id = ?`).all(req.params.id);
  const checkins = db.prepare('SELECT c.*, u.full_name as manager_name FROM checkins c JOIN users u ON c.manager_id = u.id WHERE c.goal_sheet_id = ?').all(req.params.id);

  res.json({ ...sheet, goals, achievements, checkins });
});

// Submit goal sheet
app.put('/api/goalsheets/:id/submit', requireAuth, (req, res) => {
  const sheet = db.prepare('SELECT * FROM goal_sheets WHERE id = ? AND employee_id = ?').get(req.params.id, req.session.user.id);
  if (!sheet) return res.status(404).json({ error: 'Not found' });
  if (sheet.status !== 'draft' && sheet.status !== 'returned') return res.status(400).json({ error: 'Cannot submit in current status' });

  const goals = db.prepare('SELECT * FROM goals WHERE goal_sheet_id = ?').all(req.params.id);
  if (goals.length === 0) return res.status(400).json({ error: 'Add at least one goal' });
  if (goals.length > 8) return res.status(400).json({ error: 'Maximum 8 goals allowed' });

  const totalWeight = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (Math.abs(totalWeight - 100) > 0.01) return res.status(400).json({ error: `Total weightage must be 100%. Current: ${totalWeight}%` });

  db.prepare("UPDATE goal_sheets SET status = 'submitted', submitted_at = datetime('now') WHERE id = ?").run(req.params.id);
  logAudit(req.session.user.id, 'SUBMIT_GOAL_SHEET', 'goal_sheet', req.params.id, 'draft', 'submitted', 'Submitted for approval');
  res.json({ success: true });
});

// Manager approve
app.put('/api/goalsheets/:id/approve', requireRole('manager', 'admin'), (req, res) => {
  const sheet = db.prepare('SELECT * FROM goal_sheets WHERE id = ?').get(req.params.id);
  if (!sheet || sheet.status !== 'submitted') return res.status(400).json({ error: 'Cannot approve' });

  db.prepare("UPDATE goal_sheets SET status = 'approved', approved_at = datetime('now'), approved_by = ? WHERE id = ?").run(req.session.user.id, req.params.id);
  logAudit(req.session.user.id, 'APPROVE_GOAL_SHEET', 'goal_sheet', req.params.id, 'submitted', 'approved', 'Approved by manager');
  res.json({ success: true });
});

// Manager return for rework
app.put('/api/goalsheets/:id/return', requireRole('manager', 'admin'), (req, res) => {
  const sheet = db.prepare('SELECT * FROM goal_sheets WHERE id = ?').get(req.params.id);
  if (!sheet || sheet.status !== 'submitted') return res.status(400).json({ error: 'Cannot return' });

  db.prepare("UPDATE goal_sheets SET status = 'returned', return_comment = ? WHERE id = ?").run(req.body.comment || '', req.params.id);
  logAudit(req.session.user.id, 'RETURN_GOAL_SHEET', 'goal_sheet', req.params.id, 'submitted', 'returned', req.body.comment);
  res.json({ success: true });
});

// Admin unlock
app.put('/api/goalsheets/:id/unlock', requireRole('admin'), (req, res) => {
  db.prepare("UPDATE goal_sheets SET status = 'draft' WHERE id = ?").run(req.params.id);
  logAudit(req.session.user.id, 'UNLOCK_GOAL_SHEET', 'goal_sheet', req.params.id, null, 'draft', 'Admin unlocked goal sheet');
  res.json({ success: true });
});

// ─── GOAL ROUTES ─────────────────────────────────────
app.post('/api/goals', requireAuth, (req, res) => {
  const { goal_sheet_id, thrust_area, title, description, uom_type, target_value, weightage } = req.body;
  const sheet = db.prepare('SELECT * FROM goal_sheets WHERE id = ?').get(goal_sheet_id);
  if (!sheet || (sheet.status !== 'draft' && sheet.status !== 'returned')) return res.status(400).json({ error: 'Cannot add goals to this sheet' });

  const existingGoals = db.prepare('SELECT COUNT(*) as count FROM goals WHERE goal_sheet_id = ?').get(goal_sheet_id);
  if (existingGoals.count >= 8) return res.status(400).json({ error: 'Maximum 8 goals allowed' });

  if (weightage < 10) return res.status(400).json({ error: 'Minimum weightage is 10%' });

  const result = db.prepare('INSERT INTO goals (goal_sheet_id, thrust_area, title, description, uom_type, target_value, weightage, sort_order) VALUES (?,?,?,?,?,?,?,?)').run(goal_sheet_id, thrust_area, title, description, uom_type, target_value, weightage, existingGoals.count);
  logAudit(req.session.user.id, 'CREATE_GOAL', 'goal', result.lastInsertRowid, null, null, `Created goal: ${title}`);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/goals/:id', requireAuth, (req, res) => {
  const goal = db.prepare('SELECT g.*, gs.status as sheet_status, gs.employee_id FROM goals g JOIN goal_sheets gs ON g.goal_sheet_id = gs.id WHERE g.id = ?').get(req.params.id);
  if (!goal) return res.status(404).json({ error: 'Not found' });

  const user = req.session.user;
  // Employee can edit if draft/returned
  if (user.role === 'employee' && (goal.sheet_status !== 'draft' && goal.sheet_status !== 'returned')) {
    return res.status(400).json({ error: 'Cannot edit locked goals' });
  }
  // Manager can edit inline during approval (submitted status)
  if (user.role === 'manager' && goal.sheet_status !== 'submitted') {
    return res.status(400).json({ error: 'Can only edit during approval' });
  }

  const { thrust_area, title, description, uom_type, target_value, weightage } = req.body;
  
  // For shared goals, recipients can only adjust weightage
  if (goal.is_shared && goal.shared_from_goal_id && user.id === goal.sheet_status) {
    db.prepare('UPDATE goals SET weightage = ? WHERE id = ?').run(weightage, req.params.id);
  } else {
    const oldValue = JSON.stringify(goal);
    db.prepare('UPDATE goals SET thrust_area=?, title=?, description=?, uom_type=?, target_value=?, weightage=? WHERE id=?').run(thrust_area || goal.thrust_area, title || goal.title, description !== undefined ? description : goal.description, uom_type || goal.uom_type, target_value || goal.target_value, weightage || goal.weightage, req.params.id);
    logAudit(user.id, 'UPDATE_GOAL', 'goal', req.params.id, oldValue, JSON.stringify(req.body), 'Updated goal');
  }
  res.json({ success: true });
});

app.delete('/api/goals/:id', requireAuth, (req, res) => {
  const goal = db.prepare('SELECT g.*, gs.status as sheet_status FROM goals g JOIN goal_sheets gs ON g.goal_sheet_id = gs.id WHERE g.id = ?').get(req.params.id);
  if (!goal) return res.status(404).json({ error: 'Not found' });
  if (goal.sheet_status !== 'draft' && goal.sheet_status !== 'returned') return res.status(400).json({ error: 'Cannot delete locked goals' });

  db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
  logAudit(req.session.user.id, 'DELETE_GOAL', 'goal', req.params.id, null, null, `Deleted goal: ${goal.title}`);
  res.json({ success: true });
});

// Shared goals
app.post('/api/goals/share', requireRole('manager', 'admin'), (req, res) => {
  const { goal_id, employee_ids } = req.body;
  const sourceGoal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goal_id);
  if (!sourceGoal) return res.status(404).json({ error: 'Source goal not found' });

  const results = [];
  for (const empId of employee_ids) {
    const cycle = db.prepare('SELECT * FROM cycles WHERE is_active = 1').get();
    let sheet = db.prepare('SELECT * FROM goal_sheets WHERE employee_id = ? AND cycle_id = ?').get(empId, cycle.id);
    if (!sheet) {
      const r = db.prepare('INSERT INTO goal_sheets (employee_id, cycle_id, status) VALUES (?, ?, ?)').run(empId, cycle.id, 'draft');
      sheet = { id: r.lastInsertRowid };
    }
    const r = db.prepare('INSERT INTO goals (goal_sheet_id, thrust_area, title, description, uom_type, target_value, weightage, is_shared, shared_from_goal_id, shared_by_user_id) VALUES (?,?,?,?,?,?,?,1,?,?)').run(sheet.id, sourceGoal.thrust_area, sourceGoal.title, sourceGoal.description, sourceGoal.uom_type, sourceGoal.target_value, sourceGoal.weightage, goal_id, req.session.user.id);
    results.push(r.lastInsertRowid);
  }
  logAudit(req.session.user.id, 'SHARE_GOAL', 'goal', goal_id, null, null, `Shared to ${employee_ids.length} employees`);
  res.json({ shared_goal_ids: results });
});

// ─── ACHIEVEMENT ROUTES ──────────────────────────────
app.post('/api/achievements', requireAuth, (req, res) => {
  const { goal_id, quarter, actual_value, status } = req.body;
  
  const goal = db.prepare(`SELECT g.*, gs.employee_id, gs.status as sheet_status FROM goals g JOIN goal_sheets gs ON g.goal_sheet_id = gs.id WHERE g.id = ?`).get(goal_id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  if (goal.sheet_status !== 'approved') return res.status(400).json({ error: 'Goal sheet must be approved first' });

  // Calculate progress score
  const progressScore = calculateProgress(goal.uom_type, goal.target_value, actual_value);

  const existing = db.prepare('SELECT * FROM achievements WHERE goal_id = ? AND quarter = ?').get(goal_id, quarter);
  if (existing) {
    db.prepare("UPDATE achievements SET actual_value = ?, status = ?, progress_score = ?, updated_at = datetime('now') WHERE id = ?").run(actual_value, status, progressScore, existing.id);
  } else {
    db.prepare('INSERT INTO achievements (goal_id, quarter, actual_value, status, progress_score) VALUES (?,?,?,?,?)').run(goal_id, quarter, actual_value, status, progressScore);
  }

  // Sync shared goals
  if (goal.is_shared === 0) {
    const linkedGoals = db.prepare('SELECT id FROM goals WHERE shared_from_goal_id = ?').all(goal_id);
    for (const lg of linkedGoals) {
      const lexisting = db.prepare('SELECT * FROM achievements WHERE goal_id = ? AND quarter = ?').get(lg.id, quarter);
      if (lexisting) {
        db.prepare("UPDATE achievements SET actual_value = ?, progress_score = ?, updated_at = datetime('now') WHERE id = ?").run(actual_value, progressScore, lexisting.id);
      } else {
        db.prepare('INSERT INTO achievements (goal_id, quarter, actual_value, status, progress_score) VALUES (?,?,?,?,?)').run(lg.id, quarter, actual_value, 'on_track', progressScore);
      }
    }
  }

  logAudit(req.session.user.id, 'UPDATE_ACHIEVEMENT', 'achievement', goal_id, null, actual_value, `${quarter} achievement update`);
  res.json({ success: true, progress_score: progressScore });
});

// ─── CHECK-IN ROUTES ─────────────────────────────────
app.post('/api/checkins', requireRole('manager', 'admin'), (req, res) => {
  const { goal_sheet_id, quarter, comment } = req.body;
  
  const existing = db.prepare('SELECT * FROM checkins WHERE goal_sheet_id = ? AND quarter = ?').get(goal_sheet_id, quarter);
  if (existing) {
    db.prepare("UPDATE checkins SET comment = ?, completed_at = datetime('now') WHERE id = ?").run(comment, existing.id);
  } else {
    db.prepare('INSERT INTO checkins (goal_sheet_id, quarter, manager_id, comment) VALUES (?,?,?,?)').run(goal_sheet_id, quarter, req.session.user.id, comment);
  }
  logAudit(req.session.user.id, 'CHECKIN', 'goal_sheet', goal_sheet_id, null, null, `${quarter} check-in completed`);
  res.json({ success: true });
});

// ─── REPORT ROUTES ───────────────────────────────────
app.get('/api/reports/achievement', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.full_name, u.department, g.title as goal_title, g.thrust_area, g.uom_type, g.target_value, g.weightage,
      a.quarter, a.actual_value, a.status, a.progress_score, c.name as cycle_name
    FROM goals g
    JOIN goal_sheets gs ON g.goal_sheet_id = gs.id
    JOIN users u ON gs.employee_id = u.id
    JOIN cycles c ON gs.cycle_id = c.id
    LEFT JOIN achievements a ON g.id = a.goal_id
    ORDER BY u.full_name, g.sort_order, a.quarter
  `).all();
  res.json(rows);
});

app.get('/api/reports/achievement/csv', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.full_name as Employee, u.department as Department, g.title as Goal, g.thrust_area as "Thrust Area",
      g.uom_type as "UoM Type", g.target_value as Target, g.weightage as "Weightage %",
      a.quarter as Quarter, a.actual_value as "Actual Achievement", a.status as Status,
      ROUND(a.progress_score * 100, 1) as "Progress %"
    FROM goals g
    JOIN goal_sheets gs ON g.goal_sheet_id = gs.id
    JOIN users u ON gs.employee_id = u.id
    LEFT JOIN achievements a ON g.id = a.goal_id
    WHERE gs.cycle_id = (SELECT id FROM cycles WHERE is_active = 1)
    ORDER BY u.full_name, g.sort_order
  `).all();

  if (rows.length === 0) return res.status(404).json({ error: 'No data' });
  
  const headers = Object.keys(rows[0]);
  let csv = headers.join(',') + '\n';
  for (const row of rows) {
    csv += headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=achievement_report.csv');
  res.send(csv);
});

app.get('/api/reports/completion', requireAuth, (req, res) => {
  const cycle = db.prepare('SELECT * FROM cycles WHERE is_active = 1').get();
  if (!cycle) return res.json({ cycle: null, data: [] });

  const data = db.prepare(`
    SELECT u.id, u.full_name, u.department, u.role,
      gs.status as goal_status,
      (SELECT COUNT(*) FROM checkins ci WHERE ci.goal_sheet_id = gs.id AND ci.quarter = 'Q1') as q1_checkin,
      (SELECT COUNT(*) FROM checkins ci WHERE ci.goal_sheet_id = gs.id AND ci.quarter = 'Q2') as q2_checkin,
      (SELECT COUNT(*) FROM checkins ci WHERE ci.goal_sheet_id = gs.id AND ci.quarter = 'Q3') as q3_checkin,
      (SELECT COUNT(*) FROM checkins ci WHERE ci.goal_sheet_id = gs.id AND ci.quarter = 'Q4') as q4_checkin
    FROM users u
    LEFT JOIN goal_sheets gs ON gs.employee_id = u.id AND gs.cycle_id = ?
    WHERE u.role != 'admin'
    ORDER BY u.department, u.full_name
  `).all(cycle.id);

  res.json({ cycle, data });
});

// ─── AUDIT LOG ROUTES ────────────────────────────────
app.get('/api/audit', requireRole('admin'), (req, res) => {
  const logs = db.prepare(`SELECT al.*, u.full_name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 200`).all();
  res.json(logs);
});

// ─── DASHBOARD STATS ─────────────────────────────────
app.get('/api/dashboard/stats', requireAuth, (req, res) => {
  const user = req.session.user;
  const cycle = db.prepare('SELECT * FROM cycles WHERE is_active = 1').get();
  if (!cycle) return res.json({ cycle: null });

  const stats = { cycle };

  if (user.role === 'admin') {
    stats.totalEmployees = db.prepare("SELECT COUNT(*) as c FROM users WHERE role != 'admin'").get().c;
    stats.totalGoalSheets = db.prepare('SELECT COUNT(*) as c FROM goal_sheets WHERE cycle_id = ?').get(cycle.id).c;
    stats.approvedSheets = db.prepare("SELECT COUNT(*) as c FROM goal_sheets WHERE cycle_id = ? AND status = 'approved'").get(cycle.id).c;
    stats.pendingSheets = db.prepare("SELECT COUNT(*) as c FROM goal_sheets WHERE cycle_id = ? AND status = 'submitted'").get(cycle.id).c;
    stats.draftSheets = db.prepare("SELECT COUNT(*) as c FROM goal_sheets WHERE cycle_id = ? AND status = 'draft'").get(cycle.id).c;
  } else if (user.role === 'manager') {
    stats.teamSize = db.prepare('SELECT COUNT(*) as c FROM users WHERE manager_id = ?').get(user.id).c;
    stats.teamSubmitted = db.prepare("SELECT COUNT(*) as c FROM goal_sheets gs JOIN users u ON gs.employee_id = u.id WHERE u.manager_id = ? AND gs.cycle_id = ? AND gs.status = 'submitted'").get(user.id, cycle.id).c;
    stats.teamApproved = db.prepare("SELECT COUNT(*) as c FROM goal_sheets gs JOIN users u ON gs.employee_id = u.id WHERE u.manager_id = ? AND gs.cycle_id = ? AND gs.status = 'approved'").get(user.id, cycle.id).c;
  } else {
    const mySheet = db.prepare('SELECT * FROM goal_sheets WHERE employee_id = ? AND cycle_id = ?').get(user.id, cycle.id);
    stats.mySheet = mySheet;
    if (mySheet) {
      stats.myGoals = db.prepare('SELECT COUNT(*) as c FROM goals WHERE goal_sheet_id = ?').get(mySheet.id).c;
      stats.myWeightage = db.prepare('SELECT COALESCE(SUM(weightage), 0) as s FROM goals WHERE goal_sheet_id = ?').get(mySheet.id).s;
    }
  }
  res.json(stats);
});

// Helper functions
function calculateProgress(uomType, target, actual) {
  if (!actual || actual === '' || actual === null) return 0;
  const t = parseFloat(target);
  const a = parseFloat(actual);

  switch (uomType) {
    case 'numeric_min':
    case 'percentage_min':
      return t === 0 ? (a > 0 ? 1 : 0) : Math.min(a / t, 2);
    case 'numeric_max':
    case 'percentage_max':
      return a === 0 ? 2 : Math.min(t / a, 2);
    case 'timeline':
      // For timeline, compare dates
      const targetDate = new Date(target);
      const actualDate = new Date(actual);
      if (actualDate <= targetDate) return 1;
      const diffDays = (actualDate - targetDate) / (1000 * 60 * 60 * 24);
      return Math.max(0, 1 - (diffDays / 30) * 0.1);
    case 'zero':
      return a === 0 ? 1 : 0;
    default:
      return 0;
  }
}

function logAudit(userId, action, entityType, entityId, oldValue, newValue, details) {
  db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, details) VALUES (?,?,?,?,?,?,?)').run(userId, action, entityType, entityId, oldValue, newValue, details);
}

// Serve main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 AtomQuest Goal Tracker running on http://localhost:${PORT}`);
});
