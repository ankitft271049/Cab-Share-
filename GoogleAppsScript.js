/**
 * =====================================================================
 * GLIM CAB SHARE - GOOGLE APPS SCRIPT BACKEND FOR GOOGLE SHEETS
 * =====================================================================
 * Real-time cloud database API for GLIM Cab Share.
 * =====================================================================
 */

const ADMIN_ROLL = 'FT271049';

// Setup sheet structure on first run
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Students Sheet
  let studentsSheet = ss.getSheetByName('Students');
  if (!studentsSheet) {
    studentsSheet = ss.insertSheet('Students');
    studentsSheet.appendRow(['id', 'roll_number', 'full_name', 'phone_number', 'created_at']);
    studentsSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    studentsSheet.setFrozenRows(1);
  }

  // 2. Rides Sheet
  let ridesSheet = ss.getSheetByName('Rides');
  if (!ridesSheet) {
    ridesSheet = ss.insertSheet('Rides');
    ridesSheet.appendRow([
      'id', 'student_id', 'origin', 'destination', 'travel_date', 
      'travel_time', 'travel_timestamp', 'ride_type', 'total_seats', 
      'filled_seats', 'notes', 'status', 'created_at'
    ]);
    ridesSheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    ridesSheet.setFrozenRows(1);
  }

  // 3. OTPs Sheet
  let otpsSheet = ss.getSheetByName('OTPs');
  if (!otpsSheet) {
    otpsSheet = ss.insertSheet('OTPs');
    otpsSheet.appendRow(['id', 'phone_number', 'otp_code', 'expires_at', 'verified', 'created_at']);
    otpsSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    otpsSheet.setFrozenRows(1);
  }

  // 4. Archived_Rides Sheet
  let archiveSheet = ss.getSheetByName('Archived_Rides');
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Archived_Rides');
    archiveSheet.appendRow([
      'id', 'student_id', 'origin', 'destination', 'travel_date', 
      'travel_time', 'travel_timestamp', 'ride_type', 'total_seats', 
      'filled_seats', 'notes', 'status', 'created_at', 'archived_at'
    ]);
    archiveSheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#334155').setFontColor('#ffffff');
    archiveSheet.setFrozenRows(1);
  }

  return { status: 'Sheets initialized successfully' };
}

// Handle GET requests
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || 'stats';
    const nowUnix = Math.floor(new Date().getTime() / 1000);

    if (action === 'stats') {
      const stats = getCampusStats(nowUnix);
      return jsonResponse(stats);
    }

    if (action === 'search') {
      const results = searchRides(params, nowUnix);
      return jsonResponse(results);
    }

    if (action === 'pool') {
      const pool = getPublicPool(params, nowUnix);
      return jsonResponse(pool);
    }

    if (action === 'myRides') {
      const rides = getStudentRides(params.student_id, nowUnix);
      return jsonResponse(rides);
    }

    if (action === 'getStudent') {
      const student = getStudentByRoll(params.roll_number);
      return jsonResponse({ student });
    }

    if (action === 'getRide') {
      const ride = getRideById(params.id);
      return jsonResponse({ ride });
    }

    if (action === 'archivePastRides') {
      const days = Number(params.days) || 3;
      const result = autoArchivePastRides(days);
      return jsonResponse(result);
    }

    if (action === 'setupArchiveTrigger') {
      const result = setupDailyArchiveTrigger();
      return jsonResponse(result);
    }

    return jsonResponse({ error: 'Unknown GET action: ' + action }, 400);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

// Handle POST requests
function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    const action = data.action;
    const nowUnix = Math.floor(new Date().getTime() / 1000);

    if (action === 'sendOtp') {
      const result = handleSendOtp(data);
      return jsonResponse(result);
    }

    if (action === 'verifyOtp') {
      const result = handleVerifyOtp(data);
      return jsonResponse(result);
    }

    if (action === 'login') {
      const result = handleLogin(data);
      return jsonResponse(result);
    }

    if (action === 'createRide') {
      const result = handleCreateRide(data, nowUnix);
      return jsonResponse(result);
    }

    if (action === 'updateSeats') {
      const result = handleUpdateSeats(data);
      return jsonResponse(result);
    }

    if (action === 'updateRide') {
      const result = handleUpdateRide(data, nowUnix);
      return jsonResponse(result);
    }

    if (action === 'updateStatus') {
      const result = handleUpdateStatus(data);
      return jsonResponse(result);
    }

    if (action === 'deleteRide') {
      const result = handleDeleteRide(data);
      return jsonResponse(result);
    }

    if (action === 'archivePastRides') {
      const days = Number(data.days) || 3;
      const result = autoArchivePastRides(days);
      return jsonResponse(result);
    }

    if (action === 'setupArchiveTrigger') {
      const result = setupDailyArchiveTrigger();
      return jsonResponse(result);
    }

    return jsonResponse({ error: 'Unknown POST action: ' + action }, 400);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

// -------------------------------------------------------------
// HELPER FUNCTIONS & SHEET READ/WRITE
// -------------------------------------------------------------

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getRows(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const rowObj = { _rowIndex: i + 1 };
    headers.forEach((h, colIdx) => {
      rowObj[h] = data[i][colIdx];
    });
    rows.push(rowObj);
  }
  return rows;
}

function getStudentsMap() {
  const students = getRows('Students');
  const map = {};
  students.forEach(s => {
    map[s.id] = s;
  });
  return map;
}

function normalizeDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const str = String(d).trim();
  if (str.includes('T')) return str.split('T')[0];
  return str;
}

function normalizeTime(t) {
  if (!t) return '12:00';
  if (t instanceof Date) {
    const h = String(t.getHours()).padStart(2, '0');
    const m = String(t.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  return String(t).trim();
}

function locationMatch(loc1, loc2) {
  const l1 = String(loc1 || '').trim().toLowerCase();
  const l2 = String(loc2 || '').trim().toLowerCase();
  if (l1 === l2) return true;
  if (!l1 || !l2) return false;
  if (l1.includes('glim') && l2.includes('glim')) return true;
  if (l1.includes('airport') && l2.includes('airport')) {
    if (l1.includes('international') && l2.includes('international')) return true;
    if (l1.includes('domestic') && l2.includes('domestic')) return true;
    if (!l1.includes('international') && !l2.includes('international')) return true;
  }
  if (l1.includes('central') && l2.includes('central')) return true;
  if (l1.includes('egmore') && l2.includes('egmore')) return true;
  if (l1.includes('tambaram') && l2.includes('tambaram')) return true;
  if ((l1.includes('cmbt') || l1.includes('kilambakkam')) && (l2.includes('cmbt') || l2.includes('kilambakkam'))) return true;
  return l1.includes(l2) || l2.includes(l1);
}

function calculateTimestamp(dateStr, timeStr) {
  const normDate = normalizeDate(dateStr);
  const normTime = normalizeTime(timeStr);
  if (!normDate) return 0;
  const parts = normDate.split('-').map(Number);
  const tParts = (normTime || '12:00').split(':').map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2], tParts[0] || 12, tParts[1] || 0, 0);
  if (isNaN(dt.getTime())) return Math.floor(new Date().getTime() / 1000);
  return Math.floor(dt.getTime() / 1000);
}

// 1. Stats
function getCampusStats(nowUnix) {
  const rides = getRows('Rides');
  const students = getRows('Students');
  
  let activeRides = 0;
  let matchedRides = 0;
  let totalSeats = 0;

  rides.forEach(r => {
    const status = String(r.status || 'ACTIVE').toUpperCase();
    const rDate = normalizeDate(r.travel_date);
    const rTime = normalizeTime(r.travel_time);
    const rTs = calculateTimestamp(rDate, rTime);

    if (status === 'ACTIVE' && rTs >= (nowUnix - 3600)) {
      activeRides++;
      totalSeats += (Number(r.total_seats) || 3);
    }
    if (status === 'FOUND') {
      matchedRides++;
    }
  });

  return {
    active_rides: activeRides,
    total_students: students.length,
    matched_rides: matchedRides,
    total_seats_shared: totalSeats
  };
}

// 2. Search
function searchRides(params, nowUnix) {
  const origin = params.origin;
  const destination = params.destination;
  const date = normalizeDate(params.travel_date);
  const time = normalizeTime(params.travel_time);
  const rideType = params.ride_type;

  const targetTs = calculateTimestamp(date, time);
  const minTs = targetTs - 3600; // -1 hr
  const maxTs = targetTs + 3600; // +1 hr

  const rides = getRows('Rides');
  const studentsMap = getStudentsMap();

  const exactMatches = [];
  const otherOptions = [];

  rides.forEach(r => {
    const status = String(r.status || 'ACTIVE').toUpperCase();
    if (status !== 'ACTIVE') return;

    const rDate = normalizeDate(r.travel_date);
    const rTime = normalizeTime(r.travel_time);
    const rTs = calculateTimestamp(rDate, rTime);

    if (rTs < (nowUnix - 3600)) return;

    // Origin and destination matching
    if (!locationMatch(r.origin, origin)) return;
    if (!locationMatch(r.destination, destination)) return;

    // Ride type filter
    if (rideType && rideType !== 'ALL' && r.ride_type !== 'ALL' && r.ride_type !== rideType) return;

    const student = studentsMap[r.student_id] || { full_name: 'GLIM Student', roll_number: '', phone_number: '' };
    const fullRide = {
      ...r,
      origin: String(r.origin || 'GLIM Campus (Manamai)'),
      destination: String(r.destination || destination),
      travel_date: rDate,
      travel_time: rTime,
      travel_timestamp: rTs,
      full_name: String(student.full_name || 'GLIM Student'),
      roll_number: String(student.roll_number || ''),
      phone_number: String(student.phone_number || ''),
      total_seats: Number(r.total_seats) || 3,
      filled_seats: Number(r.filled_seats) || 0,
      available_seats: Math.max(0, (Number(r.total_seats) || 3) - (Number(r.filled_seats) || 0))
    };

    if (rDate === date && rTs >= minTs && rTs <= maxTs) {
      exactMatches.push(fullRide);
    } else if (rDate === date) {
      otherOptions.push(fullRide);
    }
  });

  return {
    target: { origin, destination, travel_date: date, travel_time: time, ride_type: rideType },
    exactMatches,
    otherOptions,
    totalExact: exactMatches.length,
    totalOther: otherOptions.length
  };
}

// 3. Pool
function getPublicPool(params, nowUnix) {
  const destination = params.destination;
  const date = params.travel_date ? normalizeDate(params.travel_date) : '';
  const rideType = params.ride_type;

  const rides = getRows('Rides');
  const studentsMap = getStudentsMap();
  const pool = [];

  rides.forEach(r => {
    const status = String(r.status || 'ACTIVE').toUpperCase();
    if (status !== 'ACTIVE') return;

    const rDate = normalizeDate(r.travel_date);
    const rTime = normalizeTime(r.travel_time);
    const rTs = calculateTimestamp(rDate, rTime);

    if (rTs < (nowUnix - 3600)) return;

    if (destination && destination !== 'ALL' && !locationMatch(r.destination, destination)) return;
    if (date && rDate !== date) return;
    if (rideType && rideType !== 'ALL' && r.ride_type !== 'ALL' && r.ride_type !== rideType) return;

    const student = studentsMap[r.student_id] || { full_name: 'GLIM Student', roll_number: '', phone_number: '' };
    pool.push({
      ...r,
      origin: String(r.origin || 'GLIM Campus (Manamai)'),
      destination: String(r.destination || ''),
      travel_date: rDate,
      travel_time: rTime,
      travel_timestamp: rTs,
      full_name: String(student.full_name || 'GLIM Student'),
      roll_number: String(student.roll_number || ''),
      phone_number: String(student.phone_number || ''),
      total_seats: Number(r.total_seats) || 3,
      filled_seats: Number(r.filled_seats) || 0,
      available_seats: Math.max(0, (Number(r.total_seats) || 3) - (Number(r.filled_seats) || 0))
    });
  });

  pool.sort((a, b) => Number(a.travel_timestamp) - Number(b.travel_timestamp));
  return { rides: pool, count: pool.length };
}

// 4. Student Rides
function getStudentRides(studentId, nowUnix) {
  const rides = getRows('Rides');
  const studentsMap = getStudentsMap();
  const student = studentsMap[studentId] || {};

  const activeRides = [];
  const pastRides = [];

  rides.forEach(r => {
    if (String(r.student_id) !== String(studentId)) return;
    const rDate = normalizeDate(r.travel_date);
    const rTime = normalizeTime(r.travel_time);
    const rTs = calculateTimestamp(rDate, rTime);
    const status = String(r.status || 'ACTIVE').toUpperCase();

    const fullRide = {
      ...r,
      origin: String(r.origin || 'GLIM Campus (Manamai)'),
      destination: String(r.destination || ''),
      travel_date: rDate,
      travel_time: rTime,
      travel_timestamp: rTs,
      full_name: String(student.full_name || 'GLIM Student'),
      roll_number: String(student.roll_number || ''),
      phone_number: String(student.phone_number || ''),
      total_seats: Number(r.total_seats) || 3,
      filled_seats: Number(r.filled_seats) || 0,
      available_seats: Math.max(0, (Number(r.total_seats) || 3) - (Number(r.filled_seats) || 0))
    };

    if (status === 'ACTIVE' && rTs >= (nowUnix - 3600)) {
      activeRides.push(fullRide);
    } else {
      pastRides.push(fullRide);
    }
  });

  return { activeRides, pastRides };
}

function getStudentByRoll(rollNumber) {
  const students = getRows('Students');
  return students.find(s => String(s.roll_number).toUpperCase() === String(rollNumber).toUpperCase()) || null;
}

function getRideById(id) {
  const rides = getRows('Rides');
  const targetId = String(id || '').trim();
  const r = rides.find(item => String(item.id).trim() === targetId);
  if (!r) return null;
  const studentsMap = getStudentsMap();
  const student = studentsMap[r.student_id] || {};
  return {
    ...r,
    origin: String(r.origin || 'GLIM Campus (Manamai)'),
    destination: String(r.destination || ''),
    travel_date: normalizeDate(r.travel_date),
    travel_time: normalizeTime(r.travel_time),
    full_name: String(student.full_name || 'GLIM Student'),
    roll_number: String(student.roll_number || ''),
    phone_number: String(student.phone_number || '')
  };
}

// -------------------------------------------------------------
// POST HANDLERS
// -------------------------------------------------------------

function handleLogin(data) {
  const rollNumber = String(data.roll_number || '').trim().toUpperCase();
  const fullName = String(data.full_name || '').trim();
  const phoneNumber = String(data.phone_number || '').trim();

  if (!rollNumber || !fullName || !phoneNumber) {
    return { error: 'Roll number, full name, and phone number are required' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Students');
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName('Students');
  }

  const students = getRows('Students');
  let existing = students.find(s => String(s.roll_number).toUpperCase() === rollNumber);
  const nowStr = new Date().toISOString();

  if (existing) {
    sheet.getRange(existing._rowIndex, 3).setValue(fullName);
    sheet.getRange(existing._rowIndex, 4).setValue(phoneNumber);
    return {
      message: 'Student logged in successfully',
      student: { id: existing.id, roll_number: rollNumber, full_name: fullName, phone_number: phoneNumber, is_admin: rollNumber === ADMIN_ROLL }
    };
  } else {
    const newId = 'std_' + Utilities.getUuid().substring(0, 8);
    sheet.appendRow([newId, rollNumber, fullName, phoneNumber, nowStr]);
    return {
      message: 'Student registered successfully',
      student: { id: newId, roll_number: rollNumber, full_name: fullName, phone_number: phoneNumber, is_admin: rollNumber === ADMIN_ROLL }
    };
  }
}

function handleCreateRide(data, nowUnix) {
  const studentId = String(data.student_id || 'std_guest');
  const origin = String(data.origin || 'GLIM Campus (Manamai)');
  const destination = String(data.destination || '');
  const travelDate = normalizeDate(data.travel_date);
  const travelTime = normalizeTime(data.travel_time);
  const rideType = String(data.ride_type || 'LOOKING_FOR_CAB');
  const totalSeats = Number(data.total_seats || data.seats_count) || 3;
  const filledSeats = Number(data.filled_seats) || 0;
  const notes = String(data.notes || '');

  const travelTimestamp = calculateTimestamp(travelDate, travelTime);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Rides');
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName('Rides');
  }

  const rideId = 'ride_' + Utilities.getUuid().substring(0, 8);
  const nowStr = new Date().toISOString();

  sheet.appendRow([
    rideId, studentId, origin, destination, travelDate,
    travelTime, travelTimestamp, rideType, totalSeats,
    filledSeats, notes, 'ACTIVE', nowStr
  ]);

  return {
    message: 'Ride posted successfully',
    ride_id: rideId,
    ride: {
      id: rideId,
      student_id: studentId,
      origin,
      destination,
      travel_date: travelDate,
      travel_time: travelTime,
      travel_timestamp: travelTimestamp,
      ride_type: rideType,
      total_seats: totalSeats,
      filled_seats: filledSeats,
      notes,
      status: 'ACTIVE'
    }
  };
}

function handleUpdateSeats(data) {
  const rideId = data.ride_id || data.id;
  const delta = data.delta !== undefined ? Number(data.delta) : null;
  const filledSeats = data.filled_seats !== undefined ? Number(data.filled_seats) : null;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Rides');
  const rides = getRows('Rides');
  const ride = rides.find(r => String(r.id) === String(rideId));

  if (!ride) return { error: 'Ride not found' };

  let currentFilled = Number(ride.filled_seats) || 0;
  let totalSeats = Number(ride.total_seats) || 3;
  let newFilled = currentFilled;

  if (delta !== null) {
    newFilled = Math.max(0, Math.min(totalSeats, currentFilled + delta));
  } else if (filledSeats !== null) {
    newFilled = Math.max(0, Math.min(totalSeats, filledSeats));
  }

  sheet.getRange(ride._rowIndex, 10).setValue(newFilled);

  return {
    message: 'Seats updated successfully',
    ride_id: rideId,
    filled_seats: newFilled,
    total_seats: totalSeats,
    available_seats: totalSeats - newFilled
  };
}

function handleUpdateRide(data, nowUnix) {
  const rideId = String(data.id || data.ride_id || '').trim();
  const origin = String(data.origin || 'GLIM Campus (Manamai)');
  const destination = String(data.destination || '');
  const travelDate = normalizeDate(data.travel_date);
  const travelTime = normalizeTime(data.travel_time);
  const rideType = String(data.ride_type || 'LOOKING_FOR_CAB');
  const totalSeats = Number(data.total_seats || data.seats_count) || 3;
  const filledSeats = Number(data.filled_seats) || 0;
  const notes = String(data.notes || '');

  const travelTimestamp = calculateTimestamp(travelDate, travelTime);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Rides');
  if (!sheet) return { error: 'Rides sheet not found' };
  
  const rides = getRows('Rides');
  const ride = rides.find(r => String(r.id).trim() === rideId);

  if (!ride) return { error: 'Ride not found with ID: ' + rideId };

  sheet.getRange(ride._rowIndex, 3).setValue(origin);
  sheet.getRange(ride._rowIndex, 4).setValue(destination);
  sheet.getRange(ride._rowIndex, 5).setValue(travelDate);
  sheet.getRange(ride._rowIndex, 6).setValue(travelTime);
  sheet.getRange(ride._rowIndex, 7).setValue(travelTimestamp);
  sheet.getRange(ride._rowIndex, 8).setValue(rideType);
  sheet.getRange(ride._rowIndex, 9).setValue(totalSeats);
  sheet.getRange(ride._rowIndex, 10).setValue(filledSeats);
  sheet.getRange(ride._rowIndex, 11).setValue(notes);

  return { message: 'Ride updated successfully', ride_id: rideId };
}

function handleUpdateStatus(data) {
  const rideId = String(data.id || data.ride_id || '').trim();
  const status = String(data.status || 'ACTIVE').toUpperCase();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Rides');
  if (!sheet) return { error: 'Rides sheet not found' };
  
  const rides = getRows('Rides');
  const ride = rides.find(r => String(r.id).trim() === rideId);

  if (!ride) return { error: 'Ride not found' };

  sheet.getRange(ride._rowIndex, 12).setValue(status);
  return { message: 'Ride status updated to ' + status };
}

function handleDeleteRide(data) {
  const rideId = String(data.id || data.ride_id || '').trim();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Rides');
  if (!sheet) return { error: 'Rides sheet not found' };
  
  const rides = getRows('Rides');
  const ride = rides.find(r => String(r.id).trim() === rideId);

  if (!ride) return { error: 'Ride not found' };

  sheet.deleteRow(ride._rowIndex);
  return { message: 'Ride deleted successfully' };
}

// -------------------------------------------------------------
// AUTOMATED ARCHIVING & PERFORMANCE OPTIMIZATION
// -------------------------------------------------------------

/**
 * Automated Archiving of past/expired rides.
 * Moves rides older than `daysThreshold` days (or completed/cancelled)
 * from 'Rides' to 'Archived_Rides' to preserve spreadsheet speed and responsiveness.
 */
function autoArchivePastRides(daysThreshold) {
  const days = daysThreshold !== undefined ? Number(daysThreshold) : 3;
  const nowUnix = Math.floor(new Date().getTime() / 1000);
  const cutoffTimestamp = nowUnix - (days * 86400);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ridesSheet = ss.getSheetByName('Rides');
  if (!ridesSheet) return { message: 'Rides sheet not found', archived_count: 0 };

  let archiveSheet = ss.getSheetByName('Archived_Rides');
  if (!archiveSheet) {
    initializeSheets();
    archiveSheet = ss.getSheetByName('Archived_Rides');
  }

  const ridesData = ridesSheet.getDataRange().getValues();
  if (ridesData.length <= 1) {
    return { message: 'No rides to archive. Database is lean and clean!', archived_count: 0 };
  }

  const rowsToArchive = [];
  const rowIndicesToDelete = [];

  // Iterate rows (skip header row 0)
  for (let i = 1; i < ridesData.length; i++) {
    const row = ridesData[i];
    const travelDate = row[4];
    const travelTime = row[5];
    let travelTs = Number(row[6]);
    const status = String(row[11] || 'ACTIVE').toUpperCase();

    if (!travelTs || isNaN(travelTs)) {
      travelTs = calculateTimestamp(travelDate, travelTime);
    }

    // Archive condition:
    // 1. Travel timestamp is older than cutoff (e.g. 3 days past)
    // 2. OR ride is already marked FOUND/CANCELLED/EXPIRED and older than 1 day
    const isPastCutoff = travelTs < cutoffTimestamp;
    const isCompletedPast = (status === 'FOUND' || status === 'CANCELLED' || status === 'EXPIRED') && travelTs < (nowUnix - 86400);

    if (isPastCutoff || isCompletedPast) {
      const nowStr = new Date().toISOString();
      const archiveRow = [...row, nowStr];
      rowsToArchive.push(archiveRow);
      rowIndicesToDelete.push(i + 1); // 1-indexed sheet row
    }
  }

  if (rowsToArchive.length === 0) {
    return { 
      message: 'Active database is already optimized. No rides older than ' + days + ' days.', 
      archived_count: 0,
      active_rides: ridesData.length - 1
    };
  }

  // 1. Append rows to Archived_Rides
  rowsToArchive.forEach(row => {
    archiveSheet.appendRow(row);
  });

  // 2. Delete rows from Rides in reverse order (bottom-up) to preserve row indices
  for (let j = rowIndicesToDelete.length - 1; j >= 0; j--) {
    ridesSheet.deleteRow(rowIndicesToDelete[j]);
  }

  return {
    message: 'Archived ' + rowsToArchive.length + ' past ride(s) successfully',
    archived_count: rowsToArchive.length,
    remaining_active_rides: ridesSheet.getLastRow() - 1
  };
}

/**
 * Creates a daily time-driven trigger to run `autoArchivePastRides`
 * every night at 3:00 AM automatically.
 */
function setupDailyArchiveTrigger() {
  const functionName = 'autoArchivePastRides';
  const triggers = ScriptApp.getProjectTriggers();
  
  // Clear any existing triggers for this function to prevent duplicates
  triggers.forEach(t => {
    if (t.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Create new daily trigger at 3:00 AM
  ScriptApp.newTrigger(functionName)
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  return { message: 'Daily archive trigger scheduled successfully for 3:00 AM daily.' };
}
