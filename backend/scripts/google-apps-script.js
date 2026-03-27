/**
 * Naneka Orders — Google Apps Script (doPost handler)
 *
 * HOW TO DEPLOY:
 *   1. Open script.google.com → open your project (or create new one)
 *   2. Replace ALL existing code with this file
 *   3. Click Deploy → New Deployment → Web App
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   4. Copy the /exec URL → paste into Vercel env var GOOGLE_SHEETS_URL
 *
 * SHEET STRUCTURE (auto-created on first POST):
 *   A: Order Number | B: Created At | C: Customer Name | D: Phone
 *   E: Total (TZS)  | F: Address    | G: Status        | H: Last Updated
 *
 * UPSERT LOGIC (find-and-update):
 *   - Acquires a script lock to prevent concurrent duplicate rows
 *   - Searches column A for orderNumber
 *   - FOUND   → updates G (Status) + H (Last Updated) only
 *   - NOT FOUND → appends a new row with all fields
 */

var SHEET_NAME = 'Orders';

var HEADERS = [
  'Order Number',
  'Created At',
  'Customer Name',
  'Phone',
  'Total (TZS)',
  'Delivery Address',
  'Status',
  'Last Updated',
];

// Column indexes (1-based, matching HEADERS order above)
var COL = {
  ORDER_NUMBER: 1,
  CREATED_AT:   2,
  CUSTOMER_NAME:3,
  PHONE:        4,
  TOTAL:        5,
  ADDRESS:      6,
  STATUS:       7,
  LAST_UPDATED: 8,
};

function doPost(e) {
  try {
    var raw  = e.postData ? e.postData.contents : '{}';
    var data = JSON.parse(raw);

    if (data.type === 'product') {
      return handleProduct(data);
    }

    return handleOrder(data);

  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

// ─── Order upsert (find-and-update) ───────────────────────────────────────────

function handleOrder(data) {
  var orderNumber = String(data.orderNumber || '').trim();
  if (!orderNumber) {
    return jsonResponse({ success: false, error: 'orderNumber is required' });
  }

  // Acquire a lock so concurrent requests don't both see "not found" and both insert
  var lock = LockService.getScriptLock();
  lock.waitLock(15000); // wait up to 15 s

  try {
    var ss      = SpreadsheetApp.getActiveSpreadsheet();
    var sheet   = getOrCreateSheet(ss, SHEET_NAME, HEADERS);
    var lastRow = sheet.getLastRow();
    var existingRow = findRow(sheet, orderNumber, lastRow);

    var now         = new Date().toISOString();
    var status      = String(data.status || 'unknown');
    var lastUpdated = data.lastUpdated || now;

    if (existingRow > 0) {
      // ── UPDATE: only refresh Status and Last Updated ──────────────────────
      sheet.getRange(existingRow, COL.STATUS).setValue(status);
      sheet.getRange(existingRow, COL.LAST_UPDATED).setValue(lastUpdated);
      Logger.log('Updated row ' + existingRow + ' — #' + orderNumber + ' → ' + status);
      return jsonResponse({ success: true, action: 'updated', row: existingRow, orderNumber: orderNumber, status: status });
    }

    // ── INSERT: append a new row with all fields ──────────────────────────
    var newRow = [
      orderNumber,
      data.createdAt         || now,
      data.customerName      || '',
      data.customerPhone     || '',
      data.total             || 0,
      data.deliveryAddress   || '',
      status,
      lastUpdated,
    ];
    sheet.appendRow(newRow);
    Logger.log('Inserted new row — #' + orderNumber + ' status=' + status);
    return jsonResponse({ success: true, action: 'inserted', orderNumber: orderNumber, status: status });

  } finally {
    lock.releaseLock();
  }
}

// ─── Product sync ──────────────────────────────────────────────────────────────

function handleProduct(data) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'Products', ['ID', 'Name', 'Category', 'Price', 'Currency', 'Created At']);
  sheet.appendRow([
    data.id        || '',
    data.name      || '',
    data.category  || '',
    data.price     || 0,
    data.currency  || '',
    data.createdAt || '',
  ]);
  return jsonResponse({ success: true, action: 'product_inserted' });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Find the first row (1-based) in column A that matches value.
 * Returns -1 if not found.
 */
function findRow(sheet, value, lastRow) {
  if (lastRow < 2) return -1;
  var colData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < colData.length; i++) {
    if (String(colData[i][0]).trim() === value) {
      return i + 2; // +1 for 0-index, +1 for header row
    }
  }
  return -1;
}

/**
 * Get a sheet by name, creating it with bold headers if it doesn't exist.
 */
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var r = sheet.getRange(1, 1, 1, headers.length);
    r.setValues([headers]);
    r.setFontWeight('bold');
    r.setBackground('#C5A021');
    r.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    var r = sheet.getRange(1, 1, 1, headers.length);
    r.setValues([headers]);
    r.setFontWeight('bold');
    r.setBackground('#C5A021');
    r.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Test helper (run manually in Apps Script IDE) ────────────────────────────
function testUpsert() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        action: 'upsert',
        type: 'order',
        orderNumber: 'TEST0001',
        createdAt: new Date().toISOString(),
        customerName: 'Test Customer',
        customerPhone: '+255700000000',
        total: 150000,
        deliveryAddress: 'Msasani, Dar es Salaam',
        status: 'pending_payment',
        lastUpdated: new Date().toISOString(),
      })
    }
  };
  var result = doPost(fakeEvent);
  Logger.log(result.getContent()); // should say "inserted"

  // Second call — same order, status change → should UPDATE not INSERT
  fakeEvent.postData.contents = JSON.stringify({
    action: 'upsert',
    type: 'order',
    orderNumber: 'TEST0001',
    status: 'preparing',
    lastUpdated: new Date().toISOString(),
  });
  result = doPost(fakeEvent);
  Logger.log(result.getContent()); // should say "updated"
}
