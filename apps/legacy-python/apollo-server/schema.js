export function initializeSchema(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      domain TEXT UNIQUE NOT NULL,
      website TEXT,
      linkedin_url TEXT,
      industry TEXT,
      naics TEXT,
      sic TEXT,
      employees INTEGER,
      revenue TEXT,
      division_fit TEXT,
      persona_score INTEGER,
      tier TEXT,
      tier_reason TEXT,
      pain_points TEXT,
      why_natoli TEXT,
      is_primary_market INTEGER DEFAULT 0,
      is_qualified INTEGER DEFAULT 0,
      detected_industry TEXT,
      status TEXT DEFAULT 'New',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      name TEXT,
      title TEXT,
      email TEXT,
      linkedin_url TEXT,
      persona_type TEXT,
      persona_weight INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      note_type TEXT DEFAULT 'general',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      description TEXT,
      outcome TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS news_intel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      source TEXT,
      url TEXT,
      published_at TEXT,
      summary TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      UNIQUE(account_id, url)
    )
  `).run();

  // Deal Pipeline stages
  db.prepare(`
    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      deal_name TEXT NOT NULL,
      stage TEXT DEFAULT 'Prospecting',
      value REAL DEFAULT 0,
      probability INTEGER DEFAULT 10,
      expected_close_date TEXT,
      owner TEXT DEFAULT 'Tony',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `).run();

  // Task/Follow-up System
  db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      deal_id INTEGER,
      contact_id INTEGER,
      task_type TEXT DEFAULT 'Follow-up',
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      due_time TEXT,
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'Pending',
      assigned_to TEXT DEFAULT 'Tony',
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
    )
  `).run();

  // Plant/Site Hierarchy
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      site_name TEXT NOT NULL,
      site_type TEXT DEFAULT 'Manufacturing',
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'USA',
      employees INTEGER,
      equipment TEXT,
      certifications TEXT,
      is_primary INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `).run();

  // Compliance Timeline
  db.prepare(`
    CREATE TABLE IF NOT EXISTS compliance_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT,
      status TEXT DEFAULT 'Upcoming',
      source TEXT,
      url TEXT,
      impact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `).run();

  // Intent Signals
  db.prepare(`
    CREATE TABLE IF NOT EXISTS intent_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      signal_type TEXT NOT NULL,
      topic TEXT,
      strength TEXT DEFAULT 'Medium',
      source TEXT,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `).run();

  console.log("[db] Schema initialized with CRM extensions");
}
