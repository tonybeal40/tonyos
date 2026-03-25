import Database from "better-sqlite3";
import { initializeSchema } from "./schema.js";

const db = new Database("tony_crm.db");

db.pragma("foreign_keys = ON");

initializeSchema(db);

export function saveAccount(data) {
  const stmt = db.prepare(`
    INSERT INTO accounts (
      company_name, domain, website, linkedin_url, industry, naics, sic,
      employees, revenue, division_fit, persona_score, tier, tier_reason,
      pain_points, why_natoli, is_primary_market, is_qualified, detected_industry, status
    ) VALUES (
      @company_name, @domain, @website, @linkedin_url, @industry, @naics, @sic,
      @employees, @revenue, @division_fit, @persona_score, @tier, @tier_reason,
      @pain_points, @why_natoli, @is_primary_market, @is_qualified, @detected_industry, @status
    )
    ON CONFLICT(domain) DO UPDATE SET
      company_name = excluded.company_name,
      website = excluded.website,
      linkedin_url = excluded.linkedin_url,
      industry = excluded.industry,
      naics = excluded.naics,
      sic = excluded.sic,
      employees = excluded.employees,
      revenue = excluded.revenue,
      division_fit = excluded.division_fit,
      persona_score = excluded.persona_score,
      tier = excluded.tier,
      tier_reason = excluded.tier_reason,
      pain_points = excluded.pain_points,
      why_natoli = excluded.why_natoli,
      is_primary_market = excluded.is_primary_market,
      is_qualified = excluded.is_qualified,
      detected_industry = excluded.detected_industry,
      updated_at = CURRENT_TIMESTAMP
  `);

  const result = stmt.run({
    company_name: data.company || data.company_name,
    domain: data.domain || data.website?.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0],
    website: data.website,
    linkedin_url: data.linkedin || data.linkedin_url,
    industry: data.industry,
    naics: JSON.stringify(data.naics || []),
    sic: JSON.stringify(data.sic || []),
    employees: data.employees,
    revenue: data.revenue,
    division_fit: data.division_fit,
    persona_score: data.persona_score,
    tier: data.tier,
    tier_reason: data.tier_reason,
    pain_points: JSON.stringify(data.pain_points || []),
    why_natoli: data.why_natoli,
    is_primary_market: data.is_primary_market ? 1 : 0,
    is_qualified: data.is_qualified ? 1 : 0,
    detected_industry: data.detected_industry,
    status: data.status || "New"
  });

  return result.lastInsertRowid || getAccountByDomain(data.domain)?.id;
}

export function getAccountByDomain(domain) {
  const stmt = db.prepare("SELECT * FROM accounts WHERE domain = ?");
  const row = stmt.get(domain);
  if (row) {
    row.naics = JSON.parse(row.naics || "[]");
    row.sic = JSON.parse(row.sic || "[]");
    row.pain_points = JSON.parse(row.pain_points || "[]");
    row.is_primary_market = !!row.is_primary_market;
    row.is_qualified = !!row.is_qualified;
  }
  return row;
}

export function getAccountById(id) {
  const stmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  const row = stmt.get(id);
  if (row) {
    row.naics = JSON.parse(row.naics || "[]");
    row.sic = JSON.parse(row.sic || "[]");
    row.pain_points = JSON.parse(row.pain_points || "[]");
    row.is_primary_market = !!row.is_primary_market;
    row.is_qualified = !!row.is_qualified;
  }
  return row;
}

export function getAllAccounts(filters = {}) {
  let query = "SELECT * FROM accounts WHERE 1=1";
  const params = [];

  if (filters.tier) {
    query += " AND tier = ?";
    params.push(filters.tier);
  }
  if (filters.division) {
    query += " AND division_fit = ?";
    params.push(filters.division);
  }
  if (filters.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }
  if (filters.qualified !== undefined) {
    query += " AND is_qualified = ?";
    params.push(filters.qualified ? 1 : 0);
  }

  query += " ORDER BY created_at DESC";

  if (filters.limit) {
    query += " LIMIT ?";
    params.push(filters.limit);
  }

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  
  return rows.map(row => {
    row.naics = JSON.parse(row.naics || "[]");
    row.sic = JSON.parse(row.sic || "[]");
    row.pain_points = JSON.parse(row.pain_points || "[]");
    row.is_primary_market = !!row.is_primary_market;
    row.is_qualified = !!row.is_qualified;
    return row;
  });
}

export function updateAccountStatus(id, status) {
  const stmt = db.prepare("UPDATE accounts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  return stmt.run(status, id);
}

export function saveContact(accountId, contact) {
  const stmt = db.prepare(`
    INSERT INTO contacts (account_id, name, title, email, linkedin_url, persona_type, persona_weight)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    accountId,
    contact.name,
    contact.title,
    contact.email,
    contact.linkedin || contact.linkedin_url,
    contact.persona_type,
    contact.weight || contact.persona_weight
  );
}

export function getContactsByAccount(accountId) {
  const stmt = db.prepare("SELECT * FROM contacts WHERE account_id = ? ORDER BY persona_weight DESC");
  return stmt.all(accountId);
}

export function saveNote(accountId, note, noteType = "general", createdBy = "system") {
  const stmt = db.prepare(`
    INSERT INTO notes (account_id, note, note_type, created_by)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(accountId, note, noteType, createdBy);
}

export function getNotesByAccount(accountId) {
  const stmt = db.prepare("SELECT * FROM notes WHERE account_id = ? ORDER BY created_at DESC");
  return stmt.all(accountId);
}

export function saveActivity(accountId, activityType, description, outcome = null) {
  const stmt = db.prepare(`
    INSERT INTO activities (account_id, activity_type, description, outcome)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(accountId, activityType, description, outcome);
}

export function getActivitiesByAccount(accountId) {
  const stmt = db.prepare("SELECT * FROM activities WHERE account_id = ? ORDER BY created_at DESC");
  return stmt.all(accountId);
}

export function getStats() {
  const total = db.prepare("SELECT COUNT(*) as count FROM accounts").get().count;
  const qualified = db.prepare("SELECT COUNT(*) as count FROM accounts WHERE is_qualified = 1").get().count;
  const tierA = db.prepare("SELECT COUNT(*) as count FROM accounts WHERE tier = 'A'").get().count;
  const tierB = db.prepare("SELECT COUNT(*) as count FROM accounts WHERE tier = 'B'").get().count;
  const tierC = db.prepare("SELECT COUNT(*) as count FROM accounts WHERE tier = 'C'").get().count;
  const contacts = db.prepare("SELECT COUNT(*) as count FROM contacts").get().count;

  return { total, qualified, tierA, tierB, tierC, contacts };
}

export function saveNewsArticle(accountId, article) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO news_intel (account_id, title, source, url, published_at, summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    accountId,
    article.title,
    article.source,
    article.url,
    article.published_at,
    article.summary
  );
}

export function saveNewsArticles(accountId, articles) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO news_intel (account_id, title, source, url, published_at, summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  articles.forEach(article => {
    stmt.run(
      accountId,
      article.title,
      article.source,
      article.url,
      article.published_at,
      article.summary
    );
  });
  
  return articles.length;
}

export function getNewsByAccount(accountId) {
  const stmt = db.prepare(`
    SELECT * FROM news_intel 
    WHERE account_id = ? 
    ORDER BY published_at DESC 
    LIMIT 5
  `);
  return stmt.all(accountId);
}

export function clearNewsByAccount(accountId) {
  const stmt = db.prepare("DELETE FROM news_intel WHERE account_id = ?");
  return stmt.run(accountId);
}

export function deleteAccountByDomain(domain) {
  const account = getAccountByDomain(domain);
  if (account) {
    db.prepare("DELETE FROM news_intel WHERE account_id = ?").run(account.id);
    db.prepare("DELETE FROM activities WHERE account_id = ?").run(account.id);
    db.prepare("DELETE FROM notes WHERE account_id = ?").run(account.id);
    db.prepare("DELETE FROM contacts WHERE account_id = ?").run(account.id);
    db.prepare("DELETE FROM deals WHERE account_id = ?").run(account.id);
    db.prepare("DELETE FROM tasks WHERE account_id = ?").run(account.id);
    db.prepare("DELETE FROM sites WHERE account_id = ?").run(account.id);
    db.prepare("DELETE FROM compliance_events WHERE account_id = ?").run(account.id);
    db.prepare("DELETE FROM intent_signals WHERE account_id = ?").run(account.id);
    db.prepare("DELETE FROM accounts WHERE id = ?").run(account.id);
    return true;
  }
  return false;
}

// ============ DEALS PIPELINE ============
export function saveDeal(data) {
  const stmt = db.prepare(`
    INSERT INTO deals (account_id, deal_name, stage, value, probability, expected_close_date, owner, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.account_id,
    data.deal_name,
    data.stage || 'Prospecting',
    data.value || 0,
    data.probability || 10,
    data.expected_close_date,
    data.owner || 'Tony',
    data.notes
  );
  return result.lastInsertRowid;
}

export function getDealsByAccount(accountId) {
  const stmt = db.prepare("SELECT * FROM deals WHERE account_id = ? ORDER BY updated_at DESC");
  return stmt.all(accountId);
}

export function getAllDeals(filters = {}) {
  let query = "SELECT d.*, a.company_name, a.domain FROM deals d LEFT JOIN accounts a ON d.account_id = a.id WHERE 1=1";
  const params = [];
  
  if (filters.stage) {
    query += " AND d.stage = ?";
    params.push(filters.stage);
  }
  if (filters.owner) {
    query += " AND d.owner = ?";
    params.push(filters.owner);
  }
  
  query += " ORDER BY d.updated_at DESC";
  
  if (filters.limit) {
    query += " LIMIT ?";
    params.push(filters.limit);
  }
  
  return db.prepare(query).all(...params);
}

export function updateDeal(id, data) {
  const fields = [];
  const params = [];
  
  if (data.stage !== undefined) { fields.push("stage = ?"); params.push(data.stage); }
  if (data.value !== undefined) { fields.push("value = ?"); params.push(data.value); }
  if (data.probability !== undefined) { fields.push("probability = ?"); params.push(data.probability); }
  if (data.expected_close_date !== undefined) { fields.push("expected_close_date = ?"); params.push(data.expected_close_date); }
  if (data.notes !== undefined) { fields.push("notes = ?"); params.push(data.notes); }
  if (data.deal_name !== undefined) { fields.push("deal_name = ?"); params.push(data.deal_name); }
  
  if (fields.length === 0) return null;
  
  fields.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  const stmt = db.prepare(`UPDATE deals SET ${fields.join(", ")} WHERE id = ?`);
  return stmt.run(...params);
}

export function deleteDeal(id) {
  return db.prepare("DELETE FROM deals WHERE id = ?").run(id);
}

export function getDealById(id) {
  return db.prepare("SELECT d.*, a.company_name, a.domain FROM deals d LEFT JOIN accounts a ON d.account_id = a.id WHERE d.id = ?").get(id);
}

export function getPipelineStats() {
  const stages = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const stats = {};
  
  for (const stage of stages) {
    const row = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(value), 0) as total FROM deals WHERE stage = ?").get(stage);
    stats[stage] = { count: row.count, total: row.total };
  }
  
  const weighted = db.prepare("SELECT COALESCE(SUM(value * probability / 100.0), 0) as weighted FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')").get();
  stats.weighted_pipeline = weighted.weighted;
  
  return stats;
}

// ============ TASKS SYSTEM ============
export function saveTask(data) {
  const stmt = db.prepare(`
    INSERT INTO tasks (account_id, deal_id, contact_id, task_type, title, description, due_date, due_time, priority, status, assigned_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.account_id,
    data.deal_id,
    data.contact_id,
    data.task_type || 'Follow-up',
    data.title,
    data.description,
    data.due_date,
    data.due_time,
    data.priority || 'Medium',
    data.status || 'Pending',
    data.assigned_to || 'Tony'
  );
  return result.lastInsertRowid;
}

export function getTasksByAccount(accountId) {
  return db.prepare("SELECT * FROM tasks WHERE account_id = ? ORDER BY due_date ASC, priority DESC").all(accountId);
}

export function getAllTasks(filters = {}) {
  let query = `SELECT t.*, a.company_name, a.domain 
               FROM tasks t 
               LEFT JOIN accounts a ON t.account_id = a.id 
               WHERE 1=1`;
  const params = [];
  
  if (filters.status) {
    query += " AND t.status = ?";
    params.push(filters.status);
  }
  if (filters.priority) {
    query += " AND t.priority = ?";
    params.push(filters.priority);
  }
  if (filters.due_date) {
    query += " AND t.due_date = ?";
    params.push(filters.due_date);
  }
  if (filters.overdue) {
    query += " AND t.due_date < date('now') AND t.status = 'Pending'";
  }
  if (filters.upcoming) {
    query += " AND t.due_date >= date('now') AND t.due_date <= date('now', '+7 days') AND t.status = 'Pending'";
  }
  
  query += " ORDER BY t.due_date ASC, CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END";
  
  if (filters.limit) {
    query += " LIMIT ?";
    params.push(filters.limit);
  }
  
  return db.prepare(query).all(...params);
}

export function updateTask(id, data) {
  const fields = [];
  const params = [];
  
  if (data.status !== undefined) { 
    fields.push("status = ?"); 
    params.push(data.status);
    if (data.status === 'Completed') {
      fields.push("completed_at = CURRENT_TIMESTAMP");
    }
  }
  if (data.title !== undefined) { fields.push("title = ?"); params.push(data.title); }
  if (data.description !== undefined) { fields.push("description = ?"); params.push(data.description); }
  if (data.due_date !== undefined) { fields.push("due_date = ?"); params.push(data.due_date); }
  if (data.due_time !== undefined) { fields.push("due_time = ?"); params.push(data.due_time); }
  if (data.priority !== undefined) { fields.push("priority = ?"); params.push(data.priority); }
  
  if (fields.length === 0) return null;
  params.push(id);
  
  return db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...params);
}

export function deleteTask(id) {
  return db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
}

export function getTaskStats() {
  const pending = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Pending'").get().count;
  const overdue = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Pending' AND due_date < date('now')").get().count;
  const dueToday = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Pending' AND due_date = date('now')").get().count;
  const dueThisWeek = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Pending' AND due_date >= date('now') AND due_date <= date('now', '+7 days')").get().count;
  const completed = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Completed'").get().count;
  
  return { pending, overdue, dueToday, dueThisWeek, completed };
}

// ============ SITES/PLANTS ============
export function saveSite(data) {
  const stmt = db.prepare(`
    INSERT INTO sites (account_id, site_name, site_type, address, city, state, country, employees, equipment, certifications, is_primary, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.account_id,
    data.site_name,
    data.site_type || 'Manufacturing',
    data.address,
    data.city,
    data.state,
    data.country || 'USA',
    data.employees,
    data.equipment,
    data.certifications,
    data.is_primary ? 1 : 0,
    data.notes
  );
  return result.lastInsertRowid;
}

export function getSitesByAccount(accountId) {
  return db.prepare("SELECT * FROM sites WHERE account_id = ? ORDER BY is_primary DESC, site_name ASC").all(accountId);
}

export function updateSite(id, data) {
  const fields = [];
  const params = [];
  
  if (data.site_name !== undefined) { fields.push("site_name = ?"); params.push(data.site_name); }
  if (data.site_type !== undefined) { fields.push("site_type = ?"); params.push(data.site_type); }
  if (data.address !== undefined) { fields.push("address = ?"); params.push(data.address); }
  if (data.city !== undefined) { fields.push("city = ?"); params.push(data.city); }
  if (data.state !== undefined) { fields.push("state = ?"); params.push(data.state); }
  if (data.employees !== undefined) { fields.push("employees = ?"); params.push(data.employees); }
  if (data.equipment !== undefined) { fields.push("equipment = ?"); params.push(data.equipment); }
  if (data.certifications !== undefined) { fields.push("certifications = ?"); params.push(data.certifications); }
  if (data.is_primary !== undefined) { fields.push("is_primary = ?"); params.push(data.is_primary ? 1 : 0); }
  if (data.notes !== undefined) { fields.push("notes = ?"); params.push(data.notes); }
  
  if (fields.length === 0) return null;
  params.push(id);
  
  return db.prepare(`UPDATE sites SET ${fields.join(", ")} WHERE id = ?`).run(...params);
}

export function deleteSite(id) {
  return db.prepare("DELETE FROM sites WHERE id = ?").run(id);
}

// ============ COMPLIANCE EVENTS ============
export function saveComplianceEvent(data) {
  const stmt = db.prepare(`
    INSERT INTO compliance_events (account_id, event_type, title, description, event_date, status, source, url, impact)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.account_id,
    data.event_type,
    data.title,
    data.description,
    data.event_date,
    data.status || 'Upcoming',
    data.source,
    data.url,
    data.impact
  );
  return result.lastInsertRowid;
}

export function getComplianceEventsByAccount(accountId) {
  return db.prepare("SELECT * FROM compliance_events WHERE account_id = ? ORDER BY event_date ASC").all(accountId);
}

export function getAllComplianceEvents(filters = {}) {
  let query = `SELECT c.*, a.company_name, a.domain 
               FROM compliance_events c 
               LEFT JOIN accounts a ON c.account_id = a.id 
               WHERE 1=1`;
  const params = [];
  
  if (filters.event_type) {
    query += " AND c.event_type = ?";
    params.push(filters.event_type);
  }
  if (filters.status) {
    query += " AND c.status = ?";
    params.push(filters.status);
  }
  if (filters.upcoming) {
    query += " AND c.event_date >= date('now')";
  }
  
  query += " ORDER BY c.event_date ASC";
  
  if (filters.limit) {
    query += " LIMIT ?";
    params.push(filters.limit);
  }
  
  return db.prepare(query).all(...params);
}

export function updateComplianceEvent(id, data) {
  const fields = [];
  const params = [];
  
  if (data.event_type !== undefined) { fields.push("event_type = ?"); params.push(data.event_type); }
  if (data.title !== undefined) { fields.push("title = ?"); params.push(data.title); }
  if (data.description !== undefined) { fields.push("description = ?"); params.push(data.description); }
  if (data.event_date !== undefined) { fields.push("event_date = ?"); params.push(data.event_date); }
  if (data.status !== undefined) { fields.push("status = ?"); params.push(data.status); }
  if (data.impact !== undefined) { fields.push("impact = ?"); params.push(data.impact); }
  
  if (fields.length === 0) return null;
  params.push(id);
  
  return db.prepare(`UPDATE compliance_events SET ${fields.join(", ")} WHERE id = ?`).run(...params);
}

export function deleteComplianceEvent(id) {
  return db.prepare("DELETE FROM compliance_events WHERE id = ?").run(id);
}

// ============ INTENT SIGNALS ============
export function saveIntentSignal(data) {
  const stmt = db.prepare(`
    INSERT INTO intent_signals (account_id, signal_type, topic, strength, source, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.account_id,
    data.signal_type,
    data.topic,
    data.strength || 'Medium',
    data.source,
    data.expires_at
  );
  return result.lastInsertRowid;
}

export function getIntentSignalsByAccount(accountId) {
  return db.prepare("SELECT * FROM intent_signals WHERE account_id = ? AND (expires_at IS NULL OR expires_at > datetime('now')) ORDER BY detected_at DESC").all(accountId);
}

export function getAllIntentSignals(filters = {}) {
  let query = `SELECT i.*, a.company_name, a.domain 
               FROM intent_signals i 
               LEFT JOIN accounts a ON i.account_id = a.id 
               WHERE (i.expires_at IS NULL OR i.expires_at > datetime('now'))`;
  const params = [];
  
  if (filters.signal_type) {
    query += " AND i.signal_type = ?";
    params.push(filters.signal_type);
  }
  if (filters.strength) {
    query += " AND i.strength = ?";
    params.push(filters.strength);
  }
  
  query += " ORDER BY i.detected_at DESC";
  
  if (filters.limit) {
    query += " LIMIT ?";
    params.push(filters.limit);
  }
  
  return db.prepare(query).all(...params);
}

export function deleteIntentSignal(id) {
  return db.prepare("DELETE FROM intent_signals WHERE id = ?").run(id);
}

export default db;
