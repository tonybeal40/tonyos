import Database from "better-sqlite3";

const db = new Database("tony_crm.db");

export function getMetrics() {
  const total = db.prepare("SELECT COUNT(*) as c FROM accounts").get().c;
  const tierA = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE tier='A'").get().c;
  const tierB = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE tier='B'").get().c;
  const tierC = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE tier='C'").get().c;
  const disqualified = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE tier='Disqualified'").get().c;
  const scientific = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE division_fit='Natoli Scientific'").get().c;
  const engineering = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE division_fit='Natoli Engineering'").get().c;
  const both = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE division_fit='Both'").get().c;
  const qualified = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE is_qualified=1").get().c;
  const primaryMarket = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE is_primary_market=1").get().c;

  const byIndustry = db.prepare(`
    SELECT industry, COUNT(*) as count 
    FROM accounts 
    WHERE industry IS NOT NULL 
    GROUP BY industry 
    ORDER BY count DESC 
    LIMIT 10
  `).all();

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM accounts 
    GROUP BY status
  `).all();

  const recentAccounts = db.prepare(`
    SELECT id, company_name, tier, division_fit, created_at 
    FROM accounts 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();

  return {
    total_accounts: total,
    tiers: {
      A: tierA,
      B: tierB,
      C: tierC,
      disqualified
    },
    divisions: {
      scientific,
      engineering,
      both
    },
    qualified_accounts: qualified,
    primary_market_accounts: primaryMarket,
    by_industry: byIndustry,
    by_status: byStatus,
    recent_accounts: recentAccounts,
    conversion_rate: total > 0 ? Math.round((qualified / total) * 100) : 0
  };
}
