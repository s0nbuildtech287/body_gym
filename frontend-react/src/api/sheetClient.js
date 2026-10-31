const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyuFmLoeGJKgwjTfTUXevztfeewa-GcdUni7apHKmFdcqpvEy3-GvwO_cF4xQZ2HcVG/exec';

export async function sheetGet(action, userId = '') {
  const url = `${SHEET_URL}?action=${encodeURIComponent(action)}&userId=${encodeURIComponent(userId)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sheet GET ${response.status}`);
  return response.json();
}

export async function sheetPost(payload) {
  const response = await fetch(SHEET_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Sheet POST ${response.status}`);
  return response.json();
}

export function normalizeRoutine(row) {
  return { ...row, id: row.id, isPreset: row.is_preset ?? row.isPreset, estimatedMinutes: Number(row.estimated_minutes ?? row.estimatedMinutes ?? 60), exercisesJson: row.exercises_json ?? row.exercisesJson ?? '[]' };
}

export function normalizeWorkout(row) {
  return { ...row, routineName: row.routine_name ?? row.routineName, totalVolumeKg: Number(row.total_volume_kg ?? row.totalVolumeKg ?? 0), totalSets: Number(row.total_sets ?? row.totalSets ?? 0), totalReps: Number(row.total_reps ?? row.totalReps ?? 0), durationSeconds: Number(row.duration_seconds ?? row.durationSeconds ?? 0), loggedAt: row.logged_at ?? row.loggedAt };
}
