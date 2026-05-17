const db = require('./database');

// Seed demo data
function seed() {
  // Clear existing data
  db.exec(`DELETE FROM audit_logs; DELETE FROM escalations; DELETE FROM checkins; DELETE FROM achievements; DELETE FROM goals; DELETE FROM goal_sheets; DELETE FROM cycles; DELETE FROM users;`);

  // Insert users
  const insertUser = db.prepare(`INSERT INTO users (username, password, full_name, email, role, department, manager_id) VALUES (?,?,?,?,?,?,?)`);

  const users = [
    ['admin', 'admin123', 'Priya Sharma', 'priya@company.com', 'admin', 'HR', null],
    ['manager1', 'manager123', 'Rajesh Kumar', 'rajesh@company.com', 'manager', 'Engineering', null],
    ['manager2', 'manager123', 'Anita Desai', 'anita@company.com', 'manager', 'Sales', null],
    ['emp1', 'emp123', 'Sneha Patel', 'sneha@company.com', 'employee', 'Engineering', 2],
    ['emp2', 'emp123', 'Arjun Mehta', 'arjun@company.com', 'employee', 'Sales', 3],
    ['emp3', 'emp123', 'Kavita Singh', 'kavita@company.com', 'employee', 'Sales', 3],
  ];

  const insertMany = db.transaction(() => {
    for (const u of users) {
      insertUser.run(...u);
    }
  });
  insertMany();

  // Insert cycle
  db.prepare(`INSERT INTO cycles (name, year, goal_setting_start, goal_setting_end, q1_start, q1_end, q2_start, q2_end, q3_start, q3_end, q4_start, q4_end, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    'FY 2026-27', 2026,
    '2026-05-01', '2026-06-30',
    '2026-07-01', '2026-07-31',
    '2026-10-01', '2026-10-31',
    '2027-01-01', '2027-01-31',
    '2027-03-01', '2027-04-30',
    1
  );

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('──────────────────────────────');
  console.log('Admin:    admin / admin123');
  console.log('Manager:  manager1 / manager123');
  console.log('Employee: emp1 / emp123');
  console.log('──────────────────────────────');
}

seed();
