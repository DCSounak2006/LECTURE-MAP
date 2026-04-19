import { state } from './state.js';

export function saveToStorage() {
  try {
    const data = {
      subjects: state.subjects || [],
      teachers: state.teachers || [],
      routines: state.routines || {},
      days: state.days || 5,
      periodsPerDay: state.periodsPerDay || 7
    };
    localStorage.setItem('lectureMapData', JSON.stringify(data));
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Saved!', showConfirmButton: false, timer: 2000 });
  } catch (err) {
    console.error('Save failed:', err);
  }
}

export function loadFromStorage() {
  try {
    const data = localStorage.getItem('lectureMapData');
    if (!data) return false;

    const parsed = JSON.parse(data);
    state.subjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
    state.teachers = Array.isArray(parsed.teachers) ? parsed.teachers : [];
    state.routines = parsed.routines && typeof parsed.routines === 'object' ? parsed.routines : {};
    state.days = Number(parsed.days) || 5;
    state.periodsPerDay = Number(parsed.periodsPerDay) || 7;
    return true;
  } catch (err) {
    console.error('Load failed:', err);
    state.subjects = [];
    state.teachers = [];
    state.routines = {};
    state.days = 5;
    state.periodsPerDay = 7;
    return false;
  }
}

export function saveHistory() {
  if (!Array.isArray(state.history)) state.history = [];
  state.history.push(JSON.stringify({
    subjects: state.subjects,
    teachers: state.teachers,
    routines: state.routines
  }));
  if (state.history.length > 20) state.history.shift();
}

export function undo() {
  if (!state.history || state.history.length === 0) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Nothing to undo', showConfirmButton: false, timer: 2000 });
    return false;
  }
  const prev = JSON.parse(state.history.pop());
  state.subjects = prev.subjects;
  state.teachers = prev.teachers;
  state.routines = prev.routines;
  return true;
}
