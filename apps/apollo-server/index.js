import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { enrichDomain, findPeopleAtCompany } from "./apollo.js";
import { scorePersonas, assignTier } from "./scoring.js";
import { routeNatoli, isQualified } from "./routing.js";
import { getPainPoints, getWhyNatoli } from "./pains.js";
import { getCached, setCache, getCacheStats, clearCache } from "./cache.js";
import { PERSONA_TITLES } from "./personas.js";
import {
  saveAccount, getAccountByDomain, getAccountById, getAllAccounts, updateAccountStatus,
  saveContact, getContactsByAccount,
  saveNote, getNotesByAccount,
  saveActivity, getActivitiesByAccount,
  getStats,
  saveNewsArticles, getNewsByAccount, clearNewsByAccount,
  deleteAccountByDomain,
  // Deals Pipeline
  saveDeal, getDealsByAccount, getAllDeals, updateDeal, deleteDeal, getDealById, getPipelineStats,
  // Tasks System
  saveTask, getTasksByAccount, getAllTasks, updateTask, deleteTask, getTaskStats,
  // Sites/Plants
  saveSite, getSitesByAccount, updateSite, deleteSite,
  // Compliance Events
  saveComplianceEvent, getComplianceEventsByAccount, getAllComplianceEvents, updateComplianceEvent, deleteComplianceEvent,
  // Intent Signals
  saveIntentSignal, getIntentSignalsByAccount, getAllIntentSignals, deleteIntentSignal
} from "./db.js";
import { fetchCompanyNews, fetchAllNews } from "./news.js";
import { generateOutreach, generateFollowUp } from "./outreach.js";
import { getMetrics } from "./metrics.js";
import { getUser, getAllUsers, createUser, updateUserRole, deleteUser, getRoles, requirePermission } from "./roles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.APOLLO_PORT || 3001;

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "Tony CRM Apollo Server",
    hasApiKey: !!process.env.APOLLO_API_KEY,
    cache: getCacheStats(),
    database: getStats()
  });
});

app.get("/account/:id", (req, res) => {
  res.redirect(`/account.html?id=${req.params.id}`);
});

app.post("/analyze", async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    const cached = getCached(domain);
    if (cached) {
      const cleanDomain = domain.toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0];
      const existingAccount = getAccountByDomain(cleanDomain);
      return res.json({ 
        ...cached, 
        fromCache: true,
        account_id: existingAccount?.id || cached.account_id
      });
    }

    const company = await enrichDomain(domain);
    if (!company) {
      return res.status(404).json({ error: "Company not found in Apollo" });
    }

    // Simplified: Skip persona search (Apollo API validation issues)
    // Focus on reliable company enrichment data
    let personaData = { score: 0, matched: [], byCategory: {} };

    const routing = routeNatoli(company);
    // Assign tier based on primary market fit (persona scoring disabled)
    const tierResult = routing.isPrimary 
      ? { tier: "B", reason: "Primary market match - persona discovery recommended" }
      : { tier: "C", reason: "Not in primary market" };
    const pains = getPainPoints(routing.division, routing.detectedIndustry);
    const whyNatoli = getWhyNatoli(routing.division);

    const output = {
      company: company.name,
      website: company.website_url || company.primary_domain,
      linkedin: company.linkedin_url,
      employees: company.estimated_num_employees,
      revenue: company.annual_revenue_printed || company.annual_revenue,
      naics: company.naics_codes || [],
      sic: company.sic_codes || [],
      industry: company.industry,
      keywords: company.keywords || [],
      detected_industry: routing.detectedIndustry,
      division_fit: routing.division,
      is_primary_market: routing.isPrimary,
      is_qualified: isQualified(routing),
      persona_score: personaData.score,
      matched_personas: personaData.matched,
      personas_by_category: personaData.byCategory,
      tier: tierResult.tier,
      tier_reason: tierResult.reason,
      pain_points: pains,
      why_natoli: whyNatoli,
      enriched_at: new Date().toISOString()
    };

    setCache(domain, output);

    const cleanDomain = domain.toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
    
    try {
      const accountId = saveAccount({ ...output, domain: cleanDomain });
      output.account_id = accountId;

      if (personaData.matched && personaData.matched.length > 0) {
        for (const persona of personaData.matched) {
          saveContact(accountId, persona);
        }
      }

      saveActivity(accountId, "enrichment", `Enriched via Apollo.io`, `Tier ${output.tier}`);
    } catch (dbErr) {
      console.log("Could not save to database:", dbErr.message);
    }

    res.json(output);

  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/company/enrich", async (req, res) => {
  req.url = "/analyze";
  return app._router.handle(req, res);
});

app.get("/api/accounts", (req, res) => {
  try {
    const { tier, division, status, qualified, limit } = req.query;
    const filters = {};
    if (tier) filters.tier = tier;
    if (division) filters.division = division;
    if (status) filters.status = status;
    if (qualified !== undefined) filters.qualified = qualified === "true";
    if (limit) filters.limit = parseInt(limit);

    const accounts = getAllAccounts(filters);
    res.json({ accounts, count: accounts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/:id", (req, res) => {
  try {
    const account = getAccountById(parseInt(req.params.id));
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    const contacts = getContactsByAccount(account.id);
    const notes = getNotesByAccount(account.id);
    const activities = getActivitiesByAccount(account.id);

    res.json({ account, contacts, notes, activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/domain/:domain", (req, res) => {
  try {
    const account = getAccountByDomain(req.params.domain);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    const contacts = getContactsByAccount(account.id);
    const notes = getNotesByAccount(account.id);
    const activities = getActivitiesByAccount(account.id);

    res.json({ account, contacts, notes, activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/accounts/:id/status", (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    
    updateAccountStatus(parseInt(req.params.id), status);
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/accounts/:id/contacts", (req, res) => {
  try {
    const { name, title, email, linkedin_url, persona_type, weight } = req.body;
    const result = saveContact(parseInt(req.params.id), {
      name, title, email, linkedin_url, persona_type, weight
    });
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/:id/contacts", (req, res) => {
  try {
    const contacts = getContactsByAccount(parseInt(req.params.id));
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/accounts/:id/notes", (req, res) => {
  try {
    const { note, note_type, created_by } = req.body;
    if (!note) {
      return res.status(400).json({ error: "Note is required" });
    }
    
    const result = saveNote(parseInt(req.params.id), note, note_type, created_by);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/:id/notes", (req, res) => {
  try {
    const notes = getNotesByAccount(parseInt(req.params.id));
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/accounts/:id/activities", (req, res) => {
  try {
    const { activity_type, description, outcome } = req.body;
    if (!activity_type || !description) {
      return res.status(400).json({ error: "Activity type and description required" });
    }
    
    const result = saveActivity(parseInt(req.params.id), activity_type, description, outcome);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/:id/activities", (req, res) => {
  try {
    const activities = getActivitiesByAccount(parseInt(req.params.id));
    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/:id/news", async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const account = getAccountById(accountId);
    
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    let articles = getNewsByAccount(accountId);
    
    if (articles.length === 0 || req.query.refresh === "true") {
      const companyName = account.company_name;
      const freshArticles = await fetchCompanyNews(companyName);
      
      if (freshArticles.length > 0) {
        clearNewsByAccount(accountId);
        saveNewsArticles(accountId, freshArticles);
        articles = freshArticles;
      } else {
        const allArticles = await fetchAllNews(companyName);
        if (allArticles.length > 0) {
          clearNewsByAccount(accountId);
          saveNewsArticles(accountId, allArticles);
          articles = allArticles;
        }
      }
    }

    res.json({ 
      articles, 
      count: articles.length,
      company: account.company_name,
      hasNewsApiKey: !!process.env.NEWS_API_KEY
    });
  } catch (err) {
    console.error("[news] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/accounts/:id/news/refresh", async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const account = getAccountById(accountId);
    
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const companyName = account.company_name;
    let articles = await fetchCompanyNews(companyName);
    
    if (articles.length === 0) {
      articles = await fetchAllNews(companyName);
    }
    
    if (articles.length > 0) {
      clearNewsByAccount(accountId);
      saveNewsArticles(accountId, articles);
    }

    res.json({ 
      articles, 
      count: articles.length,
      refreshed: true
    });
  } catch (err) {
    console.error("[news] Refresh error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stats", (req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/company/quick-check", async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    const company = await enrichDomain(domain);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const routing = routeNatoli(company);

    res.json({
      name: company.name,
      industry: company.industry,
      employees: company.estimated_num_employees,
      linkedin: company.linkedin_url,
      is_primary_market: routing.isPrimary,
      division_fit: routing.division,
      quick_verdict: isQualified(routing) ? "Potential Fit" : "Not Qualified"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/company/personas", async (req, res) => {
  try {
    const { companyId, titles } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const people = await findPeopleAtCompany(companyId, titles || PERSONA_TITLES);
    const personaData = scorePersonas(people);
    const tierResult = assignTier(personaData.score);

    res.json({
      count: people.length,
      score: personaData.score,
      tier: tierResult.tier,
      tier_reason: tierResult.reason,
      matched: personaData.matched,
      by_category: personaData.byCategory,
      people: people.slice(0, 25).map(p => ({
        name: p.name,
        title: p.title,
        linkedin: p.linkedin_url,
        email: p.email
      }))
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/company/contacts", async (req, res) => {
  try {
    const { domain, titles } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    const company = await enrichDomain(domain);
    if (!company || !company.id) {
      return res.status(404).json({ error: "Company not found in Apollo" });
    }

    const people = await findPeopleAtCompany(company.id, titles || []);
    
    res.json({
      company: company.name,
      count: people.length,
      contacts: people.slice(0, 50).map(p => ({
        name: p.name,
        title: p.title,
        linkedin: p.linkedin_url,
        email: p.email,
        phone: p.phone_numbers?.[0]?.sanitized_number || null,
        city: p.city,
        state: p.state
      }))
    });

  } catch (err) {
    console.error("Contact search error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/cache/stats", (req, res) => {
  res.json(getCacheStats());
});

app.post("/cache/clear", (req, res) => {
  const { domain } = req.body;
  clearCache(domain);
  res.json({ cleared: domain || "all" });
});

app.delete("/api/accounts/domain/:domain", (req, res) => {
  const domain = req.params.domain;
  clearCache(domain);
  const deleted = deleteAccountByDomain(domain);
  res.json({ deleted, domain });
});

app.get("/export/accounts.csv", (req, res) => {
  try {
    const accounts = getAllAccounts();
    
    if (accounts.length === 0) {
      res.setHeader("Content-Type", "text/csv");
      res.send("No accounts to export");
      return;
    }

    const headers = [
      "id", "company_name", "domain", "website", "linkedin_url", "industry",
      "employees", "revenue", "division_fit", "tier", "tier_reason",
      "persona_score", "is_primary_market", "is_qualified", "status", "created_at"
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = accounts.map(a => headers.map(h => escapeCSV(a[h])).join(","));
    const csv = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=tony_crm_accounts.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/:id/outreach", (req, res) => {
  try {
    const account = getAccountById(parseInt(req.params.id));
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json({ 
      draft: generateOutreach(account),
      followUp2: generateFollowUp(account, 2),
      followUp3: generateFollowUp(account, 3)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/metrics", (req, res) => {
  try {
    res.json(getMetrics());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", (req, res) => {
  res.json({ users: getAllUsers(), roles: getRoles() });
});

app.get("/api/users/:username", (req, res) => {
  const user = getUser(req.params.username);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.post("/api/users", (req, res) => {
  try {
    const { username, name, role } = req.body;
    if (!username || !name) {
      return res.status(400).json({ error: "Username and name are required" });
    }
    const user = createUser(username, name, role || "readonly");
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/users/:username/role", (req, res) => {
  try {
    const { role } = req.body;
    const user = updateUserRole(req.params.username, role);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/users/:username", (req, res) => {
  try {
    deleteUser(req.params.username);
    res.json({ deleted: req.params.username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============ PEOPLE SEARCH (Apollo.io) ============
app.post("/api/accounts/:id/people-search", async (req, res) => {
  try {
    const account = getAccountById(parseInt(req.params.id));
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    const titles = req.body.titles || [
      "Director of R&D", "VP of Manufacturing", "Director of Formulation",
      "Process Engineering Manager", "Director of MS&T", "VP Operations"
    ];
    
    // Use Apollo company ID if available, otherwise search by domain
    const people = await findPeopleAtCompany(account.domain, titles);
    
    // Save contacts to database
    const savedContacts = [];
    for (const person of people) {
      try {
        const contactData = {
          name: person.name || `${person.first_name} ${person.last_name}`,
          title: person.title,
          email: person.email,
          linkedin_url: person.linkedin_url,
          persona_type: matchPersonaType(person.title),
          weight: getPersonaWeight(person.title)
        };
        saveContact(account.id, contactData);
        savedContacts.push(contactData);
      } catch (e) {
        console.log("Error saving contact:", e.message);
      }
    }
    
    res.json({ 
      people: savedContacts,
      count: savedContacts.length,
      account_id: account.id
    });
  } catch (err) {
    console.error("People search error:", err);
    res.status(500).json({ error: err.message });
  }
});

function matchPersonaType(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("r&d") || t.includes("research")) return "R&D";
  if (t.includes("formulation")) return "Formulation";
  if (t.includes("manufacturing") || t.includes("production")) return "Manufacturing";
  if (t.includes("engineering") || t.includes("process")) return "Engineering";
  if (t.includes("quality")) return "Quality";
  if (t.includes("vp") || t.includes("director")) return "Executive";
  return "Other";
}

function getPersonaWeight(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("vp") || t.includes("vice president")) return 100;
  if (t.includes("director")) return 80;
  if (t.includes("manager")) return 60;
  if (t.includes("lead") || t.includes("senior")) return 50;
  return 40;
}

// ============ DEALS PIPELINE ============
app.get("/api/deals", (req, res) => {
  try {
    const { stage, owner, limit } = req.query;
    const filters = {};
    if (stage) filters.stage = stage;
    if (owner) filters.owner = owner;
    if (limit) filters.limit = parseInt(limit);
    
    const deals = getAllDeals(filters);
    res.json({ deals, count: deals.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/deals/stats", (req, res) => {
  try {
    res.json(getPipelineStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/deals/:id", (req, res) => {
  try {
    const deal = getDealById(parseInt(req.params.id));
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/deals", (req, res) => {
  try {
    const { account_id, deal_name, stage, value, probability, expected_close_date, notes } = req.body;
    if (!account_id || !deal_name) {
      return res.status(400).json({ error: "Account ID and deal name are required" });
    }
    
    const id = saveDeal({ account_id, deal_name, stage, value, probability, expected_close_date, notes });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/deals/:id", (req, res) => {
  try {
    const result = updateDeal(parseInt(req.params.id), req.body);
    res.json({ success: true, changes: result?.changes || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/deals/:id", (req, res) => {
  try {
    deleteDeal(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/:id/deals", (req, res) => {
  try {
    const deals = getDealsByAccount(parseInt(req.params.id));
    res.json({ deals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ TASKS SYSTEM ============
app.get("/api/tasks", (req, res) => {
  try {
    const { status, priority, overdue, upcoming, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (overdue === "true") filters.overdue = true;
    if (upcoming === "true") filters.upcoming = true;
    if (limit) filters.limit = parseInt(limit);
    
    const tasks = getAllTasks(filters);
    res.json({ tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/tasks/stats", (req, res) => {
  try {
    res.json(getTaskStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tasks", (req, res) => {
  try {
    const { account_id, deal_id, contact_id, task_type, title, description, due_date, due_time, priority } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }
    
    const id = saveTask({ account_id, deal_id, contact_id, task_type, title, description, due_date, due_time, priority });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/tasks/:id", (req, res) => {
  try {
    const result = updateTask(parseInt(req.params.id), req.body);
    res.json({ success: true, changes: result?.changes || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/tasks/:id", (req, res) => {
  try {
    deleteTask(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/:id/tasks", (req, res) => {
  try {
    const tasks = getTasksByAccount(parseInt(req.params.id));
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ SITES/PLANTS ============
app.get("/api/accounts/:id/sites", (req, res) => {
  try {
    const sites = getSitesByAccount(parseInt(req.params.id));
    res.json({ sites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/accounts/:id/sites", (req, res) => {
  try {
    const { site_name, site_type, address, city, state, country, employees, equipment, certifications, is_primary, notes } = req.body;
    if (!site_name) {
      return res.status(400).json({ error: "Site name is required" });
    }
    
    const id = saveSite({ 
      account_id: parseInt(req.params.id), 
      site_name, site_type, address, city, state, country, employees, equipment, certifications, is_primary, notes 
    });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/sites/:id", (req, res) => {
  try {
    const result = updateSite(parseInt(req.params.id), req.body);
    res.json({ success: true, changes: result?.changes || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/sites/:id", (req, res) => {
  try {
    deleteSite(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ COMPLIANCE EVENTS ============
app.get("/api/compliance", (req, res) => {
  try {
    const { event_type, status, upcoming, limit } = req.query;
    const filters = {};
    if (event_type) filters.event_type = event_type;
    if (status) filters.status = status;
    if (upcoming === "true") filters.upcoming = true;
    if (limit) filters.limit = parseInt(limit);
    
    const events = getAllComplianceEvents(filters);
    res.json({ events, count: events.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/:id/compliance", (req, res) => {
  try {
    const events = getComplianceEventsByAccount(parseInt(req.params.id));
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/accounts/:id/compliance", (req, res) => {
  try {
    const { event_type, title, description, event_date, status, source, url, impact } = req.body;
    if (!event_type || !title) {
      return res.status(400).json({ error: "Event type and title are required" });
    }
    
    const id = saveComplianceEvent({ 
      account_id: parseInt(req.params.id), 
      event_type, title, description, event_date, status, source, url, impact 
    });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/compliance/:id", (req, res) => {
  try {
    const result = updateComplianceEvent(parseInt(req.params.id), req.body);
    res.json({ success: true, changes: result?.changes || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/compliance/:id", (req, res) => {
  try {
    deleteComplianceEvent(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ INTENT SIGNALS ============
app.get("/api/intent-signals", (req, res) => {
  try {
    const { signal_type, strength, limit } = req.query;
    const filters = {};
    if (signal_type) filters.signal_type = signal_type;
    if (strength) filters.strength = strength;
    if (limit) filters.limit = parseInt(limit);
    
    const signals = getAllIntentSignals(filters);
    res.json({ signals, count: signals.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/accounts/:id/intent-signals", (req, res) => {
  try {
    const signals = getIntentSignalsByAccount(parseInt(req.params.id));
    res.json({ signals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/accounts/:id/intent-signals", (req, res) => {
  try {
    const { signal_type, topic, strength, source, expires_at } = req.body;
    if (!signal_type) {
      return res.status(400).json({ error: "Signal type is required" });
    }
    
    const id = saveIntentSignal({ 
      account_id: parseInt(req.params.id), 
      signal_type, topic, strength, source, expires_at 
    });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/intent-signals/:id", (req, res) => {
  try {
    deleteIntentSignal(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Tony CRM Apollo Server running on port ${PORT}`);
});
