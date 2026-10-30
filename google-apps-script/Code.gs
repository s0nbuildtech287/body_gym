/**
 * BodyGym - Google Sheets temporary data store.
 * Bind this script to the BodyGym spreadsheet.
 */

const SHEETS = {
  users: ['id', 'name', 'email', 'password_hash', 'created_at'],
  profiles: ['id', 'user_id', 'full_name', 'gender', 'age', 'height_cm', 'weight_kg', 'goal', 'activity_level', 'updated_at'],
  routines: ['id', 'user_id', 'name', 'description', 'target_focus', 'level', 'estimated_minutes', 'is_preset', 'exercises_json', 'created_at'],
  workout_logs: ['id', 'user_id', 'routine_name', 'started_at', 'completed_at', 'duration_seconds', 'total_volume_kg', 'total_sets', 'total_reps', 'pr_count', 'trained_body_parts', 'notes', 'sets_json', 'logged_at']
};

function setupSheets() {
  Object.keys(SHEETS).forEach(function (name) {
    const sheet = getOrCreateSheet_(name);
    const headers = SHEETS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  });
  seedPresetRoutines_();
  return json_({ success: true, message: 'BodyGym sheets are ready.' });
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = params.action || 'bootstrap';
    const userId = params.userId || '';
    if (action === 'setup') return setupSheets();
    if (action === 'profile') return json_({ success: true, data: findBy_('profiles', 'user_id', userId) });
    if (action === 'routines') return json_({ success: true, data: readRows_('routines').filter(function (row) { return row.is_preset === true || row.user_id === userId; }) });
    if (action === 'workouts') return json_({ success: true, data: readRows_('workout_logs').filter(function (row) { return !userId || row.user_id === userId; }) });
    if (action === 'bootstrap') return json_({ success: true, data: {
      routines: readRows_('routines').filter(function (row) { return row.is_preset === true || row.user_id === userId; }),
      profile: findBy_('profiles', 'user_id', userId),
      workouts: readRows_('workout_logs').filter(function (row) { return !userId || row.user_id === userId; })
    }});
    return json_({ success: false, error: 'Unknown GET action.' });
  } catch (err) { return json_({ success: false, error: String(err.message || err) }); }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action || '';
    if (action === 'setup') return setupSheets();
    if (action === 'register') return register_(body);
    if (action === 'login') return login_(body);
    if (action === 'upsert_profile') return upsertProfile_(body);
    if (action === 'create_routine') return createRoutine_(body);
    if (action === 'delete_routine') return deleteById_('routines', body.id, body.userId);
    if (action === 'log_workout') return logWorkout_(body);
    return json_({ success: false, error: 'Unknown POST action.' });
  } catch (err) { return json_({ success: false, error: String(err.message || err) }); }
}

function register_(body) {
  setupSheets();
  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !body.password) return json_({ success: false, error: 'Email and password are required.' });
  if (findBy_('users', 'email', email)) return json_({ success: false, error: 'Email already exists.' });
  const user = { id: Utilities.getUuid(), name: String(body.name || email.split('@')[0]), email: email, password_hash: hash_(body.password), created_at: new Date().toISOString() };
  appendObject_('users', user);
  return json_({ success: true, data: publicUser_(user) });
}

function login_(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const user = findBy_('users', 'email', email);
  if (!user || user.password_hash !== hash_(body.password || '')) return json_({ success: false, error: 'Invalid email or password.' });
  return json_({ success: true, data: publicUser_(user) });
}

function upsertProfile_(body) {
  setupSheets();
  const existing = findBy_('profiles', 'user_id', body.userId);
  const profile = Object.assign({}, existing || {}, body.profile || {}, { id: existing ? existing.id : Utilities.getUuid(), user_id: body.userId, updated_at: new Date().toISOString() });
  if (existing) updateById_('profiles', existing.id, profile); else appendObject_('profiles', profile);
  return json_({ success: true, data: profile });
}

function createRoutine_(body) {
  setupSheets();
  const routine = Object.assign({}, body.routine || {}, { id: Utilities.getUuid(), user_id: body.userId || '', is_preset: false, created_at: new Date().toISOString() });
  appendObject_('routines', routine);
  return json_({ success: true, data: routine });
}

function logWorkout_(body) {
  setupSheets();
  const workout = Object.assign({}, body.workout || {}, { id: Utilities.getUuid(), user_id: body.userId || '', logged_at: new Date().toISOString() });
  appendObject_('workout_logs', workout);
  return json_({ success: true, data: workout });
}

function deleteById_(sheetName, id, userId) {
  const sheet = getOrCreateSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  for (let i = values.length - 1; i >= 0; i--) {
    const row = objectFromRow_(headers, values[i]);
    if (String(row.id) === String(id) && (!userId || String(row.user_id) === String(userId))) {
      sheet.deleteRow(i + 2);
      return json_({ success: true });
    }
  }
  return json_({ success: false, error: 'Record not found.' });
}

function seedPresetRoutines_() {
  const sheet = getOrCreateSheet_('routines');
  if (sheet.getLastRow() > 1) return;
  [['Push Day Alpha', 'Chest, shoulders and triceps focus.', 'Push', 'Intermediate', 60], ['Pull Day Beast', 'Back and biceps strength session.', 'Pull', 'Intermediate', 60], ['Legs & Core', 'Lower body and core conditioning.', 'Legs', 'Intermediate', 55], ['Full Body HIIT', 'Fast full-body conditioning session.', 'Full Body', 'Beginner', 35], ['Upper Body Power', 'Heavy upper-body compound movements.', 'Upper Body', 'Advanced', 70], ['Arnold Golden Era Split', 'Classic bodybuilding split starter.', 'Bodybuilding', 'Advanced', 75]].forEach(function (item) {
    appendObject_('routines', { id: Utilities.getUuid(), user_id: '', name: item[0], description: item[1], target_focus: item[2], level: item[3], estimated_minutes: item[4], is_preset: true, exercises_json: '[]', created_at: new Date().toISOString() });
  });
}

function getOrCreateSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]);
  return sheet;
}

function readRows_(sheetName) {
  const values = getOrCreateSheet_(sheetName).getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift().map(String);
  return values.filter(function (row) { return row.some(function (cell) { return cell !== ''; }); }).map(function (row) { return objectFromRow_(headers, row); });
}

function findBy_(sheetName, key, value) { return readRows_(sheetName).find(function (row) { return String(row[key] || '').toLowerCase() === String(value || '').toLowerCase(); }) || null; }

function appendObject_(sheetName, object) { const headers = SHEETS[sheetName]; getOrCreateSheet_(sheetName).appendRow(headers.map(function (key) { return serialize_(object[key]); })); }

function updateById_(sheetName, id, object) {
  const sheet = getOrCreateSheet_(sheetName); const values = sheet.getDataRange().getValues(); const headers = values.shift().map(String);
  for (let i = 0; i < values.length; i++) if (String(values[i][headers.indexOf('id')]) === String(id)) { sheet.getRange(i + 2, 1, 1, headers.length).setValues([headers.map(function (key) { return serialize_(object[key]); })]); return; }
}

function objectFromRow_(headers, row) { const object = {}; headers.forEach(function (header, index) { let value = row[index]; if (value === 'true') value = true; if (value === 'false') value = false; object[header] = value; }); return object; }
function serialize_(value) { if (value === undefined || value === null) return ''; return typeof value === 'object' ? JSON.stringify(value) : value; }
function hash_(value) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8).map(function (byte) { return (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0'); }).join(''); }
function publicUser_(user) { return { id: user.id, name: user.name, email: user.email }; }
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
