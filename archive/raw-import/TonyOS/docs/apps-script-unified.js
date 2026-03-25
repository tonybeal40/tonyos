/**
 * TonyOS UNIFIED Google Sheets Sync - Master Apps Script
 * 
 * This single script handles ALL TonyOS data in ONE spreadsheet with multiple tabs.
 * 
 * TABS CREATED AUTOMATICALLY:
 * - Journal (daily entries, mood, gratitude)
 * - CRM_Contacts (contact database with customer tier)
 * - CRM_Activity (outreach log)
 * - CRM_Accounts (Apollo-enriched accounts)
 * - CRM_Assumptions (decision assumptions - what you assumed was true)
 * - CRM_Outcomes (action outcomes - positive/neutral/negative with learnings)
 * - CRM_Sessions (work session closes - wins, learnings, next focus)
 * - Budget (income/expenses)
 * - Daily (command center entries)
 * - Jobs (job applications)
 * - Contact_Submissions (public contact form submissions)
 * - StoryBrand (messaging framework projects)
 * 
 * SETUP:
 * 1. Create a new Google Sheet
 * 2. Extensions > Apps Script
 * 3. Delete existing code, paste this entire file
 * 4. CHANGE THE API_KEY BELOW to your own random string!
 * 5. Deploy > New deployment > Web app
 * 6. Execute as: Me, Access: Anyone
 * 7. Copy the Web App URL
 * 8. In TonyOS, click the sync settings icon and enter URL + API key
 */

const API_KEY = "CHANGE_THIS_TO_YOUR_SECRET_KEY_123";

const SHEET_CONFIGS = {
  'Journal': ['date', 'mood', 'stress', 'category', 'content', 'gratitude', 'focus', 'reflection', 'tags', 'links', 'wordCount', 'updatedAt'],
  'CRM_Contacts': ['id', 'name', 'company', 'title', 'email', 'phone', 'linkedin', 'website', 'notes', 'stage', 'customerTier', 'source', 'createdAt', 'updatedAt'],
  'CRM_Activity': ['id', 'contactId', 'contactName', 'channel', 'type', 'outcome', 'notes', 'date'],
  'CRM_Accounts': ['id', 'name', 'domain', 'industry', 'employees', 'revenue', 'divisionFit', 'isPrimaryMarket', 'isQualified', 'tier', 'tierReason', 'painPoints', 'whyNatoli', 'enrichedAt'],
  'CRM_Assumptions': ['accountId', 'accountName', 'assumption', 'confidence', 'context', 'validated', 'validationNote', 'time'],
  'CRM_Outcomes': ['accountId', 'accountName', 'action', 'outcome', 'notes', 'learnings', 'time'],
  'CRM_Sessions': ['summary', 'wins', 'learnings', 'nextFocus', 'time'],
  'Budget': ['id', 'type', 'category', 'description', 'amount', 'date', 'recurring'],
  'Daily': ['date', 'oneWin', 'pressure', 'nextStep', 'result', 'timestamp'],
  'Jobs': ['id', 'createdAt', 'updatedAt', 'company', 'title', 'link', 'status', 'contactName', 'email', 'phone', 'location', 'salaryRange', 'nextStep', 'nextStepDate', 'notes', 'source'],
  'Contact_Submissions': ['id', 'name', 'email', 'company', 'phone', 'message', 'createdAt'],
  'StoryBrand': ['id', 'projectName', 'character', 'problem_external', 'problem_internal', 'problem_philosophical', 'guide_empathy', 'guide_authority', 'plan_step1', 'plan_step2', 'plan_step3', 'cta_direct', 'cta_transitional', 'success', 'failure', 'transformation', 'oneliner', 'createdAt', 'updatedAt']
};

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    
    // Support both formats: "api_key" or "token"
    const apiKey = body.api_key || body.token || "";
    if (String(apiKey) !== API_KEY) {
      return json({ ok: false, error: "Unauthorized - Invalid API key" });
    }
    
    const action = body.action || 'append';
    // Support both formats: "sheet" or "app"
    let sheetName = body.sheet || body.app || 'Log';
    
    // Normalize sheet name (handle lowercase from client)
    const sheetNameMap = {
      'journal': 'Journal',
      'crm_contacts': 'CRM_Contacts',
      'crm_activity': 'CRM_Activity',
      'crm_accounts': 'CRM_Accounts',
      'crm_assumptions': 'CRM_Assumptions',
      'crm_outcomes': 'CRM_Outcomes',
      'crm_sessions': 'CRM_Sessions',
      'budget': 'Budget',
      'daily': 'Daily',
      'jobs': 'Jobs',
      'contact_submissions': 'Contact_Submissions',
      'storybrand': 'StoryBrand'
    };
    
    if (sheetNameMap[sheetName.toLowerCase()]) {
      sheetName = sheetNameMap[sheetName.toLowerCase()];
    }
    
    // Support both formats: "data" or "payload"
    const data = body.data || body.payload || {};
    
    const sheet = getOrCreateSheet(sheetName);
    
    if (action === 'append') return appendRow(sheet, sheetName, data);
    if (action === 'update') return updateRow(sheet, sheetName, data);
    if (action === 'delete') return deleteRow(sheet, data.id);
    if (action === 'list') return listRows(sheet, sheetName);
    if (action === 'create') return createRow(sheet, sheetName, data);
    
    return json({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'TonyOS Unified Sync Active',
    tabs: Object.keys(SHEET_CONFIGS),
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = SHEET_CONFIGS[sheetName] || ['timestamp', 'data'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function appendRow(sheet, sheetName, data) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => formatValue(data[h]));
  
  if ((sheetName === 'Journal' && data.date) || (sheetName === 'Daily' && data.date)) {
    const existingRow = findRowByColumn(sheet, 'date', data.date);
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
      return json({ ok: true, action: 'updated' });
    }
  }
  
  sheet.appendRow(row);
  return json({ ok: true, action: 'appended' });
}

function createRow(sheet, sheetName, data) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const now = new Date().toISOString();
  const id = sheetName.toLowerCase() + "_" + Utilities.getUuid();
  
  if (!data.id) data.id = id;
  if (!data.createdAt) data.createdAt = now;
  if (!data.updatedAt) data.updatedAt = now;
  
  const row = headers.map(h => formatValue(data[h]));
  sheet.appendRow(row);
  return json({ ok: true, id: data.id });
}

function updateRow(sheet, sheetName, data) {
  const searchKey = data.id ? 'id' : (data.date ? 'date' : null);
  const searchValue = data.id || data.date;
  
  if (!searchKey) return appendRow(sheet, sheetName, data);
  
  const rowIndex = findRowByColumn(sheet, searchKey, searchValue);
  if (rowIndex < 1) return appendRow(sheet, sheetName, data);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  data.updatedAt = new Date().toISOString();
  const row = headers.map(h => formatValue(data[h]));
  
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  return json({ ok: true, action: 'updated' });
}

function deleteRow(sheet, id) {
  if (!id) return json({ ok: false, error: "Missing id" });
  
  const rowIndex = findRowByColumn(sheet, 'id', id);
  if (rowIndex < 1) return json({ ok: false, error: "Not found: " + id });
  
  sheet.deleteRow(rowIndex);
  return json({ ok: true });
}

function listRows(sheet, sheetName) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return json({ ok: true, rows: [] });
  
  const headers = values[0];
  const rows = values.slice(1)
    .filter(r => r[0])
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = r[i]);
      return obj;
    });
  
  return json({ ok: true, rows });
}

function findRowByColumn(sheet, columnName, value) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return -1;
  
  const headers = values[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex < 0) return -1;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][colIndex] === value) return i + 1;
  }
  return -1;
}

function formatValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
