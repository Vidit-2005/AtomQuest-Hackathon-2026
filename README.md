# AtomQuest GoalTracker — Goal Setting & Tracking Portal

> **AtomQuest Hackathon 1.0** | In-House Goal Setting & Tracking Portal

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Express](https://img.shields.io/badge/Express-4.21-blue) ![SQLite](https://img.shields.io/badge/SQLite-3-orange)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Seed the database with demo data
npm run seed

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

## 🔑 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| 👑 Admin | `admin` | `admin123` |
| 👔 Manager | `manager1` | `manager123` |
| 👤 Employee | `emp1` | `emp123` |

## ✅ Features Implemented

### Phase 1 — Goal Creation & Approval (Must-Have)
- ✅ Employee goal sheet creation with Thrust Area, Title, Description, UoM, Target, Weightage
- ✅ **Validation rules**: Total weightage = 100%, min 10% per goal, max 8 goals
- ✅ Manager approval workflow (approve / return for rework)
- ✅ Goals locked after approval — admin unlock capability
- ✅ Shared Goals support

### Phase 2 — Achievement Tracking & Check-ins (Must-Have)
- ✅ Quarterly achievement logging (Q1–Q4)
- ✅ Status tracking: Not Started / On Track / Completed
- ✅ Manager check-in module with structured comments
- ✅ Auto-computed progress scores by UoM type (Min, Max, Timeline, Zero)
- ✅ Achievement sync for shared goals

### Reporting & Governance
- ✅ Achievement Report with CSV/Excel export
- ✅ Completion Dashboard (real-time check-in status)
- ✅ Audit Trail (all changes logged with who/what/when)

### Bonus Features
- ✅ Role-based dashboards with analytics
- ✅ Cycle management by Admin
- ✅ Org hierarchy visibility

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  ┌──────────────────────────────────────┐   │
│  │     Single Page Application (SPA)     │   │
│  │   HTML + CSS + Vanilla JavaScript     │   │
│  │   • Dark theme with glassmorphism     │   │
│  │   • Responsive design                 │   │
│  │   • Dynamic page routing              │   │
│  └──────────────┬───────────────────────┘   │
└─────────────────┼───────────────────────────┘
                  │ REST API (JSON)
┌─────────────────┼───────────────────────────┐
│  ┌──────────────▼───────────────────────┐   │
│  │        Express.js Server              │   │
│  │   • Session-based authentication      │   │
│  │   • Role-based access control         │   │
│  │   • Input validation                  │   │
│  │   • Progress score computation        │   │
│  │   • Audit logging                     │   │
│  └──────────────┬───────────────────────┘   │
│  ┌──────────────▼───────────────────────┐   │
│  │        SQLite Database                │   │
│  │   • users, cycles, goal_sheets        │   │
│  │   • goals, achievements, checkins     │   │
│  │   • audit_logs, escalations           │   │
│  │   • WAL mode for performance          │   │
│  └──────────────────────────────────────┘   │
│                Node.js Server                │
└─────────────────────────────────────────────┘
```

### Technology Choices & Cost Optimization
| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend | Vanilla HTML/CSS/JS | Zero build step, fast load, no framework overhead |
| Backend | Node.js + Express | Lightweight, fast, minimal dependencies |
| Database | SQLite (better-sqlite3) | Zero-config, embedded, no separate DB server needed |
| Auth | Express sessions | Simple, server-side, no external service costs |
| Hosting | Single process | Can run on cheapest VPS ($5/month) or free tiers |

## 📁 Project Structure

```
hackethon/
├── server.js          # Express server + API routes
├── database.js        # SQLite schema & connection
├── seed.js            # Demo data seeder
├── package.json       # Dependencies
├── goaltracker.db     # SQLite database (auto-created)
└── public/
    ├── index.html     # SPA entry point
    ├── css/
    │   └── style.css  # Complete design system
    └── js/
        ├── app.js     # Module loader & init
        ├── api.js     # API client
        ├── ui.js      # UI utilities (toasts, modals)
        ├── login.js   # Login page
        ├── layout.js  # Sidebar & navigation
        ├── dashboard.js    # Dashboard page
        ├── goalsheets.js   # Goal sheets list & detail
        ├── modals.js       # Goal/Achievement/Check-in forms
        └── pages.js        # Team, Cycles, Users, Reports, Audit
```

## 📄 License
Built for AtomQuest Hackathon 1.0
