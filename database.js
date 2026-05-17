const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'goaltracker.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK(role IN ('employee','manager','admin')),
    department TEXT,
    manager_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (manager_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    goal_setting_start TEXT NOT NULL,
    goal_setting_end TEXT NOT NULL,
    q1_start TEXT, q1_end TEXT,
    q2_start TEXT, q2_end TEXT,
    q3_start TEXT, q3_end TEXT,
    q4_start TEXT, q4_end TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS goal_sheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    cycle_id INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','submitted','returned','approved','locked')),
    submitted_at TEXT,
    approved_at TEXT,
    approved_by INTEGER,
    return_comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (cycle_id) REFERENCES cycles(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE(employee_id, cycle_id)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_sheet_id INTEGER NOT NULL,
    thrust_area TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    uom_type TEXT NOT NULL CHECK(uom_type IN ('numeric_min','numeric_max','percentage_min','percentage_max','timeline','zero')),
    target_value TEXT NOT NULL,
    weightage REAL NOT NULL CHECK(weightage >= 10),
    is_shared INTEGER DEFAULT 0,
    shared_from_goal_id INTEGER,
    shared_by_user_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (goal_sheet_id) REFERENCES goal_sheets(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_from_goal_id) REFERENCES goals(id),
    FOREIGN KEY (shared_by_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    quarter TEXT NOT NULL CHECK(quarter IN ('Q1','Q2','Q3','Q4')),
    actual_value TEXT,
    status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started','on_track','completed')),
    progress_score REAL,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    UNIQUE(goal_id, quarter)
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_sheet_id INTEGER NOT NULL,
    quarter TEXT NOT NULL CHECK(quarter IN ('Q1','Q2','Q3','Q4')),
    manager_id INTEGER NOT NULL,
    comment TEXT,
    completed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (goal_sheet_id) REFERENCES goal_sheets(id),
    FOREIGN KEY (manager_id) REFERENCES users(id),
    UNIQUE(goal_sheet_id, quarter)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS escalations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    target_user_id INTEGER NOT NULL,
    cycle_id INTEGER NOT NULL,
    level INTEGER DEFAULT 1,
    status TEXT DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved')),
    triggered_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    FOREIGN KEY (target_user_id) REFERENCES users(id),
    FOREIGN KEY (cycle_id) REFERENCES cycles(id)
  );
`);

module.exports = db;
