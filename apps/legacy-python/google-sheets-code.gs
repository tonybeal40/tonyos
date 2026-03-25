// Code.gs - Google Apps Script for TonyOS Money
// 
// SETUP INSTRUCTIONS:
// 1. Create a new Google Sheet
// 2. Add a sheet named "transactions" with columns:
//    createdAt | amount | category | merchant | note | type | token
// 3. Go to Extensions > Apps Script
// 4. Paste this code and save
// 5. Click Deploy > New deployment > Web app
// 6. Set "Execute as" to yourself, "Who has access" to Anyone
// 7. Copy the web app URL
// 8. Update API_TOKEN below to a random secret string
// 9. Paste the URL and token into TonyOS Money page

const SHEET_NAME = "transactions";

// Set your secret token here once, then keep it private
const API_TOKEN = "CHANGE_ME_TO_A_LONG_RANDOM_STRING";

// ---- Helpers ----
function jsonOut(obj, code) {
  return ContentService
    .createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) throw new Error("Missing sheet: " + SHEET_NAME);
  return sh;
}

function getHeaders_(sh) {
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => map[String(h).trim()] = i + 1);
  return map;
}

function requireToken_(token) {
  if (!token || token !== API_TOKEN) {
    throw new Error("Unauthorized");
  }
}

// ---- API ----
// GET:  ?action=ping&token=...
// GET:  ?action=list&token=...&limit=500
// POST: action=add with fields below

function doGet(e) {
  try {
    const p = e.parameter || {};
    const action = p.action || "ping";

    if (action === "ping") {
      requireToken_(p.token);
      return jsonOut({ ok: true, message: "pong" });
    }

    if (action === "list") {
      requireToken_(p.token);

      const sh = getSheet_();
      const headers = getHeaders_(sh);
      const lastRow = sh.getLastRow();

      if (lastRow < 2) return jsonOut({ ok: true, rows: [] });

      const values = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
      const rows = values.map(r => ({
        createdAt: r[headers.createdAt - 1],
        amount: Number(r[headers.amount - 1] || 0),
        category: r[headers.category - 1] || "",
        merchant: r[headers.merchant - 1] || "",
        note: r[headers.note - 1] || "",
        type: r[headers.type - 1] || "expense"
      })).filter(x => x.createdAt);

      const limit = Math.min(Number(p.limit || 500), 2000);
      return jsonOut({ ok: true, rows: rows.slice(-limit).reverse() });
    }

    return jsonOut({ ok: false, error: "Unknown action" });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");

    requireToken_(body.token);

    const createdAt = body.createdAt || new Date().toISOString();
    const amount = Number(body.amount || 0);
    const category = String(body.category || "").trim();
    const merchant = String(body.merchant || "").trim();
    const note = String(body.note || "").trim();
    const type = String(body.type || "expense").trim();

    if (!amount || amount <= 0) throw new Error("Amount must be > 0");
    if (!category) throw new Error("Category required");
    if (type !== "expense" && type !== "income") throw new Error("Type must be expense or income");

    const sh = getSheet_();
    const headers = getHeaders_(sh);

    sh.appendRow([
      createdAt,
      amount,
      category,
      merchant,
      note,
      type,
      body.token
    ]);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err.message || err) });
  }
}
