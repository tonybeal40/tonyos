/**
 * TonyOS Master Google Sheet - Apps Script Web App Endpoint
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet (this will be your master sheet)
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. IMPORTANT: Change the API_KEY below to your own random string!
 * 5. Save the project (give it a name like "TonyOS Sync")
 * 6. Click Deploy > New deployment
 * 7. Select "Web app" as the type
 * 8. Set "Execute as" to "Me"
 * 9. Set "Who has access" to "Anyone"
 * 10. Click Deploy and copy the Web App URL
 * 11. Paste that URL AND your API key into TonyOS settings
 * 
 * SECURITY:
 * The API_KEY prevents unauthorized access to your sheet.
 * Generate a random string (20+ characters) and use the SAME key in TonyOS.
 * 
 * SHEET STRUCTURE:
 * This script will automatically create tabs for each data type:
 * - Journal: All journal entries
 * - CRM_Contacts: Contact database
 * - CRM_Activity: Outreach activity log
 * - Budget: Income and expenses
 * - Daily: Daily command center entries
 * - Jobs: Job search tracking
 */

// CHANGE THIS TO YOUR OWN RANDOM STRING (20+ characters recommended)
const API_KEY = "CHANGE_THIS_TO_A_LONG_RANDOM_STRING_123";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Verify API key
    if (String(data.api_key || "") !== API_KEY) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Unauthorized - Invalid API key'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const sheetName = data.sheet || 'Log';
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      const headers = getHeadersForSheet(sheetName, data.data);
      if (headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
    }
    
    if (data.action === 'append') {
      appendRow(sheet, sheetName, data.data);
    } else if (data.action === 'update') {
      updateRow(sheet, sheetName, data.data);
    } else if (data.action === 'delete') {
      deleteRow(sheet, data.data.id);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data synced successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'TonyOS Sync Endpoint Active',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getHeadersForSheet(sheetName, sampleData) {
  const headerMaps = {
    'Journal': ['date', 'mood', 'stress', 'category', 'content', 'gratitude', 'focus', 'reflection', 'tags', 'links', 'wordCount', 'updatedAt'],
    'CRM_Contacts': ['id', 'name', 'company', 'title', 'email', 'phone', 'linkedin', 'website', 'notes', 'stage', 'source', 'createdAt', 'updatedAt'],
    'CRM_Activity': ['id', 'contactId', 'contactName', 'channel', 'type', 'outcome', 'notes', 'date'],
    'Budget': ['id', 'type', 'category', 'description', 'amount', 'date', 'recurring'],
    'Daily': ['date', 'oneWin', 'pressure', 'nextStep', 'result', 'timestamp'],
    'Jobs': ['id', 'company', 'title', 'status', 'applied', 'notes', 'url', 'updatedAt']
  };
  
  if (headerMaps[sheetName]) {
    return headerMaps[sheetName];
  }
  
  if (sampleData && typeof sampleData === 'object') {
    return Object.keys(sampleData);
  }
  
  return ['timestamp', 'data'];
}

function appendRow(sheet, sheetName, data) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => {
    const value = data[header];
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  });
  
  if (sheetName === 'Journal' && data.date) {
    const existingRow = findRowByValue(sheet, 1, data.date);
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
      return;
    }
  }
  
  sheet.appendRow(row);
}

function updateRow(sheet, sheetName, data) {
  if (!data.id && !data.date) {
    appendRow(sheet, sheetName, data);
    return;
  }
  
  const searchCol = data.id ? findColumnIndex(sheet, 'id') : findColumnIndex(sheet, 'date');
  const searchValue = data.id || data.date;
  
  if (searchCol < 1) {
    appendRow(sheet, sheetName, data);
    return;
  }
  
  const rowIndex = findRowByValue(sheet, searchCol, searchValue);
  
  if (rowIndex > 0) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(header => {
      const value = data[header];
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return value;
    });
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    appendRow(sheet, sheetName, data);
  }
}

function deleteRow(sheet, id) {
  const idCol = findColumnIndex(sheet, 'id');
  if (idCol < 1) return;
  
  const rowIndex = findRowByValue(sheet, idCol, id);
  if (rowIndex > 1) {
    sheet.deleteRow(rowIndex);
  }
}

function findColumnIndex(sheet, columnName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.indexOf(columnName) + 1;
}

function findRowByValue(sheet, colIndex, value) {
  const data = sheet.getRange(2, colIndex, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === value) {
      return i + 2;
    }
  }
  return -1;
}
