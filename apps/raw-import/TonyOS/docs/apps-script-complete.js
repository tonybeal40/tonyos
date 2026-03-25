/**
 * TonyOS Complete Google Sheets Sync
 * 
 * This script handles ALL TonyOS apps and auto-creates tabs.
 * 
 * SETUP:
 * 1. In your Google Sheet, go to Extensions > Apps Script
 * 2. Delete existing code, paste this entire file
 * 3. Deploy > New deployment > Web app
 * 4. Execute as: Me, Access: Anyone
 * 5. Copy the Web App URL to TonyOS sync settings
 */

const SHARED_TOKEN = "tonyos-sync-2025";

const TAB_SCHEMAS = {
  'journal': ['date', 'mood', 'stress', 'category', 'content', 'gratitude', 'focus', 'reflection', 'tags', 'links', 'wordCount', 'timestamp'],
  'crm_contacts': ['id', 'name', 'company', 'title', 'email', 'phone', 'linkedin', 'website', 'notes', 'stage', 'source', 'createdAt', 'updatedAt'],
  'crm_activity': ['id', 'contactId', 'contactName', 'channel', 'type', 'outcome', 'notes', 'date', 'timestamp'],
  'budget': ['id', 'type', 'category', 'description', 'amount', 'date', 'recurring', 'timestamp'],
  'daily': ['date', 'oneWin', 'pressure', 'nextStep', 'result', 'timestamp'],
  'jobs': ['id', 'createdAt', 'updatedAt', 'company', 'title', 'link', 'status', 'contactName', 'email', 'phone', 'location', 'salaryRange', 'nextStep', 'nextStepDate', 'notes', 'source'],
  'storybrand': ['id', 'projectName', 'character', 'problem_external', 'problem_internal', 'problem_philosophical', 'guide_empathy', 'guide_authority', 'plan_step1', 'plan_step2', 'plan_step3', 'cta_direct', 'cta_transitional', 'success', 'failure', 'transformation', 'oneliner', 'createdAt', 'updatedAt'],
  'research': ['id', 'url', 'companyName', 'industry', 'analysis', 'timestamp'],
  'outbound': ['id', 'contactName', 'company', 'channel', 'message', 'status', 'sentAt', 'timestamp'],
  'tracker': ['id', 'type', 'content', 'category', 'timestamp'],
  'memory': ['id', 'content', 'importance', 'category', 'timestamp'],
  'chat': ['id', 'role', 'content', 'mood', 'timestamp']
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    
    if (data.token !== SHARED_TOKEN) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }
    
    const appName = (data.app || 'log').toLowerCase();
    const action = data.action || 'append';
    const payload = data.payload || {};
    
    const sheet = getOrCreateTab(appName);
    
    if (action === 'append' || action === 'create') {
      return appendData(sheet, appName, payload);
    }
    if (action === 'update') {
      return updateData(sheet, appName, payload);
    }
    if (action === 'delete') {
      return deleteData(sheet, payload.id);
    }
    if (action === 'list') {
      return listData(sheet);
    }
    
    return jsonResponse({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'TonyOS Sync Active',
    tabs: Object.keys(TAB_SCHEMAS),
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateTab(appName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Safety check - default to 'Log' if appName is missing
  if (!appName || typeof appName !== 'string') {
    appName = 'log';
  }
  
  const tabName = appName.charAt(0).toUpperCase() + appName.slice(1);
  let sheet = ss.getSheetByName(tabName);
  
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    const headers = TAB_SCHEMAS[appName] || ['id', 'data', 'timestamp'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#1e293b');
    sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function appendData(sheet, appName, payload) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  
  if (!payload.id && headers.includes('id')) {
    payload.id = appName + '_' + Utilities.getUuid().substring(0, 8);
  }
  if (!payload.timestamp) {
    payload.timestamp = new Date().toISOString();
  }
  if (!payload.createdAt && headers.includes('createdAt')) {
    payload.createdAt = new Date().toISOString();
  }
  if (!payload.updatedAt && headers.includes('updatedAt')) {
    payload.updatedAt = new Date().toISOString();
  }
  
  if ((appName === 'journal' || appName === 'daily') && payload.date) {
    const existingRow = findRowByColumn(sheet, 'date', payload.date);
    if (existingRow > 0) {
      const row = headers.map(h => formatValue(payload[h]));
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
      return jsonResponse({ ok: true, action: 'updated', id: payload.id });
    }
  }
  
  const row = headers.map(h => formatValue(payload[h]));
  sheet.appendRow(row);
  return jsonResponse({ ok: true, action: 'appended', id: payload.id });
}

function updateData(sheet, appName, payload) {
  const searchKey = payload.id ? 'id' : (payload.date ? 'date' : null);
  const searchValue = payload.id || payload.date;
  
  if (!searchKey) {
    return appendData(sheet, appName, payload);
  }
  
  const rowIndex = findRowByColumn(sheet, searchKey, searchValue);
  if (rowIndex < 1) {
    return appendData(sheet, appName, payload);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  payload.updatedAt = new Date().toISOString();
  const row = headers.map(h => formatValue(payload[h]));
  
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  return jsonResponse({ ok: true, action: 'updated', id: payload.id });
}

function deleteData(sheet, id) {
  if (!id) return jsonResponse({ ok: false, error: "Missing id" });
  
  const rowIndex = findRowByColumn(sheet, 'id', id);
  if (rowIndex < 1) return jsonResponse({ ok: false, error: "Not found: " + id });
  
  sheet.deleteRow(rowIndex);
  return jsonResponse({ ok: true, action: 'deleted' });
}

function listData(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return jsonResponse({ ok: true, rows: [] });
  
  const headers = values[0];
  const rows = values.slice(1)
    .filter(r => r[0])
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = r[i]);
      return obj;
    });
  
  return jsonResponse({ ok: true, rows: rows });
}

function findRowByColumn(sheet, columnName, value) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return -1;
  
  const headers = values[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex < 0) return -1;
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colIndex]) === String(value)) return i + 1;
  }
  return -1;
}

function formatValue(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(' | ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function createAllTabs() {
  Object.keys(TAB_SCHEMAS).forEach(appName => {
    getOrCreateTab(appName);
  });
  SpreadsheetApp.getActiveSpreadsheet().toast('All TonyOS tabs created!', 'Success', 3);
}
